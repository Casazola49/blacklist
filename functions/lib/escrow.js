"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onEscrowTransactionUpdate = exports.expireQRCodes = exports.refundEscrowFunds = exports.releaseEscrowFunds = exports.confirmEscrowPayment = exports.createEscrowTransaction = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
const stripe_1 = __importDefault(require("stripe"));
const uuid_1 = require("uuid");
const db = (0, firestore_2.getFirestore)();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16'
});
// Create escrow transaction when contract is assigned
exports.createEscrowTransaction = (0, https_1.onCall)(async (request) => {
    const { contratoId, clienteId, especialistaId, monto } = request.data;
    if (!contratoId || !clienteId || !especialistaId || !monto) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields');
    }
    if (monto <= 0) {
        throw new https_1.HttpsError('invalid-argument', 'Amount must be greater than 0');
    }
    try {
        // Verify contract exists and is in correct state
        const contractDoc = await db.collection('contratos').doc(contratoId).get();
        const contract = contractDoc.data();
        if (!contract) {
            throw new https_1.HttpsError('not-found', 'Contract not found');
        }
        if (contract.estado !== 'esperando_deposito') {
            throw new https_1.HttpsError('failed-precondition', 'Contract not in correct state for escrow creation');
        }
        // Calculate platform commission (15%)
        const comisionPlataforma = Math.round(monto * 0.15);
        // Create Stripe Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: monto * 100, // Convert to cents
            currency: 'usd',
            metadata: {
                contratoId,
                clienteId,
                especialistaId,
                tipo: 'escrow_deposit'
            },
            capture_method: 'manual' // We'll capture when work is approved
        });
        // Create escrow transaction
        const transactionId = (0, uuid_1.v4)();
        const escrowTransaction = {
            id: transactionId,
            contratoId,
            clienteId,
            especialistaId,
            monto,
            comisionPlataforma,
            estado: 'pendiente_deposito',
            stripePaymentIntentId: paymentIntent.id,
            referenciaTransaccion: `ESC-${Date.now()}-${transactionId.substring(0, 8).toUpperCase()}`
        };
        // Save transaction to Firestore
        await db.collection('transacciones').doc(transactionId).set(escrowTransaction);
        // Generate QR code data
        const qrData = {
            contratoId,
            monto,
            transactionId,
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret
        };
        // Create payment QR record
        const paymentQR = {
            contratoId,
            monto,
            codigoQR: Buffer.from(JSON.stringify(qrData)).toString('base64'),
            fechaExpiracion: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            estado: 'activo',
            stripePaymentIntentId: paymentIntent.id
        };
        await db.collection('pagos_qr').doc(transactionId).set(paymentQR);
        // Log audit event
        await logAuditEvent('escrow_created', {
            transactionId,
            contratoId,
            clienteId,
            especialistaId,
            monto,
            comisionPlataforma
        });
        return {
            success: true,
            transactionId,
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            qrCode: paymentQR.codigoQR,
            referencia: escrowTransaction.referenciaTransaccion
        };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error creating escrow transaction:', error);
        throw new https_1.HttpsError('internal', 'Failed to create escrow transaction');
    }
});
// Confirm payment and move funds to escrow
exports.confirmEscrowPayment = (0, https_1.onCall)(async (request) => {
    const { transactionId, paymentIntentId } = request.data;
    if (!transactionId || !paymentIntentId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields');
    }
    try {
        // Get transaction
        const transactionDoc = await db.collection('transacciones').doc(transactionId).get();
        const transaction = transactionDoc.data();
        if (!transaction) {
            throw new https_1.HttpsError('not-found', 'Transaction not found');
        }
        if (transaction.estado !== 'pendiente_deposito') {
            throw new https_1.HttpsError('failed-precondition', 'Transaction not in correct state');
        }
        // Verify payment with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
            throw new https_1.HttpsError('failed-precondition', 'Payment not completed');
        }
        // Update transaction status
        await db.collection('transacciones').doc(transactionId).update({
            estado: 'fondos_retenidos',
            fechaDeposito: firestore_2.FieldValue.serverTimestamp()
        });
        // Update contract status
        await db.collection('contratos').doc(transaction.contratoId).update({
            estado: 'fondos_garantia'
        });
        // Update QR code status
        await db.collection('pagos_qr').doc(transactionId).update({
            estado: 'usado'
        });
        // Update client's escrow balance
        await db.collection('usuarios').doc(transaction.clienteId).update({
            saldoEscrow: firestore_2.FieldValue.increment(transaction.monto)
        });
        // Log audit event
        await logAuditEvent('escrow_funded', {
            transactionId,
            contratoId: transaction.contratoId,
            clienteId: transaction.clienteId,
            monto: transaction.monto,
            paymentIntentId
        });
        return { success: true };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error confirming escrow payment:', error);
        throw new https_1.HttpsError('internal', 'Failed to confirm payment');
    }
});
// Release funds to specialist when work is approved
exports.releaseEscrowFunds = (0, https_1.onCall)(async (request) => {
    const { contratoId, clienteId } = request.data;
    if (!contratoId || !clienteId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields');
    }
    try {
        // Get contract
        const contractDoc = await db.collection('contratos').doc(contratoId).get();
        const contract = contractDoc.data();
        if (!contract) {
            throw new https_1.HttpsError('not-found', 'Contract not found');
        }
        if (contract.clienteId !== clienteId) {
            throw new https_1.HttpsError('permission-denied', 'Not authorized to release funds');
        }
        if (contract.estado !== 'entrega_realizada') {
            throw new https_1.HttpsError('failed-precondition', 'Contract not ready for fund release');
        }
        // Get escrow transaction
        const transactionQuery = await db.collection('transacciones')
            .where('contratoId', '==', contratoId)
            .where('estado', '==', 'fondos_retenidos')
            .limit(1)
            .get();
        if (transactionQuery.empty) {
            throw new https_1.HttpsError('not-found', 'Escrow transaction not found');
        }
        const transactionDoc = transactionQuery.docs[0];
        const transaction = transactionDoc.data();
        // Calculate amounts
        const montoEspecialista = transaction.monto - transaction.comisionPlataforma;
        // Get specialist's Stripe account (assuming they have connected accounts)
        const especialistaDoc = await db.collection('usuarios').doc(transaction.especialistaId).get();
        const especialista = especialistaDoc.data();
        if (!(especialista === null || especialista === void 0 ? void 0 : especialista.stripeAccountId)) {
            throw new https_1.HttpsError('failed-precondition', 'Specialist has no payment account configured');
        }
        // Create transfer to specialist
        const transfer = await stripe.transfers.create({
            amount: montoEspecialista * 100, // Convert to cents
            currency: 'usd',
            destination: especialista.stripeAccountId,
            metadata: {
                contratoId,
                transactionId: transaction.id,
                tipo: 'escrow_release'
            }
        });
        // Update transaction
        await db.collection('transacciones').doc(transactionDoc.id).update({
            estado: 'liberado_especialista',
            fechaLiberacion: firestore_2.FieldValue.serverTimestamp(),
            stripeTransferId: transfer.id
        });
        // Update contract
        await db.collection('contratos').doc(contratoId).update({
            estado: 'completado'
        });
        // Update balances
        await db.collection('usuarios').doc(transaction.clienteId).update({
            saldoEscrow: firestore_2.FieldValue.increment(-transaction.monto)
        });
        await db.collection('usuarios').doc(transaction.especialistaId).update({
            gananciasTotal: firestore_2.FieldValue.increment(montoEspecialista),
            trabajosCompletados: firestore_2.FieldValue.increment(1)
        });
        // Record platform commission
        await db.collection('comisiones').add({
            transactionId: transaction.id,
            contratoId,
            monto: transaction.comisionPlataforma,
            fecha: firestore_2.FieldValue.serverTimestamp(),
            tipo: 'escrow_release'
        });
        // Log audit event
        await logAuditEvent('escrow_released', {
            transactionId: transaction.id,
            contratoId,
            especialistaId: transaction.especialistaId,
            montoEspecialista,
            comisionPlataforma: transaction.comisionPlataforma,
            transferId: transfer.id
        });
        return {
            success: true,
            montoLiberado: montoEspecialista,
            comisionPlataforma: transaction.comisionPlataforma
        };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error releasing escrow funds:', error);
        throw new https_1.HttpsError('internal', 'Failed to release funds');
    }
});
// Refund funds to client in case of dispute resolution
exports.refundEscrowFunds = (0, https_1.onCall)(async (request) => {
    const { contratoId, adminId, razon } = request.data;
    if (!contratoId || !adminId || !razon) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields');
    }
    try {
        // Verify admin permissions
        const adminDoc = await db.collection('usuarios').doc(adminId).get();
        const admin = adminDoc.data();
        if (!admin || admin.tipo !== 'admin') {
            throw new https_1.HttpsError('permission-denied', 'Not authorized to refund funds');
        }
        // Get escrow transaction
        const transactionQuery = await db.collection('transacciones')
            .where('contratoId', '==', contratoId)
            .where('estado', 'in', ['fondos_retenidos', 'en_disputa'])
            .limit(1)
            .get();
        if (transactionQuery.empty) {
            throw new https_1.HttpsError('not-found', 'Escrow transaction not found');
        }
        const transactionDoc = transactionQuery.docs[0];
        const transaction = transactionDoc.data();
        // Create refund in Stripe
        const refund = await stripe.refunds.create({
            payment_intent: transaction.stripePaymentIntentId,
            amount: transaction.monto * 100, // Full refund
            reason: 'requested_by_customer',
            metadata: {
                contratoId,
                transactionId: transaction.id,
                adminId,
                razon
            }
        });
        // Update transaction
        await db.collection('transacciones').doc(transactionDoc.id).update({
            estado: 'reembolsado_cliente',
            fechaLiberacion: firestore_2.FieldValue.serverTimestamp()
        });
        // Update contract
        await db.collection('contratos').doc(contratoId).update({
            estado: 'cancelado'
        });
        // Update client balance
        await db.collection('usuarios').doc(transaction.clienteId).update({
            saldoEscrow: firestore_2.FieldValue.increment(-transaction.monto)
        });
        // Log audit event
        await logAuditEvent('escrow_refunded', {
            transactionId: transaction.id,
            contratoId,
            clienteId: transaction.clienteId,
            monto: transaction.monto,
            adminId,
            razon,
            refundId: refund.id
        });
        return {
            success: true,
            montoReembolsado: transaction.monto,
            refundId: refund.id
        };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error refunding escrow funds:', error);
        throw new https_1.HttpsError('internal', 'Failed to refund funds');
    }
});
// Auto-expire QR codes
exports.expireQRCodes = (0, https_1.onCall)(async () => {
    try {
        const now = new Date();
        const expiredQRQuery = await db.collection('pagos_qr')
            .where('fechaExpiracion', '<=', now)
            .where('estado', '==', 'activo')
            .get();
        const batch = db.batch();
        let expiredCount = 0;
        expiredQRQuery.docs.forEach(doc => {
            batch.update(doc.ref, { estado: 'expirado' });
            expiredCount++;
        });
        if (expiredCount > 0) {
            await batch.commit();
            firebase_functions_1.logger.info(`Expired ${expiredCount} QR codes`);
        }
        return { success: true, expiredCount };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error expiring QR codes:', error);
        throw new https_1.HttpsError('internal', 'Failed to expire QR codes');
    }
});
// Monitor escrow transactions for issues
exports.onEscrowTransactionUpdate = (0, firestore_1.onDocumentUpdated)('transacciones/{transactionId}', async (event) => {
    var _a, _b, _c;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!before || !after)
        return;
    const transactionId = event.params.transactionId;
    try {
        // Check for state changes that need notifications
        if (before.estado !== after.estado) {
            await handleEscrowStateChange(transactionId, before.estado, after.estado, after);
        }
        // Check for stuck transactions (more than 24 hours in pending_deposito)
        if (after.estado === 'pendiente_deposito') {
            const createdAt = ((_c = after.fechaCreacion) === null || _c === void 0 ? void 0 : _c.toDate()) || new Date();
            const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
            if (hoursSinceCreation > 24) {
                firebase_functions_1.logger.warn(`Transaction ${transactionId} stuck in pending_deposito for ${hoursSinceCreation} hours`);
                // Auto-cancel stuck transactions
                await db.collection('transacciones').doc(transactionId).update({
                    estado: 'cancelado',
                    razonCancelacion: 'timeout_deposito'
                });
                // Cancel associated contract
                await db.collection('contratos').doc(after.contratoId).update({
                    estado: 'cancelado'
                });
            }
        }
    }
    catch (error) {
        firebase_functions_1.logger.error('Error handling escrow transaction update:', error);
    }
});
// Helper function to handle escrow state changes
async function handleEscrowStateChange(transactionId, oldState, newState, transactionData) {
    // This would trigger appropriate notifications
    // Implementation depends on notification system
    firebase_functions_1.logger.info(`Escrow transaction ${transactionId} changed from ${oldState} to ${newState}`);
}
// Helper function for audit logging
async function logAuditEvent(action, data) {
    try {
        await db.collection('audit_logs').add({
            action,
            data,
            timestamp: firestore_2.FieldValue.serverTimestamp(),
            service: 'escrow'
        });
    }
    catch (error) {
        firebase_functions_1.logger.error('Error logging audit event:', error);
    }
}
//# sourceMappingURL=escrow.js.map