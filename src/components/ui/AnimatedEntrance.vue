<template>
  <div
    ref="containerRef"
    :class="[
      'animated-entrance',
      { 'animated-entrance--visible': isVisible }
    ]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAnimations } from '../../composables/useAnimations'

interface Props {
  animation?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scaleIn' | 'glitchIn'
  delay?: number
  duration?: number
  threshold?: number
  triggerOnce?: boolean
  stagger?: number
  staggerChildren?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  animation: 'fadeIn',
  delay: 0,
  duration: 600,
  threshold: 0.1,
  triggerOnce: true,
  stagger: 0,
  staggerChildren: false
})

const containerRef = ref<HTMLElement>()
const isVisible = ref(false)
const hasTriggered = ref(false)

const { createEntranceAnimation, isReducedMotion } = useAnimations()

let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!containerRef.value) return

  // If reduced motion is preferred, show immediately
  if (isReducedMotion.value) {
    isVisible.value = true
    return
  }

  // Set up intersection observer
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && (!hasTriggered.value || !props.triggerOnce)) {
          triggerAnimation()
          hasTriggered.value = true
        } else if (!entry.isIntersecting && !props.triggerOnce) {
          isVisible.value = false
        }
      })
    },
    {
      threshold: props.threshold,
      rootMargin: '50px'
    }
  )

  observer.observe(containerRef.value)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

const triggerAnimation = () => {
  if (!containerRef.value || isReducedMotion.value) {
    isVisible.value = true
    return
  }

  setTimeout(() => {
    if (containerRef.value) {
      isVisible.value = true

      if (props.staggerChildren) {
        animateChildren()
      } else {
        createEntranceAnimation(containerRef.value, props.animation, {
          duration: props.duration,
          delay: props.delay
        })
      }
    }
  }, props.stagger)
}

const animateChildren = () => {
  if (!containerRef.value) return

  const children = Array.from(containerRef.value.children) as HTMLElement[]
  
  children.forEach((child, index) => {
    const childDelay = props.delay + (index * 100) // 100ms stagger between children
    
    setTimeout(() => {
      createEntranceAnimation(child, props.animation, {
        duration: props.duration,
        delay: 0 // Delay is handled by setTimeout
      })
    }, childDelay)
  })
}

// Expose method to manually trigger animation
const trigger = () => {
  triggerAnimation()
}

defineExpose({
  trigger
})
</script>

<style scoped>
.animated-entrance {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.animated-entrance--visible {
  opacity: 1;
}

/* Animation classes for different entrance types */
.animated-entrance:not(.animated-entrance--visible) {
  /* fadeIn */
  opacity: 0;
}

.animated-entrance:not(.animated-entrance--visible).slide-up {
  opacity: 0;
  transform: translateY(30px);
}

.animated-entrance:not(.animated-entrance--visible).slide-down {
  opacity: 0;
  transform: translateY(-30px);
}

.animated-entrance:not(.animated-entrance--visible).slide-left {
  opacity: 0;
  transform: translateX(30px);
}

.animated-entrance:not(.animated-entrance--visible).slide-right {
  opacity: 0;
  transform: translateX(-30px);
}

.animated-entrance:not(.animated-entrance--visible).scale-in {
  opacity: 0;
  transform: scale(0.8);
}

.animated-entrance:not(.animated-entrance--visible).glitch-in {
  opacity: 0;
  transform: translateX(-10px) skew(10deg);
  filter: hue-rotate(90deg);
}

/* Staggered children animation */
.animated-entrance.stagger-children > * {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.animated-entrance--visible.stagger-children > * {
  opacity: 1;
  transform: translateY(0);
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .animated-entrance,
  .animated-entrance > * {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
    animation: none !important;
  }
}
</style>