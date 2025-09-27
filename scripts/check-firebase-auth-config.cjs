#!/usr/bin/env node

/**
 * Script para verificar la configuración específica de Firebase Auth
 * Ejecutar con: node scripts/check-firebase-auth-config.cjs
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

console.log('🔐 Verificando configuración específica de Firebase Auth...\n')

const firebaseConfig = {
  apiKey: envVars.VITE_FIREBASE_API_KEY,
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.VITE_FIREBASE_PROJECT_ID,
}

// Función para hacer peticiones HTTPS con datos POST
const makePostRequest = (url, data) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data)
    const urlObj = new URL(url)
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }
    
    const request = https.request(options, (response) => {
      let responseData = ''
      
      response.on('data', (chunk) => {
        responseData += chunk
      })
      
      response.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData)
          resolve({
            statusCode: response.statusCode,
            data: parsedData
          })
        } catch (error) {
          resolve({
            statusCode: response.statusCode,
            data: responseData
          })
        }
      })
    })
    
    request.on('error', (error) => {
      reject(error)
    })
    
    request.setTimeout(10000, () => {
      request.destroy()
      reject(new Error('Timeout'))
    })
    
    request.write(postData)
    request.end()
  })
}

async function checkFirebaseAuthConfig() {
  try {
    console.log('📋 Información del proyecto:')
    console.log(`Project ID: ${firebaseConfig.projectId}`)
    console.log(`Auth Domain: ${firebaseConfig.authDomain}`)
    console.log(`API Key: ${firebaseConfig.apiKey.substring(0, 20)}...`)
    
    // Verificar si la API key es válida haciendo una petición de prueba
    console.log('\n🔑 Verificando validez de la API key...')
    
    const testUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`
    const testData = {
      email: 'test@example.com',
      password: 'testpassword',
      returnSecureToken: true
    }
    
    try {
      const response = await makePostRequest(testUrl, testData)
      
      if (response.statusCode === 400) {
        if (response.data && response.data.error) {
          const errorCode = response.data.error.message
          if (errorCode === 'EMAIL_EXISTS' || errorCode === 'WEAK_PASSWORD' || errorCode.includes('INVALID_EMAIL')) {
            console.log('✅ API key es válida (Firebase Auth responde correctamente)')
          } else if (errorCode === 'API_KEY_INVALID') {
            console.log('❌ API key inválida')
            return
          } else {
            console.log(`⚠️  Firebase Auth responde con error: ${errorCode}`)
          }
        } else {
          console.log('✅ API key es válida (respuesta 400 esperada)')
        }
      } else if (response.statusCode === 403) {
        console.log('❌ API key inválida o proyecto deshabilitado')
        return
      } else {
        console.log(`⚠️  Respuesta inesperada: ${response.statusCode}`)
      }
    } catch (error) {
      console.log(`❌ Error al verificar API key: ${error.message}`)
    }
    
    // Verificar configuración de Google OAuth
    console.log('\n🔍 Verificando configuración de Google OAuth...')
    
    // Intentar obtener la configuración pública del proyecto
    const configUrl = `https://${firebaseConfig.authDomain}/__/auth/handler`
    
    try {
      const configResponse = await new Promise((resolve, reject) => {
        https.get(configUrl, (response) => {
          if (response.statusCode === 200 || response.statusCode === 404) {
            resolve({ statusCode: response.statusCode })
          } else {
            resolve({ statusCode: response.statusCode })
          }
        }).on('error', reject)
      })
      
      if (configResponse.statusCode === 200) {
        console.log('✅ Dominio de autenticación configurado correctamente')
      } else if (configResponse.statusCode === 404) {
        console.log('⚠️  Dominio de autenticación responde 404 (puede ser normal)')
      } else {
        console.log(`⚠️  Dominio de autenticación responde: ${configResponse.statusCode}`)
      }
    } catch (error) {
      console.log(`❌ Error al verificar dominio de auth: ${error.message}`)
    }
    
    console.log('\n🎯 Pasos para verificar en Firebase Console:')
    console.log('1. Ve a https://console.firebase.google.com/')
    console.log(`2. Selecciona el proyecto: ${firebaseConfig.projectId}`)
    console.log('3. Ve a Authentication > Sign-in method')
    console.log('4. Verifica que Google esté habilitado')
    console.log('5. En la configuración de Google, verifica:')
    console.log('   - Nombre del proyecto público')
    console.log('   - Email de soporte')
    console.log('   - Dominios autorizados (debe incluir localhost)')
    
    console.log('\n🌐 Dominios que debes agregar en Firebase Console:')
    console.log('- localhost')
    console.log('- localhost:5173')
    console.log('- localhost:4173')
    console.log('- 127.0.0.1:5173')
    console.log('- tu-dominio-de-produccion.com')
    
    console.log('\n🔧 Si el problema persiste:')
    console.log('1. Regenera la configuración de Firebase (descarga google-services.json)')
    console.log('2. Verifica que el proyecto no esté en modo de facturación suspendida')
    console.log('3. Asegúrate de que Google Cloud Identity API esté habilitada')
    console.log('4. Verifica los límites de cuota de la API')
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

checkFirebaseAuthConfig()

console.log('\n✨ Verificación de configuración completada!')