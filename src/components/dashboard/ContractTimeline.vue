<template>
  <div class="space-y-4">
    <div
      v-for="(step, index) in timelineSteps"
      :key="index"
      class="flex items-start space-x-4"
    >
      <!-- Step Icon -->
      <div 
        :class="[
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300',
          step.completed 
            ? 'bg-accent-cyan border-accent-cyan text-bg-primary' 
            : step.current 
              ? 'bg-accent-cyan/20 border-accent-cyan text-accent-cyan animate-pulse' 
              : 'bg-bg-tertiary border-brand-primary/30 text-text-muted'
        ]"
      >
        <svg v-if="step.completed" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        <span v-else class="text-xs font-bold">{{ index + 1 }}</span>
      </div>

      <!-- Step Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <h4 
            :class="[
              'text-sm font-medium',
              step.completed 
                ? 'text-accent-cyan' 
                : step.current 
                  ? 'text-text-primary' 
                  : 'text-text-muted'
            ]"
          >
            {{ step.title }}
          </h4>
          <span 
            v-if="step.date" 
            :class="[
              'text-xs',
              step.completed ? 'text-accent-cyan/80' : 'text-text-muted'
            ]"
          >
            {{ formatDate(step.date) }}
          </span>
        </div>
        
        <p 
          :class="[
            'text-xs mt-1',
            step.completed 
              ? 'text-text-secondary' 
              : step.current 
                ? 'text-text-secondary' 
                : 'text-text-muted'
          ]"
        >
          {{ step.description }}
        </p>

        <!-- Progress bar for current step -->
        <div v-if="step.current && step.progress !== undefined" class="mt-2">
          <div class="w-full bg-bg-tertiary rounded-full h-1">
            <div 
              class="bg-gradient-to-r from-accent-cyan to-accent-magenta h-1 rounded-full transition-all duration-500"
              :style="{ width: `${step.progress}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Connector Line -->
      <div 
        v-if="index < timelineSteps.length - 1"
        :class="[
          'absolute left-4 mt-8 w-px h-6 transition-colors duration-300',
          step.completed ? 'bg-accent-cyan' : 'bg-brand-primary/30'
        ]"
        :style="{ marginLeft: '15px' }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Contrato } from '../../types'

interface Props {
  contract: Contrato
}

const props = defineProps<Props>()

interface TimelineStep {
  title: string
  description: string
  completed: boolean
  current: boolean
  date?: Date
  progress?: number
}

const timelineSteps = computed((): TimelineStep[] => {
  const steps: TimelineStep[] = [
    {
      title: 'Contrato Creado',
      description: 'El proyecto fue publicado y está recibiendo propuestas',
      completed: true,
      current: false,
      date: props.contract.fechaCreacion
    },
    {
      title: 'Especialista Asignado',
      description: 'Se aceptó una propuesta y se asignó el especialista',
      completed: !!props.contract.especialistaId,
      current: props.contract.estado === 'esperando_deposito',
      date: props.contract.fechaAsignacion
    },
    {
      title: 'Pago en Garantía',
      description: 'Los fondos están seguros en el sistema de escrow',
      completed: ['fondos_garantia', 'entrega_realizada', 'completado'].includes(props.contract.estado),
      current: props.contract.estado === 'esperando_deposito',
      progress: props.contract.estado === 'esperando_deposito' ? 50 : undefined
    },
    {
      title: 'Trabajo en Progreso',
      description: 'El especialista está trabajando en el proyecto',
      completed: ['entrega_realizada', 'completado'].includes(props.contract.estado),
      current: props.contract.estado === 'fondos_garantia',
      progress: props.contract.estado === 'fondos_garantia' ? 75 : undefined
    },
    {
      title: 'Trabajo Entregado',
      description: 'El especialista ha entregado el trabajo final',
      completed: props.contract.estado === 'completado',
      current: props.contract.estado === 'entrega_realizada'
    },
    {
      title: 'Proyecto Completado',
      description: 'El trabajo fue aprobado y los fondos liberados',
      completed: props.contract.estado === 'completado',
      current: false,
      date: props.contract.fechaCompletado
    }
  ]

  return steps
})

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>

<style scoped>
.relative {
  position: relative;
}

.absolute {
  position: absolute;
}
</style>