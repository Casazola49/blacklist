<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-text-primary">Estadísticas de Escrow</h3>
      <button
        @click="refreshStats"
        :disabled="loading"
        class="p-2 text-text-muted hover:text-accent-cyan transition-colors"
      >
        <svg 
          :class="['w-5 h-5', loading && 'animate-spin']" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <CyberLoader text="Cargando estadísticas..." />
    </div>

    <!-- Statistics Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Total Transactions -->
      <div class="p-6 bg-bg-secondary rounded-lg border border-brand-primary/20">
        <div class="flex items-center justify-between mb-4">
          <div class="p-3 bg-accent-cyan/10 rounded-lg">
            <svg class="w-6 h-6 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span class="text-2xl font-bold text-accent-cyan">
            <AnimatedCounter :value="stats.totalTransacciones" />
          </span>
        </div>
        <h4 class="font-medium text-text-primary mb-1">Total Transacciones</h4>
        <p class="text-text-secondary text-sm">Transacciones procesadas</p>
      </div>

      <!-- Funds in Escrow -->
      <div class="p-6 bg-bg-secondary rounded-lg border border-brand-primary/20">
        <div class="flex items-center justify-between mb-4">
          <div class="p-3 bg-blue-500/10 rounded-lg">
            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <span class="text-2xl font-bold text-blue-400">
            $<AnimatedCounter :value="stats.fondosRetenidos" :decimals="2" />
          </span>
        </div>
        <h4 class="font-medium text-text-primary mb-1">Fondos en Escrow</h4>
        <p class="text-text-secondary text-sm">Fondos actualmente retenidos</p>
      </div>

      <!-- Released Funds -->
      <div class="p-6 bg-bg-secondary rounded-lg border border-brand-primary/20">
        <div class="flex items-center justify-between mb-4">
          <div class="p-3 bg-green-500/10 rounded-lg">
            <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <span class="text-2xl font-bold text-green-400">
            $<AnimatedCounter :value="stats.fondosLiberados" :decimals="2" />
          </span>
        </div>
        <h4 class="font-medium text-text-primary mb-1">Fondos Liberados</h4>
        <p class="text-text-secondary text-sm">Total liberado a especialistas</p>
      </div>

      <!-- Platform Commissions -->
      <div class="p-6 bg-bg-secondary rounded-lg border border-brand-primary/20">
        <div class="flex items-center justify-between mb-4">
          <div class="p-3 bg-brand-primary/10 rounded-lg">
            <svg class="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <span class="text-2xl font-bold text-brand-primary">
            $<AnimatedCounter :value="stats.comisionesGeneradas" :decimals="2" />
          </span>
        </div>
        <h4 class="font-medium text-text-primary mb-1">Comisiones Generadas</h4>
        <p class="text-text-secondary text-sm">Ingresos de la plataforma (15%)</p>
      </div>

      <!-- Disputed Transactions -->
      <div class="p-6 bg-bg-secondary rounded-lg border border-brand-primary/20">
        <div class="flex items-center justify-between mb-4">
          <div class="p-3 bg-red-500/10 rounded-lg">
            <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <span class="text-2xl font-bold text-red-400">
            <AnimatedCounter :value="stats.transaccionesDisputa" />
          </span>
        </div>
        <h4 class="font-medium text-text-primary mb-1">Transacciones en Disputa</h4>
        <p class="text-text-secondary text-sm">Requieren intervención</p>
      </div>

      <!-- Success Rate -->
      <div class="p-6 bg-bg-secondary rounded-lg border border-brand-primary/20">
        <div class="flex items-center justify-between mb-4">
          <div class="p-3 bg-accent-magenta/10 rounded-lg">
            <svg class="w-6 h-6 text-accent-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span class="text-2xl font-bold text-accent-magenta">
            <AnimatedCounter :value="successRate" :decimals="1" />%
          </span>
        </div>
        <h4 class="font-medium text-text-primary mb-1">Tasa de Éxito</h4>
        <p class="text-text-secondary text-sm">Transacciones completadas</p>
      </div>
    </div>

    <!-- Detailed Breakdown -->
    <div class="p-6 bg-bg-secondary rounded-lg border border-brand-primary/20">
      <h4 class="font-medium text-text-primary mb-4">Desglose Detallado</h4>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Transaction Status Distribution -->
        <div>
          <h5 class="text-sm font-medium text-text-secondary mb-3">Distribución por Estado</h5>
          <div class="space-y-2">
            <div v-for="status in transactionStatuses" :key="status.key" class="flex items-center justify-between">
              <div class="flex items-center">
                <div 
                  :class="[
                    'w-3 h-3 rounded-full mr-2',
                    status.color
                  ]"
                ></div>
                <span class="text-sm text-text-secondary">{{ status.label }}</span>
              </div>
              <span class="text-sm font-medium text-text-primary">
                {{ getStatusCount(status.key) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Financial Summary -->
        <div>
          <h5 class="text-sm font-medium text-text-secondary mb-3">Resumen Financiero</h5>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-text-secondary">Volumen Total Procesado:</span>
              <span class="text-text-primary font-medium">
                ${{ (stats.fondosLiberados + stats.fondosRetenidos).toFixed(2) }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-secondary">Comisión Promedio:</span>
              <span class="text-text-primary font-medium">
                ${{ stats.totalTransacciones > 0 ? (stats.comisionesGeneradas / stats.totalTransacciones).toFixed(2) : '0.00' }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-secondary">Transacción Promedio:</span>
              <span class="text-text-primary font-medium">
                ${{ stats.totalTransacciones > 0 ? ((stats.fondosLiberados + stats.fondosRetenidos) / stats.totalTransacciones).toFixed(2) : '0.00' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { EscrowService } from '../../services/escrow'
import { CyberLoader, AnimatedCounter } from '../ui'

// State
const stats = ref({
  totalTransacciones: 0,
  fondosRetenidos: 0,
  fondosLiberados: 0,
  comisionesGeneradas: 0,
  transaccionesDisputa: 0
})
const loading = ref(false)

// Transaction status configuration
const transactionStatuses = [
  { key: 'pendiente_deposito', label: 'Pendiente Depósito', color: 'bg-yellow-400' },
  { key: 'fondos_retenidos', label: 'Fondos Retenidos', color: 'bg-blue-400' },
  { key: 'liberado_especialista', label: 'Liberado', color: 'bg-green-400' },
  { key: 'reembolsado_cliente', label: 'Reembolsado', color: 'bg-purple-400' },
  { key: 'en_disputa', label: 'En Disputa', color: 'bg-red-400' }
]

// Computed
const successRate = computed(() => {
  if (stats.value.totalTransacciones === 0) return 0
  const successful = stats.value.totalTransacciones - stats.value.transaccionesDisputa
  return (successful / stats.value.totalTransacciones) * 100
})

// Methods
const loadStatistics = async () => {
  try {
    loading.value = true
    stats.value = await EscrowService.getEscrowStatistics()
  } catch (error) {
    console.error('Error loading escrow statistics:', error)
  } finally {
    loading.value = false
  }
}

const refreshStats = () => {
  loadStatistics()
}

const getStatusCount = (status: string): number => {
  // This would need to be implemented with more detailed statistics
  // For now, return mock data based on the status
  switch (status) {
    case 'pendiente_deposito':
      return Math.floor(stats.value.totalTransacciones * 0.1)
    case 'fondos_retenidos':
      return Math.floor(stats.value.totalTransacciones * 0.2)
    case 'liberado_especialista':
      return Math.floor(stats.value.totalTransacciones * 0.6)
    case 'reembolsado_cliente':
      return Math.floor(stats.value.totalTransacciones * 0.05)
    case 'en_disputa':
      return stats.value.transaccionesDisputa
    default:
      return 0
  }
}

// Lifecycle
onMounted(() => {
  loadStatistics()
})
</script>