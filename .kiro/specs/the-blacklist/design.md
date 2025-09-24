# Documento de Diseño - The Blacklist

## Visión General

The Blacklist es una Progressive Web App (PWA) de alta tecnología que funciona como un marketplace exclusivo para conectar estudiantes universitarios ("Clientes") con académicos de élite ("Especialistas"). La plataforma implementa un sistema sofisticado de licitación, depósito en garantía y calificaciones, todo envuelto en una identidad visual futurista que refleja exclusividad y poder tecnológico.

### Principios de Diseño

1. **Exclusividad Digital**: Interfaz que transmite élite tecnológica y acceso restringido
2. **Experiencia Inmersiva**: Efectos visuales avanzados que mantienen al usuario enganchado
3. **Seguridad Transparente**: Procesos de confianza visibles pero sofisticados
4. **Eficiencia Inteligente**: Flujos optimizados que minimizan fricción
5. **Identidad Subversiva**: Lenguaje y estética que desafía lo convencional

## Arquitectura del Sistema

### Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                    Cliente (PWA)                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Vue.js 3      │  │  Tailwind CSS   │  │   PWA Core   │ │
│  │ (Composition)   │  │   + Custom      │  │  Service     │ │
│  │     API         │  │   Animations    │  │   Worker     │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Firebase Ecosystem                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Firestore     │  │  Authentication │  │   Storage    │ │
│  │   (Database)    │  │    (Gmail)      │  │   (Files)    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Cloud Functions │  │   Hosting       │  │  Messaging   │ │
│  │  (Server Logic) │  │   (Deploy)      │  │ (Push Notif) │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Arquitectura de Componentes Frontend

```
src/
├── components/
│   ├── ui/                    # Componentes base reutilizables
│   │   ├── NeonButton.vue
│   │   ├── GlitchText.vue
│   │   ├── HologramCard.vue
│   │   └── CyberLoader.vue
│   ├── layout/                # Componentes de layout
│   │   ├── AppHeader.vue
│   │   ├── AppSidebar.vue
│   │   └── AppFooter.vue
│   ├── landing/               # Componentes específicos de landing
│   │   ├── HeroSection.vue
│   │   ├── ArsenalIA.vue
│   │   ├── GaleriaElite.vue
│   │   └── BibliotecaClasificada.vue
│   ├── dashboard/             # Componentes de dashboards
│   │   ├── ClienteDashboard.vue
│   │   ├── EspecialistaDashboard.vue
│   │   └── AdminDashboard.vue
│   └── shared/                # Componentes compartidos
│       ├── ChatPrivado.vue
│       ├── SistemaEscrow.vue
│       └── CalificacionMutua.vue
├── views/                     # Vistas principales
├── stores/                    # Pinia stores
├── services/                  # Servicios Firebase
├── utils/                     # Utilidades
└── assets/                    # Assets estáticos
```

## Componentes y Interfaces

### 1. Sistema de Autenticación

**Componente**: `AuthenticationFlow.vue`

**Interfaces**:
```typescript
interface Usuario {
  uid: string;
  email: string;
  alias: string;
  tipo: 'cliente' | 'especialista' | 'admin';
  fechaCreacion: Date;
  estado: 'activo' | 'suspendido' | 'pendiente';
}

interface Cliente extends Usuario {
  tipo: 'cliente';
  saldoEscrow: number;
  contractosActivos: string[];
  historialContratos: string[];
}

interface Especialista extends Usuario {
  tipo: 'especialista';
  nombreReal: string;
  cv: string;
  habilidades: string[];
  biografia: string;
  calificacionPromedio: number;
  trabajosCompletados: number;
  gananciasTotal: number;
  estado: 'activo' | 'suspendido' | 'pendiente' | 'rechazado';
}
```

### 2. Sistema de Contratos

**Componente**: `ContratoManager.vue`

