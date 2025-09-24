/**
 * Device Testing and Optimization Utilities
 * Comprehensive device capability testing and performance optimization
 */

interface DeviceTestResults {
  overall: 'excellent' | 'good' | 'fair' | 'poor'
  scores: {
    cpu: number
    gpu: number
    memory: number
    network: number
    battery: number
  }
  capabilities: {
    webgl2: boolean
    webgpu: boolean
    serviceWorker: boolean
    intersectionObserver: boolean
    performanceObserver: boolean
    webAssembly: boolean
    offscreenCanvas: boolean
    sharedArrayBuffer: boolean
  }
  recommendations: string[]
  optimizations: {
    animationQuality: 'ultra' | 'high' | 'medium' | 'low'
    particleCount: number
    effectsEnabled: boolean
    frameRate: number
  }
}

interface PerformanceBenchmark {
  name: string
  duration: number
  score: number
  passed: boolean
}

export class DeviceTester {
  private canvas: HTMLCanvasElement
  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null

  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = 256
    this.canvas.height = 256
  }

  async runComprehensiveTest(): Promise<DeviceTestResults> {
    console.log('🔬 Running comprehensive device tests...')
    
    const [
      cpuScore,
      gpuScore,
      memoryScore,
      networkScore,
      batteryScore,
      capabilities,
      benchmarks
    ] = await Promise.all([
      this.testCPUPerformance(),
      this.testGPUPerformance(),
      this.testMemoryCapabilities(),
      this.testNetworkCapabilities(),
      this.testBatteryStatus(),
      this.testWebCapabilities(),
      this.runPerformanceBenchmarks()
    ])

    const scores = {
      cpu: cpuScore,
      gpu: gpuScore,
      memory: memoryScore,
      network: networkScore,
      battery: batteryScore
    }

    const overallScore = (cpuScore + gpuScore + memoryScore + networkScore + batteryScore) / 5
    const overall = this.categorizeOverallPerformance(overallScore)

    const recommendations = this.generateRecommendations(scores, capabilities, benchmarks)
    const optimizations = this.generateOptimizations(scores, capabilities)

    const results: DeviceTestResults = {
      overall,
      scores,
      capabilities,
      recommendations,
      optimizations
    }

    console.log('✅ Device testing completed:', results)
    return results
  }

  private async testCPUPerformance(): Promise<number> {
    console.log('⚡ Testing CPU performance...')
    
    const startTime = performance.now()
    
    // CPU-intensive calculation
    let result = 0
    const iterations = 1000000
    
    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i) * Math.sin(i) * Math.cos(i)
    }
    
    const duration = performance.now() - startTime
    
    // Score based on execution time (lower is better)
    // Good performance: < 50ms = 100 points
    // Poor performance: > 500ms = 0 points
    const score = Math.max(0, Math.min(100, 100 - (duration - 50) * 0.2))
    
    console.log(`CPU Test: ${duration.toFixed(2)}ms (Score: ${score.toFixed(0)})`)
    return score
  }

  private async testGPUPerformance(): Promise<number> {
    console.log('🎮 Testing GPU performance...')
    
    try {
      this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl')
      
      if (!this.gl) {
        console.warn('WebGL not supported')
        return 0
      }

      const startTime = performance.now()
      
      // Create and compile shaders
      const vertexShader = this.createShader(this.gl.VERTEX_SHADER, `
        attribute vec2 position;
        void main() {
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `)
      
      const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, `
        precision mediump float;
        uniform float time;
        void main() {
          vec2 uv = gl_FragCoord.xy / vec2(256.0, 256.0);
          float r = sin(uv.x * 10.0 + time) * 0.5 + 0.5;
          float g = sin(uv.y * 10.0 + time * 1.1) * 0.5 + 0.5;
          float b = sin((uv.x + uv.y) * 5.0 + time * 1.2) * 0.5 + 0.5;
          gl_FragColor = vec4(r, g, b, 1.0);
        }
      `)

      if (!vertexShader || !fragmentShader) {
        return 20 // Basic WebGL support but shader compilation failed
      }

      const program = this.gl.createProgram()!
      this.gl.attachShader(program, vertexShader)
      this.gl.attachShader(program, fragmentShader)
      this.gl.linkProgram(program)

      if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
        return 30 // Shader linking failed
      }

      // Render multiple frames to test performance
      const frameCount = 60
      for (let i = 0; i < frameCount; i++) {
        this.gl.useProgram(program)
        this.gl.uniform1f(this.gl.getUniformLocation(program, 'time'), i * 0.016)
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3)
      }

      const duration = performance.now() - startTime
      
      // Score based on rendering time
      // Good GPU: < 16ms for 60 frames = 100 points
      // Poor GPU: > 100ms for 60 frames = 0 points
      const score = Math.max(0, Math.min(100, 100 - (duration - 16) * 1.2))
      
      console.log(`GPU Test: ${duration.toFixed(2)}ms for ${frameCount} frames (Score: ${score.toFixed(0)})`)
      return score

    } catch (error) {
      console.warn('GPU test failed:', error)
      return 10 // WebGL available but testing failed
    }
  }

  private createShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null
    
    const shader = this.gl.createShader(type)!
    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.warn('Shader compilation error:', this.gl.getShaderInfoLog(shader))
      this.gl.deleteShader(shader)
      return null
    }
    
    return shader
  }

  private async testMemoryCapabilities(): Promise<number> {
    console.log('🧠 Testing memory capabilities...')
    
    let score = 50 // Base score
    
    // Test available memory
    if ('memory' in performance) {
      const memInfo = (performance as any).memory
      const totalMemory = memInfo.jsHeapSizeLimit / (1024 * 1024) // MB
      
      if (totalMemory > 4096) score += 30 // > 4GB
      else if (totalMemory > 2048) score += 20 // > 2GB
      else if (totalMemory > 1024) score += 10 // > 1GB
      else score -= 20 // < 1GB
      
      console.log(`Available memory: ${totalMemory.toFixed(0)}MB`)
    }
    
    // Test memory allocation performance
    try {
      const startTime = performance.now()
      const largeArray = new Array(1000000).fill(0).map((_, i) => ({ id: i, value: Math.random() }))
      const duration = performance.now() - startTime
      
      if (duration < 100) score += 20
      else if (duration < 200) score += 10
      else score -= 10
      
      // Cleanup
      largeArray.length = 0
      
    } catch (error) {
      score -= 30 // Memory allocation failed
    }
    
    return Math.max(0, Math.min(100, score))
  }

  private async testNetworkCapabilities(): Promise<number> {
    console.log('🌐 Testing network capabilities...')
    
    let score = 50 // Base score
    
    // Test connection info
    if ('connection' in navigator) {
      const conn = (navigator as any).connection
      
      switch (conn.effectiveType) {
        case '4g':
          score += 30
          break
        case '3g':
          score += 10
          break
        case '2g':
          score -= 20
          break
        case 'slow-2g':
          score -= 40
          break
      }
      
      if (conn.saveData) {
        score -= 10 // User has data saver enabled
      }
      
      console.log(`Connection: ${conn.effectiveType}, Save Data: ${conn.saveData}`)
    }
    
    // Test actual network speed with a small request
    try {
      const startTime = performance.now()
      await fetch('/manifest.json', { cache: 'no-cache' })
      const duration = performance.now() - startTime
      
      if (duration < 100) score += 20
      else if (duration < 300) score += 10
      else if (duration > 1000) score -= 20
      
    } catch (error) {
      score -= 30 // Network request failed
    }
    
    return Math.max(0, Math.min(100, score))
  }

  private async testBatteryStatus(): Promise<number> {
    console.log('🔋 Testing battery status...')
    
    let score = 75 // Default score (assume good battery)
    
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery()
        
        if (battery.level < 0.2) {
          score = 20 // Critical battery
        } else if (battery.level < 0.5) {
          score = 50 // Low battery
        } else if (battery.level > 0.8) {
          score = 100 // Good battery
        }
        
        if (!battery.charging && battery.level < 0.5) {
          score -= 20 // Not charging and low battery
        }
        
        console.log(`Battery: ${(battery.level * 100).toFixed(0)}%, Charging: ${battery.charging}`)
        
      } catch (error) {
        console.warn('Battery API not supported:', error)
      }
    }
    
    return score
  }

  private async testWebCapabilities(): Promise<DeviceTestResults['capabilities']> {
    console.log('🔧 Testing web capabilities...')
    
    const capabilities = {
      webgl2: false,
      webgpu: false,
      serviceWorker: false,
      intersectionObserver: false,
      performanceObserver: false,
      webAssembly: false,
      offscreenCanvas: false,
      sharedArrayBuffer: false
    }
    
    // Test WebGL2
    try {
      const canvas = document.createElement('canvas')
      capabilities.webgl2 = !!canvas.getContext('webgl2')
    } catch (error) {
      // WebGL2 not supported
    }
    
    // Test WebGPU
    capabilities.webgpu = 'gpu' in navigator
    
    // Test Service Worker
    capabilities.serviceWorker = 'serviceWorker' in navigator
    
    // Test Intersection Observer
    capabilities.intersectionObserver = 'IntersectionObserver' in window
    
    // Test Performance Observer
    capabilities.performanceObserver = 'PerformanceObserver' in window
    
    // Test WebAssembly
    capabilities.webAssembly = 'WebAssembly' in window
    
    // Test OffscreenCanvas
    capabilities.offscreenCanvas = 'OffscreenCanvas' in window
    
    // Test SharedArrayBuffer
    capabilities.sharedArrayBuffer = 'SharedArrayBuffer' in window
    
    console.log('Web capabilities:', capabilities)
    return capabilities
  }

  private async runPerformanceBenchmarks(): Promise<PerformanceBenchmark[]> {
    console.log('📊 Running performance benchmarks...')
    
    const benchmarks: PerformanceBenchmark[] = []
    
    // DOM manipulation benchmark
    const domBenchmark = await this.benchmarkDOMManipulation()
    benchmarks.push(domBenchmark)
    
    // Animation benchmark
    const animationBenchmark = await this.benchmarkAnimationPerformance()
    benchmarks.push(animationBenchmark)
    
    // Canvas rendering benchmark
    const canvasBenchmark = await this.benchmarkCanvasRendering()
    benchmarks.push(canvasBenchmark)
    
    return benchmarks
  }

  private async benchmarkDOMManipulation(): Promise<PerformanceBenchmark> {
    const startTime = performance.now()
    
    // Create and manipulate DOM elements
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    document.body.appendChild(container)
    
    for (let i = 0; i < 1000; i++) {
      const element = document.createElement('div')
      element.textContent = `Element ${i}`
      element.style.transform = `translateX(${i}px)`
      container.appendChild(element)
    }
    
    // Force layout
    container.offsetHeight
    
    // Cleanup
    document.body.removeChild(container)
    
    const duration = performance.now() - startTime
    const score = Math.max(0, 100 - duration * 0.1)
    
    return {
      name: 'DOM Manipulation',
      duration,
      score,
      passed: duration < 100
    }
  }

  private async benchmarkAnimationPerformance(): Promise<PerformanceBenchmark> {
    const startTime = performance.now()
    
    // Create animated element
    const element = document.createElement('div')
    element.style.position = 'absolute'
    element.style.left = '-9999px'
    element.style.width = '100px'
    element.style.height = '100px'
    element.style.background = 'red'
    element.style.transition = 'transform 0.1s'
    document.body.appendChild(element)
    
    // Perform multiple animations
    for (let i = 0; i < 50; i++) {
      element.style.transform = `translateX(${i * 10}px) rotate(${i * 10}deg)`
      await new Promise(resolve => setTimeout(resolve, 2))
    }
    
    // Cleanup
    document.body.removeChild(element)
    
    const duration = performance.now() - startTime
    const score = Math.max(0, 100 - (duration - 100) * 0.1)
    
    return {
      name: 'Animation Performance',
      duration,
      score,
      passed: duration < 200
    }
  }

  private async benchmarkCanvasRendering(): Promise<PerformanceBenchmark> {
    const startTime = performance.now()
    
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 200
    const ctx = canvas.getContext('2d')!
    
    // Render complex shapes
    for (let i = 0; i < 1000; i++) {
      ctx.beginPath()
      ctx.arc(Math.random() * 200, Math.random() * 200, Math.random() * 20, 0, Math.PI * 2)
      ctx.fillStyle = `hsl(${Math.random() * 360}, 50%, 50%)`
      ctx.fill()
    }
    
    const duration = performance.now() - startTime
    const score = Math.max(0, 100 - duration * 0.2)
    
    return {
      name: 'Canvas Rendering',
      duration,
      score,
      passed: duration < 50
    }
  }

  private categorizeOverallPerformance(score: number): DeviceTestResults['overall'] {
    if (score >= 80) return 'excellent'
    if (score >= 60) return 'good'
    if (score >= 40) return 'fair'
    return 'poor'
  }

  private generateRecommendations(
    scores: DeviceTestResults['scores'],
    capabilities: DeviceTestResults['capabilities'],
    benchmarks: PerformanceBenchmark[]
  ): string[] {
    const recommendations: string[] = []
    
    if (scores.cpu < 50) {
      recommendations.push('Consider reducing animation complexity and enabling performance mode')
    }
    
    if (scores.gpu < 50) {
      recommendations.push('Disable particle effects and complex visual effects')
    }
    
    if (scores.memory < 50) {
      recommendations.push('Enable memory optimization and reduce cached resources')
    }
    
    if (scores.network < 50) {
      recommendations.push('Enable data saver mode and reduce asset quality')
    }
    
    if (scores.battery < 30) {
      recommendations.push('Enable power saving mode to extend battery life')
    }
    
    if (!capabilities.webgl2) {
      recommendations.push('WebGL2 not supported - some visual effects will be disabled')
    }
    
    if (!capabilities.intersectionObserver) {
      recommendations.push('Intersection Observer not supported - lazy loading may be less efficient')
    }
    
    const failedBenchmarks = benchmarks.filter(b => !b.passed)
    if (failedBenchmarks.length > 0) {
      recommendations.push(`Performance issues detected in: ${failedBenchmarks.map(b => b.name).join(', ')}`)
    }
    
    return recommendations
  }

  private generateOptimizations(
    scores: DeviceTestResults['scores'],
    capabilities: DeviceTestResults['capabilities']
  ): DeviceTestResults['optimizations'] {
    const avgScore = (scores.cpu + scores.gpu + scores.memory) / 3
    
    let animationQuality: DeviceTestResults['optimizations']['animationQuality'] = 'medium'
    let particleCount = 50
    let effectsEnabled = true
    let frameRate = 60
    
    if (avgScore >= 80 && capabilities.webgl2) {
      animationQuality = 'ultra'
      particleCount = 200
      effectsEnabled = true
      frameRate = 60
    } else if (avgScore >= 60) {
      animationQuality = 'high'
      particleCount = 100
      effectsEnabled = true
      frameRate = 60
    } else if (avgScore >= 40) {
      animationQuality = 'medium'
      particleCount = 50
      effectsEnabled = true
      frameRate = 45
    } else {
      animationQuality = 'low'
      particleCount = 20
      effectsEnabled = false
      frameRate = 30
    }
    
    // Battery-based adjustments
    if (scores.battery < 30) {
      animationQuality = 'low'
      particleCount = Math.min(particleCount, 20)
      effectsEnabled = false
      frameRate = Math.min(frameRate, 30)
    }
    
    return {
      animationQuality,
      particleCount,
      effectsEnabled,
      frameRate
    }
  }
}

// Singleton instance
export const deviceTester = new DeviceTester()

// Utility functions
export async function runQuickDeviceTest(): Promise<{
  isLowEndDevice: boolean
  recommendedQuality: 'ultra' | 'high' | 'medium' | 'low'
  shouldReduceAnimations: boolean
}> {
  const results = await deviceTester.runComprehensiveTest()
  
  return {
    isLowEndDevice: results.overall === 'poor',
    recommendedQuality: results.optimizations.animationQuality,
    shouldReduceAnimations: !results.optimizations.effectsEnabled
  }
}

export function getDeviceCapabilityScore(): Promise<number> {
  return deviceTester.runComprehensiveTest().then(results => {
    const { cpu, gpu, memory, network, battery } = results.scores
    return (cpu + gpu + memory + network + battery) / 5
  })
}