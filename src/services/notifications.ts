export interface NotificationData {
  userId: string
  title: string
  body: string
  type?: string
  data?: Record<string, any>
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