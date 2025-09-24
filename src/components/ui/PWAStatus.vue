<template>
  <div class="pwa-status">
    <!-- Connection Status -->
    <div 
      v-if="showConnectionStatus"
      class="connection-status"
      :class="connectionStatusClass"
    >
      <div class="flex items-center space-x-2">
        <div class="status-indicator" :class="indicatorClass"></div>
        <span class="text-sm font-medium">{{ connectionStatusText }}</span>
        <div v-if="pendingCount > 0" class="pending-badge">
          {{ pendingCount }}
        </div>
      </div>
    </div>

    <!-- PWA Update Available -->
    <Transition name="slide-down">
      <div 
        v-if="updateAvailable"
        class="update-notification"
      >
        <div class="flex items-center justify-between p-4">
          <div class="flex items-center space-x-3">
            <div class="update-icon">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-white">Nueva versión disponible</p>
              <p class="text-xs text-gray-300">Actualiza para obtener las últimas mejoras</p>
            </div>
          </div>
          <div class="flex space-x-2">
            <button 
              @click="updateApp"
              :disabled="updating"
              class="update-btn"
            >
              <span v-if="updating">Actualizando...</span>
              <span v-else>Actualizar</span>
            </button>
            <button 
              @click="dismissUpdate"
              class="dismiss-btn"
            >
              Después
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Install PWA Prompt -->
    <Transition name="slide-up">
      <div 
        v-if="showInstallPrompt && !isPWAInstalled"
        class="install-prompt"
      >
        <div class="flex items-center justify-between p-4">
          <div class="flex items-center space-x-3">
            <div class="install-icon">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-white">Instalar The Blacklist</p>
              <p class="text-xs text-gray-300">Acceso rápido desde tu pantalla de inicio</p>
            </div>
          </div>
          <div class="flex space-x-2">
            <button 
              @click="installPWA"
              :disabled="installing"
              class="install-btn"
            >
              <span v-if="installing">Instalando...</span>
              <span v-else>Instalar</span>
            </button>
            <button 
              @click="dismissInstall"
              class="dismiss-btn"
            >
              No ahora
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Offline Capabilities Info -->
    <Transition name="fade">
      <div 
        v-if="showOfflineInfo && !isOnline"
        class="offline-info"
      >
        <div class="p-4">
          <h3 class="text-sm font-medium text-white mb-2">Funciones disponibles offline:</h3>
          <ul class="text-xs text-gray-300 space-y-1">
            <li v-for="capability in offlineCapabilities" :key="capability" class="flex items-center space-x-2">
              <svg class="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              <span>{{ capability }}</span>
            </li>
          </ul>
          <button 
            @click="showOfflineInfo = false"
            class="mt-3 text-xs text-cyan-400 hover:text-cyan-300"
          >
            Entendido
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { pwaManager, isPWAInstalled, showInstallPrompt as showPWAInstallPrompt } from '@/utils/pwa'
import { useOfflineHandler } from '@/utils/offlineHandler'

// PWA state
const updateAvailable = ref(false)
const offlineReady = ref(false)
const updating = ref(false)
const installing = ref(false)
const showInstallPrompt = ref(false)
const showOfflineInfo = ref(false)

// Offline state
const { isOnline, getPendingCount, onStateChange, getCapabilities } = useOfflineHandler()
const pendingCount = ref(0)
const offlineCapabilities = ref<string[]>([])

// UI state
const showConnectionStatus = ref(true)

// Computed properties
const connectionStatusText = computed(() => {
  if (isOnline()) {
    return pendingCount.value > 0 ? 'Sincronizando...' : 'Conectado'
  }
  return 'Sin conexión'
})

const connectionStatusClass = computed(() => ({
  'status-online': isOnline() && pendingCount.value === 0,
  'status-syncing': isOnline() && pendingCount.value > 0,
  'status-offline': !isOnline()
}))

const indicatorClass = computed(() => ({
  'indicator-online': isOnline() && pendingCount.value === 0,
  'indicator-syncing': isOnline() && pendingCount.value > 0,
  'indicator-offline': !isOnline()
}))

