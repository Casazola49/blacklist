export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface ContractData {
  titulo: string
  descripcion: string
  fechaLimite: Date
  tipoServicio: string
  presupuestoSugerido: number
}

export interface FileUpload {
  name: string
  size: number
  type: string
}

export function validateContractData(data: ContractData): ValidationResult {
  const errors: string[] = []

  // Validate title
  if (!data.titulo || data.titulo.length < 3) {
    errors.push('titulo-too-short')
  }

  // Validate description
  if (!data.descripcion || data.descripcion.trim().length === 0) {
    errors.push('descripcion-empty')
  }

  // Validate deadline
  if (!data.fechaLimite || data.fechaLimite < new Date()) {
    errors.push('fecha-limite-past')
  }

  // Validate service type
  const validServiceTypes = ['realizacion', 'revision']
  if (!validServiceTypes.includes(data.tipoServicio)) {
    errors.push('tipo-servicio-invalid')
  }

  // Validate budget
  if (data.presupuestoSugerido <= 0) {
    errors.push('presupuesto-negative')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function sanitizeInput(input: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      // Remove HTML tags and script content
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        // Remove SQL injection patterns
        .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi, '')
        .trim()
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

export function validateFileUpload(file: FileUpload): ValidationResult {
  const errors: string[] = []
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ]

  // Check file size
  if (file.size > maxSize) {
    errors.push('file-size-too-large')
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push('file-type-not-allowed')
  }

  // Check for dangerous file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com']
  const hasExtension = dangerousExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  )
  
  if (hasExtension) {
    errors.push('file-type-not-allowed')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}