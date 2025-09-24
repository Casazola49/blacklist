<template>
  <div class="ui-showcase p-8 space-y-12 bg-bg-primary min-h-screen">
    <div class="text-center mb-12">
      <GlitchText 
        text="THE BLACKLIST UI COMPONENTS" 
        :active="true" 
        variant="primary" 
        size="2rem"
        class="mb-4"
      />
      <p class="text-text-secondary font-mono">Futuristic UI components for the cyberpunk experience</p>
    </div>

    <!-- NeonButton Showcase -->
    <section class="space-y-6">
      <h2 class="text-xl font-orbitron text-accent-cyan mb-4">NeonButton Components</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <NeonButton variant="primary">Primary</NeonButton>
        <NeonButton variant="secondary">Secondary</NeonButton>
        <NeonButton variant="accent">Accent</NeonButton>
        <NeonButton variant="ghost">Ghost</NeonButton>
        <NeonButton variant="primary" :loading="true">Loading</NeonButton>
        <NeonButton variant="secondary" :disabled="true">Disabled</NeonButton>
        <NeonButton variant="accent" :pulse="true">Pulsing</NeonButton>
        <NeonButton variant="primary">
          <span class="flex items-center gap-2">
            <span>🚀</span>
            Launch
          </span>
        </NeonButton>
      </div>
    </section>

    <!-- GlitchText Showcase -->
    <section class="space-y-6">
      <h2 class="text-xl font-orbitron text-accent-cyan mb-4">GlitchText Components</h2>
      <div class="space-y-4">
        <div class="flex flex-wrap gap-8 items-center">
          <GlitchText text="SYSTEM ONLINE" variant="primary" />
          <GlitchText text="ACCESS GRANTED" variant="secondary" />
          <GlitchText text="ELITE STATUS" variant="accent" />
        </div>
        <div class="flex flex-wrap gap-8 items-center">
          <GlitchText text="INITIALIZING..." :typing="true" variant="primary" />
          <GlitchText text="CYBER PROTOCOL" :intense="true" variant="accent" />
          <GlitchText text="SCANNING..." :show-scan-lines="true" variant="secondary" />
        </div>
      </div>
    </section>

    <!-- HologramCard Showcase -->
    <section class="space-y-6">
      <h2 class="text-xl font-orbitron text-accent-cyan mb-4">HologramCard Components</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <HologramCard variant="primary">
          <div class="text-center">
            <h3 class="text-lg font-orbitron text-brand-primary mb-2">Primary Card</h3>
            <p class="text-text-secondary text-sm">Hover for 3D effects</p>
          </div>
        </HologramCard>
        
        <HologramCard variant="secondary" :show-particles="true">
          <div class="text-center">
            <h3 class="text-lg font-orbitron text-accent-cyan mb-2">With Particles</h3>
            <p class="text-text-secondary text-sm">Enhanced visual effects</p>
          </div>
        </HologramCard>
        
        <HologramCard variant="accent" :active="true" :intensity="1.5">
          <div class="text-center">
            <h3 class="text-lg font-orbitron text-accent-magenta mb-2">Active State</h3>
            <p class="text-text-secondary text-sm">Always highlighted</p>
          </div>
        </HologramCard>
      </div>
    </section>

    <!-- CyberLoader Showcase -->
    <section class="space-y-6">
      <h2 class="text-xl font-orbitron text-accent-cyan mb-4">CyberLoader Components</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
        <div class="text-center">
          <CyberLoader size="small" variant="primary" />
          <p class="text-xs text-text-muted mt-2">Small</p>
        </div>
        
        <div class="text-center">
          <CyberLoader size="medium" variant="secondary" text="Loading..." />
          <p class="text-xs text-text-muted mt-2">Medium</p>
        </div>
        
        <div class="text-center">
          <CyberLoader size="large" variant="accent" :pulsing="true" />
          <p class="text-xs text-text-muted mt-2">Large</p>
        </div>
        
        <div class="text-center">
          <CyberLoader 
            size="xl" 
            variant="primary" 
            text="PROCESSING" 
            :show-progress="true" 
            :progress="progressValue"
          />
          <p class="text-xs text-text-muted mt-2">XL with Progress</p>
        </div>
      </div>
    </section>

    <!-- RadialProgress Showcase -->
    <section class="space-y-6">
      <h2 class="text-xl font-orbitron text-accent-cyan mb-4">RadialProgress Components</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
        <div class="text-center">
          <RadialProgress :value="75" variant="primary" size="medium" />
          <p class="text-xs text-text-muted mt-2">Primary</p>
        </div>
        
        <div class="text-center">
          <RadialProgress :value="60" variant="secondary" size="medium" :show-glow="true" />
          <p class="text-xs text-text-muted mt-2">With Glow</p>
        </div>
        
        <div class="text-center">
          <RadialProgress :value="90" variant="success" size="medium" :show-particles="true" />
          <p class="text-xs text-text-muted mt-2">Success</p>
        </div>
        
        <div class="text-center">
          <RadialProgress 
            :value="animatedProgress" 
            variant="accent" 
            size="large" 
            :show-glow="true"
            :show-particles="true"
          >
            <div class="text-center">
              <div class="text-lg font-orbitron text-accent-magenta">{{ animatedProgress }}%</div>
              <div class="text-xs text-text-muted">ELITE</div>
            </div>
          </RadialProgress>
          <p class="text-xs text-text-muted mt-2">Custom Content</p>
        </div>
      </div>
    </section>

    <!-- Interactive Demo -->
    <section class="space-y-6">
      <h2 class="text-xl font-orbitron text-accent-cyan mb-4">Interactive Demo</h2>
      <HologramCard variant="primary" :show-particles="true" class="max-w-md mx-auto">
        <div class="text-center space-y-4">
          <GlitchText text="MISSION CONTROL" variant="primary" size="1.5rem" />
          
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-text-secondary text-sm">System Status:</span>
              <RadialProgress :value="systemStatus" variant="success" size="small" />
            </div>
            
            <div class="flex justify-between items-center">
              <span class="text-text-secondary text-sm">Security Level:</span>
              <RadialProgress :value="85" variant="error" size="small" />
            </div>
            
            <div class="flex justify-between items-center">
              <span class="text-text-secondary text-sm">Network:</span>
              <CyberLoader size="small" variant="accent" />
            </div>
          </div>
          
          <div class="pt-4">
            <NeonButton variant="primary" @click="toggleDemo">
              {{ demoActive ? 'DEACTIVATE' : 'ACTIVATE' }} DEMO
            </NeonButton>
          </div>
        </div>
      </HologramCard>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  NeonButton, 
  GlitchText, 
  HologramCard, 
  CyberLoader, 
  RadialProgress 
} from './index'

