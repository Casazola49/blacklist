# 🚀 Deploy Rápido con Modo Demo

## ✨ ¿Qué acabamos de hacer?

Hemos implementado un **Modo Demo** que permite acceder a los dashboards **SIN AUTENTICACIÓN**. Perfecto para tu presentación.

## 🎯 Solución Inmediata

Ya no necesitas preocuparte por:
- ❌ Problemas de autenticación con Google
- ❌ Dominios no autorizados en Firebase
- ❌ Errores de CSP
- ❌ Configuración de OAuth

## 📦 ¿Qué se agregó?

### 1. Composable de Demo Mode
- `src/composables/useDemoMode.ts`
- Maneja usuarios demo (Cliente y Especialista)
- Persistencia en localStorage

### 2. Botones en Landing
- Dos botones nuevos en el landing page
- "Entrar como Cliente" 
- "Entrar como Especialista"

### 3. Banners en Dashboards
- Banner amarillo en dashboard de cliente
- Banner morado en dashboard de especialista
- Botón para salir del modo demo

### 4. Integración con Auth Store
- El auth store detecta automáticamente el modo demo
- Funciona sin Firebase

### 5. Router actualizado
- Permite navegación libre en modo demo
- Restaura sesión demo automáticamente

## 🚀 Cómo Hacer el Deploy

### Opción 1: Script Automático (Windows)
```cmd
scripts\deploy-with-demo.cmd
```

### Opción 2: Manual
```bash
git add .
git commit -m "feat: add demo mode for presentations"
git push
```

## ⏱️ Tiempo de Deploy

1. **Push a GitHub**: Inmediato
2. **Build en Vercel**: ~2 minutos
3. **Deploy completo**: ~3 minutos

## 🎭 Cómo Usar en tu Presentación

### Paso 1: Abre tu URL de Vercel
```
https://the-blacklist-ndvmv5z-fable-cazzos-projects.vercel.app
```

### Paso 2: Busca la sección "MODO DEMO"
Está en el hero section del landing, con un borde amarillo.

### Paso 3: Haz clic en el botón que necesites
- **Cliente**: Para mostrar el dashboard de estudiantes
- **Especialista**: Para mostrar el dashboard de académicos

### Paso 4: ¡Presenta!
- Navega libremente por el dashboard
- Todos los componentes visuales funcionan
- Los datos son de ejemplo pero realistas

## 📊 Datos Demo Incluidos

### Cliente Demo
- Alias: "Cliente Demo"
- Saldo Escrow: $5,000
- Estado: Activo
- Contratos: 0 (puedes agregar más datos si quieres)

### Especialista Demo
- Alias: "Dr. Demo"
- Calificación: 4.8 ⭐
- Trabajos Completados: 127
- Ganancias Totales: $45,000
- Habilidades: Programación, Matemáticas, Física, Ingeniería

## 🔄 Salir del Modo Demo

En cualquier momento, haz clic en el botón **"Salir del Demo"** en el banner superior.

## ⚠️ Limitaciones del Modo Demo

- **No guarda datos**: Los cambios no se persisten en Firebase
- **Solo visual**: Las acciones (crear contratos, etc.) no funcionan realmente
- **Sin autenticación real**: No accede a datos reales de usuarios

## 🎨 Personalizar Datos Demo

Si quieres cambiar los datos demo, edita:
```typescript
// src/composables/useDemoMode.ts

const demoCliente: Cliente = {
  // Cambia aquí
  saldoEscrow: 10000, // Más saldo
  alias: 'Tu Nombre',  // Otro nombre
}
```

## 🐛 Troubleshooting

### El modo demo no aparece
1. Verifica que hiciste el deploy
2. Limpia caché del navegador (Ctrl+Shift+Delete)
3. Recarga la página

### No puedo salir del modo demo
1. Haz clic en "Salir del Demo" en el banner
2. O limpia localStorage: `localStorage.clear()`
3. Recarga la página

### Los datos no se muestran
1. Abre la consola del navegador (F12)
2. Busca errores
3. Verifica que `isDemoMode` sea `true`

## 📞 Checklist Pre-Presentación

- [ ] Deploy completado (espera 3 minutos)
- [ ] Probaste entrar como Cliente
- [ ] Probaste entrar como Especialista
- [ ] Verificaste que los dashboards se ven bien
- [ ] Probaste salir del modo demo
- [ ] Limpiaste caché del navegador
- [ ] Tienes la URL lista para compartir

## 🎉 ¡Listo!

Ahora tienes una forma **100% confiable** de mostrar tu aplicación sin depender de autenticación.

### Ventajas para tu Presentación:
1. ✅ **Cero fricción**: Un clic y estás dentro
2. ✅ **Sin errores**: No depende de Firebase
3. ✅ **Rápido**: Acceso instantáneo
4. ✅ **Profesional**: Datos realistas
5. ✅ **Flexible**: Puedes entrar como cliente o especialista

---

**¿Preguntas?** Revisa [MODO-DEMO.md](./MODO-DEMO.md) para más detalles técnicos.
