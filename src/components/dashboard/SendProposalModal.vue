<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-black/80 backdrop-blur-sm"
      @click="closeModal"
    ></div>
    
    <!-- Modal -->
    <div class="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <HologramCard variant="primary" :active="true" class="p-0">
        <div class="p-6">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <div>
              <GlitchText text="ENVIAR PROPUESTA" class="text-xl mb-1" />
              <p class="text-text-secondary text-sm">
                Presenta tu oferta para este proyecto
              </p>
            </div>
            <NeonButton 
              variant="ghost" 
              size="sm"
              @click="closeModal"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </NeonButton>
          </div>

          <!-- Contract Info -->
          <div v-if="contract" class="mb-6 p-4 bg-bg-secondary rounded-lg border border-brand-primary/20">
            <h3 class="text-lg font-semibold text-text-primary mb-2">
              {{ contract.titulo }}
            </h3>
            <p class="text-text-secondary text-sm mb-3 line-clamp-3">
              {{ contract.descripcion }}
            </p>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-text-secondary">Presupuesto sugerido:</span>
                <div class="text-accent-cyan font-semibold">${{ contract.presupuestoSugerido }}</div>
              </div>
              <div>
                <span class="text-text-secondary">Fecha límite:</span>
                <div class="text-text-primary">{{ formatDate(contract.fechaLimite) }}</div>
              </div>
            </div>
          </div>

          <!-- Form -->
          <form @submit.prevent="submitProposal" class="space-y-6">
            <!-- Price Input -->
            <div>
              <label class="block text-sm font-medium text-text-primary mb-2">
                Tu Precio *
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span class="text-text-secondary">$</span>
                </div>
                <input
                  v-model.number="formData.precio"
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  class="cyber-input pl-8"
                  placeholder="0.00"
                  :class="{ 'border-error': errors.precio }"
                />
              </div>
              <div v-if="errors.precio" class="mt-1 text-sm text-error">
                {{ errors.precio }}
              </div>
              <div v-if="formData.precio" class="mt-2 text-xs text-text-muted">
                Recibirás: ${{ (formData.precio * 0.85).toFixed(2) }} (después de comisión del 15%)
              </div>
            </div>

            <!-- Message Input -->
            <div>
              <label class="block text-sm font-medium text-text-primary mb-2">
                Mensaje Persuasivo *
              </label>
              <textarea
                v-model="formData.mensaje"
                required
                rows="6"
                class="cyber-input resize-none"
                placeholder="Explica por qué eres el especialista ideal para este proyecto..."
                :class="{ 'border-error': errors.mensaje }"
              ></textarea>
              <div v-if="errors.mensaje" class="mt-1 text-sm text-error">
                {{ errors.mensaje }}
              </div>
              <div class="mt-1 text-xs text-text-muted">
                {{ formData.mensaje.length }}/1000 caracteres
              </div>
            </div>

            <!-- Estimated Timeline -->
            <div>
              <label class="block text-sm font-medium text-text-primary mb-2">
                Tiempo Estimado de Entrega
              </label>
              <select
                v-model="formData.tiempoEstimado"
                class="cyber-input"
              >
                <option value="">Seleccionar...</option>
                <option value="1-2 días">1-2 días</option>
                <option value="3-5 días">3-5 días</option>
                <option value="1 semana">1 semana</option>
                <option value="2 semanas">2 semanas</option>
                <option value="1 mes">1 mes</option>
                <option value="Más de 1 mes">Más de 1 mes</option>
              </select>
            </div>

            <!-- Terms Agreement -->
            <div class="flex items-start space-x-3">
              <input
                v-model="formData.acceptTerms"
                type="checkbox"
                id="accept-terms"
                class="mt-1 w-4 h-4 text-brand-primary bg-bg-secondary border-text-muted rounded focus:ring-brand-primary focus:ring-2"
              />
              <label for="accept-terms" class="text-sm text-text-secondary">
                Acepto los términos de servicio y confirmo que puedo completar este trabajo según las especificaciones
              </label>
            </div>
            <div v-if="errors.acceptTerms" class="text-sm text-error">
              {{ errors.acceptTerms }}
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3 pt-4 border-t border-bg-tertiary">
              <NeonButton 
                variant="ghost" 
                type="button"
                @click="closeModal"
                :disabled="loading"
              >
                Cancelar
              </NeonButton>
              <NeonButton 
                variant="primary" 
                type="submit"
                :loading="loading"
                :disabled="!isFormValid"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Enviar Propuesta
              </NeonButton>
            </div>
          </form>
        </div>
      </HologramCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Contrato } from '../../types'
import { GlitchText, HologramCard, NeonButton } from '../ui'

interface Props {
  isOpen: boolean
  contract: Contrato | null
  loading?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': []
  'submit': [data: { precio: number; mensaje: string; tiempoEstimado?: string }]
}>()

// Form data
const formData = ref({
  precio: 0,
  mensaje: '',
  tiempoEstimado: '',
  acceptTerms: false
})

// Form errors
const errors = ref({
  precio: '',
  mensaje: '',
  acceptTerms: ''
})

// Computed
const isFormValid = computed(() => {
  return formData.value.precio > 0 &&
         formData.value.mensaje.trim().length >= 50 &&
         formData.value.mensaje.length <= 1000 &&
         formData.value.acceptTerms
})

// Methods
const closeModal = () => {
  emit('close')
}

const validateForm = () => {
  errors.value = {
    precio: '',
    mensaje: '',
    acceptTerms: ''
  }

  if (!formData.value.precio || formData.value.precio <= 0) {
    errors.value.precio = 'El precio debe ser mayor a 0'
  }

  if (formData.value.mensaje.trim().length < 50) {
    errors.value.mensaje = 'El mensaje debe tener al menos 50 caracteres'
  } else if (formData.value.mensaje.length > 1000) {
    errors.value.mensaje = 'El mensaje no puede exceder 1000 caracteres'
  }

  if (!formData.value.acceptTerms) {
    errors.value.acceptTerms = 'Debes aceptar los términos de servicio'
  }

  return Object.values(errors.value).every(error => !error)
}

const submitProposal = () => {
  if (!validateForm()) return

  const proposalData = {
    precio: formData.value.precio,
    mensaje: formData.value.mensaje.trim(),
    tiempoEstimado: formData.value.tiempoEstimado || undefined
  }

  emit('submit', proposalData)
}

const resetForm = () => {
  formData.value = {
    precio: 0,
    mensaje: '',
    tiempoEstimado: '',
    acceptTerms: false
  }
  errors.value = {
    precio: '',
    mensaje: '',
    acceptTerms: ''
  }
}

// Helper functions
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

// Watch for modal open/close
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    // Pre-fill price with suggested budget
    if (props.contract?.presupuestoSugerido) {
      formData.value.precio = props.contract.presupuestoSugerido
    }
  } else {
    resetForm()
  }
})
</script>

<style scoped>
.cyber-input {
  @apply w-full px-3 py-2 bg-bg-secondary border border-text-muted/30 rounded-md;
  @apply text-text-primary placeholder-text-muted;
  @apply focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary;
  @apply transition-colors duration-200;
}

.cyber-input:focus {
  box-shadow: 0 0 0 2px rgba(128, 0, 32, 0.2);
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>