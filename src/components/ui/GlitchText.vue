<template>
  <div class="glitch-container" :class="{ 'glitch-container--intense': intense }">
    <div 
      class="glitch-text" 
      :class="{ 
        'glitch-text--active': active,
        'glitch-text--typing': typing,
        [`glitch-text--${variant}`]: variant
      }"
      :data-text="displayText"
      :style="{ fontSize: size }"
    >
      {{ displayText }}
    </div>
    <div v-if="showScanLines" class="glitch-scan-lines">
      <div class="scan-line" v-for="i in 3" :key="i" :style="{ animationDelay: `${i * 0.3}s` }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

interface Props {
  text: string
  active?: boolean
  typing?: boolean
  intense?: boolean
  variant?: 'primary' | 'secondary' | 'accent'
  size?: string
  showScanLines?: boolean
  typingSpeed?: number
}

const props = withDefaults(defineProps<Props>(), {
  active: true,
  typing: false,
  intense: false,
  variant: 'primary',
  size: '1rem',
  showScanLines: false,
  typingSpeed: 100
})

const displayText = ref('')
const typingIndex = ref(0)

const startTyping = () => {
  if (!props.typing) {
    displayText.value = props.text
    return
  }
  
  displayText.value = ''
  typingIndex.value = 0
  
  const typeNextChar = () => {
    if (typingIndex.value < props.text.length) {
      displayText.value += props.text[typingIndex.value]
      typingIndex.value++
      setTimeout(typeNextChar, props.typingSpeed)
    }
  }
  
  typeNextChar()
}

onMounted(() => {
  startTyping()
})

watch(() => props.text, () => {
  startTyping()
})
</script>

<style scoped>
.glitch-container {
  @apply relative inline-block;
}

.glitch-container--intense {
  filter: contrast(1.2) brightness(1.1);
}

.glitch-text {
  @apply relative;
  font-family: 'Orbitron', monospace;
  font-weight: 700;
}

.glitch-text--primary {
  @apply text-text-primary;
}

.glitch-text--secondary {
  @apply text-accent-cyan;
}

.glitch-text--accent {
  @apply text-accent-magenta;
}

.glitch-text--typing::after {
  content: '|';
  @apply text-accent-cyan;
  animation: blink 1s infinite;
  margin-left: 2px;
}

.glitch-text--active {
  animation: glitch 2s infinite;
}

.glitch-text--active::before,
.glitch-text--active::after {
  content: attr(data-text);
  @apply absolute top-0 left-0 w-full h-full;
}

.glitch-text--active::before {
  animation: glitch-1 0.5s infinite;
  color: #00ffff;
  z-index: -1;
  clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
}

.glitch-text--active::after {
  animation: glitch-2 0.5s infinite;
  color: #ff00ff;
  z-index: -2;
  clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
}

.glitch-container--intense .glitch-text--active {
  animation: glitch-intense 1s infinite;
}

.glitch-container--intense .glitch-text--active::before {
  animation: glitch-1-intense 0.3s infinite;
}

.glitch-container--intense .glitch-text--active::after {
  animation: glitch-2-intense 0.3s infinite;
}

.glitch-scan-lines {
  @apply absolute inset-0 pointer-events-none;
}

.scan-line {
  @apply absolute w-full h-px bg-accent-cyan opacity-30;
  animation: scan-move 2s infinite linear;
}

@keyframes glitch {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
}

@keyframes glitch-intense {
  0%, 100% { transform: translate(0) skew(0deg); }
  10% { transform: translate(-4px, 2px) skew(1deg); }
  20% { transform: translate(-2px, -2px) skew(-1deg); }
  30% { transform: translate(4px, 1px) skew(0.5deg); }
  40% { transform: translate(-1px, -3px) skew(-0.5deg); }
  50% { transform: translate(3px, 2px) skew(1deg); }
  60% { transform: translate(2px, -1px) skew(-1deg); }
  70% { transform: translate(-3px, 1px) skew(0.5deg); }
  80% { transform: translate(1px, -2px) skew(-0.5deg); }
  90% { transform: translate(-2px, 3px) skew(1deg); }
}

@keyframes glitch-1 {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-1px, 1px); }
  40% { transform: translate(-1px, -1px); }
  60% { transform: translate(1px, 1px); }
  80% { transform: translate(1px, -1px); }
}

@keyframes glitch-1-intense {
  0%, 100% { transform: translate(0); clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%); }
  20% { transform: translate(-3px, 2px); clip-path: polygon(0 15%, 100% 15%, 100% 60%, 0 60%); }
  40% { transform: translate(-2px, -3px); clip-path: polygon(0 25%, 100% 25%, 100% 70%, 0 70%); }
  60% { transform: translate(3px, 1px); clip-path: polygon(0 5%, 100% 5%, 100% 50%, 0 50%); }
  80% { transform: translate(2px, -2px); clip-path: polygon(0 35%, 100% 35%, 100% 80%, 0 80%); }
}

@keyframes glitch-2 {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(1px, -1px); }
  40% { transform: translate(1px, 1px); }
  60% { transform: translate(-1px, -1px); }
  80% { transform: translate(-1px, 1px); }
}

@keyframes glitch-2-intense {
  0%, 100% { transform: translate(0); clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%); }
  20% { transform: translate(2px, -1px); clip-path: polygon(0 40%, 100% 40%, 100% 85%, 0 85%); }
  40% { transform: translate(1px, 2px); clip-path: polygon(0 30%, 100% 30%, 100% 75%, 0 75%); }
  60% { transform: translate(-2px, -1px); clip-path: polygon(0 50%, 100% 50%, 100% 95%, 0 95%); }
  80% { transform: translate(-1px, 1px); clip-path: polygon(0 20%, 100% 20%, 100% 65%, 0 65%); }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

@keyframes scan-move {
  0% { top: 0%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
</style>