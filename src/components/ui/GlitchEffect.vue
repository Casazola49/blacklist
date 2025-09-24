<template>
  <div
    ref="containerRef"
    :class="[
      'glitch-effect',
      `glitch-effect--${variant}`,
      `glitch-effect--${intensity}`,
      {
        'glitch-effect--active': isActive,
        'glitch-effect--continuous': continuous,
        'glitch-effect--hover': hoverTrigger && isHovered
      }
    ]"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @click="onClick"
  >
    <div class="glitch-effect__content">
      <slot />
    </div>
    
    <!-- Glitch layers -->
    <div
      v-for="layer in layers"
      :key="layer.id"
      :class="[
        'glitch-effect__layer',
        `glitch-effect__layer--${layer.type}`
      ]"
      :style="{
        '--layer-color': layer.color,
        '--layer-offset': layer.offset,
        '--layer-opacity': layer.opacity,
        animationDelay: `${layer.delay}ms`
      }"
    >
      <slot />
    </div>
    
    <!-- Scan lines -->
    <div v-if="showScanLines" class="glitch-effect__scan-lines">
      <div
        v-for="i in scanLineCount"
        :key="i"
        class="glitch-effect__scan-line"
        :style="{ animationDelay: `${i * 0.1}s` }"
      ></div>
    </div>
    
    <!-- Digital noise overlay -->
    <div v-if="showNoise" class="glitch-effect__noise"></div>
    
    <!-- RGB split effect -->
    <div v-if="showRgbSplit" class="glitch-effect__rgb-split">
      <div class="glitch-effect__rgb-split-r"></div>
      <div class="glitch-effect__rgb-split-g"></div>
      <div class="glitch-effect__rgb-split-b"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useSoundEffects } from '../../composables/useSoundEffects'

interface Props {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger'
  intensity?: 'low' | 'medium' | 'high' | 'extreme'
  continuous?: boolean
  hoverTrigger?: boolean
  clickTrigger?: boolean
  duration?: number
  frequency?: number
  showScanLines?: boolean
  showNoise?: boolean
  showRgbSplit?: boolean
  scanLineCount?: number
  enableSound?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  intensity: 'medium',
  continuous: false,
  hoverTrigger: false,
  clickTrigger: true,
  duration: 500,
  frequency: 0.3,
  showScanLines: true,
  showNoise: true,
  showRgbSplit: true,
  scanLineCount: 3,
  enableSound: true
})

const emit = defineEmits<{
  glitchStart: []
  glitchEnd: []
}>()

const containerRef = ref<HTMLElement>()
const isActive = ref(false)
const isHovered = ref(false)

const { playSound } = useSoundEffects()

let glitchInterval: NodeJS.Timeout | undefined
let glitchTimeout: NodeJS.Timeout | undefined

// Define glitch layers based on intensity
const layers = computed(() => {
  const intensityMap = {
    low: 2,
    medium: 3,
    high: 4,
    extreme: 6
  }

  const layerCount = intensityMap[props.intensity]
  const colors = ['#00ffff', '#ff00ff', '#ffff00', '#ff0000', '#00ff00', '#0000ff']
  
  return Array.from({ length: layerCount }, (_, index) => ({
    id: index,
    type: index % 2 === 0 ? 'left' : 'right',
    color: colors[index % colors.length],
    offset: `${(index + 1) * 2}px`,
    opacity: 0.7 - (index * 0.1),
    delay: index * 50
  }))
})

onMounted(() => {
  if (props.continuous) {
    startContinuousGlitch()
  }
})

onUnmounted(() => {
  stopGlitch()
})

watch(() => props.continuous, (newValue) => {
  if (newValue) {
    startContinuousGlitch()
  } else {
    stopGlitch()
  }
})

const onMouseEnter = () => {
  isHovered.value = true
  if (props.hoverTrigger) {
    startGlitch()
  }
}

const onMouseLeave = () => {
  isHovered.value = false
  if (props.hoverTrigger && !props.continuous) {
    stopGlitch()
  }
}

