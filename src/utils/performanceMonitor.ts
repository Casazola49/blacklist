/**
 * Performance Monitoring and Optimization
 * Tracks performance metrics and provides optimization recommendations
 */

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  
  // Other important metrics
  fcp?: number // First Contentful Paint
  ttfb?: number // Time to First Byte
  domContentLoaded?: number
  loadComplete?: number
  
  // Custom metrics
  routeChangeTime?: number
  componentMountTime?: number
  apiResponseTime?: number
  
  // Resource metrics
  totalResources?: number
  totalSize?: number
  cacheHitRate?: number
}

interface PerformanceEntry {
  name: string
  startTime: number
  duration: number
  type: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {}
  private observers: PerformanceObserver[] = []
  private routeStartTime: number = 0
  private componentMountTimes = new Map<string, number>()

  constructor() {
    this.initializeObservers()
    this.trackCoreWebVitals()
    this.trackResourceMetrics()
  }

  private initializeObservers() {
    // Performance Observer for navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              this.processNavigationEntry(entry as PerformanceNavigationTiming)
            }
          })
        })
        navObserver.observe({ entryTypes: ['navigation'] })
        this.observers.push(navObserver)
      } catch (error) {
        console.warn('Navigation timing observer not supported:', error)
      }

      // Performance Observer for resource timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.entryType === 'resource') {
              this.processResourceEntry(entry as PerformanceResourceTiming)
            }
          })
        })
        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.push(resourceObserver)
      } catch (error) {
        console.warn('Resource timing observer not supported:', error)
      }

      // Performance Observer for paint timing
      try {
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime
            }
          })
        })
        paintObserver.observe({ entryTypes: ['paint'] })
        this.observers.push(paintObserver)
      } catch (error) {
        console.warn('Paint timing observer not supported:', error)
      }
    }
  }

  private trackCoreWebVitals() {
    // Track Largest Contentful Paint (LCP)
    this.trackLCP()
    
    // Track First Input Delay (FID)
    this.trackFID()
    
    // Track Cumulative Layout Shift (CLS)
    this.trackCLS()
  }

  private trackLCP() {
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          this.metrics.lcp = lastEntry.startTime
          
          // Log warning if LCP is poor (> 2.5s)
          if (lastEntry.startTime > 2500) {
            console.warn(`Poor LCP detected: ${lastEntry.startTime}ms`)
            this.suggestLCPOptimizations()
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)
      } catch (error) {
        console.warn('LCP observer not supported:', error)
      }
    }
  }

  private trackFID() {
    if ('PerformanceObserver' in window) {
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            this.metrics.fid = entry.processingStart - entry.startTime
            
            // Log warning if FID is poor (> 100ms)
            if (this.metrics.fid > 100) {
              console.warn(`Poor FID detected: ${this.metrics.fid}ms`)
              this.suggestFIDOptimizations()
            }
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.push(fidObserver)
      } catch (error) {
        console.warn('FID observer not supported:', error)
      }
    }
  }

  private trackCLS() {
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
          this.metrics.cls = clsValue
          
          // Log warning if CLS is poor (> 0.1)
          if (clsValue > 0.1) {
            console.warn(`Poor CLS detected: ${clsValue}`)
            this.suggestCLSOptimizations()
          }
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(clsObserver)
      } catch (error) {
        console.warn('CLS observer not supported:', error)
      }
    }
  }

  private trackResourceMetrics() {
    // Track resource loading performance
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      
      this.metrics.totalResources = resources.length
      this.metrics.totalSize = resources.reduce((total, resource) => {
        return total + (resource.transferSize || 0)
      }, 0)

      // Calculate cache hit rate
      const cachedResources = resources.filter(resource => resource.transferSize === 0)
      this.metrics.cacheHitRate = cachedResources.length / resources.length

      // Log resource performance summary
      console.log('Resource Performance Summary:', {
        totalResources: this.metrics.totalResources,
        totalSize: `${(this.metrics.totalSize / 1024).toFixed(2)} KB`,
        cacheHitRate: `${(this.metrics.cacheHitRate * 100).toFixed(1)}%`
      })
    })
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming) {
    this.metrics.ttfb = entry.responseStart - entry.requestStart
    this.metrics.domContentLoaded = entry.domContentLoadedEventEnd - entry.fetchStart
    this.metrics.loadComplete = entry.loadEventEnd - entry.fetchStart

    // Log navigation performance
    console.log('Navigation Performance:', {
      ttfb: `${this.metrics.ttfb.toFixed(2)}ms`,
      domContentLoaded: `${this.metrics.domContentLoaded.toFixed(2)}ms`,
      loadComplete: `${this.metrics.loadComplete.toFixed(2)}ms`
    })
  }

  private processResourceEntry(entry: PerformanceResourceTiming) {
    // Track slow resources
    const duration = entry.responseEnd - entry.requestStart
    if (duration > 1000) { // Resources taking more than 1 second
      console.warn(`Slow resource detected: ${entry.name} (${duration.toFixed(2)}ms)`)
    }
  }

  public startRouteChange(routeName: string) {
    this.routeStartTime = performance.now()
    console.log(`Route change started: ${routeName}`)
  }

  public endRouteChange(routeName: string) {
    if (this.routeStartTime) {
      const duration = performance.now() - this.routeStartTime
      this.metrics.routeChangeTime = duration
      
      console.log(`Route change completed: ${routeName} (${duration.toFixed(2)}ms)`)
      
      // Log warning for slow route changes
      if (duration > 500) {
        console.warn(`Slow route change detected: ${routeName} (${duration.toFixed(2)}ms)`)
      }
    }
  }

  public startComponentMount(componentName: string) {
    this.componentMountTimes.set(componentName, performance.now())
  }

  public endComponentMount(componentName: string) {
    const startTime = this.componentMountTimes.get(componentName)
    if (startTime) {
      const duration = performance.now() - startTime
      this.metrics.componentMountTime = duration
      
      console.log(`Component mounted: ${componentName} (${duration.toFixed(2)}ms)`)
      
      // Log warning for slow component mounts
      if (duration > 100) {
        console.warn(`Slow component mount: ${componentName} (${duration.toFixed(2)}ms)`)
      }
      
      this.componentMountTimes.delete(componentName)
    }
  }

  public trackAPICall(endpoint: string, startTime: number, endTime: number) {
    const duration = endTime - startTime
    this.metrics.apiResponseTime = duration
    
    console.log(`API call: ${endpoint} (${duration.toFixed(2)}ms)`)
    
    // Log warning for slow API calls
    if (duration > 2000) {
      console.warn(`Slow API call: ${endpoint} (${duration.toFixed(2)}ms)`)
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  public getPerformanceScore(): number {
    let score = 100
    
    // Deduct points for poor Core Web Vitals
    if (this.metrics.lcp && this.metrics.lcp > 2500) score -= 20
    if (this.metrics.fid && this.metrics.fid > 100) score -= 20
    if (this.metrics.cls && this.metrics.cls > 0.1) score -= 20
    
    // Deduct points for slow loading
    if (this.metrics.loadComplete && this.metrics.loadComplete > 3000) score -= 15
    if (this.metrics.ttfb && this.metrics.ttfb > 600) score -= 10
    
    // Deduct points for poor caching
    if (this.metrics.cacheHitRate && this.metrics.cacheHitRate < 0.5) score -= 15
    
    return Math.max(0, score)
  }

  private suggestLCPOptimizations() {
    console.group('LCP Optimization Suggestions:')
    console.log('• Optimize images with modern formats (WebP, AVIF)')
    console.log('• Preload critical resources')
    console.log('• Reduce server response times')
    console.log('• Remove render-blocking resources')
    console.groupEnd()
  }

  private suggestFIDOptimizations() {
    console.group('FID Optimization Suggestions:')
    console.log('• Break up long-running JavaScript tasks')
    console.log('• Use web workers for heavy computations')
    console.log('• Defer non-critical JavaScript')
    console.log('• Optimize third-party scripts')
    console.groupEnd()
  }

  private suggestCLSOptimizations() {
    console.group('CLS Optimization Suggestions:')
    console.log('• Set explicit dimensions for images and videos')
    console.log('• Reserve space for dynamic content')
    console.log('• Avoid inserting content above existing content')
    console.log('• Use CSS transforms for animations')
    console.groupEnd()
  }

  public generatePerformanceReport(): string {
    const metrics = this.getMetrics()
    const score = this.getPerformanceScore()
    
    return `
Performance Report - The Blacklist PWA
=====================================

Overall Score: ${score}/100

Core Web Vitals:
- LCP: ${metrics.lcp ? `${metrics.lcp.toFixed(2)}ms` : 'N/A'} ${metrics.lcp && metrics.lcp <= 2500 ? '✅' : '❌'}
- FID: ${metrics.fid ? `${metrics.fid.toFixed(2)}ms` : 'N/A'} ${metrics.fid && metrics.fid <= 100 ? '✅' : '❌'}
- CLS: ${metrics.cls ? metrics.cls.toFixed(3) : 'N/A'} ${metrics.cls && metrics.cls <= 0.1 ? '✅' : '❌'}

Loading Performance:
- TTFB: ${metrics.ttfb ? `${metrics.ttfb.toFixed(2)}ms` : 'N/A'}
- FCP: ${metrics.fcp ? `${metrics.fcp.toFixed(2)}ms` : 'N/A'}
- DOM Content Loaded: ${metrics.domContentLoaded ? `${metrics.domContentLoaded.toFixed(2)}ms` : 'N/A'}
- Load Complete: ${metrics.loadComplete ? `${metrics.loadComplete.toFixed(2)}ms` : 'N/A'}

Resource Metrics:
- Total Resources: ${metrics.totalResources || 'N/A'}
- Total Size: ${metrics.totalSize ? `${(metrics.totalSize / 1024).toFixed(2)} KB` : 'N/A'}
- Cache Hit Rate: ${metrics.cacheHitRate ? `${(metrics.cacheHitRate * 100).toFixed(1)}%` : 'N/A'}

Application Performance:
- Route Change Time: ${metrics.routeChangeTime ? `${metrics.routeChangeTime.toFixed(2)}ms` : 'N/A'}
- Component Mount Time: ${metrics.componentMountTime ? `${metrics.componentMountTime.toFixed(2)}ms` : 'N/A'}
- API Response Time: ${metrics.apiResponseTime ? `${metrics.apiResponseTime.toFixed(2)}ms` : 'N/A'}
    `.trim()
  }

  public cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.componentMountTimes.clear()
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Vue composable for performance monitoring
export function usePerformanceMonitor() {
  const startRouteChange = (routeName: string) => {
    performanceMonitor.startRouteChange(routeName)
  }

  const endRouteChange = (routeName: string) => {
    performanceMonitor.endRouteChange(routeName)
  }

  const startComponentMount = (componentName: string) => {
    performanceMonitor.startComponentMount(componentName)
  }

  const endComponentMount = (componentName: string) => {
    performanceMonitor.endComponentMount(componentName)
  }

  const trackAPICall = (endpoint: string, startTime: number, endTime: number) => {
    performanceMonitor.trackAPICall(endpoint, startTime, endTime)
  }

  const getMetrics = () => {
    return performanceMonitor.getMetrics()
  }

  const getPerformanceScore = () => {
    return performanceMonitor.getPerformanceScore()
  }

  const generateReport = () => {
    return performanceMonitor.generatePerformanceReport()
  }

  return {
    startRouteChange,
    endRouteChange,
    startComponentMount,
    endComponentMount,
    trackAPICall,
    getMetrics,
    getPerformanceScore,
    generateReport
  }
}