<template>
  <div class="glitch-title-container">
    <h1 class="glitch-title" data-text="THE BLACKLIST">
      THE BLACKLIST
    </h1>
    <div class="glitch-layers">
      <div class="glitch-layer layer-1" data-text="THE BLACKLIST">THE BLACKLIST</div>
      <div class="glitch-layer layer-2" data-text="THE BLACKLIST">THE BLACKLIST</div>
      <div class="glitch-layer layer-3" data-text="THE BLACKLIST">THE BLACKLIST</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Simple title component without complex animations
</script>

<style scoped>
.glitch-title-container {
  position: relative;
  display: inline-block;
  padding: 20px;
}

.glitch-title {
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  font-size: clamp(4rem, 12vw, 10rem);
  line-height: 1;
  text-align: center;
  color: #ffffff;
  margin: 0;
  padding: 0;
  position: relative;
  z-index: 3;
  text-shadow: 
    0 0 10px rgba(255, 255, 255, 0.8),
    0 0 20px rgba(255, 255, 255, 0.6),
    0 0 30px rgba(255, 255, 255, 0.4),
    0 0 40px rgba(0, 255, 255, 0.3);
  animation: mainGlitch 1.5s infinite;
}

.glitch-layers {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.glitch-layer {
  position: absolute;
  top: 20px;
  left: 20px;
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  font-size: clamp(4rem, 12vw, 10rem);
  line-height: 1;
  text-align: center;
  margin: 0;
  padding: 0;
  opacity: 0;
}

.layer-1 {
  color: #ff0040;
  animation: glitch1 1.5s infinite;
  text-shadow: 
    0 0 15px #ff0040,
    0 0 30px #ff0040,
    0 0 45px #ff0040;
}

.layer-2 {
  color: #00ffff;
  animation: glitch2 1.5s infinite;
  text-shadow: 
    0 0 15px #00ffff,
    0 0 30px #00ffff,
    0 0 45px #00ffff;
}

.layer-3 {
  color: #ff00ff;
  animation: glitch3 1.5s infinite;
  text-shadow: 
    0 0 15px #ff00ff,
    0 0 30px #ff00ff,
    0 0 45px #ff00ff;
}

.glitch-title::before,
.glitch-title::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
}

.glitch-title::before {
  color: #ffff00;
  animation: glitchBefore 1.5s infinite;
  clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
  text-shadow: 
    0 0 15px #ffff00,
    0 0 30px #ffff00;
}

.glitch-title::after {
  color: #00ff00;
  animation: glitchAfter 1.5s infinite;
  clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
  text-shadow: 
    0 0 15px #00ff00,
    0 0 30px #00ff00;
}

@keyframes mainGlitch {
  0%, 85%, 100% {
    transform: translate(0);
    filter: hue-rotate(0deg);
  }
  86% {
    transform: translate(-3px, 2px);
    filter: hue-rotate(90deg);
  }
  87% {
    transform: translate(4px, -1px);
    filter: hue-rotate(180deg);
  }
  88% {
    transform: translate(-2px, 3px);
    filter: hue-rotate(270deg);
  }
  89% {
    transform: translate(3px, -2px);
    filter: hue-rotate(360deg);
  }
  90% {
    transform: translate(0);
    filter: hue-rotate(0deg);
  }
}

@keyframes glitch1 {
  0%, 80%, 100% {
    opacity: 0;
    transform: translate(0);
  }
  81% {
    opacity: 0.9;
    transform: translate(-5px, 3px);
  }
  82% {
    opacity: 0;
    transform: translate(6px, -2px);
  }
  83% {
    opacity: 0.8;
    transform: translate(-4px, 4px);
  }
  84% {
    opacity: 0;
  }
}

@keyframes glitch2 {
  0%, 75%, 100% {
    opacity: 0;
    transform: translate(0);
  }
  76% {
    opacity: 0;
  }
  77% {
    opacity: 0.8;
    transform: translate(5px, -3px);
  }
  78% {
    opacity: 0;
    transform: translate(-6px, 2px);
  }
  79% {
    opacity: 0.9;
    transform: translate(4px, -4px);
  }
  80% {
    opacity: 0;
  }
}

@keyframes glitch3 {
  0%, 70%, 100% {
    opacity: 0;
    transform: translate(0);
  }
  71% {
    opacity: 0.7;
    transform: translate(3px, 5px);
  }
  72% {
    opacity: 0;
    transform: translate(-4px, -3px);
  }
  73% {
    opacity: 0.8;
    transform: translate(6px, 2px);
  }
  74% {
    opacity: 0;
  }
}

@keyframes glitchBefore {
  0%, 82%, 100% {
    opacity: 0;
    transform: translate(0);
  }
  83% {
    opacity: 0.9;
    transform: translate(-4px, 0);
  }
  84% {
    opacity: 0;
    transform: translate(5px, 0);
  }
  85% {
    opacity: 0.8;
    transform: translate(-3px, 0);
  }
  86% {
    opacity: 0;
  }
}

@keyframes glitchAfter {
  0%, 77%, 100% {
    opacity: 0;
    transform: translate(0);
  }
  78% {
    opacity: 0;
  }
  79% {
    opacity: 0.8;
    transform: translate(4px, 0);
  }
  80% {
    opacity: 0;
    transform: translate(-5px, 0);
  }
  81% {
    opacity: 0.9;
    transform: translate(3px, 0);
  }
  82% {
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .glitch-title,
  .glitch-layer {
    font-size: clamp(2.5rem, 15vw, 6rem);
  }
}

@media (max-width: 480px) {
  .glitch-title,
  .glitch-layer {
    font-size: clamp(2rem, 18vw, 4rem);
  }
}
</style>