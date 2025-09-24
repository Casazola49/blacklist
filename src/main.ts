import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/css/main.css'
import { useAuthStore } from './stores/auth'
import { useGlobalAnimations } from './composables/useGlobalAnimations'

// PWA and Performance imports
import { pwaManager } from './utils/pwa'
import { resourcePreloader } from './utils/resourcePreloader'
import { performanceMonitor } from './utils/performanceMonitor'
import { vLazyImage, lazyImageCSS } from './utils/imageOptimization'

// Error handling and monitoring imports
import { loggerService } from './services/logger'
import { errorHandler } from './services/errorHandler'

// Advanced optimization imports
import { analytics } from './services/analytics'
import { performanceMonitor as advancedPerformanceMonitor } from './services/performanceMonitoring'
import { deviceTester } from './utils/deviceTesting'

// Inject lazy image CSS
const style = document.createElement('style')
style.textContent = lazyImageCSS
document.head.appendChild(style)

const app = createApp(App)
const pinia = createPinia()

// Register global directives
app.directive('lazy-image', vLazyImage)

app.use(pinia)
app.use(router)

// Configure global error handling
app.config.errorHandler = (error, instance, info) => {
  errorHandler.handleError(error, 'vue_error', {
    componentInfo: info,
    instance: instance?.$options.name || 'Unknown'
  })
}

// Initialize authentication state
const authStore = useAuthStore()
authStore.initializeAuth()

// Initialize global animation settings
const { loadSettings, autoConfigurePerformance } = useGlobalAnimations()
loadSettings()

// Auto-configure performance on first load if no settings exist
if (!localStorage.getItem('blacklist-animation-settings')) {
  autoConfigurePerformance()
}

// Initialize error handling and monitoring
loggerService.logInfo('Aplicación iniciada', 'startup', {
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: import.meta.env.MODE
})

// Initialize advanced analytics
if (import.meta.env.VITE_FEATURE_ANALYTICS === 'true') {
  analytics.setUserProperties({
    device_type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
    preferred_language: navigator.language,
    theme_preference: 'dark'
  })
  
  analytics.trackPageView('app-initialization', {
    app_version: import.meta.env.VITE_APP_VERSION,
    environment: import.meta.env.MODE
  })
}

// Global error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  errorHandler.handleError(
    new Error(event.reason?.message || 'Unhandled promise rejection'),
    'unhandled_rejection',
    { reason: event.reason }
  )
})

// Initialize PWA features
console.log('🚀 Initializing The Blacklist PWA...')

// Track app initialization performance
performanceMonitor.startComponentMount('App')

// Setup router performance monitoring
router.beforeEach((to, from, next) => {
  performanceMonitor.startRouteChange(to.name as string || to.path)
  
  // Preload route resources
  if (to.name) {
    resourcePreloader.preloadRoute(to.name as string).catch(console.warn)
  }
  
  next()
})

router.afterEach((to, from) => {
  performanceMonitor.endRouteChange(to.name as string || to.path)
  
  // Prefetch likely next routes
  if (to.name === 'landing') {
    resourcePreloader.prefetchRoute('auth')
  } else if (to.name === 'auth') {
    resourcePreloader.prefetchRoute('dashboard')
  }
})

// Run device optimization before mounting
const initializeOptimizedApp = async () => {
  try {
    // Run device capability test for optimization
    if (import.meta.env.VITE_FEATURE_DEVICE_OPTIMIZATION === 'true') {
      console.log('🔧 Running device optimization...')
      
      const deviceResults = await deviceTester.runComprehensiveTest()
      
      // Apply optimizations based on device capabilities
      if (deviceResults.overall === 'poor') {
        console.log('⚡ Low-end device detected, applying performance optimizations')
        document.documentElement.style.setProperty('--animation-duration-multiplier', '0.5')
        document.documentElement.style.setProperty('--particle-density', '0.2')
        document.documentElement.style.setProperty('--glitch-intensity', '0.3')
      } else if (deviceResults.overall === 'excellent') {
        console.log('🚀 High-end device detected, enabling premium effects')
        document.documentElement.style.setProperty('--animation-duration-multiplier', '1.2')
        document.documentElement.style.setProperty('--particle-density', '1.5')
        document.documentElement.style.setProperty('--glitch-intensity', '1.0')
      }
      
      // Track device capabilities
      if (import.meta.env.VITE_FEATURE_ANALYTICS === 'true') {
        analytics.trackEvent('device_capabilities_detected', {
          overall_performance: deviceResults.overall,
          gpu_level: deviceResults.capabilities.webgl2 ? 'high' : 'basic',
          optimization_applied: true
        })
      }
    }
    
    // Mount app and track performance
    app.mount('#app')
    performanceMonitor.endComponentMount('App')
    
    console.log('🚀 The Blacklist PWA initialized successfully!')
    
  } catch (error) {
    console.error('❌ App optimization failed:', error)
    
    // Still mount the app for basic functionality
    app.mount('#app')
    performanceMonitor.endComponentMount('App')
    
    if (import.meta.env.VITE_FEATURE_ANALYTICS === 'true') {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      analytics.trackError('app_optimization_failed', { error: errorMessage })
    }
  }
}

// Initialize the optimized app
initializeOptimizedApp()

// Log performance metrics after initial load
window.addEventListener('load', () => {
  setTimeout(() => {
    const report = performanceMonitor.generatePerformanceReport()
    console.log(report)
    
    const score = performanceMonitor.getPerformanceScore()
    if (score < 80) {
      console.warn('⚠️ Performance score is below 80. Consider optimizations.')
    } else {
      console.log('✅ Good performance score:', score)
    }
  }, 1000)
})

// Handle PWA updates
pwaManager.onUpdate((info) => {
  if (info.needRefresh) {
    console.log('🔄 PWA update available')
  }
  if (info.offlineReady) {
    console.log('📱 PWA ready for offline use')
  }
})

// Handle visibility change for performance optimization
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // App is hidden, reduce resource usage
    console.log('🔇 App hidden, reducing resource usage')
  } else {
    // App is visible, resume normal operation
    console.log('👁️ App visible, resuming normal operation')
  }
})

// Handle memory pressure
if ('memory' in performance) {
  const memoryInfo = (performance as any).memory
  if (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit > 0.8) {
    console.warn('⚠️ High memory usage detected')
    // Could trigger cleanup or reduce animations
  }
}

// Development-only performance debugging
if (import.meta.env.DEV) {
  // Add performance debugging tools
  (window as any).__BLACKLIST_PERFORMANCE__ = {
    monitor: performanceMonitor,
    advancedMonitor: advancedPerformanceMonitor,
    analytics: analytics,
    deviceTester: deviceTester,
    pwa: pwaManager,
    preloader: resourcePreloader,
    generateReport: () => performanceMonitor.generatePerformanceReport(),
    generateAdvancedReport: () => advancedPerformanceMonitor.generateReport(),
    runDeviceTest: () => deviceTester.runComprehensiveTest(),
    exportAnalytics: () => analytics.exportAnalyticsData()
  }
  
  console.log('🛠️ Development mode: Performance tools available at window.__BLACKLIST_PERFORMANCE__')
  console.log('Available methods:')
  console.log('  - generateReport(): Basic performance report')
  console.log('  - generateAdvancedReport(): Advanced performance metrics')
  console.log('  - runDeviceTest(): Comprehensive device capability test')
  console.log('  - exportAnalytics(): Export user analytics data')
}