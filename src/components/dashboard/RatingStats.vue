<template>
  <HologramCard variant="secondary" class="rating-stats">
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-white">
          <GlitchText text="Estadísticas de Calificación" />
        </h3>
        <div class="flex items-center space-x-2">
          <div class="flex">
            <StarRating
              :model-value="averageRating"
              :readonly="true"
              :animated="false"
              size="small"
            />
          </div>
          <span class="text-sm text-gray-300 font-mono">
            {{ averageRating.toFixed(1) }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Rating Distribution -->
        <div class="space-y-4">
          <h4 class="text-sm font-medium text-gray-300 uppercase tracking-wide">
            Distribución
          </h4>
          <div class="space-y-2">
            <div
              v-for="(count, rating) in distributionData"
              :key="rating"
              class="flex items-center space-x-3"
            >
              <span class="text-xs text-gray-400 w-8">{{ rating }}★</span>
              <div class="flex-1 bg-gray-700 rounded-full h-2 relative overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-1000 ease-out"
                  :style="{ width: getBarWidth(count) + '%' }"
                ></div>
              </div>
              <span class="text-xs text-gray-400 w-6 text-right">{{ count }}</span>
            </div>
          </div>
        </div>

        <!-- Summary Stats -->
        <div class="space-y-4">
          <h4 class="text-sm font-medium text-gray-300 uppercase tracking-wide">
            Resumen
          </h4>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-400">Total de calificaciones:</span>
              <AnimatedCounter 
                :target="totalRatings" 
                class="text-sm font-mono text-cyan-400"
              />
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-400">Promedio general:</span>
              <span class="text-sm font-mono text-cyan-400">
                {{ averageRating.toFixed(2) }}/5.00
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-400">Calificaciones 5★:</span>
              <span class="text-sm font-mono text-green-400">
                {{ getPercentage(distributionData['5']) }}%
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-400">Calificaciones 4★+:</span>
              <span class="text-sm font-mono text-green-400">
                {{ getPercentage(distributionData['5'] + distributionData['4']) }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Comments Preview -->
      <div v-if="recentComments.length > 0" class="mt-6 pt-6 border-t border-gray-700">
        <h4 class="text-sm font-medium text-gray-300 uppercase tracking-wide mb-3">
          Comentarios Recientes
        </h4>
        <div class="space-y-2">
          <div
            v-for="(comment, index) in recentComments.slice(0, 2)"
            :key="index"
            class="text-xs text-gray-400 italic bg-gray-800/50 rounded p-2 border-l-2 border-cyan-500/30"
          >
            "{{ comment }}"
          </div>
        </div>
        <button
          v-if="recentComments.length > 2"
          @click="$emit('view-all-ratings')"
          class="text-xs text-cyan-400 hover:text-cyan-300 mt-2 transition-colors"
        >
          Ver todas las calificaciones →
        </button>
      </div>

      <!-- No Ratings State -->
      <div v-if="totalRatings === 0" class="text-center py-8">
        <div class="text-4xl mb-2">⭐</div>
        <p class="text-gray-400 text-sm">Aún no tienes calificaciones</p>
        <p class="text-gray-500 text-xs mt-1">
          Completa tu primer trabajo para recibir calificaciones
        </p>
      </div>
    </div>
  </HologramCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ResumenCalificaciones } from '../../types'
import StarRating from '../ui/StarRating.vue'
import GlitchText from '../ui/GlitchText.vue'
import HologramCard from '../ui/HologramCard.vue'
import AnimatedCounter from '../ui/AnimatedCounter.vue'

interface Props {
  summary: ResumenCalificaciones
}

const props = defineProps<Props>()

defineEmits<{
  'view-all-ratings': []
}>()

const averageRating = computed(() => props.summary.promedioGeneral || 0)
const totalRatings = computed(() => props.summary.totalCalificaciones || 0)
const recentComments = computed(() => props.summary.comentariosRecientes || [])

const distributionData = computed(() => ({
  '5': props.summary.distribucion.cinco,
  '4': props.summary.distribucion.cuatro,
  '3': props.summary.distribucion.tres,
  '2': props.summary.distribucion.dos,
  '1': props.summary.distribucion.uno
}))

const maxCount = computed(() => {
  return Math.max(...Object.values(distributionData.value))
})

const getBarWidth = (count: number): number => {
  if (maxCount.value === 0) return 0
  return (count / maxCount.value) * 100
}

const getPercentage = (count: number): string => {
  if (totalRatings.value === 0) return '0'
  return ((count / totalRatings.value) * 100).toFixed(0)
}
</script>

<style scoped>
.rating-stats {
  background: linear-gradient(135deg, rgba(10, 10, 10, 0.9) 0%, rgba(26, 26, 26, 0.9) 100%);
  border: 1px solid rgba(0, 255, 255, 0.2);
}

.rating-stats:hover {
  border-color: rgba(0, 255, 255, 0.4);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.1);
}

/* Animation for bars */
.rating-stats .bg-gradient-to-r {
  animation: barGrow 1.5s ease-out;
}

@keyframes barGrow {
  from {
    width: 0%;
  }
}
</style>