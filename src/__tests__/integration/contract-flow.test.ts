import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useContractsStore } from '../../stores/contracts'
import { useAuthStore } from '../../stores/auth'
import { useEscrowStore } from '../../stores/escrow'

// Mock services
vi.mock('../../services/contracts', () => ({
  ContractsService: {
    createContract: vi.fn(),
    getContract: vi.fn(),
    updateContractStatus: vi.fn(),
    assignSpecialist: vi.fn(),
    getClientContracts: vi.fn(),
    getSpecialistContracts: vi.fn(),
    getOpenContracts: vi.fn(),
    subscribeToContractUpdates: vi.fn()
  }
}))

vi.mock('../../services/proposals', () => ({
  ProposalsService: {
    sendProposal: vi.fn(),
    getContractProposals: vi.fn(),
    acceptProposal: vi.fn(),
    rejectProposal: vi.fn()
  }
}))

vi.mock('../../services/escrow', () => ({
  EscrowService: {
    createEscrowTransaction: vi.fn(),
    confirmPayment: vi.fn(),
    releasePayment: vi.fn(),
    generateQRCode: vi.fn()
  }
}))

vi.mock('../../services/chat', () => ({
  ChatService: {
    createChat: vi.fn(),
    sendMessage: vi.fn()
  }
}))

