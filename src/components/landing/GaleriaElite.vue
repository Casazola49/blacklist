<template>
  <section class="galeria-elite-section relative min-h-screen bg-bg-primary overflow-hidden">
    <!-- Background Effects -->
    <div class="absolute inset-0">
      <div class="hologram-grid"></div>
      <div class="floating-particles">
        <div 
          v-for="i in 20" 
          :key="i" 
          class="particle" 
          :style="{ 
            left: `${Math.random() * 100}%`, 
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`
          }"
        ></div>
      </div>
    </div>

    <div class="container relative z-10 py-20">
      <!-- Section Header - V2.0 Updated -->
      <div class="text-center mb-16">
        <GlitchText 
          text="AUXILIARES-ESPECIALISTAS DE NUESTRA ORGANIZACION" 
          class="text-4xl md:text-6xl font-black mb-6"
          variant="primary"
          :active="true"
          :intense="true"
        />
        <div class="max-w-3xl mx-auto">
          <p class="text-lg text-text-secondary font-mono mb-4">
            Cada especialista ha superado nuestro riguroso protocolo de verificación de habilidades y discreción.
          </p>
        </div>
      </div>

      <!-- 3D Carousel Container -->
      <div class="carousel-container perspective-1000 mb-16">
        <div 
          class="carousel-3d transform-3d"
          :style="{ transform: `rotateY(${currentRotation}deg)` }"
        >
          <div
            v-for="(specialist, index) in specialists"
            :key="specialist.id"
            class="carousel-item"
            :class="{ 'carousel-item--active': index === activeIndex }"
            :style="{ 
              transform: `rotateY(${index * (360 / specialists.length)}deg) translateZ(400px)` 
            }"
          >
            <HologramCard 
              variant="primary" 
              :active="index === activeIndex"
              :show-particles="index === activeIndex"
              :intensity="1.5"
              class="specialist-card"
            >
              <div class="specialist-profile">
                <!-- Avatar with Hologram Effect -->
                <div class="avatar-container mb-6">
                  <div class="avatar-hologram">
                    <img 
                      :src="specialist.avatar" 
                      :alt="specialist.alias"
                      class="avatar-image"
                    />
                    <div class="avatar-scan-lines"></div>
                    <div class="avatar-glow"></div>
                  </div>
                  <div class="status-indicator" :class="`status-${specialist.status}`">
                    <div class="status-pulse"></div>
                  </div>
                </div>

                <!-- Specialist Info -->
                <div class="specialist-info text-center">
                  <h3 class="text-2xl font-bold text-primary mb-2">
                    {{ specialist.alias }}
                  </h3>
                  <p class="text-accent-cyan font-mono text-sm mb-4">
                    {{ specialist.specialization }}
                  </p>
                  
                  <!-- Animated Statistics -->
                  <div class="stats-grid grid grid-cols-2 gap-4 mb-6">
                    <div class="stat-item">
                      <div class="stat-value text-2xl font-bold text-accent-magenta">
                        <AnimatedCounter :target="specialist.completedJobs" />
                      </div>
                      <div class="stat-label text-xs text-text-muted">TRABAJOS</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-value text-2xl font-bold text-accent-cyan">
                        {{ specialist.rating.toFixed(1) }}
                      </div>
                      <div class="stat-label text-xs text-text-muted">RATING</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-value text-2xl font-bold text-success">
                        {{ specialist.responseTime }}h
                      </div>
                      <div class="stat-label text-xs text-text-muted">RESPUESTA</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-value text-2xl font-bold text-warning">
                        {{ specialist.successRate }}%
                      </div>
                      <div class="stat-label text-xs text-text-muted">ÉXITO</div>
                    </div>
                  </div>

                  <!-- Skills Tags -->
                  <div class="skills-container mb-6">
                    <div class="skills-grid flex flex-wrap justify-center gap-2">
                      <span 
                        v-for="skill in specialist.skills.slice(0, 4)" 
                        :key="skill"
                        class="skill-tag"
                      >
                        {{ skill }}
                      </span>
                    </div>
                  </div>

                  <!-- Testimonial -->
                  <div class="testimonial-container">
                    <blockquote class="text-sm text-text-secondary italic">
                      "{{ specialist.testimonial }}"
                    </blockquote>
                  </div>
                </div>
              </div>
            </HologramCard>
          </div>
        </div>

        <!-- Navigation Controls -->
        <div class="carousel-controls">
          <button 
            @click="previousSpecialist"
            class="control-btn control-btn--prev"
            :disabled="isTransitioning"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            @click="nextSpecialist"
            class="control-btn control-btn--next"
            :disabled="isTransitioning"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Indicators -->
        <div class="carousel-indicators">
          <button
            v-for="(specialist, index) in specialists"
            :key="specialist.id"
            @click="goToSpecialist(index)"
            class="indicator"
            :class="{ 'indicator--active': index === activeIndex }"
          >
            <span class="sr-only">Especialista {{ index + 1 }}</span>
          </button>
        </div>
      </div>

      <!-- Featured Stats Section -->
      <div class="featured-stats grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="stat-card">
          <HologramCard variant="secondary" class="h-full">
            <div class="text-center p-6">
              <div class="text-4xl font-bold text-accent-cyan mb-2">
                <AnimatedCounter :target="100" />+
              </div>
              <div class="text-text-muted font-mono">Especialistas Activos</div>
            </div>
          </HologramCard>
        </div>
        <div class="stat-card">
          <HologramCard variant="accent" class="h-full">
            <div class="text-center p-6">
              <div class="text-4xl font-bold text-accent-magenta mb-2">
                98.7%
              </div>
              <div class="text-text-muted font-mono">Tasa de Satisfacción</div>
            </div>
          </HologramCard>
        </div>
        <div class="stat-card">
          <HologramCard variant="primary" class="h-full">
            <div class="text-center p-6">
              <div class="text-4xl font-bold text-success mb-2">
                <AnimatedCounter :target="24" />h
              </div>
              <div class="text-text-muted font-mono">Tiempo Promedio</div>
            </div>
          </HologramCard>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import GlitchText from '../ui/GlitchText.vue'
import HologramCard from '../ui/HologramCard.vue'
import AnimatedCounter from '../ui/AnimatedCounter.vue'

interface Specialist {
  id: string
  alias: string
  avatar: string
  specialization: string
  completedJobs: number
  rating: number
  responseTime: number
  successRate: number
  skills: string[]
  testimonial: string
  status: 'online' | 'busy' | 'offline'
}

const specialists = ref<Specialist[]>([
  {
    id: '1',
    alias: 'Carlitos',
    avatar: '/imagen 1.png',
    specialization: 'Especialista en materias de Quimica',
    completedJobs: 342,
    rating: 4.9,
    responseTime: 2,
    successRate: 98,
    skills: ['Python', 'Machine Learning', 'Blockchain', 'Cybersecurity'],
    testimonial: 'La calidad del trabajo superó todas mis expectativas. Mi análisis estadístico fue transformado completamente.',
    status: 'online'
  },
  {
    id: '2',
    alias: 'El Diego',
    avatar: '/imagen 2.png',
    specialization: 'Especialista en materias de Quimica',
    completedJobs: 189,
    rating: 4.8,
    responseTime: 4,
    successRate: 96,
    skills: ['Quantum Computing', 'Mathematics', 'Research', 'Analysis'],
    testimonial: 'Increíble experiencia. Mi tesis estaba estancada por meses hasta que encontré a mi especialista.',
    status: 'busy'
  },
  {
    id: '3',
    alias: 'Ing. Anita',
    avatar: '/imagen 3.png',
    specialization: 'Egresada especialista en materias de Calculo',
    completedJobs: 267,
    rating: 4.9,
    responseTime: 3,
    successRate: 97,
    skills: ['AI/ML', 'Neuroscience', 'Data Science', 'Psychology'],
    testimonial: 'Como estudiante internacional, necesitaba ayuda con el formato y estilo académico local.',
    status: 'online'
  },
  {
    id: '4',
    alias: 'Pitita',
    avatar: '/imagen 4.png',
    specialization: 'Especialista en Dinamica',
    completedJobs: 156,
    rating: 4.7,
    responseTime: 6,
    successRate: 94,
    skills: ['Cryptography', 'Security', 'Blockchain', 'Mathematics'],
    testimonial: 'La plataforma es revolucionaria. Encontré exactamente el tipo de especialista que necesitaba.',
    status: 'online'
  },
  {
    id: '5',
    alias: 'Ing. Cruskaya',
    avatar: '/imagen 5.png',
    specialization: 'Especialista en Laboratorios de Quimica',
    completedJobs: 203,
    rating: 4.8,
    responseTime: 5,
    successRate: 95,
    skills: ['VR/AR', '3D Graphics', 'Unity', 'Game Development'],
    testimonial: 'Después de intentar con otras plataformas, The Blacklist es superior en todos los aspectos.',
    status: 'busy'
  }
])

const activeIndex = ref(0)
const currentRotation = ref(0)
const isTransitioning = ref(false)
let autoRotateInterval: number | null = null

const nextSpecialist = () => {
  if (isTransitioning.value) return
  
  isTransitioning.value = true
  activeIndex.value = (activeIndex.value + 1) % specialists.value.length
  currentRotation.value -= 360 / specialists.value.length
  
  setTimeout(() => {
    isTransitioning.value = false
  }, 800)
}

const previousSpecialist = () => {
  if (isTransitioning.value) return
  
  isTransitioning.value = true
  activeIndex.value = activeIndex.value === 0 ? specialists.value.length - 1 : activeIndex.value - 1
  currentRotation.value += 360 / specialists.value.length
  
  setTimeout(() => {
    isTransitioning.value = false
  }, 800)
}

const goToSpecialist = (index: number) => {
  if (isTransitioning.value || index === activeIndex.value) return
  
  isTransitioning.value = true
  const diff = index - activeIndex.value
  activeIndex.value = index
  currentRotation.value -= diff * (360 / specialists.value.length)
  
  setTimeout(() => {
    isTransitioning.value = false
  }, 800)
}

const startAutoRotate = () => {
  autoRotateInterval = setInterval(() => {
    nextSpecialist()
  }, 5000)
}

const stopAutoRotate = () => {
  if (autoRotateInterval) {
    clearInterval(autoRotateInterval)
    autoRotateInterval = null
  }
}

onMounted(() => {
  startAutoRotate()
})

onUnmounted(() => {
  stopAutoRotate()
})
</script>

<style scoped>
.galeria-elite-section {
  position: relative;
  background: linear-gradient(135deg, 
    rgba(10, 10, 10, 1) 0%, 
    rgba(26, 26, 26, 0.8) 50%, 
    rgba(10, 10, 10, 1) 100%
  );
}

.hologram-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: grid-pulse 4s ease-in-out infinite;
}

.floating-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.particle {
  position: absolute;
  width: 2px;
  height: 2px;
  background: theme('colors.accent-cyan');
  border-radius: 50%;
  animation: particle-float 6s infinite ease-in-out;
}

.particle:nth-child(odd) {
  background: theme('colors.accent-magenta');
}

.particle:nth-child(3n) {
  background: theme('colors.brand-primary');
}

.carousel-container {
  position: relative;
  height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-3d {
  position: relative;
  width: 300px;
  height: 400px;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.carousel-item {
  position: absolute;
  width: 300px;
  height: 400px;
  backface-visibility: hidden;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.carousel-item--active {
  z-index: 10;
}

.specialist-card {
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.specialist-profile {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.avatar-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-hologram {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid theme('colors.accent-cyan');
  box-shadow: 
    0 0 20px rgba(0, 255, 255, 0.5),
    inset 0 0 20px rgba(0, 255, 255, 0.1);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: contrast(1.2) brightness(1.1);
}

.avatar-scan-lines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 2px,
    rgba(0, 255, 255, 0.1) 2px,
    rgba(0, 255, 255, 0.1) 4px
  );
  animation: scan-lines 2s linear infinite;
}

.avatar-glow {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, 
    rgba(0, 255, 255, 0.3) 0%, 
    transparent 70%
  );
  animation: avatar-pulse 3s ease-in-out infinite;
}

.status-indicator {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid theme('colors.bg-primary');
}

.status-online {
  background: theme('colors.success');
  box-shadow: 0 0 10px theme('colors.success');
}

.status-busy {
  background: theme('colors.warning');
  box-shadow: 0 0 10px theme('colors.warning');
}

.status-offline {
  background: theme('colors.text-muted');
}

.status-pulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid currentColor;
  animation: status-pulse 2s ease-in-out infinite;
}

.stats-grid {
  background: rgba(0, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(0, 255, 255, 0.2);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-family: 'JetBrains Mono', monospace;
  text-shadow: 0 0 10px currentColor;
}

.skills-container {
  max-height: 60px;
  overflow: hidden;
}

.skill-tag {
  display: inline-block;
  padding: 4px 8px;
  background: rgba(255, 0, 255, 0.1);
  border: 1px solid rgba(255, 0, 255, 0.3);
  border-radius: 12px;
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  color: theme('colors.accent-magenta');
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.testimonial-container {
  padding: 12px;
  background: rgba(128, 0, 32, 0.1);
  border-left: 3px solid theme('colors.brand-primary');
  border-radius: 4px;
}

.carousel-controls {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 20;
}

.control-btn {
  pointer-events: all;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0, 255, 255, 0.1);
  border: 2px solid rgba(0, 255, 255, 0.3);
  color: theme('colors.accent-cyan');
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.control-btn:hover:not(:disabled) {
  background: rgba(0, 255, 255, 0.2);
  border-color: rgba(0, 255, 255, 0.6);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
  transform: scale(1.1);
}

.control-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.control-btn--prev {
  margin-left: -100px;
}

.control-btn--next {
  margin-right: -100px;
}

.carousel-indicators {
  position: absolute;
  bottom: -60px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  z-index: 20;
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;
}

.indicator--active {
  background: theme('colors.accent-cyan');
  border-color: theme('colors.accent-cyan');
  box-shadow: 0 0 10px theme('colors.accent-cyan');
}

.indicator:hover:not(.indicator--active) {
  background: rgba(255, 255, 255, 0.4);
  transform: scale(1.2);
}

.featured-stats {
  margin-top: 80px;
}

.stat-card {
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

@keyframes grid-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
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
    transform: translateY(-20px) translateX(20px) rotate(360deg);
    opacity: 0;
  }
}

@keyframes scan-lines {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

@keyframes avatar-pulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}

@keyframes status-pulse {
  0%, 100% { opacity: 0; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.5); }
}

@media (max-width: 768px) {
  .carousel-container {
    height: 500px;
  }
  
  .carousel-3d {
    width: 280px;
    height: 380px;
  }
  
  .carousel-item {
    width: 280px;
    height: 380px;
  }
  
  .control-btn--prev {
    margin-left: -25px;
  }
  
  .control-btn--next {
    margin-right: -25px;
  }
  
  .featured-stats {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>