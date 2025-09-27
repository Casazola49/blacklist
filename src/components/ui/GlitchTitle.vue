<template>
  <div class="glitch-title-container">
    <h1 class="glitch-title" :class="{ 'glitch-active': isGlitching }">
      <span class="glitch-text" data-text="THE BLACKLIST">THE BLACKLIST</span>
      <span class="glitch-layer glitch-layer-1" data-text="THE BLACKLIST">THE BLACKLIST</span>
      <span class="glitch-layer glitch-layer-2" data-text="THE BLACKLIST">THE BLACKLIST</span>
      <span class="glitch-layer glitch-layer-3" data-text="THE BLACKLIST">THE BLACKLIST</span>
    </h1>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isGlitching = ref(false)
let glitchInterval: NodeJS.Timeout

const triggerGlitch = () => {
  isGlitching.value = true
  setTimeout(() => {
    isGlitching.value = false
  }, 500)
}

onMounted(() => {
  // Trigger glitch effect every 3-5 seconds
  glitchInterval = setInterval(() => {
    triggerGlitch()
  }, 3000 + Math.random() * 2000)
})

onUnmounted(() => {
  if (glitchInterval) {
    clearInterval(glitchInterval)
  }
})
</script>

<style scoped>
.glitch-title-container {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: visible;
}

.glitch-title {
  position: relative;
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  font-size: clamp(3rem, 8vw, 8rem);
  line-height: 0.9;
  color: #ffffff;
  text-align: center;
  white-space: nowrap;
  letter-spacing: 0.1em;
  padding: 0 1rem;
  transform: scale(1.1);
  text-shadow: 
    0 0 30px rgba(0, 255, 255, 1),
    0 0 60px rgba(0, 255, 255, 0.8),
    0 0 90px rgba(0, 255, 255, 0.6),
    0 0 120px rgba(0, 255, 255, 0.4);
  animation: title-pulse 4s ease-in-out infinite;
}

.glitch-text {
  position: relative;
  z-index: 3;
}

.glitch-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
  letter-spacing: inherit;
  text-align: inherit;
  white-space: inherit;
  padding: inherit;
  opacity: 0;
  pointer-events: none;
}

.glitch-layer-1 {
  color: #ff00ff;
  z-index: 2;
}

.glitch-layer-2 {
  color: #00ffff;
  z-index: 1;
}

.glitch-layer-3 {
  color: #ffff00;
  z-index: 0;
}

/* Normal pulse animation */
@keyframes title-pulse {
  0%, 100% {
    text-shadow: 
      0 0 30px rgba(0, 255, 255, 1),
      0 0 60px rgba(0, 255, 255, 0.8),
      0 0 90px rgba(0, 255, 255, 0.6),
      0 0 120px rgba(0, 255, 255, 0.4);
    transform: scale(1.1);
  }
  50% {
    text-shadow: 
      0 0 40px rgba(0, 255, 255, 1),
      0 0 80px rgba(0, 255, 255, 0.9),
      0 0 120px rgba(0, 255, 255, 0.7),
      0 0 160px rgba(0, 255, 255, 0.5);
    transform: scale(1.12);
  }
}

/* Glitch active state */
.glitch-active {
  animation: glitch-main 0.5s ease-in-out;
}

.glitch-active .glitch-layer-1 {
  opacity: 0.8;
  animation: glitch-1 0.5s ease-in-out;
}

.glitch-active .glitch-layer-2 {
  opacity: 0.7;
  animation: glitch-2 0.5s ease-in-out;
}

.glitch-active .glitch-layer-3 {
  opacity: 0.6;
  animation: glitch-3 0.5s ease-in-out;
}

@keyframes glitch-main {
  0%, 100% {
    transform: scale(1.1) translate(0);
    filter: hue-rotate(0deg) contrast(1);
  }
  10% {
    transform: scale(1.15) translate(-5px, 2px);
    filter: hue-rotate(90deg) contrast(1.2);
  }
  20% {
    transform: scale(1.08) translate(3px, -4px);
    filter: hue-rotate(180deg) contrast(0.8);
  }
  30% {
    transform: scale(1.18) translate(-2px, 3px);
    filter: hue-rotate(270deg) contrast(1.5);
  }
  40% {
    transform: scale(1.05) translate(4px, -1px);
    filter: hue-rotate(360deg) contrast(0.9);
  }
  50% {
    transform: scale(1.2) translate(-3px, 2px);
    filter: hue-rotate(45deg) contrast(1.3);
  }
  60% {
    transform: scale(1.1) translate(2px, -3px);
    filter: hue-rotate(135deg) contrast(1.1);
  }
  70% {
    transform: scale(1.16) translate(-4px, 1px);
    filter: hue-rotate(225deg) contrast(0.7);
  }
  80% {
    transform: scale(1.07) translate(1px, 4px);
    filter: hue-rotate(315deg) contrast(1.4);
  }
  90% {
    transform: scale(1.14) translate(-1px, -2px);
    filter: hue-rotate(0deg) contrast(1);
  }
}

