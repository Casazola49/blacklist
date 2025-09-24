import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EscrowService } from '../escrow'
import { QRGenerator } from '../qrGenerator'
import type { TransaccionEscrow } from '../../types'

// Mock Firebase
vi.mock('./firebase', () => ({
  db: {}
}))

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
    fromDate: vi.fn((date) => ({ toDate: () => date }))
  }
}))

describe('EscrowService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Commission Calculations', () => {
    it('should calculate 15% commission correctly', () => {
      expect(EscrowService.calculateCommission(100)).toBe(15)
      expect(EscrowService.calculateCommission(200)).toBe(30)
      expect(EscrowService.calculateCommission(150.50)).toBe(22.58)
    })

    it('should calculate specialist payout correctly', () => {
      expect(EscrowService.calculateSpecialistPayout(100)).toBe(85)
      expect(EscrowService.calculateSpecialistPayout(200)).toBe(170)
      expect(EscrowService.calculateSpecialistPayout(150.50)).toBe(127.92)
    })

    it('should handle edge cases in calculations', () => {
      expect(EscrowService.calculateCommission(0)).toBe(0)
      expect(EscrowService.calculateSpecialistPayout(0)).toBe(0)
      expect(EscrowService.calculateCommission(0.01)).toBe(0)
      expect(EscrowService.calculateSpecialistPayout(0.01)).toBe(0.01)
    })
  })

  describe('Transaction Creation', () => {
    it('should create escrow transaction with correct commission', async () => {
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'test-transaction-id' })
      const { addDoc } = await import('firebase/firestore')
      vi.mocked(addDoc).mockImplementation(mockAddDoc)

      const transactionData = {
        contratoId: 'contract-123',
        clienteId: 'client-123',
        especialistaId: 'specialist-123',
        monto: 100,
        comisionPlataforma: 15
      }

      const result = await EscrowService.createEscrowTransaction(transactionData)

      expect(result).toBe('test-transaction-id')
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...transactionData,
          estado: 'pendiente_deposito',
          comisionPlataforma: 15
        })
      )
    })
  })

  describe('State Transitions', () => {
    const mockTransaction: TransaccionEscrow = {
      id: 'test-id',
      contratoId: 'contract-123',
      clienteId: 'client-123',
      especialistaId: 'specialist-123',
      monto: 100,
      comisionPlataforma: 15,
      estado: 'pendiente_deposito'
    }

    it('should confirm deposit and update state', async () => {
      const mockUpdateDoc = vi.fn().mockResolvedValue(undefined)
      const { updateDoc } = await import('firebase/firestore')
      vi.mocked(updateDoc).mockImplementation(mockUpdateDoc)

      await EscrowService.confirmDeposit('test-id', 'REF123')

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          estado: 'fondos_retenidos',
          referenciaTransaccion: 'REF123',
          fechaDeposito: expect.any(Object)
        })
      )
    })

    it('should release funds and update state', async () => {
      const mockUpdateDoc = vi.fn().mockResolvedValue(undefined)
      const { updateDoc } = await import('firebase/firestore')
      vi.mocked(updateDoc).mockImplementation(mockUpdateDoc)

      await EscrowService.releaseFunds('test-id')

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          estado: 'liberado_especialista',
          fechaLiberacion: expect.any(Object)
        })
      )
    })

    it('should handle dispute state', async () => {
      const mockUpdateDoc = vi.fn().mockResolvedValue(undefined)
      const { updateDoc } = await import('firebase/firestore')
      vi.mocked(updateDoc).mockImplementation(mockUpdateDoc)

      await EscrowService.disputeTransaction('test-id')

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          estado: 'en_disputa'
        })
      )
    })
  })
})

