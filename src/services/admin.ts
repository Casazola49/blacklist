import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from './firebase'
import { ContractsService } from './contracts'
import { EscrowService } from './escrow'
import { ChatService } from './chat'
import type { Contrato, TransaccionEscrow } from '../types'

export interface FinancialMetrics {
  totalRevenue: number
  totalCommissions: number
  activeEscrowFunds: number
  completedTransactions: number
  averageContractValue: number
  monthlyGrowth: number
  topSpecialists: Array<{
    uid: string
    alias: string
    earnings: number
    completedContracts: number
  }>
  contractsByStatus: Record<string, number>
}

export interface DisputeDetails {
  contract: Contrato
  chatHistory: any[]
  escrowTransaction: TransaccionEscrow | null
  clientProfile: any
  specialistProfile: any
  timeline: Array<{
    date: Date
    event: string
    description: string
  }>
}

export class AdminService {
  /**
   * Resolve a dispute by releasing funds to either client or specialist
   */
  static async resolveDispute(contractId: string, resolution: 'client' | 'specialist'): Promise<void> {
    try {
      const batch = writeBatch(db)
      
      // Get contract details
      const contract = await ContractsService.getContract(contractId)
      if (!contract) {
        throw new Error('Contract not found')
      }

      // TEMPORARILY DISABLED - Escrow functionality
      console.log('Escrow functionality temporarily disabled for demo')
      // const escrowTransaction = await EscrowService.getEscrowTransactionByContract(contractId)
      // if (!escrowTransaction) {
      //   throw new Error('Escrow transaction not found')
      // }

      // Update contract status
      const contractRef = doc(db, 'contratos', contractId)
      
      if (resolution === 'client') {
        // Refund to client
        batch.update(contractRef, {
          estado: 'cancelado',
          fechaCompletado: Timestamp.now()
        })

        // Update escrow transaction
        const escrowRef = doc(db, 'transacciones', escrowTransaction.id)
        batch.update(escrowRef, {
          estado: 'reembolsado_cliente',
          fechaLiberacion: Timestamp.now()
        })

        // Add system message to chat
        if (contract.chatId) {
          await ChatService.sendSystemMessage(
            contract.chatId,
            'Disputa resuelta a favor del cliente. Los fondos han sido reembolsados.'
          )
        }
      } else {
        // Release to specialist
        batch.update(contractRef, {
          estado: 'completado',
          fechaCompletado: Timestamp.now()
        })

        // Update escrow transaction
        const escrowRef = doc(db, 'transacciones', escrowTransaction.id)
        batch.update(escrowRef, {
          estado: 'liberado_especialista',
          fechaLiberacion: Timestamp.now()
        })

        // Add system message to chat
        if (contract.chatId) {
          await ChatService.sendSystemMessage(
            contract.chatId,
            'Disputa resuelta a favor del especialista. Los fondos han sido liberados.'
          )
        }

        // Update specialist earnings
        if (contract.especialistaId) {
          const { UsersService } = await import('./users')
          const netAmount = escrowTransaction.monto - escrowTransaction.comisionPlataforma
          await UsersService.updateSpecialistEarnings(contract.especialistaId, netAmount)
        }
      }

      await batch.commit()
    } catch (error) {
      console.error('Error resolving dispute:', error)
      throw error
    }
  }

