<template>
  <div class="assigned-contracts">
    <div class="flex items-center justify-between mb-6">
      <div>
        <GlitchText text="CONTRATOS ASIGNADOS" class="text-xl mb-1" />
        <p class="text-text-secondary text-sm">
          Proyectos en los que estás trabajando
        </p>
      </div>
      <div class="text-sm text-text-secondary">
        {{ assignedContracts.length }} activo{{ assignedContracts.length !== 1 ? 's' : '' }}
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="assignedContracts.length === 0" class="text-center py-12">
      <div class="w-16 h-16 mx-auto mb-4 bg-bg-tertiary rounded-full flex items-center justify-center">
        <svg class="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-text-primary mb-2">No tienes contratos asignados</h3>
      <p class="text-text-secondary">Envía propuestas para conseguir nuevos proyectos</p>
    </div>

    <!-- Contracts List -->
    <div v-else class="space-y-4">
      <HologramCard 
        v-for="contract in assignedContracts" 
        :key="contract.id"
        variant="primary"
        :active="true"
        class="hover:scale-[1.01] transition-all duration-200"
      >
        <div class="p-6">
          <!-- Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <h3 class="text-lg font-semibold text-text-primary">
                  {{ contract.titulo }}
                </h3>
                <ContractStatusBadge :status="contract.estado" />
              </div>
              <p class="text-text-secondary text-sm line-clamp-2 mb-2">
                {{ contract.descripcion }}
              </p>
              <div class="flex items-center space-x-4 text-xs text-text-muted">
                <span>Asignado: {{ formatDate(contract.fechaAsignacion!) }}</span>
                <span>•</span>
                <span>Límite: {{ formatDate(contract.fechaLimite) }}</span>
              </div>
            </div>
            
            <div class="ml-4 text-right">
              <div class="text-sm text-text-secondary mb-1">Precio acordado</div>
              <div class="text-2xl font-bold text-success">
                ${{ contract.precioFinal }}
              </div>
              <div class="text-xs text-text-muted">
                Recibirás: ${{ ((contract.precioFinal || 0) * 0.85).toFixed(2) }}
              </div>
            </div>
          </div>

          <!-- Progress Timeline -->
          <div class="mb-4">
            <ContractTimeline :contract="contract" />
          </div>

          <!-- Urgency Indicator -->
          <div class="mb-4">
            <div class="flex items-center space-x-2">
              <div 
                class="w-2 h-2 rounded-full"
                :class="getUrgencyColor(contract.fechaLimite)"
              ></div>
              <span class="text-sm" :class="getUrgencyTextColor(contract.fechaLimite)">
                {{ getUrgencyText(contract.fechaLimite) }}
              </span>
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
              v-if="contract.chatId"
              variant="secondary" 
              size="sm"
              @click="$emit('open-chat', contract)"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat Privado
            </NeonButton>

            <NeonButton 
              v-if="canDeliverWork(contract)"
              variant="primary" 
              size="sm"
              @click="$emit('deliver-work', contract)"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Entregar Trabajo
            </NeonButton>

            <NeonButton 
              v-if="contract.estado === 'entrega_realizada'"
              variant="accent" 
              size="sm"
              disabled
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Esperando Aprobación
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
import ContractStatusBadge from './ContractStatusBadge.vue'
import ContractTimeline from './ContractTimeline.vue'

interface Props {
  assignedContracts: Contrato[]
}

defineProps<Props>()

defineEmits<{
  'view-contract': [contract: Contrato]
  'open-chat': [contract: Contrato]
  'deliver-work': [contract: Contrato]
}>()

// Helper functions
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

const canDeliverWork = (contract: Contrato) => {
  return contract.estado === 'fondos_garantia'
}

const getUrgencyColor = (deadline: Date) => {
  const now = new Date()
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysLeft <= 1) return 'bg-error animate-pulse'
  if (daysLeft <= 3) return 'bg-warning'
  if (daysLeft <= 7) return 'bg-info'
  return 'bg-success'
}

const getUrgencyTextColor = (deadline: Date) => {
  const now = new Date()
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysLeft <= 1) return 'text-error'
  if (daysLeft <= 3) return 'text-warning'
  if (daysLeft <= 7) return 'text-info'
  return 'text-success'
}

const getUrgencyText = (deadline: Date) => {
  const now = new Date()
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysLeft < 0) return 'Vencido'
  if (daysLeft === 0) return 'Vence hoy'
  if (daysLeft === 1) return 'Vence mañana'
  if (daysLeft <= 7) return `${daysLeft} días restantes`
  
  const weeksLeft = Math.ceil(daysLeft / 7)
  return `${weeksLeft} semana${weeksLeft > 1 ? 's' : ''} restantes`
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