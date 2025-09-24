<template>
  <div class="bg-gray-900 border border-cyan-400/30 rounded-lg p-6">
    <h3 class="text-xl font-semibold text-white mb-6">Sistema de Notificaciones - Demo</h3>
    
    <div class="space-y-6">
      <!-- Notification Center Integration -->
      <div class="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
        <div>
          <h4 class="text-lg font-medium text-white">Centro de Notificaciones</h4>
          <p class="text-sm text-gray-400">
            {{ unreadCount }} notificaciones sin leer
          </p>
        </div>
        <NotificationCenter />
      </div>

      <!-- Test Notifications -->
      <div class="space-y-4">
        <h4 class="text-lg font-medium text-white border-b border-gray-700 pb-2">
          Probar Notificaciones
        </h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NeonButton
            @click="sendTestNotification('nuevo_contrato')"
            variant="primary"
            :loading="loading"
          >
            🎯 Nuevo Contrato
          </NeonButton>
          
          <NeonButton
            @click="sendTestNotification('propuesta_recibida')"
            variant="secondary"
            :loading="loading"
          >
            📋 Propuesta Recibida
          </NeonButton>
          
          <NeonButton
            @click="sendTestNotification('pago_recibido')"
            variant="accent"
            :loading="loading"
          >
            💰 Pago Recibido
          </NeonButton>
          
          <NeonButton
            @click="sendTestNotification('mensaje_chat')"
            variant="ghost"
            :loading="loading"
          >
            💬 Mensaje Chat
          </NeonButton>
        </div>
      </div>

      <!-- Real-time Status -->
      <div class="p-4 bg-gray-800/50 rounded-lg">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-lg font-medium text-white">Estado en Tiempo Real</h4>
          <div class="flex items-center space-x-2">
            <div 
              class="w-2 h-2 rounded-full"
              :class="isListening ? 'bg-green-400 animate-pulse' : 'bg-red-400'"
            ></div>
            <span class="text-sm text-gray-400">
              {{ isListening ? 'Conectado' : 'Desconectado' }}
            </span>
          </div>
        </div>
        
        <div class="text-sm text-gray-300">
          <p>• Push Notifications: {{ pushEnabled ? '✅ Habilitado' : '❌ Deshabilitado' }}</p>
          <p>• Email Notifications: {{ emailEnabled ? '✅ Habilitado' : '❌ Deshabilitado' }}</p>
          <p>• Real-time Listeners: {{ isListening ? '✅ Activo' : '❌ Inactivo' }}</p>
        </div>
      </div>

      <!-- Recent Notifications -->
      <div class="space-y-4">
        <h4 class="text-lg font-medium text-white border-b border-gray-700 pb-2">
          Notificaciones Recientes
        </h4>
        
        <div v-if="recentNotifications.length === 0" class="text-center py-8">
          <p class="text-gray-400">No hay notificaciones recientes</p>
        </div>
        
        <div v-else class="space-y-2">
          <div
            v-for="notification in recentNotifications"
            :key="notification.id"
            class="flex items-start space-x-3 p-3 bg-gray-800/30 rounded-lg"
            :class="{ 'border-l-4 border-cyan-400': !notification.leida }"
          >
            <div 
              class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              :class="getNotificationIconClass(notification.tipo)"
            >
              {{ getNotificationEmoji(notification.tipo) }}
            </div>
            
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white">
                {{ notification.titulo }}
              </p>
              <p class="text-xs text-gray-400 mt-1">
                {{ notification.mensaje }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                {{ formatTime(notification.fechaCreacion) }}
              </p>
            </div>
            
            <div class="flex items-center space-x-2">
              <span 
                class="text-xs px-2 py-1 rounded-full"
                :class="getPriorityClass(notification.prioridad)"
              >
                {{ notification.prioridad }}
              </span>
              
              <button
                v-if="!notification.leida"
                @click="markAsRead(notification.id)"
                class="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Marcar leída
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Preferences Quick Access -->
      <div class="p-4 bg-gray-800/50 rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-lg font-medium text-white">Preferencias</h4>
            <p class="text-sm text-gray-400">Configurar tipos de notificación</p>
          </div>
          <NeonButton
            @click="showPreferences = !showPreferences"
            variant="ghost"
          >
            {{ showPreferences ? 'Ocultar' : 'Configurar' }}
          </NeonButton>
        </div>
        
        <div v-if="showPreferences" class="mt-4">
          <NotificationPreferences :user-type="userType" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNotificationsStore } from '../../stores/notifications'
import { AuthService } from '../../services/auth'
import { NotificationCenter, NotificationPreferences, NeonButton } from '../ui'
import type { NotificacionTipo } from '../../types'

