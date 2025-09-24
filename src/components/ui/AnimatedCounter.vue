<template>
  <span class="animated-counter">{{ displayValue }}</span>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

interface Props {
  target: number
  duration?: number
  startValue?: number
  decimals?: number
  separator?: string
  prefix?: string
  suffix?: string
}

const props = withDefaults(defineProps<Props>(), {
  duration: 2000,
  startValue: 0,
  decimals: 0,
  separator: ',',
  prefix: '',
  suffix: ''
})

const displayValue = ref('')
const currentValue = ref(props.startValue)

const formatNumber = (num: number): string => {
  const rounded = Number(num.toFixed(props.decimals))
  const parts = rounded.toString().split('.')
  
  // Add thousand separators
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, props.separator)
  
  const formatted = parts.join('.')
  return `${props.prefix}${formatted}${props.suffix}`
}

const animateCounter = () => {
  const startTime = Date.now()
  const startValue = currentValue.value
  const difference = props.target - startValue
  
  const updateCounter = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / props.duration, 1)
    
    // Easing function (ease-out)
    const easeOut = 1 - Math.pow(1 - progress, 3)
    
    currentValue.value = startValue + (difference * easeOut)
    displayValue.value = formatNumber(currentValue.value)
    
    if (progress < 1) {
      requestAnimationFrame(updateCounter)
    } else {
      currentValue.value = props.target
      displayValue.value = formatNumber(props.target)
    }
  }
  
  requestAnimationFrame(updateCounter)
}

onMounted(() => {
  // Initialize display value
  displayValue.value = formatNumber(props.startValue)
  
  // Small delay to make the animation more noticeable
  setTimeout(() => {
    animateCounter()
  }, 100)
})

watch(() => props.target, () => {
  animateCounter()
})
</script>

<style scoped>
.animated-counter {
  font-variant-numeric: tabular-nums;
  font-family: 'JetBrains Mono', monospace;
}
</style>