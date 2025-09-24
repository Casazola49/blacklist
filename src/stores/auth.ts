import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from 'firebase/auth'
import type { Usuario, Especialista } from '../types'
import { AuthService } from '../services/auth'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const userProfile = ref<Usuario | Especialista | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const userRole = computed(() => userProfile.value?.tipo)
  const isCliente = computed(() => userProfile.value?.tipo === 'cliente')
  const isEspecialista = computed(() => userProfile.value?.tipo === 'especialista')
  const isAdmin = computed(() => userProfile.value?.tipo === 'admin')

  // Actions
  const signInWithGoogle = async () => {
    try {
      loading.value = true
      error.value = null
      
      const firebaseUser = await AuthService.signInWithGoogle()
      if (firebaseUser) {
        user.value = firebaseUser
        // Load user profile
        const profile = await AuthService.getUserProfile(firebaseUser.uid)
        userProfile.value = profile
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error de autenticación'
      throw err
    } finally {
      loading.value = false
    }
  }

  const signOut = async () => {
    try {
      loading.value = true
      await AuthService.signOut()
      user.value = null
      userProfile.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cerrar sesión'
      throw err
    } finally {
      loading.value = false
    }
  }

  const adminLogin = async () => {
    try {
      loading.value = true
      error.value = null
      
      // First sign in with Google
      const firebaseUser = await AuthService.signInWithGoogle()
      if (firebaseUser) {
        user.value = firebaseUser
        
        // Check if user is admin
        const isAdminUser = await AuthService.adminLogin(firebaseUser.email || '')
        if (isAdminUser) {
          // Load admin profile
          const profile = await AuthService.getUserProfile(firebaseUser.uid)
          userProfile.value = profile
          return true
        } else {
          // Not an admin, sign out
          await AuthService.signOut()
          user.value = null
          userProfile.value = null
          error.value = 'Acceso denegado. Solo administradores pueden acceder.'
          return false
        }
      }
      return false
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error de autenticación de administrador'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createProfile = async (
    alias: string, 
    tipo: 'cliente' | 'especialista',
    additionalData?: any
  ) => {
    try {
      if (!user.value) throw new Error('No hay usuario autenticado')
      
      loading.value = true
      const profile = await AuthService.createUserProfile(
        user.value, 
        alias, 
        tipo, 
        additionalData
      )
      userProfile.value = profile
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al crear perfil'
      throw err
    } finally {
      loading.value = false
    }
  }

  const initializeAuth = () => {
    return AuthService.onAuthStateChanged(async (firebaseUser) => {
      user.value = firebaseUser
      if (firebaseUser) {
        const profile = await AuthService.getUserProfile(firebaseUser.uid)
        userProfile.value = profile
      } else {
        userProfile.value = null
      }
    })
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    user,
    userProfile,
    loading,
    error,
    // Getters
    isAuthenticated,
    userRole,
    isCliente,
    isEspecialista,
    isAdmin,
    // Actions
    signInWithGoogle,
    signOut,
    adminLogin,
    createProfile,
    initializeAuth,
    clearError
  }
})