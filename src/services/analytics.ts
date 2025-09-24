/**
 * Advanced Analytics Service
 * Comprehensive user behavior tracking and performance analytics
 */

import { getAnalytics, logEvent, setUserProperties, setUserId } from 'firebase/analytics'
import { getPerformance, trace } from 'firebase/performance'

interface AnalyticsEvent {
  name: string
  parameters?: Record<string, any>
  timestamp?: number
}

interface UserProperties {
  user_type?: 'cliente' | 'especialista' | 'admin' | 'visitor'
  device_type?: 'mobile' | 'tablet' | 'desktop'
  connection_type?: string
  preferred_language?: string
  theme_preference?: 'dark' | 'light'
  accessibility_features?: string[]
}

interface PerformanceMetrics {
  page_load_time?: number
  route_change_time?: number
  component_mount_time?: number
  api_response_time?: number
  user_interaction_delay?: number
}

interface ConversionFunnel {
  step: string
  timestamp: number
  metadata?: Record<string, any>
}

class AdvancedAnalytics {
  private analytics: any
  private performance: any
  private isEnabled: boolean
  private userId: string | null = null
  private sessionId: string
  private conversionFunnels: Map<string, ConversionFunnel[]> = new Map()
  private userJourney: AnalyticsEvent[] = []
  private performanceBuffer: PerformanceMetrics[] = []
  private heatmapData: Array<{ x: number; y: number; timestamp: number }> = []

  constructor() {
    this.isEnabled = import.meta.env.VITE_FEATURE_ANALYTICS === 'true'
    this.sessionId = this.generateSessionId()
    
    if (this.isEnabled && typeof window !== 'undefined') {
      this.initializeFirebaseAnalytics()
      this.initializeUserTracking()
      this.initializePerformanceTracking()
      this.initializeErrorTracking()
      this.initializeEngagementTracking()
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeFirebaseAnalytics() {
    try {
      this.analytics = getAnalytics()
      this.performance = getPerformance()
      
      // Set default user properties
      this.setUserProperties({
        device_type: this.getDeviceType(),
        connection_type: this.getConnectionType(),
        preferred_language: navigator.language,
        theme_preference: 'dark' // Default for The Blacklist
      })
      
      console.log('📊 Analytics initialized')
    } catch (error) {
      console.warn('Failed to initialize Firebase Analytics:', error)
    }
  }

  private initializeUserTracking() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('page_visibility_change', {
        visibility_state: document.visibilityState,
        session_id: this.sessionId
      })
    })

    // Track user engagement time
    let engagementStartTime = Date.now()
    let isEngaged = true

    const trackEngagement = () => {
      if (isEngaged) {
        const engagementTime = Date.now() - engagementStartTime
        this.trackEvent('user_engagement', {
          engagement_time: engagementTime,
          session_id: this.sessionId
        })
      }
      engagementStartTime = Date.now()
    }

    // Track engagement every 30 seconds
    setInterval(trackEngagement, 30000)

