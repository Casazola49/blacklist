import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import { v4 as uuidv4 } from 'uuid'

const db = getFirestore()

// Types
interface AuditLog {
  id: string
  action: string
  userId?: string
  adminId?: string
  timestamp: Date
  ipAddress?: string
  userAgent?: string
  resource: string
  resourceId?: string
  oldData?: any
  newData?: any
  metadata: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'auth' | 'financial' | 'admin' | 'user' | 'system' | 'security'
  success: boolean
  errorMessage?: string
}

interface SecurityEvent {
  id: string
  type: 'login_attempt' | 'failed_login' | 'suspicious_activity' | 'data_breach' | 'unauthorized_access'
  userId?: string
  ipAddress: string
  userAgent: string
  timestamp: Date
  details: Record<string, any>
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  resolved: boolean
  actions: string[]
}

interface AuditReport {
  id: string
  periodo: string
  fechaGeneracion: Date
  totalEventos: number
  eventosPorCategoria: Record<string, number>
  eventosPorSeveridad: Record<string, number>
  usuariosMasActivos: Array<{userId: string, eventos: number}>
  eventosSeguridad: number
  tendencias: Record<string, any>
  recomendaciones: string[]
}

// Log user actions automatically
export const onUserAction = onDocumentCreated('user_actions/{actionId}', async (event) => {
  const action = event.data?.data()
  if (!action) return

  try {
    await logAuditEvent({
      action: action.type,
      userId: action.userId,
      resource: action.resource,
      resourceId: action.resourceId,
      metadata: action.metadata || {},
      severity: determineSeverity(action.type),
      category: determineCategory(action.type),
      success: action.success !== false,
      errorMessage: action.error
    })
  } catch (error) {
    logger.error('Error logging user action:', error)
  }
})

// Monitor contract changes for audit
export const onContractAudit = onDocumentUpdated('contratos/{contractId}', async (event) => {
  const before = event.data?.before.data()
  const after = event.data?.after.data()
  
  if (!before || !after) return

  const contractId = event.params.contractId

  try {
    // Log significant contract changes
    const significantChanges = detectSignificantChanges(before, after)
    
    if (significantChanges.length > 0) {
      await logAuditEvent({
        action: 'contract_updated',
        userId: after.clienteId,
        resource: 'contrato',
        resourceId: contractId,
        oldData: filterSensitiveData(before),
        newData: filterSensitiveData(after),
        metadata: {
          changes: significantChanges,
          especialistaId: after.especialistaId
        },
        severity: getChangeSeverity(significantChanges),
        category: 'financial',
        success: true
      })
    }

    // Monitor for suspicious patterns
    await detectSuspiciousActivity(contractId, before, after)
  } catch (error) {
    logger.error('Error auditing contract change:', error)
  }
})

// Monitor user changes for audit
export const onUserAudit = onDocumentUpdated('usuarios/{userId}', async (event) => {
  const before = event.data?.before.data()
  const after = event.data?.after.data()
  
  if (!before || !after) return

  const userId = event.params.userId

  try {
    // Log profile changes
    const profileChanges = detectProfileChanges(before, after)
    
    if (profileChanges.length > 0) {
      await logAuditEvent({
        action: 'profile_updated',
        userId: userId,
        resource: 'usuario',
        resourceId: userId,
        oldData: filterSensitiveData(before),
        newData: filterSensitiveData(after),
        metadata: {
          changes: profileChanges,
          userType: after.tipo
        },
        severity: getProfileChangeSeverity(profileChanges),
        category: 'user',
        success: true
      })
    }

    // Monitor for privilege escalation
    if (before.tipo !== after.tipo) {
      await logSecurityEvent({
        type: 'suspicious_activity',
        userId: userId,
        ipAddress: 'unknown',
        userAgent: 'system',
        details: {
          action: 'privilege_change',
          oldType: before.tipo,
          newType: after.tipo
        },
        riskLevel: 'high'
      })
    }
  } catch (error) {
    logger.error('Error auditing user change:', error)
  }
})

