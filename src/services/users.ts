import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore'
import { db } from './firebase'
import type { Usuario, Cliente, Especialista, ResumenCalificaciones } from '../types'

export class UsersService {
  private static readonly COLLECTION = 'usuarios'

  /**
   * Get user profile by UID
   */
  static async getUserProfile(uid: string): Promise<Usuario | null> {
    try {
      const userRef = doc(db, this.COLLECTION, uid)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists()) {
        const data = userSnap.data()
        return {
          ...data,
          fechaCreacion: data.fechaCreacion?.toDate() || new Date()
        } as Usuario
      }
      return null
    } catch (error) {
      console.error('Error getting user profile:', error)
      throw error
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(uid: string, updates: Partial<Usuario>): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION, uid)
      await updateDoc(userRef, updates)
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  }

  /**
   * Get all specialists (for admin)
   */
  static async getAllSpecialists(): Promise<Especialista[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('tipo', '==', 'especialista'),
        orderBy('fechaCreacion', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date()
      })) as Especialista[]
    } catch (error) {
      console.error('Error getting specialists:', error)
      throw error
    }
  }

  /**
   * Get all clients (for admin)
   */
  static async getAllClients(): Promise<Cliente[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('tipo', '==', 'cliente'),
        orderBy('fechaCreacion', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date()
      })) as Cliente[]
    } catch (error) {
      console.error('Error getting clients:', error)
      throw error
    }
  }

  /**
   * Get pending specialists (for admin approval)
   */
  static async getPendingSpecialists(): Promise<Especialista[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('tipo', '==', 'especialista'),
        where('estado', '==', 'pendiente'),
        orderBy('fechaCreacion', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date()
      })) as Especialista[]
    } catch (error) {
      console.error('Error getting pending specialists:', error)
      throw error
    }
  }

  /**
   * Approve specialist (admin only)
   */
  static async approveSpecialist(uid: string): Promise<void> {
    try {
      await this.updateUserProfile(uid, { estado: 'activo' })
    } catch (error) {
      console.error('Error approving specialist:', error)
      throw error
    }
  }

  /**
   * Reject specialist (admin only)
   */
  static async rejectSpecialist(uid: string): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION, uid)
      await updateDoc(userRef, { estado: 'rechazado' })
    } catch (error) {
      console.error('Error rejecting specialist:', error)
      throw error
    }
  }

  /**
   * Suspend user (admin only)
   */
  static async suspendUser(uid: string): Promise<void> {
    try {
      await this.updateUserProfile(uid, { estado: 'suspendido' })
    } catch (error) {
      console.error('Error suspending user:', error)
      throw error
    }
  }

  /**
   * Reactivate user (admin only)
   */
  static async reactivateUser(uid: string): Promise<void> {
    try {
      await this.updateUserProfile(uid, { estado: 'activo' })
    } catch (error) {
      console.error('Error reactivating user:', error)
      throw error
    }
  }

  /**
   * Update specialist earnings
   */
  static async updateSpecialistEarnings(uid: string, amount: number): Promise<void> {
    try {
      const specialist = await this.getUserProfile(uid) as Especialista
      if (specialist && specialist.tipo === 'especialista') {
        const userRef = doc(db, this.COLLECTION, uid)
        await updateDoc(userRef, {
          gananciasTotal: specialist.gananciasTotal + amount,
          trabajosCompletados: specialist.trabajosCompletados + 1
        })
      }
    } catch (error) {
      console.error('Error updating specialist earnings:', error)
      throw error
    }
  }

  /**
   * Update specialist rating
   */
  static async updateSpecialistRating(uid: string, newRating: number): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION, uid)
      await updateDoc(userRef, {
        calificacionPromedio: newRating
      })
    } catch (error) {
      console.error('Error updating specialist rating:', error)
      throw error
    }
  }

  /**
   * Update client escrow balance
   */
  static async updateClientEscrowBalance(uid: string, amount: number): Promise<void> {
    try {
      const client = await this.getUserProfile(uid) as Cliente
      if (client && client.tipo === 'cliente') {
        const userRef = doc(db, this.COLLECTION, uid)
        await updateDoc(userRef, {
          saldoEscrow: client.saldoEscrow + amount
        })
      }
    } catch (error) {
      console.error('Error updating client escrow balance:', error)
      throw error
    }
  }

  /**
   * Add contract to client's active contracts
   */
  static async addActiveContract(clienteId: string, contractId: string): Promise<void> {
    try {
      const client = await this.getUserProfile(clienteId) as Cliente
      if (client && client.tipo === 'cliente') {
        const updatedContracts = [...client.contractosActivos, contractId]
        const userRef = doc(db, this.COLLECTION, clienteId)
        await updateDoc(userRef, {
          contractosActivos: updatedContracts
        })
      }
    } catch (error) {
      console.error('Error adding active contract:', error)
      throw error
    }
  }

  /**
   * Move contract from active to history
   */
  static async moveContractToHistory(clienteId: string, contractId: string): Promise<void> {
    try {
      const client = await this.getUserProfile(clienteId) as Cliente
      if (client && client.tipo === 'cliente') {
        const updatedActive = client.contractosActivos.filter(id => id !== contractId)
        const updatedHistory = [...client.historialContratos, contractId]
        
        const userRef = doc(db, this.COLLECTION, clienteId)
        await updateDoc(userRef, {
          contractosActivos: updatedActive,
          historialContratos: updatedHistory
        })
      }
    } catch (error) {
      console.error('Error moving contract to history:', error)
      throw error
    }
  }

  /**
   * Subscribe to user profile changes
   */
  static subscribeToUserProfile(uid: string, callback: (user: Usuario | null) => void): Unsubscribe {
    const userRef = doc(db, this.COLLECTION, uid)
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        callback({
          ...data,
          fechaCreacion: data.fechaCreacion?.toDate() || new Date()
        } as Usuario)
      } else {
        callback(null)
      }
    })
  }

  /**
   * Get user rating summary
   */
  static async getUserRatingSummary(uid: string): Promise<ResumenCalificaciones | null> {
    try {
      // This would typically be calculated from the calificaciones collection
      // For now, return a basic structure
      const user = await this.getUserProfile(uid)
      if (!user) return null

      return {
        usuarioId: uid,
        promedioGeneral: user.tipo === 'especialista' ? (user as Especialista).calificacionPromedio : 0,
        totalCalificaciones: user.tipo === 'especialista' ? (user as Especialista).trabajosCompletados : 0,
        distribucion: {
          cinco: 0,
          cuatro: 0,
          tres: 0,
          dos: 0,
          uno: 0
        },
        comentariosRecientes: []
      }
    } catch (error) {
      console.error('Error getting user rating summary:', error)
      throw error
    }
  }

  /**
   * Search specialists by skills
   */
  static async searchSpecialistsBySkills(skills: string[]): Promise<Especialista[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('tipo', '==', 'especialista'),
        where('estado', '==', 'activo'),
        where('habilidades', 'array-contains-any', skills)
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date()
      })) as Especialista[]
    } catch (error) {
      console.error('Error searching specialists by skills:', error)
      throw error
    }
  }
}