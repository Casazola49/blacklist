/**
 * Offline Functionality Handler
 * Manages offline state, data synchronization, and offline-first features
 */

interface OfflineAction {
  id: string
  type: 'create' | 'update' | 'delete'
  collection: string
  data: any
  timestamp: number
  retryCount: number
}

interface OfflineState {
  isOnline: boolean
  lastOnlineTime: number
  pendingActions: OfflineAction[]
  syncInProgress: boolean
}

class OfflineHandler {
  private state: OfflineState = {
    isOnline: navigator.onLine,
    lastOnlineTime: Date.now(),
    pendingActions: [],
    syncInProgress: false
  }

  private listeners: Array<(state: OfflineState) => void> = []
  private syncQueue: OfflineAction[] = []
  private maxRetries = 3
  private retryDelay = 1000

  constructor() {
    this.initializeOfflineHandling()
    this.loadPendingActions()
    this.setupPeriodicSync()
  }

  private initializeOfflineHandling() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.handleOnline()
    })

    window.addEventListener('offline', () => {
      this.handleOffline()
    })

    // Check connection status periodically
    setInterval(() => {
      this.checkConnectionStatus()
    }, 30000) // Check every 30 seconds
  }

  private handleOnline() {
    console.log('🌐 Connection restored')
    this.state.isOnline = true
    this.state.lastOnlineTime = Date.now()
    this.notifyListeners()
    
    // Start syncing pending actions
    this.syncPendingActions()
    
    // Show notification
    this.showConnectionNotification('Conexión restaurada', 'success')
  }

  private handleOffline() {
    console.log('📴 Connection lost - Switching to offline mode')
    this.state.isOnline = false
    this.notifyListeners()
    
    // Show notification
    this.showConnectionNotification('Sin conexión - Modo offline activado', 'warning')
  }

  private async checkConnectionStatus() {
    try {
      // Try to fetch a small resource to verify connectivity
      const response = await fetch('/icon-192x192.png', {
        method: 'HEAD',
        cache: 'no-cache'
      })
      
      const isOnline = response.ok
      
      if (isOnline !== this.state.isOnline) {
        if (isOnline) {
          this.handleOnline()
        } else {
          this.handleOffline()
        }
      }
    } catch (error) {
      if (this.state.isOnline) {
        this.handleOffline()
      }
    }
  }

  private loadPendingActions() {
    try {
      const stored = localStorage.getItem('blacklist-offline-actions')
      if (stored) {
        this.state.pendingActions = JSON.parse(stored)
        console.log(`📦 Loaded ${this.state.pendingActions.length} pending offline actions`)
      }
    } catch (error) {
      console.error('Error loading pending actions:', error)
      this.state.pendingActions = []
    }
  }

  private savePendingActions() {
    try {
      localStorage.setItem('blacklist-offline-actions', JSON.stringify(this.state.pendingActions))
    } catch (error) {
      console.error('Error saving pending actions:', error)
    }
  }

  private setupPeriodicSync() {
    // Try to sync every 5 minutes when online
    setInterval(() => {
      if (this.state.isOnline && this.state.pendingActions.length > 0) {
        this.syncPendingActions()
      }
    }, 5 * 60 * 1000)
  }

  public queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): string {
    const offlineAction: OfflineAction = {
      ...action,
      id: this.generateActionId(),
      timestamp: Date.now(),
      retryCount: 0
    }

    this.state.pendingActions.push(offlineAction)
    this.savePendingActions()
    
    console.log(`📝 Queued offline action: ${action.type} ${action.collection}`)
    
    // Try to sync immediately if online
    if (this.state.isOnline) {
      this.syncPendingActions()
    }

    return offlineAction.id
  }

  private async syncPendingActions() {
    if (this.state.syncInProgress || !this.state.isOnline || this.state.pendingActions.length === 0) {
      return
    }

    this.state.syncInProgress = true
    this.notifyListeners()

    console.log(`🔄 Syncing ${this.state.pendingActions.length} pending actions...`)

    const actionsToSync = [...this.state.pendingActions]
    const successfulActions: string[] = []
    const failedActions: OfflineAction[] = []

    for (const action of actionsToSync) {
      try {
        await this.executeAction(action)
        successfulActions.push(action.id)
        console.log(`✅ Synced action: ${action.type} ${action.collection}`)
      } catch (error) {
        console.error(`❌ Failed to sync action ${action.id}:`, error)
        
        action.retryCount++
        if (action.retryCount < this.maxRetries) {
          failedActions.push(action)
        } else {
          console.error(`🚫 Action ${action.id} exceeded max retries, discarding`)
        }
      }
    }

    // Update pending actions
    this.state.pendingActions = failedActions
    this.savePendingActions()

    this.state.syncInProgress = false
    this.notifyListeners()

    if (successfulActions.length > 0) {
      console.log(`✅ Successfully synced ${successfulActions.length} actions`)
      this.showSyncNotification(`${successfulActions.length} cambios sincronizados`, 'success')
    }

    if (failedActions.length > 0) {
      console.warn(`⚠️ ${failedActions.length} actions failed to sync`)
    }
  }

  private async executeAction(action: OfflineAction): Promise<void> {
    // This would integrate with your Firebase service
    // For now, we'll simulate the API call
    
    const delay = Math.random() * 1000 + 500 // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, delay))
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.1) {
      throw new Error('Simulated network error')
    }
    
    console.log(`Executed ${action.type} on ${action.collection}:`, action.data)
  }

  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  public getOfflineData(collection: string, id?: string): any {
    try {
      const key = id ? `blacklist-offline-${collection}-${id}` : `blacklist-offline-${collection}`
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Error getting offline data:', error)
      return null
    }
  }

  public setOfflineData(collection: string, data: any, id?: string): void {
    try {
      const key = id ? `blacklist-offline-${collection}-${id}` : `blacklist-offline-${collection}`
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('Error setting offline data:', error)
    }
  }

  public removeOfflineData(collection: string, id?: string): void {
    try {
      const key = id ? `blacklist-offline-${collection}-${id}` : `blacklist-offline-${collection}`
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing offline data:', error)
    }
  }

  public isOnline(): boolean {
    return this.state.isOnline
  }

  public getPendingActionsCount(): number {
    return this.state.pendingActions.length
  }

  public getState(): OfflineState {
    return { ...this.state }
  }

  public onStateChange(callback: (state: OfflineState) => void): () => void {
    this.listeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.getState()))
  }

  private showConnectionNotification(message: string, type: 'success' | 'warning') {
    // Create notification element
    const notification = document.createElement('div')
    notification.className = `
      fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg
      ${type === 'success' ? 'bg-green-600' : 'bg-yellow-600'} text-white
      shadow-lg transition-all duration-300 ease-out
    `
    notification.textContent = message
    
    document.body.appendChild(notification)
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0'
      setTimeout(() => {
        notification.remove()
      }, 300)
    }, 3000)
  }

  private showSyncNotification(message: string, type: 'success' | 'error') {
    // Similar to connection notification but for sync status
    const notification = document.createElement('div')
    notification.className = `
      fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg
      ${type === 'success' ? 'bg-cyan-600' : 'bg-red-600'} text-white
      shadow-lg transition-all duration-300 ease-out
    `
    notification.textContent = message
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.style.opacity = '0'
      setTimeout(() => {
        notification.remove()
      }, 300)
    }, 2000)
  }

  public clearAllOfflineData(): void {
    // Clear all offline data (useful for logout)
    const keys = Object.keys(localStorage).filter(key => key.startsWith('blacklist-offline-'))
    keys.forEach(key => localStorage.removeItem(key))
    
    this.state.pendingActions = []
    this.savePendingActions()
    
    console.log('🧹 Cleared all offline data')
  }

  public getOfflineCapabilities(): string[] {
    return [
      'View cached dashboard data',
      'Read offline messages',
      'Queue new actions for sync',
      'Browse cached contracts',
      'Access user profile',
      'View notification history'
    ]
  }

  public cleanup(): void {
    this.listeners = []
    // Remove event listeners if needed
  }
}

// Export singleton instance
export const offlineHandler = new OfflineHandler()

// Vue composable for offline functionality
export function useOfflineHandler() {
  const queueAction = (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => {
    return offlineHandler.queueAction(action)
  }

  const getOfflineData = (collection: string, id?: string) => {
    return offlineHandler.getOfflineData(collection, id)
  }

  const setOfflineData = (collection: string, data: any, id?: string) => {
    offlineHandler.setOfflineData(collection, data, id)
  }

  const isOnline = () => {
    return offlineHandler.isOnline()
  }

  const getPendingCount = () => {
    return offlineHandler.getPendingActionsCount()
  }

  const onStateChange = (callback: (state: OfflineState) => void) => {
    return offlineHandler.onStateChange(callback)
  }

  const getCapabilities = () => {
    return offlineHandler.getOfflineCapabilities()
  }

  return {
    queueAction,
    getOfflineData,
    setOfflineData,
    isOnline,
    getPendingCount,
    onStateChange,
    getCapabilities
  }
}