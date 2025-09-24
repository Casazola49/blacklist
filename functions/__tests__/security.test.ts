import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Firebase Admin
vi.mock('firebase-admin', () => ({
  initializeApp: vi.fn(),
  firestore: vi.fn(() => ({
    collection: vi.fn(),
    doc: vi.fn(),
    batch: vi.fn()
  })),
  auth: vi.fn(() => ({
    verifyIdToken: vi.fn(),
    setCustomUserClaims: vi.fn()
  }))
}))

// Mock Firebase Functions
vi.mock('firebase-functions', () => ({
  https: {
    onCall: vi.fn(),
    onRequest: vi.fn()
  },
  firestore: {
    document: vi.fn(() => ({
      onCreate: vi.fn(),
      onUpdate: vi.fn(),
      onDelete: vi.fn()
    }))
  },
  auth: {
    user: vi.fn(() => ({
      onCreate: vi.fn(),
      onDelete: vi.fn()
    }))
  }
}))

describe('Cloud Functions Security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication Validation', () => {
    it('should validate user authentication in callable functions', async () => {
      const { validateAuthentication } = await import('../src/utils/auth')
      
      // Mock authenticated context
      const authenticatedContext = {
        auth: {
          uid: 'user123',
          token: {
            email: 'user@example.com',
            email_verified: true
          }
        }
      }

      const result = validateAuthentication(authenticatedContext)
      expect(result.isValid).toBe(true)
      expect(result.uid).toBe('user123')
    })

    it('should reject unauthenticated requests', async () => {
      const { validateAuthentication } = await import('../src/utils/auth')
      
      const unauthenticatedContext = {
        auth: null
      }

      const result = validateAuthentication(unauthenticatedContext)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('unauthenticated')
    })

    it('should validate admin privileges', async () => {
      const { validateAdminAccess } = await import('../src/utils/auth')
      
      const adminContext = {
        auth: {
          uid: 'admin123',
          token: {
            admin: true,
            email_verified: true
          }
        }
      }

      const result = validateAdminAccess(adminContext)
      expect(result.isAdmin).toBe(true)
    })

    it('should reject non-admin access to admin functions', async () => {
      const { validateAdminAccess } = await import('../src/utils/auth')
      
      const userContext = {
        auth: {
          uid: 'user123',
          token: {
            admin: false,
            email_verified: true
          }
        }
      }

      const result = validateAdminAccess(userContext)
      expect(result.isAdmin).toBe(false)
      expect(result.error).toBe('insufficient-permissions')
    })
  })

  describe('Input Validation and Sanitization', () => {
    it('should validate contract creation data', async () => {
      const { validateContractData } = await import('../src/utils/validation')
      
      const validContractData = {
        titulo: 'Valid Contract Title',
        descripcion: 'This is a valid contract description with sufficient detail.',
        fechaLimite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tipoServicio: 'realizacion',
        presupuestoSugerido: 150
      }

      const result = validateContractData(validContractData)
      expect(result.isValid).toBe(true)
    })

    it('should reject invalid contract data', async () => {
      const { validateContractData } = await import('../src/utils/validation')
      
      const invalidContractData = {
        titulo: 'ab', // Too short
        descripcion: '', // Empty
        fechaLimite: new Date(Date.now() - 24 * 60 * 60 * 1000), // Past date
        tipoServicio: 'invalid_type',
        presupuestoSugerido: -50 // Negative
      }

      const result = validateContractData(invalidContractData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('titulo-too-short')
      expect(result.errors).toContain('descripcion-empty')
      expect(result.errors).toContain('fecha-limite-past')
      expect(result.errors).toContain('tipo-servicio-invalid')
      expect(result.errors).toContain('presupuesto-negative')
    })

    it('should sanitize user input', async () => {
      const { sanitizeInput } = await import('../src/utils/validation')
      
      const maliciousInput = {
        titulo: '<script>alert("xss")</script>Legitimate Title',
        descripcion: 'Normal text with <img src="x" onerror="alert(1)"> malicious content',
        mensaje: 'SELECT * FROM users; DROP TABLE users;'
      }

      const sanitized = sanitizeInput(maliciousInput)
      
      expect(sanitized.titulo).not.toContain('<script>')
      expect(sanitized.titulo).toContain('Legitimate Title')
      expect(sanitized.descripcion).not.toContain('<img')
      expect(sanitized.descripcion).toContain('Normal text with')
      expect(sanitized.mensaje).not.toContain('DROP TABLE')
    })

    it('should validate file uploads', async () => {
      const { validateFileUpload } = await import('../src/utils/validation')
      
      const validFile = {
        name: 'document.pdf',
        size: 5 * 1024 * 1024, // 5MB
        type: 'application/pdf'
      }

      const result = validateFileUpload(validFile)
      expect(result.isValid).toBe(true)
    })

    it('should reject dangerous file uploads', async () => {
      const { validateFileUpload } = await import('../src/utils/validation')
      
      const dangerousFile = {
        name: 'malware.exe',
        size: 50 * 1024 * 1024, // 50MB - too large
        type: 'application/x-executable'
      }

      const result = validateFileUpload(dangerousFile)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('file-type-not-allowed')
      expect(result.errors).toContain('file-size-too-large')
    })
  })

  describe('Rate Limiting', () => {
    it('should implement rate limiting for contract creation', async () => {
      const { checkRateLimit } = await import('../src/utils/rateLimiting')
      
      const userId = 'user123'
      const action = 'create-contract'
      
      // First request should be allowed
      const firstRequest = await checkRateLimit(userId, action)
      expect(firstRequest.allowed).toBe(true)
      
      // Simulate multiple rapid requests
      const rapidRequests = await Promise.all([
        checkRateLimit(userId, action),
        checkRateLimit(userId, action),
        checkRateLimit(userId, action),
        checkRateLimit(userId, action),
        checkRateLimit(userId, action)
      ])
      
      // Some requests should be rate limited
      const blockedRequests = rapidRequests.filter(req => !req.allowed)
      expect(blockedRequests.length).toBeGreaterThan(0)
    })

    it('should implement different limits for different actions', async () => {
      const { checkRateLimit } = await import('../src/utils/rateLimiting')
      
      const userId = 'user123'
      
      // Contract creation should have stricter limits
      const contractLimit = await checkRateLimit(userId, 'create-contract')
      
      // Message sending should have more lenient limits
      const messageLimit = await checkRateLimit(userId, 'send-message')
      
      expect(contractLimit.limit).toBeLessThan(messageLimit.limit)
    })

    it('should reset rate limits after time window', async () => {
      const { checkRateLimit, resetRateLimit } = await import('../src/utils/rateLimiting')
      
      const userId = 'user123'
      const action = 'create-contract'
      
      // Exhaust rate limit
      for (let i = 0; i < 10; i++) {
        await checkRateLimit(userId, action)
      }
      
      const blockedRequest = await checkRateLimit(userId, action)
      expect(blockedRequest.allowed).toBe(false)
      
      // Reset rate limit (simulating time passage)
      await resetRateLimit(userId, action)
      
      const allowedRequest = await checkRateLimit(userId, action)
      expect(allowedRequest.allowed).toBe(true)
    })
  })

  describe('Data Access Control', () => {
    it('should enforce user data isolation', async () => {
      const { checkDataAccess } = await import('../src/utils/dataAccess')
      
      const requestingUser = 'user123'
      const targetResource = {
        type: 'user-profile',
        ownerId: 'user123'
      }
      
      const access = checkDataAccess(requestingUser, targetResource)
      expect(access.allowed).toBe(true)
    })

    it('should deny access to other users data', async () => {
      const { checkDataAccess } = await import('../src/utils/dataAccess')
      
      const requestingUser = 'user123'
      const targetResource = {
        type: 'user-profile',
        ownerId: 'user456'
      }
      
      const access = checkDataAccess(requestingUser, targetResource)
      expect(access.allowed).toBe(false)
      expect(access.reason).toBe('unauthorized-access')
    })

    it('should allow contract parties to access contract data', async () => {
      const { checkDataAccess } = await import('../src/utils/dataAccess')
      
      const requestingUser = 'specialist123'
      const targetResource = {
        type: 'contract',
        clienteId: 'client456',
        especialistaId: 'specialist123'
      }
      
      const access = checkDataAccess(requestingUser, targetResource)
      expect(access.allowed).toBe(true)
    })

    it('should deny third party access to contract data', async () => {
      const { checkDataAccess } = await import('../src/utils/dataAccess')
      
      const requestingUser = 'outsider789'
      const targetResource = {
        type: 'contract',
        clienteId: 'client456',
        especialistaId: 'specialist123'
      }
      
      const access = checkDataAccess(requestingUser, targetResource)
      expect(access.allowed).toBe(false)
    })
  })

  describe('Escrow Security', () => {
    it('should validate escrow transaction creation', async () => {
      const { validateEscrowTransaction } = await import('../src/utils/escrowSecurity')
      
      const validTransaction = {
        contratoId: 'contract123',
        clienteId: 'client456',
        especialistaId: 'specialist789',
        monto: 150,
        comisionPlataforma: 22.5 // 15% of 150
      }
      
      const validation = validateEscrowTransaction(validTransaction)
      expect(validation.isValid).toBe(true)
    })

    it('should detect escrow manipulation attempts', async () => {
      const { validateEscrowTransaction } = await import('../src/utils/escrowSecurity')
      
      const manipulatedTransaction = {
        contratoId: 'contract123',
        clienteId: 'client456',
        especialistaId: 'specialist789',
        monto: 150,
        comisionPlataforma: 1 // Manipulated commission
      }
      
      const validation = validateEscrowTransaction(manipulatedTransaction)
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('invalid-commission')
    })

    it('should prevent unauthorized fund releases', async () => {
      const { validateFundRelease } = await import('../src/utils/escrowSecurity')
      
      const unauthorizedRelease = {
        transactionId: 'tx123',
        requestingUser: 'hacker456',
        contractData: {
          clienteId: 'client123',
          especialistaId: 'specialist789',
          estado: 'fondos_garantia'
        }
      }
      
      const validation = validateFundRelease(unauthorizedRelease)
      expect(validation.allowed).toBe(false)
      expect(validation.reason).toBe('unauthorized-user')
    })

    it('should validate payment confirmations', async () => {
      const { validatePaymentConfirmation } = await import('../src/utils/escrowSecurity')
      
      const validPayment = {
        transactionId: 'tx123',
        paymentReference: 'pay_abc123',
        amount: 150,
        currency: 'USD',
        timestamp: new Date()
      }
      
      const validation = validatePaymentConfirmation(validPayment)
      expect(validation.isValid).toBe(true)
    })
  })

  describe('Audit Logging', () => {
    it('should log sensitive operations', async () => {
      const { logAuditEvent } = await import('../src/utils/audit')
      
      const auditEvent = {
        action: 'escrow-release',
        userId: 'client123',
        resourceId: 'tx456',
        metadata: {
          amount: 150,
          recipient: 'specialist789'
        },
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...'
      }
      
      const result = await logAuditEvent(auditEvent)
      expect(result.logged).toBe(true)
      expect(result.auditId).toBeDefined()
    })

    it('should detect suspicious activity patterns', async () => {
      const { detectSuspiciousActivity } = await import('../src/utils/audit')
      
      const activities = [
        { userId: 'user123', action: 'login', timestamp: new Date(Date.now() - 1000) },
        { userId: 'user123', action: 'create-contract', timestamp: new Date(Date.now() - 500) },
        { userId: 'user123', action: 'create-contract', timestamp: new Date(Date.now() - 400) },
        { userId: 'user123', action: 'create-contract', timestamp: new Date(Date.now() - 300) },
        { userId: 'user123', action: 'create-contract', timestamp: new Date() }
      ]
      
      const analysis = detectSuspiciousActivity(activities)
      expect(analysis.isSuspicious).toBe(true)
      expect(analysis.patterns).toContain('rapid-contract-creation')
    })

    it('should alert on security violations', async () => {
      const { handleSecurityViolation } = await import('../src/utils/audit')
      
      const violation = {
        type: 'unauthorized-access-attempt',
        userId: 'user123',
        targetResource: 'admin-panel',
        severity: 'high',
        timestamp: new Date()
      }
      
      const response = await handleSecurityViolation(violation)
      expect(response.alertSent).toBe(true)
      expect(response.userSuspended).toBe(true) // High severity violations
    })
  })

  describe('Error Handling and Information Disclosure', () => {
    it('should not leak sensitive information in errors', async () => {
      const { sanitizeError } = await import('../src/utils/errorHandling')
      
      const sensitiveError = new Error('Database connection failed: user=admin, password=secret123, host=internal-db.company.com')
      
      const sanitized = sanitizeError(sensitiveError)
      expect(sanitized.message).not.toContain('password=secret123')
      expect(sanitized.message).not.toContain('internal-db.company.com')
      expect(sanitized.message).toContain('Database connection failed')
    })

    it('should provide appropriate error codes without details', async () => {
      const { createUserFriendlyError } = await import('../src/utils/errorHandling')
      
      const internalError = new Error('SQL injection detected in query: SELECT * FROM users WHERE id = 1; DROP TABLE users;')
      
      const userError = createUserFriendlyError(internalError, 'validation-failed')
      expect(userError.code).toBe('validation-failed')
      expect(userError.message).toBe('Invalid input provided')
      expect(userError.message).not.toContain('SQL injection')
      expect(userError.message).not.toContain('DROP TABLE')
    })
  })

  describe('Environment and Configuration Security', () => {
    it('should validate environment configuration', async () => {
      const { validateEnvironment } = await import('../src/utils/environment')
      
      const mockEnv = {
        NODE_ENV: 'production',
        FIREBASE_PROJECT_ID: 'production-project',
        STRIPE_SECRET_KEY: 'sk_live_...',
        ADMIN_EMAIL: 'admin@company.com'
      }
      
      const validation = validateEnvironment(mockEnv)
      expect(validation.isValid).toBe(true)
      expect(validation.environment).toBe('production')
    })

    it('should detect insecure configuration', async () => {
      const { validateEnvironment } = await import('../src/utils/environment')
      
      const insecureEnv = {
        NODE_ENV: 'production',
        FIREBASE_PROJECT_ID: 'test-project', // Test project in production
        STRIPE_SECRET_KEY: 'sk_test_...', // Test key in production
        DEBUG: 'true' // Debug enabled in production
      }
      
      const validation = validateEnvironment(insecureEnv)
      expect(validation.isValid).toBe(false)
      expect(validation.warnings).toContain('test-keys-in-production')
      expect(validation.warnings).toContain('debug-enabled-in-production')
    })
  })
})