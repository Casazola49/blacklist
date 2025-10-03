import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useDemoMode } from '../composables/useDemoMode'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: () => import('../views/LandingView.vue')
  },
  {
    path: '/auth',
    name: 'auth',
    component: () => import('../views/SimpleAuthView.vue'),
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

// Navigation guards with demo mode support
router.beforeEach((to, _from, next) => {
  console.log('Navigating to:', to.path)
  
  const { isDemoMode, restoreDemoSession } = useDemoMode()
  
  // Restore demo session if exists
  if (!isDemoMode.value) {
    restoreDemoSession()
  }
  
  // Allow all navigation in demo mode
  if (isDemoMode.value) {
    console.log('Demo mode active - allowing navigation')
    next()
    return
  }
  
  // Normal navigation
  next()
})

export default router