<template>
  <section class="preguntas-protocolo py-20 relative overflow-hidden">
    <!-- Background Effects -->
    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-accent-cyan/5 to-transparent"></div>
    <div class="absolute inset-0 scan-lines opacity-10"></div>
    
    <!-- Holographic Question Marks -->
    <div class="absolute inset-0 overflow-hidden">
      <div 
        v-for="i in 8" 
        :key="i"
        class="absolute text-accent-cyan/10 text-6xl animate-float-question"
        :style="{
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          animationDelay: Math.random() * 8 + 's',
          animationDuration: (6 + Math.random() * 4) + 's'
        }"
      >
        ?
      </div>
    </div>

    <div class="container mx-auto px-6 relative z-10">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <GlitchText 
          text="PREGUNTAS DEL PROTOCOLO" 
          class="text-4xl md:text-6xl font-bold mb-6"
        />
        <p class="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
          Respuestas clasificadas a las consultas más frecuentes sobre nuestro sistema de operaciones.
        </p>
      </div>

      <!-- Search Interface -->
      <div class="mb-12">
        <div class="max-w-2xl mx-auto relative">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar en la base de conocimiento..."
              class="w-full bg-bg-secondary/50 border border-accent-cyan/30 rounded-lg px-6 py-4 pl-12 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan focus:shadow-lg focus:shadow-accent-cyan/25 transition-all duration-300"
              @focus="isSearchFocused = true"
              @blur="isSearchFocused = false"
            >
            <div class="absolute left-4 top-1/2 transform -translate-y-1/2">
              <i 
                :class="isSearchFocused ? 'fas fa-search text-accent-cyan' : 'fas fa-search text-text-muted'"
                class="transition-colors duration-300"
              ></i>
            </div>
            <!-- Scanning Effect -->
            <div 
              v-if="isSearchFocused"
              class="absolute inset-0 bg-gradient-to-r from-transparent via-accent-cyan/20 to-transparent animate-scan-search rounded-lg"
            ></div>
          </div>
          
          <!-- Search Suggestions -->
          <div v-if="searchQuery && filteredFaqs.length > 0" class="absolute top-full left-0 right-0 mt-2 bg-bg-secondary border border-accent-cyan/30 rounded-lg shadow-lg z-20">
            <div class="p-2">
              <div 
                v-for="suggestion in filteredFaqs.slice(0, 3)" 
                :key="suggestion.id"
                class="p-3 hover:bg-accent-cyan/10 rounded cursor-pointer transition-colors"
                @click="selectFaq(suggestion.id)"
              >
                <span class="text-sm text-text-primary">{{ suggestion.question }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FAQ Categories -->
      <div class="mb-12">
        <div class="flex flex-wrap justify-center gap-4">
          <button
            v-for="category in categories"
            :key="category.id"
            @click="selectedCategory = category.id"
            :class="selectedCategory === category.id ? 'bg-accent-cyan text-bg-primary' : 'bg-bg-secondary/50 text-text-secondary hover:bg-accent-cyan/20 hover:text-accent-cyan'"
            class="px-6 py-3 rounded-lg border border-accent-cyan/30 transition-all duration-300 font-semibold"
          >
            <i :class="category.icon" class="mr-2"></i>
            {{ category.name }}
          </button>
        </div>
      </div>

      <!-- FAQ Accordion -->
      <div class="max-w-4xl mx-auto space-y-4">
        <div 
          v-for="(faq, index) in displayedFaqs" 
          :key="faq.id"
          class="faq-item"
          :style="{ animationDelay: index * 0.1 + 's' }"
        >
          <div 
            class="bg-bg-secondary/30 border border-accent-cyan/20 rounded-lg overflow-hidden hover:border-accent-cyan/50 transition-all duration-300 group"
            :class="{ 'border-accent-cyan/70 shadow-lg shadow-accent-cyan/10': openFaqs.includes(faq.id) }"
          >
            <!-- Question Header -->
            <button
              @click="toggleFaq(faq.id)"
              class="w-full p-6 text-left flex items-center justify-between hover:bg-accent-cyan/5 transition-colors duration-300"
            >
              <div class="flex items-center space-x-4">
                <!-- Holographic Icon -->
                <div class="relative">
                  <div class="w-10 h-10 bg-gradient-to-br from-accent-cyan/20 to-accent-magenta/20 rounded-full flex items-center justify-center border border-accent-cyan/30">
                    <i :class="faq.icon" class="text-accent-cyan"></i>
                  </div>
                  <!-- Scanning Ring -->
                  <div 
                    v-if="openFaqs.includes(faq.id)"
                    class="absolute inset-0 rounded-full border-2 border-accent-cyan/50 animate-ping"
                  ></div>
                </div>
                
                <div class="flex-grow">
                  <h3 class="text-lg font-semibold text-text-primary group-hover:text-accent-cyan transition-colors">
                    {{ faq.question }}
                  </h3>
                  <div class="flex items-center space-x-4 mt-1">
                    <span class="text-xs text-text-muted bg-accent-cyan/10 px-2 py-1 rounded">
                      {{ getCategoryName(faq.category) }}
                    </span>
                    <span class="text-xs text-accent-magenta font-mono">
                      ID: {{ faq.id.toUpperCase() }}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Expand Icon -->
              <div class="flex-shrink-0 ml-4">
                <i 
                  :class="openFaqs.includes(faq.id) ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
                  class="text-accent-cyan transition-transform duration-300"
                  :style="{ transform: openFaqs.includes(faq.id) ? 'rotate(180deg)' : 'rotate(0deg)' }"
                ></i>
              </div>
            </button>

            <!-- Answer Content -->
            <div 
              v-if="openFaqs.includes(faq.id)"
              class="answer-content"
              :class="{ 'animate-expand': openFaqs.includes(faq.id) }"
            >
              <div class="px-6 pb-6">
                <!-- Transmission Effect -->
                <div class="border-t border-accent-cyan/20 pt-4 relative">
                  <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent-cyan to-transparent animate-pulse"></div>
                  
                  <!-- Answer Text with Decryption Effect -->
                  <div 
                    class="text-text-secondary leading-relaxed"
                    :class="{ 'animate-decrypt-text': openFaqs.includes(faq.id) }"
                  >
                    <p class="mb-4">{{ faq.answer }}</p>
                    
                    <!-- Additional Info -->
                    <div v-if="faq.additionalInfo" class="bg-accent-cyan/5 border-l-4 border-accent-cyan/50 p-4 rounded-r-lg">
                      <h4 class="text-accent-cyan font-semibold mb-2">
                        <i class="fas fa-info-circle mr-2"></i>
                        Información Adicional
                      </h4>
                      <p class="text-sm text-text-secondary">{{ faq.additionalInfo }}</p>
                    </div>

                    <!-- Related Links -->
                    <div v-if="faq.relatedLinks && faq.relatedLinks.length > 0" class="mt-4">
                      <h4 class="text-accent-magenta font-semibold mb-2 text-sm">
                        <i class="fas fa-link mr-2"></i>
                        Enlaces Relacionados
                      </h4>
                      <div class="space-y-1">
                        <a 
                          v-for="link in faq.relatedLinks" 
                          :key="link.url"
                          :href="link.url"
                          class="block text-sm text-accent-cyan hover:text-accent-magenta transition-colors"
                        >
                          <i class="fas fa-external-link-alt mr-2 text-xs"></i>
                          {{ link.title }}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Support -->
      <div class="mt-16 text-center">
        <div class="bg-gradient-to-r from-bg-secondary/50 to-bg-tertiary/50 rounded-lg p-8 border border-accent-magenta/20">
          <h3 class="text-2xl font-bold text-text-primary mb-4">
            <i class="fas fa-headset text-accent-magenta mr-3"></i>
            ¿No encontraste tu respuesta?
          </h3>
          <p class="text-text-secondary mb-6">
            Nuestro equipo de soporte técnico está disponible 24/7 para asistencia especializada
          </p>
          <NeonButton class="mx-auto">
            <i class="fas fa-comments mr-2"></i>
            CONTACTAR SOPORTE TÉCNICO
          </NeonButton>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import GlitchText from '@/components/ui/GlitchText.vue'
import NeonButton from '@/components/ui/NeonButton.vue'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  icon: string
  additionalInfo?: string
  relatedLinks?: { title: string; url: string }[]
}