describe('QRGenerator', () => {
  const mockQRData = {
    amount: 100,
    contractId: 'contract-123',
    reference: 'REF123',
    expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  }

  describe('QR Code Generation', () => {
    it('should generate valid QR code data', () => {
      const qrCode = QRGenerator.generatePaymentQR(mockQRData)
      expect(qrCode).toBeTruthy()
      expect(typeof qrCode).toBe('string')
    })

    it('should generate QR pattern with correct dimensions', () => {
      const pattern = QRGenerator.generateQRPattern('test-data', 16)
      expect(pattern).toHaveLength(16)
      expect(pattern[0]).toHaveLength(16)
      expect(pattern.every(row => row.length === 16)).toBe(true)
    })

    it('should include finder patterns in QR code', () => {
      const pattern = QRGenerator.generateQRPattern('test-data', 16)
      
      // Check top-left finder pattern
      expect(pattern[0][0]).toBe(true) // Corner should be black
      expect(pattern[0][6]).toBe(true) // Border should be black
      expect(pattern[6][0]).toBe(true) // Border should be black
      expect(pattern[3][3]).toBe(true) // Center should be black
    })
  })

  describe('QR Code Validation', () => {
    it('should validate correct QR code', () => {
      const qrCode = QRGenerator.generatePaymentQR(mockQRData)
      const validated = QRGenerator.validateQRCode(qrCode)
      
      expect(validated).toBeTruthy()
      expect(validated?.amount).toBe(mockQRData.amount)
      expect(validated?.contractId).toBe(mockQRData.contractId)
      expect(validated?.reference).toBe(mockQRData.reference)
    })

    it('should reject expired QR code', () => {
      const expiredData = {
        ...mockQRData,
        expirationDate: new Date(Date.now() - 1000) // 1 second ago
      }
      const qrCode = QRGenerator.generatePaymentQR(expiredData)
      const validated = QRGenerator.validateQRCode(qrCode)
      
      expect(validated).toBeNull()
    })

    it('should reject invalid QR code format', () => {
      const validated = QRGenerator.validateQRCode('invalid-qr-code')
      expect(validated).toBeNull()
    })
  })

  describe('Payment URL Generation', () => {
    it('should generate valid payment URL', () => {
      const url = QRGenerator.generatePaymentURL(mockQRData)
      expect(url).toContain('theblacklist://payment')
      expect(url).toContain(`amount=${mockQRData.amount}`)
      expect(url).toContain(`contract=${mockQRData.contractId}`)
      expect(url).toContain(`ref=${mockQRData.reference}`)
    })
  })

  describe('Bank Transfer Info', () => {
    it('should generate bank transfer information', () => {
      const bankInfo = QRGenerator.generateBankTransferInfo(mockQRData)
      
      expect(bankInfo.amount).toBe(mockQRData.amount)
      expect(bankInfo.reference).toBe(mockQRData.reference)
      expect(bankInfo.accountNumber).toBeTruthy()
      expect(bankInfo.routingNumber).toBeTruthy()
      expect(bankInfo.memo).toContain(mockQRData.contractId.slice(0, 8))
    })
  })
})

describe('Escrow Integration Tests', () => {
  it('should handle complete escrow flow', async () => {
    // This would be an integration test that tests the complete flow:
    // 1. Create escrow transaction
    // 2. Generate QR code
    // 3. Confirm payment
    // 4. Release funds
    // 5. Calculate final amounts
    
    const transactionData = {
      contratoId: 'contract-123',
      clienteId: 'client-123',
      especialistaId: 'specialist-123',
      monto: 100,
      comisionPlataforma: EscrowService.calculateCommission(100)
    }

    // Mock the Firebase calls
    const mockAddDoc = vi.fn().mockResolvedValue({ id: 'transaction-id' })
    const mockUpdateDoc = vi.fn().mockResolvedValue(undefined)
    const { addDoc, updateDoc } = await import('firebase/firestore')
    vi.mocked(addDoc).mockImplementation(mockAddDoc)
    vi.mocked(updateDoc).mockImplementation(mockUpdateDoc)

    // Create transaction
    const transactionId = await EscrowService.createEscrowTransaction(transactionData)
    expect(transactionId).toBe('transaction-id')

    // Confirm deposit
    await EscrowService.confirmDeposit(transactionId, 'PAYMENT_REF_123')
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        estado: 'fondos_retenidos',
        referenciaTransaccion: 'PAYMENT_REF_123'
      })
    )

    // Release funds
    await EscrowService.releaseFunds(transactionId)
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        estado: 'liberado_especialista'
      })
    )

    // Verify calculations
    expect(EscrowService.calculateSpecialistPayout(100)).toBe(85)
    expect(EscrowService.calculateCommission(100)).toBe(15)
  })
})