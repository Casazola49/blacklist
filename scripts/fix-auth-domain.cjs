#!/usr/bin/env node

/**
 * Script para diagnosticar y ayudar a corregir problemas de dominio de autenticación
 */

console.log('🔍 Diagnóstico de Autenticación Firebase\n')

// Leer configuración actual
const fs = require('fs')
const path = require('path')

// Leer .env.production
const envPath = path.join(__dirname, '..', '.env.production')
const envContent = fs.readFileSync(envPath, 'utf-8')

const config = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^VITE_FIREBASE_(\w+)=(.+)$/)
  if (match) {
    config[match[1]] = match[2]
  }
})

console.log('📋 Configuración actual:')
console.log('  Project ID:', config.PROJECT_ID)
console.log('  Auth Domain:', config.AUTH_DOMAIN)
console.log('')

console.log('✅ PASOS PARA SOLUCIONAR:')
console.log('')
console.log('1. Ve a Firebase Console:')
console.log('   https://console.firebase.google.com/u/0/project/the-blacklist-879f1/authentication/providers')
console.log('')
console.log('2. En la pestaña "Sign-in method", busca "Authorized domains"')
console.log('')
console.log('3. Haz clic en "Add domain" y agrega estos dominios:')
console.log('')
console.log('   ✓ localhost (ya debería estar)')
console.log('   ✓ the-blacklist-879f1.firebaseapp.com (ya debería estar)')
console.log('   ✓ the-blacklist-ndvmv5z-fable-cazzos-projects.vercel.app')
console.log('   ✓ *.vercel.app (para todos los previews)')
console.log('')
console.log('4. Si tienes un dominio personalizado, agrégalo también')
console.log('')
console.log('5. Guarda los cambios y espera 1-2 minutos para que se propaguen')
console.log('')
console.log('⚠️  IMPORTANTE:')
console.log('   - No puedes usar comodines (*) en subdominios de Vercel')
console.log('   - Debes agregar cada dominio de preview manualmente')
console.log('   - O mejor aún, usa un dominio personalizado')
console.log('')
console.log('💡 RECOMENDACIÓN:')
console.log('   Configura un dominio personalizado en Vercel para evitar')
console.log('   tener que agregar cada URL de preview a Firebase.')
console.log('')
