import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Unsubscribe,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'
import type { Calificacion, ResumenCalificaciones } from '../types'

export class RatingsService {
  private static readonly COLLECTION = 'calificaciones'

  /**
   * Create a new rating
   */
  static async createRating(ratingData: Omit<Calificacion, 'id' | 'fechaCalificacion' | 'visible'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...ratingData,
        fechaCalificacion: Timestamp.now(),
        visible: false // Will be made visible when both parties rate
      })
      
      // Check if both parties have now rated
      await this.checkAndMakeRatingsVisible(ratingData.contratoId)
      
      return docRef.id
    } catch (error) {
      console.error('Error creating rating:', error)
      throw error
    }
  }

  /**
   * Get rating by ID
   */
  static async getRating(ratingId: string): Promise<Calificacion | null> {
    try {
      const docRef = doc(db, this.COLLECTION, ratingId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        return { 
          id: docSnap.id, 
          ...data,
          fechaCalificacion: data.fechaCalificacion?.toDate() || new Date()
        } as Calificacion
      }
      return null
    } catch (error) {
      console.error('Error getting rating:', error)
      throw error
    }
  }

  /**
   * Update rating
   */
  static async updateRating(ratingId: string, updates: Partial<Calificacion>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, ratingId)
      await updateDoc(docRef, updates)
    } catch (error) {
      console.error('Error updating rating:', error)
      throw error
    }
  }

  /**
   * Get ratings by contract ID
   */
  static async getRatingsByContract(contratoId: string): Promise<Calificacion[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('contratoId', '==', contratoId),
        orderBy('fechaCalificacion', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaCalificacion: data.fechaCalificacion?.toDate() || new Date()
        }
      }) as Calificacion[]
    } catch (error) {
      console.error('Error getting ratings by contract:', error)
      throw error
    }
  }

  /**
   * Get ratings for a user (as evaluado)
   */
  static async getRatingsForUser(evaluadoId: string): Promise<Calificacion[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('evaluadoId', '==', evaluadoId),
        where('visible', '==', true),
        orderBy('fechaCalificacion', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaCalificacion: data.fechaCalificacion?.toDate() || new Date()
        }
      }) as Calificacion[]
    } catch (error) {
      console.error('Error getting ratings for user:', error)
      throw error
    }
  }

  /**
   * Get ratings by a user (as evaluador)
   */
  static async getRatingsByUser(evaluadorId: string): Promise<Calificacion[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('evaluadorId', '==', evaluadorId),
        orderBy('fechaCalificacion', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaCalificacion: data.fechaCalificacion?.toDate() || new Date()
        }
      }) as Calificacion[]
    } catch (error) {
      console.error('Error getting ratings by user:', error)
      throw error
    }
  }

  /**
   * Check if user has rated a contract
   */
  static async hasUserRatedContract(evaluadorId: string, contratoId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('evaluadorId', '==', evaluadorId),
        where('contratoId', '==', contratoId)
      )
      const querySnapshot = await getDocs(q)
      
      return !querySnapshot.empty
    } catch (error) {
      console.error('Error checking if user has rated contract:', error)
      throw error
    }
  }

  /**
   * Check if both parties have rated and make ratings visible
   */
  static async checkAndMakeRatingsVisible(contratoId: string): Promise<void> {
    try {
      const ratings = await this.getRatingsByContract(contratoId)
      
      if (ratings.length === 2) {
        // Both parties have rated, make both ratings visible
        const updatePromises = ratings.map(rating => 
          this.updateRating(rating.id, { visible: true })
        )
        await Promise.all(updatePromises)
        
        // Update user ratings averages
        await this.updateUserRatingAverages(ratings)
      }
    } catch (error) {
      console.error('Error checking and making ratings visible:', error)
      throw error
    }
  }

  /**
   * Update user rating averages after new ratings are made visible
   */
  private static async updateUserRatingAverages(ratings: Calificacion[]): Promise<void> {
    try {
      const userIds = [...new Set(ratings.map(r => r.evaluadoId))]
      
      for (const userId of userIds) {
        const userRatings = await this.getRatingsForUser(userId)
        if (userRatings.length > 0) {
          const average = userRatings.reduce((sum, rating) => sum + rating.puntuacion, 0) / userRatings.length
          const roundedAverage = Math.round(average * 100) / 100
          
          // Update user's rating average in users collection
          const userRef = doc(db, 'usuarios', userId)
          await updateDoc(userRef, {
            calificacionPromedio: roundedAverage
          })
        }
      }
    } catch (error) {
      console.error('Error updating user rating averages:', error)
      throw error
    }
  }

  /**
   * Get user rating summary
   */
  static async getUserRatingSummary(usuarioId: string): Promise<ResumenCalificaciones> {
    try {
      const ratings = await this.getRatingsForUser(usuarioId)
      
      const distribucion = ratings.reduce((acc, rating) => {
        switch (rating.puntuacion) {
          case 5: acc.cinco++; break
          case 4: acc.cuatro++; break
          case 3: acc.tres++; break
          case 2: acc.dos++; break
          case 1: acc.uno++; break
        }
        return acc
      }, { cinco: 0, cuatro: 0, tres: 0, dos: 0, uno: 0 })

      const promedioGeneral = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating.puntuacion, 0) / ratings.length 
        : 0

      const comentariosRecientes = ratings
        .filter(rating => rating.comentario && rating.comentario.trim() !== '')
        .slice(0, 5)
        .map(rating => rating.comentario)

      return {
        usuarioId,
        promedioGeneral: Math.round(promedioGeneral * 100) / 100,
        totalCalificaciones: ratings.length,
        distribucion,
        comentariosRecientes
      }
    } catch (error) {
      console.error('Error getting user rating summary:', error)
      throw error
    }
  }

  /**
   * Get all ratings (admin only)
   */
  static async getAllRatings(): Promise<Calificacion[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        orderBy('fechaCalificacion', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaCalificacion: data.fechaCalificacion?.toDate() || new Date()
        }
      }) as Calificacion[]
    } catch (error) {
      console.error('Error getting all ratings:', error)
      throw error
    }
  }

  /**
   * Get recent ratings (for admin dashboard)
   */
  static async getRecentRatings(limit: number = 10): Promise<Calificacion[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('visible', '==', true),
        orderBy('fechaCalificacion', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.slice(0, limit).map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaCalificacion: data.fechaCalificacion?.toDate() || new Date()
        }
      }) as Calificacion[]
    } catch (error) {
      console.error('Error getting recent ratings:', error)
      throw error
    }
  }

  /**
   * Subscribe to user ratings
   */
  static subscribeToUserRatings(usuarioId: string, callback: (ratings: Calificacion[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.COLLECTION),
      where('evaluadoId', '==', usuarioId),
      where('visible', '==', true),
      orderBy('fechaCalificacion', 'desc')
    )
    
    return onSnapshot(q, (querySnapshot) => {
      const ratings = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaCalificacion: data.fechaCalificacion?.toDate() || new Date()
        }
      }) as Calificacion[]
      
      callback(ratings)
    })
  }

  /**
   * Get rating statistics for admin dashboard
   */
  static async getRatingStatistics(): Promise<{
    totalCalificaciones: number
    promedioGeneral: number
    distribucion: { cinco: number; cuatro: number; tres: number; dos: number; uno: number }
    calificacionesRecientes: number
  }> {
    try {
      const ratings = await this.getAllRatings()
      const visibleRatings = ratings.filter(r => r.visible)
      
      const distribucion = visibleRatings.reduce((acc, rating) => {
        switch (rating.puntuacion) {
          case 5: acc.cinco++; break
          case 4: acc.cuatro++; break
          case 3: acc.tres++; break
          case 2: acc.dos++; break
          case 1: acc.uno++; break
        }
        return acc
      }, { cinco: 0, cuatro: 0, tres: 0, dos: 0, uno: 0 })

      const promedioGeneral = visibleRatings.length > 0 
        ? visibleRatings.reduce((sum, rating) => sum + rating.puntuacion, 0) / visibleRatings.length 
        : 0

      // Count ratings from last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const calificacionesRecientes = visibleRatings.filter(
        rating => rating.fechaCalificacion >= thirtyDaysAgo
      ).length

      return {
        totalCalificaciones: visibleRatings.length,
        promedioGeneral: Math.round(promedioGeneral * 100) / 100,
        distribucion,
        calificacionesRecientes
      }
    } catch (error) {
      console.error('Error getting rating statistics:', error)
      throw error
    }
  }
}