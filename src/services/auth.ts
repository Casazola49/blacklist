import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  getRedirectResult,
  signInWithRedirect
} from 'firebase/auth'
import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { auth, db } from './firebase'
import { UsersService } from './users'
import type { Usuario, Cliente, Especialista } from '../types'

const googleProvider = new GoogleAuthProvider()
// Configure Google provider
googleProvider.addScope('email')
googleProvider.addScope('profile')
googleProvider.setCustomParameters({
  prompt: 'select_account'
})

export class AuthService {
  /**
   * Sign in with Google
   */
  static async signInWithGoogle(): Promise<User | null> {
    try {
      // In development, try popup first, but use redirect as primary in production
      if (import.meta.env.DEV) {
        try {
          const result = await signInWithPopup(auth, googleProvider)
          return result.user
        } catch (popupError: any) {
          console.warn('Popup failed, falling back to redirect:', popupError)
          // Fall through to redirect method
        }
      }
      
      // Use redirect method (more reliable)
      console.log('Using redirect method for Google sign-in...')
      await signInWithRedirect(auth, googleProvider)
      // The result will be handled by getRedirectResult on page load
      return null
      
    } catch (error: any) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  /**
   * Handle redirect result after sign-in
   */
  static async handleRedirectResult(): Promise<User | null> {
    try {
      const result = await getRedirectResult(auth)
      return result?.user || null
    } catch (error) {
      console.error('Error handling redirect result:', error)
      throw error
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  /**
   * Create user profile after authentication
   */
  static async createUserProfile(
    user: User, 
    alias: string, 
    tipo: 'cliente' | 'especialista',
    additionalData?: Partial<Especialista>
  ): Promise<Usuario | Especialista> {
    try {
      const userRef = doc(db, 'usuarios', user.uid)
      
      const baseUserData: Usuario = {
        uid: user.uid,
        email: user.email!,
        alias,
        tipo,
        fechaCreacion: new Date(),
        estado: tipo === 'especialista' ? 'pendiente' : 'activo'
      }

      let userData: Usuario | Especialista

      if (tipo === 'cliente') {
        userData = {
          ...baseUserData,
          tipo: 'cliente',
          saldoEscrow: 0,
          contractosActivos: [],
          historialContratos: []
        } as Cliente
      } else {
        userData = {
          ...baseUserData,
          tipo: 'especialista',
          nombreReal: additionalData?.nombreReal || '',
          cv: additionalData?.cv || '',
          habilidades: additionalData?.habilidades || [],
          biografia: additionalData?.biografia || '',
          calificacionPromedio: 0,
          trabajosCompletados: 0,
          gananciasTotal: 0,
          estado: 'pendiente'
        } as Especialista
      }

      // Convert Date to Timestamp for Firestore
      const firestoreData = {
        ...userData,
        fechaCreacion: Timestamp.fromDate(userData.fechaCreacion)
      }

      await setDoc(userRef, firestoreData)
      return userData
    } catch (error) {
      console.error('Error creating user profile:', error)
      throw error
    }
  }

  /**
   * Get user profile by UID
   */
  static async getUserProfile(uid: string): Promise<Usuario | null> {
    return UsersService.getUserProfile(uid)
  }

  /**
   * Check if user profile exists
   */
  static async userProfileExists(uid: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(uid)
      return profile !== null
    } catch (error) {
      console.error('Error checking if user profile exists:', error)
      return false
    }
  }

  /**
   * Get current authenticated user
   */
  static getCurrentUser(): User | null {
    return auth.currentUser
  }

  /**
   * Check if current user is authenticated
   */
  static isAuthenticated(): boolean {
    return auth.currentUser !== null
  }

  /**
   * Listen to authentication state changes
   */
  static onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback)
  }

  /**
   * Check if user has specific role
   */
  static async hasRole(uid: string, role: 'cliente' | 'especialista' | 'admin'): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(uid)
      return profile?.tipo === role
    } catch (error) {
      console.error('Error checking user role:', error)
      return false
    }
  }

  /**
   * Admin login with special credentials
   */
  static async adminLogin(email: string): Promise<boolean> {
    try {
      // In a real implementation, this would check against a secure admin list
      // For demo purposes, we'll check if the email contains 'admin'
      const adminEmails = [
        'admin@theblacklist.com',
        'conserje@theblacklist.com',
        'admin@gmail.com' // For testing
      ]
      
      if (adminEmails.includes(email.toLowerCase())) {
        // Check if user exists and is admin
        const user = auth.currentUser
        if (user) {
          const profile = await this.getUserProfile(user.uid)
          if (profile?.tipo === 'admin') {
            return true
          }
          
          // If user exists but is not admin, make them admin (for demo)
          if (profile) {
            await this.promoteToAdmin(user.uid)
            return true
          }
        }
      }
      
      return false
    } catch (error) {
      console.error('Error in admin login:', error)
      return false
    }
  }

  /**
   * Promote user to admin (internal use only)
   */
  private static async promoteToAdmin(uid: string): Promise<void> {
    try {
      const { UsersService } = await import('./users')
      await UsersService.updateUserProfile(uid, { tipo: 'admin' })
    } catch (error) {
      console.error('Error promoting user to admin:', error)
      throw error
    }
  }

  /**
   * Check if user is active
   */
  static async isUserActive(uid: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(uid)
      return profile?.estado === 'activo'
    } catch (error) {
      console.error('Error checking if user is active:', error)
      return false
    }
  }

  /**
   * Validate alias uniqueness (would need to implement index in Firestore)
   */
  static async isAliasAvailable(alias: string): Promise<boolean> {
    try {
      // This would require a compound query or cloud function
      // For now, return true (implement proper validation later)
      console.log('Checking alias availability:', alias)
      return true
    } catch (error) {
      console.error('Error checking alias availability:', error)
      return false
    }
  }
}