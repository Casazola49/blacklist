/**
 * Ejemplos de uso del sistema de manejo de errores y logging
 * Este archivo contiene ejemplos prácticos de cómo usar los servicios
 */

import { useErrorHandling } from '@/composables/useErrorHandling'
import { loggerService } from '@/services/logger'
import { notificationService } from '@/services/notifications'
import { monitoringService } from '@/services/monitoring'

// Ejemplo 1: Manejo básico de errores en un composable
export function useExampleService() {
  const { executeWithErrorHandling, handleValidationError } = useErrorHandling()

  const fetchUserData = async (userId: string) => {
    return executeWithErrorHandling(
      async () => {
        const response = await fetch(`/api/users/${userId}`)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return response.json()
      },
      'fetch_user_data',
      {
        retryOnFailure: true,
        maxRetries: 2
      }
    )
  }

  const validateUserInput = (email: string, password: string) => {
    if (!email || !email.includes('@')) {
      handleValidationError('email', 'Email inválido', email)
      return false
    }

    if (!password || password.length < 8) {
      handleValidationError('password', 'Contraseña debe tener al menos 8 caracteres', password.length)
      return false
    }

    return true
  }

  return {
    fetchUserData,
    validateUserInput
  }
}

// Ejemplo 2: Logging de auditoría para acciones críticas
export async function auditExample() {
  // Log de inicio de sesión
  await loggerService.logAudit(
    'user_login',
    'user',
    'user123',
    undefined,
    { loginMethod: 'gmail', timestamp: new Date() }
  )

  // Log de cambio de datos importantes
  await loggerService.logAudit(
    'profile_update',
    'user_profile',
    'user123',
    { email: 'old@example.com' },
    { email: 'new@example.com' },
    { field: 'email', reason: 'user_request' }
  )

  // Log de transacción financiera
  await loggerService.logAudit(
    'payment_processed',
    'transaction',
    'tx_456',
    { status: 'pending', amount: 100 },
    { status: 'completed', amount: 100 },
    { paymentMethod: 'escrow', commission: 15 }
  )
}

// Ejemplo 3: Manejo de errores específicos por tipo
export class FirebaseErrorHandler {
  private errorHandling = useErrorHandling()

  async signInUser(email: string, password: string) {
    try {
      const result = await this.errorHandling.executeFirebaseOperation(
        async () => {
          // Simulación de operación Firebase
          const auth = await import('firebase/auth')
          return auth.signInWithEmailAndPassword(auth.getAuth(), email, password)
        },
        'sign_in_user'
      )

      if (result) {
        await loggerService.logAudit('user_signin', 'auth', result.user.uid)
        return result
      }

      return null
    } catch (error: any) {
      await this.errorHandling.handleAuthError(error)
      return null
    }
  }

  async createDocument(collection: string, data: any) {
    return this.errorHandling.executeFirebaseOperation(
      async () => {
        // Simulación de operación Firestore
        const firestore = await import('firebase/firestore')
        const db = firestore.getFirestore()
        return firestore.addDoc(firestore.collection(db, collection), data)
      },
      `create_${collection}_document`
    )
  }
}

// Ejemplo 4: Notificaciones manuales
export async function notificationExamples() {
  // Notificación de éxito
  await notificationService.showSuccess({
    title: 'Operación Completada',
    message: 'El contrato ha sido creado exitosamente',
    duration: 3000
  })

  // Notificación de advertencia con acción
  await notificationService.showWarning({
    title: 'Conexión Inestable',
    message: 'Tu conexión parece inestable. Algunos datos podrían no estar actualizados.',
    duration: 5000,
    actions: [
      {
        label: 'Reintentar',
        action: async () => {
          // Lógica de reintento
          window.location.reload()
        },
        style: 'primary'
      }
    ]
  })

  // Notificación informativa
  await notificationService.showInfo({
    title: 'Nueva Funcionalidad',
    message: 'Ahora puedes exportar tus datos desde el panel de configuración',
    duration: 6000,
    actions: [
      {
        label: 'Ver Más',
        action: () => {
          // Navegar a configuración
          console.log('Navegando a configuración')
        },
        style: 'secondary'
      }
    ]
  })
}

// Ejemplo 5: Monitoreo de rendimiento personalizado
export function performanceMonitoringExample() {
  // Monitorear operación específica
  const startTime = Date.now()
  
  // ... realizar operación ...
  
  const duration = Date.now() - startTime
  monitoringService.recordResponseTime(duration)

  // Obtener métricas actuales
  const metrics = monitoringService.getPerformanceMetrics()
  console.log('Métricas de rendimiento:', metrics)

  // Obtener estado de salud
  const health = monitoringService.getSystemHealth()
  console.log('Estado del sistema:', health)

  // Obtener alertas activas
  const alerts = monitoringService.getActiveAlerts()
  if (alerts.length > 0) {
    console.warn('Alertas activas:', alerts)
  }
}

// Ejemplo 6: Manejo de errores en componentes Vue
export function vueComponentErrorExample() {
  // En un componente Vue, usar el composable
  const { executeWithErrorHandling, isLoading, hasError, lastError } = useErrorHandling()

  const loadData = async () => {
    const data = await executeWithErrorHandling(
      async () => {
        // Operación que puede fallar
        const response = await fetch('/api/data')
        return response.json()
      },
      'load_component_data'
    )

    if (data) {
      // Usar los datos
      console.log('Datos cargados:', data)
    }
    // Los errores se manejan automáticamente
  }

  return {
    loadData,
    isLoading,
    hasError,
    lastError
  }
}

// Ejemplo 7: Configuración de alertas personalizadas
export async function customAlertExample() {
  // Simular condición que requiere alerta
  const errorRate = 0.15 // 15% de errores

  if (errorRate > 0.1) {
    // El sistema de monitoreo creará automáticamente una alerta
    // pero también podemos crear alertas manuales si es necesario
    
    await loggerService.logCritical(
      'Tasa de error crítica detectada',
      'custom_monitoring',
      {
        errorRate,
        threshold: 0.1,
        action: 'manual_alert'
      }
    )
  }
}

// Ejemplo 8: Exportar datos para análisis
export function exportDataExample() {
  // Exportar logs para análisis
  const logData = loggerService.exportLogs()
  console.log('Logs exportados:', logData)

  // Exportar datos de monitoreo
  const monitoringData = monitoringService.exportMonitoringData()
  console.log('Datos de monitoreo:', monitoringData)

  // En una aplicación real, estos datos se enviarían a un servicio de análisis
  // o se descargarían como archivos para revisión manual
}

// Ejemplo 9: Limpieza de datos antiguos
export function cleanupExample() {
  // Limpiar logs antiguos (más de 24 horas)
  loggerService.clearOldLogs(24)

  // Limpiar errores antiguos
  // errorHandler.clearOldErrors(24) // Si este método existiera

  // Limpiar notificaciones
  notificationService.clearAll()

  console.log('Limpieza de datos completada')
}

// Ejemplo 10: Configuración de desarrollo vs producción
export function environmentConfigExample() {
  if (import.meta.env.DEV) {
    // En desarrollo, mostrar más información
    console.log('Modo desarrollo: logging detallado activado')
    
    // Exponer herramientas de debugging
    (window as any).__ERROR_TOOLS__ = {
      logger: loggerService,
      monitoring: monitoringService,
      notifications: notificationService
    }
  } else {
    // En producción, configuración más conservadora
    console.log('Modo producción: logging optimizado')
    
    // Configurar envío de logs a servicios externos
    // setupRemoteLogging()
  }
}