**Interfaces**:
```typescript
interface Contrato {
  id: string;
  clienteId: string;
  especialistaId?: string;
  titulo: string;
  descripcion: string;
  archivosAdjuntos: string[];
  fechaLimite: Date;
  tipoServicio: 'realizacion' | 'revision';
  presupuestoSugerido: number;
  precioFinal?: number;
  estado: EstadoContrato;
  fechaCreacion: Date;
  fechaAsignacion?: Date;
  fechaCompletado?: Date;
  propuestas: Propuesta[];
  chatId?: string;
}

type EstadoContrato = 
  | 'abierto'           // Recibiendo propuestas
  | 'esperando_deposito' // Propuesta aceptada, esperando pago
  | 'fondos_garantia'   // Fondos en escrow, trabajo iniciado
  | 'entrega_realizada' // Especialista entregó trabajo
  | 'completado'        // Cliente aprobó y liberó fondos
  | 'disputado'         // En proceso de resolución
  | 'cancelado';        // Cancelado por cualquier razón

interface Propuesta {
  id: string;
  especialistaId: string;
  contratoId: string;
  precio: number;
  mensaje: string;
  fechaEnvio: Date;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
}
```

### 3. Sistema de Escrow

**Componente**: `EscrowSystem.vue`

**Interfaces**:
```typescript
interface TransaccionEscrow {
  id: string;
  contratoId: string;
  clienteId: string;
  especialistaId: string;
  monto: number;
  comisionPlataforma: number; // 15%
  estado: EstadoEscrow;
  fechaDeposito?: Date;
  fechaLiberacion?: Date;
  codigoQR?: string;
  referenciaTransaccion?: string;
}

type EstadoEscrow = 
  | 'pendiente_deposito'
  | 'fondos_retenidos'
  | 'liberado_especialista'
  | 'reembolsado_cliente'
  | 'en_disputa';

interface PagoQR {
  contratoId: string;
  monto: number;
  codigoQR: string;
  fechaExpiracion: Date;
  estado: 'activo' | 'usado' | 'expirado';
}
```

### 4. Sistema de Comunicación

**Componente**: `ChatPrivado.vue`

**Interfaces**:
```typescript
interface Chat {
  id: string;
  contratoId: string;
  participantes: string[]; // [clienteId, especialistaId]
  mensajes: Mensaje[];
  fechaCreacion: Date;
  estado: 'activo' | 'archivado';
}

interface Mensaje {
  id: string;
  chatId: string;
  autorId: string;
  contenido: string;
  tipo: 'texto' | 'archivo' | 'sistema';
  archivos?: ArchivoAdjunto[];
  fechaEnvio: Date;
  leido: boolean;
}

interface ArchivoAdjunto {
  nombre: string;
  url: string;
  tipo: string;
  tamaño: number;
}
```

### 5. Sistema de Calificaciones

**Componente**: `CalificacionMutua.vue`

**Interfaces**:
```typescript
interface Calificacion {
  id: string;
  contratoId: string;
  evaluadorId: string;
  evaluadoId: string;
  puntuacion: number; // 1-5
  comentario: string;
  fechaCalificacion: Date;
  visible: boolean; // Solo visible cuando ambos califican
}

interface ResumenCalificaciones {
  usuarioId: string;
  promedioGeneral: number;
  totalCalificaciones: number;
  distribucion: {
    cinco: number;
    cuatro: number;
    tres: number;
    dos: number;
    uno: number;
  };
  comentariosRecientes: string[];
}
```

## Modelos de Datos

### Estructura de Base de Datos Firestore

