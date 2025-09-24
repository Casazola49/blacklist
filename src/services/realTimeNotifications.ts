import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit,
  Unsubscribe 
} from 'firebase/firestore'
import { db } from './firebase'
import { NotificationsService } from './notifications'
import { EmailNotificationsService } from './emailNotifications'
import { AuthService } from './auth'
import type { 
  Contrato, 
  Propuesta, 
  TransaccionEscrow, 
  Mensaje,
  NotificacionTipo 
} from '../types'

export class RealTimeNotificationsService {
  private static listeners: Map<string, Unsubscribe> = new Map()

  /**
   * Start listening for real-time notifications for a user
   */
  static startListening(userId: string): void {
    this.stopListening(userId) // Clean up existing listeners

    // Listen for new contracts (for specialists)
    this.listenForNewContracts(userId)

    // Listen for new proposals (for clients)
    this.listenForNewProposals(userId)

    // Listen for contract state changes
    this.listenForContractChanges(userId)

    // Listen for escrow changes
    this.listenForEscrowChanges(userId)

    // Listen for new messages
    this.listenForNewMessages(userId)
  }

  /**
   * Stop listening for real-time notifications for a user
   */
  static stopListening(userId: string): void {
    const userListeners = Array.from(this.listeners.entries())
      .filter(([key]) => key.startsWith(userId))

    userListeners.forEach(([key, unsubscribe]) => {
      unsubscribe()
      this.listeners.delete(key)
    })
  }

