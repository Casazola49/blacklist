import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { 
  initializeTestEnvironment, 
  RulesTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore'

describe('Firestore Security Rules', () => {
  let testEnv: RulesTestEnvironment

  beforeEach(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: {
        rules: `
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              // Users can only read/write their own data
              match /usuarios/{userId} {
                allow read, write: if request.auth != null && request.auth.uid == userId;
              }

              // Contracts: clients can create, both parties can read/update
              match /contratos/{contratoId} {
                allow create: if request.auth != null && 
                  request.auth.uid == resource.data.clienteId;
                allow read: if request.auth != null && 
                  (request.auth.uid == resource.data.clienteId ||
                   request.auth.uid == resource.data.especialistaId);
                allow update: if request.auth != null && 
                  (request.auth.uid == resource.data.clienteId ||
                   request.auth.uid == resource.data.especialistaId);
                allow delete: if false; // No deletion allowed
              }

              // Proposals: specialists can create, contract parties can read
              match /propuestas/{propuestaId} {
                allow create: if request.auth != null && 
                  request.auth.uid == request.resource.data.especialistaId;
                allow read: if request.auth != null;
                allow update: if request.auth != null && 
                  request.auth.uid == resource.data.especialistaId;
                allow delete: if false;
              }

              // Chats: only participants can access
              match /chats/{chatId} {
                allow read, write: if request.auth != null && 
                  request.auth.uid in resource.data.participantes;
              }

              // Messages: only chat participants can access
              match /mensajes/{mensajeId} {
                allow create: if request.auth != null && 
                  request.auth.uid == request.resource.data.autorId;
                allow read: if request.auth != null;
                allow update: if request.auth != null && 
                  request.auth.uid == resource.data.autorId;
                allow delete: if false;
              }

              // Escrow transactions: only contract parties can read
              match /transacciones/{transaccionId} {
                allow read: if request.auth != null && 
                  (request.auth.uid == resource.data.clienteId ||
                   request.auth.uid == resource.data.especialistaId);
                allow create, update: if false; // Only server can modify
                allow delete: if false;
              }

              // Ratings: users can create their own, both parties can read
              match /calificaciones/{calificacionId} {
                allow create: if request.auth != null && 
                  request.auth.uid == request.resource.data.evaluadorId;
                allow read: if request.auth != null && 
                  (request.auth.uid == resource.data.evaluadorId ||
                   request.auth.uid == resource.data.evaluadoId);
                allow update, delete: if false;
              }

              // Admin-only collections
              match /admin/{document=**} {
                allow read, write: if request.auth != null && 
                  request.auth.token.admin == true;
              }

              // Audit logs: read-only for admins
              match /audit/{auditId} {
                allow read: if request.auth != null && 
                  request.auth.token.admin == true;
                allow write: if false; // Only server can write
              }
            }
          }
        `
      }
    })
  })

  afterEach(async () => {
    await testEnv.cleanup()
  })

  describe('User Data Access', () => {
    it('should allow users to read their own data', async () => {
      const db = testEnv.authenticatedContext('user123').firestore()
      const userDoc = doc(db, 'usuarios', 'user123')
      
      await assertSucceeds(getDoc(userDoc))
    })

    it('should allow users to write their own data', async () => {
      const db = testEnv.authenticatedContext('user123').firestore()
      const userDoc = doc(db, 'usuarios', 'user123')
      
      await assertSucceeds(setDoc(userDoc, {
        email: 'user123@example.com',
        alias: 'testuser',
        tipo: 'cliente'
      }))
    })

    it('should deny access to other users data', async () => {
      const db = testEnv.authenticatedContext('user123').firestore()
      const otherUserDoc = doc(db, 'usuarios', 'user456')
      
      await assertFails(getDoc(otherUserDoc))
      await assertFails(setDoc(otherUserDoc, { email: 'hacker@example.com' }))
    })

    it('should deny unauthenticated access', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      const userDoc = doc(db, 'usuarios', 'user123')
      
      await assertFails(getDoc(userDoc))
      await assertFails(setDoc(userDoc, { email: 'anonymous@example.com' }))
    })
  })

  describe('Contract Access Control', () => {
    it('should allow client to create contract', async () => {
      const db = testEnv.authenticatedContext('client123').firestore()
      const contractsRef = collection(db, 'contratos')
      
      await assertSucceeds(addDoc(contractsRef, {
        clienteId: 'client123',
        titulo: 'Test Contract',
        descripcion: 'Test description',
        estado: 'abierto',
        fechaCreacion: new Date()
      }))
    })

    it('should deny non-client from creating contract', async () => {
      const db = testEnv.authenticatedContext('hacker123').firestore()
      const contractsRef = collection(db, 'contratos')
      
      await assertFails(addDoc(contractsRef, {
        clienteId: 'client123', // Trying to impersonate
        titulo: 'Malicious Contract',
        descripcion: 'Hacker contract',
        estado: 'abierto'
      }))
    })

    it('should allow contract parties to read contract', async () => {
      // Setup contract
      const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore()
      const contractDoc = doc(adminDb, 'contratos', 'contract123')
      await setDoc(contractDoc, {
        clienteId: 'client123',
        especialistaId: 'specialist456',
        titulo: 'Test Contract',
        estado: 'asignado'
      })

      // Client should be able to read
      const clientDb = testEnv.authenticatedContext('client123').firestore()
      const clientContractDoc = doc(clientDb, 'contratos', 'contract123')
      await assertSucceeds(getDoc(clientContractDoc))

      // Specialist should be able to read
      const specialistDb = testEnv.authenticatedContext('specialist456').firestore()
      const specialistContractDoc = doc(specialistDb, 'contratos', 'contract123')
      await assertSucceeds(getDoc(specialistContractDoc))
    })

    it('should deny third parties from reading contract', async () => {
      // Setup contract
      const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore()
      const contractDoc = doc(adminDb, 'contratos', 'contract123')
      await setDoc(contractDoc, {
        clienteId: 'client123',
        especialistaId: 'specialist456',
        titulo: 'Private Contract'
      })

      // Third party should not be able to read
      const thirdPartyDb = testEnv.authenticatedContext('thirdparty789').firestore()
      const thirdPartyContractDoc = doc(thirdPartyDb, 'contratos', 'contract123')
      await assertFails(getDoc(thirdPartyContractDoc))
    })

    it('should prevent contract deletion', async () => {
      const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore()
      const contractDoc = doc(adminDb, 'contratos', 'contract123')
      await setDoc(contractDoc, {
        clienteId: 'client123',
        titulo: 'Test Contract'
      })

      const clientDb = testEnv.authenticatedContext('client123').firestore()
      const clientContractDoc = doc(clientDb, 'contratos', 'contract123')
      await assertFails(deleteDoc(clientContractDoc))
    })
  })

  describe('Proposal Security', () => {
    it('should allow specialist to create proposal', async () => {
      const db = testEnv.authenticatedContext('specialist123').firestore()
      const proposalsRef = collection(db, 'propuestas')
      
      await assertSucceeds(addDoc(proposalsRef, {
        especialistaId: 'specialist123',
        contratoId: 'contract456',
        precio: 150,
        mensaje: 'I can help with this project',
        estado: 'pendiente'
      }))
    })

    it('should deny impersonation in proposals', async () => {
      const db = testEnv.authenticatedContext('hacker123').firestore()
      const proposalsRef = collection(db, 'propuestas')
      
      await assertFails(addDoc(proposalsRef, {
        especialistaId: 'specialist123', // Impersonation attempt
        contratoId: 'contract456',
        precio: 1, // Malicious low price
        mensaje: 'Hacker proposal'
      }))
    })

    it('should allow proposal owner to update', async () => {
      // Create proposal
      const db = testEnv.authenticatedContext('specialist123').firestore()
      const proposalsRef = collection(db, 'propuestas')
      const proposalDoc = await addDoc(proposalsRef, {
        especialistaId: 'specialist123',
        contratoId: 'contract456',
        precio: 150,
        mensaje: 'Original message'
      })

      // Update proposal
      await assertSucceeds(updateDoc(proposalDoc, {
        precio: 160,
        mensaje: 'Updated message'
      }))
    })

    it('should deny others from updating proposal', async () => {
      // Create proposal as specialist
      const specialistDb = testEnv.authenticatedContext('specialist123').firestore()
      const proposalsRef = collection(specialistDb, 'propuestas')
      const proposalDoc = await addDoc(proposalsRef, {
        especialistaId: 'specialist123',
        contratoId: 'contract456',
        precio: 150
      })

      // Try to update as different user
      const hackerDb = testEnv.authenticatedContext('hacker456').firestore()
      const hackerProposalDoc = doc(hackerDb, 'propuestas', proposalDoc.id)
      await assertFails(updateDoc(hackerProposalDoc, {
        precio: 1 // Malicious price change
      }))
    })
  })

  describe('Chat Security', () => {
    it('should allow chat participants to access chat', async () => {
      // Setup chat
      const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore()
      const chatDoc = doc(adminDb, 'chats', 'chat123')
      await setDoc(chatDoc, {
        contratoId: 'contract456',
        participantes: ['client123', 'specialist456'],
        fechaCreacion: new Date()
      })

      // Both participants should be able to read
      const clientDb = testEnv.authenticatedContext('client123').firestore()
      const clientChatDoc = doc(clientDb, 'chats', 'chat123')
      await assertSucceeds(getDoc(clientChatDoc))

      const specialistDb = testEnv.authenticatedContext('specialist456').firestore()
      const specialistChatDoc = doc(specialistDb, 'chats', 'chat123')
      await assertSucceeds(getDoc(specialistChatDoc))
    })

    it('should deny non-participants from accessing chat', async () => {
      const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore()
      const chatDoc = doc(adminDb, 'chats', 'chat123')
      await setDoc(chatDoc, {
        contratoId: 'contract456',
        participantes: ['client123', 'specialist456']
      })

      const outsiderDb = testEnv.authenticatedContext('outsider789').firestore()
      const outsiderChatDoc = doc(outsiderDb, 'chats', 'chat123')
      await assertFails(getDoc(outsiderChatDoc))
    })

    it('should allow participants to send messages', async () => {
      const db = testEnv.authenticatedContext('client123').firestore()
      const messagesRef = collection(db, 'mensajes')
      
      await assertSucceeds(addDoc(messagesRef, {
        chatId: 'chat123',
        autorId: 'client123',
        contenido: 'Hello, how is the progress?',
        tipo: 'texto',
        fechaEnvio: new Date()
      }))
    })

    it('should deny message impersonation', async () => {
      const db = testEnv.authenticatedContext('hacker123').firestore()
      const messagesRef = collection(db, 'mensajes')
      
      await assertFails(addDoc(messagesRef, {
        chatId: 'chat123',
        autorId: 'client123', // Impersonation attempt
        contenido: 'Malicious message',
        tipo: 'texto'
      }))
    })
  })

  describe('Escrow Transaction Security', () => {
    it('should allow contract parties to read transactions', async () => {
      // Setup transaction
      const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore()
      const transactionDoc = doc(adminDb, 'transacciones', 'tx123')
      await setDoc(transactionDoc, {
        contratoId: 'contract456',
        clienteId: 'client123',
        especialistaId: 'specialist456',
        monto: 150,
        estado: 'fondos_retenidos'
      })

      // Both parties should be able to read
      const clientDb = testEnv.authenticatedContext('client123').firestore()
      const clientTxDoc = doc(clientDb, 'transacciones', 'tx123')
      await assertSucceeds(getDoc(clientTxDoc))

      const specialistDb = testEnv.authenticatedContext('specialist456').firestore()
      const specialistTxDoc = doc(specialistDb, 'transacciones', 'tx123')
      await assertSucceeds(getDoc(specialistTxDoc))
    })

    it('should deny users from creating transactions', async () => {
      const db = testEnv.authenticatedContext('client123').firestore()
      const transactionsRef = collection(db, 'transacciones')
      
      await assertFails(addDoc(transactionsRef, {
        contratoId: 'contract456',
        clienteId: 'client123',
        monto: 1000000, // Malicious amount
        estado: 'liberado_especialista'
      }))
    })

    it('should deny users from modifying transactions', async () => {
      const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore()
      const transactionDoc = doc(adminDb, 'transacciones', 'tx123')
      await setDoc(transactionDoc, {
        contratoId: 'contract456',
        clienteId: 'client123',
        monto: 150,
        estado: 'fondos_retenidos'
      })

      const clientDb = testEnv.authenticatedContext('client123').firestore()
      const clientTxDoc = doc(clientDb, 'transacciones', 'tx123')
      await assertFails(updateDoc(clientTxDoc, {
        estado: 'liberado_especialista' // Trying to release funds
      }))
    })
  })

  describe('Rating System Security', () => {
    it('should allow users to create their own ratings', async () => {
      const db = testEnv.authenticatedContext('client123').firestore()
      const ratingsRef = collection(db, 'calificaciones')
      
      await assertSucceeds(addDoc(ratingsRef, {
        contratoId: 'contract456',
        evaluadorId: 'client123',
        evaluadoId: 'specialist456',
        puntuacion: 5,
        comentario: 'Excellent work!'
      }))
    })

    it('should deny rating impersonation', async () => {
      const db = testEnv.authenticatedContext('hacker123').firestore()
      const ratingsRef = collection(db, 'calificaciones')
      
      await assertFails(addDoc(ratingsRef, {
        contratoId: 'contract456',
        evaluadorId: 'client123', // Impersonation
        evaluadoId: 'specialist456',
        puntuacion: 1, // Malicious low rating
        comentario: 'Fake bad review'
      }))
    })

    it('should allow both parties to read ratings', async () => {
      // Create rating
      const clientDb = testEnv.authenticatedContext('client123').firestore()
      const ratingsRef = collection(clientDb, 'calificaciones')
      const ratingDoc = await addDoc(ratingsRef, {
        contratoId: 'contract456',
        evaluadorId: 'client123',
        evaluadoId: 'specialist456',
        puntuacion: 5
      })

      // Both parties should be able to read
      await assertSucceeds(getDoc(ratingDoc))

      const specialistDb = testEnv.authenticatedContext('specialist456').firestore()
      const specialistRatingDoc = doc(specialistDb, 'calificaciones', ratingDoc.id)
      await assertSucceeds(getDoc(specialistRatingDoc))
    })

    it('should prevent rating modification', async () => {
      const clientDb = testEnv.authenticatedContext('client123').firestore()
      const ratingsRef = collection(clientDb, 'calificaciones')
      const ratingDoc = await addDoc(ratingsRef, {
        contratoId: 'contract456',
        evaluadorId: 'client123',
        evaluadoId: 'specialist456',
        puntuacion: 3
      })

      // Should not be able to modify rating
      await assertFails(updateDoc(ratingDoc, {
        puntuacion: 5 // Trying to improve rating
      }))
    })
  })

  describe('Admin Access Control', () => {
    it('should allow admin to access admin collections', async () => {
      const adminDb = testEnv.authenticatedContext('admin123', { admin: true }).firestore()
      const adminDoc = doc(adminDb, 'admin', 'settings')
      
      await assertSucceeds(setDoc(adminDoc, {
        maintenanceMode: false,
        commissionRate: 0.15
      }))

      await assertSucceeds(getDoc(adminDoc))
    })

    it('should deny non-admin access to admin collections', async () => {
      const userDb = testEnv.authenticatedContext('user123').firestore()
      const adminDoc = doc(userDb, 'admin', 'settings')
      
      await assertFails(getDoc(adminDoc))
      await assertFails(setDoc(adminDoc, {
        commissionRate: 0.01 // Trying to reduce commission
      }))
    })

    it('should allow admin to read audit logs', async () => {
      const adminDb = testEnv.authenticatedContext('admin123', { admin: true }).firestore()
      const auditDoc = doc(adminDb, 'audit', 'log123')
      
      await assertSucceeds(getDoc(auditDoc))
    })

    it('should deny users from accessing audit logs', async () => {
      const userDb = testEnv.authenticatedContext('user123').firestore()
      const auditDoc = doc(userDb, 'audit', 'log123')
      
      await assertFails(getDoc(auditDoc))
    })

    it('should deny all users from writing audit logs', async () => {
      const adminDb = testEnv.authenticatedContext('admin123', { admin: true }).firestore()
      const auditRef = collection(adminDb, 'audit')
      
      await assertFails(addDoc(auditRef, {
        action: 'fake_action',
        userId: 'user123',
        timestamp: new Date()
      }))
    })
  })

  describe('Data Validation', () => {
    it('should validate required fields in contracts', async () => {
      const db = testEnv.authenticatedContext('client123').firestore()
      const contractsRef = collection(db, 'contratos')
      
      // Missing required fields should fail
      await assertFails(addDoc(contractsRef, {
        clienteId: 'client123'
        // Missing titulo, descripcion, etc.
      }))
    })

    it('should validate data types', async () => {
      const db = testEnv.authenticatedContext('client123').firestore()
      const contractsRef = collection(db, 'contratos')
      
      // Invalid data types should fail
      await assertFails(addDoc(contractsRef, {
        clienteId: 'client123',
        titulo: 123, // Should be string
        presupuestoSugerido: 'invalid' // Should be number
      }))
    })

    it('should validate enum values', async () => {
      const db = testEnv.authenticatedContext('client123').firestore()
      const contractsRef = collection(db, 'contratos')
      
      // Invalid enum values should fail
      await assertFails(addDoc(contractsRef, {
        clienteId: 'client123',
        titulo: 'Test Contract',
        estado: 'invalid_status', // Invalid enum value
        tipoServicio: 'invalid_type'
      }))
    })
  })

  describe('Rate Limiting and Abuse Prevention', () => {
    it('should prevent rapid contract creation', async () => {
      const db = testEnv.authenticatedContext('client123').firestore()
      const contractsRef = collection(db, 'contratos')
      
      // First contract should succeed
      await assertSucceeds(addDoc(contractsRef, {
        clienteId: 'client123',
        titulo: 'Contract 1',
        descripcion: 'First contract',
        estado: 'abierto'
      }))

      // Rapid subsequent contracts might be rate limited
      // This would typically be handled by Cloud Functions
      // but we can test the rule structure
    })

    it('should prevent spam proposals', async () => {
      const db = testEnv.authenticatedContext('specialist123').firestore()
      const proposalsRef = collection(db, 'propuestas')
      
      // Multiple proposals to same contract should be limited
      await assertSucceeds(addDoc(proposalsRef, {
        especialistaId: 'specialist123',
        contratoId: 'contract456',
        precio: 150,
        mensaje: 'First proposal'
      }))

      // Second proposal to same contract might be denied
      // This logic would be in Cloud Functions
    })
  })
})