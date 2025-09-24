<template>
  <div class="animation-settings">
    <div class="p-6 bg-bg-secondary rounded-lg border border-text-muted/30">
      <h3 class="font-orbitron font-bold text-xl mb-6 text-accent-cyan">Animation Settings</h3>
      
      <!-- Quick Presets -->
      <div class="mb-8">
        <h4 class="font-semibold mb-4">Quick Presets</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NeonButton
            v-for="preset in presets"
            :key="preset.id"
            :variant="currentPreset === preset.id ? 'accent' : 'ghost'"
            size="sm"
            @click="applyPreset(preset.id)"
          >
            {{ preset.label }}
          </NeonButton>
        </div>
      </div>

      <!-- Animation Settings -->
      <div class="mb-8">
        <h4 class="font-semibold mb-4">Animation Controls</h4>
        <div class="space-y-4">
          <!-- Enable Animations -->
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Enable Animations</label>
            <ToggleSwitch
              :model-value="globalAnimationSettings.enableAnimations"
              @update:model-value="updateSetting('enableAnimations', $event)"
            />
          </div>

          <!-- Animation Speed -->
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Animation Speed</label>
            <div class="flex items-center gap-3">
              <span class="text-xs text-text-muted">Slow</span>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                :value="globalAnimationSettings.animationSpeed"
                @input="updateSetting('animationSpeed', parseFloat(($event.target as HTMLInputElement).value))"
                class="flex-1 max-w-24"
              />
              <span class="text-xs text-text-muted">Fast</span>
              <span class="text-xs font-mono w-8">{{ globalAnimationSettings.animationSpeed.toFixed(1) }}x</span>
            </div>
          </div>

          <!-- Enable Glitch Effects -->
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Glitch Effects</label>
            <ToggleSwitch
              :model-value="globalAnimationSettings.enableGlitchEffects"
              @update:model-value="updateSetting('enableGlitchEffects', $event)"
            />
          </div>

          <!-- Glitch Intensity -->
          <div v-if="globalAnimationSettings.enableGlitchEffects" class="flex items-center justify-between">
            <label class="text-sm font-medium">Glitch Intensity</label>
            <select
              :value="globalAnimationSettings.glitchIntensity"
              @change="updateSetting('glitchIntensity', ($event.target as HTMLSelectElement).value)"
              class="bg-bg-tertiary border border-text-muted/30 rounded px-3 py-1 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <!-- Enable Particle Effects -->
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Particle Effects</label>
            <ToggleSwitch
              :model-value="globalAnimationSettings.enableParticleEffects"
              @update:model-value="updateSetting('enableParticleEffects', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Sound Settings -->
      <div class="mb-8">
        <h4 class="font-semibold mb-4">Sound Effects</h4>
        <div class="space-y-4">
          <!-- Enable Sounds -->
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Enable Sounds</label>
            <ToggleSwitch
              :model-value="globalAnimationSettings.enableSounds"
              @update:model-value="updateSetting('enableSounds', $event)"
            />
          </div>

          <!-- Sound Volume -->
          <div v-if="globalAnimationSettings.enableSounds" class="flex items-center justify-between">
            <label class="text-sm font-medium">Volume</label>
            <div class="flex items-center gap-3">
              <span class="text-xs text-text-muted">🔇</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                :value="globalAnimationSettings.soundVolume"
                @input="updateSetting('soundVolume', parseFloat(($event.target as HTMLInputElement).value))"
                class="flex-1 max-w-24"
              />
              <span class="text-xs text-text-muted">🔊</span>
              <span class="text-xs font-mono w-8">{{ Math.round(globalAnimationSettings.soundVolume * 100) }}%</span>
            </div>
          </div>

          <!-- Test Sound -->
          <div v-if="globalAnimationSettings.enableSounds" class="flex items-center justify-between">
            <label class="text-sm font-medium">Test Sound</label>
            <NeonButton variant="ghost" size="sm" @click="playTestSound">
              Play Test
            </NeonButton>
          </div>
        </div>
      </div>

      <!-- Performance Settings -->
      <div class="mb-8">
        <h4 class="font-semibold mb-4">Performance</h4>
        <div class="space-y-4">
          <!-- GPU Acceleration -->
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">GPU Acceleration</label>
            <ToggleSwitch
              :model-value="performanceSettings.enableGPUAcceleration"
              @update:model-value="updatePerformanceSetting('enableGPUAcceleration', $event)"
            />
          </div>

          <!-- High Quality Effects -->
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">High Quality Effects</label>
            <ToggleSwitch
              :model-value="performanceSettings.enableHighQualityEffects"
              @update:model-value="updatePerformanceSetting('enableHighQualityEffects', $event)"
            />
          </div>

          <!-- Blur Effects -->
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Blur Effects</label>
            <ToggleSwitch
              :model-value="performanceSettings.enableBlurEffects"
              @update:model-value="updatePerformanceSetting('enableBlurEffects', $event)"
            />
          </div>

          <!-- Shadow Effects -->
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Shadow Effects</label>
            <ToggleSwitch
              :model-value="performanceSettings.enableShadowEffects"
              @update:model-value="updatePerformanceSetting('enableShadowEffects', $event)"
            />
          </div>

          <!-- Max Particles -->
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Max Particles</label>
            <div class="flex items-center gap-3">
              <span class="text-xs text-text-muted">10</span>
              <input
                type="range"
                min="10"
                max="200"
                step="10"
                :value="performanceSettings.maxParticles"
                @input="updatePerformanceSetting('maxParticles', parseInt(($event.target as HTMLInputElement).value))"
                class="flex-1 max-w-24"
              />
              <span class="text-xs text-text-muted">200</span>
              <span class="text-xs font-mono w-8">{{ performanceSettings.maxParticles }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Accessibility -->
      <div class="mb-8">
        <h4 class="font-semibold mb-4">Accessibility</h4>
        <div class="space-y-4">
          <!-- Respect Reduced Motion -->
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Respect Reduced Motion Preference</label>
            <ToggleSwitch
              :model-value="globalAnimationSettings.respectReducedMotion"
              @update:model-value="updateSetting('respectReducedMotion', $event)"
            />
          </div>

          <!-- Current Status -->
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">System Reduced Motion</label>
            <span :class="isReducedMotion ? 'text-warning' : 'text-success'" class="text-sm">
              {{ isReducedMotion ? 'Enabled' : 'Disabled' }}
            </span>
          </div>

          <!-- Effective Status -->
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Animations Currently</label>
            <span :class="animationsEnabled ? 'text-success' : 'text-warning'" class="text-sm">
              {{ animationsEnabled ? 'Enabled' : 'Disabled' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-3">
        <NeonButton variant="primary" @click="saveSettings">
          Save Settings
        </NeonButton>
        <NeonButton variant="secondary" @click="resetToDefaults">
          Reset to Defaults
        </NeonButton>
        <NeonButton variant="ghost" @click="autoConfigurePerformance">
          Auto Configure
        </NeonButton>
      </div>

      <!-- Performance Info -->
      <div class="mt-6 p-4 bg-bg-tertiary rounded border border-text-muted/20">
        <h5 class="font-semibold text-sm mb-2">Performance Info</h5>
        <div class="text-xs text-text-secondary space-y-1">
          <div>Hardware Concurrency: {{ (globalThis.navigator?.hardwareConcurrency) || 'Unknown' }}</div>
          <div>User Agent: {{ (globalThis.navigator?.userAgent?.includes('Mobile')) ? 'Mobile' : 'Desktop' }}</div>
          <div>Reduced Motion: {{ isReducedMotion ? 'Yes' : 'No' }}</div>
          <div>Current Preset: {{ currentPresetLabel }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGlobalAnimations } from '../../composables/useGlobalAnimations'
import { useSoundEffects } from '../../composables/useSoundEffects'
import { NeonButton, ToggleSwitch } from './index'

const {
  globalAnimationSettings,
  performanceSettings,
  isReducedMotion,
  animationsEnabled,
  updateAnimationSettings,
  updatePerformanceSettings,
  applyPreset: applyAnimationPreset,
  autoConfigurePerformance,
  saveSettings
} = useGlobalAnimations()

const { playSound } = useSoundEffects()

const presets = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'maximum', label: 'Maximum' },
  { id: 'performance', label: 'Performance' }
]

const currentPreset = ref<string>('balanced')

const currentPresetLabel = computed(() => {
  const preset = presets.find(p => p.id === currentPreset.value)
  return preset?.label || 'Custom'
})

const updateSetting = (key: string, value: any) => {
  updateAnimationSettings({ [key]: value })
  currentPreset.value = 'custom'
}

const updatePerformanceSetting = (key: string, value: any) => {
  updatePerformanceSettings({ [key]: value })
  currentPreset.value = 'custom'
}

const applyPreset = (presetId: string) => {
  applyAnimationPreset(presetId as any)
  currentPreset.value = presetId
}

const resetToDefaults = () => {
  applyPreset('balanced')
}

const playTestSound = () => {
  playSound('success')
}
</script>

<style scoped>
/* Custom input styling */
input[type="range"] {
  @apply bg-bg-tertiary border border-text-muted/30 rounded;
  -webkit-appearance: none;
  height: 6px;
}

input[type="range"]::-webkit-slider-thumb {
  @apply bg-accent-cyan rounded-full;
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  box-shadow: 0 0 8px #00ffff;
  transition: all 0.2s ease;
}

input[type="range"]::-webkit-slider-thumb:hover {
  @apply bg-accent-magenta;
  box-shadow: 0 0 12px #ff00ff;
  transform: scale(1.1);
}

input[type="range"]::-moz-range-thumb {
  @apply bg-accent-cyan rounded-full border-0;
  width: 14px;
  height: 14px;
  box-shadow: 0 0 8px #00ffff;
  transition: all 0.2s ease;
}

input[type="range"]::-moz-range-thumb:hover {
  @apply bg-accent-magenta;
  box-shadow: 0 0 12px #ff00ff;
  transform: scale(1.1);
}

select {
  @apply bg-bg-tertiary border border-text-muted/30 rounded px-3 py-1 text-sm;
  @apply focus:border-accent-cyan focus:bg-bg-secondary;
  transition: all 0.2s ease;
}

select:focus {
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
}
</style>