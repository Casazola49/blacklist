# The Blacklist - Cloud Functions

Este directorio contiene las Cloud Functions para Firebase que manejan la lógica del servidor para The Blacklist.

## Estructura

```
functions/
├── src/
│   ├── index.ts          # Punto de entrada principal
│   ├── notifications.ts  # Sistema de notificaciones
│   ├── escrow.ts        # Procesamiento de pagos y escrow
│   ├── commissions.ts   # Cálculo automático de comisiones
│   ├── cleanup.ts       # Limpieza automática de datos temporales
│   └── audit.ts         # Funciones de auditoría y logging
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Funciones Implementadas

### 1. Sistema de Escrow (`escrow.ts`)
- `createEscrowTransaction`: Crear transacción de escrow
- `confirmEscrowPayment`: Confirmar pago y mover fondos a garantía
- `releaseEscrowFunds`: Liberar fondos al especialista
- `refundEscrowFunds`: Reembolsar fondos al cliente
- `expireQRCodes`: Expirar códigos QR automáticamente

### 2. Notificaciones (`notifications.ts`)
- `sendPushNotification`: Enviar notificaciones push
- `sendEmailNotification`: Enviar notificaciones por email
- `onContractChange`: Auto-notificar cambios de contrato
- `onNewProposal`: Auto-notificar nuevas propuestas
- `onNewMessage`: Auto-notificar nuevos mensajes

### 3. Comisiones (`commissions.ts`)
- `calculateCommission`: Calcular comisión por transacción
- `getSpecialistTier`: Obtener tier del especialista
- `generateMonthlyCommissionReport`: Generar reporte mensual
- `updateSpecialistTiers`: Actualizar tiers mensualmente
- `getCommissionAnalytics`: Obtener analíticas de comisiones

### 4. Limpieza (`cleanup.ts`)
- `cleanExpiredQRCodes`: Limpiar códigos QR expirados (diario)
- `cleanOldNotifications`: Limpiar notificaciones antiguas (semanal)
- `cleanTempFiles`: Limpiar archivos temporales (diario)
- `cleanInactiveSessions`: Limpiar sesiones inactivas (diario)
- `cleanOldAuditLogs`: Limpiar logs de auditoría antiguos (mensual)
- `triggerManualCleanup`: Trigger manual para admins

### 5. Auditoría (`audit.ts`)
- `logAdminAction`: Registrar acciones de administrador
- `generateAuditReport`: Generar reportes de auditoría
- `searchAuditLogs`: Buscar en logs de auditoría
- `onUserAction`: Auto-auditar acciones de usuario
- `onContractAudit`: Auto-auditar cambios de contrato
- `onTransactionAudit`: Auto-auditar transacciones financieras

## Configuración

### 1. Instalar Dependencias
```bash
cd functions
npm install
```

### 2. Configurar Variables de Entorno
```bash
cp .env.example .env
# Editar .env con tus valores reales
```

### 3. Compilar TypeScript
```bash
npm run build
```

### 4. Ejecutar Localmente
```bash
npm run serve
```

### 5. Desplegar a Firebase
```bash
npm run deploy
```

## Variables de Entorno Requeridas

- `EMAIL_USER`: Email para envío de notificaciones
- `EMAIL_PASSWORD`: Contraseña de aplicación de Gmail
- `STRIPE_SECRET_KEY`: Clave secreta de Stripe
- `APP_URL`: URL de la aplicación web

## Triggers Automáticos

### Triggers de Firestore
- Cambios en contratos → Notificaciones automáticas
- Nuevas propuestas → Notificación al cliente
- Nuevos mensajes → Notificación a participantes
- Cambios de usuario → Auditoría automática
- Nuevas transacciones → Auditoría financiera

### Triggers Programados
- **Diario 02:00**: Limpiar códigos QR expirados
- **Diario 01:00**: Limpiar sesiones inactivas
- **Diario 04:00**: Limpiar archivos temporales
- **Semanal Domingo 03:00**: Limpiar notificaciones antiguas
- **Mensual día 1 05:00**: Limpiar logs de auditoría antiguos
- **Mensual día 1 00:00**: Generar reporte de comisiones
- **Mensual día 1 00:00**: Actualizar tiers de especialistas

## Seguridad

### Autenticación
- Todas las funciones callable verifican autenticación
- Funciones de admin verifican permisos específicos
- Logs de auditoría para todas las acciones críticas

### Validación
- Validación de entrada en todas las funciones
- Sanitización de datos sensibles en logs
- Rate limiting automático por Firebase

### Monitoreo
- Logging automático de errores
- Eventos de seguridad para actividad sospechosa
- Alertas automáticas para eventos críticos

## Testing

### Ejecutar Tests
```bash
npm test
```

### Tests de Integración
```bash
npm run test:integration
```

### Coverage
```bash
npm run test:coverage
```

## Monitoreo y Logs

### Ver Logs en Tiempo Real
```bash
npm run logs
```

### Métricas en Firebase Console
- Invocaciones por función
- Tiempo de ejecución
- Errores y excepciones
- Uso de memoria

## Troubleshooting

### Errores Comunes

1. **Error de permisos**: Verificar reglas de Firestore
2. **Timeout**: Aumentar timeout en funciones pesadas
3. **Memory limit**: Optimizar consultas y procesamiento
4. **Cold start**: Usar funciones de calentamiento si es necesario

### Debug Local
```bash
# Habilitar debug
export DEBUG=true
npm run serve
```

### Logs Detallados
```bash
# Ver logs específicos de una función
firebase functions:log --only functionName
```

## Contribución

1. Seguir convenciones de TypeScript
2. Agregar tests para nuevas funciones
3. Documentar cambios en este README
4. Usar logging apropiado para debugging
5. Validar entrada y manejar errores correctamente