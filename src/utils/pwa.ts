/**
 * PWA Service Worker Registration and Management
 * Handles service worker lifecycle, updates, and offline functionality
 */

import { registerSW } from 'virtual:pwa-register'

interface PWAUpdateInfo {
  needRefresh: boolean
  offlineReady: boolean
  updateSW: () => Promise<void>
}

class PWAManager {
  private updateSW: (() => Promise<void>) | null = null
  private needRefresh = false
  private offlineReady = false
  private listeners: Array<(info: PWAUpdateInfo) => void> = []

  constructor() {
    this.initializePWA()
  }

  private initializePWA() {
    // Register service worker with update handling
    this.updateSW = registerSW({
      onNeedRefresh: () => {
        this.needRefresh = true
        this.notifyListeners()
        this.showUpdateNotification()
      },
      onOfflineReady: () => {
        this.offlineReady = true
        this.notifyListeners()
        this.showOfflineNotification()
      },
      onRegistered: (registration) => {
        console.log('SW Registered:', registration)
        this.setupPeriodicSync(registration)
      },
      onRegisterError: (error) => {
        console.error('SW registration error:', error)
      }
    })

    // Listen for network status changes
    this.setupNetworkListeners()
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.showNetworkStatusNotification('Conexión restaurada', 'success')
      this.syncWhenOnline()
    })

    window.addEventListener('offline', () => {
      this.showNetworkStatusNotification('Sin conexión - Modo offline activado', 'warning')
    })
  }

  private setupPeriodicSync(registration?: ServiceWorkerRegistration) {
    if (!registration) return
    
    // Check for updates every 30 minutes
    setInterval(async () => {
      try {
        await registration.update()
      } catch (error) {
        console.error('Error checking for SW updates:', error)
      }
    }, 30 * 60 * 1000)
  }

  private async syncWhenOnline() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        // Background sync is not widely supported yet, so we'll skip it for now
        console.log('Service worker ready for sync')
      } catch (error) {
        console.error('Background sync registration failed:', error)
      }
    }
  }

  private showUpdateNotification() {
    // Create futuristic update notification
    const notification = this.createNotificationElement(
      'Nueva versión disponible',
      'Una actualización está lista para instalar',
      'update',
      () => this.updateApp()
    )
    document.body.appendChild(notification)
  }

  private showOfflineNotification() {
    // Create offline ready notification
    const notification = this.createNotificationElement(
      'Aplicación lista para uso offline',
      'Ahora puedes usar The Blacklist sin conexión',
      'offline',
      () => this.dismissNotification()
    )
    document.body.appendChild(notification)
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      notification.remove()
    }, 5000)
  }

  private showNetworkStatusNotification(message: string, type: 'success' | 'warning') {
    const notification = this.createNotificationElement(
      'Estado de Conexión',
      message,
      type,
      () => this.dismissNotification()
    )
    document.body.appendChild(notification)
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      notification.remove()
    }, 3000)
  }

  private createNotificationElement(
    title: string,
    message: string,
    type: string,
    action: () => void
  ): HTMLElement {
    const notification = document.createElement('div')
    notification.className = `
      fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg border
      bg-gray-900 border-cyan-500 text-white shadow-lg
      transform transition-all duration-300 ease-out
      animate-slide-in-right
    `
    
    notification.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <div class="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
            <svg class="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
              ${this.getIconForType(type)}
            </svg>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-white">${title}</p>
          <p class="text-sm text-gray-300 mt-1">${message}</p>
          ${type === 'update' ? `
            <div class="mt-3 flex space-x-2">
              <button class="update-btn px-3 py-1 text-xs bg-cyan-500 text-gray-900 rounded hover:bg-cyan-400 transition-colors">
                Actualizar
              </button>
              <button class="dismiss-btn px-3 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
                Después
              </button>
            </div>
          ` : ''}
        </div>
        <button class="close-btn flex-shrink-0 text-gray-400 hover:text-white">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    `

    // Add event listeners
    const updateBtn = notification.querySelector('.update-btn')
    const dismissBtn = notification.querySelector('.dismiss-btn')
    const closeBtn = notification.querySelector('.close-btn')

    if (updateBtn) {
      updateBtn.addEventListener('click', () => {
        action()
        notification.remove()
      })
    }

    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        notification.remove()
      })
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        notification.remove()
      })
    }

    return notification
  }

  private getIconForType(type: string): string {
    switch (type) {
      case 'update':
        return '<path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"></path>'
      case 'offline':
        return '<path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"></path>'
      case 'success':
        return '<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>'
      case 'warning':
        return '<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>'
      default:
        return '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>'
    }
  }

  private dismissNotification() {
    // Implementation handled by individual notification elements
  }

  public async updateApp() {
    if (this.updateSW) {
      try {
        await this.updateSW()
        window.location.reload()
      } catch (error) {
        console.error('Error updating app:', error)
      }
    }
  }

  public onUpdate(callback: (info: PWAUpdateInfo) => void) {
    this.listeners.push(callback)
  }

  private notifyListeners() {
    const info: PWAUpdateInfo = {
      needRefresh: this.needRefresh,
      offlineReady: this.offlineReady,
      updateSW: this.updateApp.bind(this)
    }
    this.listeners.forEach(callback => callback(info))
  }

  public getStatus(): PWAUpdateInfo {
    return {
      needRefresh: this.needRefresh,
      offlineReady: this.offlineReady,
      updateSW: this.updateApp.bind(this)
    }
  }
}

// Export singleton instance
export const pwaManager = new PWAManager()

// Utility functions for PWA features
export const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true
}

export const canInstallPWA = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

export const getInstallPrompt = (): Promise<Event | null> => {
  return new Promise((resolve) => {
    let deferredPrompt: Event | null = null

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt = e
      resolve(deferredPrompt)
    })

    // Timeout after 5 seconds if no prompt
    setTimeout(() => {
      resolve(deferredPrompt)
    }, 5000)
  })
}

export const showInstallPrompt = async (): Promise<boolean> => {
  const prompt = await getInstallPrompt()
  if (prompt) {
    (prompt as any).prompt()
    const { outcome } = await (prompt as any).userChoice
    return outcome === 'accepted'
  }
  return false
}