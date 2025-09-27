<template>
  <nav class="navigation-bar fixed top-0 left-0 right-0 z-50 bg-bg-primary/90 backdrop-blur-md border-b border-accent-cyan/20">
    <div class="container mx-auto px-6">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <router-link to="/" class="flex items-center space-x-3 group">
            <div class="w-10 h-10 bg-gradient-to-br from-accent-cyan/20 to-brand-primary/20 rounded-lg flex items-center justify-center border border-accent-cyan/30 group-hover:border-accent-cyan/60 transition-all duration-300">
              <i class="fas fa-user-secret text-accent-cyan text-lg"></i>
            </div>
            <span class="text-xl font-orbitron font-bold text-primary group-hover:text-accent-cyan transition-colors duration-300">
              THE BLACKLIST
            </span>
          </router-link>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-8">
          <a 
            href="#protocolo" 
            @click="scrollToSection('protocolo')"
            class="nav-link"
          >
            PROTOCOLO
          </a>
          <a 
            href="#arsenal" 
            @click="scrollToSection('arsenal')"
            class="nav-link"
          >
            ARSENAL
          </a>
          <a 
            href="#operadores" 
            @click="scrollToSection('operadores')"
            class="nav-link"
          >
            OPERADORES
          </a>
          <a 
            href="#estadisticas" 
            @click="scrollToSection('estadisticas')"
            class="nav-link"
          >
            ESTADÍSTICAS
          </a>
          <a 
            href="#testimonios" 
            @click="scrollToSection('testimonios')"
            class="nav-link"
          >
            TESTIMONIOS
          </a>
          <a 
            href="#faq" 
            @click="scrollToSection('faq')"
            class="nav-link"
          >
            FAQ
          </a>
        </div>

        <!-- Access Button -->
        <div class="flex items-center space-x-4">
          <NeonButton 
            variant="primary" 
            class="px-6 py-2"
            @click="$router.push('/auth')"
          >
            ACCESO
          </NeonButton>

          <!-- Mobile Menu Button -->
          <button 
            @click="toggleMobileMenu"
            class="md:hidden w-10 h-10 flex items-center justify-center text-accent-cyan hover:text-accent-magenta transition-colors duration-300"
          >
            <i :class="mobileMenuOpen ? 'fas fa-times' : 'fas fa-bars'" class="text-lg"></i>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation -->
      <div 
        v-if="mobileMenuOpen"
        class="md:hidden border-t border-accent-cyan/20 py-4 animate-fade-in-down"
      >
        <div class="flex flex-col space-y-4">
          <a 
            href="#protocolo" 
            @click="scrollToSection('protocolo'); closeMobileMenu()"
            class="mobile-nav-link"
          >
            <i class="fas fa-cogs mr-3"></i>
            PROTOCOLO
          </a>
          <a 
            href="#arsenal" 
            @click="scrollToSection('arsenal'); closeMobileMenu()"
            class="mobile-nav-link"
          >
            <i class="fas fa-shield-alt mr-3"></i>
            ARSENAL
          </a>
          <a 
            href="#operadores" 
            @click="scrollToSection('operadores'); closeMobileMenu()"
            class="mobile-nav-link"
          >
            <i class="fas fa-users mr-3"></i>
            OPERADORES
          </a>
          <a 
            href="#estadisticas" 
            @click="scrollToSection('estadisticas'); closeMobileMenu()"
            class="mobile-nav-link"
          >
            <i class="fas fa-chart-line mr-3"></i>
            ESTADÍSTICAS
          </a>
          <a 
            href="#testimonios" 
            @click="scrollToSection('testimonios'); closeMobileMenu()"
            class="mobile-nav-link"
          >
            <i class="fas fa-comments mr-3"></i>
            TESTIMONIOS
          </a>
          <a 
            href="#faq" 
            @click="scrollToSection('faq'); closeMobileMenu()"
            class="mobile-nav-link"
          >
            <i class="fas fa-question-circle mr-3"></i>
            FAQ
          </a>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import NeonButton from './NeonButton.vue'

const mobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  if (element) {
    const offset = 80 // Account for fixed navigation height
    const elementPosition = element.offsetTop - offset
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    })
  }
}

// Close mobile menu when clicking outside
const handleClickOutside = (event: Event) => {
  const nav = document.querySelector('.navigation-bar')
  if (nav && !nav.contains(event.target as Node)) {
    closeMobileMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.navigation-bar {
  box-shadow: 0 4px 20px rgba(0, 255, 255, 0.1);
}

.nav-link {
  @apply text-text-secondary font-mono text-sm font-semibold tracking-wider;
  @apply hover:text-accent-cyan transition-all duration-300;
  @apply relative;
  padding: 0.5rem 0;
}

.nav-link::after {
  content: '';
  @apply absolute bottom-0 left-0 w-0 h-0.5 bg-accent-cyan;
  transition: width 0.3s ease;
}

.nav-link:hover::after {
  @apply w-full;
}

.mobile-nav-link {
  @apply flex items-center text-text-secondary font-mono text-sm font-semibold tracking-wider;
  @apply hover:text-accent-cyan hover:bg-accent-cyan/10 transition-all duration-300;
  @apply px-4 py-3 rounded-lg;
}

@keyframes fade-in-down {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-down {
  animation: fade-in-down 0.3s ease-out;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .navigation-bar {
    @apply bg-bg-primary/95;
  }
}
</style>