const progressValue = ref(0)
const animatedProgress = ref(0)
const systemStatus = ref(100)
const demoActive = ref(false)

let progressInterval: number | null = null
let animatedInterval: number | null = null

const startAnimations = () => {
  // Animate progress loader
  progressInterval = setInterval(() => {
    progressValue.value = (progressValue.value + 1) % 101
  }, 100)
  
  // Animate radial progress
  animatedInterval = setInterval(() => {
    animatedProgress.value = Math.floor(Math.random() * 100)
  }, 2000)
}

const stopAnimations = () => {
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
  if (animatedInterval) {
    clearInterval(animatedInterval)
    animatedInterval = null
  }
}

const toggleDemo = () => {
  demoActive.value = !demoActive.value
  if (demoActive.value) {
    startAnimations()
  } else {
    stopAnimations()
  }
}

onMounted(() => {
  // Start with some initial animations
  animatedProgress.value = 75
  startAnimations()
})

onUnmounted(() => {
  stopAnimations()
})
</script>

<style scoped>
.ui-showcase {
  font-family: 'Inter', system-ui, sans-serif;
}

section {
  @apply border border-text-muted/20 rounded-lg p-6;
  background: rgba(26, 26, 26, 0.5);
  backdrop-filter: blur(10px);
}

h2 {
  position: relative;
}

h2::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 50px;
  height: 2px;
  background: linear-gradient(90deg, theme('colors.accent-cyan'), transparent);
}
</style>