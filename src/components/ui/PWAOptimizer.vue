<template>
  <div class="pwa-optimizer" v-if="showOptimizer">
    <div class="optimizer-panel">
      <div class="panel-header">
        <h3>⚡ Performance Optimizer</h3>
        <button @click="closeOptimizer" class="close-btn">×</button>
      </div>
      
      <div class="panel-content">
        <!-- Device Info -->
        <div class="section">
          <h4>📱 Device Information</h4>
          <div class="device-info">
            <div class="info-item">
              <span class="label">Performance:</span>
              <span class="value" :class="performanceClass">{{ deviceInfo.overall }}</span>
            </div>
            <div class="info-item">
              <span class="label">GPU:</span>
              <span class="value">{{ deviceInfo.gpu }}</span>
            </div>
            <div class="info-item">
              <span class="label">Memory:</span>
              <span class="value">{{ deviceInfo.memory }}MB</span>
            </div>
            <div class="info-item">
              <span class="label">Connection:</span>
              <span class="value">{{ deviceInfo.connection }}</span>
            </div>
            <div class="info-item" v-if="deviceInfo.battery !== null">
              <span class="label">Battery:</span>
              <span class="value" :class="batteryClass">{{ Math.round(deviceInfo.battery * 100) }}%</span>
            </div>
          </div>
        </div>

        <!-- Performance Metrics -->
        <div class="section">
          <h4>📊 Performance Metrics</h4>
          <div class="metrics">
            <div class="metric">
              <div class="metric-label">FPS</div>
              <div class="metric-value" :class="fpsClass">{{ Math.round(performanceMetrics.averageFPS) }}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Frame Drops</div>
              <div class="metric-value" :class="frameDropsClass">{{ performanceMetrics.frameDrops }}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Status</div>
              <div class="metric-value" :class="statusClass">
                {{ performanceMetrics.isThrottling ? 'Throttling' : 'Normal' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Settings -->
        <div class="section">
          <h4>⚙️ Quick Settings</h4>
          <div class="settings">
            <div class="setting-item">
              <label>
                <input 
                  type="checkbox" 
                  v-model="localSettings.enableAnimations"
                  @change="updateSettings"
                >
                <span>Enable Animations</span>
              </label>
            </div>
            <div class="setting-item">
              <label>
                <input 
                  type="checkbox" 
                  v-model="localSettings.enableParticles"
                  @change="updateSettings"
                >
                <span>Particle Effects</span>
              </label>
            </div>
            <div class="setting-item">
              <label>
                <input 
                  type="checkbox" 
                  v-model="localSettings.enableGlitch"
                  @change="updateSettings"
                >
                <span>Glitch Effects</span>
              </label>
            </div>
            <div class="setting-item">
              <label>
                <input 
                  type="checkbox" 
                  v-model="localSettings.enableSounds"
                  @change="updateSettings"
                >
                <span>Sound Effects</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Quality Presets -->
        <div class="section">
          <h4>🎨 Quality Presets</h4>
          <div class="presets">
            <button 
              v-for="preset in presets" 
              :key="preset.name"
              @click="applyPreset(preset.name)"
              :class="['preset-btn', { active: currentPreset === preset.name }]"
            >
              {{ preset.icon }} {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- Recommendations -->
        <div class="section" v-if="recommendations.length > 0">
          <h4>💡 Recommendations</h4>
          <div class="recommendations">
            <div 
              v-for="(rec, index) in recommendations" 
              :key="index"
              class="recommendation"
            >
              <span class="rec-icon">💡</span>
              <span class="rec-text">{{ rec }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="section">
          <div class="actions">
            <button @click="runOptimization" class="action-btn primary">
              🚀 Auto-Optimize
            </button>
            <button @click="resetToDefaults" class="action-btn secondary">
              🔄 Reset Defaults
            </button>
            <button @click="runBenchmark" class="action-btn secondary" :disabled="benchmarkRunning">
              {{ benchmarkRunning ? '⏳ Testing...' : '🔬 Run Benchmark' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useGlobalAnimations } from '@/composables/useGlobalAnimations'
import { deviceTester, type DeviceTestResults } from '@/utils/deviceTesting'
import { analytics } from '@/services/analytics'

// Props
interface Props {
  autoShow?: boolean
  showTrigger?: 'performance' | 'manual' | 'startup'
}

const props = withDefaults(defineProps<Props>(), {
  autoShow: false,
  showTrigger: 'manual'
})

// Composables
const {
  globalAnimationSettings,
  performanceSettings,
  deviceCapabilities,
  performanceMetrics,
  updateAnimationSettings,
  updatePerformanceSettings,
  applyPreset: applyGlobalPreset,
  autoConfigurePerformance
} = useGlobalAnimations()

// State
const showOptimizer = ref(false)
const benchmarkRunning = ref(false)
const testResults = ref<DeviceTestResults | null>(null)
const currentPreset = ref('balanced')

// Local settings for immediate UI feedback
const localSettings = ref({
  enableAnimations: true,
  enableParticles: true,
  enableGlitch: true,
  enableSounds: true
})

// Presets configuration
const presets = [
  { name: 'minimal', label: 'Minimal', icon: '🔋' },
  { name: 'balanced', label: 'Balanced', icon: '⚖️' },
  { name: 'maximum', label: 'Maximum', icon: '🚀' },
  { name: 'performance', label: 'Performance', icon: '⚡' }
]

// Computed properties
const deviceInfo = computed(() => ({
  overall: testResults.value?.overall || 'unknown',
  gpu: deviceCapabilities.value.gpu || 'unknown',
  memory: Math.round(deviceCapabilities.value.memory) || 0,
  connection: deviceCapabilities.value.connection || 'unknown',
  battery: deviceCapabilities.value.battery
}))

const recommendations = computed(() => testResults.value?.recommendations || [])

const performanceClass = computed(() => {
  switch (deviceInfo.value.overall) {
    case 'excellent': return 'excellent'
    case 'good': return 'good'
    case 'fair': return 'fair'
    case 'poor': return 'poor'
    default: return 'unknown'
  }
})

const batteryClass = computed(() => {
  const battery = deviceInfo.value.battery
  if (battery === null) return 'unknown'
  if (battery < 0.2) return 'critical'
  if (battery < 0.5) return 'low'
  return 'good'
})

const fpsClass = computed(() => {
  const fps = performanceMetrics.value.averageFPS
  if (fps >= 55) return 'excellent'
  if (fps >= 45) return 'good'
  if (fps >= 30) return 'fair'
  return 'poor'
})

const frameDropsClass = computed(() => {
  const drops = performanceMetrics.value.frameDrops
  if (drops === 0) return 'excellent'
  if (drops <= 2) return 'good'
  if (drops <= 5) return 'fair'
  return 'poor'
})

const statusClass = computed(() => {
  return performanceMetrics.value.isThrottling ? 'poor' : 'excellent'
})

// Methods
const openOptimizer = () => {
  showOptimizer.value = true
  analytics.trackUserAction('open_performance_optimizer', 'ui')
}

const closeOptimizer = () => {
  showOptimizer.value = false
  analytics.trackUserAction('close_performance_optimizer', 'ui')
}

const updateSettings = () => {
  updateAnimationSettings({
    enableAnimations: localSettings.value.enableAnimations,
    enableParticleEffects: localSettings.value.enableParticles,
    enableGlitchEffects: localSettings.value.enableGlitch,
    enableSounds: localSettings.value.enableSounds
  })
  
  analytics.trackUserAction('update_performance_settings', 'optimization', undefined, 1)
}

const applyPreset = (presetName: string) => {
  currentPreset.value = presetName
  applyGlobalPreset(presetName as any)
  
  // Update local settings to reflect the preset
  syncLocalSettings()
  
  analytics.trackUserAction('apply_performance_preset', 'optimization', presetName)
}

const syncLocalSettings = () => {
  localSettings.value = {
    enableAnimations: globalAnimationSettings.value.enableAnimations,
    enableParticles: globalAnimationSettings.value.enableParticleEffects,
    enableGlitch: globalAnimationSettings.value.enableGlitchEffects,
    enableSounds: globalAnimationSettings.value.enableSounds
  }
}

const runOptimization = async () => {
  analytics.trackUserAction('run_auto_optimization', 'optimization')
  
  try {
    await autoConfigurePerformance()
    syncLocalSettings()
    
    // Show success feedback
    console.log('✅ Auto-optimization completed')
  } catch (error) {
    console.error('❌ Auto-optimization failed:', error)
  }
}

const resetToDefaults = () => {
  applyPreset('balanced')
  analytics.trackUserAction('reset_performance_defaults', 'optimization')
}

const runBenchmark = async () => {
  if (benchmarkRunning.value) return
  
  benchmarkRunning.value = true
  analytics.trackUserAction('run_performance_benchmark', 'optimization')
  
  try {
    const results = await deviceTester.runComprehensiveTest()
    testResults.value = results
    
    // Auto-apply optimizations based on results
    if (results.overall === 'poor') {
      applyPreset('performance')
    } else if (results.overall === 'fair') {
      applyPreset('minimal')
    } else if (results.overall === 'excellent') {
      applyPreset('maximum')
    }
    
    console.log('🔬 Benchmark completed:', results)
  } catch (error) {
    console.error('❌ Benchmark failed:', error)
  } finally {
    benchmarkRunning.value = false
  }
}

// Auto-show logic
const checkAutoShow = () => {
  if (!props.autoShow) return
  
  switch (props.showTrigger) {
    case 'performance':
      if (performanceMetrics.value.averageFPS < 30) {
        openOptimizer()
      }
      break
    case 'startup':
      if (deviceCapabilities.value.isLowEndDevice) {
        openOptimizer()
      }
      break
  }
}

// Lifecycle
onMounted(async () => {
  syncLocalSettings()
  
  // Run initial benchmark if auto-show is enabled
  if (props.autoShow) {
    await runBenchmark()
    checkAutoShow()
  }
})

// Watch for performance changes
watch(() => performanceMetrics.value.averageFPS, (newFPS) => {
  if (props.showTrigger === 'performance' && newFPS < 30 && !showOptimizer.value) {
    openOptimizer()
  }
})

// Expose methods for parent components
defineExpose({
  openOptimizer,
  closeOptimizer,
  runBenchmark
})
</script>

<style scoped>
.pwa-optimizer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.optimizer-panel {
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  border: 1px solid #800020;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(128, 0, 32, 0.3);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #333;
}

.panel-header h3 {
  color: #00ffff;
  margin: 0;
  font-size: 1.2em;
}

.close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 1.5em;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #333;
  color: #fff;
}

.panel-content {
  padding: 20px;
}

.section {
  margin-bottom: 24px;
}

.section h4 {
  color: #800020;
  margin: 0 0 12px 0;
  font-size: 1em;
  font-weight: 600;
}

.device-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #2a2a2a;
  border-radius: 6px;
  font-size: 0.9em;
}

.label {
  color: #ccc;
}

.value {
  font-weight: 600;
}

.value.excellent { color: #00ff88; }
.value.good { color: #00ffff; }
.value.fair { color: #ffaa00; }
.value.poor { color: #ff3366; }
.value.critical { color: #ff0000; }
.value.low { color: #ffaa00; }
.value.unknown { color: #888; }

.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.metric {
  text-align: center;
  padding: 16px;
  background: #2a2a2a;
  border-radius: 8px;
}

.metric-label {
  color: #ccc;
  font-size: 0.8em;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 1.2em;
  font-weight: bold;
}

.settings {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.setting-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.setting-item label:hover {
  background: #333;
}

.setting-item input[type="checkbox"] {
  accent-color: #800020;
}

.presets {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.preset-btn {
  padding: 12px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  color: #eaeaea;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9em;
}

.preset-btn:hover {
  background: #333;
  border-color: #800020;
}

.preset-btn.active {
  background: #800020;
  border-color: #800020;
  color: #fff;
}

.recommendations {
  max-height: 120px;
  overflow-y: auto;
}

.recommendation {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  background: #2a2a2a;
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 0.9em;
}

.rec-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.rec-text {
  color: #ccc;
  line-height: 1.4;
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  min-width: 120px;
  padding: 12px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  font-size: 0.9em;
}

.action-btn.primary {
  background: linear-gradient(135deg, #800020 0%, #a00030 100%);
  color: #fff;
}

.action-btn.primary:hover {
  background: linear-gradient(135deg, #a00030 0%, #c00040 100%);
  transform: translateY(-1px);
}

.action-btn.secondary {
  background: #333;
  color: #eaeaea;
  border: 1px solid #555;
}

.action-btn.secondary:hover {
  background: #444;
  border-color: #666;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn:disabled:hover {
  transform: none;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .pwa-optimizer {
    padding: 10px;
  }
  
  .optimizer-panel {
    max-height: 95vh;
  }
  
  .device-info {
    grid-template-columns: 1fr;
  }
  
  .metrics {
    grid-template-columns: 1fr;
  }
  
  .settings {
    grid-template-columns: 1fr;
  }
  
  .presets {
    grid-template-columns: 1fr;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>