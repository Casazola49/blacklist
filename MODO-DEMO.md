# 🎭 Modo Demo - The Blacklist

## ¿Qué es el Modo Demo?

El **Modo Demo** permite acceder a los dashboards de Cliente y Especialista **sin necesidad de autenticación con Google**. Perfecto para presentaciones, demos y pruebas rápidas.

## ✨ Características

- ✅ **Sin autenticación**: No requiere cuenta de Google
- ✅ **Acceso instantáneo**: Un clic y estás dentro
- ✅ **Datos de ejemplo**: Perfiles pre-configurados con datos realistas
- ✅ **Persistencia**: La sesión demo se mantiene al recargar la página
- ✅ **Fácil salida**: Botón para salir del modo demo en cualquier momento

## 🚀 Cómo Usar

### Desde el Landing Page

1. Ve a la página principal: `https://tu-dominio.vercel.app`
2. Busca la sección **"MODO DEMO - Acceso sin Autenticación"**
3. Haz clic en uno de los botones:
   - **👤 Entrar como Cliente**: Accede al dashboard de cliente
   - **🎓 Entrar como Especialista**: Accede al dashboard de especialista

### Salir del Modo Demo

En cualquier dashboard, verás un banner amarillo/morado en la parte superior:
- Haz clic en **"Salir del Demo"**
- Serás redirigido al landing page

## 📊 Datos Demo

### Cliente Demo
```typescript
{
  alias: "Cliente Demo",
  email: "demo.cliente@theblacklist.com",
  tipo: "cliente",
  saldoEscrow: $5,000,
  estado: "activo"
}
```

### Especialista Demo
```typescript
{
  alias: "Dr. Demo",
  email: "demo.especialista@theblacklist.com",
  tipo: "especialista",
  nombreReal: "Especialista Demo",
  habilidades: ["Programación", "Matemáticas", "Física", "Ingeniería"],
  calificacionPromedio: 4.8,
  trabajosCompletados: 127,
  gananciasTotal: $45,000
}
```

## 🔧 Implementación Técnica

### Composable: `useDemoMode()`

```typescript
import { useDemoMode } from '@/composables/useDemoMode'

const { 
  isDemoMode,           // Ref<boolean> - Estado del modo demo
  demoUser,             // Ref<Usuario | null> - Usuario demo actual
  enterAsClienteDemo,   // () => void - Entrar como cliente
  enterAsEspecialistaDemo, // () => void - Entrar como especialista
  exitDemoMode,         // () => void - Salir del modo demo
  getDemoUser           // () => Usuario | null - Obtener usuario demo
} = useDemoMode()
```

### Persistencia

El modo demo usa `localStorage` para mantener la sesión:
- `demoUser`: Datos del usuario demo
- `isDemoMode`: Flag de modo demo activo

### Integración con Auth Store

El `authStore` detecta automáticamente el modo demo:
- `isAuthenticated`: Retorna `true` en modo demo
- `userRole`: Retorna el rol del usuario demo
- `isCliente` / `isEspecialista`: Funcionan con usuarios demo

### Router Guards

El router permite navegación libre en modo demo:
```typescript
router.beforeEach((to, _from, next) => {
  const { isDemoMode, restoreDemoSession } = useDemoMode()
  
  // Restore demo session if exists
  if (!isDemoMode.value) {
    restoreDemoSession()
  }
  
  // Allow all navigation in demo mode
  if (isDemoMode.value) {
    next()
    return
  }
  
  // Normal navigation
  next()
})
```

## 🎯 Casos de Uso

### 1. Presentaciones
- Muestra la plataforma sin necesidad de crear cuentas
- Datos realistas para impresionar a inversores/clientes

### 2. Testing Rápido
- Prueba cambios de UI sin autenticación
- Verifica flujos de usuario rápidamente

### 3. Demos en Vivo
- Acceso instantáneo durante presentaciones
- Sin riesgo de problemas de autenticación

### 4. Onboarding
- Permite a nuevos usuarios explorar antes de registrarse
- Reduce fricción en el proceso de adopción

## ⚠️ Limitaciones

- **No hay persistencia de datos**: Los cambios no se guardan en Firebase
- **Sin funcionalidad real**: Las acciones (crear contratos, enviar propuestas) no funcionan
- **Solo para demostración**: No usar en producción con usuarios reales

## 🔐 Seguridad

- Los usuarios demo **no tienen acceso** a datos reales de Firebase
- Las operaciones de escritura están deshabilitadas en modo demo
- No se puede acceder a funciones de admin en modo demo

## 📝 Notas

- El modo demo es **completamente independiente** del sistema de autenticación real
- Puedes tener una sesión demo y una sesión real al mismo tiempo (en diferentes navegadores)
- Los datos demo son **estáticos** y no cambian entre sesiones

## 🚀 Deploy

El modo demo funciona automáticamente después del deploy:
```bash
git add .
git commit -m "feat: add demo mode for presentations"
git push
```

No requiere configuración adicional en Vercel o Firebase.

## 🎨 Personalización

Para cambiar los datos demo, edita `src/composables/useDemoMode.ts`:

```typescript
const demoCliente: Cliente = {
  // Personaliza aquí
  saldoEscrow: 10000, // Cambiar saldo
  alias: 'Tu Alias',  // Cambiar nombre
  // ...
}
```

## 📞 Soporte

Si tienes problemas con el modo demo:
1. Limpia localStorage: `localStorage.clear()`
2. Recarga la página
3. Intenta entrar al modo demo nuevamente

---

**¡Listo para tu presentación! 🎉**
