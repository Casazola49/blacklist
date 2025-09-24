<template>
  <section class="protocolo-section relative py-20 overflow-hidden">
    <!-- Background Effects -->
    <div class="protocolo-bg absolute inset-0">
      <div class="circuit-pattern"></div>
      <div class="data-streams">
        <div v-for="i in 8" :key="i" class="data-stream" :style="getStreamStyle(i)"></div>
      </div>
    </div>

    <div class="container relative z-10">
      <!-- Section Header -->
      <div class="text-center mb-16" ref="headerRef">
        <GlitchText 
          text="PROTOCOLO DE OPERACIÓN"
          class="text-4xl md:text-6xl font-orbitron font-black mb-6"
          :active="headerVisible"
          variant="primary"
        />
        <div class="subtitle-container">
          <div class="subtitle-line"></div>
          <p class="text-xl text-accent-cyan font-mono tracking-wider px-6">
            PROCESO DE INFILTRACIÓN EN 6 FASES
          </p>
          <div class="subtitle-line"></div>
        </div>
      </div>

      <!-- Protocol Steps -->
      <div class="protocol-grid relative">
        <!-- Connection Lines -->
        <svg class="connection-lines absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1200 800">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#00ffff;stop-opacity:0" />
              <stop offset="50%" style="stop-color:#00ffff;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#ff00ff;stop-opacity:0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <!-- Horizontal connections -->
          <path 
            v-for="(line, index) in connectionLines" 
            :key="`line-${index}`"
            :d="line.path"
            stroke="url(#lineGradient)"
            stroke-width="2"
            fill="none"
            filter="url(#glow)"
            :class="{ 'animate-draw': line.visible }"
            :style="{ animationDelay: `${index * 0.3}s` }"
          />
        </svg>

        <!-- Protocol Steps -->
        <div 
          v-for="(step, index) in protocolSteps" 
          :key="step.id"
          :ref="(el) => { if (el) stepRefs[index] = el as HTMLElement }"
          class="protocol-step"
          :class="{ 'protocol-step--visible': step.visible }"
          :style="{ animationDelay: `${index * 0.2}s` }"
        >
          <HologramCard 
            :variant="step.variant"
            :active="step.visible"
            :show-particles="step.visible"
            :intensity="1.2"
            class="step-card h-full"
          >
            <!-- Step Number -->
            <div class="step-number">
              <div class="number-glow">
                <span class="text-3xl font-orbitron font-black">{{ step.number }}</span>
              </div>
              <div class="number-circuit">
                <div class="circuit-dot" v-for="i in 4" :key="i"></div>
              </div>
            </div>

            <!-- Cyberpunk Icon -->
            <div class="step-icon mb-6">
              <div class="icon-container" :class="`icon-${step.icon}`">
                <div class="icon-hologram">
                  <component :is="step.iconComponent" class="w-12 h-12" />
                </div>
                <div class="icon-scan-lines">
                  <div v-for="i in 3" :key="i" class="scan-line" :style="{ animationDelay: `${i * 0.2}s` }"></div>
                </div>
              </div>
            </div>

            <!-- Step Content -->
            <div class="step-content">
              <h3 class="text-xl font-orbitron font-bold text-primary mb-3">
                {{ step.title }}
              </h3>
              <p class="text-text-secondary text-sm leading-relaxed mb-4">
                {{ step.description }}
              </p>
              
              <!-- Status Indicator -->
              <div class="status-indicator">
                <div class="status-bar">
                  <div class="status-fill" :style="{ width: step.visible ? '100%' : '0%' }"></div>
                </div>
                <span class="status-text text-xs font-mono text-accent-cyan">
                  {{ step.visible ? 'SISTEMA ACTIVO' : 'ESPERANDO ACTIVACIÓN' }}
                </span>
              </div>
            </div>

            <!-- 3D Hologram Effect -->
            <div class="hologram-overlay" v-if="step.visible">
              <div class="hologram-layer" v-for="i in 3" :key="i" :style="{ animationDelay: `${i * 0.1}s` }"></div>
            </div>
          </HologramCard>
        </div>
      </div>

      <!-- Protocol Summary -->
      <div class="protocol-summary mt-16 text-center" ref="summaryRef">
        <div class="summary-container" :class="{ 'summary-visible': summaryVisible }">
          <div class="summary-line"></div>
          <div class="summary-content">
            <GlitchText 
              text="PROTOCOLO COMPLETADO"
              class="text-2xl font-orbitron font-bold text-accent-cyan mb-4"
              :active="summaryVisible"
              variant="secondary"
            />
            <p class="text-text-secondary font-mono">
              Sistema de infiltración académica operativo. Acceso autorizado.
            </p>
          </div>
          <div class="summary-line"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import GlitchText from '../ui/GlitchText.vue'
