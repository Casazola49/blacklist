<template>
  <div class="space-y-6">
    <!-- Header with filters -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-white">
          <GlitchText text="Supervisión de Contratos" />
        </h2>
        <p class="text-gray-400 mt-1">Monitorear todos los contratos del sistema</p>
      </div>
      
      <div class="flex flex-wrap gap-3">
        <select 
          v-model="selectedStatus"
          class="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
        >
          <option value="all">Todos los estados</option>
          <option value="abierto">Abiertos</option>
          <option value="esperando_deposito">Esperando Depósito</option>
          <option value="fondos_garantia">En Progreso</option>
          <option value="entrega_realizada">Entregados</option>
          <option value="completado">Completados</option>
          <option value="disputado">Disputados</option>
          <option value="cancelado">Cancelados</option>
        </select>
        
        <NeonButton @click="exportContracts" variant="secondary" size="sm">
          Exportar
        </NeonButton>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <HologramCard class="p-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-white">{{ adminStore.stats.activeContracts }}</div>
          <div class="text-sm text-gray-400">Activos</div>
        </div>
      </HologramCard>
      
      <HologramCard class="p-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-white">{{ adminStore.stats.completedContracts }}</div>
          <div class="text-sm text-gray-400">Completados</div>
        </div>
      </HologramCard>
      
      <HologramCard class="p-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-error">{{ adminStore.stats.disputedContracts }}</div>
          <div class="text-sm text-gray-400">Disputados</div>
        </div>
      </HologramCard>
      
      <HologramCard class="p-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-success">${{ totalContractValue }}</div>
          <div class="text-sm text-gray-400">Valor Total</div>
        </div>
      </HologramCard>
      
      <HologramCard class="p-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-warning">${{ averageContractValue }}</div>
          <div class="text-sm text-gray-400">Promedio</div>
        </div>
      </HologramCard>
    </div>

    <!-- Contracts Table -->
    <HologramCard class="overflow-hidden">
      <div class="p-6">
        <div v-if="loading" class="flex justify-center py-8">
          <CyberLoader />
        </div>
        
        <div v-else-if="filteredContracts.length === 0" class="text-center py-8 text-gray-400">
          No se encontraron contratos
        </div>
        
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-700">
                <th class="text-left py-3 px-4 text-gray-300 font-medium">Contrato</th>
                <th class="text-left py-3 px-4 text-gray-300 font-medium">Cliente</th>
                <th class="text-left py-3 px-4 text-gray-300 font-medium">Especialista</th>
                <th class="text-left py-3 px-4 text-gray-300 font-medium">Estado</th>
                <th class="text-left py-3 px-4 text-gray-300 font-medium">Valor</th>
                <th class="text-left py-3 px-4 text-gray-300 font-medium">Fechas</th>
                <th class="text-right py-3 px-4 text-gray-300 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="contract in paginatedContracts" 
                :key="contract.id"
                class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
              >
                <td class="py-4 px-4">
                  <div>
                    <div class="text-white font-medium">{{ contract.titulo }}</div>
                    <div class="text-sm text-gray-400 max-w-xs truncate">{{ contract.descripcion }}</div>
                    <div class="text-xs text-gray-500 mt-1">ID: {{ contract.id }}</div>
                  </div>
                </td>
                
                <td class="py-4 px-4">
                  <div class="text-white">{{ getClientAlias(contract.clienteId) }}</div>
                  <div class="text-sm text-gray-400">{{ contract.clienteId.slice(0, 8) }}...</div>
                </td>
                
                <td class="py-4 px-4">
                  <div v-if="contract.especialistaId" class="text-white">
                    {{ getSpecialistAlias(contract.especialistaId) }}
                  </div>
                  <div v-else class="text-gray-500 italic">Sin asignar</div>
                  <div v-if="contract.especialistaId" class="text-sm text-gray-400">
                    {{ contract.especialistaId.slice(0, 8) }}...
                  </div>
                </td>
                
                <td class="py-4 px-4">
                  <span :class="[
                    'px-2 py-1 text-xs rounded-full',
                    getContractStatusClass(contract.estado)
                  ]">
                    {{ getContractStatusLabel(contract.estado) }}
                  </span>
                </td>
                
                <td class="py-4 px-4">
                  <div class="text-white font-medium">
                    ${{ contract.precioFinal || contract.presupuestoSugerido }}
                  </div>
                  <div v-if="contract.precioFinal && contract.precioFinal !== contract.presupuestoSugerido" 
                       class="text-sm text-gray-400">
                    Sugerido: ${{ contract.presupuestoSugerido }}
                  </div>
                </td>
                
                <td class="py-4 px-4 text-sm text-gray-300">
                  <div>Creado: {{ formatDate(contract.fechaCreacion) }}</div>
                  <div v-if="contract.fechaLimite">Límite: {{ formatDate(contract.fechaLimite) }}</div>
                  <div v-if="contract.fechaCompletado">Completado: {{ formatDate(contract.fechaCompletado) }}</div>
                </td>
                
                <td class="py-4 px-4">
                  <div class="flex justify-end space-x-2">
                    <NeonButton 
                      @click="viewContractDetails(contract)"
                      size="sm" 
                      variant="secondary"
                    >
                      Ver
                    </NeonButton>
                    
                    <NeonButton 
                      v-if="contract.estado === 'disputado'"
                      @click="resolveDispute(contract)"
                      size="sm" 
                      variant="warning"
                    >
                      Resolver
                    </NeonButton>
                    
                    <NeonButton 
                      v-if="['abierto', 'esperando_deposito'].includes(contract.estado)"
                      @click="cancelContract(contract.id)"
                      size="sm" 
                      variant="danger"
                    >
                      Cancelar
                    </NeonButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex justify-center items-center space-x-4 mt-6">
          <NeonButton 
            @click="currentPage--"
            :disabled="currentPage === 1"
            size="sm"
            variant="secondary"
          >
            Anterior
          </NeonButton>
          
          <span class="text-gray-300">
            Página {{ currentPage }} de {{ totalPages }}
          </span>
          
          <NeonButton 
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            size="sm"
            variant="secondary"
          >
            Siguiente
          </NeonButton>
        </div>
      </div>
    </HologramCard>

    <!-- Contract Details Modal -->
    <ContractDetailsModal 
      v-if="selectedContract"
      :contract="selectedContract"
      @close="selectedContract = null"
      @resolve-dispute="handleResolveDispute"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '../../stores/admin'
