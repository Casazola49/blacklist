# 🔧 Solución al Problema de Autenticación con Google

## 🚨 Problema

No puedes autenticarte con Google porque el dominio de Vercel no está autorizado en Firebase.

## ✅ Solución Paso a Paso

### Paso 1: Autorizar el Dominio en Firebase (OBLIGATORIO)

1. **Abre Firebase Console**:

   - Ve a: https://console.firebase.google.com/u/0/project/the-blacklist-879f1/authentication/providers

2. **Navega a "Authorized domains"**:

   - En la pestaña "Sign-in method"
   - Busca la sección "Authorized domains" (Dominios autorizados)

3. **Agrega tu dominio de Vercel**:

   - Haz clic en "Add domain" (Agregar dominio)
   - Agrega: `the-blacklist-ndvmv5z-fable-cazzos-projects.vercel.app`
   - Haz clic en "Add" (Agregar)

4. **Agrega dominios adicionales** (recomendado):

   - `localhost` (ya debería estar)
   - `the-blacklist-879f1.firebaseapp.com` (ya debería estar)
   - Tu dominio personalizado si tienes uno

5. **Guarda los cambios**:
   - Los cambios tardan 1-2 minutos en propagarse

### Paso 2: Verificar la Configuración de OAuth

1. **Ve a Google Cloud Console**:

   - https://console.cloud.google.com/apis/credentials?project=the-blacklist-879f1

2. **Selecciona tu OAuth 2.0 Client ID**:

   - Busca el cliente OAuth que usa Firebase

3. **Agrega URIs de redirección autorizados**:
   - `https://the-blacklist-ndvmv5z-fable-cazzos-projects.vercel.app/__/auth/handler`
   - `https://the-blacklist-879f1.firebaseapp.com/__/auth/handler`

### Paso 3: Limpiar Caché y Probar

1. **Limpia el caché del navegador**:

   - Presiona `Ctrl + Shift + Delete` (Windows) o `Cmd + Shift + Delete` (Mac)
   - Selecciona "Cookies y otros datos de sitios"
   - Haz clic en "Borrar datos"

2. **Cierra todas las pestañas** de tu aplicación

3. **Abre la aplicación en una ventana de incógnito**:

   - Esto evita problemas de caché

4. **Intenta autenticarte nuevamente**

## 🎯 Solución Alternativa: Usar Dominio Personalizado

En lugar de agregar cada URL de preview de Vercel, configura un dominio personalizado:

1. **Compra un dominio** (si no tienes uno)
2. **Configúralo en Vercel**:

   - Ve a tu proyecto en Vercel
   - Settings → Domains
   - Agrega tu dominio personalizado

3. **Agrega el dominio a Firebase**:
   - Solo necesitas agregar `tudominio.com`
   - No necesitas agregar cada preview

## 🐛 Si Aún Tienes Problemas

### Error: "auth/unauthorized-domain"

- **Causa**: El dominio no está autorizado en Firebase
- **Solución**: Sigue el Paso 1 arriba
- **Tiempo de propagación**: 1-2 minutos después de agregar el dominio

### Error: "Refused to load script" (CSP Error)

- **Causa**: Content Security Policy bloqueando Firebase
- **Solución**: Ya está corregido en vercel.json
- **Acción**: Haz un nuevo deploy después de los cambios

### Error: "auth/popup-blocked"

- **Causa**: El navegador bloqueó el popup
- **Solución**: Permite popups para tu sitio

### Error: "auth/popup-closed-by-user"

- **Causa**: Cerraste el popup antes de completar la autenticación
- **Solución**: Intenta nuevamente y completa el proceso

### Bucle de Redirección

- **Causa**: El perfil de usuario no se crea correctamente o el dominio no está autorizado
- **Solución**:
  1. Verifica que el dominio esté autorizado en Firebase
  2. Espera 2 minutos para propagación
  3. Limpia caché del navegador
  4. Prueba en ventana de incógnito

## 📝 Notas Importantes

- **MFA (Multi-Factor Authentication)**: Firebase te está avisando que debes habilitar MFA antes del 13 de mayo de 2025
- **Dominios de Preview**: Cada vez que Vercel crea un nuevo preview, tendrás que agregar ese dominio a Firebase (a menos que uses un dominio personalizado)
- **Tiempo de Propagación**: Los cambios en Firebase pueden tardar 1-2 minutos en aplicarse

## 🔗 Enlaces Útiles

- Firebase Console: https://console.firebase.google.com/u/0/project/the-blacklist-879f1
- Google Cloud Console: https://console.cloud.google.com/apis/credentials?project=the-blacklist-879f1
- Documentación de Firebase Auth: https://firebase.google.com/docs/auth/web/google-signin