@keyframes glitch-1 {
  0%, 100% {
    transform: translate(0) skew(0deg);
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
  10% {
    transform: translate(-8px, 3px) skew(-2deg);
    clip-path: polygon(0 20%, 100% 20%, 100% 21%, 0 21%);
  }
  20% {
    transform: translate(5px, -2px) skew(1deg);
    clip-path: polygon(0 40%, 100% 40%, 100% 41%, 0 41%);
  }
  30% {
    transform: translate(-3px, 4px) skew(-3deg);
    clip-path: polygon(0 60%, 100% 60%, 100% 61%, 0 61%);
  }
  40% {
    transform: translate(7px, -1px) skew(2deg);
    clip-path: polygon(0 80%, 100% 80%, 100% 81%, 0 81%);
  }
  50% {
    transform: translate(-4px, 2px) skew(-1deg);
    clip-path: polygon(0 10%, 100% 10%, 100% 30%, 0 30%);
  }
  60% {
    transform: translate(2px, -5px) skew(3deg);
    clip-path: polygon(0 50%, 100% 50%, 100% 70%, 0 70%);
  }
  70% {
    transform: translate(-6px, 1px) skew(-2deg);
    clip-path: polygon(0 0%, 100% 0%, 100% 15%, 0 15%);
  }
  80% {
    transform: translate(4px, 3px) skew(1deg);
    clip-path: polygon(0 85%, 100% 85%, 100% 100%, 0 100%);
  }
  90% {
    transform: translate(-2px, -1px) skew(-1deg);
    clip-path: polygon(0 35%, 100% 35%, 100% 55%, 0 55%);
  }
}

@keyframes glitch-2 {
  0%, 100% {
    transform: translate(0) skew(0deg) scale(1);
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
  15% {
    transform: translate(6px, -4px) skew(2deg) scale(1.02);
    clip-path: polygon(0 15%, 100% 15%, 100% 16%, 0 16%);
  }
  25% {
    transform: translate(-4px, 3px) skew(-1deg) scale(0.98);
    clip-path: polygon(0 35%, 100% 35%, 100% 36%, 0 36%);
  }
  35% {
    transform: translate(3px, 2px) skew(3deg) scale(1.01);
    clip-path: polygon(0 55%, 100% 55%, 100% 56%, 0 56%);
  }
  45% {
    transform: translate(-5px, -1px) skew(-2deg) scale(0.99);
    clip-path: polygon(0 75%, 100% 75%, 100% 76%, 0 76%);
  }
  55% {
    transform: translate(4px, -3px) skew(1deg) scale(1.03);
    clip-path: polygon(0 5%, 100% 5%, 100% 25%, 0 25%);
  }
  65% {
    transform: translate(-2px, 4px) skew(-3deg) scale(0.97);
    clip-path: polygon(0 45%, 100% 45%, 100% 65%, 0 65%);
  }
  75% {
    transform: translate(1px, -2px) skew(2deg) scale(1.01);
    clip-path: polygon(0 0%, 100% 0%, 100% 10%, 0 10%);
  }
  85% {
    transform: translate(-7px, 1px) skew(-1deg) scale(0.98);
    clip-path: polygon(0 90%, 100% 90%, 100% 100%, 0 100%);
  }
  95% {
    transform: translate(3px, 2px) skew(1deg) scale(1.02);
    clip-path: polygon(0 25%, 100% 25%, 100% 45%, 0 45%);
  }
}

@keyframes glitch-3 {
  0%, 100% {
    transform: translate(0) skew(0deg) rotateX(0deg);
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
  12% {
    transform: translate(-3px, 5px) skew(1deg) rotateX(2deg);
    clip-path: polygon(0 12%, 100% 12%, 100% 13%, 0 13%);
  }
  24% {
    transform: translate(4px, -2px) skew(-2deg) rotateX(-1deg);
    clip-path: polygon(0 32%, 100% 32%, 100% 33%, 0 33%);
  }
  36% {
    transform: translate(-2px, 3px) skew(3deg) rotateX(3deg);
    clip-path: polygon(0 52%, 100% 52%, 100% 53%, 0 53%);
  }
  48% {
    transform: translate(5px, -4px) skew(-1deg) rotateX(-2deg);
    clip-path: polygon(0 72%, 100% 72%, 100% 73%, 0 73%);
  }
  60% {
    transform: translate(-4px, 1px) skew(2deg) rotateX(1deg);
    clip-path: polygon(0 2%, 100% 2%, 100% 22%, 0 22%);
  }
  72% {
    transform: translate(2px, -3px) skew(-3deg) rotateX(-3deg);
    clip-path: polygon(0 42%, 100% 42%, 100% 62%, 0 62%);
  }
  84% {
    transform: translate(-1px, 4px) skew(1deg) rotateX(2deg);
    clip-path: polygon(0 82%, 100% 82%, 100% 100%, 0 100%);
  }
  96% {
    transform: translate(3px, -1px) skew(-2deg) rotateX(-1deg);
    clip-path: polygon(0 22%, 100% 22%, 100% 42%, 0 42%);
  }
}

/* Responsive adjustments */
@media (min-width: 1024px) {
  .glitch-title {
    font-size: clamp(4rem, 7vw, 7rem);
    transform: scale(1.15);
    letter-spacing: 0.15em;
    padding: 0 2rem;
  }
}

@media (min-width: 1440px) {
  .glitch-title {
    font-size: clamp(5rem, 6.5vw, 8rem);
    transform: scale(1.2);
    letter-spacing: 0.2em;
  }
}

@media (min-width: 1920px) {
  .glitch-title {
    font-size: clamp(6rem, 6vw, 9rem);
    transform: scale(1.25);
    letter-spacing: 0.25em;
  }
}

@media (min-width: 2560px) {
  .glitch-title {
    font-size: clamp(7rem, 5.5vw, 10rem);
    transform: scale(1.3);
    letter-spacing: 0.3em;
  }
}

@media (max-width: 767px) {
  .glitch-title {
    font-size: clamp(2.5rem, 10vw, 4rem);
    transform: scale(1.05);
    letter-spacing: 0.05em;
    padding: 0 0.5rem;
  }
}
</style>