import HologramCard from '../ui/HologramCard.vue'

// Icons (using simple SVG components for cyberpunk aesthetic)
const AccessIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <circle cx="12" cy="16" r="1"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  `
}

const ScanIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 12l2 2 4-4"/>
      <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
      <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
      <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"/>
      <path d="M12 21c0-1-1-3-3-3s-3 2-3 3 1 3 3 3 3-2 3-3"/>
    </svg>
  `
}

const ConnectIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M6 9l6 6 6-6"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v6m0 6v6"/>
      <path d="M21 12h-6m-6 0H3"/>
    </svg>
  `
}

const ExecuteIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polygon points="5,3 19,12 5,21"/>
      <path d="M12 12l7-7-7 7z"/>
    </svg>
  `
}

const SecureIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  `
}

const CompleteIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22,4 12,14.01 9,11.01"/>
    </svg>
  `
}

// Protocol steps data
const protocolSteps = ref([
  {
    id: 1,
    number: '01',
    title: 'ACCESO INICIAL',
    description: 'Infiltración en el sistema mediante autenticación segura. Verificación de credenciales y establecimiento de conexión encriptada.',
    icon: 'access',
    iconComponent: AccessIcon,
    variant: 'primary' as const,
    visible: false
  },
  {
    id: 2,
    number: '02',
    title: 'ESCANEO DE OBJETIVOS',
    description: 'Análisis de oportunidades disponibles. Identificación de especialistas compatibles y evaluación de proyectos activos.',
    icon: 'scan',
    iconComponent: ScanIcon,
    variant: 'secondary' as const,
    visible: false
  },
  {
    id: 3,
    number: '03',
    title: 'ESTABLECER CONEXIÓN',
    description: 'Iniciación de protocolo de comunicación segura. Intercambio de propuestas y negociación de términos operativos.',
    icon: 'connect',
    iconComponent: ConnectIcon,
    variant: 'accent' as const,
    visible: false
  },
  {
    id: 4,
    number: '04',
    title: 'EJECUTAR MISIÓN',
    description: 'Activación del sistema de escrow y inicio de operaciones. Monitoreo en tiempo real del progreso de la misión.',
    icon: 'execute',
    iconComponent: ExecuteIcon,
    variant: 'primary' as const,
    visible: false
  },
  {
    id: 5,
    number: '05',
    title: 'PROTOCOLO SEGURO',
    description: 'Verificación de entregables y validación de calidad. Activación de protocolos de seguridad para transferencia.',
    icon: 'secure',
    iconComponent: SecureIcon,
    variant: 'secondary' as const,
    visible: false
  },
  {
    id: 6,
    number: '06',
    title: 'MISIÓN COMPLETADA',
    description: 'Finalización exitosa de la operación. Liberación de fondos, evaluación mutua y actualización de registros.',
    icon: 'complete',
    iconComponent: CompleteIcon,
    variant: 'accent' as const,
    visible: false
  }
])

// Connection lines for SVG
const connectionLines = ref([
  { path: 'M 200 150 Q 400 100 600 150', visible: false },
  { path: 'M 600 150 Q 800 100 1000 150', visible: false },
  { path: 'M 200 400 Q 400 350 600 400', visible: false },
  { path: 'M 600 400 Q 800 350 1000 400', visible: false },
  { path: 'M 200 650 Q 400 600 600 650', visible: false }
])

// Refs for intersection observer
const headerRef = ref<HTMLElement>()
const summaryRef = ref<HTMLElement>()
const stepRefs = ref<HTMLElement[]>([])

// Visibility states
const headerVisible = ref(false)
const summaryVisible = ref(false)

