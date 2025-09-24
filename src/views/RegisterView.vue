<template>
  <div class="register-view min-h-screen flex items-center justify-center p-4">
    <HologramCard class="w-full max-w-lg">
      <div class="text-center mb-6">
        <GlitchText 
          :text="type === 'cliente' ? 'REGISTRO DE CLIENTE' : 'POSTULACIÓN DE ESPECIALISTA'" 
          class="text-2xl mb-2" 
        />
        <p class="text-text-secondary text-sm">
          {{ type === 'cliente' ? 'Accede al marketplace exclusivo' : 'Únete a la élite académica' }}
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="authStore.loading" class="text-center py-8">
        <CyberLoader />
        <p class="text-text-secondary mt-4">Procesando registro...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="authStore.error" class="mb-6 p-4 bg-error/20 border border-error/50 rounded">
        <p class="text-error text-sm">{{ authStore.error }}</p>
        <NeonButton 
          variant="ghost" 
          size="sm" 
          class="mt-2" 
          @click="authStore.clearError"
        >
          Reintentar
        </NeonButton>
      </div>

      <!-- Registration Form -->
      <form v-else @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Google Sign In -->
        <div v-if="!authStore.user">
          <NeonButton 
            type="button"
            variant="primary" 
            class="w-full"
            @click="signInWithGoogle"
            :disabled="authStore.loading"
          >
            <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </NeonButton>
        </div>

        <!-- Profile Setup -->
        <div v-else-if="!authStore.userProfile">
          <!-- Alias Field -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-text-primary">
              Alias Único
            </label>
            <input
              v-model="formData.alias"
              type="text"
              required
              class="cyber-input w-full"
              placeholder="Ingresa tu alias"
              :class="{ 'border-error': aliasError }"
            />
            <p v-if="aliasError" class="text-error text-xs">{{ aliasError }}</p>
            <p class="text-text-muted text-xs">
              Este será tu identificador único en la plataforma
            </p>
          </div>

          <!-- Especialista Additional Fields -->
          <div v-if="type === 'especialista'" class="space-y-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-text-primary">
                Nombre Real
              </label>
              <input
                v-model="formData.nombreReal"
                type="text"
                required
                class="cyber-input w-full"
                placeholder="Tu nombre completo"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium text-text-primary">
                CV / Experiencia
              </label>
              <textarea
                v-model="formData.cv"
                required
                rows="4"
                class="cyber-input w-full resize-none"
                placeholder="Describe tu experiencia académica y profesional..."
              ></textarea>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium text-text-primary">
                Habilidades
              </label>
              <input
                v-model="skillInput"
                type="text"
                class="cyber-input w-full"
                placeholder="Presiona Enter para agregar habilidades"
                @keydown.enter.prevent="addSkill"
              />
              <div v-if="formData.habilidades.length > 0" class="flex flex-wrap gap-2 mt-2">
                <span
                  v-for="(skill, index) in formData.habilidades"
                  :key="index"
                  class="inline-flex items-center px-2 py-1 bg-accent-cyan/20 text-accent-cyan text-xs rounded border border-accent-cyan/30"
                >
                  {{ skill }}
                  <button
                    type="button"
                    @click="removeSkill(index)"
                    class="ml-1 text-accent-cyan/70 hover:text-accent-cyan"
                  >
                    ×
                  </button>
                </span>
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium text-text-primary">
                Biografía Personal
              </label>
              <textarea
                v-model="formData.biografia"
                required
                rows="3"
                class="cyber-input w-full resize-none"
                placeholder="Cuéntanos sobre ti y tu enfoque profesional..."
              ></textarea>
            </div>
          </div>

          <!-- Submit Button -->
          <NeonButton 
            type="submit"
            variant="primary" 
            class="w-full"
            :disabled="!isFormValid || authStore.loading"
          >
            {{ type === 'cliente' ? 'Crear Cuenta' : 'Enviar Postulación' }}
          </NeonButton>
        </div>

        <!-- Success State -->
        <div v-else class="text-center py-8">
          <div class="text-success text-4xl mb-4">✓</div>
          <h3 class="text-lg font-semibold text-text-primary mb-2">
            {{ type === 'cliente' ? '¡Cuenta Creada!' : '¡Postulación Enviada!' }}
          </h3>
          <p class="text-text-secondary text-sm mb-6">
            {{ type === 'cliente' 
              ? 'Ya puedes acceder a tu dashboard' 
              : 'Recibirás una notificación tras la revisión del Conserje' 
            }}
          </p>
          <NeonButton 
            variant="primary"
            @click="redirectToDashboard"
          >
            {{ type === 'cliente' ? 'Ir al Dashboard' : 'Entendido' }}
          </NeonButton>
        </div>
      </form>

      <!-- Back to Auth -->
      <div class="mt-6 text-center">
        <button
          type="button"
          @click="$router.push('/auth')"
          class="text-text-muted hover:text-accent-cyan text-sm transition-colors"
        >
          ← Volver a opciones de acceso
        </button>
      </div>
    </HologramCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import GlitchText from '../components/ui/GlitchText.vue'
