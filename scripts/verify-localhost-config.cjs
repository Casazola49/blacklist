#!/usr/bin/env node

/**
 * Script para verificar la configuración específica de localhost:3000
 */

console.log('🔍 Verificando configuración para localhost:3000...\n')

console.log('✅ Tu aplicación corre en: http://localhost:3000')
console.log('📋 En Firebase Console, verifica que tengas estos dominios autorizados:')
console.log('   1. localhost')
console.log('   2. localhost:3000 ← IMPORTANTE')
console.log('')
console.log('🌐 URL de Firebase Console:')
console.log('   https://console.firebase.google.com/project/the-blacklist-879f1/authentication/providers')
console.log('')
console.log('🔧 Pasos:')
console.log('   1. Ve a Authentication > Sign-in method')
console.log('   2. Haz clic en Google')
console.log('   3. En "Dominios autorizados", agrega: localhost:3000')
console.log('   4. Guarda los cambios')
console.log('')
console.log('✨ Después de agregar localhost:3000, el registro debería funcionar!')

// Verificar si el puerto 3000 está en uso
const net = require('net')

const checkPort = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer()
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(false) // Puerto disponible
      })
      server.close()
    })
    
    server.on('error', () => {
      resolve(true) // Puerto en uso
    })
  })
}

checkPort(3000).then(inUse => {
  if (inUse) {
    console.log('🟢 Puerto 3000 está en uso (aplicación corriendo)')
  } else {
    console.log('🔴 Puerto 3000 disponible (aplicación no corriendo)')
    console.log('   Ejecuta: npm run dev')
  }
})