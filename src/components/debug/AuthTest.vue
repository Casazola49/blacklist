<template>
  <div class="fixed top-4 left-4 bg-bg-secondary border border-accent-cyan/30 rounded p-4 max-w-sm text-xs z-50" v-if="showTest">
    <div class="flex justify-between items-center mb-2">
      <h4 class="text-accent-cyan font-semibold">Test de Auth</h4>
      <button @click="showTest = false" class="text-text-muted hover:text-accent-cyan">×</button>
    </div>
    
    <div class="space-y-2">
      <div class="flex justify-between">
        <span>Estado:</span>
        <span :class="statusColor">{{ status }}</span>
      </div>
      
      <div v-if="user" class="text-success text-xs">
        <p>✅ Usuario: {{ user.displayName }}</p>
        <p>📧 Email: {{ user.email }}</p>
      </div>
      
      <div v-if="error" class="text-error text-xs">
        <p>❌ Error: {{ error }}</p>
      </div>
    </div>
    
    <div class="mt-3 pt-2 border-t border-accent-cyan/20 space-y-2">
      <button 
        @click="testGoogleAuth" 
        class="w-full text-accent-cyan hover:text-accent-cyan/80 text-xs bg-accent-cyan/10 p-2 rounded"
        :disabled="loading"
      >
        {{ loading ? 'Probando...' : 'Probar Google Auth' }}
      </button>
      
      <button 
        v-if="user"
        @click="signOut" 
        class="w-full text-error hover:text-error/80 text-xs bg-error/10 p-2 rounded"
      >
        Cerrar Sesión
      </button>
    </div>
  </div>
  
  <!-- Toggle button -->
  <button 
    v-else-if="isDev"
    @click="showTest = true"
    class="fixed top-4 left-4 bg-accent-cyan/20 text-accent-cyan p-2 rounded text-xs z-50"
  >
    🧪 Test Auth
  </button>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { AuthService } from '../../services/auth'

const showTest = ref(false)
const loading = ref(false)
const user = ref(null)
const error = ref('')
const status = ref('No autenticado')

const isDev = computed(() => import.meta.env.DEV)

const statusColor = computed(() => {
  if (user.value) return 'text-success'
  if (error.value) return 'text-error'
  return 'text-yellow-400'
})

const testGoogleAuth = async () => {
  loading.value = true
  error.value = ''
  status.value = 'Probando...'
  
  try {
    const result = await AuthService.signInWithGoogle()
    if (result) {
      user.value = result
      status.value = 'Autenticado'
      error.value = ''
    } else {
      status.value = 'Sin respuesta'
      error.value = 'No se recibió usuario'
    }
  } catch (err: any) {
    console.error('Test auth error:', err)
    status.value = 'Error'
    
    // Mapear errores específicos
    if (err.code === 'auth/operation-not-allowed') {
      error.value = 'Google Auth no habilitado en Firebase Console'
    } else if (err.code === 'auth/popup-blocked') {
      error.value = 'Popup bloqueado por el navegador'
    } else if (err.code === 'auth/network-request-failed') {
      error.value = 'Error de red - verifica bloqueadores'
    } else {
      error.value = err.message || 'Error desconocido'
    }
  } finally {
    loading.value = false
  }
}

const signOut = async () => {
  try {
    await AuthService.signOut()
    user.value = null
    status.value = 'Sesión cerrada'
    error.value = ''
  } catch (err: any) {
    error.value = 'Error al cerrar sesión'
  }
}
</script>