<template>
  <span 
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      'border transition-all duration-200',
      statusClasses[status]
    ]"
  >
    <span 
      :class="[
        'w-1.5 h-1.5 rounded-full mr-1.5',
        statusDotClasses[status]
      ]"
    ></span>
    {{ statusLabels[status] }}
  </span>
</template>

<script setup lang="ts">
import type { EstadoContrato } from '../../types'

interface Props {
  status: EstadoContrato
}

defineProps<Props>()

const statusLabels: Record<EstadoContrato, string> = {
  'abierto': 'Abierto',
  'esperando_deposito': 'Esperando Pago',
  'fondos_garantia': 'En Progreso',
  'entrega_realizada': 'Entregado',
  'completado': 'Completado',
  'disputado': 'En Disputa',
  'cancelado': 'Cancelado'
}

const statusClasses: Record<EstadoContrato, string> = {
  'abierto': 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30',
  'esperando_deposito': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  'fondos_garantia': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'entrega_realizada': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  'completado': 'bg-green-500/10 text-green-400 border-green-500/30',
  'disputado': 'bg-red-500/10 text-red-400 border-red-500/30',
  'cancelado': 'bg-gray-500/10 text-gray-400 border-gray-500/30'
}

const statusDotClasses: Record<EstadoContrato, string> = {
  'abierto': 'bg-accent-cyan animate-pulse',
  'esperando_deposito': 'bg-yellow-400 animate-pulse',
  'fondos_garantia': 'bg-blue-400 animate-pulse',
  'entrega_realizada': 'bg-purple-400 animate-pulse',
  'completado': 'bg-green-400',
  'disputado': 'bg-red-400 animate-pulse',
  'cancelado': 'bg-gray-400'
}
</script>