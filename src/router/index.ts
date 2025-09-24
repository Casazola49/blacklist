import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: () => import('../views/LandingView.vue')
  },
  {
    path: '/auth',
    name: 'auth',
    component: () => import('../views/AuthView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/auth/register/:type',
    name: 'register',
    component: () => import('../views/RegisterView.vue'),
    props: true,
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard/cliente',
    name: 'cliente-dashboard',
    component: () => import('../views/ClienteDashboardView.vue'),
    meta: { requiresAuth: true, role: 'cliente' }
  },
  {
    path: '/dashboard/especialista',
    name: 'especialista-dashboard',
    component: () => import('../views/EspecialistaDashboardView.vue'),
    meta: { requiresAuth: true, role: 'especialista' }
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('../views/AdminLoginView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard/admin',
    name: 'admin-dashboard',
    component: () => import('../views/AdminDashboardView.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/ui-showcase',
    name: 'ui-showcase',
    component: () => import('../components/ui/UIShowcase.vue')
  },
  {
    path: '/animation-showcase',
    name: 'animation-showcase',
    component: () => import('../components/ui/AnimationShowcase.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Authentication guards
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  // Wait for auth initialization if needed
  if (authStore.user === null && authStore.userProfile === null && !authStore.loading) {
    // Auth state is not yet determined, wait a bit
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  const requiresAuth = to.meta.requiresAuth
  const requiresGuest = to.meta.requiresGuest
  const requiredRole = to.meta.role
  const isAuthenticated = authStore.isAuthenticated
  const userRole = authStore.userRole

  // Handle guest-only routes (auth pages)
  if (requiresGuest && isAuthenticated) {
    // Redirect authenticated users to their dashboard
    const dashboardRoute = getDashboardRoute(userRole)
    return next(dashboardRoute)
  }

  // Handle protected routes
  if (requiresAuth && !isAuthenticated) {
    return next('/auth')
  }

  // Handle role-based access
  if (requiresAuth && requiredRole && userRole !== requiredRole) {
    // Redirect to appropriate dashboard or show error
    const dashboardRoute = getDashboardRoute(userRole)
    return next(dashboardRoute || '/auth')
  }

  // Handle pending specialist approval
  if (isAuthenticated && authStore.userProfile?.tipo === 'especialista' && 
      authStore.userProfile?.estado === 'pendiente' && 
      to.name !== 'auth') {
    // Allow access to auth page to show pending status
    return next('/auth')
  }

  next()
})

function getDashboardRoute(role?: string): string {
  switch (role) {
    case 'cliente':
      return '/dashboard/cliente'
    case 'especialista':
      return '/dashboard/especialista'
    case 'admin':
      return '/dashboard/admin'
    default:
      return '/'
  }
}

export default router