```
/usuarios/{uid}
  - email: string
  - alias: string
  - tipo: 'cliente' | 'especialista' | 'admin'
  - fechaCreacion: timestamp
  - estado: string
  - [campos específicos según tipo]

/contratos/{contratoId}
  - clienteId: string
  - especialistaId?: string
  - titulo: string
  - descripcion: string
  - estado: string
  - fechaCreacion: timestamp
  - [otros campos del contrato]

/propuestas/{propuestaId}
  - contratoId: string
  - especialistaId: string
  - precio: number
  - mensaje: string
  - fechaEnvio: timestamp

/chats/{chatId}
  - contratoId: string
  - participantes: array
  - fechaCreacion: timestamp

/mensajes/{mensajeId}
  - chatId: string
  - autorId: string
  - contenido: string
  - fechaEnvio: timestamp

/transacciones/{transaccionId}
  - contratoId: string
  - monto: number
  - estado: string
  - fechaCreacion: timestamp

/calificaciones/{calificacionId}
  - contratoId: string
  - evaluadorId: string
  - evaluadoId: string
  - puntuacion: number
  - comentario: string
```

### Reglas de Seguridad Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios solo pueden leer/escribir sus propios datos
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Contratos: clientes pueden crear, especialistas pueden leer
    match /contratos/{contratoId} {
      allow create: if request.auth != null && 
        request.auth.uid == resource.data.clienteId;
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.clienteId || 
         request.auth.uid == resource.data.especialistaId);
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.clienteId || 
         request.auth.uid == resource.data.especialistaId);
    }
    
    // Propuestas: solo especialistas pueden crear
    match /propuestas/{propuestaId} {
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.especialistaId;
      allow read: if request.auth != null;
    }
    
    // Chats: solo participantes pueden acceder
    match /chats/{chatId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participantes;
    }
  }
}
```

## Manejo de Errores

### Estrategia de Manejo de Errores

1. **Errores de Red**: Implementar retry automático con backoff exponencial
2. **Errores de Autenticación**: Redirigir a login con mensaje contextual
3. **Errores de Validación**: Mostrar mensajes inline con efectos visuales
4. **Errores del Sistema**: Logging automático y notificación al admin
5. **Errores de Pago**: Notificación inmediata y opciones de recuperación

**Componente**: `ErrorHandler.vue`

```typescript
interface ErrorState {
  tipo: 'red' | 'auth' | 'validacion' | 'sistema' | 'pago';
  mensaje: string;
  codigo?: string;
  accionRecuperacion?: () => void;
  mostrarSoporte: boolean;
}

class ErrorManager {
  static manejarError(error: Error, contexto: string): void {
    // Log del error
    console.error(`Error en ${contexto}:`, error);
    
    // Determinar tipo de error
    const tipoError = this.determinarTipoError(error);
    
    // Mostrar notificación apropiada
    this.mostrarNotificacionError(tipoError, error.message);
    
    // Ejecutar acción de recuperación si existe
    this.ejecutarRecuperacion(tipoError, contexto);
  }
}
```

## Estrategia de Testing

### Tipos de Testing

1. **Unit Tests**: Componentes individuales con Vue Test Utils
2. **Integration Tests**: Flujos completos de usuario
3. **E2E Tests**: Cypress para flujos críticos
4. **Performance Tests**: Lighthouse CI para PWA
5. **Security Tests**: Validación de reglas de Firestore

### Casos de Prueba Críticos

```typescript
describe('Sistema de Escrow', () => {
  test('Debe crear transacción cuando cliente acepta propuesta', async () => {
    // Arrange
    const contrato = crearContratoMock();
    const propuesta = crearPropuestaMock();
    
    // Act
    await aceptarPropuesta(contrato.id, propuesta.id);
    
    // Assert
    expect(contrato.estado).toBe('esperando_deposito');
    expect(transaccionEscrow).toBeDefined();
  });
  
  test('Debe liberar fondos cuando cliente aprueba trabajo', async () => {
    // Arrange
    const transaccion = crearTransaccionMock('fondos_retenidos');
    
    // Act
    await aprobarTrabajo(transaccion.contratoId);
    
    // Assert
    expect(transaccion.estado).toBe('liberado_especialista');
    expect(especialista.gananciasTotal).toBeGreaterThan(0);
  });
});
```

## Consideraciones de Rendimiento

### Optimizaciones Frontend

1. **Lazy Loading**: Componentes y rutas cargadas bajo demanda
2. **Code Splitting**: Separación por roles (cliente/especialista/admin)
3. **Image Optimization**: WebP con fallback, lazy loading de imágenes
4. **Animation Performance**: GPU acceleration para animaciones complejas
5. **Bundle Size**: Tree shaking y análisis de dependencias

### Optimizaciones Backend

1. **Firestore Indexing**: Índices compuestos para consultas complejas
2. **Cloud Functions**: Cold start optimization
3. **Caching**: Redis para datos frecuentemente accedidos
4. **CDN**: Firebase Hosting con CDN global
5. **Real-time Optimization**: Listeners selectivos para reducir bandwidth

### Métricas de Rendimiento

```typescript
interface MetricasRendimiento {
  tiempoCargaInicial: number;    // < 3 segundos
  tiempoInteraccion: number;     // < 100ms
  puntuacionLighthouse: number;  // > 90
  tiempoOffline: number;         // Funcional sin conexión
  usoMemoria: number;            // < 50MB en móvil
}
```

## Consideraciones de Seguridad

### Medidas de Seguridad Implementadas

1. **Autenticación**: Firebase Auth con verificación de email
2. **Autorización**: Reglas granulares de Firestore
3. **Encriptación**: HTTPS obligatorio, datos sensibles encriptados
4. **Validación**: Sanitización de inputs en frontend y backend
5. **Auditoría**: Logging de acciones críticas
6. **Rate Limiting**: Prevención de spam y ataques DDoS
7. **Content Security Policy**: Headers de seguridad estrictos

### Protección de Datos Sensibles

```typescript
interface DatosProtegidos {
  // Nunca almacenar en cliente
  informacionPago: never;
  datosPersonalesCompletos: never;
  