  /**
   * Listen for new contracts that match specialist skills
   */
  private static async listenForNewContracts(userId: string): Promise<void> {
    try {
      const userProfile = await AuthService.getUserProfile(userId)
      if (!userProfile || userProfile.tipo !== 'especialista') return

      const especialista = userProfile as any
      if (!especialista.habilidades || especialista.habilidades.length === 0) return

      const contractsRef = collection(db, 'contratos')
      const q = query(
        contractsRef,
        where('estado', '==', 'abierto'),
        orderBy('fechaCreacion', 'desc'),
        limit(10)
      )

      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const contrato = { id: change.doc.id, ...change.doc.data() } as Contrato
            
            // Check if contract matches specialist skills
            const matchesSkills = this.contractMatchesSkills(contrato, especialista.habilidades)
            if (matchesSkills && contrato.clienteId !== userId) {
              await this.sendNewContractNotification(userId, contrato)
            }
          }
        })
      })

      this.listeners.set(`${userId}_contracts`, unsubscribe)
    } catch (error) {
      console.error('Error setting up new contracts listener:', error)
    }
  }

  /**
   * Listen for new proposals on user's contracts
   */
  private static async listenForNewProposals(userId: string): Promise<void> {
    try {
      const userProfile = await AuthService.getUserProfile(userId)
      if (!userProfile || userProfile.tipo !== 'cliente') return

      const proposalsRef = collection(db, 'propuestas')
      const q = query(
        proposalsRef,
        orderBy('fechaEnvio', 'desc'),
        limit(20)
      )

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const propuesta = { id: change.doc.id, ...change.doc.data() } as Propuesta
            
            // Check if proposal is for user's contract
            const contractsRef = collection(db, 'contratos')
            const contractQuery = query(
              contractsRef,
              where('clienteId', '==', userId),
              where('id', '==', propuesta.contratoId)
            )

            // This would need to be implemented with proper querying
            // For now, we'll assume the proposal is relevant
            await this.sendNewProposalNotification(userId, propuesta)
          }
        })
      })

      this.listeners.set(`${userId}_proposals`, unsubscribe)
    } catch (error) {
      console.error('Error setting up new proposals listener:', error)
    }
  }

  /**
   * Listen for contract state changes
   */
  private static listenForContractChanges(userId: string): void {
    try {
      const contractsRef = collection(db, 'contratos')
      const q = query(
        contractsRef,
        where('participantes', 'array-contains', userId),
        orderBy('fechaCreacion', 'desc')
      )

      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'modified') {
            const contrato = { id: change.doc.id, ...change.doc.data() } as Contrato
            await this.handleContractStateChange(userId, contrato)
          }
        })
      })

      this.listeners.set(`${userId}_contract_changes`, unsubscribe)
    } catch (error) {
      console.error('Error setting up contract changes listener:', error)
    }
  }

  /**
   * Listen for escrow changes
   */
  private static listenForEscrowChanges(userId: string): void {
    try {
      const escrowRef = collection(db, 'transacciones')
      const q = query(
        escrowRef,
        where('participantes', 'array-contains', userId),
        orderBy('fechaCreacion', 'desc')
      )

      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'modified') {
            const transaccion = { id: change.doc.id, ...change.doc.data() } as TransaccionEscrow
            await this.handleEscrowStateChange(userId, transaccion)
          }
        })
      })

      this.listeners.set(`${userId}_escrow_changes`, unsubscribe)
    } catch (error) {
      console.error('Error setting up escrow changes listener:', error)
    }
  }

  /**
   * Listen for new messages in user's chats
   */
  private static listenForNewMessages(userId: string): void {
    try {
      const messagesRef = collection(db, 'mensajes')
      const q = query(
        messagesRef,
        where('autorId', '!=', userId), // Don't notify for own messages
        orderBy('fechaEnvio', 'desc'),
        limit(50)
      )

      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const mensaje = { id: change.doc.id, ...change.doc.data() } as Mensaje
            
            // Check if message is in user's chat
            // This would need proper chat membership checking
            await this.sendNewMessageNotification(userId, mensaje)
          }
        })
      })

      this.listeners.set(`${userId}_messages`, unsubscribe)
    } catch (error) {
      console.error('Error setting up new messages listener:', error)
    }
  }

  /**
   * Check if contract matches specialist skills
   */
  private static contractMatchesSkills(contrato: Contrato, habilidades: string[]): boolean {
    const contractText = `${contrato.titulo} ${contrato.descripcion}`.toLowerCase()
    return habilidades.some(habilidad => 
      contractText.includes(habilidad.toLowerCase())
    )
  }

  /**
   * Send new contract notification
   */
  private static async sendNewContractNotification(
    userId: string, 
    contrato: Contrato
  ): Promise<void> {
    try {
      const titulo = '🎯 Nueva Oportunidad Disponible'
      const mensaje = `Nuevo contrato: "${contrato.titulo}" - Presupuesto: $${contrato.presupuestoSugerido}`

      await NotificationsService.sendCriticalEventNotification(
        userId,
        'nuevo_contrato',
        titulo,
        mensaje,
        { contratoId: contrato.id }
      )

      // Send email if user preferences allow
      const userProfile = await AuthService.getUserProfile(userId)
      if (userProfile) {
        await EmailNotificationsService.sendContractNotificationEmail(
          userProfile.email,
          'nuevo_contrato',
          {
            titulo: contrato.titulo,
            descripcion: contrato.descripcion,
            precio: contrato.presupuestoSugerido,
            fechaLimite: contrato.fechaLimite
          }
        )
      }
    } catch (error) {
      console.error('Error sending new contract notification:', error)
    }
  }

  /**
   * Send new proposal notification
   */
  private static async sendNewProposalNotification(
    userId: string, 
    propuesta: Propuesta
  ): Promise<void> {
    try {
      const titulo = '📋 Nueva Propuesta Recibida'
      const mensaje = `Recibiste una propuesta de $${propuesta.precio} para tu contrato`

      await NotificationsService.sendCriticalEventNotification(
        userId,
        'propuesta_recibida',
        titulo,
        mensaje,
        { propuestaId: propuesta.id, contratoId: propuesta.contratoId }
      )
    } catch (error) {
      console.error('Error sending new proposal notification:', error)
    }
  }

  /**
   * Handle contract state changes
   */
  private static async handleContractStateChange(
    userId: string, 
    contrato: Contrato
  ): Promise<void> {
    try {
      let titulo = ''
      let mensaje = ''
      let tipo: NotificacionTipo = 'sistema'

      switch (contrato.estado) {
        case 'esperando_deposito':
          if (contrato.clienteId === userId) {
            titulo = '💳 Depósito Requerido'
            mensaje = `Tu propuesta fue aceptada. Realiza el depósito para "${contrato.titulo}"`
            tipo = 'contrato_asignado'
          }
          break

        case 'fondos_garantia':
          if (contrato.especialistaId === userId) {
            titulo = '✅ Contrato Asignado'
            mensaje = `Puedes comenzar a trabajar en "${contrato.titulo}"`
            tipo = 'contrato_asignado'
          }
          break

        case 'entrega_realizada':
          if (contrato.clienteId === userId) {
            titulo = '📤 Trabajo Entregado'
            mensaje = `El especialista entregó el trabajo para "${contrato.titulo}"`
            tipo = 'trabajo_entregado'
          }
          break

        case 'completado':
          if (contrato.especialistaId === userId) {
            titulo = '💰 Pago Liberado'
            mensaje = `El cliente aprobó tu trabajo para "${contrato.titulo}"`
            tipo = 'pago_recibido'
          }
          break
      }

      if (titulo && mensaje) {
        await NotificationsService.sendCriticalEventNotification(
          userId,
          tipo,
          titulo,
          mensaje,
          { contratoId: contrato.id }
        )
      }
    } catch (error) {
      console.error('Error handling contract state change:', error)
    }
  }

  /**
   * Handle escrow state changes
   */
  private static async handleEscrowStateChange(
    userId: string, 
    transaccion: TransaccionEscrow
  ): Promise<void> {
    try {
      let titulo = ''
      let mensaje = ''

      switch (transaccion.estado) {
        case 'fondos_retenidos':
          if (transaccion.especialistaId === userId) {
            titulo = '🔒 Fondos en Garantía'
            mensaje = `Los fondos están seguros. Puedes comenzar el trabajo.`
          }
          break

        case 'liberado_especialista':
          if (transaccion.especialistaId === userId) {
            titulo = '💰 Pago Recibido'
            mensaje = `Recibiste $${transaccion.monto - transaccion.comisionPlataforma} por tu trabajo`
          }
          break

        case 'reembolsado_cliente':
          if (transaccion.clienteId === userId) {
            titulo = '↩️ Reembolso Procesado'
            mensaje = `Se reembolsó $${transaccion.monto} a tu cuenta`
          }
          break
      }

      if (titulo && mensaje) {
        await NotificationsService.sendCriticalEventNotification(
          userId,
          'pago_recibido',
          titulo,
          mensaje,
          { transaccionId: transaccion.id }
        )
      }
    } catch (error) {
      console.error('Error handling escrow state change:', error)
    }
  }

  /**
   * Send new message notification
   */
  private static async sendNewMessageNotification(
    userId: string, 
    mensaje: Mensaje
  ): Promise<void> {
    try {
      const titulo = '💬 Nuevo Mensaje'
      const mensajeTexto = `Tienes un nuevo mensaje: "${mensaje.contenido.substring(0, 50)}..."`

      await NotificationsService.sendCriticalEventNotification(
        userId,
        'mensaje_chat',
        titulo,
        mensajeTexto,
        { mensajeId: mensaje.id, chatId: mensaje.chatId }
      )
    } catch (error) {
      console.error('Error sending new message notification:', error)
    }
  }

  /**
   * Send reminder notifications
   */
  static async sendReminderNotifications(): Promise<void> {
    try {
      // This would typically be called by a scheduled Cloud Function
      // Check for contracts approaching deadline
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      // Query contracts with deadlines approaching
      const contractsRef = collection(db, 'contratos')
      const q = query(
        contractsRef,
        where('fechaLimite', '<=', tomorrow),
        where('estado', 'in', ['fondos_garantia', 'entrega_realizada'])
      )

      // This would need proper implementation with real queries
      console.log('Checking for reminder notifications...')
    } catch (error) {
      console.error('Error sending reminder notifications:', error)
    }
  }
}