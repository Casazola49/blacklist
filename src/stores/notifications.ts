import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Notification {
  id: string
  tipo: 'nueva_propuesta' | 'contrato_actualizado' | 'pago_recibido' | 'mensaje_recibido' | 'sistema'
  titulo: string
  mensaje: string
  usuarioId: string
  leida: boolean
  fechaCreacion: Date
  datos?: Record<string, any>
}

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const unreadNotifications = computed(() =>
    notifications.value.filter(n => !n.leida)
  )

  const unreadCount = computed(() => unreadNotifications.value.length)

  function addNotification(notification: Omit<Notification, 'id' | 'fechaCreacion' | 'leida'>) {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fechaCreacion: new Date(),
      leida: false
    }

    notifications.value.unshift(newNotification)
    return newNotification
  }

  async function markAsRead(notificationId: string): Promise<void> {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.leida = true
    }
  }

  async function markAllAsRead(): Promise<void> {
    notifications.value.forEach(n => n.leida = true)
  }

  async function subscribeToNotifications(userId: string): Promise<void> {
    loading.value = true
    try {
      // Simular suscripción a notificaciones en tiempo real
      console.log(`Subscribed to notifications for user: ${userId}`)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error subscribing to notifications'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function sendPushNotification(data: {
    userId: string
    title: string
    body: string
    data?: Record<string, any>
  }): Promise<boolean> {
    try {
      // Simular envío de push notification
      console.log('Push notification sent:', data)
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error sending push notification'
      return false
    }
  }

  function clearNotifications(): void {
    notifications.value = []
  }

  return {
    notifications,
    loading,
    error,
    unreadNotifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    subscribeToNotifications,
    sendPushNotification,
    clearNotifications
  }
})