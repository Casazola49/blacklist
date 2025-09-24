import type { ErrorState } from '../types'

export class ErrorManager {
  /**
   * Handle and process errors with context
   */
  static handleError(error: any, context: string): ErrorState {
    console.error(`Error in ${context}:`, error)

    const errorState: ErrorState = {
      tipo: this.determineErrorType(error),
      mensaje: this.getErrorMessage(error),
      codigo: this.getErrorCode(error),
      mostrarSoporte: this.shouldShowSupport(error)
    }

    // Log detailed error information
    this.logErrorDetails(error, errorState, context)

    // Show notification
    this.showErrorNotification(errorState)

    // Execute recovery action if available
    this.executeRecoveryAction(errorState, context)

    return errorState
  }

  /**
   * Determine error type based on error properties
   */
  private static determineErrorType(error: any): ErrorState['tipo'] {
    // Check error code first (more reliable)
    if (error.code) {
      if (error.code.startsWith('auth/')) {
        return 'auth'
      }
      if (error.code === 'unavailable' || error.code.includes('network')) {
        return 'red'
      }
      if (error.code.includes('permission') || error.code.includes('unauthenticated')) {
        return 'auth'
      }
      if (error.code.includes('invalid') || error.code.includes('failed-precondition')) {
        return 'validacion'
      }
      if (error.code.includes('payment') || error.code.includes('escrow')) {
        return 'pago'
      }
    }

    // Fallback to message analysis
    const message = (error.message || '').toLowerCase()
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'red'
    }
    if (message.includes('auth') || message.includes('permission') || message.includes('unauthorized')) {
      return 'auth'
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return 'validacion'
    }
    if (message.includes('payment') || message.includes('escrow') || message.includes('transaction')) {
      return 'pago'
    }
    
