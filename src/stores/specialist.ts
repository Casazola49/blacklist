import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Contrato, Propuesta, Especialista } from '../types'
import { ContractsService } from '../services/contracts'
import { ProposalsService } from '../services/proposals'
import { UsersService } from '../services/users'

export const useSpecialistStore = defineStore('specialist', () => {
  // State
  const assignedContracts = ref<Contrato[]>([])
  const availableContracts = ref<Contrato[]>([])
  const myProposals = ref<Propuesta[]>([])
  const earnings = ref({
    thisMonth: 0,
    total: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const activeContracts = computed(() => 
    assignedContracts.value.filter(c => 
      ['esperando_deposito', 'fondos_garantia', 'entrega_realizada'].includes(c.estado)
    )
  )
  
  const completedContracts = computed(() => 
    assignedContracts.value.filter(c => c.estado === 'completado')
  )

  const pendingProposals = computed(() => 
    myProposals.value.filter(p => p.estado === 'pendiente')
  )

  const acceptedProposals = computed(() => 
    myProposals.value.filter(p => p.estado === 'aceptada')
  )

  // Actions
  const loadSpecialistData = async (especialistaId: string) => {
    try {
      loading.value = true
      error.value = null
      
      // Load assigned contracts
      assignedContracts.value = await ContractsService.getSpecialistContracts(especialistaId)
      
      // Load specialist's proposals
      myProposals.value = await ProposalsService.getProposalsBySpecialist(especialistaId)
      
      // Load specialist profile to get skills for filtering opportunities
      const profile = await UsersService.getUserProfile(especialistaId) as Especialista
      if (profile && profile.habilidades) {
        availableContracts.value = await ContractsService.getOpenContracts(profile.habilidades)
      } else {
        availableContracts.value = await ContractsService.getOpenContracts()
      }
      
      // Calculate earnings
      await calculateEarnings()
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar datos del especialista'
      throw err
    } finally {
      loading.value = false
    }
  }

  const calculateEarnings = async () => {
    try {
      const completedContracts = assignedContracts.value.filter(c => c.estado === 'completado')
      
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      
      let thisMonthEarnings = 0
      let totalEarnings = 0
      
      completedContracts.forEach(contract => {
        const contractMonth = contract.fechaCompletado?.getMonth()
        const contractYear = contract.fechaCompletado?.getFullYear()
        const amount = contract.precioFinal || 0
        
        totalEarnings += amount
        
        if (contractMonth === currentMonth && contractYear === currentYear) {
          thisMonthEarnings += amount
        }
      })
      
      earnings.value = {
        thisMonth: thisMonthEarnings,
        total: totalEarnings
      }
    } catch (err) {
      console.error('Error calculating earnings:', err)
    }
  }

  const submitProposal = async (contractId: string, precio: number, mensaje: string, especialistaId: string) => {
    try {
      loading.value = true
      error.value = null
      
      // Check if already proposed
      const hasProposed = await ProposalsService.hasSpecialistProposed(especialistaId, contractId)
      if (hasProposed) {
        throw new Error('Ya has enviado una propuesta para este contrato')
      }
      
      // Create proposal
      const proposalId = await ProposalsService.createProposal({
        especialistaId,
        contratoId: contractId,
        precio,
        mensaje
      })
      
      // Reload data
      await loadSpecialistData(especialistaId)
      
      return proposalId
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al enviar propuesta'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deliverWork = async (contractId: string, _deliveryMessage: string) => {
    try {
      loading.value = true
      error.value = null
      
      // Update contract status to delivered
      await ContractsService.updateContract(contractId, {
        estado: 'entrega_realizada'
      })
      
      // TODO: Add delivery message to chat or create delivery record
      
      // Reload assigned contracts
      const contract = assignedContracts.value.find(c => c.id === contractId)
      if (contract && contract.especialistaId) {
        await loadSpecialistData(contract.especialistaId)
      }
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al entregar trabajo'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getContractProposal = (contractId: string) => {
    return myProposals.value.find(p => p.contratoId === contractId)
  }

  const hasProposedToContract = (contractId: string) => {
    return myProposals.value.some(p => p.contratoId === contractId)
  }

  const clearError = () => {
    error.value = null
  }

  // Real-time subscriptions
  const subscribeToOpenContracts = () => {
    return ContractsService.subscribeToOpenContracts((contracts) => {
      availableContracts.value = contracts
    })
  }

  return {
    // State
    assignedContracts,
    availableContracts,
    myProposals,
    earnings,
    loading,
    error,
    // Getters
    activeContracts,
    completedContracts,
    pendingProposals,
    acceptedProposals,
    // Actions
    loadSpecialistData,
    submitProposal,
    deliverWork,
    getContractProposal,
    hasProposedToContract,
    clearError,
    subscribeToOpenContracts
  }
})