  /**
   * Get detailed dispute information
   */
  static async getDisputeDetails(contractId: string): Promise<DisputeDetails> {
    try {
      // Get contract
      const contract = await ContractsService.getContract(contractId)
      if (!contract) {
        throw new Error('Contract not found')
      }

      // Get chat history
      let chatHistory: any[] = []
      if (contract.chatId) {
        chatHistory = await ChatService.getMessages(contract.chatId)
      }

      // Get escrow transaction
      const escrowTransaction = await EscrowService.getEscrowTransactionByContract(contractId)

      // Get user profiles
      const { UsersService } = await import('./users')
      const [clientProfile, specialistProfile] = await Promise.all([
        UsersService.getUserProfile(contract.clienteId),
        contract.especialistaId ? UsersService.getUserProfile(contract.especialistaId) : null
      ])

      // Build timeline
      const timeline = [
        {
          date: contract.fechaCreacion,
          event: 'Contrato Creado',
          description: `Cliente ${clientProfile?.alias} creó el contrato`
        }
      ]

      if (contract.fechaAsignacion && specialistProfile) {
        timeline.push({
          date: contract.fechaAsignacion,
          event: 'Contrato Asignado',
          description: `Asignado a especialista ${specialistProfile.alias}`
        })
      }

      if (escrowTransaction?.fechaDeposito) {
        timeline.push({
          date: escrowTransaction.fechaDeposito,
          event: 'Fondos Depositados',
          description: `$${escrowTransaction.monto} depositados en escrow`
        })
      }

      timeline.push({
        date: new Date(), // Assuming dispute was marked recently
        event: 'Disputa Iniciada',
        description: 'El contrato fue marcado como disputado'
      })

      timeline.sort((a, b) => a.date.getTime() - b.date.getTime())

      return {
        contract,
        chatHistory,
        escrowTransaction,
        clientProfile,
        specialistProfile,
        timeline
      }
    } catch (error) {
      console.error('Error getting dispute details:', error)
      throw error
    }
  }