// Data stream styles
const getStreamStyle = (index: number) => {
  const delay = index * 0.5
  const duration = 3 + Math.random() * 2
  const left = (index / 8) * 100
  
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
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
        } else if (entry.target === summaryRef.value) {
          summaryVisible.value = true
        } else {
          // Handle step visibility
          const stepIndex = stepRefs.value.findIndex(ref => ref === entry.target)
          if (stepIndex !== -1) {
            protocolSteps.value[stepIndex].visible = true
            
            // Trigger connection line animation
            const lineIndex = Math.floor(stepIndex / 2)
            if (connectionLines.value[lineIndex]) {
              setTimeout(() => {
                connectionLines.value[lineIndex].visible = true
              }, stepIndex * 200)
            }
          }
        }
      }
    })
  }, options)

  // Observe elements
  if (headerRef.value) observer.observe(headerRef.value)
  if (summaryRef.value) observer.observe(summaryRef.value)
  stepRefs.value.forEach(ref => {
    if (ref) observer.observe(ref)
  })

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
.protocolo-section {
  background: 
    radial-gradient(circle at 25% 25%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(255, 0, 255, 0.1) 0%, transparent 50%),
    linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
}

/* Background Effects */
.protocolo-bg {
  opacity: 0.3;
}

.circuit-pattern {
  @apply absolute inset-0;
  background-image: 
    linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px),
    radial-gradient(circle at 25% 25%, rgba(0, 255, 255, 0.05) 2px, transparent 2px),
    radial-gradient(circle at 75% 75%, rgba(255, 0, 255, 0.05) 2px, transparent 2px);
  background-size: 50px 50px, 50px 50px, 100px 100px, 100px 100px;
  animation: circuit-pulse 4s ease-in-out infinite;
}

.data-streams {
  @apply absolute inset-0;
}

.data-stream {
  @apply absolute w-px h-full bg-gradient-to-b from-transparent via-accent-cyan to-transparent opacity-30;
  animation: data-flow linear infinite;
}

@keyframes circuit-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.5; }
}

@keyframes data-flow {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

/* Header Styles */
.subtitle-container {
  @apply flex items-center justify-center gap-4 mt-4;
}

.subtitle-line {
  @apply w-16 h-px bg-gradient-to-r from-transparent via-accent-cyan to-transparent;
  animation: line-glow 2s ease-in-out infinite alternate;
}

@keyframes line-glow {
  0% { box-shadow: 0 0 5px theme('colors.accent-cyan'); }
  100% { box-shadow: 0 0 15px theme('colors.accent-cyan'); }
}

/* Protocol Grid */
.protocol-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto;
}

/* Connection Lines */
.connection-lines {
  z-index: 1;
}

.animate-draw {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: draw-line 2s ease-out forwards;
}

@keyframes draw-line {
  to {
    stroke-dashoffset: 0;
  }
}

/* Protocol Steps */
.protocol-step {
  @apply opacity-0 transform translate-y-8;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.protocol-step--visible {
  @apply opacity-100 transform translate-y-0;
}

.step-card {
  @apply relative overflow-hidden;
  min-height: 320px;
}

/* Step Number */
.step-number {
  @apply absolute -top-4 -right-4 w-16 h-16 flex items-center justify-center;
}

.number-glow {
  @apply relative z-10 w-full h-full flex items-center justify-center;
  @apply bg-bg-primary border-2 border-accent-cyan rounded-full;
  box-shadow: 
    0 0 20px theme('colors.accent-cyan'),
    inset 0 0 10px rgba(0, 255, 255, 0.2);
  animation: number-pulse 2s ease-in-out infinite;
}

.number-circuit {
  @apply absolute inset-0 flex items-center justify-center;
}

.circuit-dot {
  @apply absolute w-1 h-1 bg-accent-cyan rounded-full;
  animation: circuit-rotate 3s linear infinite;
}

.circuit-dot:nth-child(1) { transform: rotate(0deg) translateX(24px); }
.circuit-dot:nth-child(2) { transform: rotate(90deg) translateX(24px); }
.circuit-dot:nth-child(3) { transform: rotate(180deg) translateX(24px); }
.circuit-dot:nth-child(4) { transform: rotate(270deg) translateX(24px); }

@keyframes number-pulse {
  0%, 100% { 
    box-shadow: 0 0 20px theme('colors.accent-cyan'), inset 0 0 10px rgba(0, 255, 255, 0.2); 
  }
  50% { 
    box-shadow: 0 0 30px theme('colors.accent-cyan'), inset 0 0 15px rgba(0, 255, 255, 0.3); 
  }
}

@keyframes circuit-rotate {
  0% { transform: rotate(0deg) translateX(24px) rotate(0deg); }
  100% { transform: rotate(360deg) translateX(24px) rotate(-360deg); }
}

/* Step Icon */
.step-icon {
  @apply flex justify-center;
}

.icon-container {
  @apply relative w-20 h-20 flex items-center justify-center;
}

.icon-hologram {
  @apply relative z-10 text-accent-cyan;
  animation: icon-float 3s ease-in-out infinite;
}

.icon-scan-lines {
  @apply absolute inset-0;
}

.scan-line {
  @apply absolute w-full h-px bg-accent-cyan opacity-30;
  animation: icon-scan 2s infinite linear;
}

.scan-line:nth-child(1) { top: 25%; }
.scan-line:nth-child(2) { top: 50%; }
.scan-line:nth-child(3) { top: 75%; }

@keyframes icon-float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-5px) scale(1.05); }
}

