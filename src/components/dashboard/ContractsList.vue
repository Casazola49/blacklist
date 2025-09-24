<template>
  <div class="space-y-4">
    <!-- Empty State -->
    <div v-if="contracts.length === 0" class="text-center py-12">
      <div class="w-16 h-16 mx-auto mb-4 bg-bg-tertiary rounded-full flex items-center justify-center">
        <svg class="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-text-primary mb-2">No hay contratos</h3>
      <p class="text-text-secondary">Crea tu primer contrato para comenzar</p>
    </div>

    <!-- Contracts List -->
    <div v-else class="grid gap-4">
      <HologramCard 
        v-for="contract in contracts" 
        :key="contract.id"
        variant="secondary"
        :active="false"
        class="hover:scale-[1.02] transition-transform duration-200"
      >
        <div class="p-6">
          <!-- Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-text-primary mb-1">
                {{ contract.titulo }}
              </h3>
              <p class="text-text-secondary text-sm line-clamp-2">
                {{ contract.descripcion }}
              </p>
            </div>
            
            <div class="ml-4 flex flex-col items-end space-y-2">
              <ContractStatusBadge :status="contract.estado" />
              <div class="text-right">
                <div class="text-sm text-text-secondary">Presupuesto</div>
                <div class="text-lg font-bold text-accent-cyan">
                  ${{ contract.precioFinal || contract.presupuestoSugerido }}
                </div>
              </div>
            </div>
          </div>

          <!-- Details -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
            <div>
              <span class="text-text-secondary">Tipo:</span>
              <div class="text-text-primary capitalize">{{ contract.tipoServicio }}</div>
            </div>
            <div>
              <span class="text-text-secondary">Fecha límite:</span>
              <div class="text-text-primary">{{ formatDate(contract.fechaLimite) }}</div>
            </div>
            <div>
              <span class="text-text-secondary">Creado:</span>
              <div class="text-text-primary">{{ formatDate(contract.fechaCreacion) }}</div>
            </div>
            <div v-if="contract.especialistaId">
              <span class="text-text-secondary">Especialista:</span>
              <div class="text-text-primary">Asignado</div>
            </div>
          </div>

          <!-- Progress Bar for Active Contracts -->
          <div v-if="isActiveContract(contract)" class="mb-4">
            <div class="flex justify-between text-sm text-text-secondary mb-1">
              <span>Progreso</span>
              <span>{{ getProgressPercentage(contract) }}%</span>
            </div>
            <div class="w-full bg-bg-tertiary rounded-full h-2">
              <div 
                class="bg-gradient-to-r from-accent-cyan to-accent-magenta h-2 rounded-full transition-all duration-500"
                :style="{ width: `${getProgressPercentage(contract)}%` }"
              ></div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap gap-2">
            <NeonButton 
              variant="ghost" 
              size="sm"
              @click="$emit('view-contract', contract)"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Ver Detalles
            </NeonButton>

            <NeonButton 
              v-if="contract.estado === 'abierto'"
              variant="primary" 
              size="sm"
              @click="$emit('view-proposals', contract)"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-2-2V10a2 2 0 012-2h8z" />
              </svg>
              Ver Propuestas
              <span v-if="contract.propuestas?.length" class="ml-1 px-1.5 py-0.5 text-xs bg-accent-cyan/20 rounded-full">
                {{ contract.propuestas.length }}
              </span>
            </NeonButton>

            <NeonButton 
              v-if="contract.chatId && isActiveContract(contract)"
              variant="secondary" 
              size="sm"
              @click="openChat(contract)"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat
            </NeonButton>

            <NeonButton 
              v-if="contract.estado === 'entrega_realizada'"
              variant="success" 
              size="sm"
              @click="$emit('approve-work', contract)"
              :pulse="true"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Aprobar Trabajo
            </NeonButton>

            <NeonButton 
              v-if="showRatings && contract.estado === 'completado'"
              variant="accent" 
              size="sm"
              @click="viewRating(contract)"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Calificación
            </NeonButton>
          </div>
        </div>
      </HologramCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineEmits } from 'vue'
import type { Contrato } from '../../types'
import { HologramCard, NeonButton } from '../ui'
import ContractStatusBadge from './ContractStatusBadge.vue'

interface Props {
  contracts: Contrato[]
  showRatings?: boolean
}

defineProps<Props>()

defineEmits<{
  'view-contract': [contract: Contrato]
  'view-proposals': [contract: Contrato]
  'approve-work': [contract: Contrato]
}>()

// Helper functions
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

const isActiveContract = (contract: Contrato) => {
  return ['abierto', 'esperando_deposito', 'fondos_garantia', 'entrega_realizada'].includes(contract.estado)
}

const getProgressPercentage = (contract: Contrato) => {
  const statusProgress = {
    'abierto': 25,
    'esperando_deposito': 40,
    'fondos_garantia': 60,
    'entrega_realizada': 80,
    'completado': 100,
    'cancelado': 0,
    'disputado': 50
  }
  return statusProgress[contract.estado] || 0
}

const openChat = (contract: Contrato) => {
  // TODO: Implement chat functionality
  console.log('Opening chat for contract:', contract.id)
}

const viewRating = (contract: Contrato) => {
  // TODO: Implement rating view
  console.log('Viewing rating for contract:', contract.id)
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>