interface Category {
  id: string
  name: string
  icon: string
}

const searchQuery = ref('')
const selectedCategory = ref('all')
const openFaqs = ref<string[]>([])
const isSearchFocused = ref(false)

const categories = ref<Category[]>([
  { id: 'all', name: 'Todas', icon: 'fas fa-th-large' },
  { id: 'security', name: 'Seguridad', icon: 'fas fa-shield-alt' },
  { id: 'payments', name: 'Pagos', icon: 'fas fa-credit-card' },
  { id: 'quality', name: 'Calidad', icon: 'fas fa-star' },
  { id: 'process', name: 'Proceso', icon: 'fas fa-cogs' },
  { id: 'technical', name: 'Técnico', icon: 'fas fa-laptop-code' }
])

const faqs = ref<FAQ[]>([
  {
    id: 'sec-001',
    question: '¿Cómo garantizan la confidencialidad de mis proyectos?',
    answer: 'Utilizamos encriptación de grado militar AES-256 para todos los datos. Cada proyecto se almacena en servidores distribuidos con acceso restringido. Los especialistas firman acuerdos de confidencialidad legalmente vinculantes y solo acceden a la información necesaria para completar el trabajo.',
    category: 'security',
    icon: 'fas fa-user-secret',
    additionalInfo: 'Además, implementamos autenticación de dos factores y auditorías de seguridad regulares.',
    relatedLinks: [
      { title: 'Política de Privacidad', url: '#privacy' },
      { title: 'Certificaciones de Seguridad', url: '#security-certs' }
    ]
  },
  {
    id: 'pay-001',
    question: '¿Cómo funciona el sistema de depósito en garantía?',
    answer: 'Cuando aceptas una propuesta, depositas el pago en nuestro sistema de escrow seguro. Los fondos permanecen retenidos hasta que apruebes el trabajo final. Solo entonces se liberan al especialista, garantizando que recibas exactamente lo que pagaste.',
    category: 'payments',
    icon: 'fas fa-lock',
    additionalInfo: 'El sistema de escrow está respaldado por tecnología blockchain para máxima transparencia.',
    relatedLinks: [
      { title: 'Términos de Pago', url: '#payment-terms' },
      { title: 'Resolución de Disputas', url: '#disputes' }
    ]
  },
  {
    id: 'qual-001',
    question: '¿Cómo seleccionan a los especialistas?',
    answer: 'Cada especialista pasa por un riguroso proceso de verificación que incluye: validación de credenciales académicas, evaluación de portafolio, pruebas técnicas específicas, verificación de identidad y entrevistas con nuestro equipo. Solo el 3% de los aplicantes son aceptados.',
    category: 'quality',
    icon: 'fas fa-user-graduate',
    additionalInfo: 'Mantenemos un sistema de calificación continua y revisiones periódicas de rendimiento.',
    relatedLinks: [
      { title: 'Criterios de Selección', url: '#selection-criteria' },
      { title: 'Perfiles de Especialistas', url: '#specialists' }
    ]
  },
  {
    id: 'proc-001',
    question: '¿Cuánto tiempo toma completar un proyecto típico?',
    answer: 'Los tiempos varían según la complejidad: proyectos simples (1-3 días), proyectos medianos (1-2 semanas), proyectos complejos (2-4 semanas). Cada propuesta incluye un cronograma detallado. Nuestro promedio de entrega es 15% más rápido que la industria.',
    category: 'process',
    icon: 'fas fa-clock',
    additionalInfo: 'Ofrecemos actualizaciones de progreso regulares y comunicación directa con tu especialista.',
    relatedLinks: [
      { title: 'Cronogramas Típicos', url: '#timelines' },
      { title: 'Seguimiento de Proyectos', url: '#tracking' }
    ]
  },
  {
    id: 'tech-001',
    question: '¿Qué tecnologías utilizan para la plataforma?',
    answer: 'Nuestra infraestructura se basa en tecnologías de vanguardia: Vue.js 3 para el frontend, Firebase para backend y base de datos, encriptación AES-256, autenticación OAuth 2.0, y servidores distribuidos en múltiples regiones para máxima disponibilidad.',
    category: 'technical',
    icon: 'fas fa-server',
    additionalInfo: 'Mantenemos un uptime del 99.9% y realizamos actualizaciones sin interrupciones.',
    relatedLinks: [
      { title: 'Arquitectura del Sistema', url: '#architecture' },
      { title: 'Estado del Servicio', url: '#status' }
    ]
  },
  {
    id: 'sec-002',
    question: '¿Pueden detectar si uso sus servicios?',
    answer: 'No. Nuestro sistema está diseñado para operar con total discreción. No dejamos rastros digitales detectables, no enviamos emails no solicitados, y todos los archivos entregados son completamente originales sin marcas de agua o metadatos identificables.',
    category: 'security',
    icon: 'fas fa-eye-slash',
    additionalInfo: 'Utilizamos técnicas avanzadas de anonimización y comunicación encriptada.',
    relatedLinks: [
      { title: 'Protocolo de Discreción', url: '#discretion' }
    ]
  },
  {
    id: 'pay-002',
    question: '¿Qué métodos de pago aceptan?',
    answer: 'Aceptamos múltiples métodos: tarjetas de crédito/débito, transferencias bancarias, PayPal, criptomonedas (Bitcoin, Ethereum), y pagos móviles. Todos los pagos son procesados de forma segura con encriptación bancaria.',
    category: 'payments',
    icon: 'fas fa-credit-card',
    additionalInfo: 'Los pagos en criptomonedas ofrecen máxima privacidad y descuentos especiales.',
    relatedLinks: [
      { title: 'Métodos de Pago', url: '#payment-methods' },
      { title: 'Descuentos Crypto', url: '#crypto-discounts' }
    ]
  },
  {
    id: 'qual-002',
    question: '¿Qué garantías ofrecen sobre la calidad?',
    answer: 'Ofrecemos garantía de satisfacción 100%: revisiones ilimitadas hasta tu aprobación, reembolso completo si no cumplimos expectativas, y soporte post-entrega por 30 días. Nuestro índice de satisfacción es del 98.7%.',
    category: 'quality',
    icon: 'fas fa-certificate',
    additionalInfo: 'Cada trabajo pasa por control de calidad interno antes de la entrega.',
    relatedLinks: [
      { title: 'Garantías de Calidad', url: '#quality-guarantee' },
      { title: 'Proceso de Revisión', url: '#review-process' }
    ]
  }
])

