import { ref, computed, watch, onMounted } from 'vue'
import { useAnimations } from './useAnimations'
import { useSoundEffects } from './useSoundEffects'

interface DeviceCapabilities {
  gpu: 'high' | 'medium' | 'low'
  memory: number
  cores: number
  connection: string
  battery: number | null
  isLowEndDevice: boolean
}

interface PerformanceMetrics {
  averageFPS: number
  frameDrops: number
  isThrottling: boolean
  lastMeasurement: number
}

// Global animation settings
const globalAnimationSettings = ref({
  enableAnimations: true,
  enableSounds: true,
  enableGlitchEffects: true,
  enableParticleEffects: true,
  animationSpeed: 1.0, // Multiplier for animation durations
  glitchIntensity: 'medium' as 'low' | 'medium' | 'high',
  soundVolume: 0.3,
  respectReducedMotion: true,
  adaptiveQuality: true, // Auto-adjust based on performance
  frameRate: 60
})

// Performance settings
const performanceSettings = ref({
  enableGPUAcceleration: true,
  enableHighQualityEffects: true,
  maxParticles: 100,
  enableBlurEffects: true,
  enableShadowEffects: true,
  qualityLevel: 'high' as 'ultra' | 'high' | 'medium' | 'low',
  enableAdaptiveQuality: true
})

// Device capabilities detection
const deviceCapabilities = ref<DeviceCapabilities>({
  gpu: 'medium',
  memory: 0,
  cores: 0,
  connection: 'unknown',
  battery: null,
  isLowEndDevice: false
})

// Performance monitoring
const performanceMetrics = ref<PerformanceMetrics>({
  averageFPS: 60,
  frameDrops: 0,
  isThrottling: false,
  lastMeasurement: 0
})

