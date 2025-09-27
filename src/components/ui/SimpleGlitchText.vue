<template>
  <span 
    :class="[
      'glitch-text',
      variant === 'primary' ? 'text-accent-cyan' : 'text-text-secondary',
      className
    ]"
  >
    {{ displayText }}
  </span>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface Props {
  text: string
  typing?: boolean
  typingSpeed?: number
  variant?: 'primary' | 'secondary'
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  typing: false,
  typingSpeed: 100,
  variant: 'primary',
  className: ''
})

const displayText = ref('')

const computedText = computed(() => props.text)

onMounted(() => {
  if (props.typing) {
    // Simple typing effect
    let i = 0
    const typeInterval = setInterval(() => {
      if (i < props.text.length) {
        displayText.value = props.text.substring(0, i + 1)
        i++
      } else {
        clearInterval(typeInterval)
      }
    }, props.typingSpeed)
  } else {
    displayText.value = props.text
  }
})

// If not typing, show text immediately
if (!props.typing) {
  displayText.value = props.text
}
</script>

<style scoped>
.glitch-text {
  font-family: 'Orbitron', monospace;
  font-weight: 600;
  text-shadow: 0 0 10px currentColor;
}
</style>