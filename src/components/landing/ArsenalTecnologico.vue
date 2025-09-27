<template>
  <section class="arsenal-section relative py-20 overflow-hidden">
    <!-- Background Effects -->
    <div class="arsenal-bg absolute inset-0">
      <div class="tech-grid"></div>
      <div class="floating-particles">
        <div v-for="i in 15" :key="i" class="tech-particle" :style="getParticleStyle(i)"></div>
      </div>
    </div>

    <div class="container relative z-10">
      <!-- Section Header -->
      <div class="text-center mb-16" ref="headerRef">
        <GlitchText 
          text="[ ARSENAL TECNOLÓGICO DEL SINDICATO ]"
          class="text-4xl md:text-6xl font-orbitron font-black mb-6"
          :active="headerVisible"
          variant="primary"
        />
        <div class="subtitle-container">
          <div class="subtitle-line"></div>
          <p class="text-xl text-accent-cyan font-mono tracking-wider px-6">
            Nuestra infraestructura garantiza la eficiencia y seguridad de cada operación
          </p>
          <div class="subtitle-line"></div>
        </div>
      </div>

      <!-- Tech Arsenal Grid -->
      <div class="arsenal-grid">
        <div 
          v-for="(tech, index) in techArsenal" 
          :key="tech.id"
          :ref="(el) => { if (el) techRefs[index] = el as HTMLElement }"
          class="tech-card"
          :class="{ 'tech-card--visible': tech.visible }"
          :style="{ animationDelay: `${index * 0.3}s` }"
        >
          <div class="tech-container">
            <!-- Holographic Frame -->
            <div class="holo-frame">
              <div class="frame-corner frame-tl"></div>
              <div class="frame-corner frame-tr"></div>
              <div class="frame-corner frame-bl"></div>
              <div class="frame-corner frame-br"></div>
              <div class="frame-scanner"></div>
            </div>

            <!-- Tech Icon -->
            <div class="tech-icon-container">
              <div class="icon-hologram">
                <component :is="tech.iconComponent" class="w-16 h-16" />
              </div>
              <div class="icon-pulse-ring"></div>
              <div class="icon-data-stream">
                <div v-for="i in 6" :key="i" class="data-bit" :style="{ animationDelay: `${i * 0.1}s` }"></div>
              </div>
            </div>

            <!-- Tech Content -->
            <div class="tech-content">
              <h3 class="tech-title">
                {{ tech.title }}
              </h3>
              <p class="tech-description">
                {{ tech.description }}
              </p>

              <!-- Security Level Indicator -->
              <div class="security-level">
                <div class="security-label">NIVEL DE SEGURIDAD</div>
                <div class="security-bars">
                  <div 
                    v-for="i in 5" 
                    :key="i" 
                    class="security-bar"
                    :class="{ 'bar-active': i <= tech.securityLevel }"
                    :style="{ animationDelay: `${i * 0.1}s` }"
                  ></div>
                </div>
                <div class="security-status">{{ tech.securityStatus }}</div>
              </div>
            </div>

            <!-- Scanning Effect -->
            <div class="tech-scanner" v-if="tech.visible">
              <div class="scanner-line"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Arsenal Status -->
      <div class="arsenal-status mt-16 text-center" ref="statusRef">
        <div class="status-container" :class="{ 'status-visible': statusVisible }">
          <div class="status-indicator">
            <div class="status-dot"></div>
            <span class="status-text">ARSENAL TECNOLÓGICO OPERATIVO</span>
            <div class="status-dot"></div>
          </div>
          <p class="text-text-secondary font-mono mt-4">
            Infraestructura de élite garantizando operaciones sin fallas
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import GlitchText from '../ui/GlitchText.vue'

// Tech Icons
const EscrowIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  `
}

const CommunicationIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      <path d="M8 9h8"/>
      <path d="M8 13h6"/>
      <circle cx="12" cy="12" r="1"/>
      <path d="M3 12c0-4.97 4.03-9 9-9s9 4.03 9 9"/>
    </svg>
  `
}

const ReputationIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v6m0 6v6"/>
      <path d="M21 12h-6m-6 0H3"/>
    </svg>
  `
}

// Tech Arsenal Data
const techArsenal = ref([
  {
    id: 1,
    title: 'SISTEMA DE ESCROW AUTOMATIZADO',
    description: 'Tu inversión está protegida. Los fondos se retienen en una bóveda digital y solo se liberan con tu autorización explícita al finalizar el proyecto. Cero riesgo para el Cliente y el Especialista.',
    iconComponent: EscrowIcon,
    securityLevel: 5,
    securityStatus: 'MÁXIMA SEGURIDAD',
    visible: false
  },
  {
    id: 2,
    title: 'CANAL DE COMUNICACIÓN ENCRIPTADO',
    description: 'La discreción es absoluta. Todas las interacciones, archivos y propuestas se transmiten a través de un canal privado de extremo a extremo. Tu anonimato y el de tu proyecto están garantizados.',
    iconComponent: CommunicationIcon,
    securityLevel: 5,
    securityStatus: 'ENCRIPTACIÓN TOTAL',
    visible: false
  },
  {
    id: 3,
    title: 'SISTEMA DE REPUTACIÓN INTELIGENTE',
    description: 'Solo operan los mejores. Nuestro algoritmo de reputación analiza el historial de éxito, las calificaciones de los clientes y el tiempo de respuesta para asegurar que solo los especialistas de élite reciban tus solicitudes.',
    iconComponent: ReputationIcon,
    securityLevel: 4,
    securityStatus: 'IA AVANZADA',
    visible: false
  }
])

// Refs for intersection observer
const headerRef = ref<HTMLElement>()
const statusRef = ref<HTMLElement>()
const techRefs = ref<HTMLElement[]>([])

// Visibility states
const headerVisible = ref(false)
const statusVisible = ref(false)

// Particle animation
const getParticleStyle = (index: number) => {
  const size = Math.random() * 3 + 1
  const left = Math.random() * 100
  const animationDuration = 8 + Math.random() * 12
  const delay = Math.random() * 5
  
  return {
    left: `${left}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDuration: `${animationDuration}s`,
    animationDelay: `${delay}s`
  }
}

// Intersection Observer setup
const setupIntersectionObserver = () => {
  const options = {
    threshold: 0.3,
    rootMargin: '-50px'
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (entry.target === headerRef.value) {
          headerVisible.value = true
          // Trigger tech cards animation sequence
          setTimeout(() => {
            techArsenal.value.forEach((tech, index) => {
              setTimeout(() => {
                tech.visible = true
              }, index * 300)
            })
          }, 500)
        } else if (entry.target === statusRef.value) {
          statusVisible.value = true
        }
      }
    })
  }, options)

  // Observe elements
  if (headerRef.value) observer.observe(headerRef.value)
  if (statusRef.value) observer.observe(statusRef.value)

  return observer
}

let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = setupIntersectionObserver()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
.arsenal-section {
  background: 
    radial-gradient(circle at 75% 25%, rgba(255, 0, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 25% 75%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
    linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 50%, #1a1a1a 100%);
}

/* Background Effects */
.arsenal-bg {
  opacity: 0.4;
}

.tech-grid {
  @apply absolute inset-0;
  background-image: 
    linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px),
    radial-gradient(circle at 33% 33%, rgba(255, 0, 255, 0.05) 2px, transparent 2px),
    radial-gradient(circle at 66% 66%, rgba(128, 0, 32, 0.05) 2px, transparent 2px);
  background-size: 60px 60px, 60px 60px, 120px 120px, 120px 120px;
  animation: tech-grid-pulse 6s ease-in-out infinite;
}

.floating-particles {
  @apply absolute inset-0;
}

.tech-particle {
  @apply absolute rounded-full bg-accent-cyan;
  animation: tech-particle-float linear infinite;
  box-shadow: 0 0 8px currentColor;
}

@keyframes tech-grid-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.6; }
}

@keyframes tech-particle-float {
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
    transform: translateY(-100px) translateX(30px) rotate(360deg);
    opacity: 0;
  }
}

/* Header Styles */
.subtitle-container {
  @apply flex items-center justify-center gap-4 mt-4;
}

.subtitle-line {
  @apply w-20 h-px bg-gradient-to-r from-transparent via-accent-cyan to-transparent;
  animation: subtitle-glow 3s ease-in-out infinite alternate;
}

@keyframes subtitle-glow {
  0% { box-shadow: 0 0 5px theme('colors.accent-cyan'); }
  100% { box-shadow: 0 0 20px theme('colors.accent-cyan'); }
}

