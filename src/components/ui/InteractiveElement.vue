<template>
  <component
    :is="tag"
    ref="elementRef"
    :class="[
      'interactive-element',
      `interactive-element--${variant}`,
      { 
        'interactive-element--disabled': disabled,
        'interactive-element--glitch-active': glitchActive
      }
    ]"
    :disabled="disabled"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @mousedown="onMouseDown"
    @mouseup="onMouseUp"
    @click="onClick"
    @focus="onFocus"
    @blur="onBlur"
  >
    <slot />
    
    <!-- Scan line effect -->
    <div v-if="showScanLine" class="interactive-element__scan-line" ref="scanLineRef"></div>
    
    <!-- Glow effect -->
    <div v-if="showGlow" class="interactive-element__glow" ref="glowRef"></div>
    
    <!-- Ripple effect -->
    <div v-if="showRipple" class="interactive-element__ripple-container" ref="rippleContainerRef"></div>
    
    <!-- Glitch overlay -->
    <div v-if="glitchActive" class="interactive-element__glitch-overlay"></div>
  </component>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAnimations } from '../../composables/useAnimations'
import { useSoundEffects } from '../../composables/useSoundEffects'

interface Props {
  tag?: string
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'success' | 'warning' | 'danger'
  disabled?: boolean
  showScanLine?: boolean
  showGlow?: boolean
  showRipple?: boolean
  enableGlitch?: boolean
  enableSounds?: boolean
  glitchIntensity?: 'low' | 'medium' | 'high'
  hoverScale?: number
  clickScale?: number
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'div',
  variant: 'primary',
  disabled: false,
  showScanLine: true,
  showGlow: true,
  showRipple: true,
  enableGlitch: false,
  enableSounds: true,
  glitchIntensity: 'medium',
  hoverScale: 1.02,
  clickScale: 0.98
})

const emit = defineEmits<{
  click: [event: MouseEvent]
  hover: [isHovered: boolean]
  focus: [isFocused: boolean]
}>()

const elementRef = ref<HTMLElement>()
const scanLineRef = ref<HTMLElement>()
const glowRef = ref<HTMLElement>()
const rippleContainerRef = ref<HTMLElement>()

const isHovered = ref(false)
const isFocused = ref(false)
const isPressed = ref(false)
const glitchActive = ref(false)

const { createGlitchEffect, createMicroInteraction, isReducedMotion } = useAnimations()
const { playSound } = useSoundEffects()

let cleanupMicroInteraction: (() => void) | undefined
let glitchTimeout: NodeJS.Timeout | undefined

onMounted(() => {
  if (elementRef.value && !isReducedMotion.value) {
    cleanupMicroInteraction = createMicroInteraction(elementRef.value, 'hover')
  }
})

onUnmounted(() => {
  if (cleanupMicroInteraction) {
    cleanupMicroInteraction()
  }
  if (glitchTimeout) {
    clearTimeout(glitchTimeout)
  }
})

const onMouseEnter = () => {
  if (props.disabled) return
  
  isHovered.value = true
  emit('hover', true)
  
  if (props.enableSounds) {
    playSound('hover')
  }
  
  // Trigger scan line animation
  if (scanLineRef.value && props.showScanLine) {
    scanLineRef.value.style.animation = 'scan-line 0.6s ease-out'
  }
  
  // Trigger glow effect
  if (glowRef.value && props.showGlow) {
    glowRef.value.style.opacity = '1'
  }
}

const onMouseLeave = () => {
  if (props.disabled) return
  
  isHovered.value = false
  isPressed.value = false
  emit('hover', false)
  
  // Reset scan line
  if (scanLineRef.value) {
    scanLineRef.value.style.animation = ''
  }
  
  // Reset glow
  if (glowRef.value) {
    glowRef.value.style.opacity = '0'
  }
}

const onMouseDown = () => {
  if (props.disabled) return
  isPressed.value = true
}

const onMouseUp = () => {
  if (props.disabled) return
  isPressed.value = false
}

const onClick = (event: MouseEvent) => {
  if (props.disabled) return
  
  emit('click', event)
  
  if (props.enableSounds) {
    playSound('click')
  }
  
  // Create ripple effect
  if (props.showRipple && rippleContainerRef.value) {
    createRippleEffect(event)
  }
  
  // Trigger glitch effect
  if (props.enableGlitch && elementRef.value) {
    triggerGlitch()
  }
}

const onFocus = () => {
  if (props.disabled) return
  
  isFocused.value = true
  emit('focus', true)
}

const onBlur = () => {
  if (props.disabled) return
  
  isFocused.value = false
  emit('focus', false)
}

