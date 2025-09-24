/**
 * Resource Preloading and Critical Resource Management
 * Handles preloading of critical resources for optimal performance
 */

interface PreloadResource {
  href: string
  as: 'script' | 'style' | 'font' | 'image' | 'fetch' | 'document'
  type?: string
  crossorigin?: 'anonymous' | 'use-credentials'
  media?: string
  priority?: 'high' | 'low'
}

interface PreloadOptions {
  immediate?: boolean
  priority?: 'high' | 'low'
  timeout?: number
}

class ResourcePreloader {
  private preloadedResources = new Set<string>()
  private preloadPromises = new Map<string, Promise<void>>()
  private criticalResources: PreloadResource[] = []

  constructor() {
    this.initializeCriticalResources()
    this.preloadCriticalResources()
  }

  private initializeCriticalResources() {
    this.criticalResources = [
      // Critical fonts
      {
        href: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap',
        as: 'style',
        priority: 'high'
      },
      {
        href: 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&display=swap',
        as: 'style',
        priority: 'high'
      },
      
      // Critical images
      {
        href: '/icon-192x192.png',
        as: 'image',
        priority: 'high'
      },
      {
        href: '/icon-512x512.png',
        as: 'image',
        priority: 'high'
      },
      
      // Critical scripts (will be added dynamically based on route)
    ]
  }

  private async preloadCriticalResources() {
    const highPriorityResources = this.criticalResources.filter(r => r.priority === 'high')
    const lowPriorityResources = this.criticalResources.filter(r => r.priority !== 'high')

    // Preload high priority resources immediately
    await Promise.all(highPriorityResources.map(resource => this.preloadResource(resource)))

    // Preload low priority resources after a delay
    setTimeout(() => {
      lowPriorityResources.forEach(resource => this.preloadResource(resource))
    }, 1000)
  }

  public async preloadResource(resource: PreloadResource, options: PreloadOptions = {}): Promise<void> {
    const { href, as, type, crossorigin, media } = resource
    const { immediate = false, timeout = 10000 } = options

    // Check if already preloaded
    if (this.preloadedResources.has(href)) {
      return this.preloadPromises.get(href) || Promise.resolve()
    }

    // Create preload promise
    const preloadPromise = new Promise<void>((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = href
      link.as = as

      if (type) link.type = type
      if (crossorigin) link.crossOrigin = crossorigin
      if (media) link.media = media

      // Set up timeout
      const timeoutId = setTimeout(() => {
        reject(new Error(`Preload timeout for ${href}`))
      }, timeout)

      link.onload = () => {
        clearTimeout(timeoutId)
        this.preloadedResources.add(href)
        resolve()
      }

      link.onerror = () => {
        clearTimeout(timeoutId)
        reject(new Error(`Failed to preload ${href}`))
      }

      // Add to document head
      document.head.appendChild(link)
    })

    this.preloadPromises.set(href, preloadPromise)

    if (immediate) {
      return preloadPromise
    }

    // Don't wait for non-immediate preloads
    preloadPromise.catch(error => {
      console.warn('Preload failed:', error.message)
    })

    return Promise.resolve()
  }

  public async preloadRoute(routeName: string): Promise<void> {
    const routeResources = this.getRouteResources(routeName)
    
    await Promise.all(
      routeResources.map(resource => this.preloadResource(resource, { immediate: true }))
    )
  }

  private getRouteResources(routeName: string): PreloadResource[] {
    const routeResourceMap: Record<string, PreloadResource[]> = {
      'landing': [
        {
          href: '/js/landing-[hash].js',
          as: 'script',
          priority: 'high'
        },
        {
          href: '/css/landing-[hash].css',
          as: 'style',
          priority: 'high'
        }
      ],
      'dashboard': [
        {
          href: '/js/dashboard-[hash].js',
          as: 'script',
          priority: 'high'
        },
        {
          href: '/js/firebase-[hash].js',
          as: 'script',
          priority: 'high'
        }
      ],
      'auth': [
        {
          href: '/js/firebase-[hash].js',
          as: 'script',
          priority: 'high'
        }
      ]
    }

    return routeResourceMap[routeName] || []
  }

