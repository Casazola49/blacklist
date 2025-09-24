<template>
  <section class="estadisticas-sistema py-20 relative overflow-hidden">
    <!-- Background Matrix Effect -->
    <div class="absolute inset-0 matrix-bg opacity-5"></div>
    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-brand-primary/10 to-transparent"></div>
    
    <!-- Animated Circuit Lines -->
    <svg class="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="circuitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:var(--accent-cyan);stop-opacity:0.3" />
          <stop offset="50%" style="stop-color:var(--accent-magenta);stop-opacity:0.5" />
          <stop offset="100%" style="stop-color:var(--accent-cyan);stop-opacity:0.3" />
        </linearGradient>
      </defs>
      <path 
        d="M0,100 Q200,50 400,100 T800,100 L800,200 Q600,150 400,200 T0,200 Z" 
        fill="none" 
        stroke="url(#circuitGradient)" 
        stroke-width="2"
        class="animate-pulse"
      />
    </svg>

    <div class="container mx-auto px-6 relative z-10">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <GlitchText 
          text="ESTADÍSTICAS DEL SISTEMA" 
          class="text-4xl md:text-6xl font-bold mb-6"
        />
        <p class="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
          Métricas en tiempo real que demuestran la eficiencia y poder de nuestra red de élite académica.
        </p>
      </div>

      <!-- Main Statistics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <div 
          v-for="(stat, index) in mainStats" 
          :key="stat.id"
          class="stat-card"
          :style="{ animationDelay: index * 0.2 + 's' }"
        >
          <HologramCard class="h-full">
            <div class="p-6 text-center">
              <!-- Icon with Glow Effect -->
              <div class="relative mb-4">
                <div class="w-16 h-16 mx-auto bg-gradient-to-br from-accent-cyan/20 to-accent-magenta/20 rounded-full flex items-center justify-center border border-accent-cyan/30">
                  <i :class="stat.icon" class="text-2xl text-accent-cyan"></i>
                </div>
                <!-- Pulse Ring -->
                <div class="absolute inset-0 rounded-full border-2 border-accent-cyan/30 animate-ping"></div>
              </div>

              <!-- Animated Counter -->
              <div class="mb-2">
                <AnimatedCounter 
                  :target="stat.value" 
                  :duration="3000"
                  class="text-3xl font-bold text-text-primary digital-display"
                  :suffix="stat.suffix"
                  :prefix="stat.prefix"
                />
              </div>

              <!-- Label -->
              <h3 class="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                {{ stat.label }}
              </h3>

              <!-- Trend Indicator -->
              <div class="mt-3 flex items-center justify-center space-x-2">
                <i 
                  :class="stat.trend > 0 ? 'fas fa-arrow-up text-accent-cyan' : 'fas fa-arrow-down text-accent-magenta'"
                ></i>
                <span 
                  :class="stat.trend > 0 ? 'text-accent-cyan' : 'text-accent-magenta'"
                  class="text-sm font-bold"
                >
                  {{ Math.abs(stat.trend) }}%
                </span>
              </div>
            </div>
          </HologramCard>
        </div>
      </div>

      <!-- Real-time Activity Dashboard -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        <!-- Activity Feed -->
        <HologramCard>
          <div class="p-6">
            <h3 class="text-xl font-bold text-text-primary mb-6 flex items-center">
              <i class="fas fa-activity text-accent-cyan mr-3"></i>
              ACTIVIDAD EN TIEMPO REAL
            </h3>
            <div class="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
              <div 
                v-for="(activity, index) in realtimeActivities" 
                :key="activity.id"
                class="activity-item flex items-center space-x-4 p-3 rounded-lg bg-bg-secondary/30 border-l-4"
                :class="getActivityBorderColor(activity.type)"
                :style="{ animationDelay: index * 0.1 + 's' }"
              >
                <div class="flex-shrink-0">
                  <div 
                    class="w-8 h-8 rounded-full flex items-center justify-center"
                    :class="getActivityIconBg(activity.type)"
                  >
                    <i :class="activity.icon" class="text-xs"></i>
                  </div>
                </div>
                <div class="flex-grow">
                  <p class="text-sm text-text-primary">{{ activity.message }}</p>
                  <p class="text-xs text-text-muted">{{ activity.timestamp }}</p>
                </div>
                <div class="flex-shrink-0">
                  <span class="text-xs text-accent-cyan font-mono">{{ activity.value }}</span>
                </div>
              </div>
            </div>
          </div>
        </HologramCard>

        <!-- Performance Metrics -->
        <HologramCard>
          <div class="p-6">
            <h3 class="text-xl font-bold text-text-primary mb-6 flex items-center">
              <i class="fas fa-chart-line text-accent-magenta mr-3"></i>
              MÉTRICAS DE RENDIMIENTO
            </h3>
            <div class="space-y-6">
              <div v-for="metric in performanceMetrics" :key="metric.id" class="metric-item">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-semibold text-text-secondary">{{ metric.label }}</span>
                  <span class="text-sm font-bold text-accent-cyan">{{ metric.value }}{{ metric.unit }}</span>
                </div>
                <div class="relative">
                  <div class="w-full bg-bg-tertiary rounded-full h-2">
                    <div 
                      class="h-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-magenta transition-all duration-2000 ease-out"
                      :style="{ width: metric.percentage + '%' }"
                    ></div>
                  </div>
                  <!-- Animated Progress Indicator -->
                  <div 
                    class="absolute top-0 h-2 w-1 bg-white rounded-full animate-pulse"
                    :style="{ left: metric.percentage + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </HologramCard>
      </div>

      <!-- Network Status -->
      <div class="bg-gradient-to-r from-bg-secondary/50 to-bg-tertiary/50 rounded-lg p-8 border border-accent-cyan/20">
        <div class="text-center mb-8">
          <h3 class="text-2xl font-bold text-text-primary mb-4">
            <i class="fas fa-network-wired text-accent-cyan mr-3"></i>
            ESTADO DE LA RED
          </h3>
          <p class="text-text-secondary">
            Monitoreo continuo de la infraestructura del sindicato
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="node in networkNodes" :key="node.id" class="text-center">
            <div class="relative mb-4">
              <RadialProgress 
                :value="node.status" 
                size="large"
                :stroke-width="4"
                class="mx-auto"
              />
              <div class="absolute inset-0 flex items-center justify-center">
                <i :class="node.icon" class="text-xl text-accent-cyan"></i>
              </div>
            </div>
            <h4 class="text-sm font-bold text-text-primary mb-1">{{ node.name }}</h4>
            <p class="text-xs text-text-secondary">{{ node.description }}</p>
            <div class="mt-2">
              <span 
                class="inline-block w-2 h-2 rounded-full mr-2"
                :class="node.status > 95 ? 'bg-accent-cyan' : node.status > 80 ? 'bg-yellow-400' : 'bg-accent-magenta'"
              ></span>
              <span class="text-xs font-mono text-text-muted">{{ node.status }}% OPERATIVO</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import GlitchText from '@/components/ui/GlitchText.vue'
