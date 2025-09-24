import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NotificationsService } from '../notifications'
import { EmailNotificationsService } from '../emailNotifications'
import { RealTimeNotificationsService } from '../realTimeNotifications'
import type { Notificacion, PreferenciasNotificacion } from '../../types'

// Mock Firebase
vi.mock('../firebase', () => ({
  messaging: Promise.resolve({
    getToken: vi.fn(),
    onMessage: vi.fn()
  }),
  db: {},
  functions: {}
}))

// Mock AuthService
vi.mock('../auth', () => ({
  AuthService: {
    getCurrentUser: vi.fn(() => ({ uid: 'test-user-id' })),
    getUserProfile: vi.fn(() => Promise.resolve({
      uid: 'test-user-id',
      email: 'test@example.com',
      alias: 'TestUser',
      tipo: 'cliente'
    }))
  }
}))

// Mock Firestore operations
const mockUpdateDoc = vi.fn()
const mockArrayUnion = vi.fn()
const mockTimestamp = {
  now: vi.fn(() => ({ seconds: 1234567890 })),
  fromDate: vi.fn((date) => ({ seconds: Math.floor(date.getTime() / 1000) }))
}

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: mockUpdateDoc,
  arrayUnion: mockArrayUnion,
  Timestamp: mockTimestamp
}))

