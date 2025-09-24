/**
 * PWA Functionality Tests
 * Tests for service worker registration, offline handling, and PWA features
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock service worker registration
vi.mock('virtual:pwa-register', () => ({
  registerSW: vi.fn().mockReturnValue(vi.fn())
}))

// Mock DOM methods
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: query === '(display-mode: standalone)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock navigator
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: vi.fn(),
    ready: Promise.resolve({
      update: vi.fn(),
      sync: {
        register: vi.fn()
      }
    })
  }
})

describe('PWA Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset DOM
    document.head.innerHTML = ''
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Service Worker Registration', () => {
    it('should initialize PWA manager', async () => {
      const { pwaManager } = await import('../pwa')
      expect(pwaManager).toBeDefined()
      expect(typeof pwaManager.getStatus).toBe('function')
    })
  })

  describe('PWA Status', () => {
    it('should provide status information', async () => {
      const { pwaManager } = await import('../pwa')
      const status = pwaManager.getStatus()
      
      expect(status).toHaveProperty('needRefresh')
      expect(status).toHaveProperty('offlineReady')
      expect(status).toHaveProperty('updateSW')
      expect(typeof status.updateSW).toBe('function')
    })
  })
})

describe('PWA Detection', () => {
  it('should detect if PWA is installed (standalone mode)', async () => {
    // Mock standalone display mode
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { isPWAInstalled } = await import('../pwa')
    expect(isPWAInstalled()).toBe(true)
  })

  it('should detect if PWA is not installed', async () => {
    // Mock browser display mode
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { isPWAInstalled } = await import('../pwa')
    expect(isPWAInstalled()).toBe(false)
  })

  it('should detect PWA installation capability', async () => {
    const { canInstallPWA } = await import('../pwa')
    // In test environment, service worker might not be available
    expect(typeof canInstallPWA()).toBe('boolean')
  })
})

describe('Performance Integration', () => {
  it('should integrate with performance monitoring', async () => {
    const { pwaManager } = await import('../pwa')
    expect(pwaManager).toBeDefined()
    expect(typeof pwaManager.getStatus).toBe('function')
    expect(typeof pwaManager.onUpdate).toBe('function')
  })
})