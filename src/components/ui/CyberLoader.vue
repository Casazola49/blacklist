<template>
  <div 
    class="cyber-loader" 
    :class="{ 
      [`cyber-loader--${size}`]: size,
      [`cyber-loader--${variant}`]: variant,
      'cyber-loader--pulsing': pulsing
    }"
  >
    <!-- Main ring with segments -->
    <div class="cyber-loader__ring">
      <div 
        class="cyber-loader__segment" 
        v-for="i in segmentCount" 
        :key="i" 
        :style="{ 
          '--delay': `${i * (0.8 / segmentCount)}s`,
          '--rotation': `${(360 / segmentCount) * i}deg`
        }"
      ></div>
    </div>
    
    <!-- Secondary ring -->
    <div class="cyber-loader__ring cyber-loader__ring--secondary">
      <div 
        class="cyber-loader__segment cyber-loader__segment--secondary" 
        v-for="i in 6" 
        :key="i" 
        :style="{ 
          '--delay': `${i * 0.15}s`,
          '--rotation': `${60 * i}deg`
        }"
      ></div>
    </div>
    
    <!-- Core with pulsing effect -->
    <div class="cyber-loader__core">
      <div class="cyber-loader__core-inner"></div>
    </div>
    
    <!-- Progress indicator -->
    <div v-if="showProgress" class="cyber-loader__progress">
      <div class="cyber-loader__progress-bar" :style="{ width: `${progress}%` }"></div>
    </div>
    
    <!-- Text with typing effect -->
    <div v-if="text" class="cyber-loader__text">
      <span v-for="(char, index) in text" :key="index" :style="{ animationDelay: `${index * 0.1}s` }">
        {{ char === ' ' ? '\u00A0' : char }}
      </span>
    </div>
    
    <!-- Scanning lines -->
    <div class="cyber-loader__scan-lines">
      <div class="scan-line" v-for="i in 2" :key="i" :style="{ animationDelay: `${i * 0.5}s` }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'small' | 'medium' | 'large' | 'xl'
  text?: string
  variant?: 'primary' | 'secondary' | 'accent'
  pulsing?: boolean
  showProgress?: boolean
  progress?: number
  segmentCount?: number
}

withDefaults(defineProps<Props>(), {
  size: 'medium',
  variant: 'primary',
  pulsing: false,
  showProgress: false,
  progress: 0,
  segmentCount: 8
})
</script>

<style scoped>
.cyber-loader {
  @apply relative flex flex-col items-center justify-center;
  width: 60px;
  height: 60px;
}

.cyber-loader--small {
  width: 40px;
  height: 40px;
}

.cyber-loader--medium {
  width: 60px;
  height: 60px;
}

.cyber-loader--large {
  width: 100px;
  height: 100px;
}

.cyber-loader--xl {
  width: 140px;
  height: 140px;
}

.cyber-loader--pulsing {
  animation: loader-pulse 2s ease-in-out infinite;
}

.cyber-loader__ring {
  @apply absolute inset-0;
  border-radius: 50%;
  animation: rotate 2s linear infinite;
}

.cyber-loader__ring--secondary {
  animation: rotate-reverse 3s linear infinite;
  transform: scale(0.7);
}

.cyber-loader__segment {
  @apply absolute w-1 rounded-full;
  height: 15%;
  top: 5%;
  left: 50%;
  transform-origin: 50% 250%;
  transform: translateX(-50%) rotate(var(--rotation));
  animation: segment-pulse 0.8s ease-in-out infinite;
  animation-delay: var(--delay);
}

.cyber-loader__segment--secondary {
  @apply w-0.5;
  height: 12%;
  top: 8%;
}

.cyber-loader--primary .cyber-loader__segment {
  @apply bg-accent-cyan;
}

.cyber-loader--secondary .cyber-loader__segment {
  @apply bg-brand-primary;
}

.cyber-loader--accent .cyber-loader__segment {
  @apply bg-accent-magenta;
}

.cyber-loader--primary .cyber-loader__segment--secondary {
  @apply bg-accent-magenta;
}

.cyber-loader--secondary .cyber-loader__segment--secondary {
  @apply bg-accent-cyan;
}

.cyber-loader--accent .cyber-loader__segment--secondary {
  @apply bg-brand-primary;
}

.cyber-loader__core {
  @apply absolute rounded-full;
  width: 25%;
  height: 25%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: core-glow 1.5s ease-in-out infinite alternate;
}

.cyber-loader--primary .cyber-loader__core {
  @apply bg-brand-primary;
}

.cyber-loader--secondary .cyber-loader__core {
  @apply bg-accent-cyan;
}

.cyber-loader--accent .cyber-loader__core {
  @apply bg-accent-magenta;
}

.cyber-loader__core-inner {
  @apply absolute inset-1 rounded-full bg-bg-primary;
  animation: inner-pulse 1s ease-in-out infinite alternate;
}

.cyber-loader__progress {
  @apply absolute bottom-0 left-0 w-full h-1 bg-bg-tertiary rounded-full overflow-hidden;
  margin-bottom: -8px;
}

.cyber-loader__progress-bar {
  @apply h-full bg-accent-cyan transition-all duration-300;
  background: linear-gradient(90deg, 
    theme('colors.accent-cyan'), 
    theme('colors.accent-magenta'), 
    theme('colors.accent-cyan')
  );
  animation: progress-glow 1s ease-in-out infinite alternate;
}

.cyber-loader__text {
  @apply mt-6 text-xs font-mono uppercase tracking-wider;
  color: theme('colors.accent-cyan');
}

.cyber-loader--large .cyber-loader__text,
.cyber-loader--xl .cyber-loader__text {
  @apply mt-8 text-sm;
}

.cyber-loader__text span {
  @apply inline-block;
  animation: text-appear 0.5s ease-out forwards;
  opacity: 0;
  transform: translateY(10px);
}

.cyber-loader__scan-lines {
  @apply absolute inset-0 pointer-events-none;
}

.scan-line {
  @apply absolute w-full h-px bg-accent-cyan opacity-30;
  animation: scan-vertical 2s infinite linear;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes rotate-reverse {
  from { transform: rotate(360deg) scale(0.7); }
  to { transform: rotate(0deg) scale(0.7); }
}

@keyframes segment-pulse {
  0%, 100% { 
    opacity: 0.3; 
    transform: translateX(-50%) rotate(var(--rotation)) scaleY(0.5); 
  }
  50% { 
    opacity: 1; 
    transform: translateX(-50%) rotate(var(--rotation)) scaleY(1); 
  }
}

@keyframes core-glow {
  from { 
    box-shadow: 0 0 5px currentColor; 
    transform: translate(-50%, -50%) scale(1);
  }
  to { 
    box-shadow: 0 0 20px currentColor, 0 0 30px currentColor; 
    transform: translate(-50%, -50%) scale(1.1);
  }
}

@keyframes inner-pulse {
  from { transform: scale(0.8); opacity: 0.8; }
  to { transform: scale(1.2); opacity: 0.4; }
}

@keyframes loader-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes progress-glow {
  from { box-shadow: 0 0 5px currentColor; }
  to { box-shadow: 0 0 15px currentColor; }
}

@keyframes text-appear {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scan-vertical {
  0% { top: 0%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
</style>