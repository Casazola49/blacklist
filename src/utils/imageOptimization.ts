/**
 * Image Optimization and Lazy Loading Utilities
 * Provides modern image formats, lazy loading, and performance optimization
 */

interface ImageOptions {
  src: string
  alt: string
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'jpg' | 'png'
  lazy?: boolean
  placeholder?: string
  sizes?: string
  priority?: boolean
}

interface LazyImageObserver {
  observer: IntersectionObserver
  images: Set<HTMLImageElement>
}

class ImageOptimizer {
  private lazyObserver: LazyImageObserver | null = null
  private loadedImages = new Set<string>()
  private preloadedImages = new Set<string>()

  constructor() {
    this.initializeLazyLoading()
    this.preloadCriticalImages()
  }

  private initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
      this.lazyObserver = {
        observer: new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const img = entry.target as HTMLImageElement
                this.loadImage(img)
                this.lazyObserver?.observer.unobserve(img)
                this.lazyObserver?.images.delete(img)
              }
            })
          },
          {
            rootMargin: '50px 0px',
            threshold: 0.01
          }
        ),
        images: new Set()
      }
    }
  }

  private async preloadCriticalImages() {
    // Preload critical images for better performance
    const criticalImages = [
      '/icon-192x192.png',
      '/icon-512x512.png',
      // Add other critical images here
    ]

    for (const src of criticalImages) {
      await this.preloadImage(src)
    }
  }

  public async preloadImage(src: string): Promise<void> {
    if (this.preloadedImages.has(src)) {
      return
    }

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.preloadedImages.add(src)
        resolve()
      }
      img.onerror = reject
      img.src = src
    })
  }

  public createOptimizedImage(options: ImageOptions): HTMLImageElement {
    const img = document.createElement('img')
    
    // Set basic attributes
    img.alt = options.alt
    img.loading = options.lazy !== false ? 'lazy' : 'eager'
    
    // Set dimensions if provided
    if (options.width) img.width = options.width
    if (options.height) img.height = options.height
    
    // Set sizes attribute for responsive images
    if (options.sizes) {
      img.sizes = options.sizes
    }

    // Generate optimized src and srcset
    const { src, srcset } = this.generateResponsiveSources(options)
    
    if (options.lazy !== false && this.lazyObserver) {
      // Set placeholder and prepare for lazy loading
      img.src = options.placeholder || this.generatePlaceholder(options.width, options.height)
      img.dataset.src = src
      if (srcset) img.dataset.srcset = srcset
      
      // Add to lazy loading observer
      this.lazyObserver.images.add(img)
      this.lazyObserver.observer.observe(img)
      
      // Add loading class for styling
      img.classList.add('lazy-loading')
    } else {
      // Load immediately for priority images
      img.src = src
      if (srcset) img.srcset = srcset
    }

    return img
  }

  private generateResponsiveSources(options: ImageOptions): { src: string; srcset?: string } {
    const { src, width, quality = 80, format } = options
    
    // For now, return the original src
    // In a real implementation, you might integrate with a service like Cloudinary
    // or generate different sizes server-side
    
    let optimizedSrc = src
    let srcset: string | undefined

    // If width is specified, generate responsive sizes
    if (width) {
      const sizes = [width, width * 1.5, width * 2].filter(size => size <= 2048)
      srcset = sizes.map(size => `${this.getOptimizedUrl(src, size, quality, format)} ${size}w`).join(', ')
    }

    return { src: optimizedSrc, srcset }
  }

  private getOptimizedUrl(src: string, width: number, quality: number, format?: string): string {
    // In a real implementation, this would generate URLs for an image optimization service
    // For now, return the original URL with query parameters
    const url = new URL(src, window.location.origin)
    url.searchParams.set('w', width.toString())
    url.searchParams.set('q', quality.toString())
    if (format) url.searchParams.set('f', format)
    return url.toString()
  }

  private generatePlaceholder(width?: number, height?: number): string {
    const w = width || 400
    const h = height || 300
    
    // Generate a simple SVG placeholder with futuristic styling
    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#2a2a2a;stop-opacity:1" />
          </linearGradient>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#333" stroke-width="0.5" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        <rect width="100%" height="100%" fill="url(#grid)"/>
        <circle cx="${w/2}" cy="${h/2}" r="20" fill="none" stroke="#00ffff" stroke-width="2" opacity="0.5">
          <animate attributeName="r" values="20;30;20" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2s" repeatCount="indefinite"/>
        </circle>
        <text x="${w/2}" y="${h/2 + 40}" text-anchor="middle" fill="#00ffff" font-family="monospace" font-size="12" opacity="0.7">
          Cargando...
        </text>
      </svg>
    `
    
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }

  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src
    const srcset = img.dataset.srcset

    if (src) {
      img.src = src
      img.removeAttribute('data-src')
    }

    if (srcset) {
      img.srcset = srcset
      img.removeAttribute('data-srcset')
    }

    // Add loaded class and remove loading class
    img.classList.remove('lazy-loading')
    img.classList.add('lazy-loaded')

    // Mark as loaded
    if (src) this.loadedImages.add(src)
  }

  public isImageLoaded(src: string): boolean {
    return this.loadedImages.has(src)
  }

  public cleanup() {
    if (this.lazyObserver) {
      this.lazyObserver.observer.disconnect()
      this.lazyObserver.images.clear()
    }
  }
}

// Export singleton instance
export const imageOptimizer = new ImageOptimizer()

// Vue directive for lazy loading images
export const vLazyImage = {
  mounted(el: HTMLElement, binding: any) {
    const options: ImageOptions = {
      src: binding.value.src || binding.value,
      alt: binding.value.alt || '',
      width: binding.value.width,
      height: binding.value.height,
      lazy: binding.value.lazy !== false,
      placeholder: binding.value.placeholder,
      sizes: binding.value.sizes,
      priority: binding.value.priority
    }

    if (el.tagName === 'IMG') {
      const img = el as HTMLImageElement
      const optimizedImg = imageOptimizer.createOptimizedImage(options)
      
      // Copy attributes from optimized image
      img.src = optimizedImg.src
      img.alt = optimizedImg.alt
      img.loading = optimizedImg.loading
      if (optimizedImg.srcset) img.srcset = optimizedImg.srcset
      if (optimizedImg.sizes) img.sizes = optimizedImg.sizes
      if (optimizedImg.width) img.width = optimizedImg.width
      if (optimizedImg.height) img.height = optimizedImg.height
      
      // Copy classes
      optimizedImg.classList.forEach(className => img.classList.add(className))
      
      // Copy dataset
      Object.keys(optimizedImg.dataset).forEach(key => {
        img.dataset[key] = optimizedImg.dataset[key]!
      })
    }
  },
  
  unmounted(el: HTMLElement) {
    // Cleanup if needed
    if (el.tagName === 'IMG') {
      const img = el as HTMLImageElement
      img.classList.remove('lazy-loading', 'lazy-loaded')
    }
  }
}

// Utility functions
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image()
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2)
    }
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })
}

export const supportsAVIF = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const avif = new Image()
    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2)
    }
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
  })
}

// CSS for lazy loading animations
export const lazyImageCSS = `
.lazy-loading {
  filter: blur(5px);
  transition: filter 0.3s ease;
}

.lazy-loaded {
  filter: blur(0);
}

.lazy-loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.1), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
`