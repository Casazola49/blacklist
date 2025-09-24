<template>
  <div class="space-y-6">
    <!-- Header with date range -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-white">
          <GlitchText text="Dashboard Financiero" />
        </h2>
        <p class="text-gray-400 mt-1">Métricas financieras y análisis de ingresos</p>
      </div>
      
      <div class="flex flex-wrap gap-3">
        <select 
          v-model="selectedPeriod"
          @change="loadFinancialData"
          class="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
        >
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
          <option value="90">Últimos 90 días</option>
          <option value="365">Último año</option>
        </select>
        
        <NeonButton @click="exportFinancialData" variant="secondary" size="sm">
          Exportar
        </NeonButton>
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <HologramCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-400">Ingresos Totales</p>
            <div class="text-2xl font-bold text-white">
              $<AnimatedCounter :target="metrics.totalRevenue" />
            </div>
            <div class="flex items-center mt-1">
              <span :class="[
                'text-xs px-2 py-1 rounded-full',
                metrics.monthlyGrowth >= 0 ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'
              ]">
                {{ metrics.monthlyGrowth >= 0 ? '+' : '' }}{{ metrics.monthlyGrowth.toFixed(1) }}%
              </span>
            </div>
          </div>
          <div class="text-success text-3xl">💰</div>
        </div>
      </HologramCard>

      <HologramCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-400">Comisiones Ganadas</p>
            <div class="text-2xl font-bold text-white">
              $<AnimatedCounter :target="metrics.totalCommissions" />
            </div>
            <div class="text-xs text-gray-400 mt-1">
              {{ ((metrics.totalCommissions / metrics.totalRevenue) * 100).toFixed(1) }}% del total
            </div>
          </div>
          <div class="text-brand-primary text-3xl">📈</div>
        </div>
      </HologramCard>

      <HologramCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-400">Fondos en Escrow</p>
            <div class="text-2xl font-bold text-white">
              $<AnimatedCounter :target="metrics.activeEscrowFunds" />
            </div>
            <div class="text-xs text-gray-400 mt-1">
              {{ escrowContracts }} contratos activos
            </div>
          </div>
          <div class="text-warning text-3xl">🔒</div>
        </div>
      </HologramCard>

      <HologramCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-400">Valor Promedio</p>
            <div class="text-2xl font-bold text-white">
              $<AnimatedCounter :target="metrics.averageContractValue" />
            </div>
            <div class="text-xs text-gray-400 mt-1">
              Por contrato
            </div>
          </div>
          <div class="text-info text-3xl">📊</div>
        </div>
      </HologramCard>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Revenue Chart -->
      <HologramCard class="p-6">
        <h3 class="text-lg font-semibold text-white mb-4">
          <GlitchText text="Ingresos por Período" />
        </h3>
        <div class="h-64 flex items-center justify-center">
          <div class="text-center text-gray-400">
            <div class="text-4xl mb-2">📈</div>
            <p>Gráfico de ingresos</p>
            <p class="text-sm">(Implementar con Chart.js)</p>
          </div>
        </div>
      </HologramCard>

      <!-- Contract Status Distribution -->
      <HologramCard class="p-6">
        <h3 class="text-lg font-semibold text-white mb-4">
          <GlitchText text="Distribución de Contratos" />
        </h3>
        <div class="space-y-3">
          <div 
            v-for="(count, status) in metrics.contractsByStatus" 
            :key="status"
            class="flex items-center justify-between"
          >
            <div class="flex items-center space-x-3">
              <div :class="[
                'w-3 h-3 rounded-full',
                getStatusColor(status)
              ]"></div>
              <span class="text-gray-300 capitalize">{{ getStatusLabel(status) }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-white font-medium">{{ count }}</span>
              <div class="w-20 bg-gray-700 rounded-full h-2">
                <div 
                  :class="['h-2 rounded-full', getStatusColor(status)]"
                  :style="{ width: `${(count / totalContracts) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </HologramCard>
    </div>

    <!-- Top Specialists -->
    <HologramCard class="p-6">
      <h3 class="text-lg font-semibold text-white mb-4">
        <GlitchText text="Top Especialistas" />
      </h3>
      
      <div v-if="loading" class="flex justify-center py-8">
        <CyberLoader />
      </div>
      
      <div v-else-if="metrics.topSpecialists.length === 0" class="text-center py-8 text-gray-400">
        No hay datos de especialistas disponibles
      </div>
      
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-700">
              <th class="text-left py-3 px-4 text-gray-300 font-medium">Ranking</th>
              <th class="text-left py-3 px-4 text-gray-300 font-medium">Especialista</th>
              <th class="text-left py-3 px-4 text-gray-300 font-medium">Ganancias</th>
              <th class="text-left py-3 px-4 text-gray-300 font-medium">Contratos</th>
              <th class="text-left py-3 px-4 text-gray-300 font-medium">Promedio</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(specialist, index) in metrics.topSpecialists.slice(0, 10)" 
              :key="specialist.uid"
              class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
            >
              <td class="py-4 px-4">
                <div class="flex items-center space-x-2">
                  <div :class="[
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                    index === 0 ? 'bg-yellow-500 text-black' :
                    index === 1 ? 'bg-gray-400 text-black' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-gray-700 text-gray-300'
                  ]">
                    {{ index + 1 }}
                  </div>
                  <div v-if="index < 3" class="text-lg">
                    {{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}
                  </div>
                </div>
              </td>
              
              <td class="py-4 px-4">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 bg-gradient-to-br from-brand-primary to-accent-cyan rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {{ specialist.alias.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <div class="text-white font-medium">{{ specialist.alias }}</div>
                    <div class="text-sm text-gray-400">{{ specialist.uid.slice(0, 8) }}...</div>
                  </div>
                </div>
              </td>
              
              <td class="py-4 px-4">
                <div class="text-white font-bold">${{ specialist.earnings }}</div>
              </td>
              
              <td class="py-4 px-4">
                <div class="text-white">{{ specialist.completedContracts }}</div>
              </td>
              
              <td class="py-4 px-4">
                <div class="text-white">
                  ${{ Math.round(specialist.earnings / specialist.completedContracts) }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </HologramCard>

    <!-- Transaction History -->
    <HologramCard class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-white">
          <GlitchText text="Transacciones Recientes" />
        </h3>
        <NeonButton @click="viewAllTransactions" variant="secondary" size="sm">
          Ver Todas
        </NeonButton>
      </div>
      
      <div v-if="recentTransactions.length === 0" class="text-center py-8 text-gray-400">
        No hay transacciones recientes
      </div>
      
      <div v-else class="space-y-3">
        <div 
          v-for="transaction in recentTransactions.slice(0, 10)" 
          :key="transaction.id"
          class="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
        >
          <div class="flex items-center space-x-3">
            <div :class="[
              'w-2 h-2 rounded-full',
              transaction.estado === 'liberado_especialista' ? 'bg-green-400' :
              transaction.estado === 'reembolsado_cliente' ? 'bg-blue-400' :
              transaction.estado === 'fondos_retenidos' ? 'bg-yellow-400' :
              'bg-gray-400'
            ]"></div>
            <div>
              <div class="text-white text-sm font-medium">
                Contrato {{ transaction.contratoId.slice(0, 8) }}...
              </div>
              <div class="text-gray-400 text-xs">
                {{ formatDate(transaction.fechaDeposito || transaction.fechaLiberacion || new Date()) }}
              </div>
            </div>
          </div>
          
          <div class="text-right">
            <div class="text-white font-bold">${{ transaction.monto }}</div>
            <div class="text-xs text-gray-400">
              Comisión: ${{ transaction.comisionPlataforma }}
            </div>
          </div>
        </div>
      </div>
    </HologramCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '../../stores/admin'
import { AdminService, type FinancialMetrics } from '../../services/admin'
import HologramCard from '../ui/HologramCard.vue'
import GlitchText from '../ui/GlitchText.vue'
import NeonButton from '../ui/NeonButton.vue'
import CyberLoader from '../ui/CyberLoader.vue'
import AnimatedCounter from '../ui/AnimatedCounter.vue'

const adminStore = useAdminStore()
const loading = ref(false)
const selectedPeriod = ref('30')

const metrics = ref<FinancialMetrics>({
  totalRevenue: 0,
  totalCommissions: 0,
  activeEscrowFunds: 0,
  completedTransactions: 0,
  averageContractValue: 0,
  monthlyGrowth: 0,
  topSpecialists: [],
  contractsByStatus: {}
})

const recentTransactions = computed(() => 
  adminStore.escrowTransactions
    .filter(tx => tx.estado === 'liberado_especialista' || tx.estado === 'reembolsado_cliente')
    .sort((a, b) => {
      const dateA = a.fechaLiberacion || a.fechaDeposito || new Date(0)
      const dateB = b.fechaLiberacion || b.fechaDeposito || new Date(0)
      return dateB.getTime() - dateA.getTime()
    })
)

const escrowContracts = computed(() => 
  adminStore.escrowTransactions.filter(tx => tx.estado === 'fondos_retenidos').length
)

const totalContracts = computed(() => 
  Object.values(metrics.value.contractsByStatus).reduce((sum, count) => sum + count, 0)
)

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'abierto': 'Abiertos',
    'esperando_deposito': 'Esperando Depósito',
    'fondos_garantia': 'En Progreso',
    'entrega_realizada': 'Entregados',
    'completado': 'Completados',
    'disputado': 'Disputados',
    'cancelado': 'Cancelados'
  }
  return labels[status] || status
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'abierto': 'bg-blue-400',
    'esperando_deposito': 'bg-yellow-400',
    'fondos_garantia': 'bg-purple-400',
    'entrega_realizada': 'bg-orange-400',
    'completado': 'bg-green-400',
    'disputado': 'bg-red-400',
    'cancelado': 'bg-gray-400'
  }
  return colors[status] || 'bg-gray-400'
}

const loadFinancialData = async () => {
  loading.value = true
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(selectedPeriod.value))
    
    metrics.value = await AdminService.getFinancialMetrics(startDate, endDate)
  } catch (error) {
    console.error('Error loading financial data:', error)
  } finally {
    loading.value = false
  }
}

const exportFinancialData = async () => {
  try {
    const data = await adminStore.exportData('transactions', 'csv')
    const blob = new Blob([data], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financial-data-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error exporting financial data:', error)
  }
}

const viewAllTransactions = () => {
  // Navigate to transactions view or open modal
  console.log('View all transactions')
}

onMounted(async () => {
  await Promise.all([
    adminStore.loadEscrowTransactions(),
    loadFinancialData()
  ])
})
</script>