#!/usr/bin/env node

/**
 * Script para verificar dominios autorizados en Firebase
 * Ejecutar: node scripts/check-authorized-domains.cjs
 */

const https = require('https');

const PROJECT_ID = 'the-blacklist-879f1';

console.log('🔍 Verificando dominios autorizados en Firebase...\n');

console.log('📋 Dominios que DEBES tener autorizados:');
console.log('   ✓ localhost');
console.log('   ✓ the-blacklist-879f1.firebaseapp.com');
console.log('   ✓ the-blacklist-ndvmv5z-fable-cazzos-projects.vercel.app');
console.log('   ✓ Cualquier otro dominio de Vercel que uses\n');

console.log('🔗 Para agregar dominios:');
console.log(`   1. Ve a: https://console.firebase.google.com/u/0/project/${PROJECT_ID}/authentication/providers`);
console.log('   2. Busca la sección "Authorized domains"');
console.log('   3. Haz clic en "Add domain"');
console.log('   4. Agrega tu dominio de Vercel');
console.log('   5. Espera 1-2 minutos para que se propague\n');

console.log('⚠️  IMPORTANTE:');
console.log('   - Los cambios pueden tardar 1-2 minutos en propagarse');
console.log('   - Limpia el caché del navegador después de agregar dominios');
console.log('   - Prueba en ventana de incógnito para evitar problemas de caché\n');

console.log('🔧 También verifica en Google Cloud Console:');
console.log(`   https://console.cloud.google.com/apis/credentials?project=${PROJECT_ID}`);
console.log('   Agrega estas URIs de redirección:');
console.log('   - https://the-blacklist-ndvmv5z-fable-cazzos-projects.vercel.app/__/auth/handler');
console.log('   - https://the-blacklist-879f1.firebaseapp.com/__/auth/handler\n');

console.log('✅ Después de hacer los cambios:');
console.log('   1. Espera 2 minutos');
console.log('   2. Limpia caché del navegador (Ctrl+Shift+Delete)');
console.log('   3. Cierra todas las pestañas de la app');
console.log('   4. Abre en ventana de incógnito');
console.log('   5. Intenta autenticarte nuevamente\n');