import HologramCard from '@/components/ui/HologramCard.vue'
import AnimatedCounter from '@/components/ui/AnimatedCounter.vue'
import RadialProgress from '@/components/ui/RadialProgress.vue'

interface Statistic {
  id: string
  label: string
  value: number
  suffix?: string
  prefix?: string
  icon: string
  trend: number
}

interface Activity {
  id: string
  type: 'contract' | 'payment' | 'user' | 'system'
  message: string
  timestamp: string
  value: string
  icon: string
}

interface PerformanceMetric {
  id: string
  label: string
  value: number
  unit: string
  percentage: number
}

interface NetworkNode {
  id: string
  name: string
  description: string
  status: number
  icon: string
}

const mainStats = ref<Statistic[]>([
  {
    id: 'projects',
    label: 'Proyectos Completados',
    value: 12847,
    icon: 'fas fa-check-circle',
    trend: 23.5
  },
  {
    id: 'satisfaction',
    label: 'Satisfacción Promedio',
    value: 98.7,
    suffix: '%',
    icon: 'fas fa-star',
    trend: 5.2
  },
  {
    id: 'response',
    label: 'Tiempo de Respuesta',
    value: 2.3,
    suffix: 'h',
    icon: 'fas fa-clock',
    trend: -15.8
  },
  {
    id: 'specialists',
    label: 'Especialistas Activos',
    value: 1247,
    icon: 'fas fa-users',
    trend: 12.4
  }
])

const realtimeActivities = ref<Activity[]>([
  {
    id: '1',
    type: 'contract',
    message: 'Nuevo contrato creado: "Análisis Estadístico Avanzado"',
    timestamp: 'hace 2 min',
    value: '$450',
    icon: 'fas fa-file-contract'
  },
  {
    id: '2',
    type: 'payment',
    message: 'Pago liberado para proyecto de Machine Learning',
    timestamp: 'hace 5 min',
    value: '$1,200',
    icon: 'fas fa-dollar-sign'
  },
  {
    id: '3',
    type: 'user',
    message: 'Nuevo especialista aprobado: Dr. Elena Vásquez',
    timestamp: 'hace 8 min',
    value: '★★★★★',
    icon: 'fas fa-user-plus'
  },
  {
    id: '4',
    type: 'system',
    message: 'Actualización de seguridad implementada',
    timestamp: 'hace 12 min',
    value: 'v2.1.4',
    icon: 'fas fa-shield-alt'
  },
  {
    id: '5',
    type: 'contract',
    message: 'Propuesta aceptada: "Revisión de Tesis Doctoral"',
    timestamp: 'hace 15 min',
    value: '$800',
    icon: 'fas fa-handshake'
  }
])