describe('Contract Flow Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Complete Contract Lifecycle', () => {
    it('should handle full contract lifecycle from creation to completion', async () => {
      const { ContractsService } = await import('../../services/contracts')
      const { ProposalsService } = await import('../../services/proposals')
      const { EscrowService } = await import('../../services/escrow')
      const { ChatService } = await import('../../services/chat')

      const contractsStore = useContractsStore()
      const authStore = useAuthStore()
      const escrowStore = useEscrowStore()

      // Setup initial user state
      authStore.user = {
        uid: 'client123',
        tipo: 'cliente',
        alias: 'testclient'
      } as any

      // Step 1: Client creates contract
      vi.mocked(ContractsService.createContract).mockResolvedValue('contract123')
      
      const contractData = {
        titulo: 'Test Project',
        descripcion: 'Need help with Vue.js project',
        fechaLimite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tipoServicio: 'realizacion' as const,
        presupuestoSugerido: 200
      }

      const contractId = await contractsStore.createContract(contractData)
      expect(contractId).toBe('contract123')
      expect(ContractsService.createContract).toHaveBeenCalledWith('client123', contractData)

      // Step 2: Specialist sends proposal
      vi.mocked(ProposalsService.sendProposal).mockResolvedValue('proposal123')
      
      const proposalData = {
        precio: 180,
        mensaje: 'I can help you with this Vue.js project'
      }

      await ProposalsService.sendProposal('contract123', 'specialist123', proposalData)
      expect(ProposalsService.sendProposal).toHaveBeenCalledWith(
        'contract123',
        'specialist123',
        proposalData
      )

      // Step 3: Client accepts proposal
      vi.mocked(ProposalsService.acceptProposal).mockResolvedValue(undefined)
      vi.mocked(ContractsService.assignSpecialist).mockResolvedValue(undefined)
      vi.mocked(EscrowService.createEscrowTransaction).mockResolvedValue('escrow123')
      vi.mocked(ChatService.createChat).mockResolvedValue('chat123')

      await contractsStore.acceptProposal('contract123', 'proposal123', 'specialist123', 180)

      expect(ProposalsService.acceptProposal).toHaveBeenCalledWith('proposal123')
      expect(ContractsService.assignSpecialist).toHaveBeenCalledWith('contract123', 'specialist123', 180)
      expect(EscrowService.createEscrowTransaction).toHaveBeenCalledWith('contract123', 180)
      expect(ChatService.createChat).toHaveBeenCalledWith('contract123', ['client123', 'specialist123'])

      // Step 4: Client makes payment
      vi.mocked(EscrowService.generateQRCode).mockResolvedValue('qr-code-data')
      vi.mocked(EscrowService.confirmPayment).mockResolvedValue(undefined)
      vi.mocked(ContractsService.updateContractStatus).mockResolvedValue(undefined)

      await escrowStore.generatePaymentQR('contract123', 180)
      await escrowStore.confirmPayment('escrow123', 'payment-ref-123')

      expect(EscrowService.generateQRCode).toHaveBeenCalledWith('contract123', 180)
      expect(EscrowService.confirmPayment).toHaveBeenCalledWith('escrow123', 'payment-ref-123')
      expect(ContractsService.updateContractStatus).toHaveBeenCalledWith('contract123', 'fondos_garantia')

      // Step 5: Specialist delivers work
      await contractsStore.updateContractStatus('contract123', 'entrega_realizada')
      expect(ContractsService.updateContractStatus).toHaveBeenCalledWith('contract123', 'entrega_realizada')

      // Step 6: Client approves and releases payment
      vi.mocked(EscrowService.releasePayment).mockResolvedValue(undefined)

      await escrowStore.releasePayment('escrow123')
      await contractsStore.updateContractStatus('contract123', 'completado')

      expect(EscrowService.releasePayment).toHaveBeenCalledWith('escrow123')
      expect(ContractsService.updateContractStatus).toHaveBeenCalledWith('contract123', 'completado')
    })
  })

  describe('Contract Creation Flow', () => {
    it('should create contract with proper validation', async () => {
      const { ContractsService } = await import('../../services/contracts')
      const contractsStore = useContractsStore()
      const authStore = useAuthStore()

      authStore.user = { uid: 'client123', tipo: 'cliente' } as any

      vi.mocked(ContractsService.createContract).mockResolvedValue('contract123')

      const contractData = {
        titulo: 'Valid Contract',
        descripcion: 'This is a valid contract description',
        fechaLimite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tipoServicio: 'realizacion' as const,
        presupuestoSugerido: 150
      }

      const contractId = await contractsStore.createContract(contractData)

      expect(contractId).toBe('contract123')
      expect(ContractsService.createContract).toHaveBeenCalledWith('client123', contractData)
    })

    it('should handle contract creation errors', async () => {
      const { ContractsService } = await import('../../services/contracts')
      const contractsStore = useContractsStore()
      const authStore = useAuthStore()

      authStore.user = { uid: 'client123', tipo: 'cliente' } as any

      vi.mocked(ContractsService.createContract).mockRejectedValue(
        new Error('Contract creation failed')
      )

      const contractData = {
        titulo: 'Failed Contract',
        descripcion: 'This contract will fail',
        fechaLimite: new Date(),
        tipoServicio: 'realizacion' as const,
        presupuestoSugerido: 100
      }

      await expect(contractsStore.createContract(contractData)).rejects.toThrow('Contract creation failed')
    })
  })

  describe('Proposal Flow', () => {
    it('should handle proposal submission and acceptance', async () => {
      const { ProposalsService } = await import('../../services/proposals')
      const contractsStore = useContractsStore()

      // Mock getting contract proposals
      vi.mocked(ProposalsService.getContractProposals).mockResolvedValue([
        {
          id: 'proposal123',
          especialistaId: 'specialist123',
          contratoId: 'contract123',
          precio: 180,
          mensaje: 'I can help with this project',
          fechaEnvio: new Date(),
          estado: 'pendiente'
        }
      ])

      const proposals = await contractsStore.getContractProposals('contract123')

      expect(proposals).toHaveLength(1)
      expect(proposals[0]).toEqual(expect.objectContaining({
        id: 'proposal123',
        precio: 180,
        estado: 'pendiente'
      }))
    })

    it('should reject proposals correctly', async () => {
      const { ProposalsService } = await import('../../services/proposals')

      vi.mocked(ProposalsService.rejectProposal).mockResolvedValue(undefined)

      await ProposalsService.rejectProposal('proposal123')

      expect(ProposalsService.rejectProposal).toHaveBeenCalledWith('proposal123')
    })
  })

  describe('Contract Status Updates', () => {
    it('should handle status transitions correctly', async () => {
      const { ContractsService } = await import('../../services/contracts')
      const contractsStore = useContractsStore()

      vi.mocked(ContractsService.updateContractStatus).mockResolvedValue(undefined)

      // Test various status transitions
      const statusTransitions = [
        'esperando_deposito',
        'fondos_garantia',
        'entrega_realizada',
        'completado'
      ] as const

      for (const status of statusTransitions) {
        await contractsStore.updateContractStatus('contract123', status)
        expect(ContractsService.updateContractStatus).toHaveBeenCalledWith('contract123', status)
      }
    })
  })

  describe('Real-time Updates', () => {
    it('should subscribe to contract updates', () => {
      const { ContractsService } = await import('../../services/contracts')
      const contractsStore = useContractsStore()

      const mockUnsubscribe = vi.fn()
      vi.mocked(ContractsService.subscribeToContractUpdates).mockReturnValue(mockUnsubscribe)

      const callback = vi.fn()
      const unsubscribe = contractsStore.subscribeToContractUpdates('contract123', callback)

      expect(ContractsService.subscribeToContractUpdates).toHaveBeenCalledWith('contract123', callback)
      expect(unsubscribe).toBe(mockUnsubscribe)
    })
  })
})