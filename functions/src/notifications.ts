import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getMessaging } from 'firebase-admin/messaging'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import * as nodemailer from 'nodemailer'

const db = getFirestore()
const messaging = getMessaging()

// Email transporter configuration
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

// Send push notification to user
export const sendPushNotification = onCall(async (request) => {
  const { userId, title, body, data } = request.data

  if (!userId || !title || !body) {
    throw new HttpsError('invalid-argument', 'Missing required fields')
  }

  try {
    // Get user's FCM tokens
    const userDoc = await db.collection('usuarios').doc(userId).get()
    const userData = userDoc.data()
    
    if (!userData?.fcmTokens || userData.fcmTokens.length === 0) {
      logger.warn(`No FCM tokens found for user ${userId}`)
      return { success: false, reason: 'No FCM tokens' }
    }

    // Send notification to all user's devices
    const messages = userData.fcmTokens.map((token: string) => ({
      token,
      notification: {
        title,
        body
      },
      data: data || {},
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#00FFFF',
          sound: 'default',
          channelId: 'the_blacklist_notifications'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      },
      webpush: {
        notification: {
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          vibrate: [200, 100, 200],
          requireInteraction: data?.priority === 'high'
        }
      }
    }))

    const response = await messaging.sendEach(messages)
    
    // Clean up invalid tokens
    const invalidTokens: string[] = []
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        logger.error(`Failed to send to token ${userData.fcmTokens[idx]}:`, resp.error)
        if (resp.error?.code === 'messaging/invalid-registration-token' ||
            resp.error?.code === 'messaging/registration-token-not-registered') {
          invalidTokens.push(userData.fcmTokens[idx])
        }
      }
    })

    // Remove invalid tokens from user document
    if (invalidTokens.length > 0) {
      const validTokens = userData.fcmTokens.filter((token: string) => 
        !invalidTokens.includes(token)
      )
      
      await db.collection('usuarios').doc(userId).update({
        fcmTokens: validTokens
      })
    }

    return { 
      success: true, 
      successCount: response.successCount,
      failureCount: response.failureCount 
    }
  } catch (error) {
    logger.error('Error sending push notification:', error)
    throw new HttpsError('internal', 'Failed to send notification')
  }
})

