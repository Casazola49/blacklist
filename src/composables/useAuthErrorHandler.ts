import { ref } from 'vue'

export function useAuthErrorHandler() {
  const error = ref<string | null>(null)
  const isRetrying = ref(false)

  const getErrorMessage = (error: any): string => {
    if (!error) return 'Error desconocido'

    const errorCode = error.code || error.message || error

    const errorMessages: Record<string, string> = {
      // Firebase Auth errors
      'auth/popup-blocked': 'El navegador bloqueó la ventana emergente. Por favor, permite ventanas emergentes para este sitio.',
      'auth/popup-closed-by-user': 'Ventana de autenticación cerrada. Inténtalo de nuevo.',
      'auth/cancelled-popup-request': 'Solicitud de autenticación cancelada. Inténtalo de nuevo.',
      'auth/network-request-failed': 'Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.',
      'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos antes de intentar de nuevo.',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
      'auth/user-not-found': 'Usuario no encontrado.',
      'auth/wrong-password': 'Contraseña incorrecta.',
      'auth/email-already-in-use': 'Este email ya está registrado.',
      'auth/weak-password': 'La contraseña es muy débil.',
      'auth/invalid-email': 'Email inválido.',
      'auth/operation-not-allowed': 'Operación no permitida.',
      'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este email usando un método diferente.',
      'auth/credential-already-in-use': 'Esta credencial ya está en uso.',
      'auth/timeout': 'La operación tardó demasiado. Inténtalo de nuevo.',
      'auth/app-not-authorized': 'La aplicación no está autorizada para usar Firebase Auth.',
      'auth/api-key-not-valid': 'Clave API inválida.',
      'auth/invalid-user-token': 'Token de usuario inválido.',
      'auth/user-token-expired': 'Token de usuario expirado.',
      'auth/null-user': 'No hay usuario autenticado.',
      'auth/app-deleted': 'La aplicación Firebase ha sido eliminada.',
      'auth/invalid-api-key': 'Clave API inválida.',
      
      // reCAPTCHA specific errors
      'auth/recaptcha-not-enabled': 'reCAPTCHA no está habilitado para este proyecto.',
      'auth/missing-recaptcha-token': 'Token de reCAPTCHA faltante.',
      'auth/invalid-recaptcha-token': 'Token de reCAPTCHA inválido.',
      'auth/invalid-recaptcha-action': 'Acción de reCAPTCHA inválida.',
      'auth/missing-client-type': 'Tipo de cliente faltante.',
      
      // CSP and loading errors
      'Failed to load': 'Error al cargar recursos. Verifica la configuración de seguridad del navegador.',
      'Content Security Policy': 'Error de política de seguridad. Contacta al administrador.',
      'net::ERR_BLOCKED_BY_CLIENT': 'Bloqueado por el navegador. Desactiva bloqueadores de anuncios para este sitio.',
      
      // Generic network errors
      'NetworkError': 'Error de red. Verifica tu conexión a internet.',
      'TypeError': 'Error de configuración. Recarga la página e inténtalo de nuevo.',
    }

    // Check for specific error codes first
    for (const [code, message] of Object.entries(errorMessages)) {
      if (errorCode.includes(code)) {
        return message
      }
    }

    // Fallback to generic message
    return 'Error de autenticación. Por favor, inténtalo de nuevo.'
  }

  const handleAuthError = (authError: any) => {
    console.error('Auth error:', authError)
    error.value = getErrorMessage(authError)
    
    // Auto-clear error after 10 seconds
    setTimeout(() => {
      if (error.value === getErrorMessage(authError)) {
        error.value = null
      }
    }, 10000)
  }

  const clearError = () => {
    error.value = null
  }

  const retryWithFallback = async (primaryAction: () => Promise<any>, fallbackAction?: () => Promise<any>) => {
    if (isRetrying.value) return null

    isRetrying.value = true
    error.value = null

    try {
      return await primaryAction()
    } catch (primaryError) {
      console.warn('Primary action failed:', primaryError)
      
      if (fallbackAction) {
        try {
          console.log('Trying fallback action...')
          return await fallbackAction()
        } catch (fallbackError) {
          console.error('Fallback action also failed:', fallbackError)
          handleAuthError(fallbackError)
          throw fallbackError
        }
      } else {
        handleAuthError(primaryError)
        throw primaryError
      }
    } finally {
      isRetrying.value = false
    }
  }

  return {
    error,
    isRetrying,
    handleAuthError,
    clearError,
    retryWithFallback,
    getErrorMessage
  }
}