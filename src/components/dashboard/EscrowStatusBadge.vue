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
import type { EstadoEscrow } from '../../types'

interface Props {
  status: EstadoEscrow
}

defineProps<Props>()

const statusLabels: Record<EstadoEscrow, string> = {
  'pendiente_deposito': 'Esperando Pago',
  'fondos_retenidos': 'Fondos Seguros',
  'liberado_especialista': 'Liberado',
  'reembolsado_cliente': 'Reembolsado',
  'en_disputa': 'En Disputa'
}

const statusClasses: Record<EstadoEscrow, string> = {
  'pendiente_deposito': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  'fondos_retenidos': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'liberado_especialista': 'bg-green-500/10 text-green-400 border-green-500/30',
  'reembolsado_cliente': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  'en_disputa': 'bg-red-500/10 text-red-400 border-red-500/30'
}

const statusDotClasses: Record<EstadoEscrow, string> = {
  'pendiente_deposito': 'bg-yellow-400 animate-pulse',
  'fondos_retenidos': 'bg-blue-400 animate-pulse',
  'liberado_especialista': 'bg-green-400',
  'reembolsado_cliente': 'bg-purple-400',
  'en_disputa': 'bg-red-400 animate-pulse'
}
</script>