export function useGlobalAnimations() {
  const { isReducedMotion } = useAnimations()
  const { setVolume, toggleSounds, isEnabled: soundsEnabled } = useSoundEffects()

  // Device capability detection
  const detectDeviceCapabilities = async (): Promise<DeviceCapabilities> => {
    const capabilities: DeviceCapabilities = {
      gpu: 'medium',
      memory: 0,
      cores: navigator.hardwareConcurrency || 4,
      connection: 'unknown',
      battery: null,
      isLowEndDevice: false
    }

    // Detect GPU capabilities
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          
          // GPU classification
          if (renderer.includes('RTX') || renderer.includes('GTX 1080') || 
              renderer.includes('RX 6') || renderer.includes('M1') || 
              renderer.includes('M2') || renderer.includes('A15') || 
              renderer.includes('A16')) {
            capabilities.gpu = 'high'
          } else if (renderer.includes('GTX') || renderer.includes('RX') || 
                     renderer.includes('Intel Iris') || renderer.includes('Adreno 6')) {
            capabilities.gpu = 'medium'
          } else {
            capabilities.gpu = 'low'
          }
        }
      }
    } catch (error) {
      console.warn('Could not detect GPU capabilities:', error)
    }

    // Detect memory
    if ('memory' in performance) {
      const memInfo = (performance as any).memory
      capabilities.memory = memInfo.jsHeapSizeLimit / (1024 * 1024) // MB
    }

    // Detect connection
    if ('connection' in navigator) {
      const conn = (navigator as any).connection
      capabilities.connection = conn.effectiveType || 'unknown'
    }

    // Detect battery
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery()
        capabilities.battery = battery.level
      } catch (error) {
        console.warn('Could not access battery API:', error)
      }
    }

    // Determine if low-end device
    capabilities.isLowEndDevice = (
      capabilities.gpu === 'low' ||
      (capabilities.memory > 0 && capabilities.memory < 2048) ||
      capabilities.cores < 4 ||
      capabilities.connection === '2g' ||
      capabilities.connection === 'slow-2g'
    )

    deviceCapabilities.value = capabilities
    return capabilities
  }

  // Performance monitoring
  let frameCount = 0
  let lastFrameTime = performance.now()
  let fpsHistory: number[] = []

  const startPerformanceMonitoring = () => {
    const measureFPS = (currentTime: number) => {
      frameCount++
      
      if (currentTime - lastFrameTime >= 1000) { // Every second
        const fps = Math.round((frameCount * 1000) / (currentTime - lastFrameTime))
        fpsHistory.push(fps)
        
        // Keep only last 10 seconds of data
        if (fpsHistory.length > 10) {
          fpsHistory = fpsHistory.slice(-10)
        }
        
        const averageFPS = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length
        const frameDrops = fpsHistory.filter(f => f < 55).length
        
        performanceMetrics.value = {
          averageFPS,
          frameDrops,
          isThrottling: averageFPS < 45,
          lastMeasurement: currentTime
        }
        
        // Adaptive quality adjustment
        if (globalAnimationSettings.value.adaptiveQuality) {
          adaptQualityBasedOnPerformance(averageFPS)
        }
        
        frameCount = 0
        lastFrameTime = currentTime
      }
      
      requestAnimationFrame(measureFPS)
    }
    
    requestAnimationFrame(measureFPS)
  }

  const adaptQualityBasedOnPerformance = (fps: number) => {
    if (fps < 30 && performanceSettings.value.qualityLevel !== 'low') {
      console.warn('🐌 Low FPS detected, reducing quality to low')
      updatePerformanceSettings({
        qualityLevel: 'low',
        enableHighQualityEffects: false,
        maxParticles: 20,
        enableBlurEffects: false,
        enableShadowEffects: false
      })
      updateAnimationSettings({
        enableGlitchEffects: false,
        enableParticleEffects: false,
        animationSpeed: 0.7,
        frameRate: 30
      })
    } else if (fps < 45 && performanceSettings.value.qualityLevel === 'high') {
      console.warn('⚠️ Moderate FPS drop, reducing quality to medium')
      updatePerformanceSettings({
        qualityLevel: 'medium',
        maxParticles: 50,
        enableBlurEffects: true,
        enableShadowEffects: false
      })
      updateAnimationSettings({
        animationSpeed: 0.85,
        frameRate: 45
      })
    } else if (fps > 55 && performanceSettings.value.qualityLevel === 'low') {
      console.log('🚀 Performance recovered, increasing quality')
      autoConfigurePerformance() // Re-detect optimal settings
    }
  }

  // Computed values that respect user preferences and device capabilities
  const effectiveAnimationSettings = computed(() => {
    const base = globalAnimationSettings.value
    
    // Respect reduced motion preference
    if (base.respectReducedMotion && isReducedMotion.value) {
      return {
        ...base,
        enableAnimations: false,
        enableGlitchEffects: false,
        enableParticleEffects: false,
        animationSpeed: 0
      }
    }

    // Adapt to device capabilities
    if (deviceCapabilities.value.isLowEndDevice) {
      return {
        ...base,
        enableGlitchEffects: false,
        enableParticleEffects: false,
        animationSpeed: Math.min(base.animationSpeed, 0.7),
        frameRate: Math.min(base.frameRate, 30)
      }
    }

    // Adapt to battery level
    if (deviceCapabilities.value.battery !== null && deviceCapabilities.value.battery < 0.2) {
      return {
        ...base,
        enableParticleEffects: false,
        animationSpeed: Math.min(base.animationSpeed, 0.8),
        frameRate: Math.min(base.frameRate, 30)
      }
    }

    return base
  })

  // Watch for changes and apply them
  watch(() => globalAnimationSettings.value.soundVolume, (newVolume) => {
    setVolume(newVolume)
  }, { immediate: true })

  watch(() => globalAnimationSettings.value.enableSounds, (enabled) => {
    if (enabled !== soundsEnabled.value) {
      toggleSounds()
    }
  }, { immediate: true })

  // Methods to update settings
  const updateAnimationSettings = (settings: Partial<typeof globalAnimationSettings.value>) => {
    Object.assign(globalAnimationSettings.value, settings)
  }

  const updatePerformanceSettings = (settings: Partial<typeof performanceSettings.value>) => {
    Object.assign(performanceSettings.value, settings)
  }

  // Preset configurations
  const applyPreset = (preset: 'minimal' | 'balanced' | 'maximum' | 'performance') => {
    switch (preset) {
      case 'minimal':
        updateAnimationSettings({
          enableAnimations: true,
          enableSounds: false,
          enableGlitchEffects: false,
          enableParticleEffects: false,
          animationSpeed: 0.5,
          glitchIntensity: 'low'
        })
        updatePerformanceSettings({
          enableGPUAcceleration: true,
          enableHighQualityEffects: false,
          maxParticles: 20,
          enableBlurEffects: false,
          enableShadowEffects: false
        })
        break

      case 'balanced':
        updateAnimationSettings({
          enableAnimations: true,
          enableSounds: true,
          enableGlitchEffects: true,
          enableParticleEffects: true,
          animationSpeed: 1.0,
          glitchIntensity: 'medium',
          soundVolume: 0.3
        })
        updatePerformanceSettings({
          enableGPUAcceleration: true,
          enableHighQualityEffects: true,
          maxParticles: 50,
          enableBlurEffects: true,
          enableShadowEffects: true
        })
        break

      case 'maximum':
        updateAnimationSettings({
          enableAnimations: true,
          enableSounds: true,
          enableGlitchEffects: true,
          enableParticleEffects: true,
          animationSpeed: 1.2,
          glitchIntensity: 'high',
          soundVolume: 0.5
        })
        updatePerformanceSettings({
          enableGPUAcceleration: true,
          enableHighQualityEffects: true,
          maxParticles: 100,
          enableBlurEffects: true,
          enableShadowEffects: true
        })
        break

      case 'performance':
        updateAnimationSettings({
          enableAnimations: true,
          enableSounds: false,
          enableGlitchEffects: false,
          enableParticleEffects: false,
          animationSpeed: 0.8,
          glitchIntensity: 'low'
        })
        updatePerformanceSettings({
          enableGPUAcceleration: true,
          enableHighQualityEffects: false,
          maxParticles: 10,
          enableBlurEffects: false,
          enableShadowEffects: false
        })
        break
    }
  }

  // Auto-detect performance and apply appropriate preset
  const autoConfigurePerformance = async () => {
    const capabilities = await detectDeviceCapabilities()
    
    console.log('🎨 Auto-configuring performance based on device capabilities:', capabilities)
    
    if (capabilities.isLowEndDevice) {
      applyPreset('performance')
    } else if (capabilities.gpu === 'high' && capabilities.memory > 4096 && capabilities.cores >= 8) {
      applyPreset('maximum')
    } else if (capabilities.gpu === 'medium' || capabilities.memory > 2048) {
      applyPreset('balanced')
    } else {
      applyPreset('minimal')
    }
    
    // Additional battery-based adjustments
    if (capabilities.battery !== null && capabilities.battery < 0.3) {
      console.log('🔋 Low battery detected, applying power-saving optimizations')
      updateAnimationSettings({
        enableParticleEffects: false,
        animationSpeed: 0.8,
        frameRate: 30
      })
      updatePerformanceSettings({
        maxParticles: 20,
        enableBlurEffects: false
      })
    }
  }

  // Save/load settings from localStorage
  const saveSettings = () => {
    try {
      localStorage.setItem('blacklist-animation-settings', JSON.stringify({
        animation: globalAnimationSettings.value,
        performance: performanceSettings.value
      }))
    } catch (error) {
      console.warn('Failed to save animation settings:', error)
    }
  }

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('blacklist-animation-settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.animation) {
          Object.assign(globalAnimationSettings.value, parsed.animation)
        }
        if (parsed.performance) {
          Object.assign(performanceSettings.value, parsed.performance)
        }
      }
    } catch (error) {
      console.warn('Failed to load animation settings:', error)
      // Apply default balanced preset
      applyPreset('balanced')
    }
  }

  // CSS custom properties for dynamic theming
  const updateCSSProperties = () => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    const settings = effectiveAnimationSettings.value

    // Animation speed
    root.style.setProperty('--animation-speed-multiplier', settings.animationSpeed.toString())
    
    // Enable/disable effects
    root.style.setProperty('--enable-blur-effects', performanceSettings.value.enableBlurEffects ? '1' : '0')
    root.style.setProperty('--enable-shadow-effects', performanceSettings.value.enableShadowEffects ? '1' : '0')
    root.style.setProperty('--max-particles', performanceSettings.value.maxParticles.toString())
    
    // GPU acceleration
    if (performanceSettings.value.enableGPUAcceleration) {
      root.style.setProperty('--gpu-acceleration', 'translateZ(0)')
    } else {
      root.style.setProperty('--gpu-acceleration', 'none')
    }
  }

  // Watch for changes and update CSS
  watch([effectiveAnimationSettings, performanceSettings], updateCSSProperties, { 
    deep: true, 
    immediate: true 
  })

  // Auto-save settings when they change
  watch([globalAnimationSettings, performanceSettings], saveSettings, { 
    deep: true 
  })

  // Initialize on mount
  onMounted(async () => {
    loadSettings()
    await autoConfigurePerformance()
    startPerformanceMonitoring()
    
    // Listen for battery changes
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery()
        const handleBatteryChange = () => {
          deviceCapabilities.value.battery = battery.level
          if (battery.level < 0.2 && !performanceMetrics.value.isThrottling) {
            console.log('🔋 Critical battery level, enabling power saving mode')
            updateAnimationSettings({
              enableParticleEffects: false,
              enableGlitchEffects: false,
              animationSpeed: 0.5,
              frameRate: 15
            })
          }
        }
        
        battery.addEventListener('levelchange', handleBatteryChange)
        battery.addEventListener('chargingchange', handleBatteryChange)
      } catch (error) {
        console.warn('Battery API not supported:', error)
      }
    }
  })

  return {
    // Settings
    globalAnimationSettings,
    performanceSettings,
    effectiveAnimationSettings,
    deviceCapabilities,
    performanceMetrics,
    
    // Methods
    updateAnimationSettings,
    updatePerformanceSettings,
    applyPreset,
    autoConfigurePerformance,
    detectDeviceCapabilities,
    saveSettings,
    loadSettings,
    updateCSSProperties,
    
    // Computed values
    isReducedMotion,
    animationsEnabled: computed(() => effectiveAnimationSettings.value.enableAnimations),
    soundsEnabled: computed(() => effectiveAnimationSettings.value.enableSounds),
    glitchEffectsEnabled: computed(() => effectiveAnimationSettings.value.enableGlitchEffects),
    particleEffectsEnabled: computed(() => effectiveAnimationSettings.value.enableParticleEffects),
    isLowEndDevice: computed(() => deviceCapabilities.value.isLowEndDevice),
    currentFPS: computed(() => performanceMetrics.value.averageFPS),
    isPerformanceThrottling: computed(() => performanceMetrics.value.isThrottling)
  }
}