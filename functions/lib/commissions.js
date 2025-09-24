"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommissionAnalytics = exports.updateSpecialistTiers = exports.generateMonthlyCommissionReport = exports.onCommissionCreated = exports.getSpecialistTier = exports.calculateCommission = void 0;
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
const db = (0, firestore_2.getFirestore)();
// Calculate commission for a transaction
exports.calculateCommission = (0, https_1.onCall)(async (request) => {
    const { transactionId, montoBase, especialistaId } = request.data;
    if (!transactionId || !montoBase || !especialistaId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields');
    }
    try {
        // Get specialist tier to determine commission rate
        const tier = await (0, exports.getSpecialistTier)(especialistaId);
        const porcentajeComision = tier.porcentajeComision;
        // Calculate commission amount
        const montoComision = Math.round(montoBase * (porcentajeComision / 100));
        return {
            success: true,
            porcentajeComision,
            montoComision,
            tier: tier.tier,
            montoEspecialista: montoBase - montoComision
        };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error calculating commission:', error);
        throw new https_1.HttpsError('internal', 'Failed to calculate commission');
    }
});
// Get specialist commission tier based on performance
const getSpecialistTier = async (especialistaId) => {
    try {
        // Get specialist data
        const especialistaDoc = await db.collection('usuarios').doc(especialistaId).get();
        const especialista = especialistaDoc.data();
        if (!especialista) {
            throw new Error('Specialist not found');
        }
        const trabajosCompletados = especialista.trabajosCompletados || 0;
        const calificacionPromedio = especialista.calificacionPromedio || 0;
        // Calculate monthly volume (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentTransactionsQuery = await db.collection('transacciones')
            .where('especialistaId', '==', especialistaId)
            .where('fechaLiberacion', '>=', thirtyDaysAgo)
            .where('estado', '==', 'liberado_especialista')
            .get();
        const volumenMensual = recentTransactionsQuery.docs.reduce((total, doc) => {
            const transaction = doc.data();
            return total + (transaction.monto - transaction.comisionPlataforma);
        }, 0);
        // Determine tier and commission rate
        let tier = 'bronze';
        let porcentajeComision = 15; // Default 15%
        let beneficiosAdicionales = [];
        if (trabajosCompletados >= 100 && calificacionPromedio >= 4.8 && volumenMensual >= 5000) {
            tier = 'platinum';
            porcentajeComision = 8; // Only 8% commission for top performers
            beneficiosAdicionales = [
                'Prioridad en búsquedas',
                'Badge de Élite',
                'Soporte prioritario',
                'Acceso a proyectos premium',
                'Programa de referidos mejorado'
            ];
        }
        else if (trabajosCompletados >= 50 && calificacionPromedio >= 4.5 && volumenMensual >= 2500) {
            tier = 'gold';
            porcentajeComision = 10;
            beneficiosAdicionales = [
                'Badge de Oro',
                'Soporte prioritario',
                'Acceso a proyectos premium',
                'Programa de referidos'
            ];
        }
        else if (trabajosCompletados >= 20 && calificacionPromedio >= 4.0 && volumenMensual >= 1000) {
            tier = 'silver';
            porcentajeComision = 12;
            beneficiosAdicionales = [
                'Badge de Plata',
                'Soporte mejorado',
                'Programa de referidos básico'
            ];
        }
        const tierData = {
            especialistaId,
            trabajosCompletados,
            calificacionPromedio,
            volumenMensual,
            tier,
            porcentajeComision,
            beneficiosAdicionales
        };
        // Update specialist tier in database
        await db.collection('usuarios').doc(especialistaId).update({
            tier: tier,
            porcentajeComision: porcentajeComision,
            beneficiosAdicionales: beneficiosAdicionales,
            ultimaActualizacionTier: firestore_2.FieldValue.serverTimestamp()
        });
        return tierData;
    }
    catch (error) {
        firebase_functions_1.logger.error('Error getting specialist tier:', error);
        // Return default tier on error
        return {
            especialistaId,
            trabajosCompletados: 0,
            calificacionPromedio: 0,
            volumenMensual: 0,
            tier: 'bronze',
            porcentajeComision: 15,
            beneficiosAdicionales: []
        };
    }
};
exports.getSpecialistTier = getSpecialistTier;
// Process commission when transaction is completed
exports.onCommissionCreated = (0, firestore_1.onDocumentCreated)('comisiones/{commissionId}', async (event) => {
    var _a;
    const commission = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!commission)
        return;
    try {
        // Update platform revenue tracking
        await db.collection('revenue_tracking').add({
            fecha: firestore_2.FieldValue.serverTimestamp(),
            tipo: 'comision',
            monto: commission.montoComision,
            transactionId: commission.transactionId,
            contratoId: commission.contratoId,
            especialistaId: commission.especialistaId
        });
        // Update monthly commission summary
        const monthKey = new Date().toISOString().substring(0, 7); // YYYY-MM
        const summaryRef = db.collection('commission_summaries').doc(monthKey);
        await db.runTransaction(async (transaction) => {
            const summaryDoc = await transaction.get(summaryRef);
            if (summaryDoc.exists) {
                const summary = summaryDoc.data();
                transaction.update(summaryRef, {
                    totalComisiones: summary.totalComisiones + commission.montoComision,
                    totalTransacciones: summary.totalTransacciones + 1,
                    [`comisionesPorTipo.${commission.tipo}`]: (summary.comisionesPorTipo[commission.tipo] || 0) + commission.montoComision,
                    [`comisionesPorEspecialista.${commission.especialistaId}`]: (summary.comisionesPorEspecialista[commission.especialistaId] || 0) + commission.montoComision,
                    promedioComision: (summary.totalComisiones + commission.montoComision) / (summary.totalTransacciones + 1)
                });
            }
            else {
                const newSummary = {
                    periodo: monthKey,
                    totalComisiones: commission.montoComision,
                    totalTransacciones: 1,
                    comisionesPorTipo: { [commission.tipo]: commission.montoComision },
                    comisionesPorEspecialista: { [commission.especialistaId]: commission.montoComision },
                    promedioComision: commission.montoComision,
                    fechaGeneracion: new Date()
                };
                transaction.set(summaryRef, newSummary);
            }
        });
        firebase_functions_1.logger.info(`Processed commission ${event.params.commissionId} for ${commission.montoComision}`);
    }
    catch (error) {
        firebase_functions_1.logger.error('Error processing commission:', error);
    }
});
// Generate monthly commission report
exports.generateMonthlyCommissionReport = (0, scheduler_1.onSchedule)('0 0 1 * *', async () => {
    try {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const monthKey = lastMonth.toISOString().substring(0, 7);
        // Get all commissions for the month
        const commissionsQuery = await db.collection('comisiones')
            .where('fecha', '>=', new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1))
            .where('fecha', '<', new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1))
            .get();
        const commissions = commissionsQuery.docs.map(doc => doc.data());
        // Calculate detailed statistics
        const totalComisiones = commissions.reduce((sum, c) => sum + c.montoComision, 0);
        const totalTransacciones = commissions.length;
        const promedioComision = totalTransacciones > 0 ? totalComisiones / totalTransacciones : 0;
        // Group by type
        const comisionesPorTipo = commissions.reduce((acc, c) => {
            acc[c.tipo] = (acc[c.tipo] || 0) + c.montoComision;
            return acc;
        }, {});
        // Group by specialist
        const comisionesPorEspecialista = commissions.reduce((acc, c) => {
            acc[c.especialistaId] = (acc[c.especialistaId] || 0) + c.montoComision;
            return acc;
        }, {});
        // Top specialists by commission generated
        const topEspecialistas = Object.entries(comisionesPorEspecialista)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([id, amount]) => ({ especialistaId: id, comisionGenerada: amount }));
        // Calculate growth compared to previous month
        const previousMonthKey = new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1, 1)
            .toISOString().substring(0, 7);
        const previousSummaryDoc = await db.collection('commission_summaries').doc(previousMonthKey).get();
        const previousSummary = previousSummaryDoc.data();
        const crecimientoMensual = previousSummary
            ? ((totalComisiones - previousSummary.totalComisiones) / previousSummary.totalComisiones) * 100
            : 0;
        // Create comprehensive report
        const report = {
            periodo: monthKey,
            fechaGeneracion: new Date(),
            resumen: {
                totalComisiones,
                totalTransacciones,
                promedioComision,
                crecimientoMensual
            },
            desglosePorTipo: comisionesPorTipo,
            topEspecialistas,
            estadisticasDetalladas: {
                comisionMinima: Math.min(...commissions.map(c => c.montoComision)),
                comisionMaxima: Math.max(...commissions.map(c => c.montoComision)),
                mediana: calculateMedian(commissions.map(c => c.montoComision)),
                desviacionEstandar: calculateStandardDeviation(commissions.map(c => c.montoComision))
            },
            tendencias: {
                comisionesPorDia: calculateDailyCommissions(commissions, lastMonth),
                especialistasActivos: new Set(commissions.map(c => c.especialistaId)).size,
                ticketPromedio: commissions.reduce((sum, c) => sum + c.montoBase, 0) / totalTransacciones
            }
        };
        // Save report
        await db.collection('monthly_reports').doc(`commissions_${monthKey}`).set(report);
        // Update summary document
        const summary = {
            periodo: monthKey,
            totalComisiones,
            totalTransacciones,
            comisionesPorTipo,
            comisionesPorEspecialista,
            promedioComision,
            fechaGeneracion: new Date()
        };
        await db.collection('commission_summaries').doc(monthKey).set(summary);
        firebase_functions_1.logger.info(`Generated monthly commission report for ${monthKey}`);
    }
    catch (error) {
        firebase_functions_1.logger.error('Error generating monthly commission report:', error);
    }
});
// Update specialist tiers monthly
exports.updateSpecialistTiers = (0, scheduler_1.onSchedule)('0 0 1 * *', async () => {
    try {
        // Get all active specialists
        const especialistasQuery = await db.collection('usuarios')
            .where('tipo', '==', 'especialista')
            .where('estado', '==', 'activo')
            .get();
        const batch = db.batch();
        let updatedCount = 0;
        for (const doc of especialistasQuery.docs) {
            try {
                const tierData = await (0, exports.getSpecialistTier)(doc.id);
                // Update specialist document with new tier info
                batch.update(doc.ref, {
                    tier: tierData.tier,
                    porcentajeComision: tierData.porcentajeComision,
                    beneficiosAdicionales: tierData.beneficiosAdicionales,
                    ultimaActualizacionTier: firestore_2.FieldValue.serverTimestamp(),
                    estadisticasTier: {
                        trabajosCompletados: tierData.trabajosCompletados,
                        calificacionPromedio: tierData.calificacionPromedio,
                        volumenMensual: tierData.volumenMensual
                    }
                });
                updatedCount++;
            }
            catch (error) {
                firebase_functions_1.logger.error(`Error updating tier for specialist ${doc.id}:`, error);
            }
        }
        if (updatedCount > 0) {
            await batch.commit();
        }
        firebase_functions_1.logger.info(`Updated tiers for ${updatedCount} specialists`);
    }
    catch (error) {
        firebase_functions_1.logger.error('Error updating specialist tiers:', error);
    }
});
// Get commission analytics
exports.getCommissionAnalytics = (0, https_1.onCall)(async (request) => {
    const { startDate, endDate, especialistaId } = request.data;
    try {
        let query = db.collection('comisiones')
            .where('fecha', '>=', new Date(startDate))
            .where('fecha', '<=', new Date(endDate));
        if (especialistaId) {
            query = query.where('especialistaId', '==', especialistaId);
        }
        const commissionsQuery = await query.get();
        const commissions = commissionsQuery.docs.map(doc => doc.data());
        const analytics = {
            totalComisiones: commissions.reduce((sum, c) => sum + c.montoComision, 0),
            totalTransacciones: commissions.length,
            promedioComision: commissions.length > 0 ? commissions.reduce((sum, c) => sum + c.montoComision, 0) / commissions.length : 0,
            comisionesPorTipo: commissions.reduce((acc, c) => {
                acc[c.tipo] = (acc[c.tipo] || 0) + c.montoComision;
                return acc;
            }, {}),
            tendenciaDiaria: calculateDailyCommissions(commissions, new Date(startDate)),
            especialistasMasActivos: especialistaId ? null : getTopSpecialistsByCommissions(commissions)
        };
        return { success: true, analytics };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error getting commission analytics:', error);
        throw new https_1.HttpsError('internal', 'Failed to get analytics');
    }
});
// Helper functions
function calculateMedian(numbers) {
    const sorted = numbers.sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    return sorted[middle];
}
function calculateStandardDeviation(numbers) {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDifferences = numbers.map(num => Math.pow(num - mean, 2));
    const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / numbers.length;
    return Math.sqrt(variance);
}
function calculateDailyCommissions(commissions, startDate) {
    const dailyCommissions = {};
    commissions.forEach(commission => {
        const date = commission.fecha.toISOString().split('T')[0];
        dailyCommissions[date] = (dailyCommissions[date] || 0) + commission.montoComision;
    });
    return dailyCommissions;
}
function getTopSpecialistsByCommissions(commissions) {
    const specialistStats = commissions.reduce((acc, c) => {
        if (!acc[c.especialistaId]) {
            acc[c.especialistaId] = { totalComision: 0, transacciones: 0 };
        }
        acc[c.especialistaId].totalComision += c.montoComision;
        acc[c.especialistaId].transacciones += 1;
        return acc;
    }, {});
    return Object.entries(specialistStats)
        .map(([especialistaId, stats]) => ({
        especialistaId,
        totalComision: stats.totalComision,
        transacciones: stats.transacciones
    }))
        .sort((a, b) => b.totalComision - a.totalComision)
        .slice(0, 10);
}
//# sourceMappingURL=commissions.js.map