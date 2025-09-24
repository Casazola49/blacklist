<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      @click="$emit('close')"
    ></div>

    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative w-full max-w-4xl">
        <HologramCard variant="primary" :active="true" class="overflow-hidden">
          <div class="p-6">
            <!-- Header -->
            <div class="flex items-start justify-between mb-6">
              <div class="flex-1">
                <div class="flex items-center space-x-4 mb-2">
                  <GlitchText 
                    :text="contract.titulo" 
                    :active="true" 
                    variant="primary" 
                    size="text-xl font-bold"
                  />
                  <ContractStatusBadge :status="contract.estado" />
                </div>
                <p class="text-text-secondary text-sm">
                  Creado el {{ formatDate(contract.fechaCreacion) }}
                </p>
              </div>
              <button
                @click="$emit('close')"
                class="text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Content -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Main Content -->
              <div class="lg:col-span-2 space-y-6">
                <!-- Description -->
                <div>
                  <h3 class="text-lg font-semibold text-text-primary mb-3">Descripción</h3>
                  <div class="p-4 bg-bg-tertiary rounded-lg">
                    <p class="text-text-primary whitespace-pre-wrap">{{ contract.descripcion }}</p>
                  </div>
                </div>

                <!-- Files -->
                <div v-if="contract.archivosAdjuntos.length > 0">
                  <h3 class="text-lg font-semibold text-text-primary mb-3">Archivos Adjuntos</h3>
                  <div class="space-y-2">
                    <div
                      v-for="(archivo, index) in contract.archivosAdjuntos"
                      :key="index"
                      class="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg hover:bg-bg-tertiary/80 transition-colors"
                    >
                      <div class="flex items-center space-x-3">
                        <svg class="w-5 h-5 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span class="text-text-primary">{{ getFileName(archivo) }}</span>
                      </div>
                      <NeonButton variant="ghost" size="sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </NeonButton>
                    </div>
                  </div>
                </div>

                <!-- Timeline for Assigned Contracts -->
                <div v-if="contract.especialistaId" class="space-y-4">
                  <h3 class="text-lg font-semibold text-text-primary">Timeline del Proyecto</h3>
                  <ContractTimeline :contract="contract" />
                </div>

                <!-- Escrow Information -->
                <div v-if="showEscrowInfo" class="space-y-4">
                  <h3 class="text-lg font-semibold text-text-primary">Información de Escrow</h3>
                  <EscrowInfo :contract="contract" />
                </div>
              </div>

              <!-- Sidebar -->
              <div class="space-y-6">
                <!-- Project Details -->
                <div class="p-4 bg-bg-secondary rounded-lg">
                  <h4 class="font-semibold text-text-primary mb-4">Detalles del Proyecto</h4>
                  <div class="space-y-3 text-sm">
                    <div class="flex justify-between">
                      <span class="text-text-secondary">Tipo:</span>
                      <span class="text-text-primary capitalize">{{ contract.tipoServicio }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-text-secondary">Presupuesto:</span>
                      <span class="text-accent-cyan font-semibold">
                        ${{ contract.presupuestoSugerido }}
                      </span>
                    </div>
                    <div v-if="contract.precioFinal" class="flex justify-between">
                      <span class="text-text-secondary">Precio Final:</span>
                      <span class="text-accent-magenta font-semibold">
                        ${{ contract.precioFinal }}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-text-secondary">Fecha Límite:</span>
                      <span class="text-text-primary">{{ formatDate(contract.fechaLimite) }}</span>
                    </div>
                    <div v-if="contract.fechaAsignacion" class="flex justify-between">
                      <span class="text-text-secondary">Asignado:</span>
                      <span class="text-text-primary">{{ formatDate(contract.fechaAsignacion) }}</span>
                    </div>
                    <div v-if="contract.fechaCompletado" class="flex justify-between">
                      <span class="text-text-secondary">Completado:</span>
                      <span class="text-text-primary">{{ formatDate(contract.fechaCompletado) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Progress -->
                <div v-if="isActiveContract" class="p-4 bg-bg-secondary rounded-lg">
                  <h4 class="font-semibold text-text-primary mb-4">Progreso</h4>
                  <div class="space-y-3">
                    <div class="flex justify-between text-sm">
                      <span class="text-text-secondary">Completado</span>
                      <span class="text-text-primary">{{ progressPercentage }}%</span>
                    </div>
                    <RadialProgress 
                      :value="progressPercentage" 
                      :max="100"
                      variant="primary"
                      size="medium"
                      :animated="true"
                      :show-glow="true"
                    />
                  </div>
                </div>

                <!-- Actions -->
                <div class="space-y-3">
                  <NeonButton 
                    v-if="contract.estado === 'abierto'"
                    variant="primary" 
                    class="w-full"
                    @click="viewProposals"
                    :pulse="true"
                  >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-2-2V10a2 2 0 012-2h8z" />
                    </svg>
                    Ver Propuestas
                    <span v-if="contract.propuestas?.length" class="ml-2 px-2 py-0.5 text-xs bg-current/20 rounded-full">
                      {{ contract.propuestas.length }}
                    </span>
                  </NeonButton>

                  <NeonButton 
                    v-if="contract.chatId && isActiveContract"
                    variant="secondary" 
                    class="w-full"
                    @click="openChat"
                  >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Abrir Chat
                  </NeonButton>

                  <NeonButton 
                    v-if="contract.estado === 'entrega_realizada'"
                    variant="accent" 
                    class="w-full"
                    @click="approveWork"
                  >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Aprobar Trabajo
                  </NeonButton>

                  <NeonButton 
                    v-if="canCancel"
                    variant="ghost" 
                    class="w-full text-red-400 hover:text-red-300"
                    @click="cancelContract"
                  >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancelar Contrato
                  </NeonButton>
                </div>
              </div>
            </div>
          </div>
        </HologramCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Contrato } from '../../types'
import { HologramCard, NeonButton, GlitchText, RadialProgress } from '../ui'
import ContractStatusBadge from './ContractStatusBadge.vue'
import ContractTimeline from './ContractTimeline.vue'
import EscrowInfo from './EscrowInfo.vue'

interface Props {
  contract: Contrato
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': []
  'accept-proposal': [proposalId: string]
}>()

// Computed
const isActiveContract = computed(() => {
  return ['abierto', 'esperando_deposito', 'fondos_garantia', 'entrega_realizada'].includes(props.contract.estado)
})

const showEscrowInfo = computed(() => {
  return ['esperando_deposito', 'fondos_garantia', 'entrega_realizada', 'completado'].includes(props.contract.estado)
})

const canCancel = computed(() => {
  return ['abierto', 'esperando_deposito'].includes(props.contract.estado)
})

const progressPercentage = computed(() => {
  const statusProgress = {
    'abierto': 25,
    'esperando_deposito': 40,
    'fondos_garantia': 60,
    'entrega_realizada': 80,
    'completado': 100,
    'cancelado': 0,
    'disputado': 50
  }
  return statusProgress[props.contract.estado] || 0
})

// Methods
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const getFileName = (url: string) => {
  // Extract filename from URL or placeholder
  return url.split('/').pop() || url.replace('placeholder_url_', '')
}

const viewProposals = () => {
  // This will be handled by the parent component
  emit('close')
  // Parent should then open proposals modal
}

const openChat = () => {
  // TODO: Implement chat functionality
  console.log('Opening chat for contract:', props.contract.id)
}

const approveWork = () => {
  // TODO: Implement work approval
  console.log('Approving work for contract:', props.contract.id)
}

const cancelContract = () => {
  // TODO: Implement contract cancellation
  console.log('Canceling contract:', props.contract.id)
}
</script>