// Send email notification
export const sendEmailNotification = onCall(async (request) => {
  const { to, subject, template, data } = request.data

  if (!to || !subject || !template) {
    throw new HttpsError('invalid-argument', 'Missing required fields')
  }

  try {
    const htmlContent = generateEmailTemplate(template, data)
    
    const mailOptions = {
      from: `"The Blacklist" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent
    }

    await emailTransporter.sendMail(mailOptions)
    
    return { success: true }
  } catch (error) {
    logger.error('Error sending email notification:', error)
    throw new HttpsError('internal', 'Failed to send email')
  }
})

// Auto-send notifications on contract changes
export const onContractChange = onDocumentUpdated('contratos/{contractId}', async (event) => {
  const before = event.data?.before.data()
  const after = event.data?.after.data()
  
  if (!before || !after) return

  const contractId = event.params.contractId
  
  // Check for state changes
  if (before.estado !== after.estado) {
    await handleContractStateChange(contractId, before.estado, after.estado, after)
  }
})

// Auto-send notifications on new proposals
export const onNewProposal = onDocumentCreated('propuestas/{proposalId}', async (event) => {
  const proposal = event.data?.data()
  if (!proposal) return

  try {
    // Get contract details
    const contractDoc = await db.collection('contratos').doc(proposal.contratoId).get()
    const contract = contractDoc.data()
    
    if (!contract) return

    // Notify client about new proposal
    await sendNotificationToUser(
      contract.clienteId,
      'propuesta_recibida',
      '📋 Nueva Propuesta Recibida',
      `Recibiste una propuesta de $${proposal.precio} para "${contract.titulo}"`,
      { 
        contratoId: proposal.contratoId,
        propuestaId: event.params.proposalId,
        precio: proposal.precio
      }
    )
  } catch (error) {
    logger.error('Error handling new proposal notification:', error)
  }
})

// Auto-send notifications on new messages
export const onNewMessage = onDocumentCreated('mensajes/{messageId}', async (event) => {
  const message = event.data?.data()
  if (!message) return

  try {
    // Get chat details
    const chatDoc = await db.collection('chats').doc(message.chatId).get()
    const chat = chatDoc.data()
    
    if (!chat) return

    // Notify other participants
    const otherParticipants = chat.participantes.filter((id: string) => id !== message.autorId)
    
    for (const participantId of otherParticipants) {
      await sendNotificationToUser(
        participantId,
        'mensaje_chat',
        '💬 Nuevo Mensaje',
        `Tienes un nuevo mensaje: "${message.contenido.substring(0, 50)}..."`,
        {
          chatId: message.chatId,
          mensajeId: event.params.messageId
        }
      )
    }
  } catch (error) {
    logger.error('Error handling new message notification:', error)
  }
})

// Helper function to handle contract state changes
async function handleContractStateChange(
  contractId: string,
  oldState: string,
  newState: string,
  contractData: any
) {
  try {
    switch (newState) {
      case 'esperando_deposito':
        if (contractData.clienteId) {
          await sendNotificationToUser(
            contractData.clienteId,
            'contrato_asignado',
            '💳 Depósito Requerido',
            `Tu propuesta fue aceptada. Realiza el depósito para "${contractData.titulo}"`,
            { contratoId: contractId }
          )
        }
        break

      case 'fondos_garantia':
        if (contractData.especialistaId) {
          await sendNotificationToUser(
            contractData.especialistaId,
            'contrato_asignado',
            '✅ Contrato Asignado',
            `Puedes comenzar a trabajar en "${contractData.titulo}"`,
            { contratoId: contractId }
          )
        }
        break

      case 'entrega_realizada':
        if (contractData.clienteId) {
          await sendNotificationToUser(
            contractData.clienteId,
            'trabajo_entregado',
            '📤 Trabajo Entregado',
            `El especialista entregó el trabajo para "${contractData.titulo}"`,
            { contratoId: contractId }
          )
        }
        break

      case 'completado':
        if (contractData.especialistaId) {
          await sendNotificationToUser(
            contractData.especialistaId,
            'pago_recibido',
            '💰 Pago Liberado',
            `El cliente aprobó tu trabajo para "${contractData.titulo}"`,
            { contratoId: contractId }
          )
        }
        break
    }
  } catch (error) {
    logger.error('Error handling contract state change:', error)
  }
}

// Helper function to send notification to user
async function sendNotificationToUser(
  userId: string,
  tipo: string,
  titulo: string,
  mensaje: string,
  datos?: any
) {
  try {
    // Get user preferences
    const userDoc = await db.collection('usuarios').doc(userId).get()
    const userData = userDoc.data()
    
    if (!userData) return

    const preferences = userData.preferenciasNotificacion || {}
    
    // Check if user wants this type of notification
    if (!shouldSendNotification(tipo, preferences)) {
      return
    }

    // Send push notification if enabled
    if (preferences.push !== false) {
      await sendPushNotificationInternal(userId, titulo, mensaje, { tipo, ...datos })
    }

    // Send email notification if enabled
    if (preferences.email !== false && userData.email) {
      await sendEmailNotificationInternal(
        userData.email,
        titulo,
        getEmailTemplate(tipo),
        {
          titulo,
          mensaje,
          alias: userData.alias,
          ...datos
        }
      )
    }

    // Store notification in user document
    const notification = {
      id: crypto.randomUUID(),
      tipo,
      titulo,
      mensaje,
      datos,
      prioridad: getNotificationPriority(tipo),
      fechaCreacion: new Date(),
      leida: false
    }

    await db.collection('usuarios').doc(userId).update({
      notificaciones: FieldValue.arrayUnion(notification)
    })
  } catch (error) {
    logger.error('Error sending notification to user:', error)
  }
}

// Helper functions
function shouldSendNotification(tipo: string, preferences: any): boolean {
  const mapping: Record<string, string> = {
    'nuevo_contrato': 'nuevoContrato',
    'propuesta_recibida': 'propuestaRecibida',
    'contrato_asignado': 'contratoAsignado',
    'pago_recibido': 'pagoRecibido',
    'trabajo_entregado': 'trabajoEntregado',
    'calificacion_recibida': 'calificacionRecibida',
    'mensaje_chat': 'mensajeChat',
    'recordatorio': 'recordatorios'
  }
  
  const prefKey = mapping[tipo]
  return prefKey ? preferences[prefKey] !== false : true
}

function getNotificationPriority(tipo: string): 'alta' | 'media' | 'baja' {
  switch (tipo) {
    case 'pago_recibido':
    case 'contrato_asignado':
      return 'alta'
    case 'propuesta_recibida':
    case 'trabajo_entregado':
    case 'mensaje_chat':
      return 'media'
    default:
      return 'baja'
  }
}

function getEmailTemplate(tipo: string): string {
  const templates: Record<string, string> = {
    'nuevo_contrato': 'nuevo-contrato',
    'propuesta_recibida': 'propuesta-recibida',
    'contrato_asignado': 'contrato-asignado',
    'pago_recibido': 'pago-recibido',
    'trabajo_entregado': 'trabajo-entregado',
    'calificacion_recibida': 'calificacion-recibida',
    'mensaje_chat': 'mensaje-chat',
    'recordatorio': 'recordatorio'
  }
  
  return templates[tipo] || 'default'
}

function generateEmailTemplate(template: string, data: any): string {
  // This would generate HTML email templates
  // For now, return a simple template
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #eaeaea;">
      <div style="background: linear-gradient(135deg, #800020, #a00030); padding: 20px; text-align: center;">
        <h1 style="color: #00ffff; margin: 0;">The Blacklist</h1>
      </div>
      <div style="padding: 30px;">
        <h2 style="color: #00ffff;">${data.titulo}</h2>
        <p style="font-size: 16px; line-height: 1.6;">${data.mensaje}</p>
        <div style="margin: 30px 0; padding: 20px; background: #1a1a1a; border-left: 4px solid #00ffff;">
          <p style="margin: 0;">Hola ${data.alias || 'Usuario'},</p>
          <p>Accede a tu dashboard para ver más detalles.</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.APP_URL}/dashboard" 
             style="background: #00ffff; color: #0a0a0a; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Ir al Dashboard
          </a>
        </div>
      </div>
      <div style="background: #1a1a1a; padding: 20px; text-align: center; font-size: 12px; color: #888;">
        <p>© 2024 The Blacklist. Todos los derechos reservados.</p>
      </div>
    </div>
  `
}

// Internal helper functions
async function sendPushNotificationInternal(userId: string, title: string, body: string, data?: any) {
  try {
    // Get user's FCM tokens
    const userDoc = await db.collection('usuarios').doc(userId).get()
    const userData = userDoc.data()
    
    if (!userData?.fcmTokens || userData.fcmTokens.length === 0) {
      return
    }

    // Send notification to all user's devices
    const messages = userData.fcmTokens.map((token: string) => ({
      token,
      notification: { title, body },
      data: data || {},
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#00FFFF',
          sound: 'default',
          channelId: 'the_blacklist_notifications'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      },
      webpush: {
        notification: {
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          vibrate: [200, 100, 200],
          requireInteraction: data?.priority === 'high'
        }
      }
    }))

    await messaging.sendEach(messages)
  } catch (error) {
    logger.error('Error sending push notification:', error)
  }
}

async function sendEmailNotificationInternal(to: string, subject: string, template: string, data: any) {
  try {
    const htmlContent = generateEmailTemplate(template, data)
    
    const mailOptions = {
      from: `"The Blacklist" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent
    }

    await emailTransporter.sendMail(mailOptions)
  } catch (error) {
    logger.error('Error sending email notification:', error)
  }
}