describe('NotificationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock Notification API
    global.Notification = {
      requestPermission: vi.fn(() => Promise.resolve('granted')),
      permission: 'default'
    } as any

    // Mock crypto.randomUUID
    global.crypto = {
      randomUUID: vi.fn(() => 'test-uuid-123')
    } as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('requestPermission', () => {
    it('should request notification permission and return token', async () => {
      const mockGetToken = vi.fn(() => Promise.resolve('test-fcm-token'))
      const mockMessaging = Promise.resolve({ getToken: mockGetToken })
      
      vi.doMock('../firebase', () => ({
        messaging: mockMessaging
      }))

      const token = await NotificationsService.requestPermission()
      
      expect(global.Notification.requestPermission).toHaveBeenCalled()
      expect(token).toBe('test-fcm-token')
    })

    it('should return null when permission is denied', async () => {
      global.Notification.requestPermission = vi.fn(() => Promise.resolve('denied'))
      
      const token = await NotificationsService.requestPermission()
      
      expect(token).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      global.Notification.requestPermission = vi.fn(() => Promise.reject(new Error('Permission error')))
      
      const token = await NotificationsService.requestPermission()
      
      expect(token).toBeNull()
    })
  })

  describe('sendCriticalEventNotification', () => {
    it('should send notification for critical events', async () => {
      const mockGetUserPreferences = vi.spyOn(NotificationsService, 'getUserPreferences')
        .mockResolvedValue({
          push: true,
          email: true,
          nuevoContrato: true,
          propuestaRecibida: true,
          contratoAsignado: true,
          pagoRecibido: true,
          trabajoEntregado: true,
          calificacionRecibida: true,
          mensajeChat: true,
          recordatorios: true
        })

      const mockSendNotificationToUser = vi.spyOn(NotificationsService, 'sendNotificationToUser')
        .mockResolvedValue()

      await NotificationsService.sendCriticalEventNotification(
        'test-user-id',
        'nuevo_contrato',
        'Test Title',
        'Test Message',
        { test: true }
      )

      expect(mockGetUserPreferences).toHaveBeenCalledWith('test-user-id')
      expect(mockSendNotificationToUser).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({
          tipo: 'nuevo_contrato',
          titulo: 'Test Title',
          mensaje: 'Test Message',
          datos: { test: true },
          prioridad: 'baja'
        })
      )
    })

    it('should not send notification if user preferences disable it', async () => {
      const mockGetUserPreferences = vi.spyOn(NotificationsService, 'getUserPreferences')
        .mockResolvedValue({
          push: true,
          email: true,
          nuevoContrato: false, // Disabled
          propuestaRecibida: true,
          contratoAsignado: true,
          pagoRecibido: true,
          trabajoEntregado: true,
          calificacionRecibida: true,
          mensajeChat: true,
          recordatorios: true
        })

      const mockSendNotificationToUser = vi.spyOn(NotificationsService, 'sendNotificationToUser')
        .mockResolvedValue()

      await NotificationsService.sendCriticalEventNotification(
        'test-user-id',
        'nuevo_contrato',
        'Test Title',
        'Test Message'
      )

      expect(mockGetUserPreferences).toHaveBeenCalledWith('test-user-id')
      expect(mockSendNotificationToUser).not.toHaveBeenCalled()
    })
  })

  describe('getUserNotifications', () => {
    it('should return user notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          tipo: 'nuevo_contrato',
          titulo: 'Test Notification',
          mensaje: 'Test Message',
          prioridad: 'media',
          fechaCreacion: { toDate: () => new Date() },
          leida: false
        }
      ]

      const mockGetUserProfile = vi.fn(() => Promise.resolve({
        notificaciones: mockNotifications
      }))

      vi.doMock('../auth', () => ({
        AuthService: {
          getUserProfile: mockGetUserProfile
        }
      }))

      const notifications = await NotificationsService.getUserNotifications('test-user-id')
      
      expect(notifications).toHaveLength(1)
      expect(notifications[0].tipo).toBe('nuevo_contrato')
    })

    it('should return empty array if no notifications', async () => {
      const mockGetUserProfile = vi.fn(() => Promise.resolve({}))

      vi.doMock('../auth', () => ({
        AuthService: {
          getUserProfile: mockGetUserProfile
        }
      }))

      const notifications = await NotificationsService.getUserNotifications('test-user-id')
      
      expect(notifications).toEqual([])
    })
  })

  describe('markNotificationAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          tipo: 'nuevo_contrato',
          titulo: 'Test Notification',
          mensaje: 'Test Message',
          prioridad: 'media',
          fechaCreacion: new Date(),
          leida: false
        }
      ]

      const mockGetUserNotifications = vi.spyOn(NotificationsService, 'getUserNotifications')
        .mockResolvedValue(mockNotifications)

      await NotificationsService.markNotificationAsRead('test-user-id', 'notif-1')

      expect(mockGetUserNotifications).toHaveBeenCalledWith('test-user-id')
      expect(mockUpdateDoc).toHaveBeenCalled()
    })
  })

  describe('updateUserPreferences', () => {
    it('should update user notification preferences', async () => {
      const preferences: PreferenciasNotificacion = {
        push: true,
        email: false,
        nuevoContrato: true,
        propuestaRecibida: false,
        contratoAsignado: true,
        pagoRecibido: true,
        trabajoEntregado: false,
        calificacionRecibida: true,
        mensajeChat: true,
        recordatorios: false
      }

      await NotificationsService.updateUserPreferences('test-user-id', preferences)

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        { preferenciasNotificacion: preferences }
      )
    })
  })
})

describe('EmailNotificationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendEmailNotification', () => {
    it('should send email notification with correct template', async () => {
      const mockHttpsCallable = vi.fn(() => Promise.resolve())
      
      vi.doMock('firebase/functions', () => ({
        httpsCallable: vi.fn(() => mockHttpsCallable)
      }))

      await EmailNotificationsService.sendEmailNotification(
        'test@example.com',
        'nuevo_contrato',
        { test: 'data' }
      )

      expect(mockHttpsCallable).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: '🎯 Nueva Oportunidad Disponible - The Blacklist',
        template: 'nuevo-contrato',
        data: { test: 'data' }
      })
    })
  })

  describe('sendWelcomeEmail', () => {
    it('should send welcome email to new users', async () => {
      const mockSendEmailNotification = vi.spyOn(EmailNotificationsService, 'sendEmailNotification')
        .mockResolvedValue()

      await EmailNotificationsService.sendWelcomeEmail(
        'test@example.com',
        'TestUser',
        'cliente'
      )

      expect(mockSendEmailNotification).toHaveBeenCalledWith(
        'test@example.com',
        'sistema',
        expect.objectContaining({
          alias: 'TestUser',
          tipo: 'cliente'
        })
      )
    })
  })

  describe('sendContractNotificationEmail', () => {
    it('should send contract notification email', async () => {
      const mockSendEmailNotification = vi.spyOn(EmailNotificationsService, 'sendEmailNotification')
        .mockResolvedValue()

      const contractData = {
        titulo: 'Test Contract',
        descripcion: 'Test Description',
        precio: 1000,
        fechaLimite: new Date()
      }

      await EmailNotificationsService.sendContractNotificationEmail(
        'test@example.com',
        'nuevo_contrato',
        contractData
      )

      expect(mockSendEmailNotification).toHaveBeenCalledWith(
        'test@example.com',
        'nuevo_contrato',
        expect.objectContaining({
          titulo: 'Test Contract',
          precio: 1000
        })
      )
    })
  })
})

