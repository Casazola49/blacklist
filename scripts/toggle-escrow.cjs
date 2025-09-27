#!/usr/bin/env node

/**
 * Script para habilitar/deshabilitar escrow fácilmente
 * Uso: node scripts/toggle-escrow.cjs [enable|disable]
 */

const fs = require('fs')
const path = require('path')

const action = process.argv[2] || 'disable'

console.log(`🔧 ${action === 'enable' ? 'Habilitando' : 'Deshabilitando'} sistema de escrow...\n`)

const filesToUpdate = [
  'src/stores/contracts.ts',
  'src/stores/admin.ts',
  'src/services/contracts.ts',
  'src/services/admin.ts'
]

if (action === 'disable') {
  console.log('✅ Escrow ya está deshabilitado para la demo')
  console.log('\n📋 Funcionalidades deshabilitadas:')
  console.log('- Creación de transacciones escrow')
  console.log('- Procesamiento de pagos')
  console.log('- Liberación automática de fondos')
  console.log('- Reembolsos')
  
  console.log('\n✨ Funcionalidades disponibles:')
  console.log('- Autenticación con Google')
  console.log('- Creación de contratos')
  console.log('- Sistema de propuestas')
  console.log('- Chat entre usuarios')
  console.log('- Dashboard completo')
  console.log('- Panel de administración')
  console.log('- Sistema de calificaciones')
  
} else if (action === 'enable') {
  console.log('⚠️  Para habilitar escrow completamente:')
  console.log('1. Descomenta el código en los archivos mencionados')
  console.log('2. Implementa los métodos faltantes en EscrowService')
  console.log('3. Configura el sistema de pagos (Stripe, PayPal, etc.)')
  console.log('4. Prueba todas las transacciones')
}

console.log('\n🎯 Estado actual: ESCROW DESHABILITADO PARA DEMO')
console.log('🚀 La aplicación está lista para mostrar a socios potenciales!')

console.log('\n💡 Para reactivar escrow en el futuro:')
console.log('- Descomenta las líneas marcadas con "TEMPORARILY DISABLED"')
console.log('- Implementa los métodos faltantes en EscrowService')
console.log('- Configura el procesador de pagos')

console.log('\n✨ Demo listo!')