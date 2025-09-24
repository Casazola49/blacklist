import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import Stripe from 'stripe'
import { v4 as uuidv4 } from 'uuid'

const db = getFirestore()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
})

// Types
interface EscrowTransaction {
  id: string
  contratoId: string
  clienteId: string
  especialistaId: string
  monto: number
  comisionPlataforma: number
  estado: 'pendiente_deposito' | 'fondos_retenidos' | 'liberado_especialista' | 'reembolsado_cliente' | 'en_disputa'
  fechaDeposito?: Date
  fechaLiberacion?: Date
  stripePaymentIntentId?: string
  stripeTransferId?: string
  referenciaTransaccion?: string
}

interface PaymentQR {
  contratoId: string
  monto: number
  codigoQR: string
  fechaExpiracion: Date
  estado: 'activo' | 'usado' | 'expirado'
  stripePaymentIntentId: string
}

// Create escrow transaction when contract is assigned
export const createEscrowTransaction = onCall(async (request) => {
  const { contratoId, clienteId, especialistaId, monto } = request.data

  if (!contratoId || !clienteId || !especialistaId || !monto) {
    throw new HttpsError('invalid-argument', 'Missing required fields')
  }

  if (monto <= 0) {
    throw new HttpsError('invalid-argument', 'Amount must be greater than 0')
  }

  try {
    // Verify contract exists and is in correct state
    const contractDoc = await db.collection('contratos').doc(contratoId).get()
    const contract = contractDoc.data()

    if (!contract) {
      throw new HttpsError('not-found', 'Contract not found')
    }

    if (contract.estado !== 'esperando_deposito') {
      throw new HttpsError('failed-precondition', 'Contract not in correct state for escrow creation')
    }

    // Calculate platform commission (15%)
    const comisionPlataforma = Math.round(monto * 0.15)

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
    })

    // Create escrow transaction
    const transactionId = uuidv4()
    const escrowTransaction: EscrowTransaction = {
      id: transactionId,
      contratoId,
      clienteId,
      especialistaId,
      monto,
      comisionPlataforma,
      estado: 'pendiente_deposito',
      stripePaymentIntentId: paymentIntent.id,
      referenciaTransaccion: `ESC-${Date.now()}-${transactionId.substring(0, 8).toUpperCase()}`
    }

    // Save transaction to Firestore
    await db.collection('transacciones').doc(transactionId).set(escrowTransaction)

    // Generate QR code data
    const qrData = {
      contratoId,
      monto,
      transactionId,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret
    }

    // Create payment QR record
    const paymentQR: PaymentQR = {
      contratoId,
      monto,
      codigoQR: Buffer.from(JSON.stringify(qrData)).toString('base64'),
      fechaExpiracion: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      estado: 'activo',
      stripePaymentIntentId: paymentIntent.id
    }

    await db.collection('pagos_qr').doc(transactionId).set(paymentQR)

    // Log audit event
    await logAuditEvent('escrow_created', {
      transactionId,
      contratoId,
      clienteId,
      especialistaId,
      monto,
      comisionPlataforma
    })

    return {
      success: true,
      transactionId,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      qrCode: paymentQR.codigoQR,
      referencia: escrowTransaction.referenciaTransaccion
    }
  } catch (error) {
    logger.error('Error creating escrow transaction:', error)
    throw new HttpsError('internal', 'Failed to create escrow transaction')
  }
})

// Confirm payment and move funds to escrow
export const confirmEscrowPayment = onCall(async (request) => {
  const { transactionId, paymentIntentId } = request.data

  if (!transactionId || !paymentIntentId) {
    throw new HttpsError('invalid-argument', 'Missing required fields')
  }

  try {
    // Get transaction
    const transactionDoc = await db.collection('transacciones').doc(transactionId).get()
    const transaction = transactionDoc.data() as EscrowTransaction

    if (!transaction) {
      throw new HttpsError('not-found', 'Transaction not found')
    }

    if (transaction.estado !== 'pendiente_deposito') {
      throw new HttpsError('failed-precondition', 'Transaction not in correct state')
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      throw new HttpsError('failed-precondition', 'Payment not completed')
    }

    // Update transaction status
    await db.collection('transacciones').doc(transactionId).update({
      estado: 'fondos_retenidos',
      fechaDeposito: FieldValue.serverTimestamp()
    })

    // Update contract status
    await db.collection('contratos').doc(transaction.contratoId).update({
      estado: 'fondos_garantia'
    })

    // Update QR code status
    await db.collection('pagos_qr').doc(transactionId).update({
      estado: 'usado'
    })

    // Update client's escrow balance
    await db.collection('usuarios').doc(transaction.clienteId).update({
      saldoEscrow: FieldValue.increment(transaction.monto)
    })

    // Log audit event
    await logAuditEvent('escrow_funded', {
      transactionId,
      contratoId: transaction.contratoId,
      clienteId: transaction.clienteId,
      monto: transaction.monto,
      paymentIntentId
    })

    return { success: true }
  } catch (error) {
    logger.error('Error confirming escrow payment:', error)
    throw new HttpsError('internal', 'Failed to confirm payment')
  }
})

