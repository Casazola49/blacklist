#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🚀 Verificación pre-despliegue para Vercel...\n')

// Verificar archivos esenciales
const essentialFiles = [
  'dist/index.html',
  'dist/js',
  'dist/css',
  'vercel.json',
  'package.json'
]

let allFilesExist = true

essentialFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file)
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - OK`)
  } else {
    console.log(`❌ ${file} - FALTA`)
    allFilesExist = false
  }
})

// Verificar variables de entorno de producción
console.log('\n📋 Verificando variables de entorno de producción...')
const envProdPath = path.join(process.cwd(), '.env.production')
if (fs.existsSync(envProdPath)) {
  const envContent = fs.readFileSync(envProdPath, 'utf8')
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_APP_ENVIRONMENT'
  ]
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`✅ ${varName} - Configurado`)
    } else {
      console.log(`❌ ${varName} - FALTA`)
      allFilesExist = false
    }
  })
} else {
  console.log('❌ .env.production - FALTA')
  allFilesExist = false
}

// Verificar tamaño de archivos
console.log('\n📊 Verificando tamaños de archivos...')
const distPath = path.join(process.cwd(), 'dist')
if (fs.existsSync(distPath)) {
  const jsFiles = fs.readdirSync(path.join(distPath, 'js'))
  const cssFiles = fs.readdirSync(path.join(distPath, 'css'))
  
  console.log(`📁 Archivos JS: ${jsFiles.length}`)
  console.log(`🎨 Archivos CSS: ${cssFiles.length}`)
  
  // Verificar que no haya archivos demasiado grandes
  jsFiles.forEach(file => {
    const filePath = path.join(distPath, 'js', file)
    const stats = fs.statSync(filePath)
    const sizeInMB = stats.size / (1024 * 1024)
    if (sizeInMB > 1) {
      console.log(`⚠️  ${file} es grande: ${sizeInMB.toFixed(2)}MB`)
    }
  })
}

// Verificar configuración de Vercel
console.log('\n⚙️  Verificando configuración de Vercel...')
const vercelConfigPath = path.join(process.cwd(), 'vercel.json')
if (fs.existsSync(vercelConfigPath)) {
  const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'))
  if (vercelConfig.routes && vercelConfig.routes.length > 0) {
    console.log('✅ Rutas SPA configuradas')
  }
  if (vercelConfig.headers && vercelConfig.headers.length > 0) {
    console.log('✅ Headers de seguridad configurados')
  }
} else {
  console.log('❌ vercel.json - FALTA')
  allFilesExist = false
}

console.log('\n' + '='.repeat(50))
if (allFilesExist) {
  console.log('🎉 ¡Todo listo para desplegar en Vercel!')
  console.log('\n📝 Pasos siguientes:')
  console.log('1. Conecta tu repositorio a Vercel')
  console.log('2. Configura las variables de entorno en Vercel Dashboard')
  console.log('3. Usa el comando de build: npm run build:vercel')
  console.log('4. ¡Despliega!')
  process.exit(0)
} else {
  console.log('❌ Hay problemas que resolver antes del despliegue')
  process.exit(1)
}