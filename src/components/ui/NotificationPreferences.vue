<template>
  <div class="bg-gray-900 border border-cyan-400/30 rounded-lg p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-xl font-semibold text-white">Preferencias de Notificación</h3>
      <button
        @click="resetToDefaults"
        class="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
      >
        Restaurar por defecto
      </button>
    </div>

    <form @submit.prevent="savePreferences" class="space-y-6">
      <!-- General Settings -->
      <div class="space-y-4">
        <h4 class="text-lg font-medium text-white border-b border-gray-700 pb-2">
          Configuración General
        </h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
            <div>
              <label class="text-sm font-medium text-white">Notificaciones Push</label>
              <p class="text-xs text-gray-400">Recibir notificaciones en el navegador</p>
            </div>
            <ToggleSwitch
              v-model="preferences.push"
              :disabled="!pushSupported"
            />
          </div>

          <div class="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
            <div>
              <label class="text-sm font-medium text-white">Notificaciones por Email</label>
              <p class="text-xs text-gray-400">Recibir notificaciones por correo</p>
            </div>
            <ToggleSwitch v-model="preferences.email" />
          </div>
        </div>
      </div>

      <!-- Event-Specific Settings -->
      <div class="space-y-4">
        <h4 class="text-lg font-medium text-white border-b border-gray-700 pb-2">
          Tipos de Notificación
        </h4>

        <div class="grid grid-cols-1 gap-3">
          <NotificationPreferenceItem
            v-model="preferences.nuevoContrato"
            title="Nuevos Contratos"
            description="Cuando hay nuevas oportunidades que coinciden con tus habilidades"
            icon="DocumentIcon"
            :user-type="userType"
            :show-for="['especialista']"
          />

          <NotificationPreferenceItem
            v-model="preferences.propuestaRecibida"
            title="Propuestas Recibidas"
            description="Cuando recibes una nueva propuesta en tus contratos"
            icon="ClipboardIcon"
            :user-type="userType"
            :show-for="['cliente']"
          />

          <NotificationPreferenceItem
            v-model="preferences.contratoAsignado"
            title="Contrato Asignado"
            description="Cuando un contrato es asignado o aceptado"
            icon="CheckIcon"
            :user-type="userType"
            :show-for="['cliente', 'especialista']"
          />

          <NotificationPreferenceItem
            v-model="preferences.pagoRecibido"
            title="Pagos Procesados"
            description="Cuando se procesan pagos o liberan fondos"
            icon="CurrencyDollarIcon"
            :user-type="userType"
            :show-for="['cliente', 'especialista']"
          />

          <NotificationPreferenceItem
            v-model="preferences.trabajoEntregado"
            title="Trabajo Entregado"
            description="Cuando se entrega un trabajo completado"
            icon="PaperAirplaneIcon"
            :user-type="userType"
            :show-for="['cliente']"
          />

          <NotificationPreferenceItem
            v-model="preferences.calificacionRecibida"
            title="Calificaciones Recibidas"
            description="Cuando recibes una nueva calificación"
            icon="StarIcon"
            :user-type="userType"
            :show-for="['cliente', 'especialista']"
          />

          <NotificationPreferenceItem
            v-model="preferences.mensajeChat"
            title="Mensajes de Chat"
            description="Cuando recibes nuevos mensajes en tus conversaciones"
            icon="ChatIcon"
            :user-type="userType"
            :show-for="['cliente', 'especialista']"
          />

          <NotificationPreferenceItem
            v-model="preferences.recordatorios"
            title="Recordatorios"
            description="Recordatorios de fechas límite y tareas pendientes"
            icon="ClockIcon"
            :user-type="userType"
            :show-for="['cliente', 'especialista']"
          />
        </div>
      </div>

      <!-- Advanced Settings -->
      <div class="space-y-4">
        <h4 class="text-lg font-medium text-white border-b border-gray-700 pb-2">
          Configuración Avanzada
        </h4>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 bg-gray-800/50 rounded-lg">
            <label class="block text-sm font-medium text-white mb-2">
              Horario de Notificaciones
            </label>
            <select
              v-model="preferences.horario"
              class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="always">Siempre</option>
              <option value="business">Horario laboral (9 AM - 6 PM)</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          <div class="p-4 bg-gray-800/50 rounded-lg">
            <label class="block text-sm font-medium text-white mb-2">
              Frecuencia de Resumen
            </label>
            <select
              v-model="preferences.resumen"
              class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="none">Sin resumen</option>
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
            </select>
          </div>
        </div>

        <!-- Custom Time Range (shown when custom is selected) -->
        <div
          v-if="preferences.horario === 'custom'"
          class="p-4 bg-gray-800/50 rounded-lg"
        >
          <label class="block text-sm font-medium text-white mb-3">
            Horario Personalizado
          </label>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1">Desde</label>
              <input
                v-model="preferences.horaInicio"
                type="time"
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">Hasta</label>
              <input
                v-model="preferences.horaFin"
                type="time"
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-between pt-6 border-t border-gray-700">
        <div class="text-sm text-gray-400">
          <span v-if="lastSaved">
            Guardado: {{ formatDate(lastSaved) }}
          </span>
        </div>
        
        <div class="flex items-center space-x-3">
          <button
            type="button"
            @click="testNotifications"
            class="px-4 py-2 text-sm text-cyan-400 border border-cyan-400/30 rounded-lg hover:bg-cyan-400/10 transition-colors"
            :disabled="loading"
          >
            Probar Notificaciones
          </button>
          
          <button
            type="submit"
            class="px-6 py-2 bg-cyan-500 text-gray-900 rounded-lg hover:bg-cyan-400 transition-colors font-medium"
            :disabled="loading"
          >
            <span v-if="loading">Guardando...</span>
            <span v-else>Guardar Cambios</span>
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { NotificationsService } from '../../services/notifications'
import { AuthService } from '../../services/auth'
import ToggleSwitch from './ToggleSwitch.vue'
import NotificationPreferenceItem from './NotificationPreferenceItem.vue'
import type { PreferenciasNotificacion } from '../../types'