// Monitor financial transactions
export const onTransactionAudit = onDocumentCreated('transacciones/{transactionId}', async (event) => {
  const transaction = event.data?.data()
  if (!transaction) return

  const transactionId = event.params.transactionId

  try {
    await logAuditEvent({
      action: 'transaction_created',
      userId: transaction.clienteId,
      resource: 'transaccion',
      resourceId: transactionId,
      newData: filterSensitiveData(transaction),
      metadata: {
        monto: transaction.monto,
        especialistaId: transaction.especialistaId,
        contratoId: transaction.contratoId
      },
      severity: 'high',
      category: 'financial',
      success: true
    })

    // Check for suspicious transaction patterns
    await detectSuspiciousTransactions(transaction)
  } catch (error) {
    logger.error('Error auditing transaction:', error)
  }
})

// Log admin actions
export const logAdminAction = onCall(async (request) => {
  const { adminId, action, targetUserId, targetResource, details, ipAddress, userAgent } = request.data

  if (!adminId || !action) {
    throw new HttpsError('invalid-argument', 'Missing required fields')
  }

  try {
    // Verify admin permissions
    const adminDoc = await db.collection('usuarios').doc(adminId).get()
    const admin = adminDoc.data()

    if (!admin || admin.tipo !== 'admin') {
      throw new HttpsError('permission-denied', 'Not authorized to log admin actions')
    }

    await logAuditEvent({
      action: `admin_${action}`,
      adminId: adminId,
      userId: targetUserId,
      resource: targetResource || 'system',
      resourceId: targetUserId,
      metadata: {
        details: details || {},
        adminAlias: admin.alias
      },
      severity: 'critical',
      category: 'admin',
      success: true,
      ipAddress,
      userAgent
    })

    return { success: true }
  } catch (error) {
    logger.error('Error logging admin action:', error)
    throw new HttpsError('internal', 'Failed to log admin action')
  }
})

// Log security events
export const logSecurityEvent = async (eventData: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved' | 'actions'>) => {
  try {
    const securityEvent: SecurityEvent = {
      id: uuidv4(),
      timestamp: new Date(),
      resolved: false,
      actions: [],
      ...eventData
    }

    await db.collection('security_events').add(securityEvent)

    // Auto-respond to critical security events
    if (securityEvent.riskLevel === 'critical') {
      await handleCriticalSecurityEvent(securityEvent)
    }

    // Log as audit event as well
    await logAuditEvent({
      action: `security_${eventData.type}`,
      userId: eventData.userId,
      resource: 'security',
      metadata: eventData.details,
      severity: 'critical',
      category: 'security',
      success: true,
      ipAddress: eventData.ipAddress,
      userAgent: eventData.userAgent
    })

    return securityEvent.id
  } catch (error) {
    logger.error('Error logging security event:', error)
    throw error
  }
}

