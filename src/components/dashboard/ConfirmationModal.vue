<template>
  <div class="fixed inset-0 z-[60] overflow-y-auto">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      @click="$emit('cancel')"
    ></div>

    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative w-full max-w-md">
        <HologramCard variant="accent" :active="true" class="overflow-hidden">
          <div class="p-6">
            <!-- Header -->
            <div class="flex items-center mb-4">
              <div class="w-10 h-10 bg-accent-cyan/20 rounded-full flex items-center justify-center mr-3">
                <svg class="w-5 h-5 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-text-primary">{{ title }}</h3>
            </div>

            <!-- Message -->
            <div class="mb-6">
              <p class="text-text-secondary">{{ message }}</p>
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3">
              <NeonButton 
                variant="ghost" 
                @click="$emit('cancel')"
                :disabled="loading"
              >
                Cancelar
              </NeonButton>
              <NeonButton 
                variant="primary" 
                @click="$emit('confirm')"
                :loading="loading"
              >
                Confirmar
              </NeonButton>
            </div>
          </div>
        </HologramCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { HologramCard, NeonButton } from '../ui'

interface Props {
  title: string
  message: string
  loading?: boolean
}

defineProps<Props>()

defineEmits<{
  'confirm': []
  'cancel': []
}>()
</script>