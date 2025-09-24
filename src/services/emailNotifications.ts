import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'
import type { NotificacionTipo } from '../types'

export interface EmailNotificationData {
  to: string
  subject: string
  template: string
  data: Record<string, any>
}

export class EmailNotificationsService {
  /**
   * Send email notification using Cloud Function
   */
  static async sendEmailNotification(
    email: string,
    tipo: NotificacionTipo,
    data: Record<string, any>
  ): Promise<void> {
    try {
      const sendEmail = httpsCallable(functions, 'sendEmailNotification')
      
      const emailData: EmailNotificationData = {
        to: email,
        subject: this.getEmailSubject(tipo),
        template: this.getEmailTemplate(tipo),
        data
      }

      await sendEmail(emailData)
    } catch (error) {
      console.error('Error sending email notification:', error)
      throw error
    }
  }

  /**
   * Get email subject based on notification type
   */
  private static getEmailSubject(tipo: NotificacionTipo): string {
    switch (tipo) {
      case 'nuevo_contrato':
        return '🎯 Nueva Oportunidad Disponible - The Blacklist'
      case 'propuesta_recibida':
        return '📋 Nueva Propuesta Recibida - The Blacklist'
      case 'contrato_asignado':
        return '✅ Contrato Asignado - The Blacklist'
      case 'pago_recibido':
        return '💰 Pago Procesado - The Blacklist'
      case 'trabajo_entregado':
        return '📤 Trabajo Entregado - The Blacklist'
      case 'calificacion_recibida':
        return '⭐ Nueva Calificación - The Blacklist'
      case 'mensaje_chat':
        return '💬 Nuevo Mensaje - The Blacklist'
      case 'recordatorio':
        return '⏰ Recordatorio - The Blacklist'
      case 'sistema':
        return '🔔 Notificación del Sistema - The Blacklist'
      default:
        return '🔔 Notificación - The Blacklist'
    }
  }

  /**
   * Get email template based on notification type
   */
  private static getEmailTemplate(tipo: NotificacionTipo): string {
    switch (tipo) {
      case 'nuevo_contrato':
        return 'nuevo-contrato'
      case 'propuesta_recibida':
        return 'propuesta-recibida'
      case 'contrato_asignado':
        return 'contrato-asignado'
      case 'pago_recibido':
        return 'pago-recibido'
      case 'trabajo_entregado':
        return 'trabajo-entregado'
      case 'calificacion_recibida':
        return 'calificacion-recibida'
      case 'mensaje_chat':
        return 'mensaje-chat'
      case 'recordatorio':
        return 'recordatorio'
      case 'sistema':
        return 'sistema'
      default:
        return 'default'
    }
  }

  /**
   * Send welcome email to new users
   */
  static async sendWelcomeEmail(
    email: string, 
    alias: string, 
    tipo: 'cliente' | 'especialista'
  ): Promise<void> {
    try {
      const data = {
        alias,
        tipo,
        loginUrl: `${window.location.origin}/login`,
        dashboardUrl: `${window.location.origin}/dashboard`
      }

      await this.sendEmailNotification(email, 'sistema', data)
    } catch (error) {
      console.error('Error sending welcome email:', error)
    }
  }

  /**
   * Send contract notification email
   */
  static async sendContractNotificationEmail(
    email: string,
    tipo: NotificacionTipo,
    contractData: {
      titulo: string
      descripcion: string
      precio?: number
      fechaLimite?: Date
      clienteAlias?: string
      especialistaAlias?: string
    }
  ): Promise<void> {
    try {
      const data = {
        ...contractData,
        dashboardUrl: `${window.location.origin}/dashboard`,
        fechaLimite: contractData.fechaLimite?.toISOString()
      }

      await this.sendEmailNotification(email, tipo, data)
    } catch (error) {
      console.error('Error sending contract notification email:', error)
    }
  }

  /**
   * Send payment notification email
   */
  static async sendPaymentNotificationEmail(
    email: string,
    paymentData: {
      monto: number
      contratoTitulo: string
      tipo: 'recibido' | 'enviado'
      referencia?: string
    }
  ): Promise<void> {
    try {
      const data = {
        ...paymentData,
        montoFormateado: new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN'
        }).format(paymentData.monto),
        dashboardUrl: `${window.location.origin}/dashboard`
      }

      await this.sendEmailNotification(email, 'pago_recibido', data)
    } catch (error) {
      console.error('Error sending payment notification email:', error)
    }
  }

  /**
   * Send rating notification email
   */
  static async sendRatingNotificationEmail(
    email: string,
    ratingData: {
      puntuacion: number
      comentario: string
      contratoTitulo: string
      evaluadorAlias: string
    }
  ): Promise<void> {
    try {
      const data = {
        ...ratingData,
        estrellas: '⭐'.repeat(ratingData.puntuacion),
        dashboardUrl: `${window.location.origin}/dashboard`
      }

      await this.sendEmailNotification(email, 'calificacion_recibida', data)
    } catch (error) {
      console.error('Error sending rating notification email:', error)
    }
  }

  /**
   * Send reminder email
   */
  static async sendReminderEmail(
    email: string,
    reminderData: {
      tipo: 'deadline' | 'payment' | 'delivery'
      contratoTitulo: string
      fechaLimite?: Date
      mensaje: string
    }
  ): Promise<void> {
    try {
      const data = {
        ...reminderData,
        fechaLimite: reminderData.fechaLimite?.toISOString(),
        dashboardUrl: `${window.location.origin}/dashboard`
      }

      await this.sendEmailNotification(email, 'recordatorio', data)
    } catch (error) {
      console.error('Error sending reminder email:', error)
    }
  }
}