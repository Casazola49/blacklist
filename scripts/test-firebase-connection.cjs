#!/usr/bin/env node

/**
 * Script para probar la conexión con Firebase
 * Ejecutar con: node scripts/test-firebase-connection.cjs
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

// Leer variables de entorno del archivo .env
const envPath = path.join(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    envVars[key.trim()] = value.trim()
  }
})

console.log('🔥 Probando conexión con Firebase...\n')

// Configuración de Firebase desde variables de entorno
const firebaseConfig = {
  apiKey: envVars.VITE_FIREBASE_API_KEY,
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.VITE_FIREBASE_APP_ID,
  measurementId: envVars.VITE_FIREBASE_MEASUREMENT_ID
}

// Función para hacer peticiones HTTPS
const makeRequest = (url) => {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      resolve({
        statusCode: response.statusCode,
        headers: response.headers
      })
    })
    
    request.on('error', (error) => {
      reject(error)
    })
    
    request.setTimeout(5000, () => {
      request.destroy()
      reject(new Error('Timeout'))
    })
  })
}

async function testFirebaseConnection() {
  try {
    console.log('📋 Configuración de Firebase:')
    let hasErrors = false
    
    Object.entries(firebaseConfig).forEach(([key, value]) => {
      if (value) {
        console.log(`✅ ${key}: ${value.substring(0, 20)}...`)
      } else {
        console.log(`❌ ${key}: No configurado`)
        hasErrors = true
      }
    })
    
    if (hasErrors) {
      console.log('\n❌ Hay variables de configuración faltantes. Verifica tu archivo .env')
      return
    }
    
    // Verificar dominio de autenticación
    console.log(`\n🌐 Verificando dominio de autenticación: ${firebaseConfig.authDomain}`)
    
    try {
      const authResponse = await makeRequest(`https://${firebaseConfig.authDomain}`)
      if (authResponse.statusCode === 200 || authResponse.statusCode === 404) {
        console.log('✅ Dominio de autenticación accesible')
      } else {
        console.log(`⚠️  Dominio responde con status: ${authResponse.statusCode}`)
      }
    } catch (error) {
      console.log(`❌ Error al acceder al dominio: ${error.message}`)
    }
    
    // Verificar APIs de Google
    console.log('\n🔍 Verificando APIs de Google...')
    const googleApis = [
      'https://identitytoolkit.googleapis.com',
      'https://securetoken.googleapis.com',
      'https://www.googleapis.com',
      'https://accounts.google.com'
    ]
    
    for (const api of googleApis) {
      try {
        const response = await makeRequest(api)
        console.log(`✅ ${api} - Accesible (${response.statusCode})`)
      } catch (error) {
        console.log(`❌ ${api} - Error: ${error.message}`)
      }
    }
    
    // Verificar específicamente el endpoint de Firebase Auth
    console.log('\n🔐 Verificando Firebase Auth API...')
    const authApiUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`
    
    try {
      const authApiResponse = await makeRequest(authApiUrl)
      if (authApiResponse.statusCode === 400) {
        console.log('✅ Firebase Auth API responde correctamente (400 es esperado sin datos)')
      } else if (authApiResponse.statusCode === 403) {
        console.log('❌ Firebase Auth API: API key inválida o proyecto deshabilitado')
      } else {
        console.log(`⚠️  Firebase Auth API responde con: ${authApiResponse.statusCode}`)
      }
    } catch (error) {
      console.log(`❌ Error al verificar Firebase Auth API: ${error.message}`)
    }
    
    console.log('\n🎯 Diagnóstico específico para tu error:')
    console.log('El error "auth.network.request-failed" generalmente indica:')
    console.log('1. 🚫 Bloqueador de anuncios activo (muy común)')
    console.log('2. 🔒 Firewall corporativo bloqueando Google APIs')
    console.log('3. 🌐 Problemas de conectividad con Google')
    console.log('4. 🔑 API key inválida o proyecto Firebase deshabilitado')
    console.log('5. 📱 Configuración incorrecta de OAuth en Firebase Console')
    
    console.log('\n💡 Soluciones recomendadas:')
    console.log('1. Desactiva TODOS los bloqueadores de anuncios para localhost')
    console.log('2. Prueba en modo incógnito del navegador')
    console.log('3. Verifica que Google Auth esté habilitado en Firebase Console')
    console.log('4. Agrega localhost:5173 a los dominios autorizados en Firebase')
    console.log('5. Verifica que el proyecto Firebase esté activo')
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

testFirebaseConnection()

console.log('\n✨ Verificación completada!')