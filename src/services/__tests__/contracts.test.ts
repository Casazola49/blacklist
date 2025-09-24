import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ContractsService } from '../contracts'
import type { Contrato, EstadoContrato } from '../../types'

// Mock Firebase Firestore
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
    fromDate: vi.fn((date: Date) => ({ toDate: () => date }))
  }
}))

// Mock Firebase config
vi.mock('../firebase', () => ({
  db: {}
}))

describe('ContractsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createContract', () => {
    it('should create a new contract successfully', async () => {
      const contractData = {
        titulo: 'Test Contract',
        descripcion: 'Test description',
        fechaLimite: new Date(),
        tipoServicio: 'realizacion' as const,
        presupuestoSugerido: 100
      }

      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'contract123' })
      const { addDoc } = await import('firebase/firestore')
      vi.mocked(addDoc).mockImplementation(mockAddDoc)

      const contractId = await ContractsService.createContract('client123', contractData)

      expect(contractId).toBe('contract123')
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          clienteId: 'client123',
          titulo: 'Test Contract',
          descripcion: 'Test description',
          estado: 'abierto',
          propuestas: []
        })
      )
    })

    it('should handle contract creation errors', async () => {
      const contractData = {
        titulo: 'Test Contract',
        descripcion: 'Test description',
        fechaLimite: new Date(),
        tipoServicio: 'realizacion' as const,
        presupuestoSugerido: 100
      }

      const { addDoc } = await import('firebase/firestore')
      vi.mocked(addDoc).mockRejectedValue(new Error('Creation failed'))

      await expect(
        ContractsService.createContract('client123', contractData)
      ).rejects.toThrow('Creation failed')
    })
  })

  describe('getContract', () => {
    it('should get contract successfully', async () => {
      const mockContractData = {
        id: 'contract123',
        clienteId: 'client123',
        titulo: 'Test Contract',
        estado: 'abierto',
        fechaCreacion: { toDate: () => new Date() }
      }

      const mockDoc = {
        exists: () => true,
        id: 'contract123',
        data: () => mockContractData
      }

      const { getDoc } = await import('firebase/firestore')
      vi.mocked(getDoc).mockResolvedValue(mockDoc as any)

      const contract = await ContractsService.getContract('contract123')

      expect(contract).toEqual(expect.objectContaining({
        id: 'contract123',
        clienteId: 'client123',
        titulo: 'Test Contract',
        estado: 'abierto'
      }))
    })

    it('should return null if contract does not exist', async () => {
      const mockDoc = {
        exists: () => false
      }

      const { getDoc } = await import('firebase/firestore')
      vi.mocked(getDoc).mockResolvedValue(mockDoc as any)

      const contract = await ContractsService.getContract('nonexistent')

      expect(contract).toBeNull()
    })
  })

  describe('updateContractStatus', () => {
    it('should update contract status successfully', async () => {
      const { updateDoc } = await import('firebase/firestore')
      vi.mocked(updateDoc).mockResolvedValue(undefined)

      await ContractsService.updateContractStatus('contract123', 'asignado')

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          estado: 'asignado'
        })
      )
    })

    it('should update assignment date when status is asignado', async () => {
      const { updateDoc } = await import('firebase/firestore')
      vi.mocked(updateDoc).mockResolvedValue(undefined)

      await ContractsService.updateContractStatus('contract123', 'asignado')

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          estado: 'asignado',
          fechaAsignacion: expect.any(Object)
        })
      )
    })

    it('should update completion date when status is completado', async () => {
      const { updateDoc } = await import('firebase/firestore')
      vi.mocked(updateDoc).mockResolvedValue(undefined)

      await ContractsService.updateContractStatus('contract123', 'completado')

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          estado: 'completado',
          fechaCompletado: expect.any(Object)
        })
      )
    })
  })

  describe('assignSpecialist', () => {
    it('should assign specialist to contract', async () => {
      const { updateDoc } = await import('firebase/firestore')
      vi.mocked(updateDoc).mockResolvedValue(undefined)

      await ContractsService.assignSpecialist('contract123', 'specialist123', 150)

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          especialistaId: 'specialist123',
          precioFinal: 150,
          estado: 'esperando_deposito',
          fechaAsignacion: expect.any(Object)
        })
      )
    })
  })

  describe('getClientContracts', () => {
    it('should get client contracts successfully', async () => {
      const mockContracts = [
        {
          id: 'contract1',
          clienteId: 'client123',
          titulo: 'Contract 1',
          estado: 'abierto',
          fechaCreacion: { toDate: () => new Date() }
        },
        {
          id: 'contract2',
          clienteId: 'client123',
          titulo: 'Contract 2',
          estado: 'completado',
          fechaCreacion: { toDate: () => new Date() }
        }
      ]

      const mockQuerySnapshot = {
        docs: mockContracts.map(contract => ({
          id: contract.id,
          data: () => contract
        }))
      }

      const { getDocs } = await import('firebase/firestore')
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any)

      const contracts = await ContractsService.getClientContracts('client123')

      expect(contracts).toHaveLength(2)
      expect(contracts[0]).toEqual(expect.objectContaining({
        id: 'contract1',
        titulo: 'Contract 1'
      }))
    })
  })

  describe('getSpecialistContracts', () => {
    it('should get specialist contracts successfully', async () => {
      const mockContracts = [
        {
          id: 'contract1',
          especialistaId: 'specialist123',
          titulo: 'Contract 1',
          estado: 'asignado',
          fechaCreacion: { toDate: () => new Date() }
        }
      ]

      const mockQuerySnapshot = {
        docs: mockContracts.map(contract => ({
          id: contract.id,
          data: () => contract
        }))
      }

      const { getDocs } = await import('firebase/firestore')
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any)

      const contracts = await ContractsService.getSpecialistContracts('specialist123')

      expect(contracts).toHaveLength(1)
      expect(contracts[0]).toEqual(expect.objectContaining({
        id: 'contract1',
        especialistaId: 'specialist123'
      }))
    })
  })

  describe('getOpenContracts', () => {
    it('should get open contracts for specialist skills', async () => {
      const mockContracts = [
        {
          id: 'contract1',
          titulo: 'JavaScript Project',
          estado: 'abierto',
          habilidadesRequeridas: ['JavaScript', 'Vue.js'],
          fechaCreacion: { toDate: () => new Date() }
        }
      ]

      const mockQuerySnapshot = {
        docs: mockContracts.map(contract => ({
          id: contract.id,
          data: () => contract
        }))
      }

      const { getDocs } = await import('firebase/firestore')
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any)

      const contracts = await ContractsService.getOpenContracts(['JavaScript', 'Vue.js'])

      expect(contracts).toHaveLength(1)
      expect(contracts[0]).toEqual(expect.objectContaining({
        id: 'contract1',
        titulo: 'JavaScript Project'
      }))
    })
  })

  describe('subscribeToContractUpdates', () => {
    it('should subscribe to contract updates', () => {
      const mockCallback = vi.fn()
      const mockUnsubscribe = vi.fn()

      const { onSnapshot } = await import('firebase/firestore')
      vi.mocked(onSnapshot).mockReturnValue(mockUnsubscribe)

      const unsubscribe = ContractsService.subscribeToContractUpdates('contract123', mockCallback)

      expect(onSnapshot).toHaveBeenCalled()
      expect(unsubscribe).toBe(mockUnsubscribe)
    })
  })
})