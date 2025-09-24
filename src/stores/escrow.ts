import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface EscrowTransaction {
  id: string
  contratoId: string
  clienteId: string
  especialistaId: string
  monto: number
  comisionPlataforma: number
  estado: 'pendiente_deposito' | 'fondos_retenidos' | 'liberado_especialista' | 'reembolsado_cliente' | 'en_disputa'
  fechaDeposito?: Date
  fechaLiberacion?: Date
  codigoQR?: string
  referenciaTransaccion?: string
}

export const useEscrowStore = defineStore('escrow', () => {
  const transactions = ref<EscrowTransaction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pendingTransactions = computed(() => 
    transactions.value.filter(t => t.estado === 'pendiente_deposito')
  )

  const heldFunds = computed(() =>
    transactions.value
      .filter(t => t.estado === 'fondos_retenidos')
      .reduce((sum, t) => sum + t.monto, 0)
  )

  async function createTransaction(data: {
    contratoId: string
    monto: number
    clienteId?: string
    especialistaId?: string
  }): Promise<EscrowTransaction> {
    loading.value = true
    error.value = null

    try {
      const transaction: EscrowTransaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        contratoId: data.contratoId,
        clienteId: data.clienteId || 'current-client',
        especialistaId: data.especialistaId || 'assigned-specialist',
        monto: data.monto,
        comisionPlataforma: data.monto * 0.15, // 15%
        estado: 'pendiente_deposito',
        codigoQR: `qr-${Date.now()}`,
        fechaDeposito: new Date()
      }

      transactions.value.unshift(transaction)
      return transaction
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error creating transaction'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function confirmPayment(transactionId: string): Promise<void> {
    const transaction = transactions.value.find(t => t.id === transactionId)
    if (transaction) {
      transaction.estado = 'fondos_retenidos'
      transaction.fechaDeposito = new Date()
    }
  }

  async function releaseFunds(transactionId: string): Promise<void> {
    const transaction = transactions.value.find(t => t.id === transactionId)
    if (transaction) {
      transaction.estado = 'liberado_especialista'
      transaction.fechaLiberacion = new Date()
    }
  }

  async function refundClient(transactionId: string): Promise<void> {
    const transaction = transactions.value.find(t => t.id === transactionId)
    if (transaction) {
      transaction.estado = 'reembolsado_cliente'
      transaction.fechaLiberacion = new Date()
    }
  }

  return {
    transactions,
    loading,
    error,
    pendingTransactions,
    heldFunds,
    createTransaction,
    confirmPayment,
    releaseFunds,
    refundClient
  }
})