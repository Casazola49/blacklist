import type { ErrorInfo } from './errorHandler'

export interface LogEntry {
  id: string
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical'
  message: string
  timestamp: Date
  userId?: string
  sessionId: string
  context?: string
  metadata?: Record<string, any>
  stack?: string
  userAgent?: string
  url?: string
}

export interface AuditLogEntry extends LogEntry {
  action: string
  resource?: string
  resourceId?: string
  previousValue?: any
  newValue?: any
  ipAddress?: string
}

class LoggerService {
  private sessionId: string
  private userId?: string
  private logBuffer: LogEntry[] = []
  private auditBuffer: AuditLogEntry[] = []
  private maxBufferSize = 100
  private flushInterval = 30000 // 30 segundos

  constructor() {
    this.sessionId = this.generateSessionId()
    this.startPeriodicFlush()
    this.setupErrorCapture()
  }

  /**
   * Log de debug (solo en desarrollo)
   */
  async logDebug(message: string, context?: string, metadata?: Record<string, any>): Promise<void> {
    if (import.meta.env.DEV) {
      await this.log('debug', message, context, metadata)
    }
  }

  /**
   * Log informativo
   */
  async logInfo(message: string, context?: string, metadata?: Record<string, any>): Promise<void> {
    await this.log('info', message, context, metadata)
  }

  /**
   * Log de advertencia
   */
  async logWarn(message: string, context?: string, metadata?: Record<string, any>): Promise<void> {
    await this.log('warn', message, context, metadata)
  }

  /**
   * Log de error
   */
  async logError(errorInfo: ErrorInfo): Promise<void>
  async logError(message: string, context?: string, metadata?: Record<string, any>, stack?: string): Promise<void>
  async logError(
    messageOrError: string | ErrorInfo,
    context?: string,
    metadata?: Record<string, any>,
    stack?: string
  ): Promise<void> {
    if (typeof messageOrError === 'object') {
      // Es un ErrorInfo
      const errorInfo = messageOrError
      await this.log('error', errorInfo.message, errorInfo.context, {
        ...errorInfo.metadata,
        errorId: errorInfo.id,
        errorType: errorInfo.type,
        errorCode: errorInfo.code
      }, errorInfo.stack)
    } else {
      // Es un string
      await this.log('error', messageOrError, context, metadata, stack)
    }
  }

  /**
   * Log crítico (requiere atención inmediata)
   */
  async logCritical(message: string, context?: string, metadata?: Record<string, any>, stack?: string): Promise<void> {
    await this.log('critical', message, context, metadata, stack)
    
    // Los logs críticos se envían inmediatamente
    await this.flushLogs()
  }

  /**
   * Log de auditoría para acciones importantes
   */
  async logAudit(
    action: string,
    resource?: string,
    resourceId?: string,
    previousValue?: any,
    newValue?: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    const auditEntry: AuditLogEntry = {
      id: this.generateLogId(),
      level: 'info',
      message: `Acción de auditoría: ${action}`,
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
      context: 'audit',
      metadata,
      userAgent: navigator.userAgent,
      url: window.location.href,
      action,
      resource,
      resourceId,
      previousValue,
      newValue,
      ipAddress: await this.getClientIP()
    }

    this.auditBuffer.push(auditEntry)
    
    // Mantener buffer de auditoría limitado
    if (this.auditBuffer.length > this.maxBufferSize) {
      this.auditBuffer = this.auditBuffer.slice(-this.maxBufferSize)
    }

    // Console log en desarrollo
    if (import.meta.env.DEV) {
      console.log('🔍 AUDIT:', auditEntry)
    }
  }

  /**
   * Establece el ID del usuario actual
   */
  setUserId(userId: string): void {
    this.userId = userId
  }

