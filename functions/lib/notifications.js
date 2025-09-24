"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onNewMessage = exports.onNewProposal = exports.onContractChange = exports.sendEmailNotification = exports.sendPushNotification = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const messaging_1 = require("firebase-admin/messaging");
const firestore_2 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
const nodemailer = __importStar(require("nodemailer"));
const db = (0, firestore_2.getFirestore)();
const messaging = (0, messaging_1.getMessaging)();
// Email transporter configuration
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});
// Send push notification to user
exports.sendPushNotification = (0, https_1.onCall)(async (request) => {
    const { userId, title, body, data } = request.data;
    if (!userId || !title || !body) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields');
    }
    try {
        // Get user's FCM tokens
        const userDoc = await db.collection('usuarios').doc(userId).get();
        const userData = userDoc.data();
        if (!(userData === null || userData === void 0 ? void 0 : userData.fcmTokens) || userData.fcmTokens.length === 0) {
            firebase_functions_1.logger.warn(`No FCM tokens found for user ${userId}`);
            return { success: false, reason: 'No FCM tokens' };
        }
        // Send notification to all user's devices
        const messages = userData.fcmTokens.map((token) => ({
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
                    requireInteraction: (data === null || data === void 0 ? void 0 : data.priority) === 'high'
                }
            }
        }));
        const response = await messaging.sendEach(messages);
        // Clean up invalid tokens
        const invalidTokens = [];
        response.responses.forEach((resp, idx) => {
            var _a, _b;
            if (!resp.success) {
                firebase_functions_1.logger.error(`Failed to send to token ${userData.fcmTokens[idx]}:`, resp.error);
                if (((_a = resp.error) === null || _a === void 0 ? void 0 : _a.code) === 'messaging/invalid-registration-token' ||
                    ((_b = resp.error) === null || _b === void 0 ? void 0 : _b.code) === 'messaging/registration-token-not-registered') {
                    invalidTokens.push(userData.fcmTokens[idx]);
                }
            }
        });
        // Remove invalid tokens from user document
        if (invalidTokens.length > 0) {
            const validTokens = userData.fcmTokens.filter((token) => !invalidTokens.includes(token));
            await db.collection('usuarios').doc(userId).update({
                fcmTokens: validTokens
            });
        }
        return {
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount
        };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error sending push notification:', error);
        throw new https_1.HttpsError('internal', 'Failed to send notification');
    }
});
// Send email notification
exports.sendEmailNotification = (0, https_1.onCall)(async (request) => {
    const { to, subject, template, data } = request.data;
    if (!to || !subject || !template) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields');
    }
    try {
        const htmlContent = generateEmailTemplate(template, data);
        const mailOptions = {
            from: `"The Blacklist" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent
        };
        await emailTransporter.sendMail(mailOptions);
        return { success: true };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error sending email notification:', error);
        throw new https_1.HttpsError('internal', 'Failed to send email');
    }
});
// Auto-send notifications on contract changes
exports.onContractChange = (0, firestore_1.onDocumentUpdated)('contratos/{contractId}', async (event) => {
    var _a, _b;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!before || !after)
        return;
    const contractId = event.params.contractId;
    // Check for state changes
    if (before.estado !== after.estado) {
        await handleContractStateChange(contractId, before.estado, after.estado, after);
    }
});
// Auto-send notifications on new proposals
exports.onNewProposal = (0, firestore_1.onDocumentCreated)('propuestas/{proposalId}', async (event) => {
    var _a;
    const proposal = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!proposal)
        return;
    try {
        // Get contract details
        const contractDoc = await db.collection('contratos').doc(proposal.contratoId).get();
        const contract = contractDoc.data();
        if (!contract)
            return;
        // Notify client about new proposal
        await sendNotificationToUser(contract.clienteId, 'propuesta_recibida', '📋 Nueva Propuesta Recibida', `Recibiste una propuesta de $${proposal.precio} para "${contract.titulo}"`, {
            contratoId: proposal.contratoId,
            propuestaId: event.params.proposalId,
            precio: proposal.precio
        });
    }
    catch (error) {
        firebase_functions_1.logger.error('Error handling new proposal notification:', error);
    }
});
// Auto-send notifications on new messages
exports.onNewMessage = (0, firestore_1.onDocumentCreated)('mensajes/{messageId}', async (event) => {
    var _a;
    const message = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!message)
        return;
    try {
        // Get chat details
        const chatDoc = await db.collection('chats').doc(message.chatId).get();
        const chat = chatDoc.data();
        if (!chat)
            return;
        // Notify other participants
        const otherParticipants = chat.participantes.filter((id) => id !== message.autorId);
        for (const participantId of otherParticipants) {
            await sendNotificationToUser(participantId, 'mensaje_chat', '💬 Nuevo Mensaje', `Tienes un nuevo mensaje: "${message.contenido.substring(0, 50)}..."`, {
                chatId: message.chatId,
                mensajeId: event.params.messageId
            });
        }
    }
    catch (error) {
        firebase_functions_1.logger.error('Error handling new message notification:', error);
    }
});
// Helper function to handle contract state changes
async function handleContractStateChange(contractId, oldState, newState, contractData) {
    try {
        switch (newState) {
            case 'esperando_deposito':
                if (contractData.clienteId) {
                    await sendNotificationToUser(contractData.clienteId, 'contrato_asignado', '💳 Depósito Requerido', `Tu propuesta fue aceptada. Realiza el depósito para "${contractData.titulo}"`, { contratoId: contractId });
                }
                break;
            case 'fondos_garantia':
                if (contractData.especialistaId) {
                    await sendNotificationToUser(contractData.especialistaId, 'contrato_asignado', '✅ Contrato Asignado', `Puedes comenzar a trabajar en "${contractData.titulo}"`, { contratoId: contractId });
                }
                break;
            case 'entrega_realizada':
                if (contractData.clienteId) {
                    await sendNotificationToUser(contractData.clienteId, 'trabajo_entregado', '📤 Trabajo Entregado', `El especialista entregó el trabajo para "${contractData.titulo}"`, { contratoId: contractId });
                }
                break;
            case 'completado':
                if (contractData.especialistaId) {
                    await sendNotificationToUser(contractData.especialistaId, 'pago_recibido', '💰 Pago Liberado', `El cliente aprobó tu trabajo para "${contractData.titulo}"`, { contratoId: contractId });
                }
                break;
        }
    }
    catch (error) {
        firebase_functions_1.logger.error('Error handling contract state change:', error);
    }
}
// Helper function to send notification to user
async function sendNotificationToUser(userId, tipo, titulo, mensaje, datos) {
    try {
        // Get user preferences
        const userDoc = await db.collection('usuarios').doc(userId).get();
        const userData = userDoc.data();
        if (!userData)
            return;
        const preferences = userData.preferenciasNotificacion || {};
        // Check if user wants this type of notification
        if (!shouldSendNotification(tipo, preferences)) {
            return;
        }
        // Send push notification if enabled
        if (preferences.push !== false) {
            await sendPushNotificationInternal(userId, titulo, mensaje, Object.assign({ tipo }, datos));
        }
        // Send email notification if enabled
        if (preferences.email !== false && userData.email) {
            await sendEmailNotificationInternal(userData.email, titulo, getEmailTemplate(tipo), Object.assign({ titulo,
                mensaje, alias: userData.alias }, datos));
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
        };
        await db.collection('usuarios').doc(userId).update({
            notificaciones: firestore_2.FieldValue.arrayUnion(notification)
        });
    }
    catch (error) {
        firebase_functions_1.logger.error('Error sending notification to user:', error);
    }
}
// Helper functions
function shouldSendNotification(tipo, preferences) {
    const mapping = {
        'nuevo_contrato': 'nuevoContrato',
        'propuesta_recibida': 'propuestaRecibida',
        'contrato_asignado': 'contratoAsignado',
        'pago_recibido': 'pagoRecibido',
        'trabajo_entregado': 'trabajoEntregado',
        'calificacion_recibida': 'calificacionRecibida',
        'mensaje_chat': 'mensajeChat',
        'recordatorio': 'recordatorios'
    };
    const prefKey = mapping[tipo];
    return prefKey ? preferences[prefKey] !== false : true;
}
function getNotificationPriority(tipo) {
    switch (tipo) {
        case 'pago_recibido':
        case 'contrato_asignado':
            return 'alta';
        case 'propuesta_recibida':
        case 'trabajo_entregado':
        case 'mensaje_chat':
            return 'media';
        default:
            return 'baja';
    }
}
function getEmailTemplate(tipo) {
    const templates = {
        'nuevo_contrato': 'nuevo-contrato',
        'propuesta_recibida': 'propuesta-recibida',
        'contrato_asignado': 'contrato-asignado',
        'pago_recibido': 'pago-recibido',
        'trabajo_entregado': 'trabajo-entregado',
        'calificacion_recibida': 'calificacion-recibida',
        'mensaje_chat': 'mensaje-chat',
        'recordatorio': 'recordatorio'
    };
    return templates[tipo] || 'default';
}
function generateEmailTemplate(template, data) {
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
  `;
}
// Internal helper functions
async function sendPushNotificationInternal(userId, title, body, data) {
    try {
        // Get user's FCM tokens
        const userDoc = await db.collection('usuarios').doc(userId).get();
        const userData = userDoc.data();
        if (!(userData === null || userData === void 0 ? void 0 : userData.fcmTokens) || userData.fcmTokens.length === 0) {
            return;
        }
        // Send notification to all user's devices
        const messages = userData.fcmTokens.map((token) => ({
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
                    requireInteraction: (data === null || data === void 0 ? void 0 : data.priority) === 'high'
                }
            }
        }));
        await messaging.sendEach(messages);
    }
    catch (error) {
        firebase_functions_1.logger.error('Error sending push notification:', error);
    }
}
async function sendEmailNotificationInternal(to, subject, template, data) {
    try {
        const htmlContent = generateEmailTemplate(template, data);
        const mailOptions = {
            from: `"The Blacklist" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent
        };
        await emailTransporter.sendMail(mailOptions);
    }
    catch (error) {
        firebase_functions_1.logger.error('Error sending email notification:', error);
    }
}
//# sourceMappingURL=notifications.js.map