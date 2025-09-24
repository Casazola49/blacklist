<template>
  <section class="testimonios-encriptados py-20 relative overflow-hidden">
    <!-- Background Effects -->
    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-accent-magenta/5 to-transparent"></div>
    <div class="absolute inset-0 encrypted-pattern opacity-10"></div>
    
    <!-- Floating Code Fragments -->
    <div class="absolute inset-0 overflow-hidden">
      <div 
        v-for="i in 15" 
        :key="i"
        class="absolute text-accent-cyan/20 font-mono text-xs animate-float-code"
        :style="{
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          animationDelay: Math.random() * 10 + 's',
          animationDuration: (8 + Math.random() * 4) + 's'
        }"
      >
        {{ getRandomCode() }}
      </div>
    </div>

    <div class="container mx-auto px-6 relative z-10">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <GlitchText 
          text="TESTIMONIOS ENCRIPTADOS" 
          class="text-4xl md:text-6xl font-bold mb-6"
        />
        <p class="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
          Experiencias verificadas de nuestra red de élite. Identidades protegidas, resultados reales.
        </p>
      </div>

      <!-- Testimonials Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <div 
          v-for="(testimonial, index) in testimonials" 
          :key="testimonial.id"
          class="testimonial-card group"
          :style="{ animationDelay: index * 0.15 + 's' }"
          @mouseenter="startDecryption(testimonial.id)"
          @mouseleave="stopDecryption(testimonial.id)"
        >
          <HologramCard class="h-full">
            <div class="p-6 h-full flex flex-col">
              <!-- Encrypted Avatar -->
              <div class="flex items-center mb-6">
                <div class="relative">
                  <div class="w-16 h-16 bg-gradient-to-br from-accent-cyan/20 to-accent-magenta/20 rounded-full flex items-center justify-center border border-accent-cyan/30 overflow-hidden">
                    <!-- Digital Mask Effect -->
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-accent-cyan/30 to-transparent animate-scan"></div>
                    <i class="fas fa-user-secret text-2xl text-accent-cyan"></i>
                  </div>
                  <!-- Security Badge -->
                  <div class="absolute -top-1 -right-1 w-6 h-6 bg-accent-magenta rounded-full flex items-center justify-center">
                    <i class="fas fa-shield-alt text-xs text-bg-primary"></i>
                  </div>
                </div>
                <div class="ml-4">
                  <h3 class="font-bold text-text-primary">
                    <span 
                      :class="{ 'decrypting': decryptingIds.includes(testimonial.id) }"
                      class="encrypted-text"
                    >
                      {{ decryptingIds.includes(testimonial.id) ? testimonial.author : generateEncryptedName() }}
                    </span>
                  </h3>
                  <p class="text-sm text-text-secondary">{{ testimonial.role }}</p>
                  <div class="flex items-center mt-1">
                    <div class="flex space-x-1">
                      <i 
                        v-for="star in 5" 
                        :key="star"
                        :class="star <= testimonial.rating ? 'text-accent-cyan' : 'text-text-muted'"
                        class="fas fa-star text-xs animate-pulse"
                        :style="{ animationDelay: star * 0.1 + 's' }"
                      ></i>
                    </div>
                    <span class="ml-2 text-xs text-accent-cyan font-mono">{{ testimonial.rating }}.0</span>
                  </div>
                </div>
              </div>

              <!-- Encrypted Content -->
              <div class="flex-grow mb-6">
                <div 
                  :class="{ 'decrypting': decryptingIds.includes(testimonial.id) }"
                  class="encrypted-content"
                >
                  <p class="text-text-secondary leading-relaxed">
                    {{ decryptingIds.includes(testimonial.id) ? testimonial.content : generateEncryptedText(testimonial.content) }}
                  </p>
                </div>
              </div>

              <!-- Project Details -->
              <div class="border-t border-accent-cyan/20 pt-4">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-text-muted">Proyecto:</span>
                  <span 
                    :class="{ 'decrypting': decryptingIds.includes(testimonial.id) }"
                    class="text-accent-cyan font-mono encrypted-text"
                  >
                    {{ decryptingIds.includes(testimonial.id) ? testimonial.project : '████████████' }}
                  </span>
                </div>
                <div class="flex items-center justify-between text-sm mt-2">
                  <span class="text-text-muted">Completado:</span>
                  <span class="text-accent-magenta font-mono">{{ testimonial.completedDate }}</span>
                </div>
                <div class="flex items-center justify-between text-sm mt-2">
                  <span class="text-text-muted">Impacto:</span>
                  <div class="flex items-center space-x-1">
                    <span class="text-green-400 font-bold">+{{ testimonial.impact }}%</span>
                    <i class="fas fa-arrow-up text-green-400 text-xs"></i>
                  </div>
                </div>
              </div>

              <!-- Decryption Status -->
              <div class="mt-4 text-center">
                <div 
                  v-if="decryptingIds.includes(testimonial.id)"
                  class="flex items-center justify-center space-x-2 text-accent-cyan"
                >
                  <div class="w-2 h-2 bg-accent-cyan rounded-full animate-pulse"></div>
                  <span class="text-xs font-mono">DESENCRIPTANDO...</span>
                  <div class="w-2 h-2 bg-accent-cyan rounded-full animate-pulse" style="animation-delay: 0.5s"></div>
                </div>
                <div v-else class="text-xs text-text-muted font-mono">
                  <i class="fas fa-lock mr-1"></i>
                  HOVER PARA DESENCRIPTAR
                </div>
              </div>
            </div>
          </HologramCard>
        </div>
      </div>

      <!-- Verification Section -->
      <div class="bg-gradient-to-r from-bg-secondary/50 to-bg-tertiary/50 rounded-lg p-8 border border-accent-cyan/20">
        <div class="text-center mb-8">
          <h3 class="text-2xl font-bold text-text-primary mb-4">
            <i class="fas fa-certificate text-accent-cyan mr-3"></i>
            VERIFICACIÓN DE AUTENTICIDAD
          </h3>
          <p class="text-text-secondary">
            Todos los testimonios son verificados mediante blockchain y criptografía avanzada
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto bg-gradient-to-br from-accent-cyan/20 to-accent-magenta/20 rounded-full flex items-center justify-center border border-accent-cyan/30 mb-4">
              <i class="fas fa-fingerprint text-2xl text-accent-cyan"></i>
            </div>
            <h4 class="text-lg font-bold text-text-primary mb-2">Identidad Verificada</h4>
            <p class="text-sm text-text-secondary">
              Cada testimonio está vinculado a una identidad real verificada biométricamente
            </p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 mx-auto bg-gradient-to-br from-accent-cyan/20 to-accent-magenta/20 rounded-full flex items-center justify-center border border-accent-cyan/30 mb-4">
              <i class="fas fa-link text-2xl text-accent-magenta"></i>
            </div>
            <h4 class="text-lg font-bold text-text-primary mb-2">Blockchain Inmutable</h4>
            <p class="text-sm text-text-secondary">
              Registros permanentes en blockchain que garantizan la inmutabilidad
            </p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 mx-auto bg-gradient-to-br from-accent-cyan/20 to-accent-magenta/20 rounded-full flex items-center justify-center border border-accent-cyan/30 mb-4">
              <i class="fas fa-shield-alt text-2xl text-accent-cyan"></i>
            </div>
            <h4 class="text-lg font-bold text-text-primary mb-2">Privacidad Absoluta</h4>
            <p class="text-sm text-text-secondary">
              Encriptación de grado militar protege la identidad de nuestros usuarios
            </p>
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

