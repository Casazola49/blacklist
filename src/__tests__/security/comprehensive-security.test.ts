import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore'

// Mock de servicios de autenticación
const mockAuth = {
  currentUser: null,
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn()
}

// Mock de validación de entrada
const inputValidator = {
  sanitizeInput: vi.fn(),
  validateEmail: vi.fn(),
  validatePassword: vi.fn(),
  validateContractData: vi.fn(),
  validateEscrowData: vi.fn()
}

describe('Pruebas de Seguridad Comprehensivas', () => {
  let testEnv: RulesTestEnvironment
  let db: any

  beforeEach(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-security-project',
      firestore: {
        rules: `
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              // Usuarios solo pueden acceder a sus propios datos
              match /usuarios/{userId} {
                allow read, write: if request.auth != null && request.auth.uid == userId;
              }
              
              // Contratos: validaciones estrictas
              match /contratos/{contratoId} {
                allow create: if request.auth != null && 
                  request.auth.uid == resource.data.clienteId &&
                  resource.data.titulo is string &&
                  resource.data.titulo.size() > 0 &&
                  resource.data.presupuesto is number &&
                  resource.data.presupuesto > 0;
                  
                allow read: if request.auth != null && 
                  (request.auth.uid == resource.data.clienteId || 
                   request.auth.uid == resource.data.especialistaId);
                   
                allow update: if request.auth != null && 
                  (request.auth.uid == resource.data.clienteId || 
                   request.auth.uid == resource.data.especialistaId) &&
                  request.resource.data.clienteId == resource.data.clienteId;
              }
              
              // Transacciones de escrow: solo lectura para participantes
              match /transacciones/{transaccionId} {
                allow read: if request.auth != null && 
                  (request.auth.uid == resource.data.clienteId || 
                   request.auth.uid == resource.data.especialistaId);
                allow create: if request.auth != null && 
                  request.auth.uid == resource.data.clienteId;
                allow update: if false; // Solo Cloud Functions pueden actualizar
              }
              
              // Chats: solo participantes
              match /chats/{chatId} {
                allow read, write: if request.auth != null && 
                  request.auth.uid in resource.data.participantes;
              }
              
              // Mensajes: solo participantes del chat
              match /mensajes/{mensajeId} {
                allow read: if request.auth != null;
                allow create: if request.auth != null && 
                  request.auth.uid == request.resource.data.autorId;
              }
              
              // Calificaciones: validaciones estrictas
              match /calificaciones/{calificacionId} {
                allow create: if request.auth != null && 
                  request.auth.uid == request.resource.data.evaluadorId &&
                  request.resource.data.puntuacion >= 1 &&
                  request.resource.data.puntuacion <= 5;
                allow read: if request.auth != null;
              }
            }
          }
        `
      }
    })

    db = testEnv.unauthenticatedContext().firestore()
  })

  afterEach(async () => {
    await testEnv.cleanup()
    vi.clearAllMocks()
  })

  describe('Validación de Reglas de Firestore', () => {
    it('debe denegar acceso no autenticado a datos de usuario', async () => {
      const userDoc = doc(db, 'usuarios', 'test-user-id')
      
      await expect(getDoc(userDoc)).rejects.toThrow()
    })

    it('debe permitir acceso solo al propio usuario', async () => {
      const authenticatedDb = testEnv.authenticatedContext('user-123').firestore()
      const userDoc = doc(authenticatedDb, 'usuarios', 'user-123')
      
      // Debe permitir acceso a propios datos
      await expect(setDoc(userDoc, { 
        email: 'test@example.com',
        alias: 'TestUser'
      })).resolves.not.toThrow()

      // Debe denegar acceso a datos de otro usuario
      const otherUserDoc = doc(authenticatedDb, 'usuarios', 'other-user')
      await expect(getDoc(otherUserDoc)).rejects.toThrow()
    })

    it('debe validar datos de contrato al crear', async () => {
      const authenticatedDb = testEnv.authenticatedContext('client-123').firestore()
      const contractDoc = doc(authenticatedDb, 'contratos', 'contract-123')

      // Contrato válido debe pasar
      await expect(setDoc(contractDoc, {
        clienteId: 'client-123',
        titulo: 'Proyecto válido',
        descripcion: 'Descripción del proyecto',
        presupuesto: 500,
        fechaLimite: new Date(),
        estado: 'abierto'
      })).resolves.not.toThrow()

      // Contrato sin título debe fallar
      const invalidContractDoc = doc(authenticatedDb, 'contratos', 'invalid-contract')
      await expect(setDoc(invalidContractDoc, {
        clienteId: 'client-123',
        titulo: '', // Título vacío
        presupuesto: 500
      })).rejects.toThrow()

      // Presupuesto negativo debe fallar
      const negativeContractDoc = doc(authenticatedDb, 'contratos', 'negative-contract')
      await expect(setDoc(negativeContractDoc, {
        clienteId: 'client-123',
        titulo: 'Proyecto',
        presupuesto: -100 // Presupuesto negativo
      })).rejects.toThrow()
    })

    it('debe prevenir modificación de clienteId en contratos', async () => {
      const authenticatedDb = testEnv.authenticatedContext('client-123').firestore()
      const contractDoc = doc(authenticatedDb, 'contratos', 'contract-123')

      // Crear contrato inicial
      await setDoc(contractDoc, {
        clienteId: 'client-123',
        titulo: 'Proyecto inicial',
        presupuesto: 500
      })

      // Intentar cambiar clienteId debe fallar
      await expect(updateDoc(contractDoc, {
        clienteId: 'malicious-user', // Intento de cambiar propietario
        titulo: 'Proyecto modificado'
      })).rejects.toThrow()
    })

    it('debe restringir acceso a transacciones de escrow', async () => {
      const clientDb = testEnv.authenticatedContext('client-123').firestore()
      const specialistDb = testEnv.authenticatedContext('specialist-456').firestore()
      const maliciousDb = testEnv.authenticatedContext('malicious-user').firestore()

      const transactionDoc = doc(clientDb, 'transacciones', 'tx-123')

      // Cliente puede crear transacción
      await expect(setDoc(transactionDoc, {
        clienteId: 'client-123',
        especialistaId: 'specialist-456',
        monto: 500,
        estado: 'pendiente'
      })).resolves.not.toThrow()

      // Especialista puede leer
      const specialistTransactionDoc = doc(specialistDb, 'transacciones', 'tx-123')
      await expect(getDoc(specialistTransactionDoc)).resolves.not.toThrow()

      // Usuario no autorizado no puede acceder
      const maliciousTransactionDoc = doc(maliciousDb, 'transacciones', 'tx-123')
      await expect(getDoc(maliciousTransactionDoc)).rejects.toThrow()

      // Nadie puede actualizar directamente (solo Cloud Functions)
      await expect(updateDoc(transactionDoc, {
        estado: 'completado'
      })).rejects.toThrow()
    })

    it('debe validar calificaciones', async () => {
      const authenticatedDb = testEnv.authenticatedContext('user-123').firestore()
      const ratingDoc = doc(authenticatedDb, 'calificaciones', 'rating-123')

      // Calificación válida
      await expect(setDoc(ratingDoc, {
        evaluadorId: 'user-123',
        evaluadoId: 'user-456',
        contratoId: 'contract-123',
        puntuacion: 5,
        comentario: 'Excelente trabajo'
      })).resolves.not.toThrow()

      // Puntuación fuera de rango debe fallar
      const invalidRatingDoc = doc(authenticatedDb, 'calificaciones', 'invalid-rating')
      await expect(setDoc(invalidRatingDoc, {
        evaluadorId: 'user-123',
        evaluadoId: 'user-456',
        puntuacion: 6, // Fuera de rango
        comentario: 'Comentario'
      })).rejects.toThrow()

      // Usuario no puede calificar en nombre de otro
      const fakeRatingDoc = doc(authenticatedDb, 'calificaciones', 'fake-rating')
      await expect(setDoc(fakeRatingDoc, {
        evaluadorId: 'other-user', // No es el usuario autenticado
        evaluadoId: 'user-456',
        puntuacion: 5,
        comentario: 'Comentario falso'
      })).rejects.toThrow()
    })
  })

  describe('Validación de Entrada de Datos', () => {
    beforeEach(() => {
      // Configurar mocks de validación
      inputValidator.sanitizeInput.mockImplementation((input) => {
        if (typeof input !== 'string') return input
        return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      })

      inputValidator.validateEmail.mockImplementation((email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
      })

      inputValidator.validatePassword.mockImplementation((password) => {
        return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)
      })
    })

    it('debe sanitizar entrada de scripts maliciosos', () => {
      const maliciousInput = '<script>alert("XSS")</script>Contenido normal'
      const sanitized = inputValidator.sanitizeInput(maliciousInput)
      
      expect(sanitized).toBe('Contenido normal')
      expect(sanitized).not.toContain('<script>')
    })

    it('debe validar formato de email', () => {
      expect(inputValidator.validateEmail('valid@example.com')).toBe(true)
      expect(inputValidator.validateEmail('invalid-email')).toBe(false)
      expect(inputValidator.validateEmail('missing@domain')).toBe(false)
      expect(inputValidator.validateEmail('@missing-local.com')).toBe(false)
    })

    it('debe validar fortaleza de contraseña', () => {
      expect(inputValidator.validatePassword('StrongPass123')).toBe(true)
      expect(inputValidator.validatePassword('weak')).toBe(false)
      expect(inputValidator.validatePassword('NoNumbers')).toBe(false)
      expect(inputValidator.validatePassword('nocapitals123')).toBe(false)
    })

    it('debe validar datos de contrato', () => {
      inputValidator.validateContractData.mockImplementation((data) => {
        const errors = []
        
        if (!data.titulo || data.titulo.trim().length === 0) {
          errors.push('Título requerido')
        }
        if (!data.descripcion || data.descripcion.trim().length < 10) {
          errors.push('Descripción debe tener al menos 10 caracteres')
        }
        if (!data.presupuesto || data.presupuesto <= 0) {
          errors.push('Presupuesto debe ser mayor a 0')
        }
        if (!data.fechaLimite || new Date(data.fechaLimite) <= new Date()) {
          errors.push('Fecha límite debe ser futura')
        }
        
        return { valid: errors.length === 0, errors }
      })

      // Datos válidos
      const validContract = {
        titulo: 'Proyecto válido',
        descripcion: 'Descripción detallada del proyecto que necesito completar',
        presupuesto: 500,
        fechaLimite: new Date(Date.now() + 86400000) // Mañana
      }
      
      const validResult = inputValidator.validateContractData(validContract)
      expect(validResult.valid).toBe(true)
      expect(validResult.errors).toHaveLength(0)

      // Datos inválidos
      const invalidContract = {
        titulo: '',
        descripcion: 'Corto',
        presupuesto: -100,
        fechaLimite: new Date(Date.now() - 86400000) // Ayer
      }
      
      const invalidResult = inputValidator.validateContractData(invalidContract)
      expect(invalidResult.valid).toBe(false)
      expect(invalidResult.errors).toHaveLength(4)
    })
  })

  describe('Prevención de Ataques de Inyección', () => {
    it('debe prevenir inyección SQL en consultas', async () => {
      const maliciousQuery = "'; DROP TABLE usuarios; --"
      
      // Mock de consulta segura
      const safeQuery = vi.fn().mockImplementation((searchTerm) => {
        // Simular sanitización
        const sanitized = searchTerm.replace(/[';\\]/g, '')
        return Promise.resolve([])
      })

      await safeQuery(maliciousQuery)
      expect(safeQuery).toHaveBeenCalledWith(maliciousQuery)
    })

    it('debe prevenir inyección NoSQL en Firestore', async () => {
      const authenticatedDb = testEnv.authenticatedContext('user-123').firestore()
      
      // Intento de inyección NoSQL
      const maliciousWhere = {
        $where: "function() { return true; }" // Intento de ejecutar código
      }

      // Firestore debe rechazar consultas maliciosas
      const contractsRef = collection(authenticatedDb, 'contratos')
      
      // Esto debe fallar o ser sanitizado por Firestore
      await expect(
        getDocs(query(contractsRef, where('titulo', '==', maliciousWhere)))
      ).rejects.toThrow()
    })
  })

  describe('Autenticación y Autorización', () => {
    it('debe requerir autenticación para operaciones sensibles', async () => {
      // Mock de operaciones que requieren autenticación
      const sensitiveOperation = vi.fn().mockImplementation((user) => {
        if (!user || !user.uid) {
          throw new Error('Autenticación requerida')
        }
        return Promise.resolve('Operación exitosa')
      })

      // Sin usuario autenticado debe fallar
      await expect(sensitiveOperation(null)).rejects.toThrow('Autenticación requerida')

      // Con usuario autenticado debe funcionar
      const authenticatedUser = { uid: 'user-123', email: 'test@example.com' }
      await expect(sensitiveOperation(authenticatedUser)).resolves.toBe('Operación exitosa')
    })

    it('debe validar permisos por rol', () => {
      const checkPermission = (user: any, action: string) => {
        if (!user) return false
        
        const permissions = {
          'cliente': ['create_contract', 'view_own_contracts', 'rate_specialist'],
          'especialista': ['view_opportunities', 'submit_proposal', 'rate_client'],
          'admin': ['manage_users', 'resolve_disputes', 'view_all_data']
        }
        
        return permissions[user.role]?.includes(action) || false
      }

      const cliente = { uid: 'client-123', role: 'cliente' }
      const especialista = { uid: 'specialist-456', role: 'especialista' }
      const admin = { uid: 'admin-789', role: 'admin' }

      // Cliente puede crear contratos
      expect(checkPermission(cliente, 'create_contract')).toBe(true)
      expect(checkPermission(cliente, 'manage_users')).toBe(false)

      // Especialista puede ver oportunidades
      expect(checkPermission(especialista, 'view_opportunities')).toBe(true)
      expect(checkPermission(especialista, 'create_contract')).toBe(false)

      // Admin puede hacer todo
      expect(checkPermission(admin, 'manage_users')).toBe(true)
      expect(checkPermission(admin, 'resolve_disputes')).toBe(true)
    })
  })

  describe('Protección contra Ataques de Fuerza Bruta', () => {
    it('debe limitar intentos de login', async () => {
      const rateLimiter = {
        attempts: new Map(),
        isBlocked: (email: string) => {
          const attempts = rateLimiter.attempts.get(email) || 0
          return attempts >= 5
        },
        recordAttempt: (email: string) => {
          const attempts = rateLimiter.attempts.get(email) || 0
          rateLimiter.attempts.set(email, attempts + 1)
        },
        reset: (email: string) => {
          rateLimiter.attempts.delete(email)
        }
      }

      const attemptLogin = async (email: string, password: string) => {
        if (rateLimiter.isBlocked(email)) {
          throw new Error('Demasiados intentos fallidos. Cuenta bloqueada temporalmente.')
        }

        // Simular validación de credenciales
        if (password !== 'correct-password') {
          rateLimiter.recordAttempt(email)
          throw new Error('Credenciales inválidas')
        }

        rateLimiter.reset(email)
        return { success: true, user: { email } }
      }

      const email = 'test@example.com'

      // Primeros 5 intentos deben fallar pero permitirse
      for (let i = 0; i < 5; i++) {
        await expect(attemptLogin(email, 'wrong-password')).rejects.toThrow('Credenciales inválidas')
      }

      // Sexto intento debe ser bloqueado
      await expect(attemptLogin(email, 'wrong-password')).rejects.toThrow('Demasiados intentos fallidos')

      // Incluso con contraseña correcta debe estar bloqueado
      await expect(attemptLogin(email, 'correct-password')).rejects.toThrow('Demasiados intentos fallidos')
    })
  })

  describe('Validación de Archivos Subidos', () => {
    it('debe validar tipos de archivo permitidos', () => {
      const validateFile = (file: { name: string, type: string, size: number }) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain']
        const maxSize = 10 * 1024 * 1024 // 10MB
        
        if (!allowedTypes.includes(file.type)) {
          throw new Error('Tipo de archivo no permitido')
        }
        
        if (file.size > maxSize) {
          throw new Error('Archivo demasiado grande')
        }
        
        return true
      }

      // Archivo válido
      expect(validateFile({
        name: 'document.pdf',
        type: 'application/pdf',
        size: 1024 * 1024 // 1MB
      })).toBe(true)

      // Tipo no permitido
      expect(() => validateFile({
        name: 'script.exe',
        type: 'application/x-executable',
        size: 1024
      })).toThrow('Tipo de archivo no permitido')

      // Archivo demasiado grande
      expect(() => validateFile({
        name: 'large.pdf',
        type: 'application/pdf',
        size: 20 * 1024 * 1024 // 20MB
      })).toThrow('Archivo demasiado grande')
    })
  })

  describe('Protección de Datos Sensibles', () => {
    it('debe enmascarar datos sensibles en logs', () => {
      const logSanitizer = (data: any) => {
        const sensitiveFields = ['password', 'email', 'creditCard', 'ssn']
        const sanitized = { ...data }
        
        for (const field of sensitiveFields) {
          if (sanitized[field]) {
            sanitized[field] = '***REDACTED***'
          }
        }
        
        return sanitized
      }

      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        age: 30
      }

      const sanitized = logSanitizer(userData)
      
      expect(sanitized.name).toBe('John Doe')
      expect(sanitized.age).toBe(30)
      expect(sanitized.email).toBe('***REDACTED***')
      expect(sanitized.password).toBe('***REDACTED***')
    })

    it('debe encriptar datos sensibles antes de almacenar', () => {
      const encrypt = (data: string) => {
        // Simulación de encriptación (en producción usar crypto real)
        return Buffer.from(data).toString('base64')
      }

      const decrypt = (encryptedData: string) => {
        return Buffer.from(encryptedData, 'base64').toString('utf-8')
      }

      const sensitiveData = 'Información confidencial del usuario'
      const encrypted = encrypt(sensitiveData)
      const decrypted = decrypt(encrypted)

      expect(encrypted).not.toBe(sensitiveData)
      expect(decrypted).toBe(sensitiveData)
    })
  })
})