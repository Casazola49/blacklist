<template>
  <div class="space-y-6">
    <!-- Header with filters -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-white">
          <GlitchText text="Gestión de Usuarios" />
        </h2>
        <p class="text-gray-400 mt-1">Administrar clientes y especialistas</p>
      </div>
      
      <div class="flex flex-wrap gap-3">
        <select 
          v-model="selectedFilter"
          class="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
        >
          <option value="all">Todos los usuarios</option>
          <option value="clients">Solo clientes</option>
          <option value="specialists">Solo especialistas</option>
          <option value="pending">Pendientes</option>
          <option value="suspended">Suspendidos</option>
        </select>
        
        <NeonButton @click="exportUsers" variant="secondary" size="sm">
          Exportar
        </NeonButton>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <HologramCard class="p-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-white">{{ adminStore.stats.totalClients }}</div>
          <div class="text-sm text-gray-400">Clientes</div>
        </div>
      </HologramCard>
      
      <HologramCard class="p-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-white">{{ adminStore.stats.totalSpecialists }}</div>
          <div class="text-sm text-gray-400">Especialistas</div>
        </div>
      </HologramCard>
      
      <HologramCard class="p-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-accent-warning">{{ adminStore.stats.pendingApprovals }}</div>
          <div class="text-sm text-gray-400">Pendientes</div>
        </div>
      </HologramCard>
      
      <HologramCard class="p-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-error">{{ adminStore.stats.suspendedUsers }}</div>
          <div class="text-sm text-gray-400">Suspendidos</div>
        </div>
      </HologramCard>
    </div>

    <!-- Users Table -->
    <HologramCard class="overflow-hidden">
      <div class="p-6">
        <div v-if="loading" class="flex justify-center py-8">
          <CyberLoader />
        </div>
        
        <div v-else-if="filteredUsers.length === 0" class="text-center py-8 text-gray-400">
          No se encontraron usuarios
        </div>
        
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-700">
                <th class="text-left py-3 px-4 text-gray-300 font-medium">Usuario</th>
                <th class="text-left py-3 px-4 text-gray-300 font-medium">Tipo</th>
                <th class="text-left py-3 px-4 text-gray-300 font-medium">Estado</th>
                <th class="text-left py-3 px-4 text-gray-300 font-medium">Registro</th>
                <th class="text-left py-3 px-4 text-gray-300 font-medium">Estadísticas</th>
                <th class="text-right py-3 px-4 text-gray-300 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="user in paginatedUsers" 
                :key="user.uid"
                class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
              >
                <td class="py-4 px-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-brand-primary to-accent-cyan rounded-full flex items-center justify-center text-white font-bold">
                      {{ user.alias.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <div class="text-white font-medium">{{ user.alias }}</div>
                      <div class="text-sm text-gray-400">{{ user.email }}</div>
                    </div>
                  </div>
                </td>
                
                <td class="py-4 px-4">
                  <span :class="[
                    'px-2 py-1 text-xs rounded-full',
                    user.tipo === 'cliente' ? 'bg-blue-900/30 text-blue-300' :
                    user.tipo === 'especialista' ? 'bg-purple-900/30 text-purple-300' :
                    'bg-red-900/30 text-red-300'
                  ]">
                    {{ user.tipo.charAt(0).toUpperCase() + user.tipo.slice(1) }}
                  </span>
                </td>
                
                <td class="py-4 px-4">
                  <span :class="[
                    'px-2 py-1 text-xs rounded-full',
                    user.estado === 'activo' ? 'bg-green-900/30 text-green-300' :
                    user.estado === 'pendiente' ? 'bg-yellow-900/30 text-yellow-300' :
                    user.estado === 'suspendido' ? 'bg-red-900/30 text-red-300' :
                    'bg-gray-900/30 text-gray-300'
                  ]">
                    {{ getStatusLabel(user.estado) }}
                  </span>
                </td>
                
                <td class="py-4 px-4 text-gray-300 text-sm">
                  {{ formatDate(user.fechaCreacion) }}
                </td>
                
                <td class="py-4 px-4">
                  <div class="text-sm text-gray-300">
                    <div v-if="user.tipo === 'especialista'">
                      <div>⭐ {{ (user as Especialista).calificacionPromedio.toFixed(1) }}</div>
                      <div>📋 {{ (user as Especialista).trabajosCompletados }}</div>
                      <div>💰 ${{ (user as Especialista).gananciasTotal }}</div>
                    </div>
                    <div v-else-if="user.tipo === 'cliente'">
                      <div>📋 {{ (user as Cliente).contractosActivos.length }} activos</div>
                      <div>📚 {{ (user as Cliente).historialContratos.length }} completados</div>
                      <div>💰 ${{ (user as Cliente).saldoEscrow }} escrow</div>
                    </div>
                  </div>
                </td>
                
                <td class="py-4 px-4">
                  <div class="flex justify-end space-x-2">
                    <NeonButton 
                      @click="viewUserDetails(user)"
                      size="sm" 
                      variant="secondary"
                    >
                      Ver
                    </NeonButton>
                    
                    <NeonButton 
                      v-if="user.tipo === 'especialista' && user.estado === 'pendiente'"
                      @click="approveSpecialist(user.uid)"
                      size="sm" 
                      variant="primary"
                    >
                      Aprobar
                    </NeonButton>
                    
                    <NeonButton 
                      v-if="user.tipo === 'especialista' && user.estado === 'pendiente'"
                      @click="rejectSpecialist(user.uid)"
                      size="sm" 
                      variant="danger"
                    >
                      Rechazar
                    </NeonButton>
                    
                    <NeonButton 
                      v-if="user.estado === 'activo'"
                      @click="suspendUser(user.uid)"
                      size="sm" 
                      variant="warning"
                    >
                      Suspender
                    </NeonButton>
                    
                    <NeonButton 
                      v-if="user.estado === 'suspendido'"
                      @click="reactivateUser(user.uid)"
                      size="sm" 
                      variant="primary"
                    >
                      Reactivar
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

    <!-- User Details Modal -->
    <UserDetailsModal 
      v-if="selectedUser"
      :user="selectedUser"
      @close="selectedUser = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '../../stores/admin'
