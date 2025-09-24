<template>
  <div 
    class="hologram-card" 
    :class="{ 
      'hologram-card--hover': isHovered,
      'hologram-card--active': active,
      [`hologram-card--${variant}`]: variant
    }" 
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @mousemove="onMouseMove"
    :style="cardStyle"
  >
    <div class="hologram-card__content">
      <slot />
    </div>
    <div class="hologram-card__glow" :style="glowStyle"></div>
    <div class="hologram-card__scan-line"></div>
    <div class="hologram-card__grid"></div>
    <div class="hologram-card__corners">
      <div class="corner corner--tl"></div>
      <div class="corner corner--tr"></div>
      <div class="corner corner--bl"></div>
      <div class="corner corner--br"></div>
    </div>
    <div v-if="showParticles" class="hologram-card__particles">
      <div 
        v-for="i in 12" 
        :key="i" 
        class="particle" 
        :style="{ animationDelay: `${i * 0.2}s` }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'accent'
  active?: boolean
  showParticles?: boolean
  intensity?: number
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  active: false,
  showParticles: false,
  intensity: 1
})

const isHovered = ref(false)
const mouseX = ref(0)
const mouseY = ref(0)

const cardStyle = computed(() => {
  if (!isHovered.value) return {}
  
  const rotateX = (mouseY.value - 0.5) * 10 * props.intensity
  const rotateY = (mouseX.value - 0.5) * -10 * props.intensity
  
  return {
    transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`
  }
})

const glowStyle = computed(() => {
  if (!isHovered.value) return {}
  
  return {
    background: `radial-gradient(circle at ${mouseX.value * 100}% ${mouseY.value * 100}%, 
      rgba(0, 255, 255, 0.3) 0%, 
      rgba(255, 0, 255, 0.2) 30%,
      transparent 70%
    )`
  }
})

const onMouseEnter = () => {
  isHovered.value = true
}

const onMouseLeave = () => {
  isHovered.value = false
  mouseX.value = 0.5
  mouseY.value = 0.5
}

const onMouseMove = (event: MouseEvent) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  mouseX.value = (event.clientX - rect.left) / rect.width
  mouseY.value = (event.clientY - rect.top) / rect.height
}
</script>

<style scoped>
.hologram-card {
  @apply relative p-6 bg-bg-secondary/80 backdrop-blur-sm transition-all duration-500;
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 12px;
  overflow: hidden;
  transform-style: preserve-3d;
}

.hologram-card--primary {
  background: linear-gradient(135deg, 
    rgba(0, 255, 255, 0.1) 0%, 
    rgba(128, 0, 32, 0.1) 50%, 
    rgba(255, 0, 255, 0.1) 100%
  );
}

.hologram-card--secondary {
  background: linear-gradient(135deg, 
    rgba(128, 0, 32, 0.1) 0%, 
    rgba(0, 255, 255, 0.1) 50%, 
    rgba(255, 0, 255, 0.1) 100%
  );
  border-color: rgba(128, 0, 32, 0.3);
}

.hologram-card--accent {
  background: linear-gradient(135deg, 
    rgba(255, 0, 255, 0.1) 0%, 
    rgba(0, 255, 255, 0.1) 50%, 
    rgba(128, 0, 32, 0.1) 100%
  );
  border-color: rgba(255, 0, 255, 0.3);
}

.hologram-card--hover {
  border-color: rgba(0, 255, 255, 0.6);
  box-shadow: 
    0 20px 40px rgba(0, 255, 255, 0.2),
    0 0 20px rgba(0, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.hologram-card--active {
  border-color: rgba(0, 255, 255, 0.8);
  box-shadow: 
    0 0 30px rgba(0, 255, 255, 0.4),
    inset 0 0 20px rgba(0, 255, 255, 0.1);
}

.hologram-card__content {
  @apply relative z-20;
}

.hologram-card__glow {
  @apply absolute inset-0 opacity-0 transition-all duration-300;
  z-index: 1;
}

.hologram-card--hover .hologram-card__glow {
  @apply opacity-100;
}

.hologram-card__scan-line {
  @apply absolute top-0 left-0 w-full h-px opacity-0;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(0, 255, 255, 0.8) 50%, 
    transparent 100%
  );
  z-index: 10;
}

.hologram-card--hover .hologram-card__scan-line,
.hologram-card--active .hologram-card__scan-line {
  @apply opacity-100;
  animation: scan 2s infinite;
}

.hologram-card__grid {
  @apply absolute inset-0 opacity-10;
  background-image: 
    linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  z-index: 2;
}

.hologram-card--hover .hologram-card__grid {
  @apply opacity-20;
}

.hologram-card__corners {
  @apply absolute inset-0 pointer-events-none;
  z-index: 15;
}

.corner {
  @apply absolute w-4 h-4 border-accent-cyan opacity-0 transition-opacity duration-300;
}

.corner--tl {
  @apply top-2 left-2 border-t-2 border-l-2;
}

.corner--tr {
  @apply top-2 right-2 border-t-2 border-r-2;
}

.corner--bl {
  @apply bottom-2 left-2 border-b-2 border-l-2;
}

.corner--br {
  @apply bottom-2 right-2 border-b-2 border-r-2;
}

.hologram-card--hover .corner,
.hologram-card--active .corner {
  @apply opacity-100;
}

.hologram-card__particles {
  @apply absolute inset-0 pointer-events-none;
  z-index: 5;
}

.particle {
  @apply absolute w-1 h-1 bg-accent-cyan rounded-full opacity-0;
  animation: particle-float 3s infinite ease-in-out;
}

.particle:nth-child(odd) {
  @apply bg-accent-magenta;
}

.hologram-card--hover .particle {
  @apply opacity-60;
}

@keyframes scan {
  0% { 
    transform: translateY(-2px); 
    opacity: 0; 
  }
  10% { 
    opacity: 1; 
  }
  90% { 
    opacity: 1; 
  }
  100% { 
    transform: translateY(calc(100% + 2px)); 
    opacity: 0; 
  }
}

@keyframes particle-float {
  0% {
    transform: translateY(100%) translateX(0) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
    transform: scale(1);
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-20px) translateX(10px) scale(0);
    opacity: 0;
  }
}
</style>