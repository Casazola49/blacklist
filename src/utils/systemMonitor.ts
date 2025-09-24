import { ref, reactive, computed } from 'vue'

export interface SystemMetrics {
  performance: {
    loadTime: number
    renderTime: number
    memoryUsage: number
    networkLatency: number
  }
  errors: {
    count: number
    recent: Error[]
    types: Record<string, number>
  }
  user: {
    activeUsers: number
    sessionDuration: number
    interactions: number
  }
  system: {
    uptime: number
    lastUpdate: Date
    status: 'healthy' | 'warning' | 'critical'
  }
}

export interface NotificationEvent {
  id: string
  type: 'contract_update' | 'payment_received' | 'message_received' | 'system_alert'
  userId: string
  title: string
  message: string
  timestamp: Date
  delivered: boolean
  acknowledged: boolean
}

export interface EscrowTransaction {
  id: string
  contractId: string
  clientId: string
  specialistId: string
  amount: number
  status: 'pending' | 'held' | 'released' | 'disputed'
  createdAt: Date
  updatedAt: Date
}

class SystemMonitor {
  private metrics = reactive<SystemMetrics>({
    performance: {
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      networkLatency: 0
    },
    errors: {
      count: 0,
      recent: [],
      types: {}
    },
    user: {
      activeUsers: 0,
      sessionDuration: 0,
      interactions: 0
    },
    system: {
      uptime: 0,
      lastUpdate: new Date(),
      status: 'healthy'
    }
  })

  private notifications = ref<NotificationEvent[]>([])
  private escrowTransactions = ref<EscrowTransaction[]>([])
  private isMonitoring = ref(false)
  private monitoringInterval: number | null = null

  constructor() {
    this.initializeMonitoring()
  }

  // Getters reactivos
  get currentMetrics() {
    return this.metrics
  }

  get recentNotifications() {
    return computed(() => 
      this.notifications.value
        .filter(n => Date.now() - n.timestamp.getTime() < 300000) // Últimos 5 minutos
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    )
  }

  get pendingEscrowTransactions() {
    return computed(() => 
      this.escrowTransactions.value.filter(t => t.status === 'pending')
    )
  }

  get systemHealth() {
    return computed(() => {
      const { performance, errors } = this.metrics
      
      if (errors.count > 10 || performance.loadTime > 5000) {
        return 'critical'
      } else if (errors.count > 5 || performance.loadTime > 3000) {
        return 'warning'
      }
      return 'healthy'
    })
  }

  // Inicialización del monitoreo
  private initializeMonitoring() {
    this.startPerformanceMonitoring()
    this.startErrorTracking()
    this.startUserActivityTracking()
    this.startSystemHealthCheck()
  }

