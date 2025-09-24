import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { errorHandler } from '../errorHandler'
import { loggerService } from '../logger'
import { notificationService } from '../notifications'

// Mock de los servicios dependientes
vi.mock('../logger', () => ({
  loggerService: {
    logError: vi.fn(),
    logInfo: vi.fn()
  }
}))

vi.mock('../notifications', () => ({
  notificationService: {
    showError: vi.fn()
  }
}))

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Limpiar errores después de cada test
    errorHandler.clearOldErrors(0)
  })

  describe('handleError', () => {
    it('debe manejar errores básicos correctamente', async () => {
      const error = new Error('Test error')
      const context = 'test_context'
      const metadata = { testData: 'value' }

      await errorHandler.handleError(error, context, metadata)

      expect(loggerService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
          context: 'test_context',
          metadata: { testData: 'value' }
        })
      )
    })

    it('debe determinar correctamente el tipo de error', async () => {
      const authError = { code: 'auth/user-not-found', message: 'User not found' }
      await errorHandler.handleError(authError, 'auth_test')

      const networkError = { name: 'NetworkError', message: 'Network failed' }
      await errorHandler.handleError(networkError, 'network_test')

      expect(loggerService.logError).toHaveBeenCalledTimes(2)
    })

    it('debe mostrar notificación para errores apropiados', async () => {
      const systemError = new Error('System failure')
      await errorHandler.handleError(systemError, 'system_test')

      expect(notificationService.showError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'system',
          message: 'System failure'
        })
      )
    })

    it('no debe mostrar notificación para errores de validación', async () => {
      const validationError = new Error('Validation failed')
      validationError.name = 'ValidationError'
      
      await errorHandler.handleError(validationError, 'validation_test')

      expect(notificationService.showError).not.toHaveBeenCalled()
    })
  })

  describe('executeWithRetry', () => {
    it('debe ejecutar operación exitosa sin reintentos', async () => {
      const operation = vi.fn().mockResolvedValue('success')
      
      const result = await errorHandler.executeWithRetry(operation, 'test_operation')
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('debe reintentar operación fallida', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success')
      
      const result = await errorHandler.executeWithRetry(operation, 'test_operation', 3)
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('debe fallar después de agotar todos los reintentos', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Persistent failure'))
      
      await expect(
        errorHandler.executeWithRetry(operation, 'test_operation', 2)
      ).rejects.toThrow('Persistent failure')
      
      expect(operation).toHaveBeenCalledTimes(3) // 1 intento inicial + 2 reintentos
    })

    it('debe registrar información de reintentos', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValue('success')
      
      await errorHandler.executeWithRetry(operation, 'test_operation')
      
      expect(loggerService.logInfo).toHaveBeenCalledWith(
        expect.stringContaining('Reintentando operación')
      )
    })
  })

  describe('getRecentErrors', () => {
    it('debe retornar errores recientes ordenados por fecha', async () => {
      const error1 = new Error('First error')
      const error2 = new Error('Second error')
      
      await errorHandler.handleError(error1, 'test1')
      // Pequeña pausa para asegurar timestamps diferentes
      await new Promise(resolve => setTimeout(resolve, 1))
      await errorHandler.handleError(error2, 'test2')
      
      const recentErrors = errorHandler.getRecentErrors(2)
      
      expect(recentErrors).toHaveLength(2)
      expect(recentErrors[0].message).toBe('Second error')
      expect(recentErrors[1].message).toBe('First error')
    })

    it('debe limitar el número de errores retornados', async () => {
      for (let i = 0; i < 5; i++) {
        await errorHandler.handleError(new Error(`Error ${i}`), `test${i}`)
      }
      
      const recentErrors = errorHandler.getRecentErrors(3)
      expect(recentErrors).toHaveLength(3)
    })
  })

  describe('getErrorStats', () => {
    it('debe retornar estadísticas correctas de errores', async () => {
      await errorHandler.handleError({ code: 'auth/user-not-found', message: 'Auth error' }, 'auth_test')
      await errorHandler.handleError(new Error('System error'), 'system_test')
      await errorHandler.handleError({ name: 'NetworkError', message: 'Network error' }, 'network_test')
      
      const stats = errorHandler.getErrorStats()
      
      expect(stats.auth).toBe(1)
      expect(stats.system).toBe(1)
      expect(stats.network).toBe(1)
    })
  })

  describe('clearOldErrors', () => {
    it('debe limpiar errores antiguos', async () => {
      await errorHandler.handleError(new Error('Old error'), 'test')
      
      // Simular que el error es de hace 25 horas
      const errors = errorHandler.getRecentErrors()
      if (errors.length > 0) {
        errors[0].timestamp = new Date(Date.now() - 25 * 60 * 60 * 1000)
      }
      
      errorHandler.clearOldErrors(24)
      
      const remainingErrors = errorHandler.getRecentErrors()
      expect(remainingErrors).toHaveLength(0)
    })
  })
})

// Tests de integración
describe('ErrorHandler Integration', () => {
  it('debe manejar flujo completo de error con recuperación', async () => {
    const mockOperation = vi.fn()
      .mockRejectedValueOnce(new Error('Network timeout'))
      .mockResolvedValue('recovered')
    
    const result = await errorHandler.executeWithRetry(mockOperation, 'integration_test')
    
    expect(result).toBe('recovered')
    expect(loggerService.logError).toHaveBeenCalled()
    expect(loggerService.logInfo).toHaveBeenCalledWith(
      expect.stringContaining('Reintentando operación')
    )
  })

  it('debe manejar múltiples errores concurrentes', async () => {
    // Limpiar mocks antes de este test específico
    vi.clearAllMocks()
    
    const promises = [
      errorHandler.handleError(new Error('Error 1'), 'concurrent_1'),
      errorHandler.handleError(new Error('Error 2'), 'concurrent_2'),
      errorHandler.handleError(new Error('Error 3'), 'concurrent_3')
    ]
    
    await Promise.all(promises)
    
    const errors = errorHandler.getRecentErrors()
    expect(errors).toHaveLength(3)
    expect(loggerService.logError).toHaveBeenCalledTimes(3)
  })
})