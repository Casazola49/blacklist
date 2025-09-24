import { ref, computed } from 'vue'
import { errorHandler } from '@/services/errorHandler'
import { loggerService } from '@/services/logger'
import { monitoringService } from '@/services/monitoring'

export function useErrorHandling() {
  const isLoading = ref(false)
  const lastError = ref<string | null>(null)

  /**
   * Ejecuta una operación con manejo de errores automático
   */
  const executeWithErrorHandling = async <T>(
    operation: () => Promise<T>,
    context: string,
    options: {
      showNotification?: boolean
      logError?: boolean
      retryOnFailure?: boolean
      maxRetries?: number
    } = {}
  ): Promise<T | null> => {
    const {
      showNotification = true,
      logError = true,
      retryOnFailure = false,
      maxRetries = 3
    } = options

    isLoading.value = true
    lastError.value = null

    try {
      const startTime = Date.now()
      
      let result: T
      
      if (retryOnFailure) {
        result = await errorHandler.executeWithRetry(operation, context, maxRetries)
      } else {
        result = await operation()
      }

      // Registrar tiempo de respuesta
      const duration = Date.now() - startTime
      monitoringService.recordResponseTime(duration)

      if (logError) {
        await loggerService.logInfo(`Operación exitosa: ${context}`, context, {
          duration,
          retryOnFailure,
          maxRetries
        })
      }

      return result

    } catch (error: any) {
      lastError.value = error.message || 'Error desconocido'

      if (logError) {
        await errorHandler.handleError(error, context, {
          showNotification,
          retryOnFailure,
          maxRetries
        })
      }

      return null

    } finally {
      isLoading.value = false
    }
  }

  /**
   * Maneja errores de forma manual
   */
  const handleError = async (
    error: Error | any,
    context?: string,
    metadata?: Record<string, any>
  ): Promise<void> => {
    lastError.value = error.message || 'Error desconocido'
    await errorHandler.handleError(error, context, metadata)
  }

  /**
   * Limpia el último error
   */
  const clearError = (): void => {
    lastError.value = null
  }

  /**
   * Verifica si hay errores activos
   */
  const hasError = computed(() => lastError.value !== null)

  /**
   * Obtiene estadísticas de errores
   */
  const getErrorStats = () => {
    return errorHandler.getErrorStats()
  }

  /**
   * Obtiene errores recientes
   */
  const getRecentErrors = (limit?: number) => {
    return errorHandler.getRecentErrors(limit)
  }

  /**
   * Wrapper para operaciones de Firebase
   */
  const executeFirebaseOperation = async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T | null> => {
    return executeWithErrorHandling(
      operation,
      `firebase_${operationName}`,
      {
        retryOnFailure: true,
        maxRetries: 2
      }
    )
  }

  /**
   * Wrapper para operaciones de red
   */
  const executeNetworkOperation = async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T | null> => {
    return executeWithErrorHandling(
      operation,
      `network_${operationName}`,
      {
        retryOnFailure: true,
        maxRetries: 3
      }
    )
  }

  /**
   * Wrapper para operaciones críticas
   */
  const executeCriticalOperation = async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T | null> => {
    return executeWithErrorHandling(
      operation,
      `critical_${operationName}`,
      {
        showNotification: true,
        logError: true,
        retryOnFailure: false
      }
    )
  }

  /**
   * Maneja errores de validación
   */
  const handleValidationError = (
    field: string,
    message: string,
    value?: any
  ): void => {
    const error = new Error(message)
    error.name = 'ValidationError'
    
    handleError(error, `validation_${field}`, {
      field,
      value,
      validationType: 'client'
    })
  }

  /**
   * Maneja errores de autenticación
   */
  const handleAuthError = async (error: any): Promise<void> => {
    await handleError(error, 'authentication', {
      authProvider: 'firebase',
      errorCode: error.code
    })
  }

  /**
   * Maneja errores de pago
   */
  const handlePaymentError = async (
    error: any,
    paymentData?: Record<string, any>
  ): Promise<void> => {
    await handleError(error, 'payment', {
      ...paymentData,
      errorCode: error.code,
      critical: true
    })
  }

  return {
    // Estado
    isLoading: readonly(isLoading),
    lastError: readonly(lastError),
    hasError,

    // Métodos principales
    executeWithErrorHandling,
    handleError,
    clearError,

    // Estadísticas
    getErrorStats,
    getRecentErrors,

    // Wrappers especializados
    executeFirebaseOperation,
    executeNetworkOperation,
    executeCriticalOperation,

    // Manejadores específicos
    handleValidationError,
    handleAuthError,
    handlePaymentError
  }
}

// Función de utilidad para readonly
function readonly<T>(ref: any): T {
  return ref as T
}