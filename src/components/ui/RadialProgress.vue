<template>
  <div 
    class="radial-progress" 
    :class="[
      `radial-progress--${size}`,
      `radial-progress--${variant}`,
      { 'radial-progress--animated': animated }
    ]"
  >
    <svg class="radial-progress__svg" viewBox="0 0 100 100">
      <!-- Background circle -->
      <circle
        class="radial-progress__bg"
        cx="50"
        cy="50"
        :r="radius"
        fill="none"
        :stroke-width="strokeWidth"
      />
      
      <!-- Progress circle -->
      <circle
        class="radial-progress__progress"
        cx="50"
        cy="50"
        :r="radius"
        fill="none"
        :stroke-width="strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="strokeDashoffset"
        :style="progressStyle"
      />
      
      <!-- Glow effect -->
      <circle
        v-if="showGlow"
        class="radial-progress__glow"
        cx="50"
        cy="50"
        :r="radius"
        fill="none"
        :stroke-width="strokeWidth + 2"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="strokeDashoffset"
      />
    </svg>
    
    <!-- Center content -->
    <div class="radial-progress__content">
      <slot>
        <div class="radial-progress__value">
          <span class="radial-progress__number">{{ displayValue }}</span>
          <span v-if="showUnit" class="radial-progress__unit">{{ unit }}</span>
        </div>
      </slot>
    </div>
    
    <!-- Particles effect -->
    <div v-if="showParticles" class="radial-progress__particles">
      <div 
        v-for="i in 8" 
        :key="i" 
        class="particle" 
        :style="{ 
          '--angle': `${(360 / 8) * i}deg`,
          animationDelay: `${i * 0.2}s`
        }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'

interface Props {
  value: number
  max?: number
  size?: 'small' | 'medium' | 'large' | 'xl'
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error'
  strokeWidth?: number
  animated?: boolean
  showGlow?: boolean
  showParticles?: boolean
  showUnit?: boolean
  unit?: string
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  max: 100,
  size: 'medium',
  variant: 'primary',
  strokeWidth: 4,
  animated: true,
  showGlow: false,
  showParticles: false,
  showUnit: true,
  unit: '%',
  duration: 1000
})

const animatedValue = ref(0)
const radius = computed(() => 50 - props.strokeWidth / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const percentage = computed(() => Math.min((props.value / props.max) * 100, 100))

const strokeDashoffset = computed(() => {
  const progress = props.animated ? animatedValue.value : percentage.value
  return circumference.value - (progress / 100) * circumference.value
})

const displayValue = computed(() => {
  const progress = props.animated ? animatedValue.value : percentage.value
  return Math.round(progress)
})

const progressStyle = computed(() => {
  const colors = {
    primary: '#800020',
    secondary: '#00ffff',
    accent: '#ff00ff',
    success: '#00ff88',
    warning: '#ffaa00',
    error: '#ff3366'
  }
  
  return {
    stroke: colors[props.variant],
    filter: props.showGlow ? `drop-shadow(0 0 8px ${colors[props.variant]})` : 'none'
  }
})

const animateProgress = () => {
  if (!props.animated) return
  
  const startTime = Date.now()
  const startValue = animatedValue.value
  const targetValue = percentage.value
  const duration = props.duration
  
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // Easing function (ease-out)
    const easeOut = 1 - Math.pow(1 - progress, 3)
    
    animatedValue.value = startValue + (targetValue - startValue) * easeOut
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  
  requestAnimationFrame(animate)
}

watch(() => props.value, () => {
  animateProgress()
}, { immediate: true })

onMounted(() => {
  if (props.animated) {
    animateProgress()
  }
})
</script>

<style scoped>
.radial-progress {
  @apply relative inline-flex items-center justify-center;
}

.radial-progress--small {
  width: 60px;
  height: 60px;
}

.radial-progress--medium {
  width: 100px;
  height: 100px;
}

.radial-progress--large {
  width: 140px;
  height: 140px;
}

.radial-progress--xl {
  width: 180px;
  height: 180px;
}

.radial-progress__svg {
  @apply absolute inset-0 w-full h-full;
  transform: rotate(-90deg);
}

.radial-progress__bg {
  stroke: theme('colors.bg-tertiary');
  opacity: 0.3;
}

.radial-progress__progress {
  transition: stroke-dashoffset 0.3s ease;
  stroke-linecap: round;
}

.radial-progress--animated .radial-progress__progress {
  transition: none;
}

.radial-progress__glow {
  stroke: currentColor;
  opacity: 0.3;
  filter: blur(2px);
}

.radial-progress__content {
  @apply relative z-10 flex flex-col items-center justify-center text-center;
}

.radial-progress__value {
  @apply flex flex-col items-center;
}

.radial-progress__number {
  @apply font-bold font-orbitron;
  font-size: clamp(0.875rem, 4vw, 1.5rem);
  color: theme('colors.text-primary');
  text-shadow: 0 0 10px currentColor;
}

.radial-progress--small .radial-progress__number {
  @apply text-sm;
}

.radial-progress--large .radial-progress__number,
.radial-progress--xl .radial-progress__number {
  @apply text-2xl;
}

.radial-progress__unit {
  @apply text-xs text-text-muted font-mono uppercase tracking-wider;
  margin-top: -2px;
}

.radial-progress--large .radial-progress__unit,
.radial-progress--xl .radial-progress__unit {
  @apply text-sm;
}

.radial-progress__particles {
  @apply absolute inset-0 pointer-events-none;
}

.particle {
  @apply absolute w-1 h-1 bg-current rounded-full;
  top: 50%;
  left: 50%;
  transform-origin: 0 0;
  transform: rotate(var(--angle)) translateX(45px) translateY(-50%);
  animation: particle-orbit 3s infinite ease-in-out;
  opacity: 0;
}

.radial-progress--primary .particle {
  @apply bg-brand-primary;
}

.radial-progress--secondary .particle {
  @apply bg-accent-cyan;
}

.radial-progress--accent .particle {
  @apply bg-accent-magenta;
}

.radial-progress--success .particle {
  @apply bg-success;
}

.radial-progress--warning .particle {
  @apply bg-warning;
}

.radial-progress--error .particle {
  @apply bg-error;
}

@keyframes particle-orbit {
  0%, 100% {
    opacity: 0;
    transform: rotate(var(--angle)) translateX(35px) translateY(-50%) scale(0);
  }
  50% {
    opacity: 1;
    transform: rotate(var(--angle)) translateX(55px) translateY(-50%) scale(1);
  }
}
</style>