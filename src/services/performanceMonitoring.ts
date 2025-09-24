import { getAnalytics, logEvent } from 'firebase/analytics';
import { getPerformance, trace } from 'firebase/performance';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface VitalMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

class PerformanceMonitor {
  private analytics: any;
  private performance: any;
  private metrics: PerformanceMetric[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = import.meta.env.VITE_FEATURE_PERFORMANCE_MONITORING === 'true';
    
    if (this.isEnabled && typeof window !== 'undefined') {
      this.initializeFirebasePerformance();
      this.initializeWebVitals();
      this.initializeCustomMetrics();
    }
  }

  private initializeFirebasePerformance() {
    try {
      this.analytics = getAnalytics();
      this.performance = getPerformance();
    } catch (error) {
      console.warn('Failed to initialize Firebase Performance:', error);
    }
  }

  private initializeWebVitals() {
    // Import web-vitals dynamically to avoid SSR issues
    import('web-vitals').then((webVitals) => {
      if (webVitals.onCLS) webVitals.onCLS(this.onVitalMetric.bind(this));
      if (webVitals.onFID) webVitals.onFID(this.onVitalMetric.bind(this));
      if (webVitals.onFCP) webVitals.onFCP(this.onVitalMetric.bind(this));
      if (webVitals.onLCP) webVitals.onLCP(this.onVitalMetric.bind(this));
      if (webVitals.onTTFB) webVitals.onTTFB(this.onVitalMetric.bind(this));
    }).catch(error => {
      console.warn('Failed to load web-vitals:', error);
    });
  }

  private initializeCustomMetrics() {
    // Monitor navigation timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.collectNavigationMetrics();
          this.collectResourceMetrics();
        }, 0);
      });
    }

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('long-task', entry.duration, {
              startTime: entry.startTime,
              name: entry.name
            });
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('Long task observer not supported:', error);
      }
    }
  }

  private onVitalMetric(metric: any) {
    this.recordMetric(`web-vital-${metric.name.toLowerCase()}`, metric.value, {
      rating: metric.rating,
      id: metric.id
    });

    // Send to Firebase Analytics
    if (this.analytics) {
      logEvent(this.analytics, 'web_vital', {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_rating: metric.rating
      });
    }
  }

  private collectNavigationMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      const metrics = {
        'dns-lookup': navigation.domainLookupEnd - navigation.domainLookupStart,
        'tcp-connection': navigation.connectEnd - navigation.connectStart,
        'tls-negotiation': navigation.secureConnectionStart > 0 ? navigation.connectEnd - navigation.secureConnectionStart : 0,
        'request-response': navigation.responseEnd - navigation.requestStart,
        'dom-processing': navigation.domComplete - navigation.responseEnd,
        'total-load-time': navigation.loadEventEnd - navigation.fetchStart
      };

      Object.entries(metrics).forEach(([name, value]) => {
        if (value > 0) {
          this.recordMetric(name, value);
        }
      });
    }
  }

  private collectResourceMetrics() {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const resourceTypes = new Map<string, { count: number; totalSize: number; totalTime: number }>();

    resources.forEach(resource => {
      const type = this.getResourceType(resource.name);
      const size = resource.transferSize || 0;
      const time = resource.responseEnd - resource.startTime;

      if (!resourceTypes.has(type)) {
        resourceTypes.set(type, { count: 0, totalSize: 0, totalTime: 0 });
      }

      const stats = resourceTypes.get(type)!;
      stats.count++;
      stats.totalSize += size;
      stats.totalTime += time;
    });

    resourceTypes.forEach((stats, type) => {
      this.recordMetric(`resource-${type}-count`, stats.count);
      this.recordMetric(`resource-${type}-size`, stats.totalSize);
      this.recordMetric(`resource-${type}-time`, stats.totalTime / stats.count);
    });
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    if (url.includes('firebase')) return 'firebase';
    return 'other';
  }

  public recordMetric(name: string, value: number, metadata?: Record<string, any>) {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`📊 Performance Metric: ${name} = ${value}ms`, metadata);
    }

    // Send to Firebase Analytics
    if (this.analytics) {
      logEvent(this.analytics, 'performance_metric', {
        metric_name: name,
        metric_value: value,
        ...metadata
      });
    }
  }

  public startTrace(name: string) {
    if (!this.isEnabled || !this.performance) return null;

    try {
      const traceInstance = trace(this.performance, name);
      traceInstance.start();
      return traceInstance;
    } catch (error) {
      console.warn('Failed to start trace:', error);
      return null;
    }
  }

  public stopTrace(traceInstance: any) {
    if (!this.isEnabled || !traceInstance) return;

    try {
      traceInstance.stop();
    } catch (error) {
      console.warn('Failed to stop trace:', error);
    }
  }

  public async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    const traceInstance = this.startTrace(name);

    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration);
      return result;
    } finally {
      this.stopTrace(traceInstance);
    }
  }

  public measure<T>(name: string, fn: () => T): T {
    const startTime = performance.now();
    const traceInstance = this.startTrace(name);

    try {
      const result = fn();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration);
      return result;
    } finally {
      this.stopTrace(traceInstance);
    }
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public clearMetrics() {
    this.metrics = [];
  }

  public generateReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      environment: import.meta.env.VITE_APP_ENVIRONMENT,
      totalMetrics: this.metrics.length,
      metrics: this.metrics.reduce((acc, metric) => {
        if (!acc[metric.name]) {
          acc[metric.name] = {
            count: 0,
            total: 0,
            min: Infinity,
            max: -Infinity,
            avg: 0
          };
        }
        
        const stats = acc[metric.name];
        stats.count++;
        stats.total += metric.value;
        stats.min = Math.min(stats.min, metric.value);
        stats.max = Math.max(stats.max, metric.value);
        stats.avg = stats.total / stats.count;
        
        return acc;
      }, {} as Record<string, any>)
    };

    return JSON.stringify(report, null, 2);
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export types
export type { PerformanceMetric, VitalMetric };