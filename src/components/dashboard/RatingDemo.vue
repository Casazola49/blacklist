<template>
  <div class="rating-demo space-y-8">
    <div class="text-center">
      <GlitchText text="SISTEMA DE CALIFICACIÓN MUTUA" class="text-2xl mb-4" />
      <p class="text-gray-400 max-w-2xl mx-auto">
        Demostración del sistema de calificación que permite a clientes y especialistas 
        evaluarse mutuamente después de completar un contrato.
      </p>
    </div>

    <!-- Star Rating Component Demo -->
    <HologramCard variant="secondary">
      <div class="p-6">
        <h3 class="text-lg font-semibold text-white mb-4">
          <GlitchText text="Componente de Calificación" />
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <h4 class="text-sm font-medium text-gray-300">Interactivo</h4>
            <StarRating
              v-model="interactiveRating"
              :animated="true"
              :show-label="true"
              :show-numeric="true"
              size="large"
              @change="onRatingChange"
            />
            <p class="text-sm text-gray-400">
              Calificación actual: {{ interactiveRating }}/5
            </p>
          </div>

          <div class="space-y-4">
            <h4 class="text-sm font-medium text-gray-300">Solo lectura</h4>
            <StarRating
              :model-value="4.5"
              :readonly="true"
              :animated="false"
              :show-label="true"
              :show-numeric="true"
              size="large"
            />
            <p class="text-sm text-gray-400">
              Ejemplo de calificación promedio
            </p>
          </div>
        </div>
      </div>
    </HologramCard>

    <!-- Rating Modal Demo -->
    <HologramCard variant="secondary">
      <div class="p-6">
        <h3 class="text-lg font-semibold text-white mb-4">
          <GlitchText text="Modal de Calificación" />
        </h3>
        
        <div class="space-y-4">
          <p class="text-gray-400">
            Modal obligatorio que aparece cuando se completa un contrato.
          </p>
          
          <NeonButton 
            variant="primary"
            @click="showRatingModal = true"
          >
            Abrir Modal de Calificación
          </NeonButton>
        </div>
      </div>
    </HologramCard>

    <!-- Rating History Demo -->
    <HologramCard variant="secondary">
      <div class="p-6">
        <h3 class="text-lg font-semibold text-white mb-4">
          <GlitchText text="Historial de Calificaciones" />
        </h3>
        
        <RatingHistory :user-id="demoUserId" />
      </div>
    </HologramCard>

    <!-- Rating Statistics Demo -->
    <HologramCard variant="secondary">
      <div class="p-6">
        <h3 class="text-lg font-semibold text-white mb-4">
          <GlitchText text="Estadísticas de Calificación" />
        </h3>
        
        <RatingStats 
          :summary="demoSummary"
          @view-all-ratings="viewAllRatings"
        />
      </div>
    </HologramCard>

    <!-- Features List -->
    <HologramCard variant="accent">
      <div class="p-6">
        <h3 class="text-lg font-semibold text-white mb-4">
          <GlitchText text="Características del Sistema" />
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-3">
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span class="text-gray-300">Calificación obligatoria post-completación</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span class="text-gray-300">Visibilidad simultánea de calificaciones</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span class="text-gray-300">Cálculo automático de promedios</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span class="text-gray-300">Historial completo de calificaciones</span>
            </div>
          </div>
          
          <div class="space-y-3">
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-magenta-400 rounded-full"></div>
              <span class="text-gray-300">Estadísticas de reputación</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-magenta-400 rounded-full"></div>
              <span class="text-gray-300">Comentarios y reseñas</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-magenta-400 rounded-full"></div>
              <span class="text-gray-300">Animaciones futuristas</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-magenta-400 rounded-full"></div>
              <span class="text-gray-300">Integración con contratos</span>
            </div>
          </div>
        </div>
      </div>
    </HologramCard>

    <!-- Demo Rating Modal -->
    <RatingModal 
      :is-open="showRatingModal"
      :contract="demoContract"
      @close="showRatingModal = false"
      @rating-submitted="onDemoRatingSubmitted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Contrato, ResumenCalificaciones } from '../../types'
import StarRating from '../ui/StarRating.vue'
import GlitchText from '../ui/GlitchText.vue'
import HologramCard from '../ui/HologramCard.vue'
import NeonButton from '../ui/NeonButton.vue'
import RatingModal from './RatingModal.vue'
import RatingHistory from './RatingHistory.vue'
import RatingStats from './RatingStats.vue'

const interactiveRating = ref(0)
const showRatingModal = ref(false)
const demoUserId = 'demo-user-123'

// Demo data
const demoContract: Contrato = {
  id: 'demo-contract-123',
  clienteId: 'demo-client-123',
  especialistaId: 'demo-specialist-123',
  titulo: 'Desarrollo de Aplicación Web',
  descripcion: 'Crear una aplicación web moderna con Vue.js y Firebase',
  archivosAdjuntos: [],
  fechaLimite: new Date('2024-02-15'),
  tipoServicio: 'realizacion',
  presupuestoSugerido: 1500,
  precioFinal: 1800,
  estado: 'completado',
  fechaCreacion: new Date('2024-01-15'),
  fechaAsignacion: new Date('2024-01-16'),
  fechaCompletado: new Date('2024-02-10'),
  propuestas: [],
  chatId: 'demo-chat-123'
}

const demoSummary: ResumenCalificaciones = {
  usuarioId: demoUserId,
  promedioGeneral: 4.7,
  totalCalificaciones: 15,
  distribucion: {
    cinco: 10,
    cuatro: 3,
    tres: 2,
    dos: 0,
    uno: 0
  },
  comentariosRecientes: [
    'Excelente trabajo, muy profesional y entregó a tiempo.',
    'Gran comunicación y calidad de código excepcional.',
    'Superó mis expectativas, definitivamente lo recomiendo.'
  ]
}

const onRatingChange = (rating: number) => {
  console.log('Rating changed to:', rating)
}

const onDemoRatingSubmitted = () => {
  showRatingModal.value = false
  console.log('Demo rating submitted!')
}

const viewAllRatings = () => {
  console.log('View all ratings clicked')
}
</script>

<style scoped>
.rating-demo {
  max-width: 4xl;
  margin: 0 auto;
}
</style>