  // Monitoreo de rendimiento
  private startPerformanceMonitoring() {
    // Medir tiempo de carga inicial
    if (typeof window !== 'undefined' && window.performance) {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart
      this.metrics.performance.loadTime = loadTime

      // Observer para medir tiempo de renderizado
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
              this.metrics.performance.renderTime = entry.startTime
            }
          }
        })
        observer.observe({ entryTypes: ['paint'] })
      }

      // Monitorear uso de memoria
      setInterval(() => {
        if ('memory' in performance) {
          this.metrics.performance.memoryUsage = (performance as any).memory.usedJSHeapSize
        }
      }, 10000) // Cada 10 segundos
    }
  }

  // Tracking de errores
  private startErrorTracking() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.recordError(new Error(event.message))
      })

      window.addEventListener('unhandledrejection', (event) => {
        this.recordError(new Error(event.reason))
      })
    }
  }

  // Tracking de actividad de usuario
  private startUserActivityTracking() {
    if (typeof window !== 'undefined') {
      let interactionCount = 0
      const sessionStart = Date.now()

      const trackInteraction = () => {
        interactionCount++
        this.metrics.user.interactions = interactionCount
        this.metrics.user.sessionDuration = Date.now() - sessionStart
      }

      ['click', 'keydown', 'scroll', 'touchstart'].forEach(eventType => {
        window.addEventListener(eventType, trackInteraction, { passive: true })
      })
    }
  }

  // Verificación de salud del sistema
  private startSystemHealthCheck() {
    const startTime = Date.now()
    
    setInterval(() => {
      this.metrics.system.uptime = Date.now() - startTime
      this.metrics.system.lastUpdate = new Date()
      this.metrics.system.status = this.systemHealth.value
    }, 5000) // Cada 5 segundos
  }

  // Métodos públicos para testing
  public recordError(error: Error) {
    this.metrics.errors.count++
    this.metrics.errors.recent.unshift(error)
    
    // Mantener solo los últimos 10 errores
    if (this.metrics.errors.recent.length > 10) {
      this.metrics.errors.recent = this.metrics.errors.recent.slice(0, 10)
    }

    // Contar tipos de errores
    const errorType = error.constructor.name
    this.metrics.errors.types[errorType] = (this.metrics.errors.types[errorType] || 0) + 1
  }

  public addNotification(notification: Omit<NotificationEvent, 'id' | 'timestamp' | 'delivered' | 'acknowledged'>) {
    const fullNotification: NotificationEvent = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      delivered: false,
      acknowledged: false
    }

    this.notifications.value.unshift(fullNotification)
    
    // Simular entrega de notificación
    setTimeout(() => {
      fullNotification.delivered = true
    }, 100)

    return fullNotification
  }

  public acknowledgeNotification(notificationId: string) {
    const notification = this.notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.acknowledged = true
    }
  }

  public addEscrowTransaction(transaction: Omit<EscrowTransaction, 'id' | 'createdAt' | 'updatedAt'>) {
    const fullTransaction: EscrowTransaction = {
      ...transaction,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.escrowTransactions.value.unshift(fullTransaction)
    return fullTransaction
  }

  public updateEscrowTransaction(transactionId: string, updates: Partial<EscrowTransaction>) {
    const transaction = this.escrowTransactions.value.find(t => t.id === transactionId)
    if (transaction) {
      Object.assign(transaction, updates, { updatedAt: new Date() })
    }
  }

  // Métodos de testing específicos
  public async testNotificationSystem(): Promise<boolean> {
    try {
      // Crear notificación de prueba
      const testNotification = this.addNotification({
        type: 'system_alert',
        userId: 'test-user',
        title: 'Test Notification',
        message: 'This is a test notification'
      })

      // Esperar entrega
      await new Promise(resolve => setTimeout(resolve, 200))
      
      return testNotification.delivered
    } catch (error) {
      this.recordError(error as Error)
      return false
    }
  }

  public async testEscrowSystem(): Promise<boolean> {
    try {
      // Crear transacción de prueba
      const testTransaction = this.addEscrowTransaction({
        contractId: 'test-contract',
        clientId: 'test-client',
        specialistId: 'test-specialist',
        amount: 100,
        status: 'pending'
      })

      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 100))
      
      this.updateEscrowTransaction(testTransaction.id, { status: 'held' })
      
      // Verificar actualización
      const updatedTransaction = this.escrowTransactions.value.find(t => t.id === testTransaction.id)
      return updatedTransaction?.status === 'held'
    } catch (error) {
      this.recordError(error as Error)
      return false
    }
  }

  public async testPerformance(): Promise<{ loadTime: number, renderTime: number, memoryUsage: number }> {
    const startTime = performance.now()
    
    // Simular operación pesada
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const endTime = performance.now()
    const testLoadTime = endTime - startTime

    return {
      loadTime: testLoadTime,
      renderTime: this.metrics.performance.renderTime,
      memoryUsage: this.metrics.performance.memoryUsage
    }
  }

  public async testSecurityValidation(): Promise<boolean> {
    try {
      // Test de validación de entrada
      const maliciousInput = '<script>alert("xss")</script>'
      const sanitized = this.sanitizeInput(maliciousInput)
      
      if (sanitized.includes('<script>')) {
        throw new Error('XSS validation failed')
      }

      // Test de validación de permisos
      const hasPermission = this.validatePermission('test-user', 'admin:delete_user')
      if (hasPermission) {
        throw new Error('Permission validation failed')
      }

      return true
    } catch (error) {
      this.recordError(error as Error)
      return false
    }
  }

  // Utilidades de seguridad
  private sanitizeInput(input: string): string {
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  }

  private validatePermission(userId: string, permission: string): boolean {
    // Simulación de validación de permisos
    const adminUsers = ['admin-user-1', 'admin-user-2']
    const isAdmin = adminUsers.includes(userId)
    
    if (permission.startsWith('admin:')) {
      return isAdmin
    }
    
    return true // Permisos básicos para usuarios autenticados
  }

  // Método para ejecutar suite completa de tests
  public async runComprehensiveTest(): Promise<{
    notifications: boolean
    escrow: boolean
    performance: { loadTime: number, renderTime: number, memoryUsage: number }
    security: boolean
    overall: boolean
  }> {
    console.log('🧪 Iniciando pruebas comprehensivas del sistema...')
    
    const results = {
      notifications: await this.testNotificationSystem(),
      escrow: await this.testEscrowSystem(),
      performance: await this.testPerformance(),
      security: await this.testSecurityValidation(),
      overall: false
    }

    // Determinar resultado general
    results.overall = results.notifications && 
                     results.escrow && 
                     results.security && 
                     results.performance.loadTime < 3000

    console.log('📊 Resultados de pruebas:', results)
    
    return results
  }

  // Método para generar reporte de estado
  public generateStatusReport(): {
    timestamp: Date
    metrics: SystemMetrics
    notifications: { total: number, unacknowledged: number }
    escrow: { total: number, pending: number }
    health: string
  } {
    return {
      timestamp: new Date(),
      metrics: { ...this.metrics },
      notifications: {
        total: this.notifications.value.length,
        unacknowledged: this.notifications.value.filter(n => !n.acknowledged).length
      },
      escrow: {
        total: this.escrowTransactions.value.length,
        pending: this.pendingEscrowTransactions.value.length
      },
      health: this.systemHealth.value
    }
  }

  // Cleanup
  public destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }
    this.isMonitoring.value = false
  }
}

// Instancia singleton
export const systemMonitor = new SystemMonitor()

// Composable para usar en componentes Vue
export function useSystemMonitor() {
  return {
    metrics: systemMonitor.currentMetrics,
    notifications: systemMonitor.recentNotifications,
    escrowTransactions: systemMonitor.pendingEscrowTransactions,
    systemHealth: systemMonitor.systemHealth,
    
    // Métodos
    recordError: systemMonitor.recordError.bind(systemMonitor),
    addNotification: systemMonitor.addNotification.bind(systemMonitor),
    acknowledgeNotification: systemMonitor.acknowledgeNotification.bind(systemMonitor),
    addEscrowTransaction: systemMonitor.addEscrowTransaction.bind(systemMonitor),
    updateEscrowTransaction: systemMonitor.updateEscrowTransaction.bind(systemMonitor),
    
    // Testing
    runComprehensiveTest: systemMonitor.runComprehensiveTest.bind(systemMonitor),
    generateStatusReport: systemMonitor.generateStatusReport.bind(systemMonitor)
  }
}