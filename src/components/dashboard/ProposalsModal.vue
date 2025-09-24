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
              <div>
                <GlitchText 
                  text="PROPUESTAS RECIBIDAS" 
                  :active="true" 
                  variant="primary" 
                  size="text-xl font-bold"
                />
                <p class="text-text-secondary text-sm mt-1">
                  {{ contract.titulo }}
                </p>
                <div class="flex items-center space-x-4 mt-2">
                  <ContractStatusBadge :status="contract.estado" />
                  <span class="text-text-muted text-sm">
                    {{ proposals.length }} propuesta{{ proposals.length !== 1 ? 's' : '' }}
                  </span>
                </div>
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

            <!-- Loading State -->
            <div v-if="loading" class="flex justify-center py-12">
              <CyberLoader size="medium" text="Cargando propuestas..." />
            </div>

            <!-- Empty State -->
            <div v-else-if="proposals.length === 0" class="text-center py-12">
              <div class="w-16 h-16 mx-auto mb-4 bg-bg-tertiary rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-2-2V10a2 2 0 012-2h8z" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-text-primary mb-2">No hay propuestas aún</h3>
              <p class="text-text-secondary">Los especialistas comenzarán a enviar propuestas pronto</p>
            </div>

            <!-- Proposals List -->
            <div v-else class="space-y-4">
              <div
                v-for="proposal in sortedProposals"
                :key="proposal.id"
                class="border border-brand-primary/20 rounded-lg overflow-hidden hover:border-accent-cyan/50 transition-colors"
              >
                <div class="p-6">
                  <!-- Proposal Header -->
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center space-x-4">
                      <div class="w-12 h-12 bg-gradient-to-br from-accent-cyan to-accent-magenta rounded-full flex items-center justify-center">
                        <span class="text-white font-bold text-lg">
                          {{ getSpecialistInitial(proposal.especialistaId) }}
                        </span>
                      </div>
                      <div>
                        <h4 class="font-semibold text-text-primary">
                          Especialista {{ maskSpecialistId(proposal.especialistaId) }}
                        </h4>
                        <div class="flex items-center space-x-4 text-sm text-text-secondary">
                          <span>{{ formatDate(proposal.fechaEnvio) }}</span>
                          <ProposalStatusBadge :status="proposal.estado" />
                        </div>
                      </div>
                    </div>
                    
                    <div class="text-right">
                      <div class="text-2xl font-bold text-accent-cyan">
                        ${{ proposal.precio }}
                      </div>
                      <div class="text-sm text-text-secondary">
                        {{ getPriceDifference(proposal.precio) }}
                      </div>
                    </div>
                  </div>

                  <!-- Proposal Message -->
                  <div class="mb-4">
                    <h5 class="text-sm font-medium text-text-primary mb-2">Mensaje del Especialista:</h5>
                    <div class="p-4 bg-bg-tertiary rounded-lg">
                      <p class="text-text-primary whitespace-pre-wrap">{{ proposal.mensaje }}</p>
                    </div>
                  </div>

                  <!-- Specialist Stats (Mock data for now) -->
                  <div class="grid grid-cols-3 gap-4 mb-4 p-4 bg-bg-secondary rounded-lg">
                    <div class="text-center">
                      <div class="text-lg font-bold text-accent-cyan">{{ getRandomRating() }}</div>
                      <div class="text-xs text-text-secondary">Calificación</div>
                    </div>
                    <div class="text-center">
                      <div class="text-lg font-bold text-accent-magenta">{{ getRandomCompletedJobs() }}</div>
                      <div class="text-xs text-text-secondary">Trabajos</div>
                    </div>
                    <div class="text-center">
                      <div class="text-lg font-bold text-brand-primary">{{ getRandomResponseTime() }}h</div>
                      <div class="text-xs text-text-secondary">Respuesta</div>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex justify-end space-x-3">
                    <NeonButton 
                      variant="ghost"
                      size="sm"
                      @click="viewSpecialistProfile(proposal.especialistaId)"
                    >
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Ver Perfil
                    </NeonButton>

                    <NeonButton 
                      v-if="proposal.estado === 'pendiente'"
                      variant="secondary"
                      size="sm"
                      @click="rejectProposal(proposal.id)"
                      :loading="actionLoading === proposal.id"
                    >
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Rechazar
                    </NeonButton>

                    <NeonButton 
                      v-if="proposal.estado === 'pendiente'"
                      variant="primary"
                      size="sm"
                      @click="acceptProposal(proposal)"
                      :loading="actionLoading === proposal.id"
                      :pulse="true"
                    >
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Aceptar
                    </NeonButton>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex justify-between items-center pt-6 border-t border-brand-primary/20 mt-6">
              <div class="text-sm text-text-secondary">
                Las propuestas se actualizan en tiempo real
              </div>
              <NeonButton variant="ghost" @click="$emit('close')">
                Cerrar
              </NeonButton>
            </div>
          </div>
        </HologramCard>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmationModal
      v-if="showConfirmation"
      :title="confirmationTitle"
      :message="confirmationMessage"
      :loading="confirmationLoading"
      @confirm="handleConfirmation"
      @cancel="showConfirmation = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Contrato, Propuesta } from '../../types'
