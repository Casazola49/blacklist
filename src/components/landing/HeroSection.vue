<template>
  <section class="hero-section relative min-h-screen flex items-center justify-center overflow-hidden">
    <!-- Matrix Code Background -->
    <div class="matrix-background absolute inset-0">
      <div class="matrix-column" v-for="i in matrixColumns" :key="i" :style="getColumnStyle(i)">
        <div class="matrix-char" v-for="j in 20" :key="j" :style="getCharStyle(j)">
          {{ getRandomChar() }}
        </div>
      </div>
    </div>

    <!-- Floating Particles -->
    <div class="particles-container absolute inset-0 pointer-events-none">
      <div 
        class="particle" 
        v-for="i in particleCount" 
        :key="i" 
        :style="getParticleStyle(i)"
      ></div>
    </div>

    <!-- Hero Content -->
    <div class="hero-content relative z-10 text-center max-w-4xl mx-auto px-4" :style="{ transform: `translateY(${parallaxOffset}px)` }">
      <!-- Main Title -->
      <div class="mb-8">
        <GlitchText 
          text="THE BLACKLIST" 
          class="text-6xl md:text-8xl font-orbitron font-black mb-4"
          :active="true"
          :intense="true"
          variant="primary"
        />
        <div class="subtitle-glow">
          <p class="text-xl md:text-2xl text-accent-cyan font-mono tracking-wider">
            SINDICATO DE ÉLITE ACADÉMICA
          </p>
        </div>
      </div>

      <!-- Manifesto with Typewriter Effect -->
      <div class="manifesto-container mb-12">
        <div class="manifesto-text text-lg md:text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
          <GlitchText 
            :text="manifestoText"
            :typing="true"
            :typing-speed="50"
            variant="secondary"
            class="font-mono"
          />
        </div>
      </div>

      <!-- CTA Button with Pulse Effect -->
      <div class="cta-container">
        <NeonButton 
          variant="primary" 
          class="cta-button text-lg px-12 py-4 pulse-effect"
          @click="$router.push('/auth')"
        >
          <span class="flex items-center gap-3">
            <span>ACCEDER AL SINDICATO</span>
            <div class="access-indicator">
              <div class="indicator-dot"></div>
              <div class="indicator-dot"></div>
              <div class="indicator-dot"></div>
            </div>
          </span>
        </NeonButton>
        
        <p class="text-text-muted text-sm mt-4 font-mono">
          [ ACCESO RESTRINGIDO - SOLO ÉLITE ]
        </p>
      </div>
    </div>

    <!-- Scroll Indicator -->
    <div class="scroll-indicator absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
      <div class="scroll-arrow animate-bounce">
        <div class="arrow-line"></div>
        <div class="arrow-head"></div>
      </div>
      <p class="text-text-muted text-xs mt-2 font-mono">EXPLORAR PROTOCOLO</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import GlitchText from '../ui/GlitchText.vue'
import NeonButton from '../ui/NeonButton.vue'

// Matrix animation data
const matrixColumns = ref(50)
const matrixChars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'

// Particles data
const particleCount = ref(30)

// Parallax data
const parallaxOffset = ref(0)

// Manifesto text
const manifestoText = ref(`El sistema educativo tradicional ha fallado. Nosotros somos la alternativa.
Una red clandestina de académicos de élite que opera en las sombras,
conectando estudiantes ambiciosos con especialistas de primer nivel.
Bienvenido al futuro de la educación superior.`)

// Matrix animation methods
const getRandomChar = () => {
  return matrixChars[Math.floor(Math.random() * matrixChars.length)]
}

const getColumnStyle = (index: number) => {
  const delay = Math.random() * 5
  const duration = 3 + Math.random() * 4
  return {
    left: `${(index / matrixColumns.value) * 100}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

const getCharStyle = (index: number) => {
  const opacity = Math.max(0.1, 1 - (index * 0.05))
  return {
    opacity: opacity.toString(),
    animationDelay: `${index * 0.1}s`
  }
}

// Particle animation methods
const getParticleStyle = (_index: number) => {
  const size = Math.random() * 4 + 2
  const left = Math.random() * 100
  const animationDuration = 10 + Math.random() * 20
  const delay = Math.random() * 10
  
  return {
    left: `${left}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDuration: `${animationDuration}s`,
    animationDelay: `${delay}s`
  }
}

// Parallax scroll handler
const handleScroll = () => {
  const scrolled = window.pageYOffset
  parallaxOffset.value = scrolled * 0.3
}

// Adjust matrix columns based on screen size
const updateMatrixColumns = () => {
  matrixColumns.value = Math.floor(window.innerWidth / 20)
}

