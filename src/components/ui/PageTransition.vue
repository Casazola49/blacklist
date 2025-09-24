<template>
  <Transition
    :name="transitionName"
    :mode="mode"
    :appear="appear"
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @after-enter="onAfterEnter"
    @before-leave="onBeforeLeave"
    @leave="onLeave"
    @after-leave="onAfterLeave"
  >
    <slot />
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSoundEffects } from '../../composables/useSoundEffects'

interface Props {
  type?: 'slide' | 'fade' | 'glitch' | 'matrix' | 'hologram' | 'cyber'
  direction?: 'up' | 'down' | 'left' | 'right'
  duration?: number
  mode?: 'in-out' | 'out-in' | 'default'
  appear?: boolean
  playSound?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'fade',
  direction: 'right',
  duration: 600,
  mode: 'out-in',
  appear: true,
  playSound: true
})

const emit = defineEmits<{
  beforeEnter: [el: Element]
  enter: [el: Element]
  afterEnter: [el: Element]
  beforeLeave: [el: Element]
  leave: [el: Element]
  afterLeave: [el: Element]
}>()

const { playSound } = useSoundEffects()

const transitionName = computed(() => {
  return `page-${props.type}-${props.direction}`
})

const onBeforeEnter = (el: Element) => {
  emit('beforeEnter', el)
}

const onEnter = (el: Element) => {
  if (props.playSound) {
    playSound('pageTransition')
  }
  emit('enter', el)
}

const onAfterEnter = (el: Element) => {
  emit('afterEnter', el)
}

const onBeforeLeave = (el: Element) => {
  emit('beforeLeave', el)
}

const onLeave = (el: Element) => {
  emit('leave', el)
}

const onAfterLeave = (el: Element) => {
  emit('afterLeave', el)
}
</script>

<style scoped>
/* Fade transitions */
.page-fade-up-enter-active,
.page-fade-up-leave-active,
.page-fade-down-enter-active,
.page-fade-down-leave-active,
.page-fade-left-enter-active,
.page-fade-left-leave-active,
.page-fade-right-enter-active,
.page-fade-right-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-fade-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.page-fade-up-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

.page-fade-down-enter-from {
  opacity: 0;
  transform: translateY(-30px);
}

.page-fade-down-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.page-fade-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.page-fade-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.page-fade-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.page-fade-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* Slide transitions */
.page-slide-up-enter-active,
.page-slide-up-leave-active,
.page-slide-down-enter-active,
.page-slide-down-leave-active,
.page-slide-left-enter-active,
.page-slide-left-leave-active,
.page-slide-right-enter-active,
.page-slide-right-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-slide-up-enter-from {
  transform: translateY(100%);
}

.page-slide-up-leave-to {
  transform: translateY(-100%);
}

.page-slide-down-enter-from {
  transform: translateY(-100%);
}

.page-slide-down-leave-to {
  transform: translateY(100%);
}

.page-slide-left-enter-from {
  transform: translateX(100%);
}

.page-slide-left-leave-to {
  transform: translateX(-100%);
}

.page-slide-right-enter-from {
  transform: translateX(-100%);
}

.page-slide-right-leave-to {
  transform: translateX(100%);
}

