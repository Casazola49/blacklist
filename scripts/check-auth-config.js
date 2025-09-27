#!/usr/bin/env node

/**
 * Script para verificar la configuración de autenticación
 * Ejecutar con: node scripts/check-auth-config.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔍 Verificando configuración de autenticación...\n')

// Verificar archivo .env
const envPath = path.join(process.cwd(), '.env')
if (!fs.existsSync(envPath)) {
  console.error('❌ Archivo .env no encontrado')
  process.exit(1)
}

const envContent = fs.readFileSync(envPath, 'utf8')
const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
]

console.log('📋 Verificando variables de entorno:')
let missingVars = []

requiredVars.forEach(varName => {
  if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=your_`)) {
    console.log(`✅ ${varName}`)
  } else {
    console.log(`❌ ${varName} - Faltante o no configurada`)
    missingVars.push(varName)
  }
})

if (missingVars.length > 0) {
  console.log(`\n⚠️  Variables faltantes: ${missingVars.join(', ')}`)
  console.log('💡 Copia los valores desde la consola de Firebase')
}

// Verificar index.html CSP
console.log('\n📋 Verificando Content Security Policy:')
const indexPath = path.join(process.cwd(), 'index.html')
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8')
  
  const requiredDomains = [
    'https://apis.google.com',
    'https://www.gstatic.com',
    'https://identitytoolkit.googleapis.com',
    'https://securetoken.googleapis.com',
    'https://www.google.com',
    'https://recaptcha.net'
  ]
  
  requiredDomains.forEach(domain => {
    if (indexContent.includes(domain)) {
      console.log(`✅ ${domain}`)
    } else {
      console.log(`❌ ${domain} - No encontrado en CSP`)
    }
  })
} else {
  console.log('❌ index.html no encontrado')
}

// Verificar configuración de Firebase
console.log('\n📋 Verificando configuración de Firebase:')
const firebasePath = path.join(process.cwd(), 'src/services/firebase.ts')
if (fs.existsSync(firebasePath)) {
  const firebaseContent = fs.readFileSync(firebasePath, 'utf8')
  
  if (firebaseContent.includes('getAuth')) {
    console.log('✅ Firebase Auth configurado')
  } else {
    console.log('❌ Firebase Auth no configurado')
  }
  
  if (firebaseContent.includes('appVerificationDisabledForTesting')) {
    console.log('✅ Configuración de reCAPTCHA presente')
  } else {
    console.log('❌ Configuración de reCAPTCHA faltante')
  }
} else {
  console.log('❌ firebase.ts no encontrado')
}

console.log('\n🔧 Soluciones recomendadas:')
console.log('1. Asegúrate de que todas las variables de Firebase estén configuradas')
console.log('2. Verifica que el CSP incluya todos los dominios necesarios')
console.log('3. Desactiva bloqueadores de anuncios para localhost')
console.log('4. Verifica la conexión a internet')
console.log('5. Revisa la consola del navegador para errores específicos')

console.log('\n✨ Configuración verificada!')