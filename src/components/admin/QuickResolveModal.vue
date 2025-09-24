<template>
  <div class="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-gray-900 border border-yellow-500/30 rounded-lg max-w-2xl w-full">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-yellow-500/30 bg-yellow-900/10">
        <div>
          <h3 class="text-xl font-bold text-white">
            <GlitchText text="Resolución Rápida" />
          </h3>
          <p class="text-yellow-300 text-sm mt-1">{{ contract.titulo }}</p>
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
        <!-- Contract Summary -->
        <HologramCard class="p-4">
          <h4 class="text-lg font-semibold text-white mb-3">Resumen del Contrato</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-gray-400">Cliente:</span>
                <span class="text-white">{{ getClientAlias(contract.clienteId) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Especialista:</span>
                <span class="text-white">{{ getSpecialistAlias(contract.especialistaId!) }}</span>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-gray-400">Valor:</span>
                <span class="text-white font-bold">${{ contract.precioFinal || contract.presupuestoSugerido }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Creado:</span>
                <span class="text-white">{{ formatDate(contract.fechaCreacion) }}</span>
              </div>
            </div>
          </div>
        </HologramCard>

        <!-- Warning -->
        <div class="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
          <div class="flex items-start space-x-3">
            <div class="text-yellow-400 text-xl">⚠️</div>
            <div>
              <h5 class="text-yellow-300 font-medium mb-1">Resolución Permanente</h5>
              <p class="text-gray-300 text-sm">
                Esta acción es irreversible. Una vez que resuelvas la disputa, 
                los fondos serán transferidos inmediatamente y no se podrán recuperar.
              </p>
            </div>
          </div>
        </div>

        <!-- Resolution Options -->
        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-white">Selecciona la Resolución</h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Client Resolution -->
            <div 
              @click="selectedResolution = 'client'"
              :class="[
                'p-4 border-2 rounded-lg cursor-pointer transition-all',
                selectedResolution === 'client' 
                  ? 'border-blue-500 bg-blue-900/20' 
                  : 'border-gray-600 hover:border-blue-400'
              ]"
            >
              <div class="flex items-center space-x-3 mb-3">
                <div class="w-3 h-3 rounded-full border-2 border-blue-400 flex items-center justify-center">
                  <div v-if="selectedResolution === 'client'" class="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                </div>
                <h5 class="text-blue-300 font-medium">Resolver a favor del Cliente</h5>
              </div>
              
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-400">Reembolso al cliente:</span>
                  <span class="text-white font-bold">${{ contract.precioFinal || contract.presupuestoSugerido }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Pago al especialista:</span>
                  <span class="text-gray-500">$0</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Comisión plataforma:</span>
                  <span class="text-gray-500">$0</span>
                </div>
              </div>
              
              <p class="text-gray-400 text-xs mt-3">
                El cliente recibirá un reembolso completo. El especialista no recibirá pago.
              </p>
            </div>

            <!-- Specialist Resolution -->
            <div 
              @click="selectedResolution = 'specialist'"
              :class="[
                'p-4 border-2 rounded-lg cursor-pointer transition-all',
                selectedResolution === 'specialist' 
                  ? 'border-purple-500 bg-purple-900/20' 
                  : 'border-gray-600 hover:border-purple-400'
              ]"
            >
              <div class="flex items-center space-x-3 mb-3">
                <div class="w-3 h-3 rounded-full border-2 border-purple-400 flex items-center justify-center">
                  <div v-if="selectedResolution === 'specialist'" class="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                </div>
                <h5 class="text-purple-300 font-medium">Resolver a favor del Especialista</h5>
              </div>
              
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-400">Reembolso al cliente:</span>
                  <span class="text-gray-500">$0</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Pago al especialista:</span>
                  <span class="text-white font-bold">${{ netSpecialistAmount }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Comisión plataforma (15%):</span>
                  <span class="text-white">${{ platformCommission }}</span>
                </div>
              </div>
              
              <p class="text-gray-400 text-xs mt-3">
                El especialista recibirá el pago menos la comisión. El cliente no recibirá reembolso.
              </p>
            </div>
          </div>
        </div>

        <!-- Reason Input -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Razón de la Resolución (Opcional)
          </label>
          <textarea
            v-model="resolutionReason"
            rows="3"
            class="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
            placeholder="Explica brevemente por qué tomaste esta decisión..."
          ></textarea>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-700">
          <NeonButton @click="$emit('close')" variant="secondary">
            Cancelar
          </NeonButton>
          
          <NeonButton 
            @click="confirmResolution"
            :disabled="!selectedResolution"
            :variant="selectedResolution === 'client' ? 'primary' : 'success'"
          >
            {{ selectedResolution === 'client' ? 'Reembolsar Cliente' : 'Liberar Fondos' }}
          </NeonButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAdminStore } from '../../stores/admin'
import type { Contrato } from '../../types'
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
const selectedResolution = ref<'client' | 'specialist' | null>(null)
const resolutionReason = ref('')

const contractAmount = computed(() => props.contract.precioFinal || props.contract.presupuestoSugerido)
const platformCommission = computed(() => Math.round(contractAmount.value * 0.15))
const netSpecialistAmount = computed(() => contractAmount.value - platformCommission.value)

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

const confirmResolution = () => {
  if (!selectedResolution.value) return

  const action = selectedResolution.value === 'client' ? 'reembolsar al cliente' : 'liberar fondos al especialista'
  const confirmMessage = `¿Estás seguro de ${action}? Esta acción no se puede deshacer.`
  
  if (confirm(confirmMessage)) {
    emit('resolve', props.contract.id, selectedResolution.value)
  }
}
</script>