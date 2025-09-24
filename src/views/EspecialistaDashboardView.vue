<template>
  <div class="especialista-dashboard min-h-screen bg-primary">
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <GlitchText text="DASHBOARD ESPECIALISTA" class="text-3xl mb-2" />
          <p class="text-text-secondary">
            Bienvenido, {{ authStore.userProfile?.alias }}
          </p>
        </div>
        <NeonButton variant="ghost" @click="signOut">
          Cerrar Sesión
        </NeonButton>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <HologramCard variant="secondary">
          <div class="p-4">
            <h3 class="text-sm font-medium text-text-secondary mb-2">Ganancias del Mes</h3>
            <div class="flex items-center">
              <AnimatedCounter 
                :target="specialistStore.earnings.thisMonth" 
                prefix="$" 
                class="text-2xl font-bold text-accent-cyan"
              />
            </div>
          </div>
        </HologramCard>
        
        <HologramCard variant="secondary">
          <div class="p-4">
            <h3 class="text-sm font-medium text-text-secondary mb-2">Ganancias Totales</h3>
            <div class="flex items-center">
              <AnimatedCounter 
                :target="specialistStore.earnings.total" 
                prefix="$" 
                class="text-2xl font-bold text-success"
              />
            </div>
          </div>
        </HologramCard>
        
        <HologramCard variant="secondary">
          <div class="p-4">
            <h3 class="text-sm font-medium text-text-secondary mb-2">Contratos Activos</h3>
            <div class="flex items-center">
              <AnimatedCounter 
                :target="specialistStore.activeContracts.length" 
                class="text-2xl font-bold text-accent-magenta"
              />
            </div>
          </div>
        </HologramCard>
        
        <HologramCard variant="secondary">
          <div class="p-4">
            <h3 class="text-sm font-medium text-text-secondary mb-2">Calificación</h3>
            <div class="flex items-center space-x-2">
              <span class="text-2xl">⭐</span>
              <span class="text-2xl font-bold text-warning">
                {{ (authStore.userProfile as any)?.calificacionPromedio?.toFixed(1) || 'N/A' }}
              </span>
            </div>
            <div class="text-xs text-text-secondary mt-1">
              {{ (authStore.userProfile as any)?.trabajosCompletados || 0 }} trabajos
            </div>
          </div>
        </HologramCard>
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Left Column: Assigned Contracts -->
        <div>
          <AssignedContractsList 
            :assignedContracts="specialistStore.activeContracts"
            @view-contract="viewContract"
            @open-chat="openChat"
            @deliver-work="openDeliverWorkModal"
          />
        </div>

        <!-- Right Column: Opportunities Feed -->
        <div>
          <OpportunitiesFeed 
            :availableContracts="specialistStore.availableContracts"
            :loading="specialistStore.loading"
            :hasProposedToContract="specialistStore.hasProposedToContract"
            :getContractProposal="specialistStore.getContractProposal"
            @view-contract="viewContract"
            @send-proposal="openProposalModal"
            @view-proposal="viewProposal"
          />
        </div>
      </div>

      <!-- Completed Contracts Section -->
      <div v-if="specialistStore.completedContracts.length > 0" class="mt-8">
        <HologramCard variant="secondary">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <GlitchText text="TRABAJOS COMPLETADOS" class="text-lg" />
              <span class="text-sm text-text-secondary">
                {{ specialistStore.completedContracts.length }} completado{{ specialistStore.completedContracts.length !== 1 ? 's' : '' }}
              </span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div 
                v-for="contract in specialistStore.completedContracts.slice(0, 6)" 
                :key="contract.id"
                class="p-4 bg-bg-secondary rounded-lg border border-success/20"
              >
                <h4 class="font-semibold text-text-primary mb-1">{{ contract.titulo }}</h4>
                <div class="text-sm text-text-secondary mb-2">
                  Completado: {{ formatDate(contract.fechaCompletado!) }}
                </div>
                <div class="text-success font-semibold">
                  ${{ contract.precioFinal }}
                </div>
              </div>
            </div>
          </div>
        </HologramCard>
      </div>
    </div>

    <!-- Modals -->
    <SendProposalModal 
      :isOpen="showProposalModal"
      :contract="selectedContract"
      :loading="specialistStore.loading"
      @close="closeProposalModal"
      @submit="submitProposal"
    />

    <DeliverWorkModal 
      :isOpen="showDeliverWorkModal"
      :contract="selectedContract"
      :loading="specialistStore.loading"
      @close="closeDeliverWorkModal"
      @submit="submitDelivery"
    />

    <ContractDetailsModal 
      v-if="selectedContract"
      :isOpen="showContractModal"
      :contract="selectedContract"
      @close="closeContractModal"
    />

    <!-- Rating Modal -->
    <RatingModal 
      :is-open="ratingModal.isRatingModalOpen.value"
      :contract="ratingModal.contractToRate.value"
      @close="ratingModal.closeRatingModal"
      @rating-submitted="ratingModal.onRatingSubmitted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useSpecialistStore } from '../stores/specialist'