import NeonButton from '../components/ui/NeonButton.vue'
import HologramCard from '../components/ui/HologramCard.vue'
import CyberLoader from '../components/ui/CyberLoader.vue'

interface Props {
  type: 'cliente' | 'especialista'
}

const props = defineProps<Props>()
const router = useRouter()
const authStore = useAuthStore()

// Form data
const formData = ref({
  alias: '',
  nombreReal: '',
  cv: '',
  habilidades: [] as string[],
  biografia: ''
})

const skillInput = ref('')
const aliasError = ref('')

// Computed
const isFormValid = computed(() => {
  if (!formData.value.alias.trim()) return false
  
  if (props.type === 'especialista') {
    return formData.value.nombreReal.trim() &&
           formData.value.cv.trim() &&
           formData.value.biografia.trim() &&
           formData.value.habilidades.length > 0
  }
  
  return true
})

// Methods
const signInWithGoogle = async () => {
  try {
    await authStore.signInWithGoogle()
  } catch (error) {
    console.error('Error signing in:', error)
  }
}

const addSkill = () => {
  const skill = skillInput.value.trim()
  if (skill && !formData.value.habilidades.includes(skill)) {
    formData.value.habilidades.push(skill)
    skillInput.value = ''
  }
}

const removeSkill = (index: number) => {
  formData.value.habilidades.splice(index, 1)
}

const validateAlias = () => {
  const alias = formData.value.alias.trim()
  if (!alias) {
    aliasError.value = 'El alias es requerido'
    return false
  }
  if (alias.length < 3) {
    aliasError.value = 'El alias debe tener al menos 3 caracteres'
    return false
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
    aliasError.value = 'Solo se permiten letras, números, guiones y guiones bajos'
    return false
  }
  aliasError.value = ''
  return true
}

const handleSubmit = async () => {
  if (!validateAlias()) return
  
  try {
    const additionalData = props.type === 'especialista' ? {
      nombreReal: formData.value.nombreReal,
      cv: formData.value.cv,
      habilidades: formData.value.habilidades,
      biografia: formData.value.biografia
    } : undefined

    await authStore.createProfile(
      formData.value.alias,
      props.type,
      additionalData
    )
  } catch (error) {
    console.error('Error creating profile:', error)
  }
}

const redirectToDashboard = () => {
  if (props.type === 'cliente') {
    router.push('/dashboard/cliente')
  } else {
    router.push('/auth') // Specialists wait for approval
  }
}

// Lifecycle
onMounted(() => {
  // Clear any previous errors
  authStore.clearError()
})
</script>

<style scoped>
.register-view {
  @apply bg-primary;
  background: 
    radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 0, 255, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(128, 0, 32, 0.05) 0%, transparent 50%);
}

.cyber-input {
  @apply bg-bg-secondary border border-accent-cyan/30 text-text-primary px-4 py-3 rounded;
  @apply focus:border-accent-cyan focus:outline-none focus:ring-1 focus:ring-accent-cyan/50;
  @apply transition-all duration-200;
  font-family: 'Orbitron', monospace;
}

.cyber-input:focus {
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
}

.cyber-input::placeholder {
  @apply text-text-muted;
}
</style>