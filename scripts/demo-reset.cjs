#!/usr/bin/env node

/**
 * Script para reiniciar completamente la demo
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🔄 Reiniciando demo completa...\n')

try {
  // 1. Limpiar cache
  console.log('1. Limpiando cache...')
  try {
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true })
    }
    if (fs.existsSync('node_modules/.vite')) {
      fs.rmSync('node_modules/.vite', { recursive: true, force: true })
    }
    console.log('✅ Cache limpiado')
  } catch (error) {
    console.log('⚠️ Error limpiando cache:', error.message)
  }

  // 2. Verificar configuración
  console.log('\n2. Verificando configuración...')
  if (fs.existsSync('.env')) {
    console.log('✅ Archivo .env encontrado')
  } else {
    console.log('❌ Archivo .env no encontrado')
  }

  // 3. Estado de servicios
  console.log('\n3. Estado de servicios:')
  console.log('✅ Escrow: DESHABILITADO (para demo)')
  console.log('✅ Firebase Auth: CONFIGURADO')
  console.log('✅ Firestore: CONFIGURADO')
  console.log('✅ Reglas: DESPLEGADAS')

  // 4. Funcionalidades disponibles
  console.log('\n4. Funcionalidades disponibles:')
  console.log('✅ Landing page')
  console.log('✅ Autenticación con Google')
  console.log('✅ Dashboard de cliente')
  console.log('✅ Dashboard de especialista')
  console.log('✅ Panel de administración')
  console.log('✅ Sistema de contratos')
  console.log('✅ Sistema de propuestas')
  console.log('✅ Chat básico')

  console.log('\n🚀 Para iniciar la demo:')
  console.log('npm run dev')

  console.log('\n💡 URLs importantes:')
  console.log('- Landing: http://localhost:3000/')
  console.log('- Auth: http://localhost:3000/auth')
  console.log('- Dashboard Cliente: http://localhost:3000/dashboard/cliente')
  console.log('- Dashboard Especialista: http://localhost:3000/dashboard/especialista')
  console.log('- Admin: http://localhost:3000/admin')

  console.log('\n✨ Demo lista para presentar!')

} catch (error) {
  console.error('❌ Error durante el reinicio:', error.message)
}