/* Arsenal Grid */
.arsenal-grid {
  @apply grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto;
}

/* Tech Cards */
.tech-card {
  @apply opacity-0 transform translate-y-12 scale-95;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 450px;
}

.tech-card--visible {
  @apply opacity-100 transform translate-y-0 scale-100;
  animation: tech-card-entrance 1s ease-out;
}

.tech-container {
  @apply relative w-full h-full p-8;
  background: linear-gradient(135deg, 
    rgba(0, 255, 255, 0.08) 0%, 
    rgba(26, 26, 26, 0.95) 25%, 
    rgba(26, 26, 26, 0.95) 75%, 
    rgba(255, 0, 255, 0.08) 100%
  );
  border-radius: 16px;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(0, 255, 255, 0.2);
  min-height: 450px;
  display: flex;
  flex-direction: column;
}

/* Holographic Frame */
.holo-frame {
  @apply absolute inset-0 pointer-events-none;
  z-index: 10;
}

.frame-corner {
  @apply absolute w-8 h-8;
  border: 2px solid #00ffff;
  animation: frame-glow 3s ease-in-out infinite alternate;
}

.frame-tl { top: 0; left: 0; border-right: none; border-bottom: none; }
.frame-tr { top: 0; right: 0; border-left: none; border-bottom: none; }
.frame-bl { bottom: 0; left: 0; border-right: none; border-top: none; }
.frame-br { bottom: 0; right: 0; border-left: none; border-top: none; }

.frame-scanner {
  @apply absolute inset-0 border border-accent-cyan opacity-20;
  animation: frame-scan 4s linear infinite;
}

@keyframes frame-glow {
  0% { 
    box-shadow: 0 0 10px #00ffff;
    border-color: #00ffff;
  }
  100% { 
    box-shadow: 0 0 25px #00ffff, 0 0 35px #00ffff;
    border-color: #ffffff;
  }
}

@keyframes frame-scan {
  0% { 
    transform: scale(1);
    opacity: 0.2;
  }
  50% {
    transform: scale(1.02);
    opacity: 0.4;
  }
  100% { 
    transform: scale(1);
    opacity: 0.2;
  }
}

