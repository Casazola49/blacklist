/**
 * Performance Optimization Composable
 * Provides performance optimization utilities for Vue components
 */

import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { usePerformanceMonitor } from '@/utils/performanceMonitor'
import { useResourcePreloader } from '@/utils/resourcePreloader'

interface PerformanceOptions {
  trackComponentMount?: boolean
  preloadImages?: string[]
  preloadRoutes?: string[]
  enableLazyLoading?: boolean
  optimizeAnimations?: boolean
}

export function usePerformanceOptimization(
  componentName: string,
  options: PerformanceOptions = {}
) {
  const {
    trackComponentMount = true,
    preloadImages = [],
    preloadRoutes = [],
    enableLazyLoading = true,
    optimizeAnimations = true
  } = options

  const {
    startComponentMount,
    endComponentMount,
    getPerformanceScore
  } = usePerformanceMonitor()

  const {
    preloadImage,
    preloadRoute,
    prefetchRoute
  } = useResourcePreloader()

  // Performance state
  const isOptimized = ref(false)
  const performanceScore = ref(0)
  const isLowEndDevice = ref(false)

  // Detect device capabilities
  const detectDeviceCapabilities = () => {
    // Check for low-end device indicators
    const connection = (navigator as any).connection
    const memory = (performance as any).memory
    
    let lowEndIndicators = 0
    
    // Check network connection
    if (connection) {
      if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
        lowEndIndicators++
      }
      if (connection.saveData) {
        lowEndIndicators++
      }
    }
    
    // Check memory
    if (memory) {
      if (memory.jsHeapSizeLimit < 1073741824) { // Less than 1GB
        lowEndIndicators++
      }
    }
    
    // Check CPU cores
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      lowEndIndicators++
    }
    
    // Check user agent for mobile devices
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      lowEndIndicators++
    }
    
    isLowEndDevice.value = lowEndIndicators >= 2
    
    return {
      isLowEnd: isLowEndDevice.value,
      indicators: lowEndIndicators,
      connection: connection?.effectiveType || 'unknown',
      memory: memory ? `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB` : 'unknown',
      cores: navigator.hardwareConcurrency || 'unknown'
    }
  }

  // Optimize component based on device capabilities
  const optimizeComponent = async () => {
    const capabilities = detectDeviceCapabilities()
    
    console.log(`🔧 Optimizing ${componentName} for device:`, capabilities)
    
    // Preload critical images
    if (preloadImages.length > 0 && !capabilities.isLowEnd) {
      await Promise.all(
        preloadImages.map(src => preloadImage(src, { priority: 'high' }))
      )
    }
    
    // Preload critical routes
    if (preloadRoutes.length > 0) {
      await Promise.all(
        preloadRoutes.map(route => preloadRoute(route))
      )
    }
    
    isOptimized.value = true
  }

  // Lazy load non-critical resources
  const lazyLoadResources = (resources: string[]) => {
    if (!enableLazyLoading || isLowEndDevice.value) {
      return
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement
            const src = element.dataset.src
            
            if (src) {
              preloadImage(src, { priority: 'low' })
              observer.unobserve(element)
            }
          }
        })
      },
      { rootMargin: '50px' }
    )
    
    // Find elements to observe
    resources.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(el => observer.observe(el))
    })
    
    return observer
  }

  // Optimize animations based on device capabilities
  const getAnimationConfig = () => {
    if (!optimizeAnimations) {
      return { enabled: true, duration: 'normal', effects: 'full' }
    }
    
    if (isLowEndDevice.value) {
      return {
        enabled: true,
        duration: 'fast',
        effects: 'minimal',
        reduceMotion: true
      }
    }
    
    // Check user preference for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    if (prefersReducedMotion) {
      return {
        enabled: true,
        duration: 'fast',
        effects: 'minimal',
        reduceMotion: true
      }
    }
    
    return {
      enabled: true,
      duration: 'normal',
      effects: 'full',
      reduceMotion: false
    }
  }

  // Debounce function for performance-sensitive operations
  const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(null, args), wait)
    }
  }

  // Throttle function for scroll/resize handlers
  const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  // Request idle callback wrapper
  const runWhenIdle = (callback: () => void, timeout = 5000) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout })
    } else {
      setTimeout(callback, 0)
    }
  }

  // Batch DOM updates
  const batchDOMUpdates = (updates: (() => void)[]) => {
    return nextTick(() => {
      updates.forEach(update => update())
    })
  }

  // Memory cleanup utilities
  const cleanupResources = () => {
    // Clear any cached data specific to this component
    const cacheKeys = Object.keys(localStorage).filter(key => 
      key.includes(componentName.toLowerCase())
    )
    
    // Only clear if we have too many cached items
    if (cacheKeys.length > 10) {
      cacheKeys.slice(0, -5).forEach(key => {
        localStorage.removeItem(key)
      })
    }
  }

  // Performance monitoring
  const measurePerformance = async (operation: () => Promise<void> | void, name: string) => {
    const start = performance.now()
    
    try {
      await operation()
    } finally {
      const end = performance.now()
      const duration = end - start
      
      console.log(`⏱️ ${componentName}.${name}: ${duration.toFixed(2)}ms`)
      
      if (duration > 100) {
        console.warn(`⚠️ Slow operation detected: ${componentName}.${name} (${duration.toFixed(2)}ms)`)
      }
    }
  }

  // Lifecycle hooks
  onMounted(async () => {
    if (trackComponentMount) {
      startComponentMount(componentName)
    }
    
    await optimizeComponent()
    
    // Update performance score
    performanceScore.value = getPerformanceScore()
    
    if (trackComponentMount) {
      endComponentMount(componentName)
    }
  })

  onUnmounted(() => {
    // Cleanup resources when component is unmounted
    runWhenIdle(() => {
      cleanupResources()
    })
  })

  return {
    // State
    isOptimized,
    performanceScore,
    isLowEndDevice,
    
    // Methods
    detectDeviceCapabilities,
    optimizeComponent,
    lazyLoadResources,
    getAnimationConfig,
    debounce,
    throttle,
    runWhenIdle,
    batchDOMUpdates,
    measurePerformance,
    cleanupResources,
    
    // Utilities
    preloadImage,
    preloadRoute,
    prefetchRoute
  }
}

