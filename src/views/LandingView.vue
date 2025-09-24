<template>
  <div class="landing-view">
    <!-- Hero Section -->
    <HeroSection />
    
    <!-- Protocolo de Operación Section -->
    <ProtocoloOperacion />
    
    <!-- Arsenal de IA Section -->
    <ArsenalIA />
    
    <!-- Galería de Élite Section -->
    <GaleriaElite />
    
    <!-- Biblioteca Clasificada Section -->
    <BibliotecaClasificada />
    
    <!-- Tienda de Recursos Section -->
    <TiendaRecursos />
    
    <!-- Estadísticas del Sistema Section -->
    <EstadisticasSistema />
    
    <!-- Testimonios Encriptados Section -->
    <TestimoniosEncriptados />
    
    <!-- Preguntas del Protocolo Section -->
    <PreguntasProtocolo />
  </div>
</template>

<script setup lang="ts">
import HeroSection from '../components/landing/HeroSection.vue'
import ProtocoloOperacion from '../components/landing/ProtocoloOperacion.vue'
import ArsenalIA from '../components/landing/ArsenalIA.vue'
import GaleriaElite from '../components/landing/GaleriaElite.vue'
import BibliotecaClasificada from '../components/landing/BibliotecaClasificada.vue'
import TiendaRecursos from '../components/landing/TiendaRecursos.vue'
import EstadisticasSistema from '../components/landing/EstadisticasSistema.vue'
import TestimoniosEncriptados from '../components/landing/TestimoniosEncriptados.vue'
import PreguntasProtocolo from '../components/landing/PreguntasProtocolo.vue'
</script>

<style scoped>
.landing-view {
  /* Styles handled by individual sections */
}
</style>