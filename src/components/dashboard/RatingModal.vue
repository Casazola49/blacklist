<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    @click.self="closeModal"
  >
    <div class="rating-modal">
      <div class="modal-header">
        <div class="header-glow"></div>
        <h2 class="modal-title">
          <GlitchText text="Calificación Obligatoria" />
        </h2>
        <p class="modal-subtitle">
          El contrato ha sido completado. Tu calificación es requerida para finalizar el proceso.
        </p>
      </div>

      <div class="modal-content">
        <!-- Contract Info -->
        <div class="contract-info">
          <HologramCard class="contract-card">
            <div class="contract-details">
              <h3 class="contract-title">{{ contract?.titulo }}</h3>
              <div class="contract-meta">
                <span class="contract-type">{{ getContractTypeText(contract?.tipoServicio) }}</span>
                <span class="contract-price">${{ contract?.precioFinal?.toLocaleString() }}</span>
              </div>
            </div>
          </HologramCard>
        </div>

        <!-- Rating Form -->
        <form @submit.prevent="submitRating" class="rating-form">
          <div class="rating-section">
            <label class="rating-label">
              Califica tu experiencia con {{ otherUserAlias }}
            </label>
            <StarRating
              v-model="rating.puntuacion"
              :animated="true"
              :show-label="true"
              :show-numeric="true"
              size="large"
              @change="onRatingChange"
            />
          </div>

          <div class="comment-section">
            <label for="comment" class="comment-label">
              Comentario (opcional)
            </label>
            <div class="comment-input-container">
              <textarea
                id="comment"
                v-model="rating.comentario"
                class="comment-input"
                placeholder="Comparte tu experiencia con este usuario..."
                rows="4"
                maxlength="500"
              ></textarea>
              <div class="character-count">
                {{ rating.comentario.length }}/500
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              :disabled="!rating.puntuacion || isSubmitting"
              class="submit-button"
            >
              <CyberLoader v-if="isSubmitting" size="small" />
              <span v-else>Enviar Calificación</span>
            </button>
          </div>
        </form>

        <!-- Warning Message -->
        <div class="warning-message">
          <div class="warning-icon">⚠️</div>
          <p>
            Las calificaciones serán públicas una vez que ambas partes hayan calificado.
            Esta acción no se puede deshacer.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { RatingsService } from '../../services/ratings'
import { UsersService } from '../../services/users'
import type { Contrato, Calificacion } from '../../types'
import StarRating from '../ui/StarRating.vue'
import GlitchText from '../ui/GlitchText.vue'
import HologramCard from '../ui/HologramCard.vue'
import CyberLoader from '../ui/CyberLoader.vue'

interface Props {
  isOpen: boolean
  contract: Contrato | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': []
  'rating-submitted': [rating: Calificacion]
}>()

const authStore = useAuthStore()
const isSubmitting = ref(false)
const otherUserAlias = ref('')

const rating = ref({
  puntuacion: 0,
  comentario: ''
})

// Determine who is the other user in the contract
const otherUserId = computed(() => {
  if (!props.contract || !authStore.user) return ''
  
  return authStore.user.uid === props.contract.clienteId 
    ? props.contract.especialistaId 
    : props.contract.clienteId
})

// Load other user's alias when contract changes
watch(() => props.contract, async (newContract) => {
  if (newContract && otherUserId.value) {
    try {
      const user = await UsersService.getUser(otherUserId.value)
      otherUserAlias.value = user?.alias || 'Usuario'
    } catch (error) {
      console.error('Error loading other user:', error)
      otherUserAlias.value = 'Usuario'
    }
  }
}, { immediate: true })

const getContractTypeText = (tipo?: string) => {
  return tipo === 'realizacion' ? 'Realización' : 'Revisión'
}

const onRatingChange = (newRating: number) => {
  // Add some visual feedback when rating changes
  console.log('Rating changed to:', newRating)
}

const submitRating = async () => {
  if (!props.contract || !authStore.user || !otherUserId.value || !rating.value.puntuacion) {
    return
  }

  isSubmitting.value = true

  try {
    const ratingData = {
      contratoId: props.contract.id,
      evaluadorId: authStore.user.uid,
      evaluadoId: otherUserId.value,
      puntuacion: rating.value.puntuacion,
      comentario: rating.value.comentario.trim()
    }

    const ratingId = await RatingsService.createRating(ratingData)
    
    const createdRating: Calificacion = {
      id: ratingId,
      ...ratingData,
      fechaCalificacion: new Date(),
      visible: false
    }

    emit('rating-submitted', createdRating)
    closeModal()
  } catch (error) {
    console.error('Error submitting rating:', error)
    // TODO: Show error notification
  } finally {
    isSubmitting.value = false
  }
}

const closeModal = () => {
  // Reset form
  rating.value = {
    puntuacion: 0,
    comentario: ''
  }
  emit('close')
}
</script>

<style scoped>
.rating-modal {
  @apply relative w-full max-w-2xl mx-4 bg-gray-900 rounded-lg border border-cyan-500/30 overflow-hidden;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  box-shadow: 0 0 50px rgba(0, 255, 255, 0.3);
}

.modal-header {
  @apply relative p-6 border-b border-cyan-500/30;
}

.header-glow {
  @apply absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10;
}

.modal-title {
  @apply relative text-2xl font-bold text-cyan-400 mb-2;
  font-family: 'Orbitron', monospace;
}

.modal-subtitle {
  @apply relative text-gray-300 text-sm;
}

.modal-content {
  @apply p-6 space-y-6;
}

.contract-info {
  @apply mb-6;
}

.contract-card {
  @apply p-4;
}

.contract-details {
  @apply space-y-2;
}

.contract-title {
  @apply text-lg font-semibold text-white;
  font-family: 'Orbitron', monospace;
}

.contract-meta {
  @apply flex justify-between items-center text-sm;
}

.contract-type {
  @apply text-cyan-400 px-2 py-1 rounded bg-cyan-500/20;
}

.contract-price {
  @apply text-green-400 font-mono font-bold;
}

.rating-form {
  @apply space-y-6;
}

.rating-section {
  @apply text-center space-y-4;
}

.rating-label {
  @apply block text-lg font-medium text-gray-200 mb-4;
  font-family: 'Orbitron', monospace;
}

.comment-section {
  @apply space-y-3;
}

.comment-label {
  @apply block text-sm font-medium text-gray-300;
  font-family: 'Orbitron', monospace;
}

.comment-input-container {
  @apply relative;
}

.comment-input {
  @apply w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none;
  @apply focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none;
  @apply transition-all duration-300;
  font-family: 'Inter', sans-serif;
}

.comment-input:focus {
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
}

.character-count {
  @apply absolute bottom-2 right-2 text-xs text-gray-500;
  font-family: 'Orbitron', monospace;
}

.form-actions {
  @apply flex justify-center pt-4;
}

.submit-button {
  @apply px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-lg;
  @apply hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
  @apply transition-all duration-300 flex items-center gap-2;
  font-family: 'Orbitron', monospace;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
}

.submit-button:hover:not(:disabled) {
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
  transform: translateY(-1px);
}

.warning-message {
  @apply flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg;
}

.warning-icon {
  @apply text-yellow-400 text-lg flex-shrink-0;
}

.warning-message p {
  @apply text-sm text-yellow-200;
}

/* Animations */
@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.rating-modal {
  animation: modalSlideIn 0.3s ease-out;
}
</style>