/* Glitch transitions */
.page-glitch-up-enter-active,
.page-glitch-up-leave-active,
.page-glitch-down-enter-active,
.page-glitch-down-leave-active,
.page-glitch-left-enter-active,
.page-glitch-left-leave-active,
.page-glitch-right-enter-active,
.page-glitch-right-leave-active {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-glitch-up-enter-from,
.page-glitch-down-enter-from,
.page-glitch-left-enter-from,
.page-glitch-right-enter-from {
  opacity: 0;
  transform: translateY(20px) skew(5deg);
  filter: hue-rotate(90deg) saturate(2);
}

.page-glitch-up-leave-to,
.page-glitch-down-leave-to,
.page-glitch-left-leave-to,
.page-glitch-right-leave-to {
  opacity: 0;
  transform: translateY(-20px) skew(-5deg);
  filter: hue-rotate(180deg) saturate(0.5);
}

.page-glitch-up-enter-active,
.page-glitch-down-enter-active,
.page-glitch-left-enter-active,
.page-glitch-right-enter-active {
  animation: glitch-enter 0.8s ease-out;
}

.page-glitch-up-leave-active,
.page-glitch-down-leave-active,
.page-glitch-left-leave-active,
.page-glitch-right-leave-active {
  animation: glitch-leave 0.8s ease-in;
}

/* Matrix transitions */
.page-matrix-up-enter-active,
.page-matrix-up-leave-active,
.page-matrix-down-enter-active,
.page-matrix-down-leave-active,
.page-matrix-left-enter-active,
.page-matrix-left-leave-active,
.page-matrix-right-enter-active,
.page-matrix-right-leave-active {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-matrix-up-enter-from,
.page-matrix-down-enter-from,
.page-matrix-left-enter-from,
.page-matrix-right-enter-from {
  opacity: 0;
  transform: scale(0.8);
  filter: brightness(0) contrast(2);
}

.page-matrix-up-leave-to,
.page-matrix-down-leave-to,
.page-matrix-left-leave-to,
.page-matrix-right-leave-to {
  opacity: 0;
  transform: scale(1.2);
  filter: brightness(2) contrast(0.5);
}

.page-matrix-up-enter-active,
.page-matrix-down-enter-active,
.page-matrix-left-enter-active,
.page-matrix-right-enter-active {
  animation: matrix-enter 0.8s ease-out;
}

.page-matrix-up-leave-active,
.page-matrix-down-leave-active,
.page-matrix-left-leave-active,
.page-matrix-right-leave-active {
  animation: matrix-leave 0.8s ease-in;
}

/* Hologram transitions */
.page-hologram-up-enter-active,
.page-hologram-up-leave-active,
.page-hologram-down-enter-active,
.page-hologram-down-leave-active,
.page-hologram-left-enter-active,
.page-hologram-left-leave-active,
.page-hologram-right-enter-active,
.page-hologram-right-leave-active {
  transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-hologram-up-enter-from,
.page-hologram-down-enter-from,
.page-hologram-left-enter-from,
.page-hologram-right-enter-from {
  opacity: 0;
  transform: rotateY(90deg) scale(0.8);
  filter: blur(2px);
}

.page-hologram-up-leave-to,
.page-hologram-down-leave-to,
.page-hologram-left-leave-to,
.page-hologram-right-leave-to {
  opacity: 0;
  transform: rotateY(-90deg) scale(1.2);
  filter: blur(2px);
}

.page-hologram-up-enter-active,
.page-hologram-down-enter-active,
.page-hologram-left-enter-active,
.page-hologram-right-enter-active {
  animation: hologram-enter 0.7s ease-out;
}

.page-hologram-up-leave-active,
.page-hologram-down-leave-active,
.page-hologram-left-leave-active,
.page-hologram-right-leave-active {
  animation: hologram-leave 0.7s ease-in;
}

/* Cyber transitions */
.page-cyber-up-enter-active,
.page-cyber-up-leave-active,
.page-cyber-down-enter-active,
.page-cyber-down-leave-active,
.page-cyber-left-enter-active,
.page-cyber-left-leave-active,
.page-cyber-right-enter-active,
.page-cyber-right-leave-active {
  transition: all 0.9s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-cyber-up-enter-from,
.page-cyber-down-enter-from,
.page-cyber-left-enter-from,
.page-cyber-right-enter-from {
  opacity: 0;
  transform: perspective(1000px) rotateX(45deg) translateZ(-100px);
  filter: brightness(0) saturate(2);
}

.page-cyber-up-leave-to,
.page-cyber-down-leave-to,
.page-cyber-left-leave-to,
.page-cyber-right-leave-to {
  opacity: 0;
  transform: perspective(1000px) rotateX(-45deg) translateZ(100px);
  filter: brightness(2) saturate(0);
}

.page-cyber-up-enter-active,
.page-cyber-down-enter-active,
.page-cyber-left-enter-active,
.page-cyber-right-enter-active {
  animation: cyber-enter 0.9s ease-out;
}

.page-cyber-up-leave-active,
.page-cyber-down-leave-active,
.page-cyber-left-leave-active,
.page-cyber-right-leave-active {
  animation: cyber-leave 0.9s ease-in;
}

/* Keyframe animations */
@keyframes glitch-enter {
  0% {
    opacity: 0;
    transform: translateX(-10px) skew(10deg);
    filter: hue-rotate(90deg) saturate(2);
  }
  20% {
    opacity: 0.3;
    transform: translateX(5px) skew(-5deg);
    filter: hue-rotate(45deg) saturate(1.5);
  }
  40% {
    opacity: 0.7;
    transform: translateX(-3px) skew(3deg);
    filter: hue-rotate(0deg) saturate(1.2);
  }
  60% {
    opacity: 0.9;
    transform: translateX(2px) skew(-2deg);
    filter: hue-rotate(-20deg) saturate(1.1);
  }
  100% {
    opacity: 1;
    transform: translateX(0) skew(0deg);
    filter: hue-rotate(0deg) saturate(1);
  }
}

@keyframes glitch-leave {
  0% {
    opacity: 1;
    transform: translateX(0) skew(0deg);
    filter: hue-rotate(0deg) saturate(1);
  }
  40% {
    opacity: 0.7;
    transform: translateX(3px) skew(-3deg);
    filter: hue-rotate(45deg) saturate(1.5);
  }
  80% {
    opacity: 0.3;
    transform: translateX(-5px) skew(5deg);
    filter: hue-rotate(90deg) saturate(2);
  }
  100% {
    opacity: 0;
    transform: translateX(10px) skew(-10deg);
    filter: hue-rotate(180deg) saturate(0.5);
  }
}

@keyframes matrix-enter {
  0% {
    opacity: 0;
    transform: scale(0.8);
    filter: brightness(0) contrast(2);
  }
  30% {
    opacity: 0.5;
    transform: scale(0.9);
    filter: brightness(0.5) contrast(1.5);
  }
  70% {
    opacity: 0.8;
    transform: scale(1.05);
    filter: brightness(1.2) contrast(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
    filter: brightness(1) contrast(1);
  }
}

@keyframes matrix-leave {
  0% {
    opacity: 1;
    transform: scale(1);
    filter: brightness(1) contrast(1);
  }
  30% {
    opacity: 0.8;
    transform: scale(1.1);
    filter: brightness(1.5) contrast(0.8);
  }
  70% {
    opacity: 0.3;
    transform: scale(1.3);
    filter: brightness(2) contrast(0.5);
  }
  100% {
    opacity: 0;
    transform: scale(1.5);
    filter: brightness(3) contrast(0);
  }
}

@keyframes hologram-enter {
  0% {
    opacity: 0;
    transform: rotateY(90deg) scale(0.8);
    filter: blur(2px);
  }
  50% {
    opacity: 0.7;
    transform: rotateY(45deg) scale(0.9);
    filter: blur(1px);
  }
  100% {
    opacity: 1;
    transform: rotateY(0deg) scale(1);
    filter: blur(0px);
  }
}

@keyframes hologram-leave {
  0% {
    opacity: 1;
    transform: rotateY(0deg) scale(1);
    filter: blur(0px);
  }
  50% {
    opacity: 0.7;
    transform: rotateY(-45deg) scale(1.1);
    filter: blur(1px);
  }
  100% {
    opacity: 0;
    transform: rotateY(-90deg) scale(1.2);
    filter: blur(2px);
  }
}

@keyframes cyber-enter {
  0% {
    opacity: 0;
    transform: perspective(1000px) rotateX(45deg) translateZ(-100px);
    filter: brightness(0) saturate(2);
  }
  25% {
    opacity: 0.3;
    transform: perspective(1000px) rotateX(30deg) translateZ(-50px);
    filter: brightness(0.3) saturate(1.8);
  }
  50% {
    opacity: 0.7;
    transform: perspective(1000px) rotateX(15deg) translateZ(-20px);
    filter: brightness(0.7) saturate(1.4);
  }
  75% {
    opacity: 0.9;
    transform: perspective(1000px) rotateX(5deg) translateZ(-5px);
    filter: brightness(0.9) saturate(1.1);
  }
  100% {
    opacity: 1;
    transform: perspective(1000px) rotateX(0deg) translateZ(0px);
    filter: brightness(1) saturate(1);
  }
}

@keyframes cyber-leave {
  0% {
    opacity: 1;
    transform: perspective(1000px) rotateX(0deg) translateZ(0px);
    filter: brightness(1) saturate(1);
  }
  25% {
    opacity: 0.9;
    transform: perspective(1000px) rotateX(-5deg) translateZ(20px);
    filter: brightness(1.2) saturate(0.9);
  }
  50% {
    opacity: 0.7;
    transform: perspective(1000px) rotateX(-15deg) translateZ(50px);
    filter: brightness(1.5) saturate(0.7);
  }
  75% {
    opacity: 0.3;
    transform: perspective(1000px) rotateX(-30deg) translateZ(80px);
    filter: brightness(1.8) saturate(0.3);
  }
  100% {
    opacity: 0;
    transform: perspective(1000px) rotateX(-45deg) translateZ(100px);
    filter: brightness(2) saturate(0);
  }
}
</style>