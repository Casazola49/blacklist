<template>
  <div class="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
    <!-- Demo Mode Banner -->
    <div v-if="isDemoMode" class="bg-yellow-600 text-white py-2 px-4 text-center">
      <span class="font-semibold">🎭 MODO DEMO ACTIVO</span>
      <span class="mx-2">|</span>
      <span class="text-sm">Estás navegando sin autenticación</span>
      <button 
        @click="exitDemo" 
        class="ml-4 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors"
      >
        Salir del Demo
      </button>
    </div>
    
    <!-- Header -->
    <header class="border-b border-brand-primary/20 bg-bg-secondary/50 backdrop-blur-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <GlitchText 
              text="THE BLACKLIST" 
              :active="true" 
              variant="primary" 
              size="text-xl font-bold"
            />
            <div class="h-6 w-px bg-brand-primary/30"></div>
            <span class="text-text-secondary text-sm">Dashboard Cliente</span>
          </div>
          
          <div class="flex items-center space-x-4">
            <span class="text-text-primary">{{ userProfile?.alias }}</span>
            <NeonButton 
              variant="ghost" 
              @click="handleSignOut"
              :loading="authStore.loading"
            >
              Salir
            </NeonButton>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="contractsStore.loading && contracts.length === 0" class="flex justify-center py-12">
        <CyberLoader size="large" text="Cargando dashboard..." />
      </div>

      <!-- Error State -->
      <div v-else-if="contractsStore.error" class="text-center py-12">
        <div class="text-error mb-4">{{ contractsStore.error }}</div>
        <NeonButton @click="loadData" variant="primary">
          Reintentar
        </NeonButton>
      </div>

      <!-- Dashboard Content -->
      <div v-else class="space-y-8">
        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HologramCard variant="primary" :active="true">
            <div class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-text-secondary text-sm">Contratos Activos</p>
                  <AnimatedCounter 
                    :target="activeContracts.length" 
                    class="text-2xl font-bold text-accent-cyan"
                  />
                </div>
                <div class="w-12 h-12 bg-accent-cyan/20 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </HologramCard>

          <HologramCard variant="secondary" :active="true">
            <div class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-text-secondary text-sm">Saldo Escrow</p>
                  <div class="text-2xl font-bold text-accent-magenta">
                    $<AnimatedCounter :target="totalEscrowBalance" :decimals="2" />
                  </div>
                </div>
                <div class="w-12 h-12 bg-accent-magenta/20 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-accent-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
          </HologramCard>

          <HologramCard variant="accent" :active="true">
            <div class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-text-secondary text-sm">Completados</p>
                  <AnimatedCounter 
                    :target="completedContracts.length" 
                    class="text-2xl font-bold text-brand-primary"
                  />
                </div>
                <div class="w-12 h-12 bg-brand-primary/20 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </HologramCard>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-4">
          <NeonButton 
            variant="primary" 
            :pulse="true"
            @click="showCreateContract = true"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Contrato
          </NeonButton>
          
          <NeonButton 
            variant="secondary"
            @click="loadData"
            :loading="contractsStore.loading"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </NeonButton>
        </div>

        <!-- Contracts Tabs -->
        <div class="space-y-6">
          <!-- Tab Navigation -->
          <div class="flex space-x-1 bg-bg-secondary/50 p-1 rounded-lg backdrop-blur-sm">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-brand-primary text-white shadow-glow-brand'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
              ]"
            >
              {{ tab.label }}
              <span v-if="tab.count !== undefined" class="ml-2 px-2 py-0.5 text-xs rounded-full bg-current/20">
                {{ tab.count }}
              </span>
            </button>
          </div>

          <!-- Tab Content -->
          <div class="min-h-[400px]">
            <!-- Active Contracts Tab -->
            <div v-if="activeTab === 'active'" class="space-y-4">
              <ContractsList 
                :contracts="activeContracts"
                @view-contract="viewContract"
                @view-proposals="viewProposals"
                @approve-work="handleApproveWork"
              />
            </div>

            <!-- Completed Contracts Tab -->
            <div v-if="activeTab === 'completed'" class="space-y-4">
              <ContractsList 
                :contracts="completedContracts"
                @view-contract="viewContract"
                show-ratings
              />
            </div>

            <!-- All Contracts Tab -->
            <div v-if="activeTab === 'all'" class="space-y-4">
              <ContractsList 
                :contracts="contracts"
                @view-contract="viewContract"
                @view-proposals="viewProposals"
                @approve-work="handleApproveWork"
              />
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Create Contract Modal -->
    <CreateContractModal 
      v-if="showCreateContract"
      @close="showCreateContract = false"
      @created="handleContractCreated"
    />

    <!-- Contract Details Modal -->
    <ContractDetailsModal 
      v-if="selectedContract"
      :contract="selectedContract"
      @close="selectedContract = null"
      @accept-proposal="handleAcceptProposal"
    />

    <!-- Proposals Modal -->
    <ProposalsModal 
      v-if="showProposals && selectedContract"
      :contract="selectedContract"
      :proposals="proposals"
      @close="showProposals = false"
      @accept-proposal="handleAcceptProposal"
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useContractsStore } from '../stores/contracts'
import { useRatingModal } from '../composables/useRatingModal'
import { useDemoMode } from '../composables/useDemoMode'
import type { Contrato } from '../types'