// Generate audit reports
export const generateAuditReport = onCall(async (request) => {
  const { adminId, startDate, endDate, categories, severity } = request.data

  if (!adminId) {
    throw new HttpsError('invalid-argument', 'Admin ID required')
  }

  try {
    // Verify admin permissions
    const adminDoc = await db.collection('usuarios').doc(adminId).get()
    const admin = adminDoc.data()

    if (!admin || admin.tipo !== 'admin') {
      throw new HttpsError('permission-denied', 'Not authorized to generate audit reports')
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Build query
    let query = db.collection('audit_logs')
      .where('timestamp', '>=', start)
      .where('timestamp', '<=', end)

    if (categories && categories.length > 0) {
      query = query.where('category', 'in', categories)
    }

    if (severity) {
      query = query.where('severity', '==', severity)
    }

    const auditLogsQuery = await query.get()
    const auditLogs = auditLogsQuery.docs.map(doc => doc.data() as AuditLog)

    // Generate report
    const report: AuditReport = {
      id: uuidv4(),
      periodo: `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`,
      fechaGeneracion: new Date(),
      totalEventos: auditLogs.length,
      eventosPorCategoria: auditLogs.reduce((acc, log) => {
        acc[log.category] = (acc[log.category] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      eventosPorSeveridad: auditLogs.reduce((acc, log) => {
        acc[log.severity] = (acc[log.severity] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      usuariosMasActivos: getTopActiveUsers(auditLogs),
      eventosSeguridad: auditLogs.filter(log => log.category === 'security').length,
      tendencias: calculateTrends(auditLogs, start, end),
      recomendaciones: generateRecommendations(auditLogs)
    }

    // Save report
    await db.collection('audit_reports').doc(report.id).set(report)

    // Log report generation
    await logAuditEvent({
      action: 'audit_report_generated',
      adminId: adminId,
      resource: 'audit_report',
      resourceId: report.id,
      metadata: {
        periodo: report.periodo,
        totalEventos: report.totalEventos,
        filters: { categories, severity }
      },
      severity: 'medium',
      category: 'admin',
      success: true
    })

    return { success: true, reportId: report.id, report }
  } catch (error) {
    logger.error('Error generating audit report:', error)
    throw new HttpsError('internal', 'Failed to generate audit report')
  }
})

// Search audit logs
export const searchAuditLogs = onCall(async (request) => {
  const { adminId, filters, limit = 100, offset = 0 } = request.data

  if (!adminId) {
    throw new HttpsError('invalid-argument', 'Admin ID required')
  }

  try {
    // Verify admin permissions
    const adminDoc = await db.collection('usuarios').doc(adminId).get()
    const admin = adminDoc.data()

    if (!admin || admin.tipo !== 'admin') {
      throw new HttpsError('permission-denied', 'Not authorized to search audit logs')
    }

    // Build query based on filters
    let query = db.collection('audit_logs').orderBy('timestamp', 'desc')

    if (filters.startDate) {
      query = query.where('timestamp', '>=', new Date(filters.startDate))
    }

    if (filters.endDate) {
      query = query.where('timestamp', '<=', new Date(filters.endDate))
    }

    if (filters.userId) {
      query = query.where('userId', '==', filters.userId)
    }

    if (filters.category) {
      query = query.where('category', '==', filters.category)
    }

    if (filters.severity) {
      query = query.where('severity', '==', filters.severity)
    }

    if (filters.action) {
      query = query.where('action', '==', filters.action)
    }

    // Apply pagination
    if (offset > 0) {
      const offsetQuery = await db.collection('audit_logs')
        .orderBy('timestamp', 'desc')
        .limit(offset)
        .get()
      
      if (!offsetQuery.empty) {
        const lastDoc = offsetQuery.docs[offsetQuery.docs.length - 1]
        query = query.startAfter(lastDoc)
      }
    }

    const results = await query.limit(limit).get()
    const logs = results.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Log search action
    await logAuditEvent({
      action: 'audit_logs_searched',
      adminId: adminId,
      resource: 'audit_logs',
      metadata: {
        filters,
        resultsCount: logs.length,
        limit,
        offset
      },
      severity: 'low',
      category: 'admin',
      success: true
    })

    return { success: true, logs, hasMore: results.docs.length === limit }
  } catch (error) {
    logger.error('Error searching audit logs:', error)
    throw new HttpsError('internal', 'Failed to search audit logs')
  }
})

// Helper function to log audit events
export const logAuditEvent = async (eventData: Omit<AuditLog, 'id' | 'timestamp'>) => {
  try {
    const auditLog: AuditLog = {
      id: uuidv4(),
      timestamp: new Date(),
      ...eventData
    }

    await db.collection('audit_logs').add(auditLog)
    
    // Also log to console for immediate visibility
    logger.info(`Audit: ${auditLog.action}`, {
      userId: auditLog.userId,
      resource: auditLog.resource,
      severity: auditLog.severity,
      success: auditLog.success
    })

    return auditLog.id
  } catch (error) {
    logger.error('Error logging audit event:', error)
    throw error
  }
}

// Helper functions
function determineSeverity(action: string): 'low' | 'medium' | 'high' | 'critical' {
  const criticalActions = ['login_failed', 'unauthorized_access', 'data_breach', 'privilege_escalation']
  const highActions = ['transaction_created', 'contract_completed', 'user_banned', 'escrow_released']
  const mediumActions = ['profile_updated', 'contract_created', 'message_sent']
  
  if (criticalActions.some(a => action.includes(a))) return 'critical'
  if (highActions.some(a => action.includes(a))) return 'high'
  if (mediumActions.some(a => action.includes(a))) return 'medium'
  return 'low'
}

function determineCategory(action: string): 'auth' | 'financial' | 'admin' | 'user' | 'system' | 'security' {
  if (action.includes('login') || action.includes('auth')) return 'auth'
  if (action.includes('transaction') || action.includes('escrow') || action.includes('payment')) return 'financial'
  if (action.includes('admin')) return 'admin'
  if (action.includes('security') || action.includes('breach') || action.includes('suspicious')) return 'security'
  if (action.includes('user') || action.includes('profile')) return 'user'
  return 'system'
}

function detectSignificantChanges(before: any, after: any): string[] {
  const changes: string[] = []
  const significantFields = ['estado', 'precio', 'especialistaId', 'fechaLimite']
  
  significantFields.forEach(field => {
    if (before[field] !== after[field]) {
      changes.push(`${field}: ${before[field]} -> ${after[field]}`)
    }
  })
  
  return changes
}

function getChangeSeverity(changes: string[]): 'low' | 'medium' | 'high' | 'critical' {
  const criticalChanges = ['estado', 'precio']
  const highChanges = ['especialistaId', 'fechaLimite']
  
  if (changes.some(c => criticalChanges.some(cc => c.includes(cc)))) return 'critical'
  if (changes.some(c => highChanges.some(hc => c.includes(hc)))) return 'high'
  return 'medium'
}

function detectProfileChanges(before: any, after: any): string[] {
  const changes: string[] = []
  const profileFields = ['alias', 'email', 'tipo', 'estado', 'habilidades']
  
  profileFields.forEach(field => {
    if (JSON.stringify(before[field]) !== JSON.stringify(after[field])) {
      changes.push(`${field}: ${JSON.stringify(before[field])} -> ${JSON.stringify(after[field])}`)
    }
  })
  
  return changes
}

function getProfileChangeSeverity(changes: string[]): 'low' | 'medium' | 'high' | 'critical' {
  const criticalChanges = ['tipo', 'estado']
  const highChanges = ['email']
  
  if (changes.some(c => criticalChanges.some(cc => c.includes(cc)))) return 'critical'
  if (changes.some(c => highChanges.some(hc => c.includes(hc)))) return 'high'
  return 'medium'
}

function filterSensitiveData(data: any): any {
  const filtered = { ...data }
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'cv']
  
  sensitiveFields.forEach(field => {
    if (filtered[field]) {
      filtered[field] = '[REDACTED]'
    }
  })
  
  return filtered
}

async function detectSuspiciousActivity(contractId: string, before: any, after: any) {
  // Detect rapid state changes
  if (before.estado !== after.estado) {
    const recentChanges = await db.collection('audit_logs')
      .where('resourceId', '==', contractId)
      .where('action', '==', 'contract_updated')
      .where('timestamp', '>=', new Date(Date.now() - 60 * 60 * 1000)) // Last hour
      .get()

    if (recentChanges.docs.length > 5) {
      await logSecurityEvent({
        type: 'suspicious_activity',
        userId: after.clienteId,
        ipAddress: 'unknown',
        userAgent: 'system',
        details: {
          action: 'rapid_contract_changes',
          contractId,
          changesInLastHour: recentChanges.docs.length
        },
        riskLevel: 'medium'
      })
    }
  }
}

async function detectSuspiciousTransactions(transaction: any) {
  // Check for unusually large amounts
  if (transaction.monto > 10000) {
    await logSecurityEvent({
      type: 'suspicious_activity',
      userId: transaction.clienteId,
      ipAddress: 'unknown',
      userAgent: 'system',
      details: {
        action: 'large_transaction',
        monto: transaction.monto,
        transactionId: transaction.id
      },
      riskLevel: 'high'
    })
  }

  // Check for rapid transactions from same user
  const recentTransactions = await db.collection('transacciones')
    .where('clienteId', '==', transaction.clienteId)
    .where('fechaCreacion', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))
    .get()

  if (recentTransactions.docs.length > 10) {
    await logSecurityEvent({
      type: 'suspicious_activity',
      userId: transaction.clienteId,
      ipAddress: 'unknown',
      userAgent: 'system',
      details: {
        action: 'rapid_transactions',
        transactionsIn24h: recentTransactions.docs.length
      },
      riskLevel: 'medium'
    })
  }
}

async function handleCriticalSecurityEvent(event: SecurityEvent) {
  // Auto-suspend user for critical security events
  if (event.userId && event.riskLevel === 'critical') {
    await db.collection('usuarios').doc(event.userId).update({
      estado: 'suspendido',
      razonSuspension: `Automatic suspension due to security event: ${event.type}`,
      fechaSuspension: FieldValue.serverTimestamp()
    })

    // Notify admins
    const adminsQuery = await db.collection('usuarios').where('tipo', '==', 'admin').get()
    if (!adminsQuery.empty) {
      // Send notification to admin (implementation depends on notification system)
      logger.warn(`Critical security event: ${event.type} for user ${event.userId}`)
    }
  }
}

function getTopActiveUsers(logs: AuditLog[]): Array<{userId: string, eventos: number}> {
  const userCounts = logs.reduce((acc, log) => {
    if (log.userId) {
      acc[log.userId] = (acc[log.userId] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  return Object.entries(userCounts)
    .map(([userId, eventos]) => ({ userId, eventos }))
    .sort((a, b) => b.eventos - a.eventos)
    .slice(0, 10)
}

function calculateTrends(logs: AuditLog[], startDate: Date, endDate: Date): Record<string, any> {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const dailyEvents: Record<string, number> = {}
  
  logs.forEach(log => {
    const day = log.timestamp.toISOString().split('T')[0]
    dailyEvents[day] = (dailyEvents[day] || 0) + 1
  })

  return {
    dailyEvents,
    averageEventsPerDay: logs.length / days,
    peakDay: Object.entries(dailyEvents).sort(([,a], [,b]) => b - a)[0],
    growthRate: calculateGrowthRate(dailyEvents)
  }
}

function calculateGrowthRate(dailyEvents: Record<string, number>): number {
  const days = Object.keys(dailyEvents).sort()
  if (days.length < 2) return 0

  const firstHalf = days.slice(0, Math.floor(days.length / 2))
  const secondHalf = days.slice(Math.floor(days.length / 2))

  const firstHalfAvg = firstHalf.reduce((sum, day) => sum + dailyEvents[day], 0) / firstHalf.length
  const secondHalfAvg = secondHalf.reduce((sum, day) => sum + dailyEvents[day], 0) / secondHalf.length

  return ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
}

function generateRecommendations(logs: AuditLog[]): string[] {
  const recommendations: string[] = []
  
  const securityEvents = logs.filter(log => log.category === 'security').length
  const failedLogins = logs.filter(log => log.action.includes('login_failed')).length
  const adminActions = logs.filter(log => log.category === 'admin').length

  if (securityEvents > logs.length * 0.1) {
    recommendations.push('Alto número de eventos de seguridad detectados. Revisar políticas de seguridad.')
  }

  if (failedLogins > logs.length * 0.05) {
    recommendations.push('Múltiples intentos de login fallidos. Considerar implementar CAPTCHA o bloqueo temporal.')
  }

  if (adminActions > logs.length * 0.2) {
    recommendations.push('Alta actividad administrativa. Revisar necesidad de acciones automatizadas.')
  }

  const errorRate = logs.filter(log => !log.success).length / logs.length
  if (errorRate > 0.1) {
    recommendations.push('Alta tasa de errores detectada. Revisar estabilidad del sistema.')
  }

  return recommendations
}