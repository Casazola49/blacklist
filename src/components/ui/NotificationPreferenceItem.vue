<template>
  <div
    v-if="shouldShow"
    class="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors"
  >
    <div class="flex items-center space-x-3">
      <!-- Icon -->
      <div 
        class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        :class="iconClass"
      >
        <component :is="iconComponent" class="w-4 h-4" />
      </div>
      
      <!-- Content -->
      <div>
        <label class="text-sm font-medium text-white cursor-pointer">
          {{ title }}
        </label>
        <p class="text-xs text-gray-400 mt-1">
          {{ description }}
        </p>
      </div>
    </div>

    <!-- Toggle -->
    <ToggleSwitch v-model="internalValue" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ToggleSwitch from './ToggleSwitch.vue'

interface Props {
  modelValue: boolean
  title: string
  description: string
  icon: string
  userType: 'cliente' | 'especialista' | 'admin'
  showFor: ('cliente' | 'especialista' | 'admin')[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Computed
const internalValue = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const shouldShow = computed(() => 
  props.showFor.includes(props.userType)
)

const iconComponent = computed(() => {
  // Map icon names to actual icon components
  const iconMap: Record<string, string> = {
    DocumentIcon: 'DocumentIcon',
    ClipboardIcon: 'ClipboardIcon',
    CheckIcon: 'CheckIcon',
    CurrencyDollarIcon: 'CurrencyDollarIcon',
    PaperAirplaneIcon: 'PaperAirplaneIcon',
    StarIcon: 'StarIcon',
    ChatIcon: 'ChatIcon',
    ClockIcon: 'ClockIcon'
  }
  
  return iconMap[props.icon] || 'BellIcon'
})

const iconClass = computed(() => {
  const classMap: Record<string, string> = {
    DocumentIcon: 'bg-blue-500/20 text-blue-400',
    ClipboardIcon: 'bg-green-500/20 text-green-400',
    CheckIcon: 'bg-cyan-500/20 text-cyan-400',
    CurrencyDollarIcon: 'bg-yellow-500/20 text-yellow-400',
    PaperAirplaneIcon: 'bg-purple-500/20 text-purple-400',
    StarIcon: 'bg-orange-500/20 text-orange-400',
    ChatIcon: 'bg-pink-500/20 text-pink-400',
    ClockIcon: 'bg-red-500/20 text-red-400'
  }
  
  return classMap[props.icon] || 'bg-gray-500/20 text-gray-400'
})
</script>