// Methods
const updateApp = async () => {
  updating.value = true
  try {
    const info = pwaManager.getStatus()
    await info.updateSW()
  } catch (error) {
    console.error('Error updating app:', error)
  } finally {
    updating.value = false
    updateAvailable.value = false
  }
}

const dismissUpdate = () => {
  updateAvailable.value = false
}

const installPWA = async () => {
  installing.value = true
  try {
    const installed = await showPWAInstallPrompt()
    if (installed) {
      showInstallPrompt.value = false
    }
  } catch (error) {
    console.error('Error installing PWA:', error)
  } finally {
    installing.value = false
  }
}

const dismissInstall = () => {
  showInstallPrompt.value = false
  localStorage.setItem('blacklist-install-dismissed', 'true')
}

// Lifecycle
onMounted(() => {
  // Initialize PWA status
  pwaManager.onUpdate((info) => {
    updateAvailable.value = info.needRefresh
    offlineReady.value = info.offlineReady
    
    if (info.offlineReady && !isOnline()) {
      showOfflineInfo.value = true
    }
  })

  // Initialize offline handler
  const unsubscribe = onStateChange((state) => {
    pendingCount.value = state.pendingActions.length
    
    if (!state.isOnline && !showOfflineInfo.value) {
      setTimeout(() => {
        showOfflineInfo.value = true
      }, 2000)
    }
  })

  // Load offline capabilities
  offlineCapabilities.value = getCapabilities()

  // Check if should show install prompt
  if (!isPWAInstalled() && !localStorage.getItem('blacklist-install-dismissed')) {
    setTimeout(() => {
      showInstallPrompt.value = true
    }, 10000) // Show after 10 seconds
  }

  // Update pending count
  pendingCount.value = getPendingCount()

  // Cleanup function
  onUnmounted(() => {
    unsubscribe()
  })
})
</script>

<style scoped>
.pwa-status {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  pointer-events: none;
}

.pwa-status > * {
  pointer-events: auto;
}

/* Connection Status */
.connection-status {
  position: absolute;
  top: 4px;
  right: 4px;
  padding: 8px 12px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.status-online {
  background: rgba(0, 255, 136, 0.1);
  border-color: rgba(0, 255, 136, 0.3);
  color: #00ff88;
}

.status-syncing {
  background: rgba(0, 255, 255, 0.1);
  border-color: rgba(0, 255, 255, 0.3);
  color: #00ffff;
}

.status-offline {
  background: rgba(255, 170, 0, 0.1);
  border-color: rgba(255, 170, 0, 0.3);
  color: #ffaa00;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.indicator-online {
  background: #00ff88;
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}

.indicator-syncing {
  background: #00ffff;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
  animation: pulse 1.5s infinite;
}

.indicator-offline {
  background: #ffaa00;
  box-shadow: 0 0 10px rgba(255, 170, 0, 0.5);
}

.pending-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}

/* Update Notification */
.update-notification {
  background: linear-gradient(135deg, rgba(128, 0, 32, 0.9), rgba(160, 0, 48, 0.9));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 255, 255, 0.3);
  margin: 16px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.update-icon {
  color: #00ffff;
  animation: rotate 2s linear infinite;
}

.update-btn {
  background: #00ffff;
  color: #0a0a0a;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.update-btn:hover:not(:disabled) {
  background: #00e6e6;
  transform: translateY(-1px);
}

.update-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dismiss-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dismiss-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Install Prompt */
.install-prompt {
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 255, 0.1));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 255, 255, 0.3);
  margin: 16px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

.install-icon {
  color: #00ffff;
}

.install-btn {
  background: #00ffff;
  color: #0a0a0a;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.install-btn:hover:not(:disabled) {
  background: #00e6e6;
  transform: translateY(-1px);
}

.install-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Offline Info */
.offline-info {
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 255, 255, 0.3);
  margin: 16px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Transitions */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 640px) {
  .update-notification,
  .install-prompt,
  .offline-info {
    margin: 8px;
  }
  
  .connection-status {
    top: 8px;
    right: 8px;
    padding: 6px 10px;
  }
}
</style>