interface Testimonial {
  id: string
  author: string
  role: string
  content: string
  rating: number
  project: string
  completedDate: string
  impact: number
}

const testimonials = ref<Testimonial[]>([
  {
    id: 'test-001',
    author: 'Dr. María González',
    role: 'Estudiante de Doctorado',
    content: 'La calidad del trabajo superó todas mis expectativas. El especialista no solo completó mi análisis estadístico, sino que me proporcionó insights que transformaron completamente mi investigación. El nivel de profesionalismo y expertise es incomparable.',
    rating: 5,
    project: 'Análisis Estadístico Avanzado',
    completedDate: '2024-01-15',
    impact: 95
  },
  {
    id: 'test-002',
    author: 'Carlos Mendoza',
    role: 'Estudiante de Maestría',
    content: 'Increíble experiencia. Mi tesis estaba estancada por meses hasta que encontré a mi especialista. En solo 2 semanas transformó mi trabajo de mediocre a excepcional. La comunicación fue perfecta y el resultado final me ayudó a obtener la máxima calificación.',
    rating: 5,
    project: 'Revisión de Tesis de Maestría',
    completedDate: '2024-01-20',
    impact: 87
  },
  {
    id: 'test-003',
    author: 'Ana Rodríguez',
    role: 'Estudiante de Pregrado',
    content: 'Como estudiante internacional, necesitaba ayuda con el formato y estilo académico local. Mi especialista no solo corrigió mi trabajo, sino que me enseñó técnicas que ahora uso en todos mis proyectos. Valió cada centavo.',
    rating: 5,
    project: 'Corrección de Estilo Académico',
    completedDate: '2024-01-25',
    impact: 78
  },
  {
    id: 'test-004',
    author: 'Roberto Silva',
    role: 'Estudiante de Doctorado',
    content: 'La plataforma es revolucionaria. Encontré exactamente el tipo de especialista que necesitaba para mi investigación en machine learning. El trabajo fue impecable y me ayudó a publicar en una revista de alto impacto.',
    rating: 5,
    project: 'Implementación de Algoritmos ML',
    completedDate: '2024-02-01',
    impact: 92
  },
  {
    id: 'test-005',
    author: 'Laura Jiménez',
    role: 'Estudiante de Maestría',
    content: 'Después de intentar con otras plataformas, The Blacklist es superior en todos los aspectos. Los especialistas son realmente expertos, la comunicación es fluida y los resultados son excepcionales. Recomiendo 100%.',
    rating: 5,
    project: 'Análisis Cualitativo de Datos',
    completedDate: '2024-02-05',
    impact: 89
  },
  {
    id: 'test-006',
    author: 'Diego Morales',
    role: 'Estudiante de Pregrado',
    content: 'Mi proyecto final parecía imposible hasta que encontré ayuda aquí. El especialista no solo completó el trabajo, sino que me explicó cada paso del proceso. Aprendí más en esas semanas que en todo el semestre.',
    rating: 5,
    project: 'Proyecto Final de Ingeniería',
    completedDate: '2024-02-10',
    impact: 83
  }
])

