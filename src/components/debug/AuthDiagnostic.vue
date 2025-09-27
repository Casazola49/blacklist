<template>
  <div v-if="showDiagnostic" class="fixed bottom-4 right-4 bg-bg-secondary border border-accent-cyan/30 rounded p-4 max-w-sm text-xs z-50">
    <div class="flex justify-between items-center mb-2">
      <h4 class="text-accent-cyan font-semibold">Diagnóstico de Auth</h4>
      <button @click="showDiagnostic = false" class="text-text-muted hover:text-accent-cyan">×</button>
    </div>
    
    <div class="space-y-2">
      <div class="flex justify-between">
        <span>Firebase Config:</span>
        <span :class="firebaseConfigStatus.color">{{ firebaseConfigStatus.text }}</span>
      </div>
      
      <div class="flex justify-between">
        <span>CSP Headers:</span>
        <span :class="cspStatus.color">{{ cspStatus.text }}</span>
      </div>
      
      <div class="flex justify-between">
        <span>Google APIs:</span>
        <span :class="googleApisStatus.color">{{ googleApisStatus.text }}</span>
      </div>
      
      <div class="flex justify-between">
        <span>reCAPTCHA:</span>
        <span :class="recaptchaStatus.color">{{ recaptchaStatus.text }}</span>
      </div>
      
      <div class="flex justify-between">
        <span>Network:</span>
        <span :class="networkStatus.color">{{ networkStatus.text }}</span>
      </div>
    </div>
    
    <div v-if="errors.length > 0" class="mt-3 pt-2 border-t border-accent-cyan/20">
      <h5 class="text-error font-semibold mb-1">Errores detectados:</h5>
      <ul class="text-error text-xs space-y-1">
        <li v-for="error in errors" :key="error">• {{ error }}</li>
      </ul>
    </div>
    
    <div class="mt-3 pt-2 border-t border-accent-cyan/20">
      <button 
        @click="runDiagnostic" 
        class="text-accent-cyan hover:text-accent-cyan/80 text-xs"
        :disabled="isRunning"
      >
        {{ isRunning ? 'Ejecutando...' : 'Ejecutar diagnóstico' }}
      </button>
    </div>
  </div>
  
  <!-- Toggle button -->
  <button 
    v-else-if="isDev"
    @click="showDiagnostic = true"
    class="fixed bottom-4 right-4 bg-accent-cyan/20 text-accent-cyan p-2 rounded text-xs z-50"
  >
    🔧 Debug Auth
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const showDiagnostic = ref(false)
const isRunning = ref(false)
const errors = ref<string[]>([])

const isDev = computed(() => import.meta.env.DEV)

// Status tracking
const firebaseConfigStatus = ref({ text: 'Checking...', color: 'text-yellow-400' })
const cspStatus = ref({ text: 'Checking...', color: 'text-yellow-400' })
const googleApisStatus = ref({ text: 'Checking...', color: 'text-yellow-400' })
const recaptchaStatus = ref({ text: 'Checking...', color: 'text-yellow-400' })
const networkStatus = ref({ text: 'Checking...', color: 'text-yellow-400' })

const checkFirebaseConfig = () => {
  try {
    const requiredVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID'
    ]
    
    const missing = requiredVars.filter(key => !import.meta.env[key])
    
    if (missing.length > 0) {
      firebaseConfigStatus.value = { text: 'Missing vars', color: 'text-error' }
      errors.value.push(`Variables faltantes: ${missing.join(', ')}`)
    } else {
      firebaseConfigStatus.value = { text: 'OK', color: 'text-success' }
    }
  } catch (error) {
    firebaseConfigStatus.value = { text: 'Error', color: 'text-error' }
    errors.value.push('Error al verificar configuración de Firebase')
  }
}

const checkCSP = () => {
  try {
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
    if (!cspMeta) {
      cspStatus.value = { text: 'No CSP', color: 'text-yellow-400' }
      return
    }
    
    const cspContent = cspMeta.getAttribute('content') || ''
    const requiredDomains = [
      'https://apis.google.com',
      'https://www.gstatic.com',
      'https://identitytoolkit.googleapis.com',
      'https://securetoken.googleapis.com'
    ]
    
    const missing = requiredDomains.filter(domain => !cspContent.includes(domain))
    
    if (missing.length > 0) {
      cspStatus.value = { text: 'Restrictive', color: 'text-error' }
      errors.value.push(`CSP bloquea: ${missing.join(', ')}`)
    } else {
      cspStatus.value = { text: 'OK', color: 'text-success' }
    }
  } catch (error) {
    cspStatus.value = { text: 'Error', color: 'text-error' }
  }
}

const checkGoogleAPIs = async () => {
  try {
    const response = await fetch('https://apis.google.com/js/api.js', { 
      method: 'HEAD',
      mode: 'no-cors'
    })
    googleApisStatus.value = { text: 'Accessible', color: 'text-success' }
  } catch (error) {
    googleApisStatus.value = { text: 'Blocked', color: 'text-error' }
    errors.value.push('Google APIs no accesibles')
  }
}

const checkReCAPTCHA = async () => {
  try {
    // Check if reCAPTCHA domains are accessible
    const recaptchaDomains = [
      'https://www.google.com/recaptcha/',
      'https://www.recaptcha.net/'
    ]
    
    let accessible = false
    for (const domain of recaptchaDomains) {
      try {
        await fetch(domain, { method: 'HEAD', mode: 'no-cors' })
        accessible = true
        break
      } catch (e) {
        // Continue to next domain
      }
    }
    
    if (accessible) {
      recaptchaStatus.value = { text: 'Accessible', color: 'text-success' }
    } else {
      recaptchaStatus.value = { text: 'Blocked', color: 'text-error' }
      errors.value.push('reCAPTCHA domains no accesibles')
    }
  } catch (error) {
    recaptchaStatus.value = { text: 'Error', color: 'text-error' }
  }
}

const checkNetwork = async () => {
  try {
    const start = Date.now()
    await fetch('https://www.google.com', { 
      method: 'HEAD', 
      mode: 'no-cors',
      cache: 'no-cache'
    })
    const latency = Date.now() - start
    
    if (latency < 1000) {
      networkStatus.value = { text: `OK (${latency}ms)`, color: 'text-success' }
    } else {
      networkStatus.value = { text: `Slow (${latency}ms)`, color: 'text-yellow-400' }
    }
  } catch (error) {
    networkStatus.value = { text: 'Offline', color: 'text-error' }
    errors.value.push('Sin conexión a internet')
  }
}

const runDiagnostic = async () => {
  if (isRunning.value) return
  
  isRunning.value = true
  errors.value = []
  
  // Reset all statuses
  firebaseConfigStatus.value = { text: 'Checking...', color: 'text-yellow-400' }
  cspStatus.value = { text: 'Checking...', color: 'text-yellow-400' }
  googleApisStatus.value = { text: 'Checking...', color: 'text-yellow-400' }
  recaptchaStatus.value = { text: 'Checking...', color: 'text-yellow-400' }
  networkStatus.value = { text: 'Checking...', color: 'text-yellow-400' }
  
  // Run checks
  checkFirebaseConfig()
  checkCSP()
  
  await Promise.all([
    checkGoogleAPIs(),
    checkReCAPTCHA(),
    checkNetwork()
  ])
  
  isRunning.value = false
}

onMounted(() => {
  if (isDev.value) {
    // Auto-run diagnostic in development
    setTimeout(runDiagnostic, 1000)
  }
})
</script>