// Lifecycle
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  updateMatrixColumns()
  window.addEventListener('resize', updateMatrixColumns)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', updateMatrixColumns)
})
</script>

<style scoped>
.hero-section {
  background: 
    radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 0, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(128, 0, 32, 0.1) 0%, transparent 50%),
    linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
}

/* Matrix Background Animation */
.matrix-background {
  opacity: 0.3;
  filter: blur(1px);
}

.matrix-column {
  @apply absolute top-0 w-5 text-accent-cyan font-mono text-sm;
  animation: matrix-fall linear infinite;
}

.matrix-char {
  @apply block h-5 leading-5;
  animation: matrix-glow 2s ease-in-out infinite alternate;
}

@keyframes matrix-fall {
  0% {
    transform: translateY(-100vh);
  }
  100% {
    transform: translateY(100vh);
  }
}

@keyframes matrix-glow {
  0% {
    text-shadow: 0 0 5px currentColor;
  }
  100% {
    text-shadow: 0 0 10px currentColor, 0 0 15px currentColor;
  }
}

/* Floating Particles */
.particles-container {
  opacity: 0.6;
}

.particle {
  @apply absolute rounded-full bg-accent-cyan;
  animation: particle-float linear infinite;
  box-shadow: 0 0 10px currentColor;
}

@keyframes particle-float {
  0% {
    transform: translateY(100vh) translateX(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) translateX(50px) rotate(360deg);
    opacity: 0;
  }
}

/* Hero Content Styling */
.hero-content {
  text-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
}

.subtitle-glow {
  animation: subtitle-pulse 3s ease-in-out infinite;
}

@keyframes subtitle-pulse {
  0%, 100% {
    text-shadow: 0 0 10px theme('colors.accent-cyan');
  }
  50% {
    text-shadow: 0 0 20px theme('colors.accent-cyan'), 0 0 30px theme('colors.accent-cyan');
  }
}

/* Manifesto Styling */
.manifesto-container {
  position: relative;
}

.manifesto-container::before {
  content: '';
  @apply absolute inset-0 bg-gradient-to-r from-transparent via-accent-cyan/10 to-transparent;
  animation: data-scan 4s ease-in-out infinite;
  pointer-events: none;
}

@keyframes data-scan {
  0%, 100% {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    transform: translateX(100%);
    opacity: 1;
  }
}

/* CTA Button Enhancements */
.cta-button {
  position: relative;
  overflow: visible;
}

.pulse-effect {
  animation: cta-pulse 2s ease-in-out infinite;
}

@keyframes cta-pulse {
  0%, 100% {
    box-shadow: 0 0 20px theme('colors.brand-primary');
    transform: scale(1);
  }
  50% {
    box-shadow: 
      0 0 30px theme('colors.brand-primary'),
      0 0 50px theme('colors.brand-primary'),
      0 0 70px theme('colors.brand-primary');
    transform: scale(1.05);
  }
}

.access-indicator {
  @apply flex gap-1;
}

.indicator-dot {
  @apply w-2 h-2 rounded-full bg-accent-cyan;
  animation: indicator-blink 1.5s ease-in-out infinite;
}

.indicator-dot:nth-child(2) {
  animation-delay: 0.3s;
}

.indicator-dot:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes indicator-blink {
  0%, 100% {
    opacity: 0.3;
    box-shadow: none;
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 10px currentColor;
  }
}

/* Scroll Indicator */
.scroll-indicator {
  animation: scroll-fade 3s ease-in-out infinite;
}

.arrow-line {
  @apply w-px h-8 bg-accent-cyan mx-auto;
  box-shadow: 0 0 5px currentColor;
}

.arrow-head {
  @apply w-0 h-0 mx-auto mt-1;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 6px solid theme('colors.accent-cyan');
  filter: drop-shadow(0 0 3px theme('colors.accent-cyan'));
}

@keyframes scroll-fade {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .matrix-column {
    @apply w-3 text-xs;
  }
  
  .matrix-char {
    @apply h-3 leading-3;
  }
  
  .particle {
    width: 2px !important;
    height: 2px !important;
  }
  
  .hero-content {
    padding: 0 1rem;
  }
}

/* Enhanced visual effects */
.hero-section::before {
  content: '';
  @apply absolute inset-0 pointer-events-none;
  background: 
    radial-gradient(circle at 50% 50%, rgba(0, 255, 255, 0.05) 0%, transparent 50%),
    linear-gradient(0deg, rgba(0, 0, 0, 0.3) 0%, transparent 100%);
  animation: ambient-glow 8s ease-in-out infinite alternate;
}

@keyframes ambient-glow {
  0% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
</style>