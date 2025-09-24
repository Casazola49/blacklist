import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Unsubscribe,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'
import type { Propuesta } from '../types'

export class ProposalsService {
  private static readonly COLLECTION = 'propuestas'

  /**
   * Create a new proposal
   */
  static async createProposal(proposalData: Omit<Propuesta, 'id' | 'fechaEnvio' | 'estado'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...proposalData,
        fechaEnvio: Timestamp.now(),
        estado: 'pendiente'
      })
      return docRef.id
    } catch (error) {
      console.error('Error creating proposal:', error)
      throw error
    }
  }

  /**
   * Get proposal by ID
   */
  static async getProposal(proposalId: string): Promise<Propuesta | null> {
    try {
      const docRef = doc(db, this.COLLECTION, proposalId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        return { 
          id: docSnap.id, 
          ...data,
          fechaEnvio: data.fechaEnvio?.toDate() || new Date()
        } as Propuesta
      }
      return null
    } catch (error) {
      console.error('Error getting proposal:', error)
      throw error
    }
  }

  /**
   * Update proposal
   */
  static async updateProposal(proposalId: string, updates: Partial<Propuesta>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, proposalId)
      await updateDoc(docRef, updates)
    } catch (error) {
      console.error('Error updating proposal:', error)
      throw error
    }
  }

  /**
   * Delete proposal
   */
  static async deleteProposal(proposalId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, proposalId)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Error deleting proposal:', error)
      throw error
    }
  }

  /**
   * Get proposals by contract ID
   */
  static async getProposalsByContract(contratoId: string): Promise<Propuesta[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('contratoId', '==', contratoId),
        orderBy('fechaEnvio', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaEnvio: data.fechaEnvio?.toDate() || new Date()
        }
      }) as Propuesta[]
    } catch (error) {
      console.error('Error getting proposals by contract:', error)
      throw error
    }
  }

  /**
   * Get proposals by specialist ID
   */
  static async getProposalsBySpecialist(especialistaId: string): Promise<Propuesta[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('especialistaId', '==', especialistaId),
        orderBy('fechaEnvio', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaEnvio: data.fechaEnvio?.toDate() || new Date()
        }
      }) as Propuesta[]
    } catch (error) {
      console.error('Error getting proposals by specialist:', error)
      throw error
    }
  }

  /**
   * Get pending proposals by contract
   */
  static async getPendingProposalsByContract(contratoId: string): Promise<Propuesta[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('contratoId', '==', contratoId),
        where('estado', '==', 'pendiente'),
        orderBy('fechaEnvio', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaEnvio: data.fechaEnvio?.toDate() || new Date()
        }
      }) as Propuesta[]
    } catch (error) {
      console.error('Error getting pending proposals by contract:', error)
      throw error
    }
  }

  /**
   * Accept proposal
   */
  static async acceptProposal(proposalId: string): Promise<void> {
    try {
      await this.updateProposal(proposalId, { estado: 'aceptada' })
      
      // Reject all other proposals for the same contract
      const proposal = await this.getProposal(proposalId)
      if (proposal) {
        await this.rejectOtherProposals(proposal.contratoId, proposalId)
      }
    } catch (error) {
      console.error('Error accepting proposal:', error)
      throw error
    }
  }

  /**
   * Reject proposal
   */
  static async rejectProposal(proposalId: string): Promise<void> {
    try {
      await this.updateProposal(proposalId, { estado: 'rechazada' })
    } catch (error) {
      console.error('Error rejecting proposal:', error)
      throw error
    }
  }

  /**
   * Reject all other proposals for a contract (when one is accepted)
   */
  static async rejectOtherProposals(contratoId: string, acceptedProposalId: string): Promise<void> {
    try {
      const proposals = await this.getPendingProposalsByContract(contratoId)
      
      const rejectPromises = proposals
        .filter(proposal => proposal.id !== acceptedProposalId)
        .map(proposal => this.rejectProposal(proposal.id))
      
      await Promise.all(rejectPromises)
    } catch (error) {
      console.error('Error rejecting other proposals:', error)
      throw error
    }
  }

  /**
   * Get all proposals (admin only)
   */
  static async getAllProposals(): Promise<Propuesta[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        orderBy('fechaEnvio', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaEnvio: data.fechaEnvio?.toDate() || new Date()
        }
      }) as Propuesta[]
    } catch (error) {
      console.error('Error getting all proposals:', error)
      throw error
    }
  }

  /**
   * Get proposals by status
   */
  static async getProposalsByStatus(estado: 'pendiente' | 'aceptada' | 'rechazada'): Promise<Propuesta[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('estado', '==', estado),
        orderBy('fechaEnvio', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaEnvio: data.fechaEnvio?.toDate() || new Date()
        }
      }) as Propuesta[]
    } catch (error) {
      console.error('Error getting proposals by status:', error)
      throw error
    }
  }

  /**
   * Check if specialist has already submitted proposal for contract
   */
  static async hasSpecialistProposed(especialistaId: string, contratoId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('especialistaId', '==', especialistaId),
        where('contratoId', '==', contratoId)
      )
      const querySnapshot = await getDocs(q)
      
      return !querySnapshot.empty
    } catch (error) {
      console.error('Error checking if specialist has proposed:', error)
      throw error
    }
  }

  /**
   * Get specialist's proposal for a specific contract
   */
  static async getSpecialistProposalForContract(especialistaId: string, contratoId: string): Promise<Propuesta | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('especialistaId', '==', especialistaId),
        where('contratoId', '==', contratoId)
      )
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaEnvio: data.fechaEnvio?.toDate() || new Date()
        } as Propuesta
      }
      
      return null
    } catch (error) {
      console.error('Error getting specialist proposal for contract:', error)
      throw error
    }
  }

  /**
   * Subscribe to proposals for a contract
   */
  static subscribeToContractProposals(contratoId: string, callback: (proposals: Propuesta[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.COLLECTION),
      where('contratoId', '==', contratoId),
      orderBy('fechaEnvio', 'desc')
    )
    
    return onSnapshot(q, (querySnapshot) => {
      const proposals = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaEnvio: data.fechaEnvio?.toDate() || new Date()
        }
      }) as Propuesta[]
      
      callback(proposals)
    })
  }

  /**
   * Subscribe to specialist's proposals
   */
  static subscribeToSpecialistProposals(especialistaId: string, callback: (proposals: Propuesta[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.COLLECTION),
      where('especialistaId', '==', especialistaId),
      orderBy('fechaEnvio', 'desc')
    )
    
    return onSnapshot(q, (querySnapshot) => {
      const proposals = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaEnvio: data.fechaEnvio?.toDate() || new Date()
        }
      }) as Propuesta[]
      
      callback(proposals)
    })
  }

  /**
   * Get proposal statistics for admin dashboard
   */
  static async getProposalStatistics(): Promise<{
    total: number
    pendientes: number
    aceptadas: number
    rechazadas: number
    promedioProposalsPorContrato: number
  }> {
    try {
      const [allProposals, pendingProposals, acceptedProposals, rejectedProposals] = await Promise.all([
        this.getAllProposals(),
        this.getProposalsByStatus('pendiente'),
        this.getProposalsByStatus('aceptada'),
        this.getProposalsByStatus('rechazada')
      ])

      // Calculate average proposals per contract
      const contractIds = new Set(allProposals.map(p => p.contratoId))
      const promedioProposalsPorContrato = contractIds.size > 0 ? allProposals.length / contractIds.size : 0

      return {
        total: allProposals.length,
        pendientes: pendingProposals.length,
        aceptadas: acceptedProposals.length,
        rechazadas: rejectedProposals.length,
        promedioProposalsPorContrato: Math.round(promedioProposalsPorContrato * 100) / 100
      }
    } catch (error) {
      console.error('Error getting proposal statistics:', error)
      throw error
    }
  }
}