import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Usuario, Cliente, Especialista } from '../types'

type DemoUser = Usuario | Cliente | Especialista

/**
 * Demo Mode Composable
 * Permite acceso sin autenticación para presentaciones
 */

const demoUser = ref<DemoUser | null>(null)
const isDemoMode = ref(false)

export function useDemoMode() {
  const router = useRouter()

  /**
   * Crear usuario demo de cliente
   */
  const enterAsClienteDemo = () => {
    const demoCliente: Cliente = {
      uid: 'demo-cliente-' + Date.now(),
      email: 'demo.cliente@theblacklist.com',
      alias: 'Cliente Demo',
      tipo: 'cliente',
      fechaCreacion: new Date(),
      estado: 'activo',
      saldoEscrow: 5000,
      contractosActivos: [],
      historialContratos: []
    }

    demoUser.value = demoCliente
    isDemoMode.value = true
    
    // Guardar en localStorage para persistencia
    localStorage.setItem('demoUser', JSON.stringify(demoCliente))
    localStorage.setItem('isDemoMode', 'true')
    
    router.push('/dashboard/cliente')
  }

  /**
   * Crear usuario demo de especialista
   */
  const enterAsEspecialistaDemo = () => {
    const demoEspecialista: Especialista = {
      uid: 'demo-especialista-' + Date.now(),
      email: 'demo.especialista@theblacklist.com',
      alias: 'Dr. Demo',
      tipo: 'especialista',
      fechaCreacion: new Date(),
      estado: 'activo',
      nombreReal: 'Especialista Demo',
      cv: 'PhD en Ciencias de la Computación. 10+ años de experiencia.',
      habilidades: ['Programación', 'Matemáticas', 'Física', 'Ingeniería'],
      biografia: 'Especialista de élite disponible para proyectos académicos complejos.',
      calificacionPromedio: 4.8,
      trabajosCompletados: 127,
      gananciasTotal: 45000
    }

    demoUser.value = demoEspecialista
    isDemoMode.value = true
    
    // Guardar en localStorage para persistencia
    localStorage.setItem('demoUser', JSON.stringify(demoEspecialista))
    localStorage.setItem('isDemoMode', 'true')
    
    router.push('/dashboard/especialista')
  }

  /**
   * Salir del modo demo
   */
  const exitDemoMode = () => {
    demoUser.value = null
    isDemoMode.value = false
    localStorage.removeItem('demoUser')
    localStorage.removeItem('isDemoMode')
    router.push('/')
  }

  /**
   * Restaurar sesión demo desde localStorage
   */
  const restoreDemoSession = () => {
    const savedUser = localStorage.getItem('demoUser')
    const savedDemoMode = localStorage.getItem('isDemoMode')
    
    if (savedUser && savedDemoMode === 'true') {
      demoUser.value = JSON.parse(savedUser)
      isDemoMode.value = true
      return true
    }
    return false
  }

  /**
   * Obtener usuario demo actual
   */
  const getDemoUser = () => {
    if (!demoUser.value) {
      restoreDemoSession()
    }
    return demoUser.value
  }

  return {
    isDemoMode,
    demoUser,
    enterAsClienteDemo,
    enterAsEspecialistaDemo,
    exitDemoMode,
    restoreDemoSession,
    getDemoUser
  }
}
