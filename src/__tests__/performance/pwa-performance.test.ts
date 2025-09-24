import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(),
  getEntriesByName: vi.fn(),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  navigation: {
    type: 0,
    redirectCount: 0
  },
  timing: {
    navigationStart: 1000,
    domainLookupStart: 1010,
    domainLookupEnd: 1020,
    connectStart: 1020,
    connectEnd: 1050,
    requestStart: 1050,
    responseStart: 1100,
    responseEnd: 1200,
    domLoading: 1200,
    domInteractive: 1500,
    domContentLoadedEventStart: 1500,
    domContentLoadedEventEnd: 1520,
    domComplete: 1800,
    loadEventStart: 1800,
    loadEventEnd: 1850
  }
}

// Mock global performance
Object.defineProperty(global, 'performance', {
  writable: true,
  value: mockPerformance
})

// Mock Intersection Observer
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

describe('PWA Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Core Web Vitals', () => {
    it('should measure Largest Contentful Paint (LCP)', async () => {
      const { measureLCP } = await import('../../utils/performanceMonitor')
      
      // Mock LCP entry
      const mockLCPEntry = {
        name: '',
        entryType: 'largest-contentful-paint',
        startTime: 1500,
        duration: 0,
        size: 12000,
        id: '',
        url: '',
        element: document.createElement('img')
      }

      vi.mocked(mockPerformance.getEntriesByType).mockReturnValue([mockLCPEntry])

      const lcp = measureLCP()
      expect(lcp).toBe(1500)
      expect(lcp).toBeLessThan(2500) // Good LCP threshold
    })

    it('should measure First Input Delay (FID)', async () => {
      const { measureFID } = await import('../../utils/performanceMonitor')
      
      const mockFIDEntry = {
        name: 'click',
        entryType: 'first-input',
        startTime: 1200,
        duration: 50,
        processingStart: 1210,
        processingEnd: 1250,
        cancelable: true
      }

      vi.mocked(mockPerformance.getEntriesByType).mockReturnValue([mockFIDEntry])

      const fid = measureFID()
      expect(fid).toBe(50)
      expect(fid).toBeLessThan(100) // Good FID threshold
    })

    it('should measure Cumulative Layout Shift (CLS)', async () => {
      const { measureCLS } = await import('../../utils/performanceMonitor')
      
      const mockCLSEntries = [
        {
          name: '',
          entryType: 'layout-shift',
          startTime: 1000,
          duration: 0,
          value: 0.05,
          hadRecentInput: false,
          lastInputTime: 0,
          sources: []
        },
        {
          name: '',
          entryType: 'layout-shift',
          startTime: 2000,
          duration: 0,
          value: 0.03,
          hadRecentInput: false,
          lastInputTime: 0,
          sources: []
        }
      ]

      vi.mocked(mockPerformance.getEntriesByType).mockReturnValue(mockCLSEntries)

      const cls = measureCLS()
      expect(cls).toBe(0.08)
      expect(cls).toBeLessThan(0.1) // Good CLS threshold
    })

    it('should measure First Contentful Paint (FCP)', async () => {
      const { measureFCP } = await import('../../utils/performanceMonitor')
      
      const mockFCPEntry = {
        name: 'first-contentful-paint',
        entryType: 'paint',
        startTime: 800,
        duration: 0
      }

      vi.mocked(mockPerformance.getEntriesByName).mockReturnValue([mockFCPEntry])

      const fcp = measureFCP()
      expect(fcp).toBe(800)
      expect(fcp).toBeLessThan(1800) // Good FCP threshold
    })
  })

  describe('Resource Loading Performance', () => {
    it('should measure resource loading times', async () => {
      const { measureResourceTiming } = await import('../../utils/performanceMonitor')
      
      const mockResourceEntries = [
        {
          name: 'https://example.com/app.js',
          entryType: 'resource',
          startTime: 1000,
          duration: 200,
          initiatorType: 'script',
          transferSize: 50000,
          encodedBodySize: 45000,
          decodedBodySize: 120000
        },
        {
          name: 'https://example.com/app.css',
          entryType: 'resource',
          startTime: 1100,
          duration: 150,
          initiatorType: 'link',
          transferSize: 15000,
          encodedBodySize: 12000,
          decodedBodySize: 35000
        }
      ]

      vi.mocked(mockPerformance.getEntriesByType).mockReturnValue(mockResourceEntries)

      const resourceTiming = measureResourceTiming()
      
      expect(resourceTiming.scripts).toHaveLength(1)
      expect(resourceTiming.stylesheets).toHaveLength(1)
      expect(resourceTiming.scripts[0].duration).toBe(200)
      expect(resourceTiming.stylesheets[0].duration).toBe(150)
    })

    it('should identify slow resources', async () => {
      const { identifySlowResources } = await import('../../utils/performanceMonitor')
      
      const mockResourceEntries = [
        {
          name: 'https://example.com/slow-image.jpg',
          entryType: 'resource',
          startTime: 1000,
          duration: 3000, // Slow resource
          initiatorType: 'img',
          transferSize: 500000
        },
        {
          name: 'https://example.com/fast-script.js',
          entryType: 'resource',
          startTime: 1100,
          duration: 100, // Fast resource
          initiatorType: 'script',
          transferSize: 10000
        }
      ]

      vi.mocked(mockPerformance.getEntriesByType).mockReturnValue(mockResourceEntries)

      const slowResources = identifySlowResources(1000) // Threshold: 1 second
      
      expect(slowResources).toHaveLength(1)
      expect(slowResources[0].name).toContain('slow-image.jpg')
      expect(slowResources[0].duration).toBe(3000)
    })
  })

  describe('Bundle Size Analysis', () => {
    it('should analyze JavaScript bundle sizes', async () => {
      const { analyzeBundleSizes } = await import('../../utils/performanceMonitor')
      
      const mockResourceEntries = [
        {
          name: 'https://example.com/js/vendor-abc123.js',
          transferSize: 150000,
          decodedBodySize: 450000,
          initiatorType: 'script'
        },
        {
          name: 'https://example.com/js/app-def456.js',
          transferSize: 80000,
          decodedBodySize: 200000,
          initiatorType: 'script'
        },
        {
          name: 'https://example.com/js/firebase-ghi789.js',
          transferSize: 120000,
          decodedBodySize: 350000,
          initiatorType: 'script'
        }
      ]

      vi.mocked(mockPerformance.getEntriesByType).mockReturnValue(mockResourceEntries)

      const bundleAnalysis = analyzeBundleSizes()
      
      expect(bundleAnalysis.totalTransferSize).toBe(350000)
      expect(bundleAnalysis.totalDecodedSize).toBe(1000000)
      expect(bundleAnalysis.compressionRatio).toBeCloseTo(0.35, 2)
      expect(bundleAnalysis.largestBundle.name).toContain('vendor')
    })

    it('should warn about large bundles', async () => {
      const { checkBundleSizeThresholds } = await import('../../utils/performanceMonitor')
      
      const mockLargeBundle = {
        name: 'https://example.com/js/huge-bundle.js',
        transferSize: 300000, // 300KB - too large
        decodedBodySize: 800000,
        initiatorType: 'script'
      }

      const warnings = checkBundleSizeThresholds([mockLargeBundle])
      
      expect(warnings).toHaveLength(1)
      expect(warnings[0].type).toBe('large-bundle')
      expect(warnings[0].threshold).toBe(250000) // 250KB threshold
    })
  })

  describe('Memory Usage', () => {
    it('should monitor memory usage', async () => {
      // Mock memory API
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 50000000, // 50MB
          totalJSHeapSize: 80000000, // 80MB
          jsHeapSizeLimit: 2000000000 // 2GB
        }
      })

      const { measureMemoryUsage } = await import('../../utils/performanceMonitor')
      
      const memoryUsage = measureMemoryUsage()
      
      expect(memoryUsage.used).toBe(50000000)
      expect(memoryUsage.total).toBe(80000000)
      expect(memoryUsage.limit).toBe(2000000000)
      expect(memoryUsage.usagePercentage).toBeCloseTo(62.5, 1)
    })

    it('should detect memory leaks', async () => {
      const { detectMemoryLeaks } = await import('../../utils/performanceMonitor')
      
      // Simulate increasing memory usage
      const measurements = [
        { timestamp: 1000, used: 30000000 },
        { timestamp: 2000, used: 35000000 },
        { timestamp: 3000, used: 42000000 },
        { timestamp: 4000, used: 51000000 },
        { timestamp: 5000, used: 63000000 }
      ]

      const leakDetection = detectMemoryLeaks(measurements)
      
      expect(leakDetection.isLeaking).toBe(true)
      expect(leakDetection.growthRate).toBeGreaterThan(0)
      expect(leakDetection.severity).toBe('high')
    })
  })

  describe('Service Worker Performance', () => {
    it('should measure service worker installation time', async () => {
      const { measureSWInstallTime } = await import('../../utils/performanceMonitor')
      
      // Mock service worker events
      const mockSWEvents = [
        {
          name: 'sw-install-start',
          entryType: 'mark',
          startTime: 1000
        },
        {
          name: 'sw-install-end',
          entryType: 'mark',
          startTime: 1500
        }
      ]

      vi.mocked(mockPerformance.getEntriesByName)
        .mockImplementation((name) => 
          mockSWEvents.filter(event => event.name === name)
        )

      const installTime = measureSWInstallTime()
      expect(installTime).toBe(500)
      expect(installTime).toBeLessThan(1000) // Should install quickly
    })

    it('should measure cache hit rates', async () => {
      const { measureCacheHitRate } = await import('../../utils/performanceMonitor')
      
      const mockCacheEvents = [
        { type: 'cache-hit', resource: 'app.js' },
        { type: 'cache-hit', resource: 'app.css' },
        { type: 'cache-miss', resource: 'new-image.jpg' },
        { type: 'cache-hit', resource: 'vendor.js' },
        { type: 'cache-miss', resource: 'api-data.json' }
      ]

      const hitRate = measureCacheHitRate(mockCacheEvents)
      expect(hitRate).toBeCloseTo(0.6, 1) // 60% hit rate
    })
  })

  describe('Animation Performance', () => {
    it('should measure frame rate during animations', async () => {
      const { measureAnimationFrameRate } = await import('../../utils/performanceMonitor')
      
      // Mock frame timing entries
      const mockFrameEntries = Array.from({ length: 60 }, (_, i) => ({
        name: 'frame',
        entryType: 'measure',
        startTime: i * 16.67, // 60 FPS
        duration: 16.67
      }))

      vi.mocked(mockPerformance.getEntriesByType).mockReturnValue(mockFrameEntries)

      const frameRate = measureAnimationFrameRate()
      expect(frameRate).toBeCloseTo(60, 0)
      expect(frameRate).toBeGreaterThan(30) // Minimum acceptable frame rate
    })

    it('should detect janky animations', async () => {
      const { detectJankyAnimations } = await import('../../utils/performanceMonitor')
      
      const mockFrameEntries = [
        { duration: 16.67 }, // Good frame
        { duration: 16.67 }, // Good frame
        { duration: 50 },    // Janky frame
        { duration: 16.67 }, // Good frame
        { duration: 33.33 }  // Slightly janky frame
      ]

      const jankyFrames = detectJankyAnimations(mockFrameEntries)
      expect(jankyFrames).toHaveLength(2)
      expect(jankyFrames[0].duration).toBe(50)
    })
  })

  describe('Network Performance', () => {
    it('should measure network connection quality', async () => {
      // Mock Network Information API
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '4g',
          downlink: 10, // Mbps
          rtt: 50, // ms
          saveData: false
        }
      })

      const { measureNetworkQuality } = await import('../../utils/performanceMonitor')
      
      const networkQuality = measureNetworkQuality()
      expect(networkQuality.effectiveType).toBe('4g')
      expect(networkQuality.downlink).toBe(10)
      expect(networkQuality.rtt).toBe(50)
      expect(networkQuality.quality).toBe('good')
    })

    it('should adapt to slow connections', async () => {
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '2g',
          downlink: 0.5,
          rtt: 2000,
          saveData: true
        }
      })

      const { getPerformanceRecommendations } = await import('../../utils/performanceMonitor')
      
      const recommendations = getPerformanceRecommendations()
      expect(recommendations).toContain('reduce-images')
      expect(recommendations).toContain('disable-animations')
      expect(recommendations).toContain('lazy-load-content')
    })
  })

  describe('Performance Budget', () => {
    it('should enforce performance budgets', async () => {
      const { checkPerformanceBudget } = await import('../../utils/performanceMonitor')
      
      const budget = {
        lcp: 2500,
        fid: 100,
        cls: 0.1,
        fcp: 1800,
        bundleSize: 250000
      }

      const metrics = {
        lcp: 3000, // Over budget
        fid: 50,   // Within budget
        cls: 0.15, // Over budget
        fcp: 1200, // Within budget
        bundleSize: 300000 // Over budget
      }

      const budgetResults = checkPerformanceBudget(metrics, budget)
      
      expect(budgetResults.passed).toBe(false)
      expect(budgetResults.violations).toHaveLength(3)
      expect(budgetResults.violations).toContain('lcp')
      expect(budgetResults.violations).toContain('cls')
      expect(budgetResults.violations).toContain('bundleSize')
    })
  })

  describe('Performance Monitoring Integration', () => {
    it('should send performance data to monitoring service', async () => {
      const { sendPerformanceData } = await import('../../utils/performanceMonitor')
      
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
      
      global.fetch = mockFetch

      const performanceData = {
        lcp: 1500,
        fid: 50,
        cls: 0.05,
        fcp: 800,
        url: 'https://example.com/dashboard',
        userAgent: 'test-browser',
        timestamp: Date.now()
      }

      await sendPerformanceData(performanceData)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/performance'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(performanceData)
        })
      )
    })
  })
})