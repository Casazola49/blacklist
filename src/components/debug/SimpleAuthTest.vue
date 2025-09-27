<template>
  <div class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-bg-secondary border border-accent-cyan/30 rounded p-6 max-w-md z-50" v-if="showTest">
    <div class="text-center">
      <h3 class="text-xl font-bold text-accent-cyan mb-4">Test de Autenticación Simple</h3>
      
      <div v-if="loading" class="mb-4">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-cyan mx-auto"></div>
        <p class="text-text-secondary mt-2">{{ loadingMessage }}</p>
      </div>
      
      <div v-if="user" class="mb-4 p-4 bg-success/20 border border-success/50 rounded">
        <p class="text-success font-semibold">✅ Autenticación exitosa!</p>
        <p class="text-sm text-text-secondary mt-1">{{ user.displayName }}</p>
        <p class="text-sm text-text-secondary">{{ user.email }}</p>
      </div>
      
      <div v-if="error" class="mb-4 p-4 bg-error/20 border border-error/50 rounded">
        <p class="text-error font-semibold">❌ Error:</p>
        <p class="text-sm text-error mt-1">{{ error }}</p>
      </div>
      
      <div class="space-y-3">
        <button 
          @click="testPopupAuth" 
          class="w-full bg-accent-cyan/20 text-accent-cyan p-3 rounded hover:bg-accent-cyan/30 transition-colors"
          :disabled="loading"
        >
          🪟 Probar Popup
        </button>
        
        <button 
          @click="testRedirectAuth" 
          class="w-full bg-accent-purple/20 text-accent-purple p-3 rounded hover:bg-accent-purple/30 transition-colors"
          :disabled="loading"
        >
          🔄 Probar Redirección
        </button>
        
        <button 
          v-if="user"
          @click="signOut" 
          class="w-full bg-error/20 text-error p-3 rounded hover:bg-error/30 transition-colors"
        >
          🚪 Cerrar Sesión
        </button>
        
        <button 
          @click="showTest = false" 
          class="w-full bg-text-muted/20 text-text-muted p-2 rounded hover:bg-text-muted/30 transition-colors text-sm"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
  
  <!-- Toggle button -->
  <button 
    v-else-if="isDev"
    @click="showTest = true"
    class="fixed top-1/2 left-4 transform -translate-y-1/2 bg-accent-cyan/20 text-accent-cyan p-3 rounded text-sm z-50 writing-mode-vertical"
  >
    🧪 Test Simple
  </button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from '../../services/firebase'

const showTest = ref(false)
const loading = ref(false)
const loadingMessage = ref('')
const user = ref(null)
const error = ref('')

const isDev = computed(() => import.meta.env.DEV)

const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('email')
googleProvider.addScope('profile')

const clearState = () => {
  error.value = ''
  user.value = null
}

const testPopupAuth = async () => {
  loading.value = true
  loadingMessage.value = 'Abriendo popup de Google...'
  clearState()
  
  try {
    const result = await signInWithPopup(auth, googleProvider)
    user.value = result.user
    loadingMessage.value = ''
  } catch (err: any) {
    console.error('Popup auth error:', err)
    error.value = `Popup falló: ${err.code || err.message}`
    loadingMessage.value = ''
  } finally {
    loading.value = false
  }
}

const testRedirectAuth = async () => {
  loading.value = true
  loadingMessage.value = 'Redirigiendo a Google...'
  clearState()
  
  try {
    await signInWithRedirect(auth, googleProvider)
    // La página se recargará automáticamente
  } catch (err: any) {
    console.error('Redirect auth error:', err)
    error.value = `Redirección falló: ${err.code || err.message}`
    loading.value = false
    loadingMessage.value = ''
  }
}

const signOut = async () => {
  try {
    await firebaseSignOut(auth)
    user.value = null
    error.value = ''
  } catch (err: any) {
    error.value = `Error al cerrar sesión: ${err.message}`
  }
}

// Check for redirect result on mount
onMounted(async () => {
  try {
    const result = await getRedirectResult(auth)
    if (result) {
      user.value = result.user
      showTest.value = true // Show the test panel if we got a redirect result
    }
  } catch (err: any) {
    console.error('Redirect result error:', err)
    error.value = `Error en redirección: ${err.code || err.message}`
    showTest.value = true
  }
})
</script>

<style scoped>
.writing-mode-vertical {
  writing-mode: vertical-rl;
  text-orientation: mixed;
}
</style>