const filteredFaqs = computed(() => {
  let filtered = faqs.value

  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(faq => faq.category === selectedCategory.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(faq => 
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query)
    )
  }

  return filtered
})

const displayedFaqs = computed(() => filteredFaqs.value)

const getCategoryName = (categoryId: string) => {
  const category = categories.value.find(cat => cat.id === categoryId)
  return category ? category.name : 'General'
}

const toggleFaq = (id: string) => {
  const index = openFaqs.value.indexOf(id)
  if (index > -1) {
    openFaqs.value.splice(index, 1)
  } else {
    openFaqs.value.push(id)
  }
}

const selectFaq = (id: string) => {
  searchQuery.value = ''
  if (!openFaqs.value.includes(id)) {
    openFaqs.value.push(id)
  }
  // Scroll to FAQ
  setTimeout(() => {
    const element = document.querySelector(`[data-faq-id="${id}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }, 100)
}

onMounted(() => {
  // Add entrance animations
  const items = document.querySelectorAll('.faq-item')
  items.forEach((item, index) => {
    setTimeout(() => {
      item.classList.add('animate-fade-in-up')
    }, index * 100)
  })
})
</script>

<style scoped>
.preguntas-protocolo {
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-primary) 100%);
}

.scan-lines {
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    var(--accent-cyan) 2px,
    var(--accent-cyan) 4px
  );
  background-size: 100% 20px;
  animation: scan-move 3s linear infinite;
}

@keyframes scan-move {
  0% { background-position: 0 0; }
  100% { background-position: 0 20px; }
}

.faq-item {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s ease;
}

.faq-item.animate-fade-in-up {
  opacity: 1;
  transform: translateY(0);
}

@keyframes float-question {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.1;
  }
  25% {
    transform: translateY(-15px) rotate(90deg);
    opacity: 0.2;
  }
  50% {
    transform: translateY(-30px) rotate(180deg);
    opacity: 0.3;
  }
  75% {
    transform: translateY(-15px) rotate(270deg);
    opacity: 0.2;
  }
}

.animate-float-question {
  animation: float-question 6s ease-in-out infinite;
}

@keyframes scan-search {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-scan-search {
  animation: scan-search 2s ease-in-out infinite;
}

.answer-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.5s ease-in-out;
}

.answer-content.animate-expand {
  max-height: 1000px;
}

@keyframes decrypt-text {
  0% {
    filter: blur(2px);
    opacity: 0.5;
  }
  50% {
    filter: blur(1px);
    opacity: 0.7;
    color: var(--accent-cyan);
  }
  100% {
    filter: blur(0);
    opacity: 1;
    color: var(--text-secondary);
  }
}

.animate-decrypt-text {
  animation: decrypt-text 1s ease-in-out;
}
</style>