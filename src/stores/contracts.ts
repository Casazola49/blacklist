import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Contrato, Propuesta, TransaccionEscrow } from '../types'
import { ContractsService } from '../services/contracts'
import { ProposalsService } from '../services/proposals'
import { EscrowService } from '../services/escrow'
// import { useAuthStore } from './auth'

export const useContractsStore = defineStore('contracts', () => {
  // State
  const contracts = ref<Contrato[]>([])
  const currentContract = ref<Contrato | null>(null)
  const proposals = ref<Propuesta[]>([])
  const escrowTransactions = ref<TransaccionEscrow[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const activeContracts = computed(() => 
    contracts.value.filter(c => ['abierto', 'esperando_deposito', 'fondos_garantia', 'entrega_realizada'].includes(c.estado))
  )
  
  const completedContracts = computed(() => 
    contracts.value.filter(c => c.estado === 'completado')
  )
  
  const openContracts = computed(() => 
    contracts.value.filter(c => c.estado === 'abierto')
  )
  
  const assignedContracts = computed(() => 
    contracts.value.filter(c => ['esperando_deposito', 'fondos_garantia', 'entrega_realizada'].includes(c.estado))
  )

  const totalEscrowBalance = computed(() => 
    escrowTransactions.value
      .filter(t => t.estado === 'fondos_retenidos')
      .reduce((sum, t) => sum + t.monto, 0)
  )

  // Actions
  const loadClientContracts = async (clienteId: string) => {
    try {
      loading.value = true
      error.value = null
      contracts.value = await ContractsService.getClientContracts(clienteId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar contratos'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createContract = async (contractData: Omit<Contrato, 'id' | 'fechaCreacion' | 'estado' | 'propuestas'>) => {
    try {
      loading.value = true
      error.value = null
      const contractId = await ContractsService.createContract(contractData)
      
      // Reload contracts to get the updated list
      if (contractData.clienteId) {
        await loadClientContracts(contractData.clienteId)
      }
      
      return contractId
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al crear contrato'
      throw err
    } finally {
      loading.value = false
    }
  }

  const loadContractProposals = async (contractId: string) => {
    try {
      loading.value = true
      error.value = null
      proposals.value = await ProposalsService.getProposalsByContract(contractId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar propuestas'
      throw err
    } finally {
      loading.value = false
    }
  }

  const acceptProposal = async (proposalId: string, contractId: string) => {
    try {
      loading.value = true
      error.value = null
      
      const proposal = await ProposalsService.getProposal(proposalId)
      if (!proposal) throw new Error('Propuesta no encontrada')

      // Accept the proposal
      await ProposalsService.acceptProposal(proposalId)
      
      // Assign contract to specialist
      await ContractsService.assignContract(contractId, proposal.especialistaId, proposal.precio)
      
      // Create escrow transaction - TEMPORARILY DISABLED
      // const contract = await ContractsService.getContract(contractId)
      // if (contract) {
      //   await EscrowService.createEscrowTransaction({
      //     contratoId: contractId,
      //     clienteId: contract.clienteId,
      //     especialistaId: proposal.especialistaId,
      //     monto: proposal.precio,
      //     estado: 'pendiente_deposito',
      //     comisionPlataforma: Math.round(proposal.precio * 0.15 * 100) / 100
      //   })
      // }
      
      // Reload data
      await loadContractProposals(contractId)
      if (contract) {
        await loadClientContracts(contract.clienteId)
      }
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al aceptar propuesta'
      throw err
    } finally {
      loading.value = false
    }
  }

  const loadEscrowTransactions = async (clienteId: string) => {
    try {
      loading.value = true
      error.value = null
      // TEMPORARILY DISABLED - Return empty array
      escrowTransactions.value = []
      console.log('Escrow temporarily disabled for demo')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar transacciones escrow'
      throw err
    } finally {
      loading.value = false
    }
  }

  const setCurrentContract = (contract: Contrato | null) => {
    currentContract.value = contract
  }

  const clearError = () => {
    error.value = null
  }

  // Real-time subscriptions
  const subscribeToClientContracts = (clienteId: string) => {
    return ContractsService.subscribeToClientContracts(clienteId, (updatedContracts) => {
      contracts.value = updatedContracts
    })
  }

  const subscribeToContractProposals = (contractId: string) => {
    return ProposalsService.subscribeToContractProposals(contractId, (updatedProposals) => {
      proposals.value = updatedProposals
    })
  }

  return {
    // State
    contracts,
    currentContract,
    proposals,
    escrowTransactions,
    loading,
    error,
    // Getters
    activeContracts,
    completedContracts,
    openContracts,
    assignedContracts,
    totalEscrowBalance,
    // Actions
    loadClientContracts,
    createContract,
    loadContractProposals,
    acceptProposal,
    loadEscrowTransactions,
    setCurrentContract,
    clearError,
    subscribeToClientContracts,
    subscribeToContractProposals
  }
})