import { HologramCard, NeonButton, GlitchText, CyberLoader } from '../ui'
import ContractStatusBadge from './ContractStatusBadge.vue'
import ProposalStatusBadge from './ProposalStatusBadge.vue'
import ConfirmationModal from './ConfirmationModal.vue'

interface Props {
  contract: Contrato
  proposals: Propuesta[]
  loading?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': []
  'accept-proposal': [proposalId: string]
}>()

// State
const actionLoading = ref<string | null>(null)
const showConfirmation = ref(false)
const confirmationTitle = ref('')
const confirmationMessage = ref('')
const confirmationLoading = ref(false)
const pendingAction = ref<(() => void) | null>(null)

// Computed
const sortedProposals = computed(() => {
  return [...props.proposals].sort((a, b) => {
    // Sort by status (pending first) then by price (lowest first)
    if (a.estado !== b.estado) {
      if (a.estado === 'pendiente') return -1
      if (b.estado === 'pendiente') return 1
    }
    return a.precio - b.precio
  })
})

// Methods
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const maskSpecialistId = (id: string) => {
  // Create a masked version of the specialist ID for privacy
  return `***${id.slice(-4)}`
}

const getSpecialistInitial = (id: string) => {
  // Generate a consistent initial based on ID
  const charCode = id.charCodeAt(0) % 26
  return String.fromCharCode(65 + charCode) // A-Z
}

const getPriceDifference = (price: number) => {
  const difference = price - props.contract.presupuestoSugerido
  if (difference > 0) {
    return `+$${difference} del presupuesto`
  } else if (difference < 0) {
    return `-$${Math.abs(difference)} del presupuesto`
  }
  return 'Igual al presupuesto'
}

// Mock data generators (in real app, this would come from specialist profiles)
const getRandomRating = () => {
  return (4.0 + Math.random() * 1.0).toFixed(1)
}

const getRandomCompletedJobs = () => {
  return Math.floor(Math.random() * 50) + 5
}

const getRandomResponseTime = () => {
  return Math.floor(Math.random() * 12) + 1
}

const viewSpecialistProfile = (specialistId: string) => {
  // TODO: Implement specialist profile view
  console.log('Viewing specialist profile:', specialistId)
}

const acceptProposal = (proposal: Propuesta) => {
  confirmationTitle.value = 'Aceptar Propuesta'
  confirmationMessage.value = `¿Estás seguro de que quieres aceptar la propuesta de $${proposal.precio}? Esto iniciará el proceso de depósito en garantía.`
  pendingAction.value = () => {
    emit('accept-proposal', proposal.id)
  }
  showConfirmation.value = true
}

const rejectProposal = (proposalId: string) => {
  confirmationTitle.value = 'Rechazar Propuesta'
  confirmationMessage.value = '¿Estás seguro de que quieres rechazar esta propuesta? Esta acción no se puede deshacer.'
  pendingAction.value = () => {
    // TODO: Implement proposal rejection
    console.log('Rejecting proposal:', proposalId)
  }
  showConfirmation.value = true
}

const handleConfirmation = async () => {
  if (pendingAction.value) {
    confirmationLoading.value = true
    try {
      await pendingAction.value()
      showConfirmation.value = false
    } catch (error) {
      console.error('Error executing action:', error)
    } finally {
      confirmationLoading.value = false
      pendingAction.value = null
    }
  }
}
</script>