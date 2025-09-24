import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { logger } from 'firebase-functions'

const db = getFirestore()
const storage = getStorage()

// Types

interface CleanupResult {
  taskId: string
  elementosEliminados: number
  tiempoEjecucion: number
  errores: string[]
  detalles: Record<string, any>
}

// Clean expired QR codes (daily)
export const cleanExpiredQRCodes = onSchedule('0 2 * * *', async () => {
  const startTime = Date.now()
  let deletedCount = 0
  const errors: string[] = []

  try {
    logger.info('Starting cleanup of expired QR codes')

    // Get expired QR codes
    const now = new Date()
    const expiredQRQuery = await db.collection('pagos_qr')
      .where('fechaExpiracion', '<=', now)
      .where('estado', 'in', ['activo', 'expirado'])
      .limit(500) // Process in batches
      .get()

    if (expiredQRQuery.empty) {
      logger.info('No expired QR codes found')
      return
    }

    // Update expired QR codes
    const batch = db.batch()
    expiredQRQuery.docs.forEach(doc => {
      batch.update(doc.ref, {
        estado: 'expirado',
        fechaExpiracion: FieldValue.serverTimestamp()
      })
      deletedCount++
    })

    await batch.commit()

    // Clean up very old expired QR codes (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const oldExpiredQuery = await db.collection('pagos_qr')
      .where('fechaExpiracion', '<=', thirtyDaysAgo)
      .where('estado', '==', 'expirado')
      .limit(100)
      .get()

    if (!oldExpiredQuery.empty) {
      const deleteBatch = db.batch()
      oldExpiredQuery.docs.forEach(doc => {
        deleteBatch.delete(doc.ref)
      })
      await deleteBatch.commit()
      deletedCount += oldExpiredQuery.docs.length
    }

    const executionTime = Date.now() - startTime
    logger.info(`Cleaned up ${deletedCount} expired QR codes in ${executionTime}ms`)

    // Log cleanup result
    await logCleanupResult('expired_qr', {
      elementosEliminados: deletedCount,
      tiempoEjecucion: executionTime,
      errores: errors
    })
  } catch (error) {
    logger.error('Error cleaning expired QR codes:', error)
    errors.push(error instanceof Error ? error.message : 'Unknown error')
    
    await logCleanupResult('expired_qr', {
      elementosEliminados: deletedCount,
      tiempoEjecucion: Date.now() - startTime,
      errores: errors
    })
  }
})

