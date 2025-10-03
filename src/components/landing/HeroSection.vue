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
      <!-- Main Title - ULTRA DOMINANT -->
      <div class="title-section mb-8">
        <div class="title-container">
          <GlitchTitle />
        </div>
        <div class="subtitle-glow">
          <p class="subtitle-responsive text-accent-cyan font-mono tracking-wider">
            UN MARKETPLACE ACADÉMICO
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

      <!-- CTA Button with Enhanced Conversion Focus -->
      <div class="cta-container">
        <NeonButton 
          variant="primary" 
          class="cta-button-enhanced cta-responsive pulse-effect-intense"
          @click="$router.push('/auth')"
        >
          <span class="flex items-center gap-4">
            <span class="cta-text">ACCEDER AL PROTOCOLO</span>
            <div class="access-indicator">
              <div class="indicator-dot"></div>
              <div class="indicator-dot"></div>
              <div class="indicator-dot"></div>
            </div>
          </span>
        </NeonButton>
        
        <p class="text-text-muted text-sm mt-4 font-mono">
          [ ACCESO LIBRE - AHORRA TIEMPO ]
        </p>
        
        <!-- Demo Mode Access -->
        <div class="demo-mode-section mt-8 p-6 border border-yellow-500/30 rounded-lg bg-yellow-500/5 backdrop-blur-sm max-w-2xl mx-auto">
          <p class="text-yellow-400 font-semibold mb-3 font-mono text-lg">🎭 MODO DEMO</p>
          <p class="text-gray-300 text-sm mb-4 font-mono">
            [ ACCESO INSTANTÁNEO SIN AUTENTICACIÓN ]
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              @click="enterAsClienteDemo"
              class="demo-button bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 font-mono flex items-center justify-center gap-2"
            >
              <span>👤</span>
              <span>CLIENTE DEMO</span>
            </button>
            <button 
              @click="enterAsEspecialistaDemo"
              class="demo-button bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 font-mono flex items-center justify-center gap-2"
            >
              <span>🎓</span>
              <span>ESPECIALISTA DEMO</span>
            </button>
          </div>
          <p class="text-gray-400 text-xs mt-3 font-mono">
            [ PERFECTO PARA PRESENTACIONES Y DEMOS ]
          </p>
        </div>
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
import GlitchText from '../ui/SimpleGlitchText.vue'
import GlitchTitle from '../ui/SimpleGlitchTitle.vue'
import NeonButton from '../ui/NeonButton.vue'
import { useDemoMode } from '@/composables/useDemoMode'

// Demo mode
const { enterAsClienteDemo, enterAsEspecialistaDemo } = useDemoMode()

// Matrix animation data
const matrixColumns = ref(50)
const matrixChars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'

// Particles data
const particleCount = ref(30)

// Parallax data
const parallaxOffset = ref(0)

// Manifesto text - V2.0 Simplified
const manifestoText = ref(`El sistema de educacion tradicional ha fallado. Somos la alternativa. Una red de auxiliares especialistas que opera en las sombras. Bienvenido al futuro.`)

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

.title-section {
  position: relative;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-left: calc(-50vw + 50%);
  overflow: visible;
}

.title-container {
  position: relative;
  width: 100vw;
  overflow: visible;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Title container styles */

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

/* CTA Button Enhancements - V2.2 Enhanced Readability */
.cta-button-enhanced {
  position: relative;
  overflow: visible;
  background: #800020 !important;
  border: 2px solid #800020 !important;
  transform: scale(1.15);
}

.cta-button-enhanced .cta-text {
  color: #ffffff !important;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
  font-weight: 600;
}

.pulse-effect-intense {
  animation: cta-pulse-intense 1.5s ease-in-out infinite;
}

@keyframes cta-pulse-intense {
  0%, 100% {
    box-shadow: 
      0 0 25px #800020,
      0 0 40px #800020,
      0 0 60px rgba(128, 0, 32, 0.8);
    transform: scale(1.15);
  }
  50% {
    box-shadow: 
      0 0 35px #800020,
      0 0 60px #800020,
      0 0 90px rgba(128, 0, 32, 0.9),
      0 0 120px rgba(128, 0, 32, 0.6);
    transform: scale(1.18);
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

/* Desktop Responsive Styles */
@media (min-width: 1024px) {
  .subtitle-responsive {
    font-size: 2rem !important;
    text-shadow: 0 0 15px rgba(0, 255, 255, 0.8) !important;
    margin-top: 1rem !important;
  }
  
  .cta-responsive {
    font-size: 1.5rem !important;
    padding: 2rem 4rem !important;
    transform: scale(1.1) !important;
    margin-top: 2rem !important;
  }
  
  .cta-text {
    color: #ffffff !important;
    text-shadow: 0 0 20px rgba(255, 255, 255, 1) !important;
    font-weight: 800 !important;
  }
  
  .hero-content {
    max-width: 95vw !important;
    width: 95vw !important;
  }
  
  .manifesto-container {
    margin-top: 1rem !important;
    margin-bottom: 2rem !important;
  }
  
  .manifesto-text {
    font-size: 1.2rem !important;
  }
}

@media (min-width: 1920px) {
  .subtitle-responsive {
    font-size: 2.8rem !important;
  }
  
  .manifesto-text {
    font-size: 1.5rem !important;
  }
}

@media (min-width: 2560px) {
  .subtitle-responsive {
    font-size: 3.5rem !important;
  }
}

/* Tablet styles */
@media (min-width: 768px) and (max-width: 1023px) {
  .title-massive {
    font-size: 8vw !important;
    line-height: 0.95 !important;
    transform: scale(1.02) !important;
  }
  
  .subtitle-responsive {
    @apply text-xl md:text-2xl;
  }
  
  .cta-responsive {
    @apply text-xl px-16 py-6;
  }
}

/* Mobile-specific adjustments */
@media (max-width: 767px) {
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
    padding: 0 0.5rem;
  }
  
  .subtitle-responsive {
    @apply text-lg;
  }
  
  .cta-responsive {
    @apply text-lg px-8 py-4;
    transform: scale(1) !important;
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

/* Demo Mode Section Styles */
.demo-mode-section {
  animation: demo-glow 3s ease-in-out infinite alternate;
}

@keyframes demo-glow {
  0% {
    box-shadow: 0 0 10px rgba(234, 179, 8, 0.2);
  }
  100% {
    box-shadow: 0 0 20px rgba(234, 179, 8, 0.4), 0 0 30px rgba(234, 179, 8, 0.2);
  }
}

.demo-button {
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.demo-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.demo-button:hover::before {
  width: 300px;
  height: 300px;
}

.demo-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}
</style>