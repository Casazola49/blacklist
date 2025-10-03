#!/usr/bin/env node

const https = require('https')

console.log('🔍 Verificando configuración de Firebase...\n')

// Verificar variables de entorno
const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID'
]

console.log('📋 Variables de entorno:')
requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`)
  } else {
    console.log(`❌ ${varName}: NO CONFIGURADA`)
  }
})

// Obtener dominio de Vercel desde argumentos o detectar
const vercelDomain = process.argv[2] || 'theblacklist-4w7qzew-lablo-casazola-projects.vercel.app'

console.log('\n🌐 Dominio a verificar:', vercelDomain)

console.log('\n📝 Pasos para agregar dominio a Firebase:')
console.log('1. Ve a https://console.firebase.google.com')
console.log('2. Selecciona tu proyecto: the-blacklist-879f1')
console.log('3. Ve a Authentication > Settings > Authorized domains')
console.log('4. Haz clic en "Add domain"')
console.log(`5. Agrega: ${vercelDomain}`)
console.log('6. También agrega: *.vercel.app (para todos los subdominios)')
console.log('7. Guarda los cambios')

console.log('\n🔧 Dominios que deberías tener autorizados:')
console.log('- localhost (para desarrollo)')
console.log('- the-blacklist-879f1.firebaseapp.com (dominio de Firebase)')
console.log(`- ${vercelDomain} (tu dominio de Vercel)`)
console.log('- *.vercel.app (todos los subdominios de Vercel)')

console.log('\n⚠️  IMPORTANTE:')
console.log('Después de agregar los dominios, espera 5-10 minutos para que se propaguen los cambios.')