const decryptingIds = ref<string[]>([])

const codeFragments = [
  '0x4A7B', '█▓▒░', 'AES256', '#!/bin', 'SHA-512', 'RSA-4096',
  'HTTPS', 'TLS1.3', 'JWT', 'OAuth2', 'PBKDF2', 'HMAC',
  '256-bit', 'ECDSA', 'P-384', 'X.509', 'PGP', 'GPG'
]

const getRandomCode = () => {
  return codeFragments[Math.floor(Math.random() * codeFragments.length)]
}

const generateEncryptedName = () => {
  const chars = '█▓▒░▄▀■□▪▫'
  return Array.from({ length: 8 + Math.floor(Math.random() * 4) }, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

const generateEncryptedText = (originalText: string) => {
  const encryptedChars = '█▓▒░▄▀■□▪▫'
  return originalText.split('').map((char) => {
    if (char === ' ') return ' '
    if (Math.random() > 0.7) return char // Occasionally show real character
    return encryptedChars[Math.floor(Math.random() * encryptedChars.length)]
  }).join('')
}

const startDecryption = (id: string) => {
  if (!decryptingIds.value.includes(id)) {
    decryptingIds.value.push(id)
  }
}

const stopDecryption = (id: string) => {
  const index = decryptingIds.value.indexOf(id)
  if (index > -1) {
    decryptingIds.value.splice(index, 1)
  }
}

onMounted(() => {
  // Add entrance animations
  const cards = document.querySelectorAll('.testimonial-card')
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('animate-fade-in-up')
    }, index * 150)
  })
})
</script>

<style scoped>
.testimonios-encriptados {
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-primary) 100%);
}

.encrypted-pattern {
  background-image: 
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      var(--accent-cyan) 10px,
      var(--accent-cyan) 11px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 10px,
      var(--accent-magenta) 10px,
      var(--accent-magenta) 11px
    );
  background-size: 20px 20px;
}

.testimonial-card {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s ease;
}

.testimonial-card.animate-fade-in-up {
  opacity: 1;
  transform: translateY(0);
}

.encrypted-text {
  font-family: 'Courier New', monospace;
  transition: all 0.3s ease;
}

.encrypted-text.decrypting {
  animation: decrypt 2s ease-in-out;
}

.encrypted-content {
  transition: all 0.5s ease;
}

.encrypted-content.decrypting {
  animation: contentDecrypt 3s ease-in-out;
}

@keyframes decrypt {
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
    color: var(--text-primary);
  }
}

@keyframes contentDecrypt {
  0% {
    filter: blur(3px);
    opacity: 0.3;
  }
  25% {
    filter: blur(2px);
    opacity: 0.5;
  }
  50% {
    filter: blur(1px);
    opacity: 0.7;
    color: var(--accent-cyan);
  }
  75% {
    filter: blur(0.5px);
    opacity: 0.9;
  }
  100% {
    filter: blur(0);
    opacity: 1;
    color: var(--text-secondary);
  }
}

@keyframes float-code {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.2;
  }
  25% {
    transform: translateY(-10px) rotate(90deg);
    opacity: 0.4;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 0.6;
  }
  75% {
    transform: translateY(-10px) rotate(270deg);
    opacity: 0.4;
  }
}

.animate-float-code {
  animation: float-code 8s ease-in-out infinite;
}

@keyframes scan {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-scan {
  animation: scan 2s ease-in-out infinite;
}
</style>