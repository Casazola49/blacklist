<template>
  <div class="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-gray-900 border border-red-500/30 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-red-500/30 bg-red-900/10">
        <div>
          <h3 class="text-xl font-bold text-white">
            <GlitchText text="Resolución de Disputa" />
          </h3>
          <p class="text-red-300 text-sm mt-1">{{ contract.titulo }}</p>
        </div>
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
        <!-- Dispute Summary -->
        <HologramCard class="p-4 border-red-500/30">
          <h4 class="text-lg font-semibold text-red-300 mb-3">Resumen de la Disputa</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center p-3 bg-red-900/20 rounded-lg">
              <div class="text-2xl font-bold text-white">${{ contract.precioFinal || contract.presupuestoSugerido }}</div>
              <div class="text-sm text-gray-400">Monto en Disputa</div>
            </div>
            <div class="text-center p-3 bg-red-900/20 rounded-lg">
              <div class="text-2xl font-bold text-white">{{ daysSinceDispute }}</div>
              <div class="text-sm text-gray-400">Días en Disputa</div>
            </div>
            <div class="text-center p-3 bg-red-900/20 rounded-lg">
              <div class="text-2xl font-bold text-white">{{ chatMessages.length }}</div>
              <div class="text-sm text-gray-400">Mensajes de Chat</div>
            </div>
          </div>
        </HologramCard>

        <!-- Timeline -->
        <HologramCard class="p-4">
          <h4 class="text-lg font-semibold text-white mb-3">Cronología del Contrato</h4>
          <div class="space-y-3">
            <div 
              v-for="event in timeline" 
              :key="event.date.getTime()"
              class="flex items-start space-x-3"
            >
              <div class="w-3 h-3 bg-brand-primary rounded-full mt-1 flex-shrink-0"></div>
              <div class="flex-1">
                <div class="flex justify-between items-center">
                  <span class="text-white font-medium">{{ event.event }}</span>
                  <span class="text-sm text-gray-400">{{ formatDate(event.date) }}</span>
                </div>
                <p class="text-gray-400 text-sm">{{ event.description }}</p>
              </div>
            </div>
          </div>
        </HologramCard>

        <!-- Participants Details -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Client -->
          <HologramCard class="p-4 border-blue-500/30">
            <h4 class="text-lg font-semibold text-blue-300 mb-3">Cliente</h4>
            <div v-if="clientInfo" class="space-y-3">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                  {{ clientInfo.alias.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div class="text-white font-medium">{{ clientInfo.alias }}</div>
                  <div class="text-sm text-gray-400">{{ clientInfo.email }}</div>
                </div>
              </div>
              
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-400">Contratos Activos:</span>
                  <span class="text-white">{{ (clientInfo as any).contractosActivos?.length || 0 }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Historial:</span>
                  <span class="text-white">{{ (clientInfo as any).historialContratos?.length || 0 }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Saldo Escrow:</span>
                  <span class="text-white">${{ (clientInfo as any).saldoEscrow || 0 }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Miembro desde:</span>
                  <span class="text-white">{{ formatDate(clientInfo.fechaCreacion) }}</span>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4 text-gray-400">
              Cargando información del cliente...
            </div>
          </HologramCard>

          <!-- Specialist -->
          <HologramCard class="p-4 border-purple-500/30">
            <h4 class="text-lg font-semibold text-purple-300 mb-3">Especialista</h4>
            <div v-if="specialistInfo" class="space-y-3">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold">
                  {{ specialistInfo.alias.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div class="text-white font-medium">{{ specialistInfo.alias }}</div>
                  <div class="text-sm text-gray-400">{{ specialistInfo.email }}</div>
                </div>
              </div>
              
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-400">Calificación:</span>
                  <span class="text-white">⭐ {{ specialistInfo.calificacionPromedio.toFixed(1) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Trabajos Completados:</span>
                  <span class="text-white">{{ specialistInfo.trabajosCompletados }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Ganancias Totales:</span>
                  <span class="text-white">${{ specialistInfo.gananciasTotal }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Miembro desde:</span>
                  <span class="text-white">{{ formatDate(specialistInfo.fechaCreacion) }}</span>
                </div>
              </div>

              <!-- Skills -->
              <div>
                <div class="text-sm text-gray-400 mb-2">Habilidades:</div>
                <div class="flex flex-wrap gap-1">
                  <span 
                    v-for="skill in specialistInfo.habilidades.slice(0, 4)" 
                    :key="skill"
                    class="px-2 py-1 bg-purple-900/30 text-purple-300 rounded text-xs"
                  >
                    {{ skill }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4 text-gray-400">
              Cargando información del especialista...
            </div>
          </HologramCard>
        </div>

        <!-- Chat History -->
        <HologramCard v-if="chatMessages.length > 0" class="p-4">
          <h4 class="text-lg font-semibold text-white mb-3">Historial de Conversación</h4>
          <div class="max-h-80 overflow-y-auto space-y-3 bg-gray-800/30 p-4 rounded-lg">
            <div 
              v-for="message in chatMessages" 
              :key="message.id"
              :class="[
                'p-3 rounded-lg max-w-xs',
                message.autorId === contract.clienteId 
                  ? 'bg-blue-900/30 border border-blue-500/30 ml-auto' 
                  : message.autorId === contract.especialistaId
                  ? 'bg-purple-900/30 border border-purple-500/30'
                  : 'bg-gray-700/50 border border-gray-600/30 mx-auto text-center'
              ]"
            >
              <div class="flex justify-between items-center mb-1">
                <span :class="[
                  'text-xs font-medium',
                  message.autorId === contract.clienteId ? 'text-blue-300' :
                  message.autorId === contract.especialistaId ? 'text-purple-300' :
                  'text-gray-400'
                ]">
                  {{ getUserAlias(message.autorId) }}
                </span>
                <span class="text-xs text-gray-500">
                  {{ formatTime(message.fechaEnvio) }}
                </span>
              </div>
              <p class="text-gray-300 text-sm">{{ message.contenido }}</p>
            </div>
          </div>
        </HologramCard>

        <!-- Escrow Information -->
        <HologramCard v-if="escrowInfo" class="p-4">
          <h4 class="text-lg font-semibold text-white mb-3">Información Financiera</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">Monto Total:</span>
                <span class="text-white font-bold">${{ escrowInfo.monto }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Comisión Plataforma (15%):</span>
                <span class="text-white">${{ escrowInfo.comisionPlataforma }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Neto para Especialista:</span>
                <span class="text-white font-bold">${{ escrowInfo.monto - escrowInfo.comisionPlataforma }}</span>
              </div>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">Estado Escrow:</span>
                <span class="px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded text-xs">
                  {{ escrowInfo.estado.replace('_', ' ').toUpperCase() }}
                </span>
              </div>
              <div v-if="escrowInfo.fechaDeposito" class="flex justify-between">
                <span class="text-gray-400">Fecha Depósito:</span>
                <span class="text-white">{{ formatDate(escrowInfo.fechaDeposito) }}</span>
              </div>
            </div>
          </div>
        </HologramCard>

        <!-- Resolution Actions -->
        <HologramCard class="p-4 border-yellow-500/30 bg-yellow-900/5">
          <h4 class="text-lg font-semibold text-yellow-300 mb-3">Resolución de Disputa</h4>
          <p class="text-gray-300 mb-4">
            Como administrador, debes revisar toda la evidencia y decidir cómo resolver esta disputa.
            Esta decisión es final y no se puede deshacer.
          </p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <h5 class="text-blue-300 font-medium mb-2">Resolver a favor del Cliente</h5>
              <p class="text-gray-400 text-sm mb-3">
                Los fondos serán reembolsados al cliente. El especialista no recibirá pago.
              </p>
              <NeonButton 
                @click="resolveForClient"
                variant="primary"
                class="w-full"
              >
                Reembolsar al Cliente
              </NeonButton>
            </div>
            
            <div class="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <h5 class="text-purple-300 font-medium mb-2">Resolver a favor del Especialista</h5>
              <p class="text-gray-400 text-sm mb-3">
                Los fondos serán liberados al especialista. El cliente no recibirá reembolso.
              </p>
              <NeonButton 
                @click="resolveForSpecialist"
                variant="success"
                class="w-full"
              >
                Liberar al Especialista
              </NeonButton>
            </div>
          </div>
        </HologramCard>

        <!-- Actions -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-700">
          <NeonButton @click="$emit('close')" variant="secondary">
            Cerrar sin Resolver
          </NeonButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
  resolve: [contractId: string, resolution: 'client' | 'specialist']
}>()

const adminStore = useAdminStore()
const clientInfo = ref<Usuario | null>(null)
const specialistInfo = ref<Especialista | null>(null)
const escrowInfo = ref<TransaccionEscrow | null>(null)
const chatMessages = ref<Mensaje[]>([])

const daysSinceDispute = computed(() => {
  // Assuming dispute started recently - in real app, you'd track this
  const now = new Date()
  const disputeDate = props.contract.fechaCreacion // Placeholder
  const diffTime = Math.abs(now.getTime() - disputeDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

const timeline = computed(() => {
  const events = [
    {
      date: props.contract.fechaCreacion,
      event: 'Contrato Creado',
      description: `Cliente ${clientInfo.value?.alias || 'desconocido'} creó el contrato`
    }
  ]

  if (props.contract.fechaAsignacion && specialistInfo.value) {
    events.push({
      date: props.contract.fechaAsignacion,
      event: 'Contrato Asignado',
      description: `Asignado a especialista ${specialistInfo.value.alias}`
    })
  }

  if (escrowInfo.value?.fechaDeposito) {
    events.push({
      date: escrowInfo.value.fechaDeposito,
      event: 'Fondos Depositados',
      description: `$${escrowInfo.value.monto} depositados en escrow`
    })
  }

  // Add dispute event (placeholder date)
  events.push({
    date: new Date(), // In real app, track actual dispute date
    event: 'Disputa Iniciada',
    description: 'El contrato fue marcado como disputado'
  })

  return events.sort((a, b) => a.date.getTime() - b.date.getTime())
})

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const getUserAlias = (userId: string) => {
  if (userId === props.contract.clienteId) {
    return clientInfo.value?.alias || 'Cliente'
  } else if (userId === props.contract.especialistaId) {
    return specialistInfo.value?.alias || 'Especialista'
  }
  return 'Sistema'
}

const resolveForClient = () => {
  if (confirm('¿Estás seguro de resolver la disputa a favor del cliente? Los fondos serán reembolsados y esta acción no se puede deshacer.')) {
    emit('resolve', props.contract.id, 'client')
  }
}

const resolveForSpecialist = () => {
  if (confirm('¿Estás seguro de resolver la disputa a favor del especialista? Los fondos serán liberados y esta acción no se puede deshacer.')) {
    emit('resolve', props.contract.id, 'specialist')
  }
}

const loadDisputeDetails = async () => {
  try {
    // Load participant info
    clientInfo.value = await adminStore.getUserDetails(props.contract.clienteId)
    
    if (props.contract.especialistaId) {
      specialistInfo.value = await adminStore.getUserDetails(props.contract.especialistaId) as Especialista
    }
    
    // Load escrow info
    try {
      escrowInfo.value = await EscrowService.getEscrowTransactionByContract(props.contract.id)
    } catch (error) {
      console.log('No escrow transaction found')
    }
    
    // Load chat messages
    if (props.contract.chatId) {
      try {
        chatMessages.value = await ChatService.getMessages(props.contract.chatId)
      } catch (error) {
        console.log('No chat messages found')
      }
    }
  } catch (error) {
    console.error('Error loading dispute details:', error)
  }
}

onMounted(() => {
  loadDisputeDetails()
})
</script>