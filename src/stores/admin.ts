import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Usuario, Cliente, Especialista, Contrato, TransaccionEscrow } from '../types'
import { UsersService } from '../services/users'
import { ContractsService } from '../services/contracts'
import { EscrowService } from '../services/escrow'
import { AdminService } from '../services/admin'

export const useAdminStore = defineStore('admin', () => {
  // State
  const users = ref<(Usuario | Cliente | Especialista)[]>([])
  const contracts = ref<Contrato[]>([])
  const escrowTransactions = ref<TransaccionEscrow[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const clients = computed(() => 
    users.value.filter(user => user.tipo === 'cliente') as Cliente[]
  )

  const specialists = computed(() => 
    users.value.filter(user => user.tipo === 'especialista') as Especialista[]
  )

  const pendingSpecialists = computed(() => 
    specialists.value.filter(specialist => specialist.estado === 'pendiente')
  )

  const activeSpecialists = computed(() => 
    specialists.value.filter(specialist => specialist.estado === 'activo')
  )

  const suspendedUsers = computed(() => 
    users.value.filter(user => user.estado === 'suspendido')
  )

  const disputedContracts = computed(() => 
    contracts.value.filter(contract => contract.estado === 'disputado')
  )

  const activeContracts = computed(() => 
    contracts.value.filter(contract => 
      ['abierto', 'esperando_deposito', 'fondos_garantia', 'entrega_realizada'].includes(contract.estado)
    )
  )

  const completedContracts = computed(() => 
    contracts.value.filter(contract => contract.estado === 'completado')
  )

  const stats = computed(() => {
    const totalEscrowFunds = escrowTransactions.value
      .filter(tx => tx.estado === 'fondos_retenidos')
      .reduce((sum, tx) => sum + tx.monto, 0)

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const monthlyCommissions = escrowTransactions.value
      .filter(tx => {
        const txDate = tx.fechaLiberacion || tx.fechaDeposito
        return txDate && 
               txDate.getMonth() === currentMonth && 
               txDate.getFullYear() === currentYear &&
               tx.estado === 'liberado_especialista'
      })
      .reduce((sum, tx) => sum + tx.comisionPlataforma, 0)

    return {
      totalUsers: users.value.length,
      totalClients: clients.value.length,
      totalSpecialists: specialists.value.length,
      pendingApprovals: pendingSpecialists.value.length,
      activeContracts: activeContracts.value.length,
      completedContracts: completedContracts.value.length,
      disputedContracts: disputedContracts.value.length,
      escrowFunds: totalEscrowFunds,
      monthlyCommissions,
      suspendedUsers: suspendedUsers.value.length
    }
  })

  // Actions
  const loadDashboardData = async () => {
    loading.value = true
    error.value = null
    
    try {
      await Promise.all([
        loadUsers(),
        loadContracts(),
        loadEscrowTransactions()
      ])
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error loading dashboard data'
      throw err
    } finally {
      loading.value = false
    }
  }

  const loadUsers = async () => {
    try {
      const [clientsData, specialistsData] = await Promise.all([
        UsersService.getAllClients(),
        UsersService.getAllSpecialists()
      ])
      users.value = [...clientsData, ...specialistsData]
    } catch (err) {
      console.error('Error loading users:', err)
      throw err
    }
  }

  const loadContracts = async () => {
    try {
      contracts.value = await ContractsService.getAllContracts()
    } catch (err) {
      console.error('Error loading contracts:', err)
      throw err
    }
  }

  const loadEscrowTransactions = async () => {
    try {
      // TEMPORARILY DISABLED - Return empty array
      escrowTransactions.value = []
      console.log('Escrow temporarily disabled for demo')
    } catch (err) {
      console.error('Error loading escrow transactions:', err)
      throw err
    }
  }

  const approveSpecialist = async (uid: string) => {
    try {
      await UsersService.approveSpecialist(uid)
      await loadUsers() // Refresh users data
    } catch (err) {
      console.error('Error approving specialist:', err)
      throw err
    }
  }

  const rejectSpecialist = async (uid: string) => {
    try {
      await UsersService.rejectSpecialist(uid)
      await loadUsers() // Refresh users data
    } catch (err) {
      console.error('Error rejecting specialist:', err)
      throw err
    }
  }

  const suspendUser = async (uid: string) => {
    try {
      await UsersService.suspendUser(uid)
      await loadUsers() // Refresh users data
    } catch (err) {
      console.error('Error suspending user:', err)
      throw err
    }
  }

  const reactivateUser = async (uid: string) => {
    try {
      await UsersService.reactivateUser(uid)
      await loadUsers() // Refresh users data
    } catch (err) {
      console.error('Error reactivating user:', err)
      throw err
    }
  }

  const resolveDispute = async (contractId: string, resolution: 'client' | 'specialist') => {
    try {
      await AdminService.resolveDispute(contractId, resolution)
      await loadContracts() // Refresh contracts data
      await loadEscrowTransactions() // Refresh escrow data
    } catch (err) {
      console.error('Error resolving dispute:', err)
      throw err
    }
  }

  const cancelContract = async (contractId: string) => {
    try {
      await ContractsService.cancelContract(contractId)
      await loadContracts() // Refresh contracts data
    } catch (err) {
      console.error('Error canceling contract:', err)
      throw err
    }
  }

  const getContractDetails = async (contractId: string) => {
    try {
      return await ContractsService.getContract(contractId)
    } catch (err) {
      console.error('Error getting contract details:', err)
      throw err
    }
  }

  const getUserDetails = async (uid: string) => {
    try {
      return await UsersService.getUserProfile(uid)
    } catch (err) {
      console.error('Error getting user details:', err)
      throw err
    }
  }

  const getFinancialMetrics = async (startDate: Date, endDate: Date) => {
    try {
      return await AdminService.getFinancialMetrics(startDate, endDate)
    } catch (err) {
      console.error('Error getting financial metrics:', err)
      throw err
    }
  }

  const exportData = async (type: 'users' | 'contracts' | 'transactions', format: 'csv' | 'json') => {
    try {
      return await AdminService.exportData(type, format)
    } catch (err) {
      console.error('Error exporting data:', err)
      throw err
    }
  }

  return {
    // State
    users,
    contracts,
    escrowTransactions,
    loading,
    error,
    
    // Computed
    clients,
    specialists,
    pendingSpecialists,
    activeSpecialists,
    suspendedUsers,
    disputedContracts,
    activeContracts,
    completedContracts,
    stats,
    
    // Actions
    loadDashboardData,
    loadUsers,
    loadContracts,
    loadEscrowTransactions,
    approveSpecialist,
    rejectSpecialist,
    suspendUser,
    reactivateUser,
    resolveDispute,
    cancelContract,
    getContractDetails,
    getUserDetails,
    getFinancialMetrics,
    exportData
  }
})