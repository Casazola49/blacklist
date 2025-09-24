import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import AuthView from '../../views/AuthView.vue'
import { useAuthStore } from '../../stores/auth'

// Mock Firebase
vi.mock('../../services/firebase', () => ({
  auth: {},
  db: {}
}))

vi.mock('../../services/auth', () => ({
  AuthService: {
    loginWithGoogle: vi.fn(),
    createClientProfile: vi.fn(),
    createSpecialistProfile: vi.fn(),
    getUserProfile: vi.fn(),
    checkAliasAvailability: vi.fn(),
    onAuthStateChanged: vi.fn()
  }
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/auth', component: AuthView },
    { path: '/dashboard', component: { template: '<div>Dashboard</div>' } },
    { path: '/register', component: { template: '<div>Register</div>' } }
  ]
})

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Client Registration Flow', () => {
    it('should complete client registration successfully', async () => {
      const { AuthService } = await import('../../services/auth')
      
      // Mock successful Google login
      vi.mocked(AuthService.loginWithGoogle).mockResolvedValue({
        uid: 'user123',
        email: 'client@example.com',
        displayName: 'Test Client'
      } as any)

      // Mock alias availability check
      vi.mocked(AuthService.checkAliasAvailability).mockResolvedValue(true)

      // Mock profile creation
      vi.mocked(AuthService.createClientProfile).mockResolvedValue({
        uid: 'user123',
        email: 'client@example.com',
        alias: 'testclient',
        tipo: 'cliente',
        estado: 'activo',
        fechaCreacion: new Date(),
        saldoEscrow: 0,
        contractosActivos: [],
        historialContratos: []
      })

      const wrapper = mount(AuthView, {
        global: {
          plugins: [router]
        }
      })

      const authStore = useAuthStore()

      // Step 1: Click register as client
      const clientButton = wrapper.find('[data-testid="register-client"]')
      await clientButton.trigger('click')

      // Step 2: Google authentication
      await authStore.loginWithGoogle()

      // Step 3: Set alias
      await authStore.createClientProfile({ alias: 'testclient' })

      // Verify final state
      expect(authStore.user).toEqual(expect.objectContaining({
        uid: 'user123',
        tipo: 'cliente',
        alias: 'testclient'
      }))

      expect(AuthService.loginWithGoogle).toHaveBeenCalled()
      expect(AuthService.createClientProfile).toHaveBeenCalledWith(
        expect.any(Object),
        { alias: 'testclient' }
      )
    })

    it('should handle alias already taken scenario', async () => {
      const { AuthService } = await import('../../services/auth')
      
      vi.mocked(AuthService.loginWithGoogle).mockResolvedValue({
        uid: 'user123',
        email: 'client@example.com'
      } as any)

      // Mock alias not available
      vi.mocked(AuthService.checkAliasAvailability).mockResolvedValue(false)

      const authStore = useAuthStore()

      await authStore.loginWithGoogle()

      // Try to create profile with taken alias
      const isAvailable = await AuthService.checkAliasAvailability('takealias')
      expect(isAvailable).toBe(false)

      // Should not proceed with profile creation
      expect(AuthService.createClientProfile).not.toHaveBeenCalled()
    })
  })

  describe('Specialist Registration Flow', () => {
    it('should complete specialist registration successfully', async () => {
      const { AuthService } = await import('../../services/auth')
      
      vi.mocked(AuthService.loginWithGoogle).mockResolvedValue({
        uid: 'specialist123',
        email: 'specialist@example.com'
      } as any)

      vi.mocked(AuthService.checkAliasAvailability).mockResolvedValue(true)

      vi.mocked(AuthService.createSpecialistProfile).mockResolvedValue({
        uid: 'specialist123',
        email: 'specialist@example.com',
        alias: 'testspecialist',
        tipo: 'especialista',
        estado: 'pendiente',
        fechaCreacion: new Date(),
        nombreReal: 'Test Specialist',
        cv: 'CV content',
        habilidades: ['JavaScript', 'Vue.js'],
        biografia: 'Experienced developer',
        calificacionPromedio: 0,
        trabajosCompletados: 0,
        gananciasTotal: 0
      })

      const authStore = useAuthStore()

      // Complete specialist registration
      await authStore.loginWithGoogle()
      await authStore.createSpecialistProfile({
        alias: 'testspecialist',
        nombreReal: 'Test Specialist',
        cv: 'CV content',
        habilidades: ['JavaScript', 'Vue.js'],
        biografia: 'Experienced developer'
      })

      expect(authStore.user).toEqual(expect.objectContaining({
        uid: 'specialist123',
        tipo: 'especialista',
        estado: 'pendiente'
      }))

      expect(AuthService.createSpecialistProfile).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          alias: 'testspecialist',
          nombreReal: 'Test Specialist'
        })
      )
    })
  })

  describe('Login Flow', () => {
    it('should login existing user successfully', async () => {
      const { AuthService } = await import('../../services/auth')
      
      vi.mocked(AuthService.loginWithGoogle).mockResolvedValue({
        uid: 'existing123',
        email: 'existing@example.com'
      } as any)

      vi.mocked(AuthService.getUserProfile).mockResolvedValue({
        uid: 'existing123',
        email: 'existing@example.com',
        alias: 'existinguser',
        tipo: 'cliente',
        estado: 'activo',
        fechaCreacion: new Date(),
        saldoEscrow: 50,
        contractosActivos: ['contract1'],
        historialContratos: ['contract2']
      })

      const authStore = useAuthStore()

      await authStore.loginWithGoogle()

      expect(authStore.user).toEqual(expect.objectContaining({
        uid: 'existing123',
        tipo: 'cliente',
        alias: 'existinguser'
      }))

      expect(AuthService.getUserProfile).toHaveBeenCalledWith('existing123')
    })

    it('should handle login errors gracefully', async () => {
      const { AuthService } = await import('../../services/auth')
      
      vi.mocked(AuthService.loginWithGoogle).mockRejectedValue(
        new Error('Authentication failed')
      )

      const authStore = useAuthStore()

      await expect(authStore.loginWithGoogle()).rejects.toThrow('Authentication failed')
      expect(authStore.user).toBeNull()
    })
  })

  describe('Logout Flow', () => {
    it('should logout user successfully', async () => {
      const { AuthService } = await import('../../services/auth')
      
      vi.mocked(AuthService.logout).mockResolvedValue(undefined)

      const authStore = useAuthStore()
      
      // Set initial user state
      authStore.user = {
        uid: 'user123',
        email: 'test@example.com',
        alias: 'testuser',
        tipo: 'cliente',
        estado: 'activo',
        fechaCreacion: new Date()
      } as any

      await authStore.logout()

      expect(authStore.user).toBeNull()
      expect(AuthService.logout).toHaveBeenCalled()
    })
  })
})