import { useRatingModal } from '../composables/useRatingModal'
import type { Contrato } from '../types'
import GlitchText from '../components/ui/GlitchText.vue'
import NeonButton from '../components/ui/NeonButton.vue'
import HologramCard from '../components/ui/HologramCard.vue'
import AnimatedCounter from '../components/ui/AnimatedCounter.vue'
import AssignedContractsList from '../components/dashboard/AssignedContractsList.vue'
import OpportunitiesFeed from '../components/dashboard/OpportunitiesFeed.vue'
import SendProposalModal from '../components/dashboard/SendProposalModal.vue'
import DeliverWorkModal from '../components/dashboard/DeliverWorkModal.vue'
import ContractDetailsModal from '../components/dashboard/ContractDetailsModal.vue'
import RatingModal from '../components/dashboard/RatingModal.vue'

const authStore = useAuthStore()
const specialistStore = useSpecialistStore()
const ratingModal = useRatingModal()

// Modal states
const showProposalModal = ref(false)
const showDeliverWorkModal = ref(false)
const showContractModal = ref(false)
const selectedContract = ref<Contrato | null>(null)

// Real-time subscription
let unsubscribeFromContracts: (() => void) | null = null

onMounted(async () => {
  if (authStore.userProfile?.uid) {
    try {
      await specialistStore.loadSpecialistData(authStore.userProfile.uid)
      
      // Subscribe to real-time updates for opportunities
      unsubscribeFromContracts = specialistStore.subscribeToOpenContracts()
      
      // Check for pending ratings
      const allContracts = [...specialistStore.activeContracts, ...specialistStore.completedContracts]
      ratingModal.checkPendingRatings(allContracts)
    } catch (error) {
      console.error('Error loading specialist data:', error)
    }
  }
})

// Watch for contract changes to check for pending ratings
watch(() => [...specialistStore.activeContracts, ...specialistStore.completedContracts], (contracts) => {
  if (contracts.length > 0) {
    ratingModal.checkPendingRatings(contracts)
  }
}, { deep: true })

onUnmounted(() => {
  if (unsubscribeFromContracts) {
    unsubscribeFromContracts()
  }
})

// Actions
const signOut = async () => {
  try {
    await authStore.signOut()
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

const viewContract = (contract: Contrato) => {
  selectedContract.value = contract
  showContractModal.value = true
}

const openProposalModal = (contract: Contrato) => {
  selectedContract.value = contract
  showProposalModal.value = true
}

const closeProposalModal = () => {
  showProposalModal.value = false
  selectedContract.value = null
}

const submitProposal = async (data: { precio: number; mensaje: string; tiempoEstimado?: string }) => {
  if (!selectedContract.value || !authStore.userProfile?.uid) return

  try {
    await specialistStore.submitProposal(
      selectedContract.value.id,
      data.precio,
      data.mensaje,
      authStore.userProfile.uid
    )
    closeProposalModal()
  } catch (error) {
    console.error('Error submitting proposal:', error)
  }
}

const openDeliverWorkModal = (contract: Contrato) => {
  selectedContract.value = contract
  showDeliverWorkModal.value = true
}

const closeDeliverWorkModal = () => {
  showDeliverWorkModal.value = false
  selectedContract.value = null
}

const submitDelivery = async (data: { mensaje: string; archivos: File[] }) => {
  if (!selectedContract.value) return

  try {
    // TODO: Handle file uploads to Firebase Storage
    await specialistStore.deliverWork(selectedContract.value.id, data.mensaje)
    closeDeliverWorkModal()
  } catch (error) {
    console.error('Error delivering work:', error)
  }
}

const openChat = (contract: Contrato) => {
  // TODO: Implement chat functionality
  console.log('Opening chat for contract:', contract.id)
}

const viewProposal = (contract: Contrato) => {
  const proposal = specialistStore.getContractProposal(contract.id)
  console.log('Viewing proposal:', proposal)
  // TODO: Show proposal details modal
}

const closeContractModal = () => {
  showContractModal.value = false
  selectedContract.value = null
}

// Helper functions
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}
</script>