  public async preloadModuleResources(modules: string[]): Promise<void> {
    const modulePromises = modules.map(async (modulePath) => {
      try {
        // Use dynamic import with vite-ignore comment to suppress warning
        await import(/* @vite-ignore */ modulePath)
      } catch (error) {
        console.warn(`Failed to preload module ${modulePath}:`, error)
      }
    })

    await Promise.allSettled(modulePromises)
  }

  public preloadImage(src: string, options: PreloadOptions = {}): Promise<void> {
    return this.preloadResource({
      href: src,
      as: 'image',
      priority: options.priority || 'low'
    }, options)
  }

  public preloadFont(href: string, options: PreloadOptions = {}): Promise<void> {
    return this.preloadResource({
      href,
      as: 'font',
      type: 'font/woff2',
      crossorigin: 'anonymous',
      priority: options.priority || 'high'
    }, options)
  }

  public preloadScript(href: string, options: PreloadOptions = {}): Promise<void> {
    return this.preloadResource({
      href,
      as: 'script',
      priority: options.priority || 'low'
    }, options)
  }

  public preloadStyle(href: string, media?: string, options: PreloadOptions = {}): Promise<void> {
    return this.preloadResource({
      href,
      as: 'style',
      media,
      priority: options.priority || 'high'
    }, options)
  }

  public async preloadCriticalPath(routeName: string): Promise<void> {
    // Preload resources needed for the critical rendering path
    const criticalResources: PreloadResource[] = [
      // CSS for the route
      {
        href: `/css/${routeName}-[hash].css`,
        as: 'style',
        priority: 'high'
      },
      // JavaScript for the route
      {
        href: `/js/${routeName}-[hash].js`,
        as: 'script',
        priority: 'high'
      }
    ]

    await Promise.all(
      criticalResources.map(resource => this.preloadResource(resource, { immediate: true }))
    )
  }

  public getPreloadedResources(): string[] {
    return Array.from(this.preloadedResources)
  }

  public isResourcePreloaded(href: string): boolean {
    return this.preloadedResources.has(href)
  }

  public clearPreloadCache(): void {
    this.preloadedResources.clear()
    this.preloadPromises.clear()
  }

  // Prefetch resources for likely next navigation
  public prefetchRoute(routeName: string): void {
    const routeResources = this.getRouteResources(routeName)
    
    routeResources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = resource.href
      link.as = resource.as
      
      if (resource.type) link.type = resource.type
      if (resource.crossorigin) link.crossOrigin = resource.crossorigin
      
      document.head.appendChild(link)
    })
  }

  // DNS prefetch for external domains
  public dnsPrefetch(domains: string[]): void {
    domains.forEach(domain => {
      const link = document.createElement('link')
      link.rel = 'dns-prefetch'
      link.href = domain
      document.head.appendChild(link)
    })
  }

  // Preconnect to external domains
  public preconnect(domains: string[]): void {
    domains.forEach(domain => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = domain
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    })
  }
}

// Export singleton instance
export const resourcePreloader = new ResourcePreloader()

// Vue composable for resource preloading
export function useResourcePreloader() {
  const preloadRoute = (routeName: string) => {
    return resourcePreloader.preloadRoute(routeName)
  }

  const preloadImage = (src: string, options?: PreloadOptions) => {
    return resourcePreloader.preloadImage(src, options)
  }

  const preloadFont = (href: string, options?: PreloadOptions) => {
    return resourcePreloader.preloadFont(href, options)
  }

  const prefetchRoute = (routeName: string) => {
    resourcePreloader.prefetchRoute(routeName)
  }

  const isPreloaded = (href: string) => {
    return resourcePreloader.isResourcePreloaded(href)
  }

  return {
    preloadRoute,
    preloadImage,
    preloadFont,
    prefetchRoute,
    isPreloaded
  }
}

// Initialize external domain optimizations
resourcePreloader.dnsPrefetch([
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://firebaseapp.com',
  'https://googleapis.com'
])

resourcePreloader.preconnect([
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com'
])