const performanceMetrics = ref<PerformanceMetric[]>([
  {
    id: 'uptime',
    label: 'Tiempo de Actividad',
    value: 99.9,
    unit: '%',
    percentage: 99.9
  },
  {
    id: 'speed',
    label: 'Velocidad de Respuesta',
    value: 1.2,
    unit: 's',
    percentage: 85
  },
  {
    id: 'security',
    label: 'Nivel de Seguridad',
    value: 100,
    unit: '%',
    percentage: 100
  },
  {
    id: 'efficiency',
    label: 'Eficiencia del Sistema',
    value: 94.5,
    unit: '%',
    percentage: 94.5
  }
])

const networkNodes = ref<NetworkNode[]>([
  {
    id: 'auth',
    name: 'AUTENTICACIÓN',
    description: 'Sistema de acceso seguro',
    status: 99.8,
    icon: 'fas fa-lock'
  },
  {
    id: 'database',
    name: 'BASE DE DATOS',
    description: 'Almacenamiento distribuido',
    status: 97.2,
    icon: 'fas fa-database'
  },
  {
    id: 'ai',
    name: 'NÚCLEO IA',
    description: 'Procesamiento inteligente',
    status: 95.6,
    icon: 'fas fa-brain'
  }
])

let activityInterval: number

const getActivityBorderColor = (type: string) => {
  const colors = {
    contract: 'border-accent-cyan',
    payment: 'border-green-400',
    user: 'border-accent-magenta',
    system: 'border-yellow-400'
  }
  return colors[type as keyof typeof colors] || 'border-accent-cyan'
}

const getActivityIconBg = (type: string) => {
  const colors = {
    contract: 'bg-accent-cyan/20 text-accent-cyan',
    payment: 'bg-green-400/20 text-green-400',
    user: 'bg-accent-magenta/20 text-accent-magenta',
    system: 'bg-yellow-400/20 text-yellow-400'
  }
  return colors[type as keyof typeof colors] || 'bg-accent-cyan/20 text-accent-cyan'
}

const simulateRealtimeUpdates = () => {
  // Simulate new activities
  const newActivity: Activity = {
    id: Date.now().toString(),
    type: ['contract', 'payment', 'user', 'system'][Math.floor(Math.random() * 4)] as Activity['type'],
    message: 'Nueva actividad del sistema detectada',
    timestamp: 'hace 1 min',
    value: '$' + Math.floor(Math.random() * 1000 + 100),
    icon: 'fas fa-bolt'
  }
  
  realtimeActivities.value.unshift(newActivity)
  if (realtimeActivities.value.length > 10) {
    realtimeActivities.value.pop()
  }
}

onMounted(() => {
  // Start real-time simulation
  activityInterval = setInterval(simulateRealtimeUpdates, 10000)
  
  // Add entrance animations
  const cards = document.querySelectorAll('.stat-card')
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('animate-fade-in-up')
    }, index * 200)
  })
})

onUnmounted(() => {
  if (activityInterval) {
    clearInterval(activityInterval)
  }
})
</script>

<style scoped>
.estadisticas-sistema {
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-primary) 100%);
}

.matrix-bg {
  background-image: 
    radial-gradient(circle at 25% 25%, var(--accent-cyan) 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, var(--accent-magenta) 1px, transparent 1px);
  background-size: 100px 100px;
  animation: matrix-scroll 20s linear infinite;
}

@keyframes matrix-scroll {
  0% { background-position: 0 0, 50px 50px; }
  100% { background-position: 100px 100px, 150px 150px; }
}

.stat-card {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s ease;
}

.stat-card.animate-fade-in-up {
  opacity: 1;
  transform: translateY(0);
}

.digital-display {
  font-family: 'Orbitron', monospace;
  text-shadow: 0 0 10px currentColor;
}

.activity-item {
  opacity: 0;
  animation: slideInLeft 0.5s ease forwards;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--accent-cyan);
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--accent-magenta);
}

.metric-item {
  animation: fadeInUp 0.6s ease forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>