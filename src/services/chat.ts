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
  Timestamp,
  writeBatch,
  arrayUnion
} from 'firebase/firestore'
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage'
import { db, storage } from './firebase'
import type { Chat, Mensaje, ArchivoAdjunto } from '../types'

export class ChatService {
  private static readonly CHATS_COLLECTION = 'chats'
  private static readonly MESSAGES_COLLECTION = 'mensajes'
  private static readonly STORAGE_PATH = 'chat-files'

  /**
   * Create a new chat for a contract
   */
  static async createChat(contratoId: string, participantes: string[]): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.CHATS_COLLECTION), {
        contratoId,
        participantes,
        fechaCreacion: Timestamp.now(),
        estado: 'activo'
      })
      
      // Send initial system message
      await this.sendSystemMessage(docRef.id, 'Chat iniciado. Pueden comenzar a comunicarse de forma segura.')
      
      return docRef.id
    } catch (error) {
      console.error('Error creating chat:', error)
      throw error
    }
  }

  /**
   * Get chat by ID
   */
  static async getChat(chatId: string): Promise<Chat | null> {
    try {
      const docRef = doc(db, this.CHATS_COLLECTION, chatId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        return { 
          id: docSnap.id, 
          ...data,
          fechaCreacion: data.fechaCreacion?.toDate() || new Date(),
          mensajes: [] // Messages are loaded separately
        } as Chat
      }
      return null
    } catch (error) {
      console.error('Error getting chat:', error)
      throw error
    }
  }

  /**
   * Get chat by contract ID
   */
  static async getChatByContract(contratoId: string): Promise<Chat | null> {
    try {
      const q = query(
        collection(db, this.CHATS_COLLECTION),
        where('contratoId', '==', contratoId)
      )
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]
        const data = doc.data()
        return { 
          id: doc.id, 
          ...data,
          fechaCreacion: data.fechaCreacion?.toDate() || new Date(),
          mensajes: [] // Messages are loaded separately
        } as Chat
      }
      return null
    } catch (error) {
      console.error('Error getting chat by contract:', error)
      throw error
    }
  }

  /**
   * Send a text message
   */
  static async sendMessage(chatId: string, autorId: string, contenido: string): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.MESSAGES_COLLECTION), {
        chatId,
        autorId,
        contenido,
        tipo: 'texto',
        fechaEnvio: Timestamp.now(),
        leido: false
      })
      
      // Log message for audit
      await this.logMessage(chatId, autorId, 'texto', contenido)
      
      return docRef.id
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  /**
   * Send a system message
   */
  static async sendSystemMessage(chatId: string, contenido: string): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.MESSAGES_COLLECTION), {
        chatId,
        autorId: 'system',
        contenido,
        tipo: 'sistema',
        fechaEnvio: Timestamp.now(),
        leido: false
      })
      
      // Log system message for audit
      await this.logMessage(chatId, 'system', 'sistema', contenido)
      
      return docRef.id
    } catch (error) {
      console.error('Error sending system message:', error)
      throw error
    }
  }

  /**
   * Upload file and send file message
   */
  static async sendFileMessage(
    chatId: string, 
    autorId: string, 
    file: File, 
    mensaje?: string
  ): Promise<string> {
    try {
      // Upload file to Firebase Storage
      const fileRef = ref(storage, `${this.STORAGE_PATH}/${chatId}/${Date.now()}_${file.name}`)
      const snapshot = await uploadBytes(fileRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      // Create file attachment object
      const archivo: ArchivoAdjunto = {
        nombre: file.name,
        url: downloadURL,
        tipo: file.type,
        tamaño: file.size
      }
      
      // Send message with file attachment
      const docRef = await addDoc(collection(db, this.MESSAGES_COLLECTION), {
        chatId,
        autorId,
        contenido: mensaje || `Archivo compartido: ${file.name}`,
        tipo: 'archivo',
        archivos: [archivo],
        fechaEnvio: Timestamp.now(),
        leido: false
      })
      
      // Log file message for audit
      await this.logMessage(chatId, autorId, 'archivo', `Archivo: ${file.name} (${file.size} bytes)`)
      
      return docRef.id
    } catch (error) {
      console.error('Error sending file message:', error)
      throw error
    }
  }

  /**
   * Mark message as read
   */
  static async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const docRef = doc(db, this.MESSAGES_COLLECTION, messageId)
      await updateDoc(docRef, {
        leido: true
      })
    } catch (error) {
      console.error('Error marking message as read:', error)
      throw error
    }
  }

  /**
   * Mark all messages in chat as read for a user
   */
  static async markAllMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.MESSAGES_COLLECTION),
        where('chatId', '==', chatId),
        where('autorId', '!=', userId),
        where('leido', '==', false)
      )
      const querySnapshot = await getDocs(q)
      
      const batch = writeBatch(db)
      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { leido: true })
      })
      
      await batch.commit()
    } catch (error) {
      console.error('Error marking all messages as read:', error)
      throw error
    }
  }

  /**
   * Get messages for a chat
   */
  static async getMessages(chatId: string, limit: number = 50): Promise<Mensaje[]> {
    try {
      const q = query(
        collection(db, this.MESSAGES_COLLECTION),
        where('chatId', '==', chatId),
        orderBy('fechaEnvio', 'desc'),
        // limit(limit) // Uncomment if you want to limit messages
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaEnvio: data.fechaEnvio?.toDate() || new Date()
        }
      }).reverse() as Mensaje[] // Reverse to show oldest first
    } catch (error) {
      console.error('Error getting messages:', error)
      throw error
    }
  }

  /**
   * Get unread message count for a user in a chat
   */
  static async getUnreadCount(chatId: string, userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, this.MESSAGES_COLLECTION),
        where('chatId', '==', chatId),
        where('autorId', '!=', userId),
        where('leido', '==', false)
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.size
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  /**
   * Subscribe to messages in a chat
   */
  static subscribeToMessages(chatId: string, callback: (messages: Mensaje[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.MESSAGES_COLLECTION),
      where('chatId', '==', chatId),
      orderBy('fechaEnvio', 'asc')
    )
    
    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaEnvio: data.fechaEnvio?.toDate() || new Date()
        }
      }) as Mensaje[]
      
      callback(messages)
    })
  }

  /**
   * Subscribe to chat
   */
  static subscribeToChat(chatId: string, callback: (chat: Chat | null) => void): Unsubscribe {
    const docRef = doc(db, this.CHATS_COLLECTION, chatId)
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        callback({ 
          id: doc.id, 
          ...data,
          fechaCreacion: data.fechaCreacion?.toDate() || new Date(),
          mensajes: [] // Messages are loaded separately
        } as Chat)
      } else {
        callback(null)
      }
    })
  }

  /**
   * Archive chat
   */
  static async archiveChat(chatId: string): Promise<void> {
    try {
      const docRef = doc(db, this.CHATS_COLLECTION, chatId)
      await updateDoc(docRef, {
        estado: 'archivado'
      })
    } catch (error) {
      console.error('Error archiving chat:', error)
      throw error
    }
  }

  /**
   * Delete file from storage
   */
  static async deleteFile(fileUrl: string): Promise<void> {
    try {
      const fileRef = ref(storage, fileUrl)
      await deleteObject(fileRef)
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  }

  /**
   * Log message for audit purposes
   */
  private static async logMessage(
    chatId: string, 
    autorId: string, 
    tipo: string, 
    contenido: string
  ): Promise<void> {
    try {
      // Create audit log entry
      await addDoc(collection(db, 'chat_audit_logs'), {
        chatId,
        autorId,
        tipo,
        contenido: contenido.substring(0, 100), // Truncate for privacy
        timestamp: Timestamp.now()
      })
    } catch (error) {
      console.error('Error logging message:', error)
      // Don't throw error for logging failures
    }
  }

  /**
   * Get chat audit logs (admin only)
   */
  static async getChatAuditLogs(chatId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'chat_audit_logs'),
        where('chatId', '==', chatId),
        orderBy('timestamp', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }))
    } catch (error) {
      console.error('Error getting chat audit logs:', error)
      throw error
    }
  }

  /**
   * Get all chats for a user
   */
  static async getUserChats(userId: string): Promise<Chat[]> {
    try {
      const q = query(
        collection(db, this.CHATS_COLLECTION),
        where('participantes', 'array-contains', userId),
        orderBy('fechaCreacion', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fechaCreacion: data.fechaCreacion?.toDate() || new Date(),
          mensajes: [] // Messages are loaded separately
        }
      }) as Chat[]
    } catch (error) {
      console.error('Error getting user chats:', error)
      throw error
    }
  }
}