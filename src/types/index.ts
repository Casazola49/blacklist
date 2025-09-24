// Base User Interface
export interface Usuario {
  uid: string
  email: string
  alias: string
  tipo: 'cliente' | 'especialista' | 'admin'
  fechaCreacion: Date
  estado: 'activo' | 'suspendido' | 'pendiente'
}

// Cliente Interface
export interface Cliente extends Usuario {
  tipo: 'cliente'
  saldoEscrow: number
  contractosActivos: string[]
  historialContratos: string[]
}

// Especialista Interface
export interface Especialista extends Omit<Usuario, 'estado'> {
  tipo: 'especialista'
  nombreReal: string
  cv: string
  habilidades: string[]
  biografia: string
  calificacionPromedio: number
  trabajosCompletados: number
  gananciasTotal: number
  estado: 'activo' | 'suspendido' | 'pendiente' | 'rechazado'
}

// Contract States
export type EstadoContrato =
  | 'abierto' // Recibiendo propuestas
  | 'esperando_deposito' // Propuesta aceptada, esperando pago
  | 'fondos_garantia' // Fondos en escrow, trabajo iniciado
  | 'entrega_realizada' // Especialista entregó trabajo
  | 'completado' // Cliente aprobó y liberó fondos
  | 'disputado' // En proceso de resolución
  | 'cancelado' // Cancelado por cualquier razón

// Contract Interface
export interface Contrato {
  id: string
  clienteId: string
  especialistaId?: string
  titulo: string
  descripcion: string
  archivosAdjuntos: string[]
  fechaLimite: Date
  tipoServicio: 'realizacion' | 'revision'
  presupuestoSugerido: number
  precioFinal?: number
  estado: EstadoContrato
  fechaCreacion: Date
  fechaAsignacion?: Date
  fechaCompletado?: Date
  propuestas: Propuesta[]
  chatId?: string
}

// Proposal Interface
export interface Propuesta {
  id: string
  especialistaId: string
  contratoId: string
  precio: number
  mensaje: string
  fechaEnvio: Date
  estado: 'pendiente' | 'aceptada' | 'rechazada'
}

// Escrow States
export type EstadoEscrow =
  | 'pendiente_deposito'
  | 'fondos_retenidos'
  | 'liberado_especialista'
  | 'reembolsado_cliente'
  | 'en_disputa'

// Escrow Transaction Interface
export interface TransaccionEscrow {
  id: string
  contratoId: string
  clienteId: string
  especialistaId: string
  monto: number
  comisionPlataforma: number // 15%
  estado: EstadoEscrow
  fechaDeposito?: Date
  fechaLiberacion?: Date
  codigoQR?: string
  referenciaTransaccion?: string
}

// QR Payment Interface
export interface PagoQR {
  contratoId: string
  monto: number
  codigoQR: string
  fechaExpiracion: Date
  estado: 'activo' | 'usado' | 'expirado'
}

// Chat Interface
export interface Chat {
  id: string
  contratoId: string
  participantes: string[] // [clienteId, especialistaId]
  mensajes: Mensaje[]
  fechaCreacion: Date
  estado: 'activo' | 'archivado'
}

// Message Interface
export interface Mensaje {
  id: string
  chatId: string
  autorId: string
  contenido: string
  tipo: 'texto' | 'archivo' | 'sistema'
  archivos?: ArchivoAdjunto[]
  fechaEnvio: Date
  leido: boolean
}

// File Attachment Interface
export interface ArchivoAdjunto {
  nombre: string
  url: string
  tipo: string
  tamaño: number
}

// Rating Interface
export interface Calificacion {
  id: string
  contratoId: string
  evaluadorId: string
  evaluadoId: string
  puntuacion: number // 1-5
  comentario: string
  fechaCalificacion: Date
  visible: boolean // Solo visible cuando ambos califican
}

// Rating Summary Interface
export interface ResumenCalificaciones {
  usuarioId: string
  promedioGeneral: number
  totalCalificaciones: number
  distribucion: {
    cinco: number
    cuatro: number
    tres: number
    dos: number
    uno: number
  }
  comentariosRecientes: string[]
}

// Error Handling
export interface ErrorState {
  tipo: 'red' | 'auth' | 'validacion' | 'sistema' | 'pago'
  mensaje: string
  codigo?: string
  accionRecuperacion?: () => void
  mostrarSoporte: boolean
}

// Notification Types
export type NotificacionTipo =
  | 'nuevo_contrato'
  | 'propuesta_recibida'
  | 'contrato_asignado'
  | 'pago_recibido'
  | 'trabajo_entregado'
  | 'calificacion_recibida'
  | 'mensaje_chat'
  | 'recordatorio'
  | 'sistema'

// Notification Interface
export interface Notificacion {
  id: string
  tipo: NotificacionTipo
  titulo: string
  mensaje: string
  datos?: Record<string, any>
  prioridad: 'alta' | 'media' | 'baja'
  fechaCreacion: Date
  leida: boolean
}

// Notification Preferences Interface
export interface PreferenciasNotificacion {
  push: boolean
  email: boolean
  nuevoContrato: boolean
  propuestaRecibida: boolean
  contratoAsignado: boolean
  pagoRecibido: boolean
  trabajoEntregado: boolean
  calificacionRecibida: boolean
  mensajeChat: boolean
  recordatorios: boolean
}

// Performance Metrics
export interface MetricasRendimiento {
  tiempoCargaInicial: number // < 3 segundos
  tiempoInteraccion: number // < 100ms
  puntuacionLighthouse: number // > 90
  tiempoOffline: number // Funcional sin conexión
  usoMemoria: number // < 50MB en móvil
}