// Release funds to specialist when work is approved
export const releaseEscrowFunds = onCall(async (request) => {
  const { contratoId, clienteId } = request.data

  if (!contratoId || !clienteId) {
    throw new HttpsError('invalid-argument', 'Missing required fields')
  }

  try {
    // Get contract
    const contractDoc = await db.collection('contratos').doc(contratoId).get()
    const contract = contractDoc.data()

    if (!contract) {
      throw new HttpsError('not-found', 'Contract not found')
    }

    if (contract.clienteId !== clienteId) {
      throw new HttpsError('permission-denied', 'Not authorized to release funds')
    }

    if (contract.estado !== 'entrega_realizada') {
      throw new HttpsError('failed-precondition', 'Contract not ready for fund release')
    }

    // Get escrow transaction
    const transactionQuery = await db.collection('transacciones')
      .where('contratoId', '==', contratoId)
      .where('estado', '==', 'fondos_retenidos')
      .limit(1)
      .get()

    if (transactionQuery.empty) {
      throw new HttpsError('not-found', 'Escrow transaction not found')
    }

    const transactionDoc = transactionQuery.docs[0]
    const transaction = transactionDoc.data() as EscrowTransaction

    // Calculate amounts
    const montoEspecialista = transaction.monto - transaction.comisionPlataforma

    // Get specialist's Stripe account (assuming they have connected accounts)
    const especialistaDoc = await db.collection('usuarios').doc(transaction.especialistaId).get()
    const especialista = especialistaDoc.data()

    if (!especialista?.stripeAccountId) {
      throw new HttpsError('failed-precondition', 'Specialist has no payment account configured')
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
    })

    // Update transaction
    await db.collection('transacciones').doc(transactionDoc.id).update({
      estado: 'liberado_especialista',
      fechaLiberacion: FieldValue.serverTimestamp(),
      stripeTransferId: transfer.id
    })

    // Update contract
    await db.collection('contratos').doc(contratoId).update({
      estado: 'completado'
    })

    // Update balances
    await db.collection('usuarios').doc(transaction.clienteId).update({
      saldoEscrow: FieldValue.increment(-transaction.monto)
    })

    await db.collection('usuarios').doc(transaction.especialistaId).update({
      gananciasTotal: FieldValue.increment(montoEspecialista),
      trabajosCompletados: FieldValue.increment(1)
    })

    // Record platform commission
    await db.collection('comisiones').add({
      transactionId: transaction.id,
      contratoId,
      monto: transaction.comisionPlataforma,
      fecha: FieldValue.serverTimestamp(),
      tipo: 'escrow_release'
    })

    // Log audit event
    await logAuditEvent('escrow_released', {
      transactionId: transaction.id,
      contratoId,
      especialistaId: transaction.especialistaId,
      montoEspecialista,
      comisionPlataforma: transaction.comisionPlataforma,
      transferId: transfer.id
    })

    return { 
      success: true,
      montoLiberado: montoEspecialista,
      comisionPlataforma: transaction.comisionPlataforma
    }
  } catch (error) {
    logger.error('Error releasing escrow funds:', error)
    throw new HttpsError('internal', 'Failed to release funds')
  }
})

