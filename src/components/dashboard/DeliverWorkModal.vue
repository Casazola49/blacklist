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
              <GlitchText text="ENTREGAR TRABAJO" class="text-xl mb-1" />
              <p class="text-text-secondary text-sm">
                Finaliza tu proyecto y entrega el trabajo completado
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
          <div v-if="contract" class="mb-6 p-4 bg-bg-secondary rounded-lg border border-success/20">
            <h3 class="text-lg font-semibold text-text-primary mb-2">
              {{ contract.titulo }}
            </h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-text-secondary">Precio acordado:</span>
                <div class="text-success font-semibold">${{ contract.precioFinal }}</div>
              </div>
              <div>
                <span class="text-text-secondary">Recibirás:</span>
                <div class="text-success font-semibold">${{ ((contract.precioFinal || 0) * 0.85).toFixed(2) }}</div>
              </div>
            </div>
          </div>

          <!-- Warning Notice -->
          <div class="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <div class="flex items-start space-x-3">
              <svg class="w-5 h-5 text-warning mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 class="text-warning font-semibold mb-1">Importante</h4>
                <p class="text-text-secondary text-sm">
                  Una vez que entregues el trabajo, el cliente tendrá la oportunidad de revisarlo y aprobarlo. 
                  Asegúrate de que todo esté completo y cumpla con los requisitos antes de proceder.
                </p>
              </div>
            </div>
          </div>

          <!-- Form -->
          <form @submit.prevent="submitDelivery" class="space-y-6">
            <!-- Delivery Message -->
            <div>
              <label class="block text-sm font-medium text-text-primary mb-2">
                Mensaje de Entrega *
              </label>
              <textarea
                v-model="formData.mensaje"
                required
                rows="6"
                class="cyber-input resize-none"
                placeholder="Describe lo que has completado, incluye instrucciones de uso si es necesario, y cualquier información adicional relevante..."
                :class="{ 'border-error': errors.mensaje }"
              ></textarea>
              <div v-if="errors.mensaje" class="mt-1 text-sm text-error">
                {{ errors.mensaje }}
              </div>
              <div class="mt-1 text-xs text-text-muted">
                {{ formData.mensaje.length }}/2000 caracteres
              </div>
            </div>

            <!-- File Attachments -->
            <div>
              <label class="block text-sm font-medium text-text-primary mb-2">
                Archivos de Entrega
              </label>
              <div class="border-2 border-dashed border-text-muted/30 rounded-lg p-6 text-center hover:border-brand-primary/50 transition-colors">
                <svg class="w-8 h-8 text-text-muted mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p class="text-text-secondary text-sm mb-2">
                  Arrastra archivos aquí o haz clic para seleccionar
                </p>
                <p class="text-text-muted text-xs">
                  Máximo 10MB por archivo. Formatos: PDF, DOC, DOCX, ZIP, RAR, JPG, PNG
                </p>
                <input
                  type="file"
                  multiple
                  class="hidden"
                  accept=".pdf,.doc,.docx,.zip,.rar,.jpg,.jpeg,.png"
                  @change="handleFileUpload"
                />
              </div>
              
              <!-- File List -->
              <div v-if="formData.archivos.length > 0" class="mt-3 space-y-2">
                <div 
                  v-for="(file, index) in formData.archivos" 
                  :key="index"
                  class="flex items-center justify-between p-2 bg-bg-secondary rounded border"
                >
                  <div class="flex items-center space-x-2">
                    <svg class="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span class="text-sm text-text-primary">{{ file.name }}</span>
                    <span class="text-xs text-text-muted">({{ formatFileSize(file.size) }})</span>
                  </div>
                  <button
                    type="button"
                    @click="removeFile(index)"
                    class="text-error hover:text-error/80 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Completion Checklist -->
            <div>
              <label class="block text-sm font-medium text-text-primary mb-3">
                Lista de Verificación
              </label>
              <div class="space-y-3">
                <div class="flex items-start space-x-3">
                  <input
                    v-model="formData.checklist.requirements"
                    type="checkbox"
                    id="check-requirements"
                    class="mt-1 w-4 h-4 text-brand-primary bg-bg-secondary border-text-muted rounded focus:ring-brand-primary focus:ring-2"
                  />
                  <label for="check-requirements" class="text-sm text-text-secondary">
                    He completado todos los requisitos especificados en el contrato
                  </label>
                </div>
                <div class="flex items-start space-x-3">
                  <input
                    v-model="formData.checklist.quality"
                    type="checkbox"
                    id="check-quality"
                    class="mt-1 w-4 h-4 text-brand-primary bg-bg-secondary border-text-muted rounded focus:ring-brand-primary focus:ring-2"
                  />
                  <label for="check-quality" class="text-sm text-text-secondary">
                    He revisado la calidad del trabajo y está listo para entrega
                  </label>
                </div>
                <div class="flex items-start space-x-3">
                  <input
                    v-model="formData.checklist.tested"
                    type="checkbox"
                    id="check-tested"
                    class="mt-1 w-4 h-4 text-brand-primary bg-bg-secondary border-text-muted rounded focus:ring-brand-primary focus:ring-2"
                  />
                  <label for="check-tested" class="text-sm text-text-secondary">
                    He probado/verificado que todo funciona correctamente
                  </label>
                </div>
              </div>
              <div v-if="errors.checklist" class="mt-2 text-sm text-error">
                {{ errors.checklist }}
              </div>
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
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Entregar Trabajo
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
  'submit': [data: { mensaje: string; archivos: File[] }]
}>()

// Form data
const formData = ref({
  mensaje: '',
  archivos: [] as File[],
  checklist: {
    requirements: false,
    quality: false,
    tested: false
  }
})

// Form errors
const errors = ref({
  mensaje: '',
  checklist: ''
})

// Computed
const isFormValid = computed(() => {
  return formData.value.mensaje.trim().length >= 50 &&
         formData.value.mensaje.length <= 2000 &&
         formData.value.checklist.requirements &&
         formData.value.checklist.quality &&
         formData.value.checklist.tested
})

// Methods
const closeModal = () => {
  emit('close')
}

const validateForm = () => {
  errors.value = {
    mensaje: '',
    checklist: ''
  }

  if (formData.value.mensaje.trim().length < 50) {
    errors.value.mensaje = 'El mensaje debe tener al menos 50 caracteres'
  } else if (formData.value.mensaje.length > 2000) {
    errors.value.mensaje = 'El mensaje no puede exceder 2000 caracteres'
  }

  if (!formData.value.checklist.requirements || 
      !formData.value.checklist.quality || 
      !formData.value.checklist.tested) {
    errors.value.checklist = 'Debes completar todos los elementos de la lista de verificación'
  }

  return Object.values(errors.value).every(error => !error)
}

const submitDelivery = () => {
  if (!validateForm()) return

  const deliveryData = {
    mensaje: formData.value.mensaje.trim(),
    archivos: formData.value.archivos
  }

  emit('submit', deliveryData)
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    const newFiles = Array.from(target.files)
    
    // Validate file size (10MB max)
    const validFiles = newFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`El archivo ${file.name} es demasiado grande. Máximo 10MB.`)
        return false
      }
      return true
    })
    
    formData.value.archivos.push(...validFiles)
  }
}

const removeFile = (index: number) => {
  formData.value.archivos.splice(index, 1)
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const resetForm = () => {
  formData.value = {
    mensaje: '',
    archivos: [],
    checklist: {
      requirements: false,
      quality: false,
      tested: false
    }
  }
  errors.value = {
    mensaje: '',
    checklist: ''
  }
}

// Watch for modal open/close
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
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
</style>