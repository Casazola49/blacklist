<template>
  <span 
    :class="[
      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
      'border transition-all duration-200',
      statusClasses[status]
    ]"
  >
    <span 
      :class="[
        'w-1 h-1 rounded-full mr-1',
        statusDotClasses[status]
      ]"
    ></span>
    {{ statusLabels[status] }}
  </span>
</template>

<script setup lang="ts">
interface Props {
  status: 'pendiente' | 'aceptada' | 'rechazada'
}

defineProps<Props>()

const statusLabels = {
  'pendiente': 'Pendiente',
  'aceptada': 'Aceptada',
  'rechazada': 'Rechazada'
}

const statusClasses = {
  'pendiente': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  'aceptada': 'bg-green-500/10 text-green-400 border-green-500/30',
  'rechazada': 'bg-red-500/10 text-red-400 border-red-500/30'
}

const statusDotClasses = {
  'pendiente': 'bg-yellow-400 animate-pulse',
  'aceptada': 'bg-green-400',
  'rechazada': 'bg-red-400'
}
</script>