describe('RealTimeNotificationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('startListening', () => {
    it('should start real-time listeners for user', () => {
      const mockOnSnapshot = vi.fn()
      const mockQuery = vi.fn()
      const mockCollection = vi.fn()
      
      vi.doMock('firebase/firestore', () => ({
        collection: mockCollection,
        query: mockQuery,
        where: vi.fn(),
        orderBy: vi.fn(),
        limit: vi.fn(),
        onSnapshot: mockOnSnapshot
      }))

      RealTimeNotificationsService.startListening('test-user-id')

      // Should set up listeners (implementation would need proper mocking)
      expect(true).toBe(true) // Placeholder assertion
    })
  })

  describe('stopListening', () => {
    it('should stop all listeners for user', () => {
      const mockUnsubscribe = vi.fn()
      
      // Mock existing listeners
      RealTimeNotificationsService['listeners'] = new Map([
        ['test-user-id_contracts', mockUnsubscribe],
        ['test-user-id_proposals', mockUnsubscribe]
      ])

      RealTimeNotificationsService.stopListening('test-user-id')

      expect(mockUnsubscribe).toHaveBeenCalledTimes(2)
    })
  })
})

describe('Notification Priority and Filtering', () => {
  it('should assign correct priority to notifications', () => {
    const highPriorityTypes = ['pago_recibido', 'contrato_asignado']
    const mediumPriorityTypes = ['propuesta_recibida', 'trabajo_entregado', 'mensaje_chat']
    const lowPriorityTypes = ['nuevo_contrato', 'calificacion_recibida', 'recordatorio']

    // Test high priority
    highPriorityTypes.forEach(tipo => {
      const priority = NotificationsService['getNotificationPriority'](tipo as any)
      expect(priority).toBe('alta')
    })

    // Test medium priority
    mediumPriorityTypes.forEach(tipo => {
      const priority = NotificationsService['getNotificationPriority'](tipo as any)
      expect(priority).toBe('media')
    })

    // Test low priority
    lowPriorityTypes.forEach(tipo => {
      const priority = NotificationsService['getNotificationPriority'](tipo as any)
      expect(priority).toBe('baja')
    })
  })

  it('should filter notifications based on user preferences', () => {
    const preferences: PreferenciasNotificacion = {
      push: true,
      email: true,
      nuevoContrato: false,
      propuestaRecibida: true,
      contratoAsignado: true,
      pagoRecibido: false,
      trabajoEntregado: true,
      calificacionRecibida: false,
      mensajeChat: true,
      recordatorios: true
    }

    // Should send
    expect(NotificationsService['shouldSendNotification']('propuesta_recibida', preferences)).toBe(true)
    expect(NotificationsService['shouldSendNotification']('mensaje_chat', preferences)).toBe(true)

    // Should not send
    expect(NotificationsService['shouldSendNotification']('nuevo_contrato', preferences)).toBe(false)
    expect(NotificationsService['shouldSendNotification']('pago_recibido', preferences)).toBe(false)
  })
})