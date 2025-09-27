export interface NotificationData {
  userId: string
  title: string
  body: string
  type?: string
  data?: Record<string, any>
}

export class NotificationsService {
  static async requestPermission(): Promise<string | null> {
    // Simular solicitud de permisos
    return 'granted'
  }

  static async getUserPreferences(userId: string): Promise<any> {
    // Simular obtención de preferencias
    return {
      push: true,
      email: true,
      contratos: true,
      propuestas: true,
      pagos: true,
      chat: true
    }
  }

  static async updateUserPreferences(userId: string, preferences: any): Promise<void> {
    // Simular actualización de preferencias
    console.log(`Updated preferences for user ${userId}:`, preferences)
  }

  static async sendCriticalEventNotification(userId: string, type: string, data: any): Promise<void> {
    // Simular envío de notificación crítica
    console.log(`Critical notification sent to ${userId}:`, type, data)
  }

  static async getUserNotifications(userId: string): Promise<any[]> {
    // Simular obtención de notificaciones
    return []
  }

  static async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    // Simular marcar como leída
    console.log(`Notification ${notificationId} marked as read for user ${userId}`)
  }

  static async sendNotificationToUser(userId: string, notification: any): Promise<void> {
    // Simular envío de notificación
    console.log(`Notification sent to user ${userId}:`, notification)
  }

  private static getNotificationPriority(type: string): string {
    // Simular obtención de prioridad
    return 'media'
  }

  private static shouldSendNotification(type: string, preferences: any): boolean {
    // Simular verificación de preferencias
    return true
  }
}

class NotificationService {
  async subscribeToNotifications(userId: string, callback?: (notification: any) => void): Promise<void> {
    // Simular suscripción a notificaciones
    console.log(`Subscribed to notifications for user: ${userId}`)
    if (callback) {
      callback({ message: 'Subscription successful' })
    }
  }

  async sendNotification(data: NotificationData): Promise<boolean> {
    // Simular envío de notificación
    console.log('Notification sent:', data)
    return true
  }

  async sendPushNotification(data: NotificationData): Promise<boolean> {
    // Simular envío de push notification
    console.log('Push notification sent:', data)
    return true
  }

  async markAsRead(notificationId: string): Promise<void> {
    // Simular marcar como leída
    console.log(`Notification marked as read: ${notificationId}`)
  }

  async showError(errorInfo: any): Promise<void> {
    // Mostrar notificación de error
    console.error('Error notification:', errorInfo)
    
    // En una implementación real, esto mostraría una notificación toast o modal
    if (typeof window !== 'undefined' && window.alert) {
      // Solo para desarrollo - en producción usaríamos un sistema de notificaciones más sofisticado
      console.warn('Error occurred:', errorInfo.message || 'Unknown error')
    }
  }
}

export const notificationService = new NotificationService()