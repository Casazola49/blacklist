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

// Simplified navigation for demo - no guards
router.beforeEach((to, _from, next) => {
  console.log('Navigating to:', to.path)
  next()
})

export default router