const createRippleEffect = (event: MouseEvent) => {
  if (!rippleContainerRef.value || isReducedMotion.value) return
  
  const rect = rippleContainerRef.value.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = event.clientX - rect.left - size / 2
  const y = event.clientY - rect.top - size / 2
  
  const ripple = document.createElement('div')
  ripple.className = 'interactive-element__ripple'
  ripple.style.width = ripple.style.height = size + 'px'
  ripple.style.left = x + 'px'
  ripple.style.top = y + 'px'
  
  rippleContainerRef.value.appendChild(ripple)
  
  // Remove ripple after animation
  setTimeout(() => {
    if (ripple.parentNode) {
      ripple.parentNode.removeChild(ripple)
    }
  }, 600)
}

const triggerGlitch = () => {
  if (!elementRef.value || isReducedMotion.value) return
  
  glitchActive.value = true
  
  createGlitchEffect(elementRef.value, {
    intensity: props.glitchIntensity,
    duration: 300,
    frequency: 0.3
  })
  
  if (glitchTimeout) {
    clearTimeout(glitchTimeout)
  }
  
  glitchTimeout = setTimeout(() => {
    glitchActive.value = false
  }, 300)
}
</script>

<style scoped>
.interactive-element {
  @apply relative overflow-hidden transition-all duration-300 cursor-pointer;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.interactive-element--disabled {
  @apply cursor-not-allowed opacity-50;
  pointer-events: none;
}

.interactive-element--primary {
  @apply focus:ring-brand-primary;
}

.interactive-element--secondary {
  @apply focus:ring-accent-cyan;
}

.interactive-element--accent {
  @apply focus:ring-accent-magenta;
}

.interactive-element--ghost {
  @apply focus:ring-text-muted;
}

.interactive-element--success {
  @apply focus:ring-success;
}

.interactive-element--warning {
  @apply focus:ring-warning;
}

.interactive-element--danger {
  @apply focus:ring-error;
}

.interactive-element:hover:not(.interactive-element--disabled) {
  transform: translateY(-1px) scale(v-bind('props.hoverScale'));
}

.interactive-element:active:not(.interactive-element--disabled) {
  transform: translateY(0) scale(v-bind('props.clickScale'));
}

.interactive-element__scan-line {
  @apply absolute top-0 left-0 w-full h-0.5 opacity-0;
  background: linear-gradient(90deg, transparent 0%, currentColor 50%, transparent 100%);
  pointer-events: none;
}

.interactive-element__glow {
  @apply absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none;
  background: radial-gradient(circle at center, currentColor 0%, transparent 70%);
  filter: blur(10px);
}

.interactive-element__ripple-container {
  @apply absolute inset-0 overflow-hidden pointer-events-none;
  border-radius: inherit;
}

.interactive-element__ripple {
  @apply absolute rounded-full pointer-events-none;
  background: currentColor;
  opacity: 0.3;
  transform: scale(0);
  animation: ripple 0.6s ease-out;
}

.interactive-element__glitch-overlay {
  @apply absolute inset-0 pointer-events-none;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(0, 255, 255, 0.1) 25%,
    transparent 50%,
    rgba(255, 0, 255, 0.1) 75%,
    transparent 100%
  );
  animation: glitch-overlay 0.3s ease-out;
}

.interactive-element--glitch-active {
  animation: element-glitch 0.3s ease-out;
}

@keyframes scan-line {
  0% {
    opacity: 0;
    transform: translateX(-100%);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(100%);
  }
}

@keyframes ripple {
  to {
    transform: scale(2);
    opacity: 0;
  }
}

@keyframes glitch-overlay {
  0%, 100% {
    opacity: 0;
    transform: translateX(0);
  }
  25% {
    opacity: 1;
    transform: translateX(-2px);
  }
  50% {
    opacity: 0.8;
    transform: translateX(2px);
  }
  75% {
    opacity: 1;
    transform: translateX(-1px);
  }
}

@keyframes element-glitch {
  0%, 100% {
    transform: translate(0) skew(0deg);
  }
  20% {
    transform: translate(-1px, 1px) skew(1deg);
  }
  40% {
    transform: translate(-1px, -1px) skew(-1deg);
  }
  60% {
    transform: translate(1px, 1px) skew(1deg);
  }
  80% {
    transform: translate(1px, -1px) skew(-1deg);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .interactive-element,
  .interactive-element__scan-line,
  .interactive-element__glow,
  .interactive-element__ripple,
  .interactive-element__glitch-overlay {
    animation: none !important;
    transition: none !important;
  }
  
  .interactive-element:hover:not(.interactive-element--disabled) {
    transform: none;
  }
  
  .interactive-element:active:not(.interactive-element--disabled) {
    transform: none;
  }
}
</style>