// Props
interface Props {
  userType?: 'cliente' | 'especialista' | 'admin'
}

const props = withDefaults(defineProps<Props>(), {
  userType: 'cliente'
})

// Store
const notificationsStore = useNotificationsStore()

// Reactive state
const loading = ref(false)
const showPreferences = ref(false)
const isListening = ref(false)

// Computed
const unreadCount = computed(() => notificationsStore.unreadCount)
const recentNotifications = computed(() => notificationsStore.recentNotifications)
const pushEnabled = computed(() => notificationsStore.preferences.push)
const emailEnabled = computed(() => notificationsStore.preferences.email)

// Methods
const sendTestNotification = async (tipo: NotificacionTipo) => {
  try {
    loading.value = true
    
    const messages = {
      nuevo_contrato: {
        titulo: '🎯 Nueva Oportunidad Disponible',
        mensaje: 'Nuevo contrato: "Desarrollo de aplicación web" - Presupuesto: $5,000'
      },
      propuesta_recibida: {
        titulo: '📋 Nueva Propuesta Recibida',
        mensaje: 'Recibiste una propuesta de $4,500 para tu contrato'
      },
      pago_recibido: {
        titulo: '💰 Pago Procesado',
        mensaje: 'Se liberaron $4,275 a tu cuenta (comisión: $225)'
      },
      mensaje_chat: {
        titulo: '💬 Nuevo Mensaje',
        mensaje: 'Tienes un nuevo mensaje: "¿Cuándo podemos revisar los avances?"'
      }
    }

    const message = messages[tipo] || messages.nuevo_contrato
    
    notificationsStore.addNotification({
      tipo,
      titulo: message.titulo,
      mensaje: message.mensaje,
      prioridad: getTestPriority(tipo),
      datos: { test: true, timestamp: Date.now() }
    })
    
    // Simulate sending to server
    await new Promise(resolve => setTimeout(resolve, 1000))
    
  } catch (error) {
    console.error('Error sending test notification:', error)
  } finally {
    loading.value = false
  }
}

const markAsRead = async (notificationId: string) => {
  try {
    await notificationsStore.markAsRead(notificationId)
  } catch (error) {
    console.error('Error marking notification as read:', error)
  }
}

const getTestPriority = (tipo: NotificacionTipo): 'alta' | 'media' | 'baja' => {
  switch (tipo) {
    case 'pago_recibido':
      return 'alta'
    case 'propuesta_recibida':
    case 'mensaje_chat':
      return 'media'
    default:
      return 'baja'
  }
}

const getNotificationEmoji = (tipo: NotificacionTipo): string => {
  const emojis: Record<NotificacionTipo, string> = {
    nuevo_contrato: '🎯',
    propuesta_recibida: '📋',
    contrato_asignado: '✅',
    pago_recibido: '💰',
    trabajo_entregado: '📤',
    calificacion_recibida: '⭐',
    mensaje_chat: '💬',
    recordatorio: '⏰',
    sistema: '🔔'
  }
  
  return emojis[tipo] || '🔔'
}

const getNotificationIconClass = (tipo: NotificacionTipo): string => {
  const classes: Record<NotificacionTipo, string> = {
    nuevo_contrato: 'bg-blue-500/20 text-blue-400',
    propuesta_recibida: 'bg-green-500/20 text-green-400',
    contrato_asignado: 'bg-cyan-500/20 text-cyan-400',
    pago_recibido: 'bg-yellow-500/20 text-yellow-400',
    trabajo_entregado: 'bg-purple-500/20 text-purple-400',
    calificacion_recibida: 'bg-orange-500/20 text-orange-400',
    mensaje_chat: 'bg-pink-500/20 text-pink-400',
    recordatorio: 'bg-red-500/20 text-red-400',
    sistema: 'bg-gray-500/20 text-gray-400'
  }
  
  return classes[tipo] || 'bg-gray-500/20 text-gray-400'
}

const getPriorityClass = (prioridad: 'alta' | 'media' | 'baja'): string => {
  switch (prioridad) {
    case 'alta':
      return 'bg-red-500/20 text-red-400'
    case 'media':
      return 'bg-yellow-500/20 text-yellow-400'
    case 'baja':
      return 'bg-green-500/20 text-green-400'
    default:
      return 'bg-gray-500/20 text-gray-400'
  }
}

const formatTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  
  return date.toLocaleDateString('es-MX', { 
    month: 'short', 
    day: 'numeric' 
  })
}

// Lifecycle
onMounted(async () => {
  try {
    await notificationsStore.initialize()
    isListening.value = notificationsStore.initialized
  } catch (error) {
    console.error('Error initializing notifications:', error)
  }
})

onUnmounted(() => {
  notificationsStore.cleanup()
})
</script>