// Global performance optimization utilities
export const performanceUtils = {
  // Check if device supports modern features
  supportsModernFeatures: () => {
    return {
      webp: 'WebPImageFormat' in window,
      avif: 'AVIFImageFormat' in window,
      intersectionObserver: 'IntersectionObserver' in window,
      requestIdleCallback: 'requestIdleCallback' in window,
      serviceWorker: 'serviceWorker' in navigator,
      webGL: !!document.createElement('canvas').getContext('webgl'),
      webGL2: !!document.createElement('canvas').getContext('webgl2')
    }
  },
  
  // Get optimal image format
  getOptimalImageFormat: async () => {
    const formats = ['avif', 'webp', 'jpg']
    
    for (const format of formats) {
      try {
        const supported = await new Promise<boolean>((resolve) => {
          const img = new Image()
          img.onload = () => resolve(img.height === 2)
          img.onerror = () => resolve(false)
          
          switch (format) {
            case 'avif':
              img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
              break
            case 'webp':
              img.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
              break
            default:
              resolve(true)
          }
        })
        
        if (supported) {
          return format
        }
      } catch {
        continue
      }
    }
    
    return 'jpg'
  },
  
  // Calculate performance budget
  getPerformanceBudget: () => {
    const connection = (navigator as any).connection
    const memory = (performance as any).memory
    
    let budget = {
      maxBundleSize: 250, // KB
      maxImageSize: 100, // KB
      maxAnimationDuration: 300, // ms
      maxConcurrentAnimations: 3
    }
    
    // Adjust based on connection
    if (connection) {
      switch (connection.effectiveType) {
        case '4g':
          budget.maxBundleSize = 500
          budget.maxImageSize = 200
          break
        case '3g':
          budget.maxBundleSize = 300
          budget.maxImageSize = 150
          break
        case '2g':
        case 'slow-2g':
          budget.maxBundleSize = 150
          budget.maxImageSize = 50
          budget.maxAnimationDuration = 200
          budget.maxConcurrentAnimations = 1
          break
      }
    }
    
    // Adjust based on memory
    if (memory && memory.jsHeapSizeLimit < 1073741824) { // Less than 1GB
      budget.maxBundleSize *= 0.7
      budget.maxImageSize *= 0.7
      budget.maxConcurrentAnimations = Math.max(1, budget.maxConcurrentAnimations - 1)
    }
    
    return budget
  }
}