<template>
  <section class="tienda-recursos py-20 relative overflow-hidden">
    <!-- Background Effects -->
    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-brand-primary/5 to-transparent"></div>
    <div class="absolute inset-0 cyber-grid opacity-10"></div>
    
    <!-- Floating Particles -->
    <div class="absolute inset-0 overflow-hidden">
      <div 
        v-for="i in 20" 
        :key="i"
        class="absolute w-1 h-1 bg-accent-cyan rounded-full animate-float"
        :style="{
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          animationDelay: Math.random() * 5 + 's',
          animationDuration: (3 + Math.random() * 4) + 's'
        }"
      ></div>
    </div>

    <div class="container mx-auto px-6 relative z-10">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <GlitchText 
          text="TIENDA DE RECURSOS" 
          class="text-4xl md:text-6xl font-bold mb-6"
        />
        <p class="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
          Accede a herramientas digitales premium, plantillas exclusivas y software de élite 
          para maximizar tu rendimiento académico y profesional.
        </p>
      </div>

      <!-- Products Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <div 
          v-for="(product, index) in products" 
          :key="product.id"
          class="product-card group"
          :style="{ animationDelay: index * 0.1 + 's' }"
        >
          <HologramCard class="h-full">
            <div class="p-6 h-full flex flex-col">
              <!-- Product Icon with AR Effect -->
              <div class="relative mb-6">
                <div class="w-16 h-16 mx-auto bg-gradient-to-br from-accent-cyan to-accent-magenta rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <i :class="product.icon" class="text-2xl text-bg-primary"></i>
                </div>
                <!-- AR Scanning Effect -->
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-accent-cyan/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>

              <!-- Product Info -->
              <h3 class="text-xl font-bold text-text-primary mb-3 group-hover:text-accent-cyan transition-colors">
                {{ product.name }}
              </h3>
              <p class="text-text-secondary mb-4 flex-grow">
                {{ product.description }}
              </p>

              <!-- Features -->
              <ul class="text-sm text-text-muted mb-6 space-y-1">
                <li v-for="feature in product.features" :key="feature" class="flex items-center">
                  <i class="fas fa-check text-accent-cyan mr-2"></i>
                  {{ feature }}
                </li>
              </ul>

              <!-- Price with Digital Counter -->
              <div class="mb-6">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-text-secondary">Precio:</span>
                  <div class="flex items-center space-x-2">
                    <span v-if="product.originalPrice" class="text-text-muted line-through text-sm">
                      ${{ product.originalPrice }}
                    </span>
                    <AnimatedCounter 
                      :target="product.price" 
                      :duration="2000"
                      class="text-2xl font-bold text-accent-cyan digital-price"
                      prefix="$"
                    />
                  </div>
                </div>
                <div v-if="product.discount" class="text-right">
                  <span class="bg-accent-magenta/20 text-accent-magenta px-2 py-1 rounded text-xs font-bold">
                    -{{ product.discount }}% DESCUENTO
                  </span>
                </div>
              </div>

              <!-- Purchase Button with Biometric Effect -->
              <NeonButton 
                @click="purchaseProduct(product)"
                class="w-full group-hover:shadow-lg group-hover:shadow-accent-cyan/25"
                :class="{ 'animate-pulse': product.limited }"
              >
                <i class="fas fa-fingerprint mr-2"></i>
                {{ product.limited ? 'ACCESO LIMITADO' : 'ADQUIRIR RECURSO' }}
              </NeonButton>

              <!-- Limited Time Indicator -->
              <div v-if="product.limited" class="mt-3 text-center">
                <span class="text-xs text-accent-magenta animate-pulse">
                  <i class="fas fa-clock mr-1"></i>
                  Disponible por tiempo limitado
                </span>
              </div>
            </div>
          </HologramCard>
        </div>
      </div>

      <!-- Special Offers Section -->
      <div class="bg-gradient-to-r from-brand-primary/10 to-accent-magenta/10 rounded-lg p-8 border border-brand-primary/30">
        <div class="text-center">
          <h3 class="text-2xl font-bold text-text-primary mb-4">
            <i class="fas fa-star text-accent-cyan mr-2"></i>
            OFERTAS EXCLUSIVAS DEL SINDICATO
          </h3>
          <p class="text-text-secondary mb-6">
            Accede a paquetes premium con descuentos especiales para miembros verificados
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-bg-secondary/50 rounded-lg p-6 border border-accent-cyan/20">
              <h4 class="text-lg font-bold text-accent-cyan mb-2">PAQUETE ACADÉMICO ÉLITE</h4>
              <p class="text-text-secondary text-sm mb-4">
                Todas las plantillas + Software + Consultoría personalizada
              </p>
              <div class="flex items-center justify-between">
                <span class="text-text-muted line-through">$299</span>
                <AnimatedCounter 
                  :target="199" 
                  :duration="1500"
                  class="text-xl font-bold text-accent-cyan"
                  prefix="$"
                />
              </div>
            </div>
            <div class="bg-bg-secondary/50 rounded-lg p-6 border border-accent-magenta/20">
              <h4 class="text-lg font-bold text-accent-magenta mb-2">ARSENAL COMPLETO</h4>
              <p class="text-text-secondary text-sm mb-4">
                Acceso vitalicio a todas las herramientas y actualizaciones
              </p>
              <div class="flex items-center justify-between">
                <span class="text-text-muted line-through">$499</span>
                <AnimatedCounter 
                  :target="349" 
                  :duration="1500"
                  class="text-xl font-bold text-accent-magenta"
                  prefix="$"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import GlitchText from '@/components/ui/GlitchText.vue'