/* Tech Icon */
.tech-icon-container {
  @apply relative flex justify-center mb-8;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-hologram {
  @apply relative z-20 text-accent-cyan;
  animation: icon-levitate 4s ease-in-out infinite;
}

.icon-pulse-ring {
  @apply absolute inset-0 border-2 border-accent-cyan rounded-full;
  animation: pulse-ring 2s ease-in-out infinite;
}

.icon-data-stream {
  @apply absolute inset-0;
}

.data-bit {
  @apply absolute w-1 h-1 bg-accent-cyan rounded-full;
  animation: data-orbit 3s linear infinite;
}

.data-bit:nth-child(1) { animation-delay: 0s; }
.data-bit:nth-child(2) { animation-delay: 0.5s; }
.data-bit:nth-child(3) { animation-delay: 1s; }
.data-bit:nth-child(4) { animation-delay: 1.5s; }
.data-bit:nth-child(5) { animation-delay: 2s; }
.data-bit:nth-child(6) { animation-delay: 2.5s; }

@keyframes icon-levitate {
  0%, 100% { 
    transform: translateY(0) scale(1);
    filter: drop-shadow(0 0 20px currentColor);
  }
  50% { 
    transform: translateY(-8px) scale(1.05);
    filter: drop-shadow(0 0 30px currentColor);
  }
}

@keyframes pulse-ring {
  0% { 
    transform: scale(0.8);
    opacity: 1;
  }
  100% { 
    transform: scale(1.5);
    opacity: 0;
  }
}

@keyframes data-orbit {
  0% { 
    transform: rotate(0deg) translateX(40px) rotate(0deg);
    opacity: 0;
  }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { 
    transform: rotate(360deg) translateX(40px) rotate(-360deg);
    opacity: 0;
  }
}

/* Tech Content */
.tech-content {
  @apply flex-grow flex flex-col;
}

.tech-title {
  @apply text-2xl font-orbitron font-bold mb-6 text-center;
  color: #ffffff;
  text-shadow: 0 0 20px rgba(0, 255, 255, 0.8);
  letter-spacing: 1px;
  line-height: 1.2;
}

.tech-description {
  @apply text-base leading-relaxed mb-8 flex-grow;
  color: #e0e0e0;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  font-weight: 400;
  line-height: 1.7;
  text-align: justify;
}

/* Security Level Indicator */
.security-level {
  @apply mt-auto;
}

.security-label {
  @apply text-xs font-mono text-accent-cyan text-center mb-3;
  text-shadow: 0 0 10px currentColor;
  letter-spacing: 2px;
}

.security-bars {
  @apply flex justify-center gap-2 mb-3;
}

.security-bar {
  @apply w-8 h-2 bg-gray-700 rounded-full;
  transition: all 0.5s ease;
}

.bar-active {
  @apply bg-gradient-to-r from-accent-cyan to-accent-magenta;
  box-shadow: 0 0 15px currentColor;
  animation: bar-pulse 2s ease-in-out infinite alternate;
}

.security-status {
  @apply text-sm font-mono text-center;
  color: #00ff00;
  text-shadow: 0 0 15px currentColor;
  animation: status-blink 3s ease-in-out infinite;
}

@keyframes bar-pulse {
  0% { 
    box-shadow: 0 0 15px currentColor;
    filter: brightness(1);
  }
  100% { 
    box-shadow: 0 0 25px currentColor;
    filter: brightness(1.2);
  }
}

@keyframes status-blink {
  0%, 90%, 100% { opacity: 1; }
  95% { opacity: 0.7; }
}

/* Tech Scanner */
.tech-scanner {
  @apply absolute inset-0 pointer-events-none;
  z-index: 30;
}

.scanner-line {
  @apply absolute w-full h-px bg-accent-cyan opacity-60;
  animation: scanner-sweep 3s linear infinite;
  top: 50%;
}

@keyframes scanner-sweep {
  0% { 
    transform: translateY(-200px);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% { 
    transform: translateY(200px);
    opacity: 0;
  }
}

/* Arsenal Status */
.arsenal-status {
  @apply relative;
}

.status-container {
  @apply opacity-0 transform translate-y-4;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.status-visible {
  @apply opacity-100 transform translate-y-0;
}

.status-indicator {
  @apply flex items-center justify-center gap-4;
}

.status-dot {
  @apply w-3 h-3 rounded-full bg-accent-cyan;
  animation: status-dot-pulse 2s ease-in-out infinite;
  box-shadow: 0 0 15px currentColor;
}

.status-text {
  @apply text-xl font-orbitron font-bold text-accent-cyan;
  text-shadow: 0 0 20px currentColor;
  letter-spacing: 2px;
  animation: status-text-glow 3s ease-in-out infinite alternate;
}

@keyframes status-dot-pulse {
  0%, 100% { 
    transform: scale(1);
    opacity: 1;
  }
  50% { 
    transform: scale(1.2);
    opacity: 0.8;
  }
}

@keyframes status-text-glow {
  0% { 
    text-shadow: 0 0 20px currentColor;
  }
  100% { 
    text-shadow: 0 0 30px currentColor, 0 0 40px currentColor;
  }
}

/* Entrance Animation */
@keyframes tech-card-entrance {
  0% {
    opacity: 0;
    transform: translateY(50px) scale(0.9) rotateX(10deg);
    filter: blur(5px);
  }
  50% {
    opacity: 0.7;
    transform: translateY(-10px) scale(1.02) rotateX(-2deg);
    filter: blur(2px);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1) rotateX(0deg);
    filter: blur(0px);
  }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .arsenal-grid {
    @apply grid-cols-1 gap-6;
  }
  
  .tech-container {
    min-height: 400px;
  }
}

@media (max-width: 768px) {
  .subtitle-container {
    @apply flex-col gap-2;
  }
  
  .subtitle-line {
    @apply w-16;
  }
  
  .tech-container {
    @apply p-6;
    min-height: 350px;
  }
  
  .tech-title {
    @apply text-xl;
  }
  
  .tech-description {
    @apply text-sm;
  }
  
  .icon-hologram {
    @apply w-12 h-12;
  }
}

@media (max-width: 480px) {
  .tech-container {
    @apply p-4;
    min-height: 320px;
  }
  
  .tech-icon-container {
    height: 80px;
    @apply mb-6;
  }
  
  .icon-hologram {
    @apply w-10 h-10;
  }
  
  .security-bars {
    @apply gap-1;
  }
  
  .security-bar {
    @apply w-6 h-2;
  }
}
</style>