<template>
  <div class="rating-history">
    <div class="history-header">
      <h3 class="history-title">
        <GlitchText text="Historial de Calificaciones" />
      </h3>
      <div class="rating-summary">
        <div class="average-rating">
          <StarRating
            :model-value="summary.promedioGeneral"
            :readonly="true"
            :animated="false"
            size="small"
          />
          <span class="average-text">
            {{ summary.promedioGeneral.toFixed(1) }} 
            ({{ summary.totalCalificaciones }} calificaciones)
          </span>
        </div>
      </div>
    </div>

    <!-- Rating Distribution -->
    <div class="rating-distribution">
      <h4 class="distribution-title">Distribución de Calificaciones</h4>
      <div class="distribution-bars">
        <div
          v-for="(count, rating) in distributionData"
          :key="rating"
          class="distribution-bar"
        >
          <span class="bar-label">{{ rating }} ⭐</span>
          <div class="bar-container">
            <div
              class="bar-fill"
              :style="{ width: getBarWidth(count) + '%' }"
            ></div>
            <span class="bar-count">{{ count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Comments -->
    <div v-if="summary.comentariosRecientes.length > 0" class="recent-comments">
      <h4 class="comments-title">Comentarios Recientes</h4>
      <div class="comments-list">
        <div
          v-for="(comment, index) in summary.comentariosRecientes"
          :key="index"
          class="comment-item"
        >
          <div class="comment-text">{{ comment }}</div>
        </div>
      </div>
    </div>

    <!-- Detailed Ratings List -->
    <div class="detailed-ratings">
      <h4 class="ratings-title">Todas las Calificaciones</h4>
      
      <div v-if="isLoading" class="loading-container">
        <CyberLoader />
        <span>Cargando calificaciones...</span>
      </div>

      <div v-else-if="ratings.length === 0" class="no-ratings">
        <div class="no-ratings-icon">⭐</div>
        <p>Aún no tienes calificaciones</p>
      </div>

      <div v-else class="ratings-list">
        <HologramCard
          v-for="rating in ratings"
          :key="rating.id"
          class="rating-card"
        >
          <div class="rating-content">
            <div class="rating-header">
              <StarRating
                :model-value="rating.puntuacion"
                :readonly="true"
                :animated="false"
                size="small"
              />
              <span class="rating-date">
                {{ formatDate(rating.fechaCalificacion) }}
              </span>
            </div>
            
            <div v-if="rating.comentario" class="rating-comment">
              {{ rating.comentario }}
            </div>
            
            <div class="rating-meta">
              <span class="contract-info">
                Contrato: {{ getContractTitle(rating.contratoId) }}
              </span>
            </div>
          </div>
        </HologramCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { RatingsService } from '../../services/ratings'
import { ContractsService } from '../../services/contracts'
import type { Calificacion, ResumenCalificaciones } from '../../types'
import StarRating from '../ui/StarRating.vue'
import GlitchText from '../ui/GlitchText.vue'
import HologramCard from '../ui/HologramCard.vue'
import CyberLoader from '../ui/CyberLoader.vue'

interface Props {
  userId: string
}

const props = defineProps<Props>()

const ratings = ref<Calificacion[]>([])
const summary = ref<ResumenCalificaciones>({
  usuarioId: props.userId,
  promedioGeneral: 0,
  totalCalificaciones: 0,
  distribucion: { cinco: 0, cuatro: 0, tres: 0, dos: 0, uno: 0 },
  comentariosRecientes: []
})
const isLoading = ref(true)
const contractTitles = ref<Record<string, string>>({})

const distributionData = computed(() => {
  return {
    '5': summary.value.distribucion.cinco,
    '4': summary.value.distribucion.cuatro,
    '3': summary.value.distribucion.tres,
    '2': summary.value.distribucion.dos,
    '1': summary.value.distribucion.uno
  }
})

const maxCount = computed(() => {
  return Math.max(...Object.values(distributionData.value))
})

const getBarWidth = (count: number): number => {
  if (maxCount.value === 0) return 0
  return (count / maxCount.value) * 100
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

const getContractTitle = (contractId: string): string => {
  return contractTitles.value[contractId] || 'Contrato no encontrado'
}

const loadRatings = async () => {
  if (!props.userId) return
  
  isLoading.value = true
  
  try {
    // Load ratings and summary
    const [ratingsData, summaryData] = await Promise.all([
      RatingsService.getRatingsForUser(props.userId),
      RatingsService.getUserRatingSummary(props.userId)
    ])
    
    ratings.value = ratingsData
    summary.value = summaryData
    
    // Load contract titles for each rating
    const contractIds = [...new Set(ratingsData.map(r => r.contratoId))]
    const contractPromises = contractIds.map(async (contractId) => {
      try {
        const contract = await ContractsService.getContract(contractId)
        if (contract) {
          contractTitles.value[contractId] = contract.titulo
        }
      } catch (error) {
        console.error(`Error loading contract ${contractId}:`, error)
        contractTitles.value[contractId] = 'Contrato eliminado'
      }
    })
    
    await Promise.all(contractPromises)
  } catch (error) {
    console.error('Error loading ratings:', error)
    // Show user-friendly error message
    summary.value = {
      usuarioId: props.userId,
      promedioGeneral: 0,
      totalCalificaciones: 0,
      distribucion: { cinco: 0, cuatro: 0, tres: 0, dos: 0, uno: 0 },
      comentariosRecientes: []
    }
  } finally {
    isLoading.value = false
  }
}

// Watch for userId changes
watch(() => props.userId, loadRatings, { immediate: true })

onMounted(() => {
  loadRatings()
})
</script>

<style scoped>
.rating-history {
  @apply space-y-6;
}

.history-header {
  @apply flex justify-between items-start mb-6;
}

.history-title {
  @apply text-xl font-bold text-cyan-400;
  font-family: 'Orbitron', monospace;
}

.rating-summary {
  @apply text-right;
}

.average-rating {
  @apply flex items-center gap-2;
}

.average-text {
  @apply text-sm text-gray-300;
  font-family: 'Orbitron', monospace;
}

.rating-distribution {
  @apply bg-gray-800/50 rounded-lg p-4 border border-gray-700;
}

.distribution-title {
  @apply text-lg font-semibold text-white mb-4;
  font-family: 'Orbitron', monospace;
}

.distribution-bars {
  @apply space-y-2;
}

.distribution-bar {
  @apply flex items-center gap-3;
}

.bar-label {
  @apply text-sm text-gray-300 w-12 flex-shrink-0;
}

.bar-container {
  @apply flex-1 relative bg-gray-700 rounded-full h-6 flex items-center;
}

.bar-fill {
  @apply h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
}

.bar-count {
  @apply absolute right-2 text-xs text-white font-mono;
}

.recent-comments {
  @apply bg-gray-800/50 rounded-lg p-4 border border-gray-700;
}

.comments-title {
  @apply text-lg font-semibold text-white mb-4;
  font-family: 'Orbitron', monospace;
}

.comments-list {
  @apply space-y-3;
}

.comment-item {
  @apply bg-gray-700/50 rounded-lg p-3 border-l-4 border-cyan-500;
}

.comment-text {
  @apply text-gray-200 text-sm italic;
}

.detailed-ratings {
  @apply space-y-4;
}

.ratings-title {
  @apply text-lg font-semibold text-white;
  font-family: 'Orbitron', monospace;
}

.loading-container {
  @apply flex flex-col items-center gap-3 py-8 text-gray-400;
}

.no-ratings {
  @apply text-center py-8 text-gray-400;
}

.no-ratings-icon {
  @apply text-4xl mb-2;
}

.ratings-list {
  @apply space-y-3;
}

.rating-card {
  @apply p-4;
}

.rating-content {
  @apply space-y-3;
}

.rating-header {
  @apply flex justify-between items-center;
}

.rating-date {
  @apply text-xs text-gray-400;
  font-family: 'Orbitron', monospace;
}

.rating-comment {
  @apply text-gray-200 text-sm italic bg-gray-700/30 rounded p-2;
}

.rating-meta {
  @apply text-xs text-gray-500;
}

.contract-info {
  font-family: 'Orbitron', monospace;
}

/* Animations */
.bar-fill {
  animation: barGrow 1s ease-out;
}

@keyframes barGrow {
  from {
    width: 0%;
  }
}
</style>