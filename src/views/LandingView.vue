<template>
  <div class="landing-view">
    <!-- Navigation Bar -->
    <NavigationBar />
    
    <!-- Hero Section -->
    <HeroSection />
    
    <!-- Protocolo de Operación Section -->
    <div id="protocolo">
      <ProtocoloOperacion />
    </div>
    
    <!-- Arsenal Tecnológico Section -->
    <div id="arsenal">
      <ArsenalTecnologico />
    </div>
    
    <!-- Operadores de Élite Section -->
    <div id="operadores">
      <GaleriaElite />
    </div>
    
    <!-- Estadísticas del Sistema Section -->
    <div id="estadisticas">
      <EstadisticasSistema />
    </div>
    
    <!-- Testimonios Encriptados Section -->
    <div id="testimonios">
      <TestimoniosEncriptados />
    </div>
    
    <!-- Preguntas del Protocolo Section -->
    <div id="faq">
      <PreguntasProtocolo />
    </div>
  </div>
</template>

<script setup lang="ts">
import NavigationBar from '../components/ui/NavigationBar.vue'
import HeroSection from '../components/landing/HeroSection.vue'
import ProtocoloOperacion from '../components/landing/ProtocoloOperacion.vue'
import ArsenalTecnologico from '../components/landing/ArsenalTecnologico.vue'
import GaleriaElite from '../components/landing/GaleriaElite.vue'
import EstadisticasSistema from '../components/landing/EstadisticasSistema.vue'
import TestimoniosEncriptados from '../components/landing/TestimoniosEncriptados.vue'
import PreguntasProtocolo from '../components/landing/PreguntasProtocolo.vue'
</script>

<style scoped>
.landing-view {
  /* Account for fixed navigation */
  padding-top: 0;
}

/* Smooth scroll behavior */
html {
  scroll-behavior: smooth;
}
</style>