import type { Contrato } from '../../types'
import HologramCard from '../ui/HologramCard.vue'
import GlitchText from '../ui/GlitchText.vue'
import NeonButton from '../ui/NeonButton.vue'
import CyberLoader from '../ui/CyberLoader.vue'
import ContractDetailsModal from './ContractDetailsModal.vue'

const adminStore = useAdminStore()
const loading = ref(false)
const selectedStatus = ref('all')
const currentPage = ref(1)
const itemsPerPage = 10
const selectedContract = ref<Contrato | null>(null)

const filteredContracts = computed(() => {
  let contracts = adminStore.contracts
  
  if (selectedStatus.value !== 'all') {
    contracts = contracts.filter(contract => contract.estado === selectedStatus.value)
  }
  
  return contracts.sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime())
})

const totalPages = computed(() => 
  Math.ceil(filteredContracts.value.length / itemsPerPage)
)

const paginatedContracts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredContracts.value.slice(start, end)
})

const totalContractValue = computed(() => {
  return adminStore.contracts.reduce((sum, contract) => 
    sum + (contract.precioFinal || contract.presupuestoSugerido), 0
  )
})

const averageContractValue = computed(() => {
  const contracts = adminStore.contracts
  return contracts.length > 0 ? Math.round(totalContractValue.value / contracts.length) : 0
})

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

const getContractStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'abierto': 'Abierto',
    'esperando_deposito': 'Esperando Depósito',
    'fondos_garantia': 'En Progreso',
    'entrega_realizada': 'Entregado',
    'completado': 'Completado',
    'disputado': 'Disputado',
    'cancelado': 'Cancelado'
  }
  return labels[status] || status
}

const getContractStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    'abierto': 'bg-blue-900/30 text-blue-300',
    'esperando_deposito': 'bg-yellow-900/30 text-yellow-300',
    'fondos_garantia': 'bg-purple-900/30 text-purple-300',
    'entrega_realizada': 'bg-orange-900/30 text-orange-300',
    'completado': 'bg-green-900/30 text-green-300',
    'disputado': 'bg-red-900/30 text-red-300',
    'cancelado': 'bg-gray-900/30 text-gray-300'
  }
  return classes[status] || 'bg-gray-900/30 text-gray-300'
}

const getClientAlias = (clientId: string) => {
  const client = adminStore.clients.find(c => c.uid === clientId)
  return client?.alias || 'Cliente Desconocido'
}

const getSpecialistAlias = (specialistId: string) => {
  const specialist = adminStore.specialists.find(s => s.uid === specialistId)
  return specialist?.alias || 'Especialista Desconocido'
}

const viewContractDetails = (contract: Contrato) => {
  selectedContract.value = contract
}

const resolveDispute = (contract: Contrato) => {
  selectedContract.value = contract
}

const cancelContract = async (contractId: string) => {
  if (confirm('¿Estás seguro de que quieres cancelar este contrato?')) {
    try {
      await adminStore.cancelContract(contractId)
    } catch (error) {
      console.error('Error canceling contract:', error)
    }
  }
}

const handleResolveDispute = async (contractId: string, resolution: 'client' | 'specialist') => {
  try {
    await adminStore.resolveDispute(contractId, resolution)
    selectedContract.value = null
  } catch (error) {
    console.error('Error resolving dispute:', error)
  }
}

const exportContracts = async () => {
  try {
    const data = await adminStore.exportData('contracts', 'csv')
    const blob = new Blob([data], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contracts-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error exporting contracts:', error)
  }
}

onMounted(async () => {
  if (adminStore.contracts.length === 0) {
    loading.value = true
    try {
      await adminStore.loadContracts()
    } catch (error) {
      console.error('Error loading contracts:', error)
    } finally {
      loading.value = false
    }
  }
})
</script>