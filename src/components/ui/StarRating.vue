<template>
  <div class="star-rating">
    <div class="stars-container">
      <div
        v-for="star in 5"
        :key="star"
        class="star"
        :class="{
          'filled': star <= currentRating,
          'hoverable': !readonly,
          'animated': animated
        }"
        @click="!readonly && selectRating(star)"
        @mouseenter="!readonly && setHoverRating(star)"
        @mouseleave="!readonly && resetHover()"
      >
        <div class="star-inner">
          <svg
            viewBox="0 0 24 24"
            class="star-icon"
            :class="{ 'glow': star <= currentRating }"
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              :fill="star <= currentRating ? fillColor : 'transparent'"
              :stroke="star <= currentRating ? fillColor : strokeColor"
              stroke-width="1.5"
            />
          </svg>
        </div>
      </div>
    </div>
    
    <div v-if="showLabel" class="rating-label">
      <span class="rating-text">{{ getRatingText(currentRating) }}</span>
      <span v-if="showNumeric" class="rating-numeric">{{ currentRating }}/5</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  modelValue?: number
  readonly?: boolean
  animated?: boolean
  showLabel?: boolean
  showNumeric?: boolean
  size?: 'small' | 'medium' | 'large'
  fillColor?: string
  strokeColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  readonly: false,
  animated: true,
  showLabel: false,
  showNumeric: false,
  size: 'medium',
  fillColor: '#00FFFF',
  strokeColor: '#666666'
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'change': [value: number]
}>()

const currentRating = ref(props.modelValue)
const hoverRating = ref(0)

const displayRating = computed(() => {
  return hoverRating.value || currentRating.value
})

watch(() => props.modelValue, (newValue) => {
  currentRating.value = newValue
})

const selectRating = (rating: number) => {
  currentRating.value = rating
  emit('update:modelValue', rating)
  emit('change', rating)
}

const setHoverRating = (rating: number) => {
  hoverRating.value = rating
}

const resetHover = () => {
  hoverRating.value = 0
}

const getRatingText = (rating: number): string => {
  const texts = {
    0: 'Sin calificar',
    1: 'Muy malo',
    2: 'Malo',
    3: 'Regular',
    4: 'Bueno',
    5: 'Excelente'
  }
  return texts[rating as keyof typeof texts] || 'Sin calificar'
}
</script>

<style scoped>
.star-rating {
  @apply flex flex-col items-center gap-2;
}

.stars-container {
  @apply flex gap-1;
}

.star {
  @apply relative cursor-pointer transition-all duration-300;
  transform-origin: center;
}

.star.hoverable:hover {
  transform: scale(1.1);
}

.star.animated {
  animation: starPulse 2s infinite;
}

.star.filled .star-inner {
  animation: starGlow 1.5s ease-in-out infinite alternate;
}

.star-inner {
  @apply relative;
}

.star-icon {
  @apply w-8 h-8 transition-all duration-300;
}

.star-icon.glow {
  filter: drop-shadow(0 0 8px currentColor);
}

.star.size-small .star-icon {
  @apply w-5 h-5;
}

.star.size-large .star-icon {
  @apply w-12 h-12;
}

.rating-label {
  @apply flex flex-col items-center gap-1 text-center;
}

.rating-text {
  @apply text-sm font-medium text-cyan-400;
  font-family: 'Orbitron', monospace;
}

.rating-numeric {
  @apply text-xs text-gray-400;
  font-family: 'Orbitron', monospace;
}

@keyframes starPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes starGlow {
  0% {
    filter: drop-shadow(0 0 4px #00FFFF);
  }
  100% {
    filter: drop-shadow(0 0 12px #00FFFF) drop-shadow(0 0 20px #00FFFF);
  }
}

/* Responsive sizing */
@media (max-width: 640px) {
  .star-icon {
    @apply w-6 h-6;
  }
  
  .star.size-small .star-icon {
    @apply w-4 h-4;
  }
  
  .star.size-large .star-icon {
    @apply w-10 h-10;
  }
}
</style>