    return 'sistema'
  }

  /**
   * Get user-friendly error message
   */
  private static getErrorMessage(error: any): string {
    // Firebase Auth errors
    const authErrorMessages: Record<string, string> = {
      'auth/user-not-found': 'Usuario no encontrado',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/email-already-in-use': 'Este email ya está registrado',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/invalid-email': 'Email inválido',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
      'auth/popup-closed-by-user': 'Inicio de sesión cancelado',
      'auth/popup-blocked': 'Pop-up bloqueado. Permite pop-ups e intenta de nuevo',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet'
    }

    // Firestore errors
    const firestoreErrorMessages: Record<string, string> = {
      'firestore/permission-denied': 'No tienes permisos para realizar esta acción',
      'firestore/not-found': 'Los datos solicitados no fueron encontrados',
      'firestore/already-exists': 'Estos datos ya existen',
      'firestore/resource-exhausted': 'Servicio temporalmente no disponible',
      'firestore/failed-precondition': 'Operación falló debido a condiciones inválidas',
      'firestore/aborted': 'Operación cancelada. Intenta de nuevo',
      'firestore/unavailable': 'Servicio temporalmente no disponible',
      'firestore/internal': 'Error interno del servidor. Intenta más tarde',
      'firestore/unauthenticated': 'Debes iniciar sesión para continuar'
    }

    // Check for specific error codes
    if (error.code && authErrorMessages[error.code]) {
      return authErrorMessages[error.code]
    }
    if (error.code && firestoreErrorMessages[error.code]) {
      return firestoreErrorMessages[error.code]
    }

    // Generic network errors
    if (error.code === 'unavailable' || error.message?.includes('network')) {
      return 'Error de conexión. Verifica tu internet e intenta de nuevo'
    }

    // Return original message or generic fallback
    return error.message || 'Ha ocurrido un error inesperado'
  }

  /**
   * Extract error code from error object
   */
  private static getErrorCode(error: any): string | undefined {
    if (error.code) {
      return error.code
    }
    
    // Try to extract from message for some error types
    const match = error.message?.match(/\(([^)]+)\)/)
    return match ? match[1] : undefined
  }

  /**
   * Determine if support contact should be shown
   */
  private static shouldShowSupport(error: any): boolean {
    const criticalErrors = [
      'firestore/internal',
      'firestore/data-loss',
      'auth/user-disabled',
      'firestore/resource-exhausted',
      'payment-processor-error',
      'escrow-system-error'
    ]
    
    return criticalErrors.some(criticalError => 
      error.code === criticalError || error.message?.includes(criticalError)
    )
  }

  /**
   * Log detailed error information for debugging
   */
  private static logErrorDetails(error: any, errorState: ErrorState, context: string): void {
    const errorDetails = {
      timestamp: new Date().toISOString(),
      context,
      type: errorState.tipo,
      code: error.code,
      message: error.message,
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId()
    }
    
    console.group(`🚨 Error Details - ${context}`)
    console.error('Error Type:', errorState.tipo)
    console.error('Error Code:', error.code)
    console.error('Error Message:', error.message)
    console.error('User Message:', errorState.mensaje)
    console.error('Full Error:', error)
    console.error('Context:', context)
    console.error('Timestamp:', errorDetails.timestamp)
    console.groupEnd()
    
    // Store in localStorage for debugging (in development)
    if (import.meta.env.DEV) {
      this.storeErrorLog(errorDetails)
    }
  }

  /**
   * Store error log in localStorage for debugging
   */
  private static storeErrorLog(errorDetails: any): void {
    try {
      const errorLog = JSON.parse(localStorage.getItem('errorLog') || '[]')
      errorLog.push(errorDetails)
      
      // Keep only last 50 errors
      if (errorLog.length > 50) {
        errorLog.splice(0, errorLog.length - 50)
      }
      
      localStorage.setItem('errorLog', JSON.stringify(errorLog))
    } catch (e) {
      console.warn('Failed to store error log:', e)
    }
  }

  /**
   * Get current user ID for error logging
   */
  private static getCurrentUserId(): string | null {
    try {
      // This would integrate with your auth system
      return localStorage.getItem('currentUserId') || null
    } catch {
      return null
    }
  }

  /**
   * Show error notification to user
   */
  private static showErrorNotification(errorState: ErrorState): void {
    // TODO: Implement notification system with toast/modal
    console.warn('Error notification:', errorState)
    
    // For now, you could dispatch a custom event that components can listen to
    window.dispatchEvent(new CustomEvent('error-notification', {
      detail: errorState
    }))
  }

  /**
   * Execute recovery actions based on error type
   */
  private static executeRecoveryAction(errorState: ErrorState, context: string): void {
    console.log(`Executing recovery action for ${context}`)
    
    switch (errorState.tipo) {
      case 'red':
        console.log('Network error - implementing retry logic')
        // Could implement automatic retry with exponential backoff
        break
      case 'auth':
        console.log('Auth error - may need to redirect to login')
        // Could dispatch event to redirect to login
        window.dispatchEvent(new CustomEvent('auth-error', { detail: errorState }))
        break
      case 'validacion':
        console.log('Validation error - focusing on invalid field')
        // Could highlight invalid form fields
        break
      case 'pago':
        console.log('Payment error - showing payment recovery options')
        // Could show payment retry options
        break
      default:
        console.log('System error - no specific recovery action')
    }
  }

  /**
   * Wrapper for operations with automatic error handling
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string,
    showNotification: boolean = true
  ): Promise<T | null> {
    try {
      return await operation()
    } catch (error) {
      this.handleError(error, context)
      
      if (!showNotification) {
        // Suppress notification for this error
        return null
      }
      
      return null
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  static async retryOperation<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        // Don't retry on certain error types
        if (this.shouldNotRetry(error)) {
          throw error
        }
        
        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          this.handleError(error, `${context} (final attempt)`)
          throw error
        }
        
        // Wait before retrying with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        console.warn(`Retrying ${context} (attempt ${attempt + 2}/${maxRetries + 1}) after ${delay}ms delay`)
      }
    }
    
    throw lastError
  }

  /**
   * Check if error should not be retried
   */
  private static shouldNotRetry(error: any): boolean {
    const noRetryErrors = [
      'auth/user-not-found',
      'auth/wrong-password',
      'auth/invalid-email',
      'firestore/permission-denied',
      'firestore/not-found',
      'firestore/already-exists',
      'firestore/failed-precondition',
      'firestore/unauthenticated'
    ]
    
    return noRetryErrors.includes(error.code)
  }

  /**
   * Get error logs from localStorage (for debugging)
   */
  static getErrorLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem('errorLog') || '[]')
    } catch {
      return []
    }
  }

  /**
   * Clear error logs
   */
  static clearErrorLogs(): void {
    localStorage.removeItem('errorLog')
  }

  /**
   * Create error state object without handling
   */
  static createErrorState(
    error: any, 
    accionRecuperacion?: () => void
  ): ErrorState {
    return {
      tipo: this.determineErrorType(error),
      mensaje: this.getErrorMessage(error),
      codigo: this.getErrorCode(error),
      accionRecuperacion,
      mostrarSoporte: this.shouldShowSupport(error)
    }
  }
}