<template>
  <section class="arsenal-section relative py-20 overflow-hidden bg-bg-secondary">
    <div class="container mx-auto px-4 relative z-10">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <GlitchText 
          text="ARSENAL DE IA"
          class="text-4xl md:text-6xl font-orbitron font-black mb-6"
          :active="true"
          variant="accent"
        />
        <p class="text-xl text-accent-cyan font-mono tracking-wider">
          HERRAMIENTAS CLASIFICADAS DE ÉLITE
        </p>
      </div>

      <!-- Filter Controls -->
      <div class="flex flex-wrap justify-center gap-4 mb-12">
        <button
          v-for="category in categories"
          :key="category.id"
          @click="selectedCategory = category.id"
          :class="[
            'px-6 py-3 rounded-lg border-2 transition-all duration-300 font-mono text-sm',
            selectedCategory === category.id
              ? 'border-accent-cyan bg-accent-cyan/20 text-accent-cyan'
              : 'border-gray-600 text-gray-400 hover:border-accent-cyan/50'
          ]"
        >
          {{ category.name }}
          <span class="ml-2 text-xs opacity-60">[{{ getToolsCount(category.id) }}]</span>
        </button>
      </div>

      <!-- Tools Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          v-for="tool in filteredTools"
          :key="tool.id"
          class="tool-card group relative"
          @mouseenter="hoveredTool = tool.id"
          @mouseleave="hoveredTool = null"
        >
          <HologramCard 
            :active="hoveredTool === tool.id"
            variant="primary"
            :show-particles="hoveredTool === tool.id"
            class="h-full"
          >
            <div class="p-6 h-full flex flex-col">
              <div class="flex items-center space-x-3 mb-4">
                <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-magenta p-0.5">
                  <div class="w-full h-full rounded-lg bg-bg-primary flex items-center justify-center">
                    <i :class="tool.icon" class="text-xl text-accent-cyan"></i>
                  </div>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-primary font-orbitron">{{ tool.name }}</h3>
                  <span class="text-xs px-2 py-1 rounded bg-brand-primary/20 text-brand-primary border border-brand-primary/30">
                    {{ getCategoryName(tool.category) }}
                  </span>
                </div>
              </div>

              <div class="flex-1 mb-6">
                <p class="text-sm text-secondary leading-relaxed">
                  <span v-if="hoveredTool === tool.id" class="decrypt-text">
                    {{ tool.description }}
                  </span>
                  <span v-else class="encrypted-text">
                    {{ encryptText(tool.description) }}
                  </span>
                </p>
              </div>

              <button
                @click="accessTool(tool)"
                class="w-full py-3 px-4 rounded-lg border-2 border-accent-cyan text-accent-cyan hover:bg-accent-cyan hover:text-bg-primary font-mono text-sm transition-all duration-300"
              >
                <span class="flex items-center justify-center space-x-2">
                  <i class="fas fa-lock-open"></i>
                  <span>ACCESO AUTORIZADO</span>
                  <i class="fas fa-external-link-alt"></i>
                </span>
              </button>
            </div>
          </HologramCard>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import GlitchText from '@/components/ui/GlitchText.vue'
import HologramCard from '@/components/ui/HologramCard.vue'

interface AITool {
  id: string
  name: string
  description: string
  category: string
  icon: string
  url: string
}

interface Category {
  id: string
  name: string
}

const selectedCategory = ref<string>('all')
const hoveredTool = ref<string | null>(null)

const categories: Category[] = [
  { id: 'all', name: 'TODOS' },
  { id: 'writing', name: 'ESCRITURA' },
  { id: 'research', name: 'INVESTIGACIÓN' },
  { id: 'analysis', name: 'ANÁLISIS' },
  { id: 'coding', name: 'PROGRAMACIÓN' },
  { id: 'design', name: 'DISEÑO' },
  { id: 'productivity', name: 'PRODUCTIVIDAD' }
]

const aiTools = ref<AITool[]>([
  {
    id: 'gpt4',
    name: 'GPT-4 Turbo',
    description: 'Modelo de lenguaje avanzado para generación de texto, análisis y resolución de problemas complejos.',
    category: 'writing',
    icon: 'fas fa-brain',
    url: 'https://openai.com/gpt-4'
  },
  {
    id: 'claude',
    name: 'Claude 3 Opus',
    description: 'IA conversacional con capacidades superiores de razonamiento y análisis.',
    category: 'analysis',
    icon: 'fas fa-robot',
    url: 'https://claude.ai'
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    description: 'Asistente de programación impulsado por IA.',
    category: 'coding',
    icon: 'fab fa-github',
    url: 'https://github.com/features/copilot'
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    description: 'Motor de búsqueda inteligente que combina IA con fuentes en tiempo real.',
    category: 'research',
    icon: 'fas fa-search',
    url: 'https://perplexity.ai'
  },
  {
    id: 'midjourney',
    name: 'Midjourney V6',
    description: 'Generador de imágenes de alta calidad mediante IA.',
    category: 'design',
    icon: 'fas fa-palette',
    url: 'https://midjourney.com'
  },
  {
    id: 'notion-ai',
    name: 'Notion AI',
    description: 'Asistente integrado para productividad y organización.',
    category: 'productivity',
    icon: 'fas fa-tasks',
    url: 'https://notion.so/ai'
  }
])

const filteredTools = computed(() => {
  if (selectedCategory.value === 'all') {
    return aiTools.value
  }
  return aiTools.value.filter(tool => tool.category === selectedCategory.value)
})

const getToolsCount = (categoryId: string): number => {
  if (categoryId === 'all') return aiTools.value.length
  return aiTools.value.filter(tool => tool.category === categoryId).length
}

const getCategoryName = (categoryId: string): string => {
  const category = categories.find(cat => cat.id === categoryId)
  return category ? category.name : categoryId.toUpperCase()
}

const encryptText = (text: string): string => {
  const chars = '█▓▒░▄▀■□▪▫'
  return text.split('').map((char) => {
    if (char === ' ') return ' '
    return chars[Math.floor(Math.random() * chars.length)]
  }).join('')
}

const accessTool = (tool: AITool) => {
  window.open(tool.url, '_blank')
}
</script>

<style scoped>
.arsenal-section {
  font-family: 'Orbitron', monospace;
}

.tool-card {
  transition: all 0.3s ease;
}

.tool-card:hover {
  transform: translateY(-5px);
}

.decrypt-text {
  animation: decrypt 0.8s ease-out forwards;
}

@keyframes decrypt {
  0% {
    opacity: 0;
    filter: blur(2px);
    text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
  }
  100% {
    opacity: 1;
    filter: blur(0);
    text-shadow: none;
  }
}

.encrypted-text {
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 1px;
  opacity: 0.6;
  animation: flicker 2s infinite;
}

@keyframes flicker {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.8; }
}
</style>