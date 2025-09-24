<template>
  <div class="animation-showcase">
    <div class="container mx-auto px-4 py-8">
      <AnimatedEntrance animation="glitchIn" :delay="200">
        <h1 class="text-4xl font-orbitron font-bold text-center mb-12 text-glow">
          <GlitchText text="Advanced Animation System" :active="true" variant="accent" />
        </h1>
      </AnimatedEntrance>

      <!-- Page Transitions Demo -->
      <AnimatedEntrance animation="slideUp" :delay="400">
        <section class="mb-16">
          <h2 class="text-2xl font-orbitron font-bold mb-6 text-accent-cyan">Page Transitions</h2>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <NeonButton
              v-for="transition in pageTransitions"
              :key="transition.type"
              variant="secondary"
              size="sm"
              @click="demoPageTransition(transition)"
            >
              {{ transition.label }}
            </NeonButton>
          </div>
        </section>
      </AnimatedEntrance>

      <!-- Interactive Elements Demo -->
      <AnimatedEntrance animation="slideLeft" :delay="600">
        <section class="mb-16">
          <h2 class="text-2xl font-orbitron font-bold mb-6 text-accent-cyan">Interactive Elements</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <InteractiveElement
              v-for="element in interactiveElements"
              :key="element.id"
              :variant="element.variant"
              :enable-glitch="element.enableGlitch"
              :glitch-intensity="element.glitchIntensity"
              class="p-6 bg-bg-secondary rounded-lg border border-text-muted/30"
            >
              <h3 class="font-orbitron font-bold mb-2">{{ element.title }}</h3>
              <p class="text-sm text-text-secondary">{{ element.description }}</p>
            </InteractiveElement>
          </div>
        </section>
      </AnimatedEntrance>

      <!-- Glitch Effects Demo -->
      <AnimatedEntrance animation="slideRight" :delay="800">
        <section class="mb-16">
          <h2 class="text-2xl font-orbitron font-bold mb-6 text-accent-cyan">Glitch Effects</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlitchEffect
              v-for="glitch in glitchEffects"
              :key="glitch.id"
              :variant="glitch.variant"
              :intensity="glitch.intensity"
              :hover-trigger="glitch.hoverTrigger"
              :click-trigger="glitch.clickTrigger"
              :continuous="glitch.continuous"
              :show-scan-lines="glitch.showScanLines"
              :show-noise="glitch.showNoise"
              :show-rgb-split="glitch.showRgbSplit"
              class="p-6 bg-bg-secondary rounded-lg border border-text-muted/30 cursor-pointer"
            >
              <h3 class="font-orbitron font-bold mb-2">{{ glitch.title }}</h3>
              <p class="text-sm text-text-secondary">{{ glitch.description }}</p>
            </GlitchEffect>
          </div>
        </section>
      </AnimatedEntrance>

      <!-- Enhanced Buttons Demo -->
      <AnimatedEntrance animation="scaleIn" :delay="1000">
        <section class="mb-16">
          <h2 class="text-2xl font-orbitron font-bold mb-6 text-accent-cyan">Enhanced Buttons</h2>
          <div class="flex flex-wrap gap-4">
            <NeonButton
              v-for="button in enhancedButtons"
              :key="button.id"
              :variant="button.variant"
              :size="button.size"
              :enable-glitch="button.enableGlitch"
              :glitch-intensity="button.glitchIntensity"
              @click="playButtonSound(button.sound)"
            >
              {{ button.label }}
            </NeonButton>
          </div>
        </section>
      </AnimatedEntrance>

      <!-- Entrance Animations Demo -->
      <AnimatedEntrance animation="fadeIn" :delay="1200" :stagger-children="true">
        <section class="mb-16">
          <h2 class="text-2xl font-orbitron font-bold mb-6 text-accent-cyan">Entrance Animations</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="(animation, index) in entranceAnimations"
              :key="animation.type"
              class="p-6 bg-bg-secondary rounded-lg border border-text-muted/30"
            >
              <h3 class="font-orbitron font-bold mb-2">{{ animation.label }}</h3>
              <p class="text-sm text-text-secondary mb-4">{{ animation.description }}</p>
              <NeonButton
                variant="accent"
                size="sm"
                @click="triggerEntranceAnimation(animation.type, index)"
              >
                Trigger
              </NeonButton>
            </div>
          </div>
        </section>
      </AnimatedEntrance>

      <!-- Sound Effects Demo -->
      <AnimatedEntrance animation="slideUp" :delay="1400">
        <section class="mb-16">
          <h2 class="text-2xl font-orbitron font-bold mb-6 text-accent-cyan">Sound Effects</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <NeonButton
              v-for="sound in soundEffects"
              :key="sound.name"
              variant="ghost"
              size="sm"
              @click="playSound(sound.name)"
            >
              {{ sound.label }}
            </NeonButton>
          </div>
          <div class="mt-6 flex items-center gap-4">
            <label class="text-sm font-medium">Master Volume:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              :value="masterVolume"
              @input="setVolume(parseFloat(($event.target as HTMLInputElement).value))"
              class="flex-1 max-w-xs"
            />
            <NeonButton
              variant="ghost"
              size="sm"
              @click="toggleSounds"
            >
              {{ soundsEnabled ? 'Disable' : 'Enable' }} Sounds
            </NeonButton>
          </div>
        </section>
      </AnimatedEntrance>

      <!-- Performance Info -->
      <AnimatedEntrance animation="fadeIn" :delay="1600">
        <section class="mb-16">
          <h2 class="text-2xl font-orbitron font-bold mb-6 text-accent-cyan">Performance & Accessibility</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="p-6 bg-bg-secondary rounded-lg border border-text-muted/30">
              <h3 class="font-orbitron font-bold mb-4">Reduced Motion</h3>
              <p class="text-sm text-text-secondary mb-4">
                All animations respect the user's reduced motion preference.
              </p>
              <div class="flex items-center gap-2">
                <span class="text-sm">Reduced Motion:</span>
                <span :class="isReducedMotion ? 'text-warning' : 'text-success'">
                  {{ isReducedMotion ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
            </div>
            <div class="p-6 bg-bg-secondary rounded-lg border border-text-muted/30">
              <h3 class="font-orbitron font-bold mb-4">Performance</h3>
              <p class="text-sm text-text-secondary mb-4">
                Animations use GPU acceleration and are optimized for 60fps.
              </p>
              <div class="text-sm space-y-1">
                <div>• Hardware acceleration enabled</div>
                <div>• Intersection Observer for entrance animations</div>
                <div>• Web Audio API for sound effects</div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedEntrance>
    </div>

    <!-- Demo Modal for Page Transitions -->
    <div
      v-if="showTransitionDemo"
      class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      @click="closeTransitionDemo"
    >
      <PageTransition
        :type="currentTransition.type"
        :direction="currentTransition.direction"
        :play-sound="true"
      >
        <div
          v-if="transitionContent"
          class="bg-bg-secondary p-8 rounded-lg border border-accent-cyan max-w-md"
          @click.stop
        >
          <h3 class="font-orbitron font-bold text-xl mb-4">{{ currentTransition.label }} Transition</h3>
          <p class="text-text-secondary mb-6">
            This demonstrates the {{ currentTransition.type }} transition with {{ currentTransition.direction }} direction.
          </p>
          <NeonButton variant="accent" @click="closeTransitionDemo">
            Close Demo
          </NeonButton>
        </div>
      </PageTransition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAnimations } from '../../composables/useAnimations'
import { useSoundEffects } from '../../composables/useSoundEffects'
import {
  AnimatedEntrance,
  GlitchText,
  GlitchEffect,
  InteractiveElement,
  NeonButton,
  PageTransition
} from './index'

const { isReducedMotion } = useAnimations()
const { playSound, toggleSounds, setVolume, masterVolume, isEnabled: soundsEnabled } = useSoundEffects()

// Demo data
const pageTransitions = [
  { type: 'fade' as const, direction: 'up' as const, label: 'Fade Up' },
  { type: 'slide' as const, direction: 'right' as const, label: 'Slide Right' },
  { type: 'glitch' as const, direction: 'left' as const, label: 'Glitch' },
  { type: 'matrix' as const, direction: 'down' as const, label: 'Matrix' },
  { type: 'hologram' as const, direction: 'up' as const, label: 'Hologram' },
  { type: 'cyber' as const, direction: 'right' as const, label: 'Cyber' }
]

const interactiveElements = [
  {
    id: 1,
    title: 'Hover Effects',
    description: 'Hover to see glow and scan line effects',
    variant: 'primary' as const,
    enableGlitch: false,
    glitchIntensity: 'medium' as const
  },
  {
    id: 2,
    title: 'Click Glitch',
    description: 'Click to trigger glitch effect',
    variant: 'secondary' as const,
    enableGlitch: true,
    glitchIntensity: 'high' as const
  },
  {
    id: 3,
    title: 'Ripple Effect',
    description: 'Click anywhere to see ripple',
    variant: 'accent' as const,
    enableGlitch: false,
    glitchIntensity: 'low' as const
  },
  {
    id: 4,
    title: 'Full Effects',
    description: 'All micro-interactions enabled',
    variant: 'ghost' as const,
    enableGlitch: true,
    glitchIntensity: 'high' as const
  }
]

const glitchEffects = [
  {
    id: 1,
    title: 'Hover Glitch',
    description: 'Hover to activate',
    variant: 'primary' as const,
    intensity: 'medium' as const,
    hoverTrigger: true,
    clickTrigger: false,
    continuous: false,
    showScanLines: true,
    showNoise: true,
    showRgbSplit: true
  },
  {
    id: 2,
    title: 'Click Glitch',
    description: 'Click to activate',
    variant: 'secondary' as const,
    intensity: 'high' as const,
    hoverTrigger: false,
    clickTrigger: true,
    continuous: false,
    showScanLines: true,
    showNoise: false,
    showRgbSplit: true
  },
  {
    id: 3,
    title: 'Continuous',
    description: 'Always glitching',
    variant: 'accent' as const,
    intensity: 'low' as const,
    hoverTrigger: false,
    clickTrigger: false,
    continuous: true,
    showScanLines: false,
    showNoise: true,
    showRgbSplit: false
  },
  {
    id: 4,
    title: 'Extreme',
    description: 'Maximum intensity',
    variant: 'danger' as const,
    intensity: 'extreme' as const,
    hoverTrigger: true,
    clickTrigger: true,
    continuous: false,
    showScanLines: true,
    showNoise: true,
    showRgbSplit: true
  }
]

const enhancedButtons = [
  { id: 1, label: 'Primary', variant: 'primary' as const, size: 'md' as const, enableGlitch: true, glitchIntensity: 'medium' as const, sound: 'click' as const },
  { id: 2, label: 'Secondary', variant: 'secondary' as const, size: 'md' as const, enableGlitch: true, glitchIntensity: 'low' as const, sound: 'hover' as const },
  { id: 3, label: 'Accent', variant: 'accent' as const, size: 'md' as const, enableGlitch: true, glitchIntensity: 'high' as const, sound: 'success' as const },
  { id: 4, label: 'Success', variant: 'success' as const, size: 'md' as const, enableGlitch: false, glitchIntensity: 'medium' as const, sound: 'powerUp' as const },
  { id: 5, label: 'Warning', variant: 'warning' as const, size: 'md' as const, enableGlitch: true, glitchIntensity: 'high' as const, sound: 'scan' as const },
  { id: 6, label: 'Danger', variant: 'danger' as const, size: 'md' as const, enableGlitch: true, glitchIntensity: 'high' as const, sound: 'error' as const }
]

const entranceAnimations = [
  { type: 'fadeIn', label: 'Fade In', description: 'Simple opacity transition' },
  { type: 'slideUp', label: 'Slide Up', description: 'Slides from bottom' },
  { type: 'slideDown', label: 'Slide Down', description: 'Slides from top' },
  { type: 'slideLeft', label: 'Slide Left', description: 'Slides from right' },
  { type: 'slideRight', label: 'Slide Right', description: 'Slides from left' },
  { type: 'scaleIn', label: 'Scale In', description: 'Scales from small to normal' },
  { type: 'glitchIn', label: 'Glitch In', description: 'Glitch effect entrance' }
]

const soundEffects = [
  { name: 'hover', label: 'Hover' },
  { name: 'click', label: 'Click' },
  { name: 'success', label: 'Success' },
  { name: 'error', label: 'Error' },
  { name: 'notification', label: 'Notification' },
  { name: 'pageTransition', label: 'Page Transition' },
  { name: 'modalOpen', label: 'Modal Open' },
  { name: 'modalClose', label: 'Modal Close' },
  { name: 'upload', label: 'Upload' },
  { name: 'download', label: 'Download' },
  { name: 'message', label: 'Message' },
  { name: 'glitch', label: 'Glitch' },
  { name: 'scan', label: 'Scan' },
  { name: 'powerUp', label: 'Power Up' },
  { name: 'powerDown', label: 'Power Down' }
]

// Demo state
const showTransitionDemo = ref(false)
const transitionContent = ref(false)
const currentTransition = ref(pageTransitions[0])

// Demo methods
const demoPageTransition = (transition: any) => {
  currentTransition.value = transition
  showTransitionDemo.value = true
  transitionContent.value = false
  
  // Show content after a brief delay to demonstrate transition
  setTimeout(() => {
    transitionContent.value = true
  }, 100)
}

const closeTransitionDemo = () => {
  transitionContent.value = false
  setTimeout(() => {
    showTransitionDemo.value = false
  }, 300)
}

const triggerEntranceAnimation = (animationType: string, index: number) => {
  // This would trigger a re-animation of the specific element
  // For demo purposes, we'll just play a sound
  playSound('scan')
}

const playButtonSound = (soundName: string) => {
  const validSounds = ['click', 'hover', 'success', 'powerUp', 'scan', 'error'] as const
  if (validSounds.includes(soundName as any)) {
    playSound(soundName as any)
  }
}
</script>

<style scoped>
.animation-showcase {
  @apply min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary;
}

/* Custom scrollbar for the showcase */
.animation-showcase::-webkit-scrollbar {
  width: 8px;
}

.animation-showcase::-webkit-scrollbar-track {
  @apply bg-bg-secondary;
}

.animation-showcase::-webkit-scrollbar-thumb {
  @apply bg-accent-cyan rounded;
  box-shadow: 0 0 10px #00ffff;
}

.animation-showcase::-webkit-scrollbar-thumb:hover {
  @apply bg-accent-magenta;
  box-shadow: 0 0 10px #ff00ff;
}

/* Enhanced input styling */
input[type="range"] {
  @apply bg-bg-secondary border border-text-muted/30 rounded;
  -webkit-appearance: none;
  height: 6px;
}

input[type="range"]::-webkit-slider-thumb {
  @apply bg-accent-cyan rounded-full;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  box-shadow: 0 0 10px #00ffff;
}

input[type="range"]::-webkit-slider-thumb:hover {
  @apply bg-accent-magenta;
  box-shadow: 0 0 15px #ff00ff;
}
</style>