import HologramCard from '@/components/ui/HologramCard.vue'
import NeonButton from '@/components/ui/NeonButton.vue'
import AnimatedCounter from '@/components/ui/AnimatedCounter.vue'

interface Product {
  id: string
  name: string
  description: string
  features: string[]
  price: number
  originalPrice?: number
  discount?: number
  icon: string
  limited?: boolean
}

const products = ref<Product[]>([
  {
    id: 'templates-premium',
    name: 'Plantillas Premium',
    description: 'Colección exclusiva de plantillas para ensayos, tesis y presentaciones con diseño profesional.',
    features: [
      'Más de 50 plantillas únicas',
      'Formatos LaTeX y Word',
      'Actualizaciones gratuitas',
      'Soporte técnico 24/7'
    ],
    price: 89,
    originalPrice: 129,
    discount: 31,
    icon: 'fas fa-file-alt'
  },
  {
    id: 'ai-toolkit',
    name: 'Kit de Herramientas IA',
    description: 'Suite completa de herramientas de inteligencia artificial para investigación y análisis académico.',
    features: [
      'Análisis de texto avanzado',
      'Generación de citas automática',
      'Detección de plagio',
      'Resumen inteligente'
    ],
    price: 149,
    originalPrice: 199,
    discount: 25,
    icon: 'fas fa-robot',
    limited: true
  },
  {
    id: 'research-software',
    name: 'Software de Investigación',
    description: 'Plataforma integral para gestión de proyectos de investigación con análisis estadístico.',
    features: [
      'Gestión de referencias',
      'Análisis estadístico',
      'Visualización de datos',
      'Colaboración en tiempo real'
    ],
    price: 199,
    originalPrice: 299,
    discount: 33,
    icon: 'fas fa-chart-line'
  },
  {
    id: 'writing-assistant',
    name: 'Asistente de Escritura',
    description: 'IA especializada en escritura académica con corrección de estilo y sugerencias.',
    features: [
      'Corrección gramatical avanzada',
      'Sugerencias de estilo',
      'Verificación de coherencia',
      'Optimización de legibilidad'
    ],
    price: 79,
    originalPrice: 119,
    discount: 34,
    icon: 'fas fa-pen-fancy'
  },
  {
    id: 'data-analyzer',
    name: 'Analizador de Datos',
    description: 'Herramienta profesional para análisis de datos cuantitativos y cualitativos.',
    features: [
      'Análisis multivariado',
      'Visualizaciones interactivas',
      'Exportación automática',
      'Integración con SPSS/R'
    ],
    price: 169,
    originalPrice: 249,
    discount: 32,
    icon: 'fas fa-database'
  },
  {
    id: 'presentation-master',
    name: 'Master de Presentaciones',
    description: 'Creador automático de presentaciones profesionales con animaciones y efectos.',
    features: [
      'Plantillas interactivas',
      'Animaciones automáticas',
      'Integración multimedia',
      'Exportación múltiple'
    ],
    price: 99,
    originalPrice: 149,
    discount: 34,
    icon: 'fas fa-presentation',
    limited: true
  }
])

const purchaseProduct = (product: Product) => {
  // Simulate biometric authentication effect
  console.log(`Iniciando compra de ${product.name}...`)
  // Here would be the actual purchase logic
}

onMounted(() => {
  // Add entrance animations
  const cards = document.querySelectorAll('.product-card')
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('animate-fade-in-up')
    }, index * 100)
  })
})
</script>

<style scoped>
.tienda-recursos {
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-primary) 100%);
}

.cyber-grid {
  background-image: 
    linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
}

.product-card {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s ease;
}

.product-card.animate-fade-in-up {
  opacity: 1;
  transform: translateY(0);
}

.digital-price {
  font-family: 'Orbitron', monospace;
  text-shadow: 0 0 10px currentColor;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}

/* AR Scanning Effect */
.product-card:hover .bg-gradient-to-r {
  animation: scan 1s ease-in-out;
}

@keyframes scan {
  0% { transform: translateX(-100%) skewX(-12deg); }
  100% { transform: translateX(100%) skewX(-12deg); }
}
</style>