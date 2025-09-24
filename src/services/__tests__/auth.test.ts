import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthService } from '../auth'
import type { Usuario, Cliente, Especialista } from '../../types'

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  getAuth: vi.fn(() => ({
    currentUser: null
  }))
}))

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() }))
  }
}))

// Mock Firebase config
vi.mock('../firebase', () => ({
  auth: {},
  db: {}
}))

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loginWithGoogle', () => {
    it('should login successfully with Google', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User'
      }

      const mockUserCredential = {
        user: mockUser
      }

      const { signInWithPopup } = await import('firebase/auth')
      vi.mocked(signInWithPopup).mockResolvedValue(mockUserCredential as any)

      const result = await AuthService.loginWithGoogle()

      expect(result).toEqual(mockUser)
      expect(signInWithPopup).toHaveBeenCalled()
    })

    it('should handle login errors', async () => {
      const { signInWithPopup } = await import('firebase/auth')
      vi.mocked(signInWithPopup).mockRejectedValue(new Error('Login failed'))

      await expect(AuthService.loginWithGoogle()).rejects.toThrow('Login failed')
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      const { signOut } = await import('firebase/auth')
      vi.mocked(signOut).mockResolvedValue(undefined)

      await AuthService.logout()

      expect(signOut).toHaveBeenCalled()
    })

    it('should handle logout errors', async () => {
      const { signOut } = await import('firebase/auth')
      vi.mocked(signOut).mockRejectedValue(new Error('Logout failed'))

      await expect(AuthService.logout()).rejects.toThrow('Logout failed')
    })
  })

  describe('createClientProfile', () => {
    it('should create client profile successfully', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'client@example.com'
      }

      const clientData = {
        alias: 'testclient'
      }

      const { setDoc } = await import('firebase/firestore')
      vi.mocked(setDoc).mockResolvedValue(undefined)

      const result = await AuthService.createClientProfile(mockUser as any, clientData)

      expect(result).toEqual(expect.objectContaining({
        uid: 'user123',
        email: 'client@example.com',
        alias: 'testclient',
        tipo: 'cliente',
        estado: 'activo'
      }))

      expect(setDoc).toHaveBeenCalled()
    })
  })

  describe('createSpecialistProfile', () => {
    it('should create specialist profile successfully', async () => {
      const mockUser = {
        uid: 'specialist123',
        email: 'specialist@example.com'
      }

      const specialistData = {
        alias: 'testspecialist',
        nombreReal: 'Test Specialist',
        cv: 'CV content',
        habilidades: ['JavaScript', 'Vue.js'],
        biografia: 'Experienced developer'
      }

      const { setDoc } = await import('firebase/firestore')
      vi.mocked(setDoc).mockResolvedValue(undefined)

      const result = await AuthService.createSpecialistProfile(mockUser as any, specialistData)

      expect(result).toEqual(expect.objectContaining({
        uid: 'specialist123',
        email: 'specialist@example.com',
        alias: 'testspecialist',
        tipo: 'especialista',
        estado: 'pendiente'
      }))

      expect(setDoc).toHaveBeenCalled()
    })
  })

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      const mockUserData = {
        uid: 'user123',
        email: 'test@example.com',
        alias: 'testuser',
        tipo: 'cliente',
        estado: 'activo'
      }

      const mockDoc = {
        exists: () => true,
        data: () => mockUserData
      }

      const { getDoc } = await import('firebase/firestore')
      vi.mocked(getDoc).mockResolvedValue(mockDoc as any)

      const result = await AuthService.getUserProfile('user123')

      expect(result).toEqual(mockUserData)
    })

    it('should return null if user profile does not exist', async () => {
      const mockDoc = {
        exists: () => false
      }

      const { getDoc } = await import('firebase/firestore')
      vi.mocked(getDoc).mockResolvedValue(mockDoc as any)

      const result = await AuthService.getUserProfile('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const updates = {
        alias: 'newalias',
        biografia: 'Updated bio'
      }

      const { updateDoc } = await import('firebase/firestore')
      vi.mocked(updateDoc).mockResolvedValue(undefined)

      await AuthService.updateUserProfile('user123', updates)

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        updates
      )
    })
  })

  describe('checkAliasAvailability', () => {
    it('should return true if alias is available', async () => {
      const mockQuerySnapshot = {
        empty: true
      }

      const { getDocs } = await import('firebase/firestore')
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any)

      const result = await AuthService.checkAliasAvailability('availablealias')

      expect(result).toBe(true)
    })

    it('should return false if alias is taken', async () => {
      const mockQuerySnapshot = {
        empty: false
      }

      const { getDocs } = await import('firebase/firestore')
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any)

      const result = await AuthService.checkAliasAvailability('takenalias')

      expect(result).toBe(false)
    })
  })

  describe('onAuthStateChanged', () => {
    it('should set up auth state listener', () => {
      const mockCallback = vi.fn()
      const mockUnsubscribe = vi.fn()

      const { onAuthStateChanged } = await import('firebase/auth')
      vi.mocked(onAuthStateChanged).mockReturnValue(mockUnsubscribe)

      const unsubscribe = AuthService.onAuthStateChanged(mockCallback)

      expect(onAuthStateChanged).toHaveBeenCalledWith(
        expect.anything(),
        mockCallback
      )
      expect(unsubscribe).toBe(mockUnsubscribe)
    })
  })
})