const onClick = () => {
  if (props.clickTrigger) {
    startGlitch()
  }
}

const startGlitch = () => {
  if (isActive.value) return

  isActive.value = true
  emit('glitchStart')

  if (props.enableSound) {
    playSound('glitch')
  }

  // Stop glitch after duration
  if (!props.continuous) {
    glitchTimeout = setTimeout(() => {
      stopGlitch()
    }, props.duration)
  }
}

const stopGlitch = () => {
  isActive.value = false
  emit('glitchEnd')

  if (glitchInterval) {
    clearInterval(glitchInterval)
    glitchInterval = undefined
  }

  if (glitchTimeout) {
    clearTimeout(glitchTimeout)
    glitchTimeout = undefined
  }
}

const startContinuousGlitch = () => {
  if (glitchInterval) return

  glitchInterval = setInterval(() => {
    if (Math.random() < props.frequency) {
      startGlitch()
      setTimeout(() => {
        if (!props.hoverTrigger || !isHovered.value) {
          stopGlitch()
        }
      }, props.duration)
    }
  }, 1000)
}

// Expose methods
const trigger = () => startGlitch()
const stop = () => stopGlitch()

defineExpose({
  trigger,
  stop
})
</script>

<style scoped>
.glitch-effect {
  @apply relative inline-block;
  overflow: hidden;
}

.glitch-effect__content {
  @apply relative z-10;
}

.glitch-effect__layer {
  @apply absolute inset-0 pointer-events-none;
  opacity: 0;
  mix-blend-mode: screen;
}

.glitch-effect--active .glitch-effect__layer {
  opacity: var(--layer-opacity);
  animation: glitch-layer 0.1s infinite;
}

.glitch-effect__layer--left {
  transform: translateX(calc(-1 * var(--layer-offset)));
  color: var(--layer-color);
}

.glitch-effect__layer--right {
  transform: translateX(var(--layer-offset));
  color: var(--layer-color);
}

.glitch-effect__scan-lines {
  @apply absolute inset-0 pointer-events-none;
  opacity: 0;
}

.glitch-effect--active .glitch-effect__scan-lines {
  opacity: 1;
}

.glitch-effect__scan-line {
  @apply absolute w-full h-px bg-accent-cyan;
  opacity: 0.6;
  animation: scan-line-move 0.1s infinite linear;
}

.glitch-effect__scan-line:nth-child(1) { top: 20%; }
.glitch-effect__scan-line:nth-child(2) { top: 50%; }
.glitch-effect__scan-line:nth-child(3) { top: 80%; }

.glitch-effect__noise {
  @apply absolute inset-0 pointer-events-none;
  opacity: 0;
  background-image: 
    radial-gradient(circle at 20% 50%, transparent 20%, rgba(255, 255, 255, 0.3) 21%, rgba(255, 255, 255, 0.3) 34%, transparent 35%),
    linear-gradient(75deg, transparent 74%, rgba(255, 255, 255, 0.3) 75%, rgba(255, 255, 255, 0.3) 76%, transparent 77%),
    linear-gradient(25deg, transparent 24%, rgba(255, 255, 255, 0.3) 25%, rgba(255, 255, 255, 0.3) 26%, transparent 27%);
  background-size: 50px 50px, 20px 20px, 30px 30px;
}

.glitch-effect--active .glitch-effect__noise {
  opacity: 1;
  animation: noise-move 0.2s infinite;
}

.glitch-effect__rgb-split {
  @apply absolute inset-0 pointer-events-none;
  opacity: 0;
}

.glitch-effect--active .glitch-effect__rgb-split {
  opacity: 1;
}

.glitch-effect__rgb-split-r,
.glitch-effect__rgb-split-g,
.glitch-effect__rgb-split-b {
  @apply absolute inset-0;
  mix-blend-mode: screen;
}

.glitch-effect__rgb-split-r {
  background: rgba(255, 0, 0, 0.1);
  animation: rgb-split-r 0.1s infinite;
}

.glitch-effect__rgb-split-g {
  background: rgba(0, 255, 0, 0.1);
  animation: rgb-split-g 0.1s infinite;
}

