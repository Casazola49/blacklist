import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ChatService } from '../chat'
import type { Chat, Mensaje } from '../../types'

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
  storage: {}
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
    fromDate: vi.fn((date: Date) => ({ toDate: () => date }))
  },
  writeBatch: vi.fn(),
  arrayUnion: vi.fn()
}))

// Mock Firebase Storage functions
vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn()
}))

describe('ChatService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createChat', () => {
    it('should create a new chat with participants', async () => {
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'chat123' })
      const { addDoc } = await import('firebase/firestore')
      vi.mocked(addDoc).mockImplementation(mockAddDoc)

      const contractId = 'contract123'
      const participants = ['user1', 'user2']

      const chatId = await ChatService.createChat(contractId, participants)

      expect(chatId).toBe('chat123')
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          contratoId: contractId,
          participantes: participants,
          estado: 'activo'
        })
      )
    })

    it('should send initial system message after creating chat', async () => {
      const mockAddDoc = vi.fn()
        .mockResolvedValueOnce({ id: 'chat123' }) // First call for chat creation
        .mockResolvedValueOnce({ id: 'message123' }) // Second call for system message
      
      const { addDoc } = await import('firebase/firestore')
      vi.mocked(addDoc).mockImplementation(mockAddDoc)

      await ChatService.createChat('contract123', ['user1', 'user2'])

      expect(mockAddDoc).toHaveBeenCalledTimes(2)
      expect(mockAddDoc).toHaveBeenNthCalledWith(2,
        expect.anything(),
        expect.objectContaining({
          chatId: 'chat123',
          autorId: 'system',
          tipo: 'sistema',
          contenido: 'Chat iniciado. Pueden comenzar a comunicarse de forma segura.'
        })
      )
    })
  })

  describe('sendMessage', () => {
    it('should send a text message', async () => {
      const mockAddDoc = vi.fn()
        .mockResolvedValueOnce({ id: 'message123' }) // Message creation
        .mockResolvedValueOnce({ id: 'audit123' }) // Audit log
      
      const { addDoc } = await import('firebase/firestore')
      vi.mocked(addDoc).mockImplementation(mockAddDoc)

      const messageId = await ChatService.sendMessage('chat123', 'user1', 'Hello world')

      expect(messageId).toBe('message123')
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          chatId: 'chat123',
          autorId: 'user1',
          contenido: 'Hello world',
          tipo: 'texto',
          leido: false
        })
      )
    })

    it('should log message for audit', async () => {
      const mockAddDoc = vi.fn()
        .mockResolvedValueOnce({ id: 'message123' })
        .mockResolvedValueOnce({ id: 'audit123' })
      
      const { addDoc } = await import('firebase/firestore')
      vi.mocked(addDoc).mockImplementation(mockAddDoc)

      await ChatService.sendMessage('chat123', 'user1', 'Hello world')

      expect(mockAddDoc).toHaveBeenCalledTimes(2)
      expect(mockAddDoc).toHaveBeenNthCalledWith(2,
        expect.anything(),
        expect.objectContaining({
          chatId: 'chat123',
          autorId: 'user1',
          tipo: 'texto',
          contenido: 'Hello world'
        })
      )
    })
  })

  describe('sendFileMessage', () => {
    it('should upload file and send file message', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const mockUploadBytes = vi.fn().mockResolvedValue({ ref: 'fileRef' })
      const mockGetDownloadURL = vi.fn().mockResolvedValue('https://example.com/file.txt')
      const mockAddDoc = vi.fn()
        .mockResolvedValueOnce({ id: 'message123' })
        .mockResolvedValueOnce({ id: 'audit123' })

      const { uploadBytes, getDownloadURL } = await import('firebase/storage')
      const { addDoc } = await import('firebase/firestore')
      
      vi.mocked(uploadBytes).mockImplementation(mockUploadBytes)
      vi.mocked(getDownloadURL).mockImplementation(mockGetDownloadURL)
      vi.mocked(addDoc).mockImplementation(mockAddDoc)

      const messageId = await ChatService.sendFileMessage('chat123', 'user1', mockFile, 'Check this file')

      expect(messageId).toBe('message123')
      expect(mockUploadBytes).toHaveBeenCalled()
      expect(mockGetDownloadURL).toHaveBeenCalled()
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          chatId: 'chat123',
          autorId: 'user1',
          contenido: 'Check this file',
          tipo: 'archivo',
          archivos: [{
            nombre: 'test.txt',
            url: 'https://example.com/file.txt',
            tipo: 'text/plain',
            tamaño: mockFile.size
          }]
        })
      )
    })
  })

  describe('markMessageAsRead', () => {
    it('should mark a message as read', async () => {
      const mockUpdateDoc = vi.fn().mockResolvedValue(undefined)
      const { updateDoc } = await import('firebase/firestore')
      vi.mocked(updateDoc).mockImplementation(mockUpdateDoc)

      await ChatService.markMessageAsRead('message123')

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        { leido: true }
      )
    })
  })

  describe('markAllMessagesAsRead', () => {
    it('should mark all unread messages as read for a user', async () => {
      const mockQuerySnapshot = {
        docs: [
          { ref: 'messageRef1' },
          { ref: 'messageRef2' }
        ]
      }
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined)
      }

      const { getDocs, writeBatch } = await import('firebase/firestore')
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any)
      vi.mocked(writeBatch).mockReturnValue(mockBatch as any)

      await ChatService.markAllMessagesAsRead('chat123', 'user1')

      expect(mockBatch.update).toHaveBeenCalledTimes(2)
      expect(mockBatch.commit).toHaveBeenCalled()
    })
  })

  describe('getUnreadCount', () => {
    it('should return unread message count for a user', async () => {
      const mockQuerySnapshot = { size: 5 }
      const { getDocs } = await import('firebase/firestore')
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any)

      const count = await ChatService.getUnreadCount('chat123', 'user1')

      expect(count).toBe(5)
    })

    it('should return 0 if error occurs', async () => {
      const { getDocs } = await import('firebase/firestore')
      vi.mocked(getDocs).mockRejectedValue(new Error('Network error'))

      const count = await ChatService.getUnreadCount('chat123', 'user1')

      expect(count).toBe(0)
    })
  })

  describe('getChatByContract', () => {
    it('should return chat for a contract', async () => {
      const mockChat = {
        id: 'chat123',
        contratoId: 'contract123',
        participantes: ['user1', 'user2'],
        fechaCreacion: { toDate: () => new Date() },
        estado: 'activo'
      }
      const mockQuerySnapshot = {
        empty: false,
        docs: [{
          id: 'chat123',
          data: () => mockChat
        }]
      }

      const { getDocs } = await import('firebase/firestore')
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any)

      const chat = await ChatService.getChatByContract('contract123')

      expect(chat).toEqual(expect.objectContaining({
        id: 'chat123',
        contratoId: 'contract123',
        participantes: ['user1', 'user2'],
        estado: 'activo'
      }))
    })

    it('should return null if no chat found', async () => {
      const mockQuerySnapshot = { empty: true, docs: [] }
      const { getDocs } = await import('firebase/firestore')
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any)

      const chat = await ChatService.getChatByContract('contract123')

      expect(chat).toBeNull()
    })
  })

  describe('subscribeToMessages', () => {
    it('should subscribe to real-time message updates', async () => {
      const mockCallback = vi.fn()
      const mockUnsubscribe = vi.fn()
      const { onSnapshot } = await import('firebase/firestore')
      vi.mocked(onSnapshot).mockReturnValue(mockUnsubscribe)

      const unsubscribe = ChatService.subscribeToMessages('chat123', mockCallback)

      expect(onSnapshot).toHaveBeenCalled()
      expect(unsubscribe).toBe(mockUnsubscribe)
    })
  })

  describe('archiveChat', () => {
    it('should archive a chat', async () => {
      const mockUpdateDoc = vi.fn().mockResolvedValue(undefined)
      const { updateDoc } = await import('firebase/firestore')
      vi.mocked(updateDoc).mockImplementation(mockUpdateDoc)

      await ChatService.archiveChat('chat123')

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        { estado: 'archivado' }
      )
    })
  })
})