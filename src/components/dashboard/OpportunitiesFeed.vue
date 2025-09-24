<template>
  <div class="opportunities-feed">
    <div class="flex items-center justify-between mb-6">
      <div>
        <GlitchText text="OPORTUNIDADES DISPONIBLES" class="text-xl mb-1" />
        <p class="text-text-secondary text-sm">
          Contratos que coinciden con tus habilidades
        </p>
      </div>
      <div class="flex items-center space-x-2">
        <div class="text-sm text-text-secondary">
          {{ availableContracts.length }} disponibles
        </div>
        <div class="w-2 h-2 bg-success rounded-full animate-pulse"></div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <HologramCard variant="secondary">
          <div class="p-6">
            <div class="h-4 bg-bg-tertiary rounded w-3/4 mb-2"></div>
            <div class="h-3 bg-bg-tertiary rounded w-full mb-4"></div>
            <div class="flex justify-between">
              <div class="h-3 bg-bg-tertiary rounded w-1/4"></div>
              <div class="h-3 bg-bg-tertiary rounded w-1/4"></div>
            </div>
          </div>
        </HologramCard>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="availableContracts.length === 0" class="text-center py-12">
      <div class="w-16 h-16 mx-auto mb-4 bg-bg-tertiary rounded-full flex items-center justify-center">
        <svg class="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-text-primary mb-2">No hay oportunidades disponibles</h3>
      <p class="text-text-secondary">Nuevos contratos aparecerán aquí automáticamente</p>
    </div>

    <!-- Opportunities List -->
    <div v-else class="space-y-4">
      <HologramCard 
        v-for="contract in availableContracts" 
        :key="contract.id"
        variant="secondary"
        :active="false"
        class="hover:scale-[1.01] transition-all duration-200"
      >
        <div class="p-6">
          <!-- Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-text-primary mb-1">
                {{ contract.titulo }}
              </h3>
              <p class="text-text-secondary text-sm line-clamp-3 mb-2">
                {{ contract.descripcion }}
              </p>
              <div class="flex items-center space-x-4 text-xs text-text-muted">
                <span>Tipo: {{ contract.tipoServicio }}</span>
                <span>•</span>
                <span>Publicado: {{ formatTimeAgo(contract.fechaCreacion) }}</span>
              </div>
            </div>
            
            <div class="ml-4 text-right">
              <div class="text-sm text-text-secondary mb-1">Presupuesto</div>
              <div class="text-2xl font-bold text-accent-cyan">
                ${{ contract.presupuestoSugerido }}
              </div>
              <div class="text-xs text-text-muted">
                Límite: {{ formatDate(contract.fechaLimite) }}
              </div>
            </div>
          </div>

          <!-- Files indicator -->
          <div v-if="contract.archivosAdjuntos?.length" class="mb-4">
            <div class="flex items-center text-sm text-text-secondary">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {{ contract.archivosAdjuntos.length }} archivo(s) adjunto(s)
            </div>
          </div>

          <!-- Proposal Status -->
          <div class="mb-4">
            <div v-if="hasProposedToContract(contract.id)" class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-warning rounded-full"></div>
              <span class="text-sm text-warning">Ya enviaste una propuesta</span>
              <div class="text-xs text-text-muted">
                ${{ getContractProposal(contract.id)?.precio }} - 
                {{ getContractProposal(contract.id)?.estado }}
              </div>
            </div>
            <div v-else class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span class="text-sm text-success">Disponible para propuesta</span>
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
              v-if="!hasProposedToContract(contract.id)"
              variant="primary" 
              size="sm"
              @click="$emit('send-proposal', contract)"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Enviar Propuesta
            </NeonButton>

            <NeonButton 
              v-else
              variant="ghost" 
              size="sm"
              @click="$emit('view-proposal', contract)"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ver Mi Propuesta
            </NeonButton>
          </div>
        </div>
      </HologramCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Contrato } from '../../types'
import { GlitchText, HologramCard, NeonButton } from '../ui'

interface Props {
  availableContracts: Contrato[]
  loading?: boolean
  hasProposedToContract: (contractId: string) => boolean
  getContractProposal: (contractId: string) => any
}

defineProps<Props>()

defineEmits<{
  'view-contract': [contract: Contrato]
  'send-proposal': [contract: Contrato]
  'view-proposal': [contract: Contrato]
}>()

// Helper functions
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    month: 'short',
    day: 'numeric'
  }).format(date)
}

const formatTimeAgo = (date: Date) => {
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'Hace menos de 1 hora'
  if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`
  
  return formatDate(date)
}
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>