// Refund funds to client in case of dispute resolution
export const refundEscrowFunds = onCall(async (request) => {
  const { contratoId, adminId, razon } = request.data

  if (!contratoId || !adminId || !razon) {
    throw new HttpsError('invalid-argument', 'Missing required fields')
  }

  try {
    // Verify admin permissions
    const adminDoc = await db.collection('usuarios').doc(adminId).get()
    const admin = adminDoc.data()

    if (!admin || admin.tipo !== 'admin') {
      throw new HttpsError('permission-denied', 'Not authorized to refund funds')
    }

    // Get escrow transaction
    const transactionQuery = await db.collection('transacciones')
      .where('contratoId', '==', contratoId)
      .where('estado', 'in', ['fondos_retenidos', 'en_disputa'])
      .limit(1)
      .get()

    if (transactionQuery.empty) {
      throw new HttpsError('not-found', 'Escrow transaction not found')
    }

    const transactionDoc = transactionQuery.docs[0]
    const transaction = transactionDoc.data() as EscrowTransaction

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
    })

    // Update transaction
    await db.collection('transacciones').doc(transactionDoc.id).update({
      estado: 'reembolsado_cliente',
      fechaLiberacion: FieldValue.serverTimestamp()
    })

    // Update contract
    await db.collection('contratos').doc(contratoId).update({
      estado: 'cancelado'
    })

    // Update client balance
    await db.collection('usuarios').doc(transaction.clienteId).update({
      saldoEscrow: FieldValue.increment(-transaction.monto)
    })

    // Log audit event
    await logAuditEvent('escrow_refunded', {
      transactionId: transaction.id,
      contratoId,
      clienteId: transaction.clienteId,
      monto: transaction.monto,
      adminId,
      razon,
      refundId: refund.id
    })

    return { 
      success: true,
      montoReembolsado: transaction.monto,
      refundId: refund.id
    }
  } catch (error) {
    logger.error('Error refunding escrow funds:', error)
    throw new HttpsError('internal', 'Failed to refund funds')
  }
})

// Auto-expire QR codes
export const expireQRCodes = onCall(async () => {
  try {
    const now = new Date()
    const expiredQRQuery = await db.collection('pagos_qr')
      .where('fechaExpiracion', '<=', now)
      .where('estado', '==', 'activo')
      .get()

    const batch = db.batch()
    let expiredCount = 0

    expiredQRQuery.docs.forEach(doc => {
      batch.update(doc.ref, { estado: 'expirado' })
      expiredCount++
    })

    if (expiredCount > 0) {
      await batch.commit()
      logger.info(`Expired ${expiredCount} QR codes`)
    }

    return { success: true, expiredCount }
  } catch (error) {
    logger.error('Error expiring QR codes:', error)
    throw new HttpsError('internal', 'Failed to expire QR codes')
  }
})

// Monitor escrow transactions for issues
export const onEscrowTransactionUpdate = onDocumentUpdated('transacciones/{transactionId}', async (event) => {
  const before = event.data?.before.data()
  const after = event.data?.after.data()
  
  if (!before || !after) return

  const transactionId = event.params.transactionId

  try {
    // Check for state changes that need notifications
    if (before.estado !== after.estado) {
      await handleEscrowStateChange(transactionId, before.estado, after.estado, after)
    }

    // Check for stuck transactions (more than 24 hours in pending_deposito)
    if (after.estado === 'pendiente_deposito') {
      const createdAt = after.fechaCreacion?.toDate() || new Date()
      const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceCreation > 24) {
        logger.warn(`Transaction ${transactionId} stuck in pending_deposito for ${hoursSinceCreation} hours`)
        
        // Auto-cancel stuck transactions
        await db.collection('transacciones').doc(transactionId).update({
          estado: 'cancelado',
          razonCancelacion: 'timeout_deposito'
        })

        // Cancel associated contract
        await db.collection('contratos').doc(after.contratoId).update({
          estado: 'cancelado'
        })
      }
    }
  } catch (error) {
    logger.error('Error handling escrow transaction update:', error)
  }
})

// Helper function to handle escrow state changes
async function handleEscrowStateChange(
  transactionId: string,
  oldState: string,
  newState: string,
  transactionData: any
) {
  // This would trigger appropriate notifications
  // Implementation depends on notification system
  logger.info(`Escrow transaction ${transactionId} changed from ${oldState} to ${newState}`)
}

// Helper function for audit logging
async function logAuditEvent(action: string, data: any) {
  try {
    await db.collection('audit_logs').add({
      action,
      data,
      timestamp: FieldValue.serverTimestamp(),
      service: 'escrow'
    })
  } catch (error) {
    logger.error('Error logging audit event:', error)
  }
}