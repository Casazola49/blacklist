"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditEvent = exports.searchAuditLogs = exports.generateAuditReport = exports.logSecurityEvent = exports.logAdminAction = exports.onTransactionAudit = exports.onUserAudit = exports.onContractAudit = exports.onUserAction = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
const uuid_1 = require("uuid");
const db = (0, firestore_2.getFirestore)();
// Log user actions automatically
exports.onUserAction = (0, firestore_1.onDocumentCreated)('user_actions/{actionId}', async (event) => {
    var _a;
    const action = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!action)
        return;
    try {
        await (0, exports.logAuditEvent)({
            action: action.type,
            userId: action.userId,
            resource: action.resource,
            resourceId: action.resourceId,
            metadata: action.metadata || {},
            severity: determineSeverity(action.type),
            category: determineCategory(action.type),
            success: action.success !== false,
            errorMessage: action.error
        });
    }
    catch (error) {
        firebase_functions_1.logger.error('Error logging user action:', error);
    }
});
// Monitor contract changes for audit
exports.onContractAudit = (0, firestore_1.onDocumentUpdated)('contratos/{contractId}', async (event) => {
    var _a, _b;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!before || !after)
        return;
    const contractId = event.params.contractId;
    try {
        // Log significant contract changes
        const significantChanges = detectSignificantChanges(before, after);
        if (significantChanges.length > 0) {
            await (0, exports.logAuditEvent)({
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
            });
        }
        // Monitor for suspicious patterns
        await detectSuspiciousActivity(contractId, before, after);
    }
    catch (error) {
        firebase_functions_1.logger.error('Error auditing contract change:', error);
    }
});
// Monitor user changes for audit
exports.onUserAudit = (0, firestore_1.onDocumentUpdated)('usuarios/{userId}', async (event) => {
    var _a, _b;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!before || !after)
        return;
    const userId = event.params.userId;
    try {
        // Log profile changes
        const profileChanges = detectProfileChanges(before, after);
        if (profileChanges.length > 0) {
            await (0, exports.logAuditEvent)({
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
            });
        }
        // Monitor for privilege escalation
        if (before.tipo !== after.tipo) {
            await (0, exports.logSecurityEvent)({
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
            });
        }
    }
    catch (error) {
        firebase_functions_1.logger.error('Error auditing user change:', error);
    }
});
// Monitor financial transactions
exports.onTransactionAudit = (0, firestore_1.onDocumentCreated)('transacciones/{transactionId}', async (event) => {
    var _a;
    const transaction = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!transaction)
        return;
    const transactionId = event.params.transactionId;
    try {
        await (0, exports.logAuditEvent)({
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
        });
        // Check for suspicious transaction patterns
        await detectSuspiciousTransactions(transaction);
    }
    catch (error) {
        firebase_functions_1.logger.error('Error auditing transaction:', error);
    }
});
// Log admin actions
exports.logAdminAction = (0, https_1.onCall)(async (request) => {
    const { adminId, action, targetUserId, targetResource, details, ipAddress, userAgent } = request.data;
    if (!adminId || !action) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields');
    }
    try {
        // Verify admin permissions
        const adminDoc = await db.collection('usuarios').doc(adminId).get();
        const admin = adminDoc.data();
        if (!admin || admin.tipo !== 'admin') {
            throw new https_1.HttpsError('permission-denied', 'Not authorized to log admin actions');
        }
        await (0, exports.logAuditEvent)({
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
        });
        return { success: true };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error logging admin action:', error);
        throw new https_1.HttpsError('internal', 'Failed to log admin action');
    }
});
// Log security events
const logSecurityEvent = async (eventData) => {
    try {
        const securityEvent = Object.assign({ id: (0, uuid_1.v4)(), timestamp: new Date(), resolved: false, actions: [] }, eventData);
        await db.collection('security_events').add(securityEvent);
        // Auto-respond to critical security events
        if (securityEvent.riskLevel === 'critical') {
            await handleCriticalSecurityEvent(securityEvent);
        }
        // Log as audit event as well
        await (0, exports.logAuditEvent)({
            action: `security_${eventData.type}`,
            userId: eventData.userId,
            resource: 'security',
            metadata: eventData.details,
            severity: 'critical',
            category: 'security',
            success: true,
            ipAddress: eventData.ipAddress,
            userAgent: eventData.userAgent
        });
        return securityEvent.id;
    }
    catch (error) {
        firebase_functions_1.logger.error('Error logging security event:', error);
        throw error;
    }
};
exports.logSecurityEvent = logSecurityEvent;
// Generate audit reports
exports.generateAuditReport = (0, https_1.onCall)(async (request) => {
    const { adminId, startDate, endDate, categories, severity } = request.data;
    if (!adminId) {
        throw new https_1.HttpsError('invalid-argument', 'Admin ID required');
    }
    try {
        // Verify admin permissions
        const adminDoc = await db.collection('usuarios').doc(adminId).get();
        const admin = adminDoc.data();
        if (!admin || admin.tipo !== 'admin') {
            throw new https_1.HttpsError('permission-denied', 'Not authorized to generate audit reports');
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        // Build query
        let query = db.collection('audit_logs')
            .where('timestamp', '>=', start)
            .where('timestamp', '<=', end);
        if (categories && categories.length > 0) {
            query = query.where('category', 'in', categories);
        }
        if (severity) {
            query = query.where('severity', '==', severity);
        }
        const auditLogsQuery = await query.get();
        const auditLogs = auditLogsQuery.docs.map(doc => doc.data());
        // Generate report
        const report = {
            id: (0, uuid_1.v4)(),
            periodo: `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`,
            fechaGeneracion: new Date(),
            totalEventos: auditLogs.length,
            eventosPorCategoria: auditLogs.reduce((acc, log) => {
                acc[log.category] = (acc[log.category] || 0) + 1;
                return acc;
            }, {}),
            eventosPorSeveridad: auditLogs.reduce((acc, log) => {
                acc[log.severity] = (acc[log.severity] || 0) + 1;
                return acc;
            }, {}),
            usuariosMasActivos: getTopActiveUsers(auditLogs),
            eventosSeguridad: auditLogs.filter(log => log.category === 'security').length,
            tendencias: calculateTrends(auditLogs, start, end),
            recomendaciones: generateRecommendations(auditLogs)
        };
        // Save report
        await db.collection('audit_reports').doc(report.id).set(report);
        // Log report generation
        await (0, exports.logAuditEvent)({
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
        });
        return { success: true, reportId: report.id, report };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error generating audit report:', error);
        throw new https_1.HttpsError('internal', 'Failed to generate audit report');
    }
});
// Search audit logs
exports.searchAuditLogs = (0, https_1.onCall)(async (request) => {
    const { adminId, filters, limit = 100, offset = 0 } = request.data;
    if (!adminId) {
        throw new https_1.HttpsError('invalid-argument', 'Admin ID required');
    }
    try {
        // Verify admin permissions
        const adminDoc = await db.collection('usuarios').doc(adminId).get();
        const admin = adminDoc.data();
        if (!admin || admin.tipo !== 'admin') {
            throw new https_1.HttpsError('permission-denied', 'Not authorized to search audit logs');
        }
        // Build query based on filters
        let query = db.collection('audit_logs').orderBy('timestamp', 'desc');
        if (filters.startDate) {
            query = query.where('timestamp', '>=', new Date(filters.startDate));
        }
        if (filters.endDate) {
            query = query.where('timestamp', '<=', new Date(filters.endDate));
        }
        if (filters.userId) {
            query = query.where('userId', '==', filters.userId);
        }
        if (filters.category) {
            query = query.where('category', '==', filters.category);
        }
        if (filters.severity) {
            query = query.where('severity', '==', filters.severity);
        }
        if (filters.action) {
            query = query.where('action', '==', filters.action);
        }
        // Apply pagination
        if (offset > 0) {
            const offsetQuery = await db.collection('audit_logs')
                .orderBy('timestamp', 'desc')
                .limit(offset)
                .get();
            if (!offsetQuery.empty) {
                const lastDoc = offsetQuery.docs[offsetQuery.docs.length - 1];
                query = query.startAfter(lastDoc);
            }
        }
        const results = await query.limit(limit).get();
        const logs = results.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // Log search action
        await (0, exports.logAuditEvent)({
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
        });
        return { success: true, logs, hasMore: results.docs.length === limit };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error searching audit logs:', error);
        throw new https_1.HttpsError('internal', 'Failed to search audit logs');
    }
});
// Helper function to log audit events
const logAuditEvent = async (eventData) => {
    try {
        const auditLog = Object.assign({ id: (0, uuid_1.v4)(), timestamp: new Date() }, eventData);
        await db.collection('audit_logs').add(auditLog);
        // Also log to console for immediate visibility
        firebase_functions_1.logger.info(`Audit: ${auditLog.action}`, {
            userId: auditLog.userId,
            resource: auditLog.resource,
            severity: auditLog.severity,
            success: auditLog.success
        });
        return auditLog.id;
    }
    catch (error) {
        firebase_functions_1.logger.error('Error logging audit event:', error);
        throw error;
    }
};
exports.logAuditEvent = logAuditEvent;
// Helper functions
function determineSeverity(action) {
    const criticalActions = ['login_failed', 'unauthorized_access', 'data_breach', 'privilege_escalation'];
    const highActions = ['transaction_created', 'contract_completed', 'user_banned', 'escrow_released'];
    const mediumActions = ['profile_updated', 'contract_created', 'message_sent'];
    if (criticalActions.some(a => action.includes(a)))
        return 'critical';
    if (highActions.some(a => action.includes(a)))
        return 'high';
    if (mediumActions.some(a => action.includes(a)))
        return 'medium';
    return 'low';
}
function determineCategory(action) {
    if (action.includes('login') || action.includes('auth'))
        return 'auth';
    if (action.includes('transaction') || action.includes('escrow') || action.includes('payment'))
        return 'financial';
    if (action.includes('admin'))
        return 'admin';
    if (action.includes('security') || action.includes('breach') || action.includes('suspicious'))
        return 'security';
    if (action.includes('user') || action.includes('profile'))
        return 'user';
    return 'system';
}
function detectSignificantChanges(before, after) {
    const changes = [];
    const significantFields = ['estado', 'precio', 'especialistaId', 'fechaLimite'];
    significantFields.forEach(field => {
        if (before[field] !== after[field]) {
            changes.push(`${field}: ${before[field]} -> ${after[field]}`);
        }
    });
    return changes;
}
function getChangeSeverity(changes) {
    const criticalChanges = ['estado', 'precio'];
    const highChanges = ['especialistaId', 'fechaLimite'];
    if (changes.some(c => criticalChanges.some(cc => c.includes(cc))))
        return 'critical';
    if (changes.some(c => highChanges.some(hc => c.includes(hc))))
        return 'high';
    return 'medium';
}
function detectProfileChanges(before, after) {
    const changes = [];
    const profileFields = ['alias', 'email', 'tipo', 'estado', 'habilidades'];
    profileFields.forEach(field => {
        if (JSON.stringify(before[field]) !== JSON.stringify(after[field])) {
            changes.push(`${field}: ${JSON.stringify(before[field])} -> ${JSON.stringify(after[field])}`);
        }
    });
    return changes;
}
function getProfileChangeSeverity(changes) {
    const criticalChanges = ['tipo', 'estado'];
    const highChanges = ['email'];
    if (changes.some(c => criticalChanges.some(cc => c.includes(cc))))
        return 'critical';
    if (changes.some(c => highChanges.some(hc => c.includes(hc))))
        return 'high';
    return 'medium';
}
function filterSensitiveData(data) {
    const filtered = Object.assign({}, data);
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'cv'];
    sensitiveFields.forEach(field => {
        if (filtered[field]) {
            filtered[field] = '[REDACTED]';
        }
    });
    return filtered;
}
async function detectSuspiciousActivity(contractId, before, after) {
    // Detect rapid state changes
    if (before.estado !== after.estado) {
        const recentChanges = await db.collection('audit_logs')
            .where('resourceId', '==', contractId)
            .where('action', '==', 'contract_updated')
            .where('timestamp', '>=', new Date(Date.now() - 60 * 60 * 1000)) // Last hour
            .get();
        if (recentChanges.docs.length > 5) {
            await (0, exports.logSecurityEvent)({
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
            });
        }
    }
}
async function detectSuspiciousTransactions(transaction) {
    // Check for unusually large amounts
    if (transaction.monto > 10000) {
        await (0, exports.logSecurityEvent)({
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
        });
    }
    // Check for rapid transactions from same user
    const recentTransactions = await db.collection('transacciones')
        .where('clienteId', '==', transaction.clienteId)
        .where('fechaCreacion', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))
        .get();
    if (recentTransactions.docs.length > 10) {
        await (0, exports.logSecurityEvent)({
            type: 'suspicious_activity',
            userId: transaction.clienteId,
            ipAddress: 'unknown',
            userAgent: 'system',
            details: {
                action: 'rapid_transactions',
                transactionsIn24h: recentTransactions.docs.length
            },
            riskLevel: 'medium'
        });
    }
}
async function handleCriticalSecurityEvent(event) {
    // Auto-suspend user for critical security events
    if (event.userId && event.riskLevel === 'critical') {
        await db.collection('usuarios').doc(event.userId).update({
            estado: 'suspendido',
            razonSuspension: `Automatic suspension due to security event: ${event.type}`,
            fechaSuspension: firestore_2.FieldValue.serverTimestamp()
        });
        // Notify admins
        const adminsQuery = await db.collection('usuarios').where('tipo', '==', 'admin').get();
        if (!adminsQuery.empty) {
            // Send notification to admin (implementation depends on notification system)
            firebase_functions_1.logger.warn(`Critical security event: ${event.type} for user ${event.userId}`);
        }
    }
}
function getTopActiveUsers(logs) {
    const userCounts = logs.reduce((acc, log) => {
        if (log.userId) {
            acc[log.userId] = (acc[log.userId] || 0) + 1;
        }
        return acc;
    }, {});
    return Object.entries(userCounts)
        .map(([userId, eventos]) => ({ userId, eventos }))
        .sort((a, b) => b.eventos - a.eventos)
        .slice(0, 10);
}
function calculateTrends(logs, startDate, endDate) {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyEvents = {};
    logs.forEach(log => {
        const day = log.timestamp.toISOString().split('T')[0];
        dailyEvents[day] = (dailyEvents[day] || 0) + 1;
    });
    return {
        dailyEvents,
        averageEventsPerDay: logs.length / days,
        peakDay: Object.entries(dailyEvents).sort(([, a], [, b]) => b - a)[0],
        growthRate: calculateGrowthRate(dailyEvents)
    };
}
function calculateGrowthRate(dailyEvents) {
    const days = Object.keys(dailyEvents).sort();
    if (days.length < 2)
        return 0;
    const firstHalf = days.slice(0, Math.floor(days.length / 2));
    const secondHalf = days.slice(Math.floor(days.length / 2));
    const firstHalfAvg = firstHalf.reduce((sum, day) => sum + dailyEvents[day], 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, day) => sum + dailyEvents[day], 0) / secondHalf.length;
    return ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
}
function generateRecommendations(logs) {
    const recommendations = [];
    const securityEvents = logs.filter(log => log.category === 'security').length;
    const failedLogins = logs.filter(log => log.action.includes('login_failed')).length;
    const adminActions = logs.filter(log => log.category === 'admin').length;
    if (securityEvents > logs.length * 0.1) {
        recommendations.push('Alto número de eventos de seguridad detectados. Revisar políticas de seguridad.');
    }
    if (failedLogins > logs.length * 0.05) {
        recommendations.push('Múltiples intentos de login fallidos. Considerar implementar CAPTCHA o bloqueo temporal.');
    }
    if (adminActions > logs.length * 0.2) {
        recommendations.push('Alta actividad administrativa. Revisar necesidad de acciones automatizadas.');
    }
    const errorRate = logs.filter(log => !log.success).length / logs.length;
    if (errorRate > 0.1) {
        recommendations.push('Alta tasa de errores detectada. Revisar estabilidad del sistema.');
    }
    return recommendations;
}
//# sourceMappingURL=audit.js.map