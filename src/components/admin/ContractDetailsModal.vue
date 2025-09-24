<template>
  <div class="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-gray-900 border border-brand-primary/30 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-gray-700">
        <h3 class="text-xl font-bold text-white">
          <GlitchText :text="`Contrato: ${contract.titulo}`" />
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
        <!-- Contract Info -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HologramCard class="p-4">
            <h4 class="text-lg font-semibold text-white mb-3">Información del Contrato</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">ID:</span>
                <span class="text-white font-mono">{{ contract.id }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Estado:</span>
                <span :class="[
                  'px-2 py-1 text-xs rounded-full',
                  getContractStatusClass(contract.estado)
                ]">
                  {{ getContractStatusLabel(contract.estado) }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Tipo:</span>
                <span class="text-white">{{ contract.tipoServicio === 'realizacion' ? 'Realización' : 'Revisión' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Presupuesto Sugerido:</span>
                <span class="text-white">${{ contract.presupuestoSugerido }}</span>
              </div>
              <div v-if="contract.precioFinal" class="flex justify-between">
                <span class="text-gray-400">Precio Final:</span>
                <span class="text-white font-bold">${{ contract.precioFinal }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Creado:</span>
                <span class="text-white">{{ formatDate(contract.fechaCreacion) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Límite:</span>
                <span class="text-white">{{ formatDate(contract.fechaLimite) }}</span>
              </div>
              <div v-if="contract.fechaAsignacion" class="flex justify-between">
                <span class="text-gray-400">Asignado:</span>
                <span class="text-white">{{ formatDate(contract.fechaAsignacion) }}</span>
              </div>
              <div v-if="contract.fechaCompletado" class="flex justify-between">
                <span class="text-gray-400">Completado:</span>
                <span class="text-white">{{ formatDate(contract.fechaCompletado) }}</span>
              </div>
            </div>
          </HologramCard>

          <HologramCard class="p-4">
            <h4 class="text-lg font-semibold text-white mb-3">Participantes</h4>
            <div class="space-y-4">
              <!-- Client Info -->
              <div class="p-3 bg-gray-800/50 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm text-gray-400">Cliente</span>
                  <span class="px-2 py-1 text-xs bg-blue-900/30 text-blue-300 rounded-full">Cliente</span>
                </div>
                <div v-if="clientInfo" class="space-y-1">
                  <div class="text-white font-medium">{{ clientInfo.alias }}</div>
                  <div class="text-sm text-gray-400">{{ clientInfo.email }}</div>
                  <div class="text-xs text-gray-500">{{ clientInfo.uid }}</div>
                </div>
                <div v-else class="text-gray-500">Cargando información del cliente...</div>
              </div>

              <!-- Specialist Info -->
              <div v-if="contract.especialistaId" class="p-3 bg-gray-800/50 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm text-gray-400">Especialista</span>
                  <span class="px-2 py-1 text-xs bg-purple-900/30 text-purple-300 rounded-full">Especialista</span>
                </div>
                <div v-if="specialistInfo" class="space-y-1">
                  <div class="text-white font-medium">{{ specialistInfo.alias }}</div>
                  <div class="text-sm text-gray-400">{{ specialistInfo.email }}</div>
                  <div class="text-sm text-gray-400">⭐ {{ specialistInfo.calificacionPromedio.toFixed(1) }}</div>
                  <div class="text-xs text-gray-500">{{ specialistInfo.uid }}</div>
                </div>
                <div v-else class="text-gray-500">Cargando información del especialista...</div>
              </div>
              <div v-else class="p-3 bg-gray-800/50 rounded-lg text-center text-gray-500">
                Sin especialista asignado
              </div>
            </div>
          </HologramCard>
        </div>

        <!-- Description -->
        <HologramCard class="p-4">
          <h4 class="text-lg font-semibold text-white mb-3">Descripción</h4>
          <p class="text-gray-300 leading-relaxed">{{ contract.descripcion }}</p>
        </HologramCard>

        <!-- Proposals -->
        <HologramCard v-if="contract.propuestas.length > 0" class="p-4">
          <h4 class="text-lg font-semibold text-white mb-3">Propuestas ({{ contract.propuestas.length }})</h4>
          <div class="space-y-3">
            <div 
              v-for="propuesta in contract.propuestas" 
              :key="propuesta.id"
              class="p-3 bg-gray-800/50 rounded-lg border border-gray-700"
            >
              <div class="flex justify-between items-start mb-2">
                <div>
                  <div class="text-white font-medium">{{ getSpecialistAlias(propuesta.especialistaId) }}</div>
                  <div class="text-sm text-gray-400">{{ formatDate(propuesta.fechaEnvio) }}</div>
                </div>
                <div class="text-right">
                  <div class="text-white font-bold">${{ propuesta.precio }}</div>
                  <span :class="[
                    'px-2 py-1 text-xs rounded-full',
                    propuesta.estado === 'aceptada' ? 'bg-green-900/30 text-green-300' :
                    propuesta.estado === 'rechazada' ? 'bg-red-900/30 text-red-300' :
                    'bg-yellow-900/30 text-yellow-300'
                  ]">
                    {{ propuesta.estado.charAt(0).toUpperCase() + propuesta.estado.slice(1) }}
                  </span>
                </div>
              </div>
              <p class="text-gray-300 text-sm">{{ propuesta.mensaje }}</p>
            </div>
          </div>
        </HologramCard>

        <!-- Escrow Info -->
        <HologramCard v-if="escrowInfo" class="p-4">
          <h4 class="text-lg font-semibold text-white mb-3">Información de Escrow</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">Monto:</span>
                <span class="text-white">${{ escrowInfo.monto }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Comisión (15%):</span>
                <span class="text-white">${{ escrowInfo.comisionPlataforma }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Neto Especialista:</span>
                <span class="text-white">${{ escrowInfo.monto - escrowInfo.comisionPlataforma }}</span>
              </div>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">Estado:</span>
                <span :class="[
                  'px-2 py-1 text-xs rounded-full',
                  escrowInfo.estado === 'fondos_retenidos' ? 'bg-yellow-900/30 text-yellow-300' :
                  escrowInfo.estado === 'liberado_especialista' ? 'bg-green-900/30 text-green-300' :
                  escrowInfo.estado === 'reembolsado_cliente' ? 'bg-blue-900/30 text-blue-300' :
                  'bg-gray-900/30 text-gray-300'
                ]">
                  {{ getEscrowStatusLabel(escrowInfo.estado) }}
                </span>
              </div>
              <div v-if="escrowInfo.fechaDeposito" class="flex justify-between">
                <span class="text-gray-400">Depósito:</span>
                <span class="text-white">{{ formatDate(escrowInfo.fechaDeposito) }}</span>
              </div>
              <div v-if="escrowInfo.fechaLiberacion" class="flex justify-between">
                <span class="text-gray-400">Liberación:</span>
                <span class="text-white">{{ formatDate(escrowInfo.fechaLiberacion) }}</span>
              </div>
            </div>
          </div>
        </HologramCard>

        <!-- Chat Messages (if disputed) -->
        <HologramCard v-if="contract.estado === 'disputado' && chatMessages.length > 0" class="p-4">
          <h4 class="text-lg font-semibold text-white mb-3">Historial de Chat</h4>
          <div class="max-h-60 overflow-y-auto space-y-2">
            <div 
              v-for="message in chatMessages.slice(-10)" 
              :key="message.id"
              class="p-2 bg-gray-800/50 rounded text-sm"
            >
              <div class="flex justify-between items-center mb-1">
                <span class="text-gray-400">{{ getUserAlias(message.autorId) }}</span>
                <span class="text-xs text-gray-500">{{ formatDate(message.fechaEnvio) }}</span>
              </div>
              <p class="text-gray-300">{{ message.contenido }}</p>
            </div>
          </div>
        </HologramCard>

        <!-- Dispute Resolution (if disputed) -->
        <HologramCard v-if="contract.estado === 'disputado'" class="p-4 border-red-500/30">
          <h4 class="text-lg font-semibold text-red-300 mb-3">Resolución de Disputa</h4>
          <p class="text-gray-300 mb-4">
            Este contrato está en disputa. Como administrador, puedes resolver la disputa 
            liberando los fondos al especialista o reembolsando al cliente.
          </p>
          <div class="flex space-x-4">
            <NeonButton 
              @click="resolveForClient"
              variant="primary"
            >
              Resolver a favor del Cliente
            </NeonButton>
            <NeonButton 
              @click="resolveForSpecialist"
              variant="success"
            >
              Resolver a favor del Especialista
            </NeonButton>
          </div>
        </HologramCard>

        <!-- Actions -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-700">
          <NeonButton 
            v-if="['abierto', 'esperando_deposito'].includes(contract.estado)"
            @click="cancelContract"
            variant="danger"
          >
            Cancelar Contrato
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
import { EscrowService } from '../../services/escrow'
import { ChatService } from '../../services/chat'
import type { Contrato, Usuario, Especialista, TransaccionEscrow, Mensaje } from '../../types'
import HologramCard from '../ui/HologramCard.vue'
import GlitchText from '../ui/GlitchText.vue'
import NeonButton from '../ui/NeonButton.vue'

interface Props {
  contract: Contrato
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  resolveDispute: [contractId: string, resolution: 'client' | 'specialist']
}>()

const adminStore = useAdminStore()
const clientInfo = ref<Usuario | null>(null)
const specialistInfo = ref<Especialista | null>(null)
const escrowInfo = ref<TransaccionEscrow | null>(null)
const chatMessages = ref<Mensaje[]>([])

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
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

const getEscrowStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'pendiente_deposito': 'Pendiente Depósito',
    'fondos_retenidos': 'Fondos Retenidos',
    'liberado_especialista': 'Liberado',
    'reembolsado_cliente': 'Reembolsado',
    'en_disputa': 'En Disputa'
  }
  return labels[status] || status
}

const getSpecialistAlias = (specialistId: string) => {
  const specialist = adminStore.specialists.find(s => s.uid === specialistId)
  return specialist?.alias || 'Especialista Desconocido'
}

const getUserAlias = (userId: string) => {
  const user = adminStore.users.find(u => u.uid === userId)
  return user?.alias || 'Usuario Desconocido'
}

const resolveForClient = () => {
  if (confirm('¿Estás seguro de resolver la disputa a favor del cliente? Los fondos serán reembolsados.')) {
    emit('resolveDispute', props.contract.id, 'client')
  }
}

const resolveForSpecialist = () => {
  if (confirm('¿Estás seguro de resolver la disputa a favor del especialista? Los fondos serán liberados.')) {
    emit('resolveDispute', props.contract.id, 'specialist')
  }
}

const cancelContract = () => {
  if (confirm('¿Estás seguro de que quieres cancelar este contrato?')) {
    adminStore.cancelContract(props.contract.id)
    emit('close')
  }
}

const loadContractDetails = async () => {
  try {
    // Load client info
    clientInfo.value = await adminStore.getUserDetails(props.contract.clienteId)
    
    // Load specialist info if assigned
    if (props.contract.especialistaId) {
      specialistInfo.value = await adminStore.getUserDetails(props.contract.especialistaId) as Especialista
    }
    
    // Load escrow info
    try {
      escrowInfo.value = await EscrowService.getEscrowTransactionByContract(props.contract.id)
    } catch (error) {
      console.log('No escrow transaction found for contract')
    }
    
    // Load chat messages if disputed
    if (props.contract.estado === 'disputado' && props.contract.chatId) {
      try {
        chatMessages.value = await ChatService.getMessages(props.contract.chatId)
      } catch (error) {
        console.log('No chat messages found for contract')
      }
    }
  } catch (error) {
    console.error('Error loading contract details:', error)
  }
}

onMounted(() => {
  loadContractDetails()
})
</script>