import type { Usuario, Cliente, Especialista } from '../../types'
import HologramCard from '../ui/HologramCard.vue'
import GlitchText from '../ui/GlitchText.vue'
import NeonButton from '../ui/NeonButton.vue'
import CyberLoader from '../ui/CyberLoader.vue'
import UserDetailsModal from './UserDetailsModal.vue'

const adminStore = useAdminStore()
const loading = ref(false)
const selectedFilter = ref('all')
const currentPage = ref(1)
const itemsPerPage = 10
const selectedUser = ref<Usuario | null>(null)

const filteredUsers = computed(() => {
  let users = adminStore.users
  
  switch (selectedFilter.value) {
    case 'clients':
      users = adminStore.clients
      break
    case 'specialists':
      users = adminStore.specialists
      break
    case 'pending':
      users = adminStore.pendingSpecialists
      break
    case 'suspended':
      users = adminStore.suspendedUsers
      break
  }
  
  return users
})

const totalPages = computed(() => 
  Math.ceil(filteredUsers.value.length / itemsPerPage)
)

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredUsers.value.slice(start, end)
})

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'activo': 'Activo',
    'pendiente': 'Pendiente',
    'suspendido': 'Suspendido',
    'rechazado': 'Rechazado'
  }
  return labels[status] || status
}

const viewUserDetails = (user: Usuario | Cliente | Especialista) => {
  selectedUser.value = user as Usuario
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

const suspendUser = async (uid: string) => {
  if (confirm('¿Estás seguro de que quieres suspender este usuario?')) {
    try {
      await adminStore.suspendUser(uid)
    } catch (error) {
      console.error('Error suspending user:', error)
    }
  }
}

const reactivateUser = async (uid: string) => {
  try {
    await adminStore.reactivateUser(uid)
  } catch (error) {
    console.error('Error reactivating user:', error)
  }
}

const exportUsers = async () => {
  try {
    const data = await adminStore.exportData('users', 'csv')
    const blob = new Blob([data], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error exporting users:', error)
  }
}

onMounted(async () => {
  if (adminStore.users.length === 0) {
    loading.value = true
    try {
      await adminStore.loadUsers()
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      loading.value = false
    }
  }
})
</script>