  /**
   * Obtiene logs recientes
   */
  getRecentLogs(limit: number = 50): LogEntry[] {
    return this.logBuffer
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Obtiene logs de auditoría recientes
   */
  getRecentAuditLogs(limit: number = 50): AuditLogEntry[] {
    return this.auditBuffer
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Exporta logs para análisis
   */
  exportLogs(): { logs: LogEntry[], auditLogs: AuditLogEntry[] } {
    return {
      logs: [...this.logBuffer],
      auditLogs: [...this.auditBuffer]
    }
  }

  /**
   * Limpia logs antiguos
   */
  clearOldLogs(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000)
    
    this.logBuffer = this.logBuffer.filter(log => log.timestamp > cutoffTime)
    this.auditBuffer = this.auditBuffer.filter(log => log.timestamp > cutoffTime)
  }

  private async log(
    level: LogEntry['level'],
    message: string,
    context?: string,
    metadata?: Record<string, any>,
    stack?: string
  ): Promise<void> {
    const logEntry: LogEntry = {
      id: this.generateLogId(),
      level,
      message,
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
      context,
      metadata,
      stack,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // Agregar al buffer
    this.logBuffer.push(logEntry)

    // Mantener buffer limitado
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize)
    }

    // Console log en desarrollo
    if (import.meta.env.DEV) {
      const emoji = this.getLevelEmoji(level)
      const style = this.getLevelStyle(level)
      console.log(`${emoji} %c${level.toUpperCase()}`, style, message, logEntry)
    }

    // Enviar logs críticos inmediatamente
    if (level === 'critical') {
      await this.sendToRemoteLogger([logEntry])
    }
  }

  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flushLogs()
    }, this.flushInterval)

    // Flush al cerrar la página
    window.addEventListener('beforeunload', () => {
      this.flushLogs()
    })
  }

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0 && this.auditBuffer.length === 0) {
      return
    }

    try {
      // Enviar logs normales
      if (this.logBuffer.length > 0) {
        await this.sendToRemoteLogger([...this.logBuffer])
      }

      // Enviar logs de auditoría
      if (this.auditBuffer.length > 0) {
        await this.sendAuditLogs([...this.auditBuffer])
      }

      // Limpiar buffers después del envío exitoso
      this.logBuffer = []
      this.auditBuffer = []

    } catch (error) {
      console.error('Error enviando logs:', error)
      // No limpiar buffers si falló el envío
    }
  }

  private async sendToRemoteLogger(logs: LogEntry[]): Promise<void> {
    // En producción, enviar a servicio de logging (ej: Cloud Functions)
    if (import.meta.env.PROD) {
      try {
        // Implementar envío a Firebase Functions o servicio externo
        const response = await fetch('/api/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ logs })
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        // Fallback: almacenar en localStorage temporalmente
        this.storeLogsLocally(logs)
        throw error
      }
    }
  }

  private async sendAuditLogs(auditLogs: AuditLogEntry[]): Promise<void> {
    // Los logs de auditoría van a un endpoint separado por seguridad
    if (import.meta.env.PROD) {
      try {
        const response = await fetch('/api/audit-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ auditLogs })
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        this.storeAuditLogsLocally(auditLogs)
        throw error
      }
    }
  }

  private storeLogsLocally(logs: LogEntry[]): void {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('pending_logs') || '[]')
      const updatedLogs = [...existingLogs, ...logs].slice(-200) // Mantener solo los últimos 200
      localStorage.setItem('pending_logs', JSON.stringify(updatedLogs))
    } catch (error) {
      console.error('Error almacenando logs localmente:', error)
    }
  }

  private storeAuditLogsLocally(auditLogs: AuditLogEntry[]): void {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('pending_audit_logs') || '[]')
      const updatedLogs = [...existingLogs, ...auditLogs].slice(-100) // Mantener solo los últimos 100
      localStorage.setItem('pending_audit_logs', JSON.stringify(updatedLogs))
    } catch (error) {
      console.error('Error almacenando audit logs localmente:', error)
    }
  }

  private setupErrorCapture(): void {
    // Capturar errores no manejados
    window.addEventListener('error', (event) => {
      this.logError(
        event.error?.message || event.message,
        'unhandled_error',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        },
        event.error?.stack
      )
    })

    // Capturar promesas rechazadas
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        event.reason?.message || 'Unhandled promise rejection',
        'unhandled_rejection',
        {
          reason: event.reason
        },
        event.reason?.stack
      )
    })
  }

  private async getClientIP(): Promise<string | undefined> {
    try {
      // En producción, obtener IP del servidor
      const response = await fetch('/api/client-ip')
      const data = await response.json()
      return data.ip
    } catch {
      return undefined
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getLevelEmoji(level: LogEntry['level']): string {
    const emojis = {
      debug: '🐛',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      critical: '🚨'
    }
    return emojis[level]
  }

  private getLevelStyle(level: LogEntry['level']): string {
    const styles = {
      debug: 'color: #888; font-weight: normal;',
      info: 'color: #00ffff; font-weight: bold;',
      warn: 'color: #ffaa00; font-weight: bold;',
      error: 'color: #ff3366; font-weight: bold;',
      critical: 'color: #ff0000; font-weight: bold; background: #ffeeee;'
    }
    return styles[level]
  }
}

export const loggerService = new LoggerService()