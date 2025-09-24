<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-white">
          <GlitchText text="Centro de Resolución de Disputas" />
        </h2>
        <p class="text-gray-400 mt-1">Resolver conflictos entre clientes y especialistas</p>
      </div>
      
      <div class="flex items-center space-x-4">
        <div class="text-sm text-gray-300">
          {{ disputedContracts.length }} disputa{{ disputedContracts.length !== 1 ? 's' : '' }} activa{{ disputedContracts.length !== 1 ? 's' : '' }}
        </div>
      </div>
    </div>

    <!-- No Disputes -->
    <div v-if="disputedContracts.length === 0" class="text-center py-12">
      <HologramCard class="p-8 max-w-md mx-auto">
        <div class="text-6xl mb-4">✅</div>
        <h3 class="text-xl font-bold text-white mb-2">Sin Disputas Activas</h3>
        <p class="text-gray-400">
          Excelente trabajo manteniendo la plataforma funcionando sin problemas.
        </p>
      </HologramCard>
    </div>

    <!-- Disputes List -->
    <div v-else class="space-y-4">
      <div 
        v-for="contract in disputedContracts" 
        :key="contract.id"
        class="border border-red-500/30 rounded-lg overflow-hidden"
      >
        <HologramCard class="p-0">
          <!-- Dispute Header -->
          <div class="bg-red-900/20 p-4 border-b border-red-500/30">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-lg font-bold text-white mb-1">{{ contract.titulo }}</h3>
                <p class="text-sm text-gray-400 mb-2">{{ contract.descripcion.slice(0, 100) }}...</p>
                <div class="flex items-center space-x-4 text-sm">
                  <span class="text-gray-400">
                    💰 ${{ contract.precioFinal || contract.presupuestoSugerido }}
                  </span>
                  <span class="text-gray-400">
                    📅 {{ formatDate(contract.fechaCreacion) }}
                  </span>
                  <span class="px-2 py-1 bg-red-900/30 text-red-300 rounded-full text-xs">
                    DISPUTADO
                  </span>
                </div>
              </div>
              <div class="flex space-x-2">
                <NeonButton 
                  @click="viewDisputeDetails(contract)"
                  size="sm" 
                  variant="secondary"
                >
                  Ver Detalles
                </NeonButton>
                <NeonButton 
                  @click="quickResolve(contract)"
                  size="sm" 
                  variant="warning"
                >
                  Resolver
                </NeonButton>
              </div>
            </div>
          </div>

          <!-- Participants -->
          <div class="p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Client -->
              <div class="p-3 bg-blue-900/10 border border-blue-500/30 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-blue-300">Cliente</span>
                  <span class="px-2 py-1 text-xs bg-blue-900/30 text-blue-300 rounded-full">
                    Demandante
                  </span>
                </div>
                <div class="space-y-1">
                  <div class="text-white font-medium">{{ getClientAlias(contract.clienteId) }}</div>
                  <div class="text-sm text-gray-400">{{ contract.clienteId.slice(0, 16) }}...</div>
                </div>
              </div>

              <!-- Specialist -->
              <div v-if="contract.especialistaId" class="p-3 bg-purple-900/10 border border-purple-500/30 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-purple-300">Especialista</span>
                  <span class="px-2 py-1 text-xs bg-purple-900/30 text-purple-300 rounded-full">
                    Demandado
                  </span>
                </div>
                <div class="space-y-1">
                  <div class="text-white font-medium">{{ getSpecialistAlias(contract.especialistaId) }}</div>
                  <div class="text-sm text-gray-400">{{ contract.especialistaId.slice(0, 16) }}...</div>
                  <div class="text-sm text-gray-400">
                    ⭐ {{ getSpecialistRating(contract.especialistaId) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="mt-4 pt-4 border-t border-gray-700">
              <div class="flex justify-between items-center">
                <div class="text-sm text-gray-400">
                  Acciones rápidas para resolver la disputa:
                </div>
                <div class="flex space-x-2">
                  <NeonButton 
                    @click="resolveForClient(contract.id)"
                    size="sm" 
                    variant="primary"
                  >
                    👤 Cliente
                  </NeonButton>
                  <NeonButton 
                    @click="resolveForSpecialist(contract.id)"
                    size="sm" 
                    variant="success"
                  >
                    👨‍💼 Especialista
                  </NeonButton>
                </div>
              </div>
            </div>
          </div>
        </HologramCard>
      </div>
    </div>

    <!-- Dispute Details Modal -->
    <DisputeDetailsModal 
      v-if="selectedDispute"
      :contract="selectedDispute"
      @close="selectedDispute = null"
      @resolve="handleResolveDispute"
    />

    <!-- Quick Resolve Modal -->
    <QuickResolveModal 
      v-if="quickResolveContract"
      :contract="quickResolveContract"
      @close="quickResolveContract = null"
      @resolve="handleResolveDispute"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '../../stores/admin'
import type { Contrato } from '../../types'
import HologramCard from '../ui/HologramCard.vue'
import GlitchText from '../ui/GlitchText.vue'
import NeonButton from '../ui/NeonButton.vue'
import DisputeDetailsModal from './DisputeDetailsModal.vue'
import QuickResolveModal from './QuickResolveModal.vue'

const adminStore = useAdminStore()
const selectedDispute = ref<Contrato | null>(null)
const quickResolveContract = ref<Contrato | null>(null)

const disputedContracts = computed(() => adminStore.disputedContracts)

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

const getClientAlias = (clientId: string) => {
  const client = adminStore.clients.find(c => c.uid === clientId)
  return client?.alias || 'Cliente Desconocido'
}

const getSpecialistAlias = (specialistId: string) => {
  const specialist = adminStore.specialists.find(s => s.uid === specialistId)
  return specialist?.alias || 'Especialista Desconocido'
}

const getSpecialistRating = (specialistId: string) => {
  const specialist = adminStore.specialists.find(s => s.uid === specialistId)
  return specialist?.calificacionPromedio.toFixed(1) || '0.0'
}

const viewDisputeDetails = (contract: Contrato) => {
  selectedDispute.value = contract
}

const quickResolve = (contract: Contrato) => {
  quickResolveContract.value = contract
}

const resolveForClient = (contractId: string) => {
  if (confirm('¿Estás seguro de resolver la disputa a favor del cliente? Los fondos serán reembolsados.')) {
    handleResolveDispute(contractId, 'client')
  }
}

const resolveForSpecialist = (contractId: string) => {
  if (confirm('¿Estás seguro de resolver la disputa a favor del especialista? Los fondos serán liberados.')) {
    handleResolveDispute(contractId, 'specialist')
  }
}

const handleResolveDispute = async (contractId: string, resolution: 'client' | 'specialist') => {
  try {
    await adminStore.resolveDispute(contractId, resolution)
    selectedDispute.value = null
    quickResolveContract.value = null
  } catch (error) {
    console.error('Error resolving dispute:', error)
  }
}

onMounted(async () => {
  if (adminStore.contracts.length === 0) {
    try {
      await adminStore.loadContracts()
    } catch (error) {
      console.error('Error loading contracts:', error)
    }
  }
})
</script>