// UI Components
import { GlitchText, NeonButton, HologramCard, CyberLoader, AnimatedCounter } from '../components/ui'

// Dashboard Components
import ContractsList from '../components/dashboard/ContractsList.vue'
import CreateContractModal from '../components/dashboard/CreateContractModal.vue'
import ContractDetailsModal from '../components/dashboard/ContractDetailsModal.vue'
import ProposalsModal from '../components/dashboard/ProposalsModal.vue'
import RatingModal from '../components/dashboard/RatingModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const contractsStore = useContractsStore()
const ratingModal = useRatingModal()
const { isDemoMode, exitDemoMode } = useDemoMode()

// Reactive state
const activeTab = ref('active')
const showCreateContract = ref(false)
const selectedContract = ref<Contrato | null>(null)
const showProposals = ref(false)

// Demo mode handler
const exitDemo = () => {
  exitDemoMode()
}

// Subscriptions
let contractsUnsubscribe: (() => void) | null = null

// Computed
const userProfile = computed(() => authStore.userProfile)
const contracts = computed(() => contractsStore.contracts)
const activeContracts = computed(() => contractsStore.activeContracts)
const completedContracts = computed(() => contractsStore.completedContracts)
const totalEscrowBalance = computed(() => contractsStore.totalEscrowBalance)
const proposals = computed(() => contractsStore.proposals)

const tabs = computed(() => [
  { id: 'active', label: 'Activos', count: activeContracts.value.length },
  { id: 'completed', label: 'Completados', count: completedContracts.value.length },
  { id: 'all', label: 'Todos', count: contracts.value.length }
])

// Methods
const loadData = async () => {
  if (!userProfile.value) return
  
  try {
    await Promise.all([
      contractsStore.loadClientContracts(userProfile.value.uid),
      contractsStore.loadEscrowTransactions(userProfile.value.uid)
    ])
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
}

const handleSignOut = async () => {
  try {
    await authStore.signOut()
    router.push('/')
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

const viewContract = (contract: Contrato) => {
  selectedContract.value = contract
  contractsStore.setCurrentContract(contract)
}

const viewProposals = async (contract: Contrato) => {
  selectedContract.value = contract
  contractsStore.setCurrentContract(contract)
  await contractsStore.loadContractProposals(contract.id)
  showProposals.value = true
}

const handleContractCreated = () => {
  showCreateContract.value = false
  loadData() // Reload data to show new contract
}

const handleApproveWork = async (contract: Contrato) => {
  try {
    const { ContractsService } = await import('../services/contracts')
    await ContractsService.approveWork(contract.id)
    await loadData() // Reload to show updated state
  } catch (error) {
    console.error('Error approving work:', error)
  }
}

const handleAcceptProposal = async (proposalId: string) => {
  if (!selectedContract.value) return
  
  try {
    await contractsStore.acceptProposal(proposalId, selectedContract.value.id)
    showProposals.value = false
    selectedContract.value = null
    await loadData() // Reload to show updated state
  } catch (error) {
    console.error('Error accepting proposal:', error)
  }
}

// Watch for contract changes to check for pending ratings
watch(() => contractsStore.contracts, (contracts) => {
  if (contracts.length > 0) {
    ratingModal.checkPendingRatings(contracts)
  }
}, { deep: true })

// Lifecycle
onMounted(async () => {
  // In demo mode, skip authentication check
  if (isDemoMode.value) {
    console.log('Demo mode active - skipping data load')
    return
  }
  
  if (!userProfile.value) {
    router.push('/auth')
    return
  }

  await loadData()
  
  // Set up real-time subscription
  contractsUnsubscribe = contractsStore.subscribeToClientContracts(userProfile.value.uid)
  
  // Check for pending ratings
  ratingModal.checkPendingRatings(contractsStore.contracts)
})

onUnmounted(() => {
  if (contractsUnsubscribe) {
    contractsUnsubscribe()
  }
})
</script>

<style scoped>
.shadow-glow-brand {
  box-shadow: 0 0 20px var(--brand-primary);
}
</style>