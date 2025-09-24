<template>
  <div class="space-y-6">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <HologramCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-400">Total Usuarios</p>
            <AnimatedCounter 
              :target="stats.totalUsers" 
              class="text-2xl font-bold text-white"
            />
          </div>
          <div class="text-accent-cyan text-3xl">👥</div>
        </div>
      </HologramCard>

      <HologramCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-400">Contratos Activos</p>
            <AnimatedCounter 
              :target="stats.activeContracts" 
              class="text-2xl font-bold text-white"
            />
          </div>
          <div class="text-accent-magenta text-3xl">📋</div>
        </div>
      </HologramCard>

      <HologramCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-400">Fondos en Escrow</p>
            <div class="text-2xl font-bold text-white">
              $<AnimatedCounter :target="stats.escrowFunds" />
            </div>
          </div>
          <div class="text-success text-3xl">💰</div>
        </div>
      </HologramCard>

      <HologramCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-400">Comisiones (Mes)</p>
            <div class="text-2xl font-bold text-white">
              $<AnimatedCounter :target="stats.monthlyCommissions" />
            </div>
          </div>
          <div class="text-warning text-3xl">📈</div>
        </div>
      </HologramCard>
    </div>

    <!-- Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Pending Approvals -->
      <HologramCard class="p-6">
        <h3 class="text-lg font-semibold text-white mb-4">
          <GlitchText text="Aprobaciones Pendientes" />
        </h3>
        
        <div v-if="loading" class="flex justify-center py-8">
          <CyberLoader />
        </div>
        
        <div v-else-if="pendingSpecialists.length === 0" class="text-center py-8 text-gray-400">
          No hay especialistas pendientes de aprobación
        </div>
        
        <div v-else class="space-y-3">
          <div 
            v-for="specialist in pendingSpecialists.slice(0, 5)" 
            :key="specialist.uid"
            class="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
          >
            <div>
              <p class="text-white font-medium">{{ specialist.alias }}</p>
              <p class="text-sm text-gray-400">{{ specialist.email }}</p>
              <div class="flex flex-wrap gap-1 mt-1">
                <span 
                  v-for="skill in specialist.habilidades.slice(0, 3)" 
                  :key="skill"
                  class="px-2 py-1 text-xs bg-brand-primary/20 text-brand-primary rounded"
                >
                  {{ skill }}
                </span>
              </div>
            </div>
            <div class="flex space-x-2">
              <NeonButton 
                @click="approveSpecialist(specialist.uid)"
                size="sm" 
                variant="primary"
              >
                ✓
              </NeonButton>
              <NeonButton 
                @click="rejectSpecialist(specialist.uid)"
                size="sm" 
                variant="danger"
              >
                ✗
              </NeonButton>
            </div>
          </div>
          
          <div v-if="pendingSpecialists.length > 5" class="text-center pt-2">
            <NeonButton @click="$emit('switchTab', 'users')" variant="secondary" size="sm">
              Ver todos ({{ pendingSpecialists.length }})
            </NeonButton>
          </div>
        </div>
      </HologramCard>

      <!-- Recent Disputes -->
      <HologramCard class="p-6">
        <h3 class="text-lg font-semibold text-white mb-4">
          <GlitchText text="Disputas Recientes" />
        </h3>
        
        <div v-if="disputedContracts.length === 0" class="text-center py-8 text-gray-400">
          No hay disputas activas
        </div>
        
        <div v-else class="space-y-3">
          <div 
            v-for="contract in disputedContracts.slice(0, 5)" 
            :key="contract.id"
            class="p-3 bg-red-900/20 rounded-lg border border-red-500/30"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-white font-medium">{{ contract.titulo }}</p>
                <p class="text-sm text-gray-400">
                  ${{ contract.precioFinal }} • {{ formatDate(contract.fechaCreacion) }}
                </p>
              </div>
              <NeonButton 
                @click="$emit('switchTab', 'disputes')"
                size="sm" 
                variant="warning"
              >
                Revisar
              </NeonButton>
            </div>
          </div>
        </div>
      </HologramCard>
    </div>

    <!-- System Health -->
    <HologramCard class="p-6">
      <h3 class="text-lg font-semibold text-white mb-4">
        <GlitchText text="Estado del Sistema" />
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="text-center">
          <RadialProgress 
            :value="systemHealth.database" 
            :max="100"
            color="success"
            class="mx-auto mb-2"
          />
          <p class="text-sm text-gray-400">Base de Datos</p>
        </div>
        
        <div class="text-center">
          <RadialProgress 
            :value="systemHealth.authentication" 
            :max="100"
            color="info"
            class="mx-auto mb-2"
          />
          <p class="text-sm text-gray-400">Autenticación</p>
        </div>
        
        <div class="text-center">
          <RadialProgress 
            :value="systemHealth.storage" 
            :max="100"
            color="warning"
            class="mx-auto mb-2"
          />
          <p class="text-sm text-gray-400">Almacenamiento</p>
        </div>
      </div>
    </HologramCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAdminStore } from '../../stores/admin'
import HologramCard from '../ui/HologramCard.vue'
import GlitchText from '../ui/GlitchText.vue'
import NeonButton from '../ui/NeonButton.vue'
import CyberLoader from '../ui/CyberLoader.vue'
import AnimatedCounter from '../ui/AnimatedCounter.vue'
import RadialProgress from '../ui/RadialProgress.vue'

defineEmits<{
  switchTab: [tab: string]
}>()

const adminStore = useAdminStore()
const loading = ref(true)

const stats = computed(() => adminStore.stats)
const pendingSpecialists = computed(() => adminStore.pendingSpecialists)
const disputedContracts = computed(() => adminStore.disputedContracts)

const systemHealth = ref({
  database: 98,
  authentication: 100,
  storage: 95
})

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

const approveSpecialist = async (uid: string) => {
  try {
    await adminStore.approveSpecialist(uid)
  } catch (error) {
    console.error('Error approving specialist:', error)
  }
}

const rejectSpecialist = async (uid: string) => {
  try {
    await adminStore.rejectSpecialist(uid)
  } catch (error) {
    console.error('Error rejecting specialist:', error)
  }
}

onMounted(async () => {
  try {
    await adminStore.loadDashboardData()
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    loading.value = false
  }
})
</script>