// Props
interface Props {
  userType?: 'cliente' | 'especialista' | 'admin'
}

const props = withDefaults(defineProps<Props>(), {
  userType: 'cliente'
})

// Reactive state
const loading = ref(false)
const lastSaved = ref<Date | null>(null)
const pushSupported = ref(false)

const preferences = ref<PreferenciasNotificacion & {
  horario: 'always' | 'business' | 'custom'
  resumen: 'none' | 'daily' | 'weekly'
  horaInicio: string
  horaFin: string
}>({
  push: true,
  email: true,
  nuevoContrato: true,
  propuestaRecibida: true,
  contratoAsignado: true,
  pagoRecibido: true,
  trabajoEntregado: true,
  calificacionRecibida: true,
  mensajeChat: true,
  recordatorios: true,
  horario: 'always',
  resumen: 'daily',
  horaInicio: '09:00',
  horaFin: '18:00'
})

// Computed
const userType = computed(() => props.userType)

// Methods
const loadPreferences = async () => {
  try {
    loading.value = true
    const user = AuthService.getCurrentUser()
    if (!user) return

    const userPreferences = await NotificationsService.getUserPreferences(user.uid)
    
    // Merge with current preferences (keeping extended properties)
    preferences.value = {
      ...preferences.value,
      ...userPreferences
    }
  } catch (error) {
    console.error('Error loading preferences:', error)
  } finally {
    loading.value = false
  }
}

const savePreferences = async () => {
  try {
    loading.value = true
    const user = AuthService.getCurrentUser()
    if (!user) return

    // Extract only the base preferences for saving
    const basePreferences: PreferenciasNotificacion = {
      push: preferences.value.push,
      email: preferences.value.email,
      nuevoContrato: preferences.value.nuevoContrato,
      propuestaRecibida: preferences.value.propuestaRecibida,
      contratoAsignado: preferences.value.contratoAsignado,
      pagoRecibido: preferences.value.pagoRecibido,
      trabajoEntregado: preferences.value.trabajoEntregado,
      calificacionRecibida: preferences.value.calificacionRecibida,
      mensajeChat: preferences.value.mensajeChat,
      recordatorios: preferences.value.recordatorios
    }

    await NotificationsService.updateUserPreferences(user.uid, basePreferences)
    lastSaved.value = new Date()
    
    // Show success message
    showSuccessMessage()
  } catch (error) {
    console.error('Error saving preferences:', error)
    showErrorMessage()
  } finally {
    loading.value = false
  }
}

const resetToDefaults = () => {
  preferences.value = {
    push: true,
    email: true,
    nuevoContrato: true,
    propuestaRecibida: true,
    contratoAsignado: true,
    pagoRecibido: true,
    trabajoEntregado: true,
    calificacionRecibida: true,
    mensajeChat: true,
    recordatorios: true,
    horario: 'always',
    resumen: 'daily',
    horaInicio: '09:00',
    horaFin: '18:00'
  }
}

const testNotifications = async () => {
  try {
    const user = AuthService.getCurrentUser()
    if (!user) return

    await NotificationsService.sendCriticalEventNotification(
      user.uid,
      'sistema',
      '🧪 Notificación de Prueba',
      'Esta es una notificación de prueba para verificar tu configuración.',
      { test: true }
    )

    showSuccessMessage('Notificación de prueba enviada')
  } catch (error) {
    console.error('Error sending test notification:', error)
    showErrorMessage('Error al enviar notificación de prueba')
  }
}

const checkPushSupport = async () => {
  try {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      pushSupported.value = true
    }
  } catch (error) {
    console.error('Push notifications not supported:', error)
    pushSupported.value = false
  }
}

const formatDate = (date: Date) => {
  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const showSuccessMessage = (message = 'Preferencias guardadas correctamente') => {
  // This would integrate with a toast notification system
  console.log('Success:', message)
}

const showErrorMessage = (message = 'Error al guardar preferencias') => {
  // This would integrate with a toast notification system
  console.error('Error:', message)
}

// Lifecycle
onMounted(async () => {
  await checkPushSupport()
  await loadPreferences()
})
</script>