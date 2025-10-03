<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- Header -->
    <header class="p-6 border-b border-cyan-500/30">
      <div class="max-w-6xl mx-auto flex justify-between items-center">
        <SimpleGlitchTitle />
        <nav class="space-x-4">
          <router-link to="/auth" class="text-cyan-400 hover:text-cyan-300">Acceder</router-link>
          <router-link to="/auth/register/cliente" class="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded">
            Registrarse
          </router-link>
        </nav>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="py-20 px-6">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-5xl font-bold mb-6">
          <span class="text-cyan-400">MARKETPLACE</span>
          <span class="text-white">ACADÉMICO</span>
        </h2>
        <p class="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          El sistema de educación tradicional ha fallado. Somos la alternativa. 
          Una red de auxiliares especialistas que opera en las sombras.
        </p>
        
        <div class="space-x-4">
          <router-link 
            to="/auth" 
            class="inline-block bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            ACCEDER AL PROTOCOLO
          </router-link>
          <button class="inline-block border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 px-8 py-3 rounded-lg font-semibold transition-colors">
            ACCESO LIBRE - AHORA TIEMPO
          </button>
        </div>
      </div>
    </section>

    <!-- Protocolo de Operación -->
    <ProtocoloOperacion />

    <!-- CTA -->
    <section class="py-16 px-6">
      <div class="max-w-4xl mx-auto text-center">
        <h3 class="text-3xl font-bold mb-6 text-cyan-400">¿Listo para Unirte?</h3>
        <p class="text-xl text-gray-300 mb-8">
          Accede al marketplace académico más exclusivo del mundo.
        </p>
        
        <div class="space-x-4">
          <router-link 
            to="/auth/register/cliente" 
            class="inline-block bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Soy Estudiante
          </router-link>
          <router-link 
            to="/auth/register/especialista" 
            class="inline-block border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Soy Especialista
          </router-link>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-8 px-6 border-t border-cyan-500/30">
      <div class="max-w-6xl mx-auto text-center text-gray-400">
        <p>&copy; 2024 The Blacklist. Marketplace Académico de Élite.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import SimpleGlitchTitle from '@/components/ui/SimpleGlitchTitle.vue'
import ProtocoloOperacion from '@/components/landing/ProtocoloOperacion.vue'

// Simple landing page - no complex logic
console.log('Landing page loaded')
</script>