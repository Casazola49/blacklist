<template>
  <div class="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-gray-900 border border-brand-primary/30 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-gray-700">
        <h3 class="text-xl font-bold text-white">
          <GlitchText :text="`Detalles de ${user.alias}`" />
        </h3>
        <button 
          @click="$emit('close')"
          class="text-gray-400 hover:text-white transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Basic Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <HologramCard class="p-4">
            <h4 class="text-lg font-semibold text-white mb-3">Información Básica</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">UID:</span>
                <span class="text-white font-mono">{{ user.uid }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Email:</span>
                <span class="text-white">{{ user.email }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Alias:</span>
                <span class="text-white">{{ user.alias }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Tipo:</span>
                <span :class="[
                  'px-2 py-1 text-xs rounded-full',
                  user.tipo === 'cliente' ? 'bg-blue-900/30 text-blue-300' :
                  user.tipo === 'especialista' ? 'bg-purple-900/30 text-purple-300' :
                  'bg-red-900/30 text-red-300'
                ]">
                  {{ user.tipo.charAt(0).toUpperCase() + user.tipo.slice(1) }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Estado:</span>
                <span :class="[
                  'px-2 py-1 text-xs rounded-full',
                  user.estado === 'activo' ? 'bg-green-900/30 text-green-300' :
                  user.estado === 'pendiente' ? 'bg-yellow-900/30 text-yellow-300' :
                  user.estado === 'suspendido' ? 'bg-red-900/30 text-red-300' :
                  'bg-gray-900/30 text-gray-300'
                ]">
                  {{ getStatusLabel(user.estado) }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Registro:</span>
                <span class="text-white">{{ formatDate(user.fechaCreacion) }}</span>
              </div>
            </div>
          </HologramCard>

          <!-- Type-specific Info -->
          <HologramCard class="p-4">
            <h4 class="text-lg font-semibold text-white mb-3">
              {{ user.tipo === 'especialista' ? 'Información Profesional' : 'Estadísticas' }}
            </h4>
            
            <div v-if="user.tipo === 'especialista'" class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">Nombre Real:</span>
                <span class="text-white">{{ (user as Especialista).nombreReal || 'No especificado' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Calificación:</span>
                <span class="text-white">⭐ {{ (user as Especialista).calificacionPromedio.toFixed(1) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Trabajos:</span>
                <span class="text-white">{{ (user as Especialista).trabajosCompletados }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Ganancias:</span>
                <span class="text-white">${{ (user as Especialista).gananciasTotal }}</span>
              </div>
            </div>
            
            <div v-else-if="user.tipo === 'cliente'" class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">Contratos Activos:</span>
                <span class="text-white">{{ (user as Cliente).contractosActivos.length }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Historial:</span>
                <span class="text-white">{{ (user as Cliente).historialContratos.length }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Saldo Escrow:</span>
                <span class="text-white">${{ (user as Cliente).saldoEscrow }}</span>
              </div>
            </div>
          </HologramCard>
        </div>

        <!-- Specialist Skills -->
        <div v-if="user.tipo === 'especialista'" class="space-y-4">
          <HologramCard class="p-4">
            <h4 class="text-lg font-semibold text-white mb-3">Habilidades</h4>
            <div class="flex flex-wrap gap-2">
              <span 
                v-for="skill in (user as Especialista).habilidades" 
                :key="skill"
                class="px-3 py-1 bg-brand-primary/20 text-brand-primary rounded-full text-sm"
              >
                {{ skill }}
              </span>
            </div>
          </HologramCard>

          <HologramCard class="p-4">
            <h4 class="text-lg font-semibold text-white mb-3">Biografía</h4>
            <p class="text-gray-300 text-sm leading-relaxed">
              {{ (user as Especialista).biografia || 'No hay biografía disponible' }}
            </p>
          </HologramCard>

          <HologramCard class="p-4">
            <h4 class="text-lg font-semibold text-white mb-3">CV</h4>
            <div class="text-gray-300 text-sm">
              <div v-if="(user as Especialista).cv" class="bg-gray-800 p-3 rounded border">
                <pre class="whitespace-pre-wrap">{{ (user as Especialista).cv }}</pre>
              </div>
              <div v-else class="text-gray-500 italic">
                No hay CV disponible
              </div>
            </div>
          </HologramCard>
        </div>

        <!-- Recent Activity -->
        <HologramCard class="p-4">
          <h4 class="text-lg font-semibold text-white mb-3">Actividad Reciente</h4>
          <div v-if="loading" class="flex justify-center py-4">
            <CyberLoader size="small" />
          </div>
          <div v-else-if="userContracts.length === 0" class="text-center py-4 text-gray-400">
            No hay actividad reciente
          </div>
          <div v-else class="space-y-2">
            <div 
              v-for="contract in userContracts.slice(0, 5)" 
              :key="contract.id"
              class="flex justify-between items-center p-2 bg-gray-800/50 rounded"
            >
              <div>
                <p class="text-white text-sm font-medium">{{ contract.titulo }}</p>
                <p class="text-gray-400 text-xs">{{ formatDate(contract.fechaCreacion) }}</p>
              </div>
              <span :class="[
                'px-2 py-1 text-xs rounded-full',
                getContractStatusClass(contract.estado)
              ]">
                {{ getContractStatusLabel(contract.estado) }}
              </span>
            </div>
          </div>
        </HologramCard>

        <!-- Actions -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-700">
          <NeonButton 
            v-if="user.tipo === 'especialista' && user.estado === 'pendiente'"
            @click="approveSpecialist"
            variant="primary"
          >
            Aprobar Especialista
          </NeonButton>
          
          <NeonButton 
            v-if="user.tipo === 'especialista' && user.estado === 'pendiente'"
            @click="rejectSpecialist"
            variant="danger"
          >
            Rechazar
          </NeonButton>
          
          <NeonButton 
            v-if="user.estado === 'activo'"
            @click="suspendUser"
            variant="warning"
          >
            Suspender Usuario
          </NeonButton>
          
          <NeonButton 
            v-if="user.estado === 'suspendido'"
            @click="reactivateUser"
            variant="primary"
          >
            Reactivar Usuario
          </NeonButton>
          
          <NeonButton @click="$emit('close')" variant="secondary">
            Cerrar
          </NeonButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAdminStore } from '../../stores/admin'
import { ContractsService } from '../../services/contracts'
import type { Usuario, Cliente, Especialista, Contrato } from '../../types'
import HologramCard from '../ui/HologramCard.vue'
import GlitchText from '../ui/GlitchText.vue'
import NeonButton from '../ui/NeonButton.vue'
import CyberLoader from '../ui/CyberLoader.vue'

interface Props {
  user: Usuario
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const adminStore = useAdminStore()
const loading = ref(false)
const userContracts = ref<Contrato[]>([])

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'activo': 'Activo',
    'pendiente': 'Pendiente',
    'suspendido': 'Suspendido',
    'rechazado': 'Rechazado'
  }
  return labels[status] || status
}

const getContractStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'abierto': 'Abierto',
    'esperando_deposito': 'Esperando Depósito',
    'fondos_garantia': 'En Progreso',
    'entrega_realizada': 'Entregado',
    'completado': 'Completado',
    'disputado': 'Disputado',
    'cancelado': 'Cancelado'
  }
  return labels[status] || status
}

const getContractStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    'abierto': 'bg-blue-900/30 text-blue-300',
    'esperando_deposito': 'bg-yellow-900/30 text-yellow-300',
    'fondos_garantia': 'bg-purple-900/30 text-purple-300',
    'entrega_realizada': 'bg-orange-900/30 text-orange-300',
    'completado': 'bg-green-900/30 text-green-300',
    'disputado': 'bg-red-900/30 text-red-300',
    'cancelado': 'bg-gray-900/30 text-gray-300'
  }
  return classes[status] || 'bg-gray-900/30 text-gray-300'
}

const approveSpecialist = async () => {
  try {
    await adminStore.approveSpecialist(props.user.uid)
    emit('close')
  } catch (error) {
    console.error('Error approving specialist:', error)
  }
}

const rejectSpecialist = async () => {
  if (confirm('¿Estás seguro de que quieres rechazar este especialista?')) {
    try {
      await adminStore.rejectSpecialist(props.user.uid)
      emit('close')
    } catch (error) {
      console.error('Error rejecting specialist:', error)
    }
  }
}

const suspendUser = async () => {
  if (confirm('¿Estás seguro de que quieres suspender este usuario?')) {
    try {
      await adminStore.suspendUser(props.user.uid)
      emit('close')
    } catch (error) {
      console.error('Error suspending user:', error)
    }
  }
}

const reactivateUser = async () => {
  try {
    await adminStore.reactivateUser(props.user.uid)
    emit('close')
  } catch (error) {
    console.error('Error reactivating user:', error)
  }
}

const loadUserContracts = async () => {
  loading.value = true
  try {
    if (props.user.tipo === 'cliente') {
      userContracts.value = await ContractsService.getClientContracts(props.user.uid)
    } else if (props.user.tipo === 'especialista') {
      userContracts.value = await ContractsService.getSpecialistContracts(props.user.uid)
    }
  } catch (error) {
    console.error('Error loading user contracts:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadUserContracts()
})
</script>