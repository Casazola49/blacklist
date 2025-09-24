<template>
  <div class="feature-flag-manager p-6 bg-gray-900 text-white rounded-lg">
    <h2 class="text-2xl font-bold mb-6 text-center">
      🚀 Feature Flags Manager v2.0
    </h2>
    
    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-gray-400">Entorno actual:</span>
        <span class="px-2 py-1 bg-blue-600 rounded text-xs font-semibold">
          {{ currentEnvironment }}
        </span>
      </div>
    </div>

    <div class="space-y-4">
      <div 
        v-for="flag in allFlags" 
        :key="flag.key"
        class="flag-item p-4 bg-gray-800 rounded-lg border border-gray-700"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <h3 class="font-semibold text-lg">{{ flag.description }}</h3>
            <p class="text-sm text-gray-400">{{ flag.key }}</p>
            <div class="flex items-center mt-2 space-x-2">
              <span 
                :class="[
                  'px-2 py-1 rounded text-xs font-semibold',
                  flag.environment === 'development' ? 'bg-yellow-600' :
                  flag.environment === 'staging' ? 'bg-orange-600' :
                  flag.environment === 'production' ? 'bg-red-600' :
                  'bg-green-600'
                ]"
              >
                {{ flag.environment || 'all' }}
              </span>
              <span 
                v-if="flag.rolloutPercentage"
                class="px-2 py-1 bg-purple-600 rounded text-xs font-semibold"
              >
                {{ flag.rolloutPercentage }}% rollout
              </span>
            </div>
          </div>
          
          <div class="flex items-center space-x-3">
            <span 
              :class="[
                'px-3 py-1 rounded-full text-xs font-semibold',
                isEnabled(flag.key) ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
              ]"
            >
              {{ isEnabled(flag.key) ? 'Habilitada' : 'Deshabilitada' }}
            </span>
            
            <button
              @click="toggleFlag(flag.key)"
              :class="[
                'px-4 py-2 rounded font-semibold transition-colors',
                isEnabled(flag.key) 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              ]"
            >
              {{ isEnabled(flag.key) ? 'Deshabilitar' : 'Habilitar' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 p-4 bg-blue-900 rounded-lg">
      <h3 class="font-semibold mb-2">📊 Resumen</h3>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-gray-400">Total de flags:</span>
          <span class="ml-2 font-semibold">{{ allFlags.length }}</span>
        </div>
        <div>
          <span class="text-gray-400">Habilitadas:</span>
          <span class="ml-2 font-semibold text-green-400">{{ enabledCount }}</span>
        </div>
      </div>
    </div>

    <div class="mt-4 text-xs text-gray-500 text-center">
      ⚠️ Solo para desarrollo. Los cambios no persisten al recargar la página.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useFeatureFlags } from '../utils/featureFlags';

const { isEnabled, enable, disable, getAllFlags } = useFeatureFlags();

const currentEnvironment = import.meta.env.MODE || 'development';
const allFlags = ref(getAllFlags());

const enabledCount = computed(() => {
  return allFlags.value.filter(flag => isEnabled(flag.key)).length;
});

const toggleFlag = (flagKey: string) => {
  if (isEnabled(flagKey)) {
    disable(flagKey);
  } else {
    enable(flagKey);
  }
  // Actualizar la lista para reflejar los cambios
  allFlags.value = getAllFlags();
};
</script>

<style scoped>
.feature-flag-manager {
  font-family: 'Inter', sans-serif;
}

.flag-item {
  transition: all 0.2s ease;
}

.flag-item:hover {
  border-color: #4F46E5;
  transform: translateY(-1px);
}
</style>