    // Track when user becomes inactive
    let inactivityTimer: NodeJS.Timeout
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer)
      if (!isEngaged) {
        isEngaged = true
        engagementStartTime = Date.now()
      }
      
      inactivityTimer = setTimeout(() => {
        isEngaged = false
        trackEngagement()
      }, 60000) // 1 minute of inactivity
    }

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true)
    })
  }

  private initializePerformanceTracking() {
    // Track Core Web Vitals
    if ('web-vitals' in window || typeof window !== 'undefined') {
      import('web-vitals').then((webVitals) => {
        webVitals.onCLS((metric) => this.trackWebVital('CLS', metric))
        webVitals.onFCP((metric) => this.trackWebVital('FCP', metric))
        webVitals.onLCP((metric) => this.trackWebVital('LCP', metric))
        webVitals.onTTFB((metric) => this.trackWebVital('TTFB', metric))
        webVitals.onINP((metric) => this.trackWebVital('INP', metric))
      }).catch(error => {
        console.warn('Failed to load web-vitals:', error)
      })
    }

    // Track resource loading performance
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming
            this.trackResourcePerformance(resource)
          }
        })
      })
      
      try {
        resourceObserver.observe({ entryTypes: ['resource'] })
      } catch (error) {
        console.warn('Resource performance observer not supported:', error)
      }
    }
  }

  private initializeErrorTracking() {
    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        session_id: this.sessionId
      })
    })

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError('unhandled_promise_rejection', {
        reason: event.reason?.toString(),
        stack: event.reason?.stack,
        session_id: this.sessionId
      })
    })

    // Track network errors
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = Date.now()
      try {
        const response = await originalFetch(...args)
        const endTime = Date.now()
        
        this.trackAPICall(args[0]?.toString() || 'unknown', {
          status: response.status,
          duration: endTime - startTime,
          success: response.ok
        })
        
        return response
      } catch (error) {
        const endTime = Date.now()
        this.trackError('network_error', {
          url: args[0]?.toString(),
          duration: endTime - startTime,
          error: error?.toString(),
          session_id: this.sessionId
        })
        throw error
      }
    }
  }

  private initializeEngagementTracking() {
    // Track scroll depth
    let maxScrollDepth = 0
    const trackScrollDepth = () => {
      const scrollDepth = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      )
      
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth
        
        // Track milestone scroll depths
        if ([25, 50, 75, 90, 100].includes(scrollDepth)) {
          this.trackEvent('scroll_depth', {
            depth_percentage: scrollDepth,
            page: window.location.pathname,
            session_id: this.sessionId
          })
        }
      }
    }

    window.addEventListener('scroll', this.throttle(trackScrollDepth, 1000))

    // Track click heatmap data
    document.addEventListener('click', (event) => {
      this.heatmapData.push({
        x: event.clientX,
        y: event.clientY,
        timestamp: Date.now()
      })

      // Keep only last 1000 clicks to prevent memory issues
      if (this.heatmapData.length > 1000) {
        this.heatmapData = this.heatmapData.slice(-1000)
      }

      this.trackEvent('user_click', {
        element_tag: (event.target as HTMLElement)?.tagName,
        element_class: (event.target as HTMLElement)?.className,
        element_id: (event.target as HTMLElement)?.id,
        x_position: event.clientX,
        y_position: event.clientY,
        page: window.location.pathname,
        session_id: this.sessionId
      })
    })

    // Track form interactions
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        this.trackEvent('form_field_focus', {
          field_type: target.tagName.toLowerCase(),
          field_name: target.getAttribute('name') || 'unnamed',
          form_id: target.closest('form')?.id || 'unnamed_form',
          session_id: this.sessionId
        })
      }
    })
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const userAgent = navigator.userAgent
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet'
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile'
    }
    return 'desktop'
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection
    return connection?.effectiveType || 'unknown'
  }

  private trackWebVital(name: string, metric: any) {
    this.trackEvent('web_vital', {
      metric_name: name,
      metric_value: metric.value,
      metric_rating: metric.rating,
      metric_id: metric.id,
      session_id: this.sessionId
    })

    // Store in performance buffer
    this.performanceBuffer.push({
      [`${name.toLowerCase()}_time`]: metric.value
    })
  }

  private trackResourcePerformance(resource: PerformanceResourceTiming) {
    const duration = resource.responseEnd - resource.requestStart
    const size = resource.transferSize || 0
    
    // Only track significant resources or slow ones
    if (duration > 100 || size > 10000) {
      this.trackEvent('resource_performance', {
        resource_url: resource.name,
        resource_type: this.getResourceType(resource.name),
        duration: Math.round(duration),
        size: size,
        cache_hit: size === 0,
        session_id: this.sessionId
      })
    }
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript'
    if (url.includes('.css')) return 'stylesheet'
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/)) return 'image'
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font'
    if (url.includes('firebase')) return 'firebase'
    if (url.includes('api') || url.includes('functions')) return 'api'
    return 'other'
  }

  private throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(null, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }) as T
  }

  // Public API
  public setUser(userId: string, properties?: UserProperties) {
    if (!this.isEnabled) return

    this.userId = userId
    setUserId(this.analytics, userId)
    
    if (properties) {
      this.setUserProperties(properties)
    }

    this.trackEvent('user_login', {
      user_id: userId,
      session_id: this.sessionId
    })
  }

  public setUserProperties(properties: UserProperties) {
    if (!this.isEnabled) return

    setUserProperties(this.analytics, properties)
  }

  public trackEvent(eventName: string, parameters?: Record<string, any>) {
    if (!this.isEnabled) return

    const event: AnalyticsEvent = {
      name: eventName,
      parameters: {
        ...parameters,
        timestamp: Date.now(),
        session_id: this.sessionId,
        user_id: this.userId
      },
      timestamp: Date.now()
    }

    // Add to user journey
    this.userJourney.push(event)
    
    // Keep only last 100 events to prevent memory issues
    if (this.userJourney.length > 100) {
      this.userJourney = this.userJourney.slice(-100)
    }

    // Send to Firebase Analytics
    logEvent(this.analytics, eventName, event.parameters)

    // Log in development
    if (import.meta.env.DEV) {
      console.log(`📊 Analytics Event: ${eventName}`, event.parameters)
    }
  }

  public trackError(errorType: string, errorData: Record<string, any>) {
    this.trackEvent('error_occurred', {
      error_type: errorType,
      ...errorData
    })
  }

  public trackAPICall(endpoint: string, data: {
    status: number
    duration: number
    success: boolean
  }) {
    this.trackEvent('api_call', {
      endpoint: endpoint,
      status_code: data.status,
      duration: data.duration,
      success: data.success,
      session_id: this.sessionId
    })
  }

  public trackPageView(pageName: string, additionalData?: Record<string, any>) {
    this.trackEvent('page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname,
      page_name: pageName,
      referrer: document.referrer,
      ...additionalData
    })
  }

  public trackUserAction(action: string, category: string, label?: string, value?: number) {
    this.trackEvent('user_action', {
      action_name: action,
      action_category: category,
      action_label: label,
      action_value: value,
      page: window.location.pathname,
      session_id: this.sessionId
    })
  }

  public startConversionFunnel(funnelName: string, step: string, metadata?: Record<string, any>) {
    if (!this.conversionFunnels.has(funnelName)) {
      this.conversionFunnels.set(funnelName, [])
    }

    const funnel = this.conversionFunnels.get(funnelName)!
    funnel.push({
      step,
      timestamp: Date.now(),
      metadata
    })

    this.trackEvent('funnel_step', {
      funnel_name: funnelName,
      step_name: step,
      step_number: funnel.length,
      ...metadata
    })
  }

  public completeConversionFunnel(funnelName: string, conversionValue?: number) {
    const funnel = this.conversionFunnels.get(funnelName)
    if (!funnel) return

    const totalTime = Date.now() - funnel[0].timestamp
    const steps = funnel.map(f => f.step)

    this.trackEvent('conversion_completed', {
      funnel_name: funnelName,
      total_steps: funnel.length,
      total_time: totalTime,
      conversion_value: conversionValue,
      funnel_steps: steps.join(' -> '),
      session_id: this.sessionId
    })

    // Clear the funnel
    this.conversionFunnels.delete(funnelName)
  }

  public trackPerformanceMetric(metricName: string, value: number, metadata?: Record<string, any>) {
    this.trackEvent('performance_metric', {
      metric_name: metricName,
      metric_value: value,
      ...metadata
    })

    // Add to performance buffer
    this.performanceBuffer.push({
      [metricName]: value
    })
  }

  public async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now()
    const traceInstance = this.performance ? trace(this.performance, name) : null
    
    if (traceInstance) {
      traceInstance.start()
    }

    try {
      const result = await fn()
      const duration = performance.now() - startTime
      
      this.trackPerformanceMetric(name, duration, {
        operation_type: 'async',
        session_id: this.sessionId
      })
      
      return result
    } finally {
      if (traceInstance) {
        traceInstance.stop()
      }
    }
  }

  public getHeatmapData(): Array<{ x: number; y: number; timestamp: number }> {
    return [...this.heatmapData]
  }

  public getUserJourney(): AnalyticsEvent[] {
    return [...this.userJourney]
  }

  public getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.performanceBuffer]
  }

  public generateAnalyticsReport(): string {
    const report = {
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date().toISOString(),
      userJourney: this.userJourney.length,
      performanceMetrics: this.performanceBuffer.length,
      heatmapPoints: this.heatmapData.length,
      activeFunnels: Array.from(this.conversionFunnels.keys()),
      deviceInfo: {
        type: this.getDeviceType(),
        connection: this.getConnectionType(),
        language: navigator.language,
        userAgent: navigator.userAgent
      }
    }

    return JSON.stringify(report, null, 2)
  }

  public exportAnalyticsData(): {
    userJourney: AnalyticsEvent[]
    performanceMetrics: PerformanceMetrics[]
    heatmapData: Array<{ x: number; y: number; timestamp: number }>
    conversionFunnels: Record<string, ConversionFunnel[]>
  } {
    return {
      userJourney: this.getUserJourney(),
      performanceMetrics: this.getPerformanceMetrics(),
      heatmapData: this.getHeatmapData(),
      conversionFunnels: Object.fromEntries(this.conversionFunnels)
    }
  }

  public clearAnalyticsData() {
    this.userJourney = []
    this.performanceBuffer = []
    this.heatmapData = []
    this.conversionFunnels.clear()
  }
}

// Create singleton instance
export const analytics = new AdvancedAnalytics()

// Export types
export type { AnalyticsEvent, UserProperties, PerformanceMetrics, ConversionFunnel }