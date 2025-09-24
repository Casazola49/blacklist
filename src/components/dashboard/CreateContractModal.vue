<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      @click="$emit('close')"
    ></div>

    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative w-full max-w-2xl">
        <HologramCard variant="primary" :active="true" class="overflow-hidden">
          <div class="p-6">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
              <div>
                <GlitchText 
                  text="NUEVO CONTRATO" 
                  :active="true" 
                  variant="primary" 
                  size="text-xl font-bold"
                />
                <p class="text-text-secondary text-sm mt-1">
                  Crea un nuevo proyecto para especialistas
                </p>
              </div>
              <button
                @click="$emit('close')"
                class="text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="space-y-6">
              <!-- Title -->
              <div>
                <label class="block text-sm font-medium text-text-primary mb-2">
                  Título del Proyecto *
                </label>
                <input
                  v-model="form.titulo"
                  type="text"
                  required
                  class="w-full px-4 py-3 bg-bg-tertiary border border-brand-primary/30 rounded-lg text-text-primary placeholder-text-muted focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-colors"
                  placeholder="Ej: Análisis estadístico para tesis de maestría"
                />
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-text-primary mb-2">
                  Descripción Detallada *
                </label>
                <textarea
                  v-model="form.descripcion"
                  required
                  rows="4"
                  class="w-full px-4 py-3 bg-bg-tertiary border border-brand-primary/30 rounded-lg text-text-primary placeholder-text-muted focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-colors resize-none"
                  placeholder="Describe detalladamente qué necesitas, requisitos específicos, formato de entrega, etc."
                ></textarea>
              </div>

              <!-- Service Type and Budget -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-text-primary mb-2">
                    Tipo de Servicio *
                  </label>
                  <select
                    v-model="form.tipoServicio"
                    required
                    class="w-full px-4 py-3 bg-bg-tertiary border border-brand-primary/30 rounded-lg text-text-primary focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-colors"
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="realizacion">Realización Completa</option>
                    <option value="revision">Revisión y Corrección</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-text-primary mb-2">
                    Presupuesto Sugerido (USD) *
                  </label>
                  <input
                    v-model.number="form.presupuestoSugerido"
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    class="w-full px-4 py-3 bg-bg-tertiary border border-brand-primary/30 rounded-lg text-text-primary placeholder-text-muted focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-colors"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <!-- Deadline -->
              <div>
                <label class="block text-sm font-medium text-text-primary mb-2">
                  Fecha Límite *
                </label>
                <input
                  v-model="form.fechaLimite"
                  type="datetime-local"
                  required
                  :min="minDate"
                  class="w-full px-4 py-3 bg-bg-tertiary border border-brand-primary/30 rounded-lg text-text-primary focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-colors"
                />
              </div>

              <!-- File Upload -->
              <div>
                <label class="block text-sm font-medium text-text-primary mb-2">
                  Archivos Adjuntos
                </label>
                <div class="border-2 border-dashed border-brand-primary/30 rounded-lg p-6 text-center hover:border-accent-cyan/50 transition-colors">
                  <input
                    ref="fileInput"
                    type="file"
                    multiple
                    @change="handleFileUpload"
                    class="hidden"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  />
                  <svg class="w-8 h-8 text-text-muted mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p class="text-text-secondary text-sm mb-2">
                    Arrastra archivos aquí o 
                    <button
                      type="button"
                      @click="() => fileInput?.click()"
                      class="text-accent-cyan hover:text-accent-cyan/80 underline"
                    >
                      selecciona archivos
                    </button>
                  </p>
                  <p class="text-text-muted text-xs">
                    PDF, DOC, DOCX, TXT, JPG, PNG (máx. 10MB cada uno)
                  </p>
                </div>

                <!-- Selected Files -->
                <div v-if="selectedFiles.length > 0" class="mt-3 space-y-2">
                  <div
                    v-for="(file, index) in selectedFiles"
                    :key="index"
                    class="flex items-center justify-between p-2 bg-bg-tertiary rounded-lg"
                  >
                    <div class="flex items-center space-x-2">
                      <svg class="w-4 h-4 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span class="text-text-primary text-sm">{{ file.name }}</span>
                      <span class="text-text-muted text-xs">({{ formatFileSize(file.size) }})</span>
                    </div>
                    <button
                      type="button"
                      @click="removeFile(index)"
                      class="text-text-muted hover:text-red-400 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Error Message -->
              <div v-if="error" class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p class="text-red-400 text-sm">{{ error }}</p>
              </div>

              <!-- Actions -->
              <div class="flex justify-end space-x-4 pt-4 border-t border-brand-primary/20">
                <NeonButton 
                  variant="ghost" 
                  @click="$emit('close')"
                  :disabled="loading"
                >
                  Cancelar
                </NeonButton>
                <NeonButton 
                  variant="primary" 
                  type="submit"
                  :loading="loading"
                  :pulse="true"
                >
                  Crear Contrato
                </NeonButton>
              </div>
            </form>
          </div>
        </HologramCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useContractsStore } from '../../stores/contracts'
import { HologramCard, NeonButton, GlitchText } from '../ui'

const fileInput = ref<HTMLInputElement | null>(null)

const emit = defineEmits<{
  'close': []
  'created': []
}>()

const authStore = useAuthStore()
const contractsStore = useContractsStore()

// Form state
const form = ref({
  titulo: '',
  descripcion: '',
  tipoServicio: '' as 'realizacion' | 'revision' | '',
  presupuestoSugerido: 0,
  fechaLimite: ''
})

const selectedFiles = ref<File[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Computed
const minDate = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().slice(0, 16)
})

// Methods
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    const files = Array.from(target.files)
    
    // Validate file size (10MB max)
    const invalidFiles = files.filter(file => file.size > 10 * 1024 * 1024)
    if (invalidFiles.length > 0) {
      error.value = 'Algunos archivos exceden el límite de 10MB'
      return
    }
    
    selectedFiles.value = [...selectedFiles.value, ...files]
    error.value = null
  }
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleSubmit = async () => {
  if (!authStore.userProfile) {
    error.value = 'Usuario no autenticado'
    return
  }

  try {
    loading.value = true
    error.value = null

    // TODO: Upload files to Firebase Storage and get URLs
    const archivosAdjuntos: string[] = []
    
    // For now, we'll just store file names as placeholders
    // In a real implementation, you would upload to Firebase Storage
    selectedFiles.value.forEach(file => {
      archivosAdjuntos.push(`placeholder_url_${file.name}`)
    })

    const contractData = {
      clienteId: authStore.userProfile.uid,
      titulo: form.value.titulo,
      descripcion: form.value.descripcion,
      archivosAdjuntos,
      fechaLimite: new Date(form.value.fechaLimite),
      tipoServicio: form.value.tipoServicio as 'realizacion' | 'revision',
      presupuestoSugerido: form.value.presupuestoSugerido,
      propuestas: []
    }

    await contractsStore.createContract(contractData)
    emit('created')
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al crear contrato'
  } finally {
    loading.value = false
  }
}

// Initialize form
onMounted(() => {
  // Set default deadline to 1 week from now
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  form.value.fechaLimite = nextWeek.toISOString().slice(0, 16)
})
</script>