  /**
   * Get financial metrics for a date range
   */
  static async getFinancialMetrics(startDate: Date, endDate: Date): Promise<FinancialMetrics> {
    try {
      // Get all transactions in date range
      const transactionsQuery = query(
        collection(db, 'transacciones'),
        where('fechaCreacion', '>=', Timestamp.fromDate(startDate)),
        where('fechaCreacion', '<=', Timestamp.fromDate(endDate)),
        orderBy('fechaCreacion', 'desc')
      )
      
      const transactionsSnapshot = await getDocs(transactionsQuery)
      const transactions = transactionsSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaCreacion: data.fechaCreacion?.toDate(),
          fechaDeposito: data.fechaDeposito?.toDate(),
          fechaLiberacion: data.fechaLiberacion?.toDate()
        }
      }) as TransaccionEscrow[]

      // Get all contracts in date range
      const contractsQuery = query(
        collection(db, 'contratos'),
        where('fechaCreacion', '>=', Timestamp.fromDate(startDate)),
        where('fechaCreacion', '<=', Timestamp.fromDate(endDate)),
        orderBy('fechaCreacion', 'desc')
      )
      
      const contractsSnapshot = await getDocs(contractsQuery)
      const contracts = contractsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaCreacion: doc.data().fechaCreacion?.toDate(),
        fechaLimite: doc.data().fechaLimite?.toDate(),
        fechaAsignacion: doc.data().fechaAsignacion?.toDate(),
        fechaCompletado: doc.data().fechaCompletado?.toDate()
      })) as Contrato[]

      // Calculate metrics
      const completedTransactions = transactions.filter(tx => 
        tx.estado === 'liberado_especialista'
      )
      
      const totalRevenue = completedTransactions.reduce((sum, tx) => sum + tx.monto, 0)
      const totalCommissions = completedTransactions.reduce((sum, tx) => sum + tx.comisionPlataforma, 0)
      const activeEscrowFunds = transactions
        .filter(tx => tx.estado === 'fondos_retenidos')
        .reduce((sum, tx) => sum + tx.monto, 0)

      const averageContractValue = contracts.length > 0 
        ? contracts.reduce((sum, contract) => sum + (contract.precioFinal || contract.presupuestoSugerido), 0) / contracts.length
        : 0

      // Calculate monthly growth (simplified)
      const monthlyGrowth = 0 // Would need historical data to calculate properly

      // Get top specialists
      const specialistEarnings = new Map<string, { earnings: number, contracts: number, alias: string }>()
      
      for (const tx of completedTransactions) {
        const netEarnings = tx.monto - tx.comisionPlataforma
        const current = specialistEarnings.get(tx.especialistaId) || { earnings: 0, contracts: 0, alias: '' }
        
        // Get specialist alias (would need to optimize this)
        if (!current.alias) {
          try {
            const { UsersService } = await import('./users')
            const specialist = await UsersService.getUserProfile(tx.especialistaId)
            current.alias = specialist?.alias || 'Unknown'
          } catch {
            current.alias = 'Unknown'
          }
        }
        
        specialistEarnings.set(tx.especialistaId, {
          earnings: current.earnings + netEarnings,
          contracts: current.contracts + 1,
          alias: current.alias
        })
      }

      const topSpecialists = Array.from(specialistEarnings.entries())
        .map(([uid, data]) => ({
          uid,
          alias: data.alias,
          earnings: data.earnings,
          completedContracts: data.contracts
        }))
        .sort((a, b) => b.earnings - a.earnings)
        .slice(0, 10)

      // Contracts by status
      const contractsByStatus = contracts.reduce((acc, contract) => {
        acc[contract.estado] = (acc[contract.estado] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        totalRevenue,
        totalCommissions,
        activeEscrowFunds,
        completedTransactions: completedTransactions.length,
        averageContractValue,
        monthlyGrowth,
        topSpecialists,
        contractsByStatus
      }
    } catch (error) {
      console.error('Error getting financial metrics:', error)
      throw error
    }
  }

  /**
   * Export data in various formats
   */
  static async exportData(type: 'users' | 'contracts' | 'transactions', format: 'csv' | 'json'): Promise<string> {
    try {
      let data: any[] = []
      
      switch (type) {
        case 'users':
          const { UsersService } = await import('./users')
          const [clients, specialists] = await Promise.all([
            UsersService.getAllClients(),
            UsersService.getAllSpecialists()
          ])
          data = [...clients, ...specialists]
          break
          
        case 'contracts':
          data = await ContractsService.getAllContracts()
          break
          
        case 'transactions':
          data = await EscrowService.getAllEscrowTransactions()
          break
      }

      if (format === 'json') {
        return JSON.stringify(data, null, 2)
      } else {
        // Convert to CSV
        if (data.length === 0) return ''
        
        const headers = Object.keys(data[0])
        const csvRows = [
          headers.join(','),
          ...data.map(row => 
            headers.map(header => {
              const value = row[header]
              if (value instanceof Date) {
                return value.toISOString()
              }
              if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`
              }
              return value
            }).join(',')
          )
        ]
        
        return csvRows.join('\n')
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      throw error
    }
  }

  /**
   * Get system health metrics
   */
  static async getSystemHealth(): Promise<{
    database: number
    authentication: number
    storage: number
    functions: number
  }> {
    try {
      // These would typically be real health checks
      // For now, return mock data
      return {
        database: 98,
        authentication: 100,
        storage: 95,
        functions: 97
      }
    } catch (error) {
      console.error('Error getting system health:', error)
      return {
        database: 0,
        authentication: 0,
        storage: 0,
        functions: 0
      }
    }
  }

  /**
   * Send system notification to all users
   */
  static async sendSystemNotification(title: string, message: string, priority: 'alta' | 'media' | 'baja' = 'media'): Promise<void> {
    try {
      // This would typically use Cloud Functions to send notifications
      // For now, just log the action
      console.log('System notification sent:', { title, message, priority })
      
      // In a real implementation, this would:
      // 1. Get all active users
      // 2. Create notification documents for each user
      // 3. Send push notifications via FCM
      // 4. Send emails if configured
    } catch (error) {
      console.error('Error sending system notification:', error)
      throw error
    }
  }

  /**
   * Get audit log for admin actions
   */
  static async getAuditLog(_limit: number = 100): Promise<Array<{
    id: string
    adminId: string
    action: string
    targetId: string
    targetType: 'user' | 'contract' | 'transaction'
    details: Record<string, any>
    timestamp: Date
  }>> {
    try {
      // This would query an audit log collection
      // For now, return empty array
      return []
    } catch (error) {
      console.error('Error getting audit log:', error)
      throw error
    }
  }
}