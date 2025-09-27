import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/css/main.css'

console.log('🚀 Starting The Blacklist Demo...')

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Simple error handling
app.config.errorHandler = (error, instance, info) => {
  console.error('Vue Error:', error, info)
}

// Mount app immediately
app.mount('#app')

// Initialize auth after mounting
setTimeout(async () => {
  try {
    const { useAuthStore } = await import('./stores/auth')
    const authStore = useAuthStore()
    await authStore.initializeAuth()
    console.log('✅ Auth initialized')
  } catch (error) {
    console.warn('Auth initialization failed:', error)
  }
}, 100)

console.log('✅ The Blacklist Demo mounted!')