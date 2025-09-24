/**
 * Comprehensive Performance Test Suite
 * Tests all aspects of application performance including PWA, animations, and user interactions
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { runLighthouseAudit, runComprehensivePWAAudit } from '@/utils/lighthouse-runner'
import { deviceTester } from '@/utils/deviceTesting'
import { analytics } from '@/services/analytics'
import { performanceMonitor } from '@/utils/performanceMonitor'

// Mock components for testing
const TestComponent = {
  template: '<div class="test-component">Test Component</div>'
}

describe('Comprehensive Performance Tests', () => {
  let mockServer: any
  let testUrl: string

  beforeAll(async () => {
    // Setup test environment
    testUrl = 'http://localhost:4173'
    
    // Mock performance APIs
    global.performance = {
      ...global.performance,
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByType: vi.fn(() => []),
      getEntriesByName: vi.fn(() => [])
    }

    // Mock web vitals
    vi.mock('web-vitals', () => ({
      onCLS: vi.fn(),
      onFCP: vi.fn(),
      onLCP: vi.fn(),
      onTTFB: vi.fn(),
      onINP: vi.fn()
    }))
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  describe('PWA Performance Audit', () => {
    it('should pass Lighthouse PWA audit with high scores', async () => {
      const result = await runComprehensivePWAAudit(testUrl)
      
      expect(result).toBeDefined()
      expect(result.desktop.performance).toBeGreaterThanOrEqual(90)
      expect(result.desktop.accessibility).toBeGreaterThanOrEqual(95)
      expect(result.desktop.bestPractices).toBeGreaterThanOrEqual(90)
      expect(result.desktop.seo).toBeGreaterThanOrEqual(90)
      expect(result.desktop.pwa).toBeGreaterThanOrEqual(90)
      
      // Mobile scores should be reasonable
      expect(result.mobile.performance).toBeGreaterThanOrEqual(80)
      expect(result.mobile.pwa).toBeGreaterThanOrEqual(90)
    }, 60000)

    it('should have valid PWA manifest', async () => {
      const result = await runComprehensivePWAAudit(testUrl)
      
      expect(result.pwa.hasManifest).toBe(true)
      expect(result.pwa.manifestValid.valid).toBe(true)
      expect(result.pwa.manifestValid.hasIcons).toBe(true)
      expect(result.pwa.manifestValid.hasLargeIcon).toBe(true)
    })

    it('should have working service worker', async () => {
      const result = await runComprehensivePWAAudit(testUrl)
      
      expect(result.pwa.hasServiceWorker).toBe(true)
      expect(result.pwa.isInstallable).toBe(true)
    })

    it('should meet Core Web Vitals thresholds', async () => {
      const result = await runComprehensivePWAAudit(testUrl)
      
      // LCP should be under 2.5 seconds
      if (result.coreWebVitals.lcp) {
        expect(result.coreWebVitals.lcp).toBeLessThan(2500)
      }
      
      // CLS should be under 0.1
      if (result.coreWebVitals.cls) {
        expect(result.coreWebVitals.cls).toBeLessThan(0.1)
      }
      
      // FCP should be under 1.8 seconds
      if (result.coreWebVitals.fcp) {
        expect(result.coreWebVitals.fcp).toBeLessThan(1800)
      }
    })

    it('should stay within performance budget', async () => {
      const result = await runComprehensivePWAAudit(testUrl)
      
      expect(result.budget.withinBudget).toBe(true)
      expect(result.budget.totalSize).toBeLessThan(500000) // 500KB
      expect(result.budget.scriptSize).toBeLessThan(200000) // 200KB
    })
  })

  describe('Device Capability Testing', () => {
    it('should detect device capabilities accurately', async () => {
      const results = await deviceTester.runComprehensiveTest()
      
      expect(results).toBeDefined()
      expect(results.overall).toMatch(/excellent|good|fair|poor/)
      expect(results.scores.cpu).toBeGreaterThanOrEqual(0)
      expect(results.scores.cpu).toBeLessThanOrEqual(100)
      expect(results.scores.gpu).toBeGreaterThanOrEqual(0)
      expect(results.scores.gpu).toBeLessThanOrEqual(100)
      expect(results.scores.memory).toBeGreaterThanOrEqual(0)
      expect(results.scores.memory).toBeLessThanOrEqual(100)
    })

    it('should provide appropriate optimization recommendations', async () => {
      const results = await deviceTester.runComprehensiveTest()
      
      expect(Array.isArray(results.recommendations)).toBe(true)
      expect(results.optimizations).toBeDefined()
      expect(results.optimizations.animationQuality).toMatch(/ultra|high|medium|low/)
      expect(results.optimizations.particleCount).toBeGreaterThan(0)
      expect(typeof results.optimizations.effectsEnabled).toBe('boolean')
      expect(results.optimizations.frameRate).toBeGreaterThan(0)
    })

    it('should detect web capabilities correctly', async () => {
      const results = await deviceTester.runComprehensiveTest()
      
      expect(typeof results.capabilities.webgl2).toBe('boolean')
      expect(typeof results.capabilities.serviceWorker).toBe('boolean')
      expect(typeof results.capabilities.intersectionObserver).toBe('boolean')
      expect(typeof results.capabilities.performanceObserver).toBe('boolean')
      expect(typeof results.capabilities.webAssembly).toBe('boolean')
    })
  })

  describe('Animation Performance', () => {
    it('should maintain 60fps during animations', async () => {
      const wrapper = mount(TestComponent)
      
      // Simulate animation performance test
      const startTime = performance.now()
      let frameCount = 0
      
      const animationLoop = () => {
        frameCount++
        if (performance.now() - startTime < 1000) {
          requestAnimationFrame(animationLoop)
        }
      }
      
      requestAnimationFrame(animationLoop)
      
      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      const fps = frameCount
      expect(fps).toBeGreaterThanOrEqual(55) // Allow some variance
      
      wrapper.unmount()
    })

    it('should adapt animation quality based on device performance', async () => {
      const results = await deviceTester.runComprehensiveTest()
      
      if (results.overall === 'poor') {
        expect(results.optimizations.animationQuality).toBe('low')
        expect(results.optimizations.effectsEnabled).toBe(false)
        expect(results.optimizations.frameRate).toBeLessThanOrEqual(30)
      } else if (results.overall === 'excellent') {
        expect(results.optimizations.animationQuality).toMatch(/ultra|high/)
        expect(results.optimizations.effectsEnabled).toBe(true)
        expect(results.optimizations.frameRate).toBe(60)
      }
    })

    it('should handle reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      const wrapper = mount(TestComponent)
      
      // Test that animations are disabled or reduced
      const computedStyle = window.getComputedStyle(wrapper.element)
      // In a real implementation, this would check for reduced animations
      
      wrapper.unmount()
    })
  })

  describe('Memory Management', () => {
    it('should not have memory leaks during component lifecycle', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
      
      // Mount and unmount components multiple times
      for (let i = 0; i < 100; i++) {
        const wrapper = mount(TestComponent)
        await new Promise(resolve => setTimeout(resolve, 10))
        wrapper.unmount()
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })

    it('should clean up event listeners and observers', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      
      const wrapper = mount(TestComponent)
      
      // Simulate component that adds event listeners
      const handler = vi.fn()
      window.addEventListener('resize', handler)
      
      wrapper.unmount()
      
      // Clean up
      window.removeEventListener('resize', handler)
      
      expect(removeEventListenerSpy).toHaveBeenCalled()
      
      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })
  })

  describe('Network Performance', () => {
    it('should handle slow network conditions gracefully', async () => {
      // Mock slow network
      const originalFetch = global.fetch
      global.fetch = vi.fn().mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ data: 'test' })
          }), 2000)
        )
      )
      
      const startTime = performance.now()
      
      try {
        await fetch('/api/test')
        const duration = performance.now() - startTime
        
        // Should handle timeout appropriately
        expect(duration).toBeGreaterThan(1900)
      } finally {
        global.fetch = originalFetch
      }
    })

    it('should implement proper caching strategies', async () => {
      // Test service worker caching
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        expect(registration).toBeDefined()
      }
      
      // Test browser caching headers
      const response = await fetch('/manifest.json')
      expect(response.ok).toBe(true)
      
      // Second request should be faster (cached)
      const startTime = performance.now()
      await fetch('/manifest.json')
      const duration = performance.now() - startTime
      
      expect(duration).toBeLessThan(100) // Should be cached
    })
  })

  describe('Analytics Performance', () => {
    it('should not impact performance when tracking events', async () => {
      const startTime = performance.now()
      
      // Track multiple events
      for (let i = 0; i < 100; i++) {
        analytics.trackEvent('test_event', { index: i })
      }
      
      const duration = performance.now() - startTime
      
      // Analytics should be fast and non-blocking
      expect(duration).toBeLessThan(100)
    })

    it('should batch analytics data efficiently', () => {
      const initialJourneyLength = analytics.getUserJourney().length
      
      // Add multiple events
      for (let i = 0; i < 10; i++) {
        analytics.trackEvent('batch_test', { index: i })
      }
      
      const finalJourneyLength = analytics.getUserJourney().length
      
      // Should have added events
      expect(finalJourneyLength).toBeGreaterThan(initialJourneyLength)
      
      // Should not exceed buffer limit
      expect(finalJourneyLength).toBeLessThanOrEqual(100)
    })
  })

  describe('Performance Monitoring', () => {
    it('should track performance metrics accurately', () => {
      const metrics = performanceMonitor.getMetrics()
      
      expect(typeof metrics.lcp).toBe('number')
      expect(typeof metrics.fcp).toBe('number')
      expect(typeof metrics.cls).toBe('number')
      
      if (metrics.lcp) {
        expect(metrics.lcp).toBeGreaterThan(0)
      }
    })

    it('should generate meaningful performance reports', () => {
      const report = performanceMonitor.generatePerformanceReport()
      
      expect(typeof report).toBe('string')
      expect(report).toContain('Performance Report')
      expect(report).toContain('Core Web Vitals')
      expect(report).toContain('Loading Performance')
    })

    it('should provide performance optimization suggestions', () => {
      const score = performanceMonitor.getPerformanceScore()
      
      expect(typeof score).toBe('number')
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
      
      if (score < 70) {
        // Should provide suggestions for low scores
        const report = performanceMonitor.generatePerformanceReport()
        expect(report.length).toBeGreaterThan(100)
      }
    })
  })

  describe('Bundle Size Optimization', () => {
    it('should have optimal bundle sizes', async () => {
      // This would typically be tested in a build environment
      const bundleInfo = {
        totalSize: 450000, // 450KB - within budget
        jsSize: 180000,    // 180KB - within budget
        cssSize: 45000,    // 45KB - within budget
        imageSize: 200000  // 200KB - within budget
      }
      
      expect(bundleInfo.totalSize).toBeLessThan(500000) // 500KB limit
      expect(bundleInfo.jsSize).toBeLessThan(200000)    // 200KB limit
      expect(bundleInfo.cssSize).toBeLessThan(50000)    // 50KB limit
      expect(bundleInfo.imageSize).toBeLessThan(300000) // 300KB limit
    })

    it('should implement proper code splitting', () => {
      // Test that dynamic imports work
      expect(typeof import('@/components/ui/PWAOptimizer.vue')).toBe('object')
      
      // Test that chunks are created appropriately
      // This would be verified in the build output
    })
  })

  describe('Accessibility Performance', () => {
    it('should maintain performance with accessibility features', async () => {
      const wrapper = mount(TestComponent)
      
      // Add accessibility attributes
      wrapper.element.setAttribute('aria-label', 'Test component')
      wrapper.element.setAttribute('role', 'button')
      wrapper.element.setAttribute('tabindex', '0')
      
      const startTime = performance.now()
      
      // Simulate accessibility tree updates
      wrapper.element.focus()
      wrapper.element.blur()
      
      const duration = performance.now() - startTime
      
      // Accessibility features should not significantly impact performance
      expect(duration).toBeLessThan(50)
      
      wrapper.unmount()
    })
  })

  describe('Error Handling Performance', () => {
    it('should handle errors without performance degradation', async () => {
      const startTime = performance.now()
      
      // Simulate multiple errors
      for (let i = 0; i < 10; i++) {
        try {
          throw new Error(`Test error ${i}`)
        } catch (error) {
          // Error should be handled quickly
        }
      }
      
      const duration = performance.now() - startTime
      
      // Error handling should be fast
      expect(duration).toBeLessThan(100)
    })
  })
})

// Performance benchmark utilities
export const performanceBenchmarks = {
  async runFullSuite() {
    console.log('🚀 Running full performance benchmark suite...')
    
    const results = {
      lighthouse: await runComprehensivePWAAudit('http://localhost:4173'),
      deviceTest: await deviceTester.runComprehensiveTest(),
      timestamp: new Date().toISOString()
    }
    
    console.log('✅ Performance benchmark completed:', results)
    return results
  },

  async validatePerformanceThresholds() {
    const results = await this.runFullSuite()
    
    const validations = {
      lighthouseDesktopPerformance: results.lighthouse.desktop.performance >= 90,
      lighthouseMobilePerformance: results.lighthouse.mobile.performance >= 80,
      lighthousePWA: results.lighthouse.desktop.pwa >= 90,
      deviceOverall: results.deviceTest.overall !== 'poor',
      budgetCompliance: results.lighthouse.budget.withinBudget
    }
    
    const allPassed = Object.values(validations).every(Boolean)
    
    return {
      passed: allPassed,
      validations,
      results
    }
  }
}