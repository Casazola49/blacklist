import { ref, reactive } from 'vue'
import { loggerService } from './logger'
import { errorHandler } from './errorHandler'
import type { ErrorInfo } from './errorHandler'

export interface PerformanceMetrics {
  pageLoadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  firstInputDelay: number
  cumulativeLayoutShift: number
  timeToInteractive: number
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical'
  uptime: number
  errorRate: number
  responseTime: number
  memoryUsage: number
  lastCheck: Date
}

export interface MonitoringAlert {
  id: string
  type: 'performance' | 'error' | 'security' | 'availability'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: Date
  resolved: boolean
  metadata?: Record<string, any>
}

class MonitoringService {
  private metrics = reactive<PerformanceMetrics>({
    pageLoadTime: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    cumulativeLayoutShift: 0,
    timeToInteractive: 0
  })

  private systemHealth = reactive<SystemHealth>({
    status: 'healthy',
    uptime: 0,
    errorRate: 0,
    responseTime: 0,
    memoryUsage: 0,
    lastCheck: new Date()
  })

  private alerts = ref<MonitoringAlert[]>([])
  private startTime = Date.now()
  private errorCount = 0
  private requestCount = 0
  private totalResponseTime = 0

  constructor() {
    this.initializeMonitoring()
    this.startHealthChecks()
    this.setupPerformanceObserver()
  }

  /**
   * Inicializa el sistema de monitoreo
   */
  private initializeMonitoring(): void {
    // Monitorear errores
    this.setupErrorMonitoring()
    
    // Monitorear rendimiento
    this.collectInitialMetrics()
    
    // Monitorear memoria
    this.startMemoryMonitoring()
    
    // Monitorear conectividad
    this.setupConnectivityMonitoring()

    loggerService.logInfo('Sistema de monitoreo inicializado', 'monitoring')
  }

  /**
   * Configura monitoreo de errores
   */
  private setupErrorMonitoring(): void {
    // Interceptar errores del errorHandler
    const originalHandleError = errorHandler.handleError.bind(errorHandler)
    
    errorHandler.handleError = async (error: Error | any, context?: string, metadata?: Record<string, any>) => {
      // Incrementar contador de errores
      this.errorCount++
      
      // Calcular tasa de error
      this.updateErrorRate()
      
      // Crear alerta si es necesario
      await this.checkErrorThresholds(error, context)
      
      // Llamar al handler original
      return originalHandleError(error, context, metadata)
    }
  }