.glitch-effect__rgb-split-b {
  background: rgba(0, 0, 255, 0.1);
  animation: rgb-split-b 0.1s infinite;
}

/* Intensity variations */
.glitch-effect--low .glitch-effect__layer {
  --layer-opacity: 0.3;
}

.glitch-effect--medium .glitch-effect__layer {
  --layer-opacity: 0.5;
}

.glitch-effect--high .glitch-effect__layer {
  --layer-opacity: 0.7;
}

.glitch-effect--extreme .glitch-effect__layer {
  --layer-opacity: 0.9;
}

.glitch-effect--extreme.glitch-effect--active {
  animation: container-shake 0.1s infinite;
}

/* Variant colors */
.glitch-effect--primary {
  --glitch-color-1: #00ffff;
  --glitch-color-2: #ff00ff;
}

.glitch-effect--secondary {
  --glitch-color-1: #800020;
  --glitch-color-2: #00ffff;
}

.glitch-effect--accent {
  --glitch-color-1: #ff00ff;
  --glitch-color-2: #ffff00;
}

.glitch-effect--danger {
  --glitch-color-1: #ff0000;
  --glitch-color-2: #ff6600;
}

/* Continuous glitch effect */
.glitch-effect--continuous .glitch-effect__layer {
  animation: glitch-layer-continuous 2s infinite;
}

/* Hover trigger */
.glitch-effect--hover:hover .glitch-effect__layer {
  opacity: var(--layer-opacity);
  animation: glitch-layer 0.1s infinite;
}

/* Keyframe animations */
@keyframes glitch-layer {
  0%, 100% { 
    transform: translateX(0) skew(0deg); 
    filter: hue-rotate(0deg);
  }
  20% { 
    transform: translateX(var(--layer-offset)) skew(2deg); 
    filter: hue-rotate(90deg);
  }
  40% { 
    transform: translateX(calc(-1 * var(--layer-offset))) skew(-2deg); 
    filter: hue-rotate(180deg);
  }
  60% { 
    transform: translateX(var(--layer-offset)) skew(1deg); 
    filter: hue-rotate(270deg);
  }
  80% { 
    transform: translateX(calc(-1 * var(--layer-offset))) skew(-1deg); 
    filter: hue-rotate(360deg);
  }
}

@keyframes glitch-layer-continuous {
  0%, 90%, 100% { 
    opacity: 0;
    transform: translateX(0);
  }
  91%, 99% { 
    opacity: var(--layer-opacity);
    transform: translateX(var(--layer-offset)) skew(2deg);
  }
}

@keyframes scan-line-move {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(10px); opacity: 0; }
}

@keyframes noise-move {
  0% { transform: translate(0, 0); }
  25% { transform: translate(-2px, 2px); }
  50% { transform: translate(2px, -2px); }
  75% { transform: translate(-1px, -1px); }
  100% { transform: translate(1px, 1px); }
}

@keyframes rgb-split-r {
  0%, 100% { transform: translateX(0); }
  33% { transform: translateX(2px); }
  66% { transform: translateX(-1px); }
}

@keyframes rgb-split-g {
  0%, 100% { transform: translateX(0); }
  33% { transform: translateX(-1px); }
  66% { transform: translateX(2px); }
}

@keyframes rgb-split-b {
  0%, 100% { transform: translateX(0); }
  33% { transform: translateX(-2px); }
  66% { transform: translateX(1px); }
}

@keyframes container-shake {
  0%, 100% { transform: translate(0); }
  25% { transform: translate(-1px, 1px); }
  50% { transform: translate(1px, -1px); }
  75% { transform: translate(-1px, -1px); }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .glitch-effect__layer,
  .glitch-effect__scan-line,
  .glitch-effect__noise,
  .glitch-effect__rgb-split-r,
  .glitch-effect__rgb-split-g,
  .glitch-effect__rgb-split-b,
  .glitch-effect {
    animation: none !important;
  }
  
  .glitch-effect--active .glitch-effect__layer {
    opacity: 0.1;
    transform: none;
  }
}
</style>