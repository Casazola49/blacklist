import { ref, reactive } from 'vue'
import { loggerService } from './logger'
import { notificationService } from './notifications'

export interface ErrorInfo {
  id: string
  type: 'network' | 'auth' | 'validation' | 'system' | 'payment' | 'firestore'
  message: string
  code?: string
  context?: string
  timestamp: Date
  userId?: string
  stack?: string
  metadata?: Record<string, any>
}

export interface ErrorState {
  errors: ErrorInfo[]
  isRetrying: boolean
  retryCount: number
  lastError?: ErrorInfo
}

class ErrorHandler {
  private state = reactive<ErrorState>({
    errors: [],
    isRetrying: false,
    retryCount: 0,
    lastError: undefined
  })

  private maxRetries = 3
  private retryDelays = [1000, 2000, 4000] // Exponential backoff

  /**
   * Maneja un error de forma centralizada
   */
  async handleError(error: Error | any, context?: string, metadata?: Record<string, any>): Promise<void> {
    const errorInfo: ErrorInfo = {
      id: this.generateErrorId(),
      type: this.determineErrorType(error),
      message: error.message || 'Error desconocido',
      code: error.code,
      context,
      timestamp: new Date(),
      userId: this.getCurrentUserId(),
      stack: error.stack,
      metadata
    }

    // Agregar error al estado
    this.state.errors.push(errorInfo)
    this.state.lastError = errorInfo

    // Log del error
    await loggerService.logError(errorInfo)

    // Mostrar notificación si es necesario
    if (this.shouldShowNotification(errorInfo)) {
      await notificationService.showError(errorInfo)
    }

    // Intentar recuperación automática si es posible
    if (this.canAutoRecover(errorInfo)) {
      await this.attemptRecovery(errorInfo)
    }
  }

  /**
   * Ejecuta una operación con retry automático
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    this.state.isRetrying = true
    this.state.retryCount = 0

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation()
        this.state.isRetrying = false
        this.state.retryCount = 0
        return result
      } catch (error) {
        this.state.retryCount = attempt + 1

        if (attempt === maxRetries) {
          this.state.isRetrying = false
          await this.handleError(error, `${context} - Falló después de ${maxRetries + 1} intentos`)
          throw error
        }

        // Esperar antes del siguiente intento
        await this.delay(this.retryDelays[attempt] || 4000)
        
        await loggerService.logInfo(`Reintentando operación: ${context} (intento ${attempt + 2}/${maxRetries + 1})`)
      }
    }

    throw new Error('Operación falló después de todos los reintentos')
  }

  /**
   * Determina el tipo de error
   */
  private determineErrorType(error: any): ErrorInfo['type'] {
    if (error.code?.startsWith('auth/')) return 'auth'
    if (error.code?.startsWith('firestore/')) return 'firestore'
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') return 'network'
    if (error.name === 'ValidationError') return 'validation'
    if (error.code?.includes('payment')) return 'payment'
    return 'system'
  }

  /**
   * Determina si debe mostrar notificación al usuario
   */
  private shouldShowNotification(errorInfo: ErrorInfo): boolean {
    // No mostrar errores de red menores o errores de validación
    if (errorInfo.type === 'validation') return false
    if (errorInfo.type === 'network' && errorInfo.code === 'MINOR_NETWORK_ERROR') return false
    
    return true
  }

  /**
   * Determina si el error puede recuperarse automáticamente
   */
  private canAutoRecover(errorInfo: ErrorInfo): boolean {
    return errorInfo.type === 'network' || errorInfo.type === 'firestore'
  }

  /**
   * Intenta recuperación automática
   */
  private async attemptRecovery(errorInfo: ErrorInfo): Promise<void> {
    switch (errorInfo.type) {
      case 'network':
        await this.handleNetworkRecovery(errorInfo)
        break
      case 'auth':
        await this.handleAuthRecovery(errorInfo)
        break
      case 'firestore':
        await this.handleFirestoreRecovery(errorInfo)
        break
    }
  }

  private async handleNetworkRecovery(errorInfo: ErrorInfo): Promise<void> {
    // Verificar conectividad
    if (!navigator.onLine) {
      await notificationService.showWarning({
        title: 'Sin conexión',
        message: 'Verifica tu conexión a internet',
        type: 'network'
      })
      return
    }

    // Intentar reconexión
    await loggerService.logInfo('Intentando recuperación de red')
  }

  private async handleAuthRecovery(errorInfo: ErrorInfo): Promise<void> {
    if (errorInfo.code === 'auth/token-expired') {
      // Intentar renovar token
      await loggerService.logInfo('Intentando renovar token de autenticación')
    }
  }

  private async handleFirestoreRecovery(errorInfo: ErrorInfo): Promise<void> {
    // Implementar lógica de reconexión a Firestore
    await loggerService.logInfo('Intentando reconexión a Firestore')
  }

  /**
   * Obtiene errores recientes
   */
  getRecentErrors(limit: number = 10): ErrorInfo[] {
    return this.state.errors
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Limpia errores antiguos
   */
  clearOldErrors(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000)
    this.state.errors = this.state.errors.filter(error => error.timestamp > cutoffTime)
  }

  /**
   * Obtiene estadísticas de errores
   */
  getErrorStats(): Record<string, number> {
    const stats: Record<string, number> = {}
    
    this.state.errors.forEach(error => {
      stats[error.type] = (stats[error.type] || 0) + 1
    })

    return stats
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getCurrentUserId(): string | undefined {
    // Implementar obtención del ID del usuario actual
    return undefined // Placeholder
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Getters para el estado reactivo
  get errors() { return this.state.errors }
  get isRetrying() { return this.state.isRetrying }
  get retryCount() { return this.state.retryCount }
  get lastError() { return this.state.lastError }
}

export const errorHandler = new ErrorHandler()