  /**
   * Configura observador de rendimiento
   */
  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      // Observar métricas de navegación
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            this.metrics.pageLoadTime = navEntry.loadEventEnd - navEntry.loadEventStart
          }
        }
      })
      navObserver.observe({ entryTypes: ['navigation'] })

      // Observar métricas de pintura
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.firstContentfulPaint = entry.startTime
          }
        }
      })
      paintObserver.observe({ entryTypes: ['paint'] })

      // Observar Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.metrics.largestContentfulPaint = lastEntry.startTime
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

      // Observar First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.firstInputDelay = (entry as any).processingStart - entry.startTime
        }
      })
      fidObserver.observe({ entryTypes: ['first-input'] })

      // Observar Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        this.metrics.cumulativeLayoutShift = clsValue
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    }
  }

  /**
   * Recolecta métricas iniciales
   */
  private collectInitialMetrics(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0]
        this.metrics.pageLoadTime = nav.loadEventEnd - nav.loadEventStart
        this.metrics.timeToInteractive = nav.domInteractive - nav.navigationStart
      }
    }
  }

  /**
   * Inicia monitoreo de memoria
   */
  private startMemoryMonitoring(): void {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        this.systemHealth.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit
        
        // Alerta si el uso de memoria es alto
        if (this.systemHealth.memoryUsage > 0.8) {
          this.createAlert({
            type: 'performance',
            severity: 'high',
            message: `Uso de memoria alto: ${(this.systemHealth.memoryUsage * 100).toFixed(1)}%`,
            metadata: { memoryUsage: this.systemHealth.memoryUsage }
          })
        }
      }
    }

    // Verificar cada 30 segundos
    setInterval(checkMemory, 30000)
    checkMemory() // Verificación inicial
  }

  /**
   * Configura monitoreo de conectividad
   */
  private setupConnectivityMonitoring(): void {
    const updateConnectionStatus = () => {
      if (!navigator.onLine) {
        this.createAlert({
          type: 'availability',
          severity: 'high',
          message: 'Conexión a internet perdida',
          metadata: { online: navigator.onLine }
        })
      }
    }

    window.addEventListener('online', () => {
      loggerService.logInfo('Conexión restaurada', 'connectivity')
    })

    window.addEventListener('offline', updateConnectionStatus)
  }

  /**
   * Inicia verificaciones de salud del sistema
   */
  private startHealthChecks(): void {
    const performHealthCheck = async () => {
      const now = Date.now()
      this.systemHealth.uptime = now - this.startTime
      this.systemHealth.lastCheck = new Date()

      // Calcular tiempo de respuesta promedio
      if (this.requestCount > 0) {
        this.systemHealth.responseTime = this.totalResponseTime / this.requestCount
      }

      // Determinar estado del sistema
      this.systemHealth.status = this.determineSystemStatus()

      // Log de salud del sistema
      await loggerService.logInfo('Health check completado', 'monitoring', {
        status: this.systemHealth.status,
        errorRate: this.systemHealth.errorRate,
        responseTime: this.systemHealth.responseTime,
        memoryUsage: this.systemHealth.memoryUsage
      })
    }

    // Verificar cada minuto
    setInterval(performHealthCheck, 60000)
    performHealthCheck() // Verificación inicial
  }

  /**
   * Registra tiempo de respuesta de una operación
   */
  recordResponseTime(duration: number): void {
    this.requestCount++
    this.totalResponseTime += duration
    this.systemHealth.responseTime = this.totalResponseTime / this.requestCount

    // Alerta si el tiempo de respuesta es muy alto
    if (duration > 5000) { // 5 segundos
      this.createAlert({
        type: 'performance',
        severity: 'medium',
        message: `Tiempo de respuesta alto: ${duration}ms`,
        metadata: { responseTime: duration }
      })
    }
  }

  /**
   * Actualiza la tasa de error
   */
  private updateErrorRate(): void {
    const totalOperations = this.requestCount + this.errorCount
    this.systemHealth.errorRate = totalOperations > 0 ? this.errorCount / totalOperations : 0
  }

  /**
   * Verifica umbrales de error y crea alertas
   */
  private async checkErrorThresholds(error: Error | any, context?: string): Promise<void> {
    // Alerta por tasa de error alta
    if (this.systemHealth.errorRate > 0.1) { // 10%
      this.createAlert({
        type: 'error',
        severity: 'high',
        message: `Tasa de error alta: ${(this.systemHealth.errorRate * 100).toFixed(1)}%`,
        metadata: { errorRate: this.systemHealth.errorRate }
      })
    }

    // Alerta por errores críticos
    if (error.name === 'SecurityError' || context?.includes('security')) {
      this.createAlert({
        type: 'security',
        severity: 'critical',
        message: `Error de seguridad detectado: ${error.message}`,
        metadata: { error: error.message, context }
      })
    }
  }

  /**
   * Determina el estado del sistema basado en métricas
   */
  private determineSystemStatus(): SystemHealth['status'] {
    if (this.systemHealth.errorRate > 0.2 || this.systemHealth.memoryUsage > 0.9) {
      return 'critical'
    }
    
    if (this.systemHealth.errorRate > 0.1 || 
        this.systemHealth.responseTime > 3000 || 
        this.systemHealth.memoryUsage > 0.8) {
      return 'degraded'
    }
    
    return 'healthy'
  }

  /**
   * Crea una nueva alerta
   */
  private createAlert(alertData: Omit<MonitoringAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const alert: MonitoringAlert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      resolved: false,
      ...alertData
    }

    this.alerts.value.unshift(alert)

    // Mantener solo las últimas 50 alertas
    if (this.alerts.value.length > 50) {
      this.alerts.value = this.alerts.value.slice(0, 50)
    }

    // Log de la alerta
    loggerService.logWarn(`Alerta creada: ${alert.message}`, 'monitoring', {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity
    })

    // Enviar alertas críticas inmediatamente
    if (alert.severity === 'critical') {
      this.sendCriticalAlert(alert)
    }
  }

  /**
   * Envía alerta crítica
   */
  private async sendCriticalAlert(alert: MonitoringAlert): Promise<void> {
    try {
      // En producción, enviar a sistema de alertas externo
      if (import.meta.env.PROD) {
        await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        })
      }

      await loggerService.logCritical(`Alerta crítica: ${alert.message}`, 'monitoring', {
        alertId: alert.id,
        metadata: alert.metadata
      })
    } catch (error) {
      console.error('Error enviando alerta crítica:', error)
    }
  }

  /**
   * Resuelve una alerta
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.value.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      loggerService.logInfo(`Alerta resuelta: ${alert.message}`, 'monitoring', {
        alertId: alert.id
      })
    }
  }

  /**
   * Obtiene métricas de rendimiento
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Obtiene estado de salud del sistema
   */
  getSystemHealth(): SystemHealth {
    return { ...this.systemHealth }
  }

  /**
   * Obtiene alertas activas
   */
  getActiveAlerts(): MonitoringAlert[] {
    return this.alerts.value.filter(alert => !alert.resolved)
  }

  /**
   * Obtiene todas las alertas
   */
  getAllAlerts(): MonitoringAlert[] {
    return [...this.alerts.value]
  }

  /**
   * Exporta datos de monitoreo
   */
  exportMonitoringData(): {
    metrics: PerformanceMetrics
    health: SystemHealth
    alerts: MonitoringAlert[]
  } {
    return {
      metrics: this.getPerformanceMetrics(),
      health: this.getSystemHealth(),
      alerts: this.getAllAlerts()
    }
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export const monitoringService = new MonitoringService()