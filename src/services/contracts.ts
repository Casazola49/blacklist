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
  arrayUnion,
  arrayRemove,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'
import type { Contrato, EstadoContrato, Propuesta } from '../types'

export class ContractsService {
  private static readonly COLLECTION = 'contratos'

  /**
   * Create a new contract
   */
  static async createContract(contractData: Omit<Contrato, 'id' | 'fechaCreacion' | 'estado' | 'propuestas'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...contractData,
        fechaCreacion: Timestamp.now(),
        estado: 'abierto' as EstadoContrato,
        propuestas: []
      })
      return docRef.id
    } catch (error) {
      console.error('Error creating contract:', error)
      throw error
    }
  }

  /**
   * Get contract by ID
   */
  static async getContract(contractId: string): Promise<Contrato | null> {
    try {
      const docRef = doc(db, this.COLLECTION, contractId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        return { 
          id: docSnap.id, 
          ...data,
          fechaCreacion: data.fechaCreacion?.toDate() || new Date(),
          fechaLimite: data.fechaLimite?.toDate() || new Date(),
          fechaAsignacion: data.fechaAsignacion?.toDate(),
          fechaCompletado: data.fechaCompletado?.toDate()
        } as Contrato
      }
      return null
    } catch (error) {
      console.error('Error getting contract:', error)
      throw error
    }
  }

  /**
   * Update contract
   */
  static async updateContract(contractId: string, updates: Partial<Contrato>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, contractId)
      
      // Convert Date objects to Timestamps for Firestore
      const firestoreUpdates: any = { ...updates }
      if (updates.fechaLimite) {
        firestoreUpdates.fechaLimite = Timestamp.fromDate(updates.fechaLimite)
      }
      if (updates.fechaAsignacion) {
        firestoreUpdates.fechaAsignacion = Timestamp.fromDate(updates.fechaAsignacion)
      }
      if (updates.fechaCompletado) {
        firestoreUpdates.fechaCompletado = Timestamp.fromDate(updates.fechaCompletado)
      }
      
      await updateDoc(docRef, firestoreUpdates)
    } catch (error) {
      console.error('Error updating contract:', error)
      throw error
    }
  }

  /**
   * Delete contract (admin only)
   */
  static async deleteContract(contractId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, contractId)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Error deleting contract:', error)
      throw error
    }
  }

  /**
   * Get contracts by client ID
   */
  static async getClientContracts(clienteId: string): Promise<Contrato[]> {
    try {
      // Temporary: Remove orderBy to avoid index requirement
      const q = query(
        collection(db, this.COLLECTION),
        where('clienteId', '==', clienteId)
      )
      const querySnapshot = await getDocs(q)
      
      const contracts = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaCreacion: data.fechaCreacion?.toDate() || new Date(),
          fechaLimite: data.fechaLimite?.toDate() || new Date(),
          fechaAsignacion: data.fechaAsignacion?.toDate(),
          fechaCompletado: data.fechaCompletado?.toDate()
        }
      }) as Contrato[]
      
      // Sort in memory instead of using Firestore orderBy
      return contracts.sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime())
    } catch (error) {
      console.error('Error getting client contracts:', error)
      throw error
    }
  }

  /**
   * Get contracts by specialist ID
   */
  static async getSpecialistContracts(especialistaId: string): Promise<Contrato[]> {
    try {
      // Temporary: Remove orderBy to avoid index requirement
      const q = query(
        collection(db, this.COLLECTION),
        where('especialistaId', '==', especialistaId)
      )
      const querySnapshot = await getDocs(q)
      
      const contracts = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaCreacion: data.fechaCreacion?.toDate() || new Date(),
          fechaLimite: data.fechaLimite?.toDate() || new Date(),
          fechaAsignacion: data.fechaAsignacion?.toDate(),
          fechaCompletado: data.fechaCompletado?.toDate()
        }
      }) as Contrato[]
      
      // Sort in memory instead of using Firestore orderBy
      return contracts.sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime())
    } catch (error) {
      console.error('Error getting specialist contracts:', error)
      throw error
    }
  }

  /**
   * Get open contracts (available for proposals)
   */
  static async getOpenContracts(especialistaHabilidades?: string[]): Promise<Contrato[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('estado', '==', 'abierto'),
        orderBy('fechaCreacion', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      let contracts = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaCreacion: data.fechaCreacion?.toDate() || new Date(),
          fechaLimite: data.fechaLimite?.toDate() || new Date(),
          fechaAsignacion: data.fechaAsignacion?.toDate(),
          fechaCompletado: data.fechaCompletado?.toDate()
        }
      }) as Contrato[]

      // Filter by specialist skills if provided
      if (especialistaHabilidades && especialistaHabilidades.length > 0) {
        contracts = contracts.filter(contract => {
          // This is a simple matching - could be enhanced with more sophisticated matching
          const contractKeywords = (contract.titulo + ' ' + contract.descripcion).toLowerCase()
          return especialistaHabilidades.some(skill => 
            contractKeywords.includes(skill.toLowerCase())
          )
        })
      }
      
      return contracts
    } catch (error) {
      console.error('Error getting open contracts:', error)
      throw error
    }
  }

  /**
   * Get all contracts (admin only)
   */
  static async getAllContracts(): Promise<Contrato[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        orderBy('fechaCreacion', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaCreacion: data.fechaCreacion?.toDate() || new Date(),
          fechaLimite: data.fechaLimite?.toDate() || new Date(),
          fechaAsignacion: data.fechaAsignacion?.toDate(),
          fechaCompletado: data.fechaCompletado?.toDate()
        }
      }) as Contrato[]
    } catch (error) {
      console.error('Error getting all contracts:', error)
      throw error
    }
  }

  /**
   * Get contracts by status
   */
  static async getContractsByStatus(estado: EstadoContrato): Promise<Contrato[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('estado', '==', estado),
        orderBy('fechaCreacion', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaCreacion: data.fechaCreacion?.toDate() || new Date(),
          fechaLimite: data.fechaLimite?.toDate() || new Date(),
          fechaAsignacion: data.fechaAsignacion?.toDate(),
          fechaCompletado: data.fechaCompletado?.toDate()
        }
      }) as Contrato[]
    } catch (error) {
      console.error('Error getting contracts by status:', error)
      throw error
    }
  }

  /**
   * Assign contract to specialist
   */
  static async assignContract(contractId: string, especialistaId: string, precioFinal: number): Promise<void> {
    try {
      // Get contract details first
      const contract = await this.getContract(contractId)
      if (!contract) {
        throw new Error('Contract not found')
      }

      // Update contract
      await this.updateContract(contractId, {
        especialistaId,
        precioFinal,
        estado: 'esperando_deposito',
        fechaAsignacion: new Date()
      })

      // Create chat for the contract
      try {
        const { ChatService } = await import('./chat')
        const existingChat = await ChatService.getChatByContract(contractId)
        
        if (!existingChat) {
          const chatId = await ChatService.createChat(contractId, [contract.clienteId, especialistaId])
          
          // Update contract with chat ID
          await this.updateContract(contractId, {
            chatId
          })
        }
      } catch (chatError) {
        console.error('Error creating chat for contract:', chatError)
        // Don't throw error for chat creation failure
      }
    } catch (error) {
      console.error('Error assigning contract:', error)
      throw error
    }
  }

  /**
   * Mark work as delivered by specialist
   */
  static async deliverWork(contractId: string): Promise<void> {
    try {
      await this.updateContract(contractId, {
        estado: 'entrega_realizada'
      })
    } catch (error) {
      console.error('Error delivering work:', error)
      throw error
    }
  }

  /**
   * Approve work and release escrow funds
   */
  static async approveWork(contractId: string): Promise<void> {
    try {
      // TEMPORARILY DISABLED - Escrow functionality
      console.log('Escrow functionality temporarily disabled for demo')
      
      // Just update contract status without escrow
      await this.updateContractStatus(contractId, 'completado')
      
      // Update contract status to completed
      await this.updateContract(contractId, {
        estado: 'completado',
        fechaCompletado: new Date()
      })

      // Trigger rating requirement for both parties
      // This will be handled by the UI components that listen to contract state changes
      console.log(`Contract ${contractId} completed - rating required for both parties`)
    } catch (error) {
      console.error('Error approving work:', error)
      throw error
    }
  }

  /**
   * Complete contract (legacy method - use approveWork instead)
   */
  static async completeContract(contractId: string): Promise<void> {
    try {
      await this.approveWork(contractId)
    } catch (error) {
      console.error('Error completing contract:', error)
      throw error
    }
  }

  /**
   * Cancel contract
   */
  static async cancelContract(contractId: string): Promise<void> {
    try {
      await this.updateContract(contractId, {
        estado: 'cancelado'
      })
    } catch (error) {
      console.error('Error canceling contract:', error)
      throw error
    }
  }

  /**
   * Mark contract as disputed
   */
  static async disputeContract(contractId: string): Promise<void> {
    try {
      await this.updateContract(contractId, {
        estado: 'disputado'
      })
    } catch (error) {
      console.error('Error disputing contract:', error)
      throw error
    }
  }

  /**
   * Add proposal to contract
   */
  static async addProposalToContract(contractId: string, propuesta: Propuesta): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, contractId)
      await updateDoc(docRef, {
        propuestas: arrayUnion(propuesta)
      })
    } catch (error) {
      console.error('Error adding proposal to contract:', error)
      throw error
    }
  }

  /**
   * Remove proposal from contract
   */
  static async removeProposalFromContract(contractId: string, propuesta: Propuesta): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, contractId)
      await updateDoc(docRef, {
        propuestas: arrayRemove(propuesta)
      })
    } catch (error) {
      console.error('Error removing proposal from contract:', error)
      throw error
    }
  }

  /**
   * Subscribe to contract changes
   */
  static subscribeToContract(contractId: string, callback: (contract: Contrato | null) => void): Unsubscribe {
    const docRef = doc(db, this.COLLECTION, contractId)
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        callback({ 
          id: doc.id, 
          ...data,
          fechaCreacion: data.fechaCreacion?.toDate() || new Date(),
          fechaLimite: data.fechaLimite?.toDate() || new Date(),
          fechaAsignacion: data.fechaAsignacion?.toDate(),
          fechaCompletado: data.fechaCompletado?.toDate()
        } as Contrato)
      } else {
        callback(null)
      }
    })
  }

  /**
   * Subscribe to client contracts
   */
  static subscribeToClientContracts(clienteId: string, callback: (contracts: Contrato[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.COLLECTION),
      where('clienteId', '==', clienteId),
      orderBy('fechaCreacion', 'desc')
    )
    
    return onSnapshot(q, (querySnapshot) => {
      const contracts = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaCreacion: data.fechaCreacion?.toDate() || new Date(),
          fechaLimite: data.fechaLimite?.toDate() || new Date(),
          fechaAsignacion: data.fechaAsignacion?.toDate(),
          fechaCompletado: data.fechaCompletado?.toDate()
        }
      }) as Contrato[]
      
      callback(contracts)
    })
  }

  /**
   * Subscribe to open contracts
   */
  static subscribeToOpenContracts(callback: (contracts: Contrato[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.COLLECTION),
      where('estado', '==', 'abierto'),
      orderBy('fechaCreacion', 'desc')
    )
    
    return onSnapshot(q, (querySnapshot) => {
      const contracts = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaCreacion: data.fechaCreacion?.toDate() || new Date(),
          fechaLimite: data.fechaLimite?.toDate() || new Date(),
          fechaAsignacion: data.fechaAsignacion?.toDate(),
          fechaCompletado: data.fechaCompletado?.toDate()
        }
      }) as Contrato[]
      
      callback(contracts)
    })
  }
}