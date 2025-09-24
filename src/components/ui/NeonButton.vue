<template>
  <InteractiveElement
    tag="button"
    :variant="variant"
    :disabled="disabled || loading"
    :enable-glitch="enableGlitch"
    :enable-sounds="enableSounds"
    :glitch-intensity="glitchIntensity"
    :class="[
      'neon-button',
      `neon-button--${variant}`,
      `neon-button--${size}`,
      { 'neon-button--loading': loading, 'neon-button--disabled': disabled || loading }
    ]"
    @click="$emit('click', $event)"
    @hover="onHover"
  >
    <span v-if="loading" class="neon-button__loader"></span>
    <span v-else class="neon-button__content">
      <slot />
    </span>
    <div class="neon-button__glow"></div>
    <div class="neon-button__scan-line"></div>
  </InteractiveElement>
</template>

<script setup lang="ts">
import InteractiveElement from './InteractiveElement.vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'success' | 'warning' | 'danger'
  loading?: boolean
  disabled?: boolean
  pulse?: boolean
  size?: 'sm' | 'md' | 'lg'
  enableGlitch?: boolean
  enableSounds?: boolean
  glitchIntensity?: 'low' | 'medium' | 'high'
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  loading: false,
  disabled: false,
  pulse: false,
  size: 'md',
  enableGlitch: true,
  enableSounds: true,
  glitchIntensity: 'medium'
})

const emit = defineEmits<{
  click: [event: MouseEvent]
  hover: [isHovered: boolean]
}>()

const onHover = (isHovered: boolean) => emit('hover', isHovered)
</script>

<style scoped>
.neon-button {
  @apply relative font-semibold uppercase tracking-wider;
  @apply border-2 bg-transparent transition-all duration-300 overflow-hidden;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  font-family: 'Orbitron', monospace;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 100%, 10px 100%);
}

.neon-button--sm {
  @apply px-3 py-1.5 text-xs;
}

.neon-button--md {
  @apply px-6 py-3 text-sm;
}

.neon-button--lg {
  @apply px-8 py-4 text-base;
}

.neon-button--primary {
  @apply border-brand-primary text-brand-primary;
  @apply hover:bg-brand-primary hover:text-bg-primary;
  box-shadow: 0 0 10px #800020;
}

.neon-button--secondary {
  @apply border-accent-cyan text-accent-cyan;
  @apply hover:bg-accent-cyan hover:text-bg-primary;
  box-shadow: 0 0 10px #00ffff;
}

.neon-button--accent {
  @apply border-accent-magenta text-accent-magenta;
  @apply hover:bg-accent-magenta hover:text-bg-primary;
  box-shadow: 0 0 10px #ff00ff;
}

.neon-button--ghost {
  @apply border-text-muted text-text-muted;
  @apply hover:border-text-secondary hover:text-text-secondary;
  box-shadow: none;
}

.neon-button--success {
  @apply border-green-400 text-green-400;
  @apply hover:bg-green-400 hover:text-black;
  box-shadow: 0 0 10px #22c55e;
}

.neon-button--warning {
  @apply border-yellow-400 text-yellow-400;
  @apply hover:bg-yellow-400 hover:text-black;
  box-shadow: 0 0 10px #eab308;
}

.neon-button--danger {
  @apply border-red-400 text-red-400;
  @apply hover:bg-red-400 hover:text-black;
  box-shadow: 0 0 10px #ef4444;
}

.neon-button:hover:not(.neon-button--disabled):not(.neon-button--loading) {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 0 25px currentColor, 0 0 50px currentColor;
}

.neon-button:hover:not(.neon-button--disabled):not(.neon-button--loading) .neon-button__glow {
  @apply opacity-100;
}

.neon-button:hover:not(.neon-button--disabled):not(.neon-button--loading) .neon-button__scan-line {
  animation: scan-line 0.6s ease-out;
}

.neon-button--loading {
  @apply cursor-not-allowed opacity-75;
}

.neon-button--disabled {
  @apply cursor-not-allowed opacity-50;
  box-shadow: none !important;
}

.neon-button__content {
  @apply relative z-10;
}

.neon-button__loader {
  @apply inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin;
}

.neon-button__glow {
  @apply absolute inset-0 opacity-0 transition-opacity duration-300;
  background: radial-gradient(circle at center, currentColor 0%, transparent 70%);
  filter: blur(10px);
}

.neon-button__scan-line {
  @apply absolute top-0 left-0 w-full h-0.5 opacity-0;
  background: linear-gradient(90deg, transparent 0%, currentColor 50%, transparent 100%);
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
</style>