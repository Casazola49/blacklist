<template>
  <div class="auth-view min-h-screen flex items-center justify-center p-4">
    <HologramCard class="w-full max-w-md">
      <!-- Loading State -->
      <div v-if="authStore.loading" class="text-center py-8">
        <CyberLoader />
        <p class="text-text-secondary mt-4">Verificando acceso...</p>
      </div>

      <!-- Authenticated User States -->
      <div v-else-if="authStore.isAuthenticated" class="text-center">
        <!-- Pending Specialist -->
        <div v-if="authStore.userProfile?.tipo === 'especialista' && authStore.userProfile?.estado === 'pendiente'">
          <GlitchText text="POSTULACIÓN EN REVISIÓN" class="text-xl mb-4" />
          <div class="mb-6 p-4 bg-warning/20 border border-warning/50 rounded">
            <p class="text-warning text-sm mb-2">Tu postulación está siendo revisada</p>
            <p class="text-text-secondary text-xs">
              Recibirás una notificación por email cuando el Conserje complete la revisión
            </p>
          </div>
          <NeonButton variant="ghost" @click="signOut" class="w-full">
            Cerrar Sesión
          </NeonButton>
        </div>

        <!-- Rejected Specialist -->
        <div v-else-if="authStore.userProfile?.tipo === 'especialista' && authStore.userProfile?.estado === 'rechazado'">
          <GlitchText text="ACCESO DENEGADO" class="text-xl mb-4" />
          <div class="mb-6 p-4 bg-error/20 border border-error/50 rounded">
            <p class="text-error text-sm mb-2">Tu postulación no fue aprobada</p>
            <p class="text-text-secondary text-xs">
              Puedes intentar postularte nuevamente con información actualizada
            </p>
          </div>
          <div class="space-y-3">
            <NeonButton variant="primary" @click="$router.push('/auth/register/especialista')" class="w-full">
              Postular Nuevamente
            </NeonButton>
            <NeonButton variant="ghost" @click="signOut" class="w-full">
              Cerrar Sesión
            </NeonButton>
          </div>
        </div>

        <!-- Suspended User -->
        <div v-else-if="authStore.userProfile?.estado === 'suspendido'">
          <GlitchText text="CUENTA SUSPENDIDA" class="text-xl mb-4" />
          <div class="mb-6 p-4 bg-error/20 border border-error/50 rounded">
            <p class="text-error text-sm mb-2">Tu cuenta ha sido suspendida</p>
            <p class="text-text-secondary text-xs">
              Contacta al soporte para más información
            </p>
          </div>
          <NeonButton variant="ghost" @click="signOut" class="w-full">
            Cerrar Sesión
          </NeonButton>
        </div>

        <!-- Active User - Redirect to Dashboard -->
        <div v-else>
          <GlitchText text="ACCESO AUTORIZADO" class="text-xl mb-4" />
          <p class="text-text-secondary text-sm mb-6">
            Redirigiendo a tu dashboard...
          </p>
          <CyberLoader />
        </div>
      </div>

      <!-- Guest User - Registration Options -->
      <div v-else class="text-center">
        <GlitchText text="ACCESO AUTORIZADO" class="text-2xl mb-6" />
        
        <!-- Error Display -->
        <div v-if="authStore.error" class="mb-6 p-4 bg-error/20 border border-error/50 rounded">
          <p class="text-error text-sm">{{ authStore.error }}</p>
          <NeonButton 
            variant="ghost" 
            size="sm" 
            class="mt-2" 
            @click="authStore.clearError"
          >
            Cerrar
          </NeonButton>
        </div>

        <div class="space-y-4">
          <NeonButton 
            variant="primary" 
            class="w-full"
            @click="$router.push('/auth/register/cliente')"
          >
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
            </svg>
            Registrarse como Cliente
          </NeonButton>
          
          <NeonButton 
            variant="secondary" 
            class="w-full"
            @click="$router.push('/auth/register/especialista')"
          >
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            Postular como Especialista
          </NeonButton>
        </div>

        <div class="mt-6 pt-6 border-t border-accent-cyan/20">
          <p class="text-text-muted text-xs">
            ¿Ya tienes cuenta? El sistema te reconocerá automáticamente
          </p>
        </div>
      </div>
    </HologramCard>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import GlitchText from '../components/ui/GlitchText.vue'
import NeonButton from '../components/ui/NeonButton.vue'
import HologramCard from '../components/ui/HologramCard.vue'
import CyberLoader from '../components/ui/CyberLoader.vue'

const router = useRouter()
const authStore = useAuthStore()

const signOut = async () => {
  try {
    await authStore.signOut()
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

// Watch for authentication state changes to redirect
watch(
  () => authStore.userProfile,
  (profile) => {
    if (profile && profile.estado === 'activo') {
      // Redirect to appropriate dashboard
      const dashboardRoute = getDashboardRoute(profile.tipo)
      if (dashboardRoute) {
        router.push(dashboardRoute)
      }
    }
  },
  { immediate: true }
)

const getDashboardRoute = (tipo: string) => {
  switch (tipo) {
    case 'cliente':
      return '/dashboard/cliente'
    case 'especialista':
      return '/dashboard/especialista'
    case 'admin':
      return '/dashboard/admin'
    default:
      return null
  }
}

onMounted(() => {
  // Clear any previous errors
  authStore.clearError()
})
</script>

<style scoped>
.auth-view {
  @apply bg-primary;
  background: 
    radial-gradient(circle at 30% 70%, rgba(0, 255, 255, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 70% 30%, rgba(255, 0, 255, 0.05) 0%, transparent 50%);
}
</style>