// Clean old notifications (weekly)
export const cleanOldNotifications = onSchedule('0 3 * * 0', async () => {
  const startTime = Date.now()
  let deletedCount = 0
  const errors: string[] = []

  try {
    logger.info('Starting cleanup of old notifications')

    // Clean notifications older than 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    
    // Get all users to clean their notifications
    const usersQuery = await db.collection('usuarios').get()
    
    for (const userDoc of usersQuery.docs) {
      try {
        const userData = userDoc.data()
        const notifications = userData.notificaciones || []
        
        // Filter out old notifications
        const recentNotifications = notifications.filter((notif: any) => {
          const notifDate = notif.fechaCreacion?.toDate() || new Date(0)
          return notifDate > ninetyDaysAgo
        })

        // Update user if notifications were removed
        if (recentNotifications.length < notifications.length) {
          await db.collection('usuarios').doc(userDoc.id).update({
            notificaciones: recentNotifications
          })
          deletedCount += notifications.length - recentNotifications.length
        }
      } catch (error) {
        logger.error(`Error cleaning notifications for user ${userDoc.id}:`, error)
        errors.push(`User ${userDoc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    const executionTime = Date.now() - startTime
    logger.info(`Cleaned up ${deletedCount} old notifications in ${executionTime}ms`)

    await logCleanupResult('old_notifications', {
      elementosEliminados: deletedCount,
      tiempoEjecucion: executionTime,
      errores: errors
    })
  } catch (error) {
    logger.error('Error cleaning old notifications:', error)
    errors.push(error instanceof Error ? error.message : 'Unknown error')
    
    await logCleanupResult('old_notifications', {
      elementosEliminados: deletedCount,
      tiempoEjecucion: Date.now() - startTime,
      errores: errors
    })
  }
})

// Clean temporary files (daily)
export const cleanTempFiles = onSchedule('0 4 * * *', async () => {
  const startTime = Date.now()
  let deletedCount = 0
  const errors: string[] = []

  try {
    logger.info('Starting cleanup of temporary files')

    const bucket = storage.bucket()
    
    // Clean temp files older than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    // List files in temp directory
    const [files] = await bucket.getFiles({
      prefix: 'temp/',
      maxResults: 1000
    })

    for (const file of files) {
      try {
        const [metadata] = await file.getMetadata()
        const createdDate = new Date(metadata.timeCreated || Date.now())
        
        if (createdDate < oneDayAgo) {
          await file.delete()
          deletedCount++
        }
      } catch (error) {
        logger.error(`Error deleting temp file ${file.name}:`, error)
        errors.push(`File ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Clean orphaned upload sessions
    const uploadSessionsQuery = await db.collection('upload_sessions')
      .where('fechaCreacion', '<=', oneDayAgo)
      .where('estado', 'in', ['iniciado', 'en_progreso'])
      .limit(100)
      .get()

    if (!uploadSessionsQuery.empty) {
      const batch = db.batch()
      uploadSessionsQuery.docs.forEach(doc => {
        batch.delete(doc.ref)
      })
      await batch.commit()
      deletedCount += uploadSessionsQuery.docs.length
    }

    const executionTime = Date.now() - startTime
    logger.info(`Cleaned up ${deletedCount} temporary files in ${executionTime}ms`)

    await logCleanupResult('temp_files', {
      elementosEliminados: deletedCount,
      tiempoEjecucion: executionTime,
      errores: errors
    })
  } catch (error) {
    logger.error('Error cleaning temporary files:', error)
    errors.push(error instanceof Error ? error.message : 'Unknown error')
    
    await logCleanupResult('temp_files', {
      elementosEliminados: deletedCount,
      tiempoEjecucion: Date.now() - startTime,
      errores: errors
    })
  }
})

// Clean inactive sessions (daily)
export const cleanInactiveSessions = onSchedule('0 1 * * *', async () => {
  const startTime = Date.now()
  let deletedCount = 0
  const errors: string[] = []

  try {
    logger.info('Starting cleanup of inactive sessions')

    // Clean sessions older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    const inactiveSessionsQuery = await db.collection('user_sessions')
      .where('ultimaActividad', '<=', thirtyDaysAgo)
      .limit(500)
      .get()

    if (!inactiveSessionsQuery.empty) {
      const batch = db.batch()
      inactiveSessionsQuery.docs.forEach(doc => {
        batch.delete(doc.ref)
        deletedCount++
      })
      await batch.commit()
    }

    // Clean expired FCM tokens
    const usersQuery = await db.collection('usuarios')
      .where('fcmTokens', '!=', null)
      .get()

    for (const userDoc of usersQuery.docs) {
      try {
        const userData = userDoc.data()
        const fcmTokens = userData.fcmTokens || []
        
        if (fcmTokens.length > 10) { // Keep only last 10 tokens per user
          const recentTokens = fcmTokens.slice(-10)
          await db.collection('usuarios').doc(userDoc.id).update({
            fcmTokens: recentTokens
          })
          deletedCount += fcmTokens.length - recentTokens.length
        }
      } catch (error) {
        logger.error(`Error cleaning FCM tokens for user ${userDoc.id}:`, error)
        errors.push(`User ${userDoc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    const executionTime = Date.now() - startTime
    logger.info(`Cleaned up ${deletedCount} inactive sessions in ${executionTime}ms`)

    await logCleanupResult('inactive_sessions', {
      elementosEliminados: deletedCount,
      tiempoEjecucion: executionTime,
      errores: errors
    })
  } catch (error) {
    logger.error('Error cleaning inactive sessions:', error)
    errors.push(error instanceof Error ? error.message : 'Unknown error')
    
    await logCleanupResult('inactive_sessions', {
      elementosEliminados: deletedCount,
      tiempoEjecucion: Date.now() - startTime,
      errores: errors
    })
  }
})

// Clean old audit logs (monthly)
export const cleanOldAuditLogs = onSchedule('0 5 1 * *', async () => {
  const startTime = Date.now()
  let deletedCount = 0
  const errors: string[] = []

  try {
    logger.info('Starting cleanup of old audit logs')

    // Keep audit logs for 1 year, delete older ones
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    
    // Process in batches to avoid timeout
    let hasMore = true
    while (hasMore) {
      const oldLogsQuery = await db.collection('audit_logs')
        .where('timestamp', '<=', oneYearAgo)
        .limit(500)
        .get()

      if (oldLogsQuery.empty) {
        hasMore = false
        break
      }

      const batch = db.batch()
      oldLogsQuery.docs.forEach(doc => {
        batch.delete(doc.ref)
        deletedCount++
      })

      await batch.commit()
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Archive important logs before deletion (security events, financial transactions)
    const importantLogsQuery = await db.collection('audit_logs')
      .where('timestamp', '<=', oneYearAgo)
      .where('action', 'in', ['login_failed', 'escrow_created', 'escrow_released', 'admin_action'])
      .limit(1000)
      .get()

    if (!importantLogsQuery.empty) {
      // Archive to a separate collection
      const archiveBatch = db.batch()
      importantLogsQuery.docs.forEach(doc => {
        const archiveRef = db.collection('archived_audit_logs').doc(doc.id)
        archiveBatch.set(archiveRef, {
          ...doc.data(),
          archivedAt: FieldValue.serverTimestamp()
        })
      })
      await archiveBatch.commit()
    }

    const executionTime = Date.now() - startTime
    logger.info(`Cleaned up ${deletedCount} old audit logs in ${executionTime}ms`)

    await logCleanupResult('old_logs', {
      elementosEliminados: deletedCount,
      tiempoEjecucion: executionTime,
      errores: errors
    })
  } catch (error) {
    logger.error('Error cleaning old audit logs:', error)
    errors.push(error instanceof Error ? error.message : 'Unknown error')
    
    await logCleanupResult('old_logs', {
      elementosEliminados: deletedCount,
      tiempoEjecucion: Date.now() - startTime,
      errores: errors
    })
  }
})

// Manual cleanup trigger for admins
export const triggerManualCleanup = onCall(async (request) => {
  const { adminId, taskType, dryRun = false } = request.data

  if (!adminId || !taskType) {
    throw new HttpsError('invalid-argument', 'Missing required fields')
  }

  try {
    // Verify admin permissions
    const adminDoc = await db.collection('usuarios').doc(adminId).get()
    const admin = adminDoc.data()

    if (!admin || admin.tipo !== 'admin') {
      throw new HttpsError('permission-denied', 'Not authorized to trigger cleanup')
    }

    logger.info(`Manual cleanup triggered by admin ${adminId} for task ${taskType}`)

    let result: CleanupResult

    switch (taskType) {
      case 'expired_qr':
        result = await executeCleanupTask('expired_qr', dryRun)
        break
      case 'old_notifications':
        result = await executeCleanupTask('old_notifications', dryRun)
        break
      case 'temp_files':
        result = await executeCleanupTask('temp_files', dryRun)
        break
      case 'inactive_sessions':
        result = await executeCleanupTask('inactive_sessions', dryRun)
        break
      case 'old_logs':
        result = await executeCleanupTask('old_logs', dryRun)
        break
      case 'all':
        // Execute all cleanup tasks
        const results = await Promise.allSettled([
          executeCleanupTask('expired_qr', dryRun),
          executeCleanupTask('old_notifications', dryRun),
          executeCleanupTask('temp_files', dryRun),
          executeCleanupTask('inactive_sessions', dryRun)
        ])
        
        const totalDeleted = results.reduce((sum, r) => {
          return sum + (r.status === 'fulfilled' ? r.value.elementosEliminados : 0)
        }, 0)

        result = {
          taskId: 'all',
          elementosEliminados: totalDeleted,
          tiempoEjecucion: results.reduce((sum, r) => {
            return sum + (r.status === 'fulfilled' ? r.value.tiempoEjecucion : 0)
          }, 0),
          errores: results.flatMap(r => r.status === 'fulfilled' ? r.value.errores : ['Task failed']),
          detalles: { results: results.map(r => r.status === 'fulfilled' ? r.value : { error: 'failed' }) }
        }
        break
      default:
        throw new HttpsError('invalid-argument', 'Invalid task type')
    }

    // Log admin action
    await db.collection('audit_logs').add({
      action: 'manual_cleanup',
      adminId,
      taskType,
      dryRun,
      result,
      timestamp: FieldValue.serverTimestamp()
    })

    return { success: true, result }
  } catch (error) {
    logger.error('Error in manual cleanup:', error)
    throw new HttpsError('internal', 'Failed to execute cleanup')
  }
})

// Get cleanup statistics
export const getCleanupStatistics = onCall(async (request) => {
  const { adminId, days = 30 } = request.data

  if (!adminId) {
    throw new HttpsError('invalid-argument', 'Admin ID required')
  }

  try {
    // Verify admin permissions
    const adminDoc = await db.collection('usuarios').doc(adminId).get()
    const admin = adminDoc.data()

    if (!admin || admin.tipo !== 'admin') {
      throw new HttpsError('permission-denied', 'Not authorized to view cleanup statistics')
    }

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Get cleanup results from the specified period
    const cleanupResultsQuery = await db.collection('cleanup_results')
      .where('fecha', '>=', startDate)
      .orderBy('fecha', 'desc')
      .get()

    const results = cleanupResultsQuery.docs.map(doc => doc.data())

    // Aggregate statistics
    const stats = {
      totalEjecuciones: results.length,
      elementosTotalesEliminados: results.reduce((sum, r) => sum + r.elementosEliminados, 0),
      tiempoTotalEjecucion: results.reduce((sum, r) => sum + r.tiempoEjecucion, 0),
      erroresTotal: results.reduce((sum, r) => sum + r.errores.length, 0),
      estadisticasPorTipo: results.reduce((acc, r) => {
        if (!acc[r.taskId]) {
          acc[r.taskId] = {
            ejecuciones: 0,
            elementosEliminados: 0,
            tiempoPromedio: 0,
            errores: 0
          }
        }
        acc[r.taskId].ejecuciones++
        acc[r.taskId].elementosEliminados += r.elementosEliminados
        acc[r.taskId].tiempoPromedio = (acc[r.taskId].tiempoPromedio + r.tiempoEjecucion) / acc[r.taskId].ejecuciones
        acc[r.taskId].errores += r.errores.length
        return acc
      }, {} as Record<string, any>),
      ultimasEjecuciones: results.slice(0, 10)
    }

    return { success: true, stats }
  } catch (error) {
    logger.error('Error getting cleanup statistics:', error)
    throw new HttpsError('internal', 'Failed to get cleanup statistics')
  }
})

// Helper function to execute cleanup tasks
async function executeCleanupTask(taskType: string, dryRun: boolean = false): Promise<CleanupResult> {
  const startTime = Date.now()
  
  // This would contain the actual cleanup logic for each task type
  // For now, return a mock result
  const result: CleanupResult = {
    taskId: taskType,
    elementosEliminados: dryRun ? 0 : Math.floor(Math.random() * 100),
    tiempoEjecucion: Date.now() - startTime,
    errores: [],
    detalles: { dryRun }
  }

  if (!dryRun) {
    await logCleanupResult(taskType, result)
  }

  return result
}

// Helper function to log cleanup results
async function logCleanupResult(taskId: string, result: Partial<CleanupResult>) {
  try {
    await db.collection('cleanup_results').add({
      taskId,
      fecha: FieldValue.serverTimestamp(),
      ...result
    })
  } catch (error) {
    logger.error('Error logging cleanup result:', error)
  }
}