@keyframes icon-scan {
  0% { transform: scaleX(0); opacity: 0; }
  50% { transform: scaleX(1); opacity: 1; }
  100% { transform: scaleX(0); opacity: 0; }
}

/* Status Indicator */
.status-indicator {
  @apply mt-auto;
}

.status-bar {
  @apply w-full h-1 bg-bg-tertiary rounded-full overflow-hidden mb-2;
}

.status-fill {
  @apply h-full bg-gradient-to-r from-accent-cyan to-accent-magenta;
  transition: width 1s ease-out;
  box-shadow: 0 0 10px currentColor;
}

.status-text {
  @apply block text-center;
  animation: status-blink 2s ease-in-out infinite;
}

@keyframes status-blink {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

/* Hologram Overlay */
.hologram-overlay {
  @apply absolute inset-0 pointer-events-none;
  z-index: 30;
}

.hologram-layer {
  @apply absolute inset-0 border border-accent-cyan opacity-20;
  animation: hologram-flicker 0.1s infinite;
}

.hologram-layer:nth-child(2) {
  @apply border-accent-magenta;
  transform: scale(1.02);
  animation-delay: 0.05s;
}

.hologram-layer:nth-child(3) {
  @apply border-brand-primary;
  transform: scale(0.98);
  animation-delay: 0.1s;
}

@keyframes hologram-flicker {
  0%, 100% { opacity: 0.2; }
  98% { opacity: 0.2; }
  99% { opacity: 0.1; }
  99.5% { opacity: 0.3; }
}

/* Protocol Summary */
.protocol-summary {
  @apply relative;
}

.summary-container {
  @apply flex items-center justify-center gap-8 opacity-0 transform translate-y-4;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.summary-visible {
  @apply opacity-100 transform translate-y-0;
}

.summary-line {
  @apply w-32 h-px bg-gradient-to-r from-transparent via-accent-cyan to-transparent;
  animation: summary-glow 3s ease-in-out infinite;
}

.summary-content {
  @apply text-center;
}

@keyframes summary-glow {
  0%, 100% { 
    box-shadow: 0 0 10px theme('colors.accent-cyan'); 
    filter: brightness(1);
  }
  50% { 
    box-shadow: 0 0 20px theme('colors.accent-cyan'); 
    filter: brightness(1.2);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .protocol-grid {
    @apply grid-cols-1 gap-6;
  }
  
  .step-card {
    min-height: 280px;
  }
  
  .connection-lines {
    display: none;
  }
  
  .subtitle-container {
    @apply flex-col gap-2;
  }
  
  .subtitle-line {
    @apply w-24;
  }
  
  .summary-container {
    @apply flex-col gap-4;
  }
  
  .summary-line {
    @apply w-24;
  }
}

@media (max-width: 480px) {
  .step-number {
    @apply -top-2 -right-2 w-12 h-12;
  }
  
  .number-glow span {
    @apply text-xl;
  }
  
  .icon-container {
    @apply w-16 h-16;
  }
  
  .icon-hologram {
    @apply w-10 h-10;
  }
}
</style>