  // Encriptar en base de datos
  mensajesChat: string; // Encriptados
  archivosAdjuntos: string; // URLs firmadas temporalmente
  
  // Anonimizar en logs
  identificadoresUsuario: string; // Hash en logs
}
```

## Diseño Visual Detallado

### Sistema de Colores Expandido

```css
:root {
  /* Colores Primarios */
  --bg-primary: #0A0A0A;
  --brand-primary: #800020;
  --accent-cyan: #00FFFF;
  --accent-magenta: #FF00FF;
  --text-primary: #EAEAEA;
  
  /* Colores Secundarios */
  --bg-secondary: #1A1A1A;
  --bg-tertiary: #2A2A2A;
  --brand-secondary: #A00030;
  --text-secondary: #CCCCCC;
  --text-muted: #888888;
  
  /* Estados */
  --success: #00FF88;
  --warning: #FFAA00;
  --error: #FF3366;
  --info: #3366FF;
  
  /* Efectos */
  --glow-cyan: 0 0 20px var(--accent-cyan);
  --glow-magenta: 0 0 20px var(--accent-magenta);
  --glow-brand: 0 0 20px var(--brand-primary);
}
```

### Componentes de Animación

```vue
<!-- GlitchText.vue -->
<template>
  <div class="glitch-container">
    <div class="glitch-text" :data-text="text">{{ text }}</div>
  </div>
</template>

<style scoped>
.glitch-text {
  position: relative;
  color: var(--text-primary);
  font-family: 'Orbitron', monospace;
  animation: glitch 2s infinite;
}

.glitch-text::before,
.glitch-text::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.glitch-text::before {
  animation: glitch-1 0.5s infinite;
  color: var(--accent-cyan);
  z-index: -1;
}

.glitch-text::after {
  animation: glitch-2 0.5s infinite;
  color: var(--accent-magenta);
  z-index: -2;
}

@keyframes glitch {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
}
</style>
```

Este diseño proporciona una base sólida y escalable para implementar The Blacklist, con especial atención a la experiencia visual futurista, la seguridad de las transacciones y la eficiencia del sistema de matching entre clientes y especialistas.