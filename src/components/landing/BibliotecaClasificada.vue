<template>
  <section class="biblioteca-section relative min-h-screen bg-bg-secondary overflow-hidden">
    <!-- Background Matrix Effect -->
    <div class="absolute inset-0">
      <div class="matrix-background">
        <div 
          v-for="i in 50" 
          :key="i" 
          class="matrix-column" 
          :style="{ 
            left: `${i * 2}%`, 
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${8 + Math.random() * 4}s`
          }"
        >
          <span v-for="j in 20" :key="j" class="matrix-char">
            {{ getRandomChar() }}
          </span>
        </div>
      </div>
      <div class="access-grid"></div>
    </div>

    <div class="container relative z-10 py-20">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <GlitchText 
          text="BIBLIOTECA CLASIFICADA" 
          class="text-5xl md:text-7xl font-black mb-6"
          variant="accent"
          :active="true"
          :intense="true"
        />
        <div class="max-w-3xl mx-auto">
          <p class="text-xl text-text-secondary font-mono mb-4">
            [ ARCHIVOS DIGITALES DE ACCESO RESTRINGIDO ]
          </p>
          <p class="text-text-muted leading-relaxed">
            Repositorio de conocimiento clasificado con niveles de seguridad avanzados. 
            Cada documento ha sido verificado y catalogado por nuestro sistema de IA.
          </p>
        </div>
      </div>

      <!-- Search Interface -->
      <div class="search-interface mb-12">
        <HologramCard variant="primary" class="p-8">
          <div class="search-container">
            <div class="search-header mb-6">
              <h3 class="text-2xl font-bold text-accent-cyan mb-2">
                SISTEMA DE BÚSQUEDA AVANZADA
              </h3>
              <p class="text-text-muted font-mono text-sm">
                Utiliza filtros inteligentes para acceder a documentos específicos
              </p>
            </div>

            <!-- Search Bar -->
            <div class="search-bar-container mb-6">
              <div class="search-bar">
                <div class="search-icon">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input 
                  v-model="searchQuery"
                  type="text" 
                  placeholder="Ingresa términos de búsqueda..."
                  class="search-input"
                  @input="performSearch"
                />
                <div class="search-scan-line"></div>
              </div>
            </div>

            <!-- Advanced Filters -->
            <div class="filters-grid grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="filter-group">
                <label class="filter-label">Categoría</label>
                <select v-model="selectedCategory" @change="performSearch" class="filter-select">
                  <option value="">Todas</option>
                  <option value="research">Investigación</option>
                  <option value="academic">Académico</option>
                  <option value="technical">Técnico</option>
                  <option value="classified">Clasificado</option>
                </select>
              </div>
              <div class="filter-group">
                <label class="filter-label">Nivel de Acceso</label>
                <select v-model="selectedAccessLevel" @change="performSearch" class="filter-select">
                  <option value="">Todos</option>
                  <option value="public">Público</option>
                  <option value="restricted">Restringido</option>
                  <option value="classified">Clasificado</option>
                  <option value="top-secret">Ultra Secreto</option>
                </select>
              </div>
              <div class="filter-group">
                <label class="filter-label">Formato</label>
                <select v-model="selectedFormat" @change="performSearch" class="filter-select">
                  <option value="">Todos</option>
                  <option value="pdf">PDF</option>
                  <option value="doc">DOC</option>
                  <option value="data">DATA</option>
                  <option value="encrypted">ENCRIPTADO</option>
                </select>
              </div>
              <div class="filter-group">
                <label class="filter-label">Año</label>
                <select v-model="selectedYear" @change="performSearch" class="filter-select">
                  <option value="">Todos</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="older">Anteriores</option>
                </select>
              </div>
            </div>
          </div>
        </HologramCard>
      </div>

      <!-- Documents Grid -->
      <div class="documents-grid">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="document in filteredDocuments" 
            :key="document.id"
            class="document-card"
            @click="accessDocument(document)"
          >
            <HologramCard 
              :variant="getCardVariant(document.accessLevel)"
              :show-particles="document.accessLevel === 'top-secret'"
              class="h-full cursor-pointer document-hologram"
            >
              <div class="document-content p-6">
                <!-- Document Header -->
                <div class="document-header mb-4">
                  <div class="flex items-start justify-between">
                    <div class="document-icon">
                      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path v-if="document.format === 'pdf'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        <path v-else-if="document.format === 'doc'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        <path v-else-if="document.format === 'data'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        <path v-else-if="document.format === 'encrypted'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div class="access-badge" :class="`access-${document.accessLevel}`">
                      {{ getAccessLabel(document.accessLevel) }}
                    </div>
                  </div>
                </div>

                <!-- Document Info -->
                <div class="document-info mb-4">
                  <h4 class="document-title text-lg font-bold text-primary mb-2">
                    {{ document.title }}
                  </h4>
                  <p class="document-description text-sm text-text-secondary mb-3">
                    {{ document.description }}
                  </p>
                  <div class="document-meta text-xs text-text-muted font-mono">
                    <div class="flex justify-between items-center">
                      <span>{{ document.category.toUpperCase() }}</span>
                      <span>{{ document.year }}</span>
                    </div>
                  </div>
                </div>

                <!-- Document Stats -->
                <div class="document-stats grid grid-cols-3 gap-2 mb-4">
                  <div class="stat-item text-center">
                    <div class="stat-value text-sm font-bold text-accent-cyan">
                      {{ document.pages }}
                    </div>
                    <div class="stat-label text-xs text-text-muted">PÁGINAS</div>
                  </div>
                  <div class="stat-item text-center">
                    <div class="stat-value text-sm font-bold text-accent-magenta">
                      {{ document.downloads }}
                    </div>
                    <div class="stat-label text-xs text-text-muted">DESCARGAS</div>
                  </div>
                  <div class="stat-item text-center">
                    <div class="stat-value text-sm font-bold text-success">
                      {{ document.rating }}
                    </div>
                    <div class="stat-label text-xs text-text-muted">RATING</div>
                  </div>
                </div>

                <!-- Access Requirements -->
                <div class="access-requirements">
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-text-muted">Acceso requerido:</span>
                    <div class="access-indicators flex gap-1">
                      <div 
                        v-for="i in getSecurityLevel(document.accessLevel)" 
                        :key="i"
                        class="security-dot"
                        :class="{ 'security-dot--active': i <= getSecurityLevel(document.accessLevel) }"
                      ></div>
                    </div>
                  </div>
                </div>

                <!-- Materialization Effect -->
                <div class="materialization-overlay" :class="{ 'materializing': document.materializing }">
                  <div class="materialization-progress"></div>
                </div>
              </div>
            </HologramCard>
          </div>
        </div>

        <!-- Load More Button -->
        <div class="text-center mt-12" v-if="hasMoreDocuments">
          <button 
            @click="loadMoreDocuments"
            class="load-more-btn"
            :disabled="isLoading"
          >
            <span v-if="!isLoading">CARGAR MÁS ARCHIVOS</span>
            <span v-else class="flex items-center gap-2">
              <CyberLoader size="small" />
              MATERIALIZANDO...
            </span>
          </button>
        </div>
      </div>

      <!-- Access Modal -->
      <div v-if="selectedDocument" class="access-modal-overlay" @click="closeModal">
        <div class="access-modal" @click.stop>
          <HologramCard variant="primary" class="p-8">
            <div class="modal-content">
              <div class="modal-header mb-6">
                <h3 class="text-2xl font-bold text-accent-cyan mb-2">
                  ACCESO A DOCUMENTO CLASIFICADO
                </h3>
                <p class="text-text-muted font-mono">
                  {{ selectedDocument.title }}
                </p>
              </div>

              <div class="access-process mb-6">
                <div class="process-step" v-for="(step, index) in accessSteps" :key="index">
                  <div class="step-indicator" :class="{ 'step-active': step.active, 'step-complete': step.complete }">
                    <div class="step-number">{{ index + 1 }}</div>
                  </div>
                  <div class="step-content">
                    <div class="step-title">{{ step.title }}</div>
                    <div class="step-description">{{ step.description }}</div>
                  </div>
                </div>
              </div>

              <div class="modal-actions flex gap-4">
                <button @click="initiateAccess" class="access-btn" :disabled="isAccessing">
                  <span v-if="!isAccessing">INICIAR ACCESO</span>
                  <span v-else>VERIFICANDO...</span>
                </button>
                <button @click="closeModal" class="cancel-btn">
                  CANCELAR
                </button>
              </div>
            </div>
          </HologramCard>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import GlitchText from '../ui/GlitchText.vue'
import HologramCard from '../ui/HologramCard.vue'
import CyberLoader from '../ui/CyberLoader.vue'

interface Document {
  id: string
  title: string
  description: string
  category: string
  accessLevel: 'public' | 'restricted' | 'classified' | 'top-secret'
  format: string
  year: number
  pages: number
  downloads: number
  rating: number
  materializing?: boolean
}

interface AccessStep {
  title: string
  description: string
  active: boolean
  complete: boolean
}

const searchQuery = ref('')
const selectedCategory = ref('')
const selectedAccessLevel = ref('')
const selectedFormat = ref('')
const selectedYear = ref('')
const selectedDocument = ref<Document | null>(null)
const isLoading = ref(false)
const isAccessing = ref(false)
const hasMoreDocuments = ref(true)

const documents = ref<Document[]>([
  {
    id: '1',
    title: 'Protocolos de Encriptación Cuántica',
    description: 'Métodos avanzados de seguridad para comunicaciones del futuro',
    category: 'technical',
    accessLevel: 'top-secret',
    format: 'encrypted',
    year: 2024,
    pages: 247,
    downloads: 12,
    rating: 4.9
  },
  {
    id: '2',
    title: 'Análisis de Redes Neuronales Profundas',
    description: 'Investigación sobre arquitecturas de IA de próxima generación',
    category: 'research',
    accessLevel: 'classified',
    format: 'pdf',
    year: 2024,
    pages: 156,
    downloads: 89,
    rating: 4.7
  },
  {
    id: '3',
    title: 'Manual de Operaciones Cibernéticas',
    description: 'Guía completa para operaciones en el ciberespacio',
    category: 'academic',
    accessLevel: 'restricted',
    format: 'doc',
    year: 2023,
    pages: 324,
    downloads: 234,
    rating: 4.8
  },
  {
    id: '4',
    title: 'Fundamentos de Blockchain Avanzado',
    description: 'Tecnologías distribuidas para sistemas descentralizados',
    category: 'technical',
    accessLevel: 'public',
    format: 'pdf',
    year: 2024,
    pages: 198,
    downloads: 567,
    rating: 4.6
  },
  {
    id: '5',
    title: 'Teoría de Sistemas Complejos',
    description: 'Modelado matemático de sistemas emergentes',
    category: 'research',
    accessLevel: 'restricted',
    format: 'data',
    year: 2023,
    pages: 89,
    downloads: 145,
    rating: 4.5
  },
  {
    id: '6',
    title: 'Arquitectura de Realidad Virtual',
    description: 'Diseño de mundos virtuales inmersivos',
    category: 'technical',
    accessLevel: 'classified',
    format: 'pdf',
    year: 2024,
    pages: 278,
    downloads: 67,
    rating: 4.8
  }
])

const accessSteps = ref<AccessStep[]>([
  { title: 'Verificación de Identidad', description: 'Autenticación biométrica', active: false, complete: false },
  { title: 'Análisis de Permisos', description: 'Validación de nivel de acceso', active: false, complete: false },
  { title: 'Desencriptación', description: 'Decodificación de contenido', active: false, complete: false },
  { title: 'Materialización', description: 'Renderizado del documento', active: false, complete: false }
])

const filteredDocuments = computed(() => {
  return documents.value.filter(doc => {
    const matchesSearch = !searchQuery.value || 
      doc.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesCategory = !selectedCategory.value || doc.category === selectedCategory.value
    const matchesAccess = !selectedAccessLevel.value || doc.accessLevel === selectedAccessLevel.value
    const matchesFormat = !selectedFormat.value || doc.format === selectedFormat.value
    const matchesYear = !selectedYear.value || 
      (selectedYear.value === 'older' ? doc.year < 2022 : doc.year.toString() === selectedYear.value)
    
    return matchesSearch && matchesCategory && matchesAccess && matchesFormat && matchesYear
  })
})

const performSearch = () => {
  // Simulate search delay
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
  }, 300)
}

const getRandomChar = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
  return chars[Math.floor(Math.random() * chars.length)]
}

const getCardVariant = (accessLevel: string) => {
  switch (accessLevel) {
    case 'top-secret': return 'accent'
    case 'classified': return 'primary'
    case 'restricted': return 'secondary'
    default: return 'primary'
  }
}

const getAccessLabel = (accessLevel: string) => {
  switch (accessLevel) {
    case 'public': return 'PÚBLICO'
    case 'restricted': return 'RESTRINGIDO'
    case 'classified': return 'CLASIFICADO'
    case 'top-secret': return 'ULTRA SECRETO'
    default: return 'DESCONOCIDO'
  }
}

const getSecurityLevel = (accessLevel: string) => {
  switch (accessLevel) {
    case 'public': return 1
    case 'restricted': return 2
    case 'classified': return 3
    case 'top-secret': return 4
    default: return 1
  }
}

// Removed getDocumentIcon function as we're using inline SVGs

const accessDocument = (document: Document) => {
  selectedDocument.value = document
  resetAccessSteps()
}

const closeModal = () => {
  selectedDocument.value = null
  resetAccessSteps()
}

const resetAccessSteps = () => {
  accessSteps.value.forEach(step => {
    step.active = false
    step.complete = false
  })
}

const initiateAccess = async () => {
  if (!selectedDocument.value) return
  
  isAccessing.value = true
  
  // Simulate access process
  for (let i = 0; i < accessSteps.value.length; i++) {
    accessSteps.value[i].active = true
    await new Promise(resolve => setTimeout(resolve, 1000))
    accessSteps.value[i].complete = true
    accessSteps.value[i].active = false
  }
  
  // Simulate document materialization
  selectedDocument.value.materializing = true
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  isAccessing.value = false
  closeModal()
  
  // Show success message or open document
  alert('Documento materializado exitosamente')
}

const loadMoreDocuments = () => {
  isLoading.value = true
  // Simulate loading more documents
  setTimeout(() => {
    isLoading.value = false
    hasMoreDocuments.value = false
  }, 1500)
}

onMounted(() => {
  // Initialize component
})
</script>

<style scoped>
.biblioteca-section {
  background: linear-gradient(135deg, 
    rgba(26, 26, 26, 1) 0%, 
    rgba(10, 10, 10, 0.9) 50%, 
    rgba(26, 26, 26, 1) 100%
  );
}

.matrix-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  opacity: 0.1;
}

.matrix-column {
  position: absolute;
  top: -100%;
  width: 20px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: theme('colors.accent-cyan');
  animation: matrix-fall linear infinite;
  writing-mode: vertical-rl;
  text-orientation: upright;
}

.matrix-char {
  display: block;
  opacity: 0.7;
  text-shadow: 0 0 5px currentColor;
}

.access-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 0, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 0, 255, 0.02) 1px, transparent 1px);
  background-size: 30px 30px;
  animation: access-pulse 6s ease-in-out infinite;
}

.search-interface {
  max-width: 4xl;
  margin: 0 auto;
}

.search-bar-container {
  position: relative;
}

.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(0, 255, 255, 0.05);
  border: 2px solid rgba(0, 255, 255, 0.2);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.search-bar:focus-within {
  border-color: rgba(0, 255, 255, 0.6);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
}

.search-icon {
  padding: 16px;
  color: theme('colors.accent-cyan');
}

.search-input {
  flex: 1;
  padding: 16px 0;
  background: transparent;
  border: none;
  outline: none;
  color: theme('colors.text-primary');
  font-family: 'JetBrains Mono', monospace;
  font-size: 16px;
}

.search-input::placeholder {
  color: theme('colors.text-muted');
}

.search-scan-line {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 0;
  background: linear-gradient(90deg, 
    transparent 0%, 
    theme('colors.accent-cyan') 50%, 
    transparent 100%
  );
  transition: width 0.3s ease;
}

.search-bar:focus-within .search-scan-line {
  width: 100%;
}

.filters-grid {
  gap: 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-label {
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  color: theme('colors.text-muted');
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.filter-select {
  padding: 12px;
  background: rgba(255, 0, 255, 0.05);
  border: 1px solid rgba(255, 0, 255, 0.2);
  border-radius: 8px;
  color: theme('colors.text-primary');
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  transition: all 0.3s ease;
}

.filter-select:focus {
  border-color: rgba(255, 0, 255, 0.6);
  box-shadow: 0 0 10px rgba(255, 0, 255, 0.2);
  outline: none;
}

.documents-grid {
  max-width: 7xl;
  margin: 0 auto;
}

.document-card {
  transition: transform 0.3s ease;
}

.document-card:hover {
  transform: translateY(-5px);
}

.document-hologram {
  height: 100%;
  min-height: 300px;
}

.document-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.document-icon {
  color: theme('colors.accent-cyan');
}

.access-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.access-public {
  background: rgba(0, 255, 136, 0.2);
  color: theme('colors.success');
  border: 1px solid theme('colors.success');
}

.access-restricted {
  background: rgba(255, 170, 0, 0.2);
  color: theme('colors.warning');
  border: 1px solid theme('colors.warning');
}

.access-classified {
  background: rgba(255, 51, 102, 0.2);
  color: theme('colors.error');
  border: 1px solid theme('colors.error');
}

.access-top-secret {
  background: rgba(255, 0, 255, 0.2);
  color: theme('colors.accent-magenta');
  border: 1px solid theme('colors.accent-magenta');
  animation: top-secret-pulse 2s ease-in-out infinite;
}

.document-title {
  font-family: 'Orbitron', sans-serif;
  line-height: 1.3;
}

.document-description {
  flex: 1;
  line-height: 1.4;
}

.document-stats {
  background: rgba(0, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(0, 255, 255, 0.1);
}

.stat-value {
  font-family: 'JetBrains Mono', monospace;
  text-shadow: 0 0 5px currentColor;
}

.access-requirements {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.access-indicators {
  display: flex;
  gap: 4px;
}

.security-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.security-dot--active {
  background: theme('colors.accent-cyan');
  box-shadow: 0 0 5px theme('colors.accent-cyan');
}

.materialization-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, 
    transparent 0%, 
    rgba(0, 255, 255, 0.1) 50%, 
    transparent 100%
  );
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.materializing {
  opacity: 1;
  animation: materialization 2s ease-in-out;
}

.materialization-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 0;
  background: theme('colors.accent-cyan');
  animation: progress-fill 2s ease-in-out;
}

.load-more-btn {
  padding: 16px 32px;
  background: rgba(128, 0, 32, 0.1);
  border: 2px solid rgba(128, 0, 32, 0.3);
  border-radius: 12px;
  color: theme('colors.brand-primary');
  font-family: 'JetBrains Mono', monospace;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.load-more-btn:hover:not(:disabled) {
  background: rgba(128, 0, 32, 0.2);
  border-color: rgba(128, 0, 32, 0.6);
  box-shadow: 0 0 20px rgba(128, 0, 32, 0.3);
  transform: translateY(-2px);
}

.load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.access-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: modal-fade-in 0.3s ease;
}

.access-modal {
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  animation: modal-slide-in 0.3s ease;
}

.modal-content {
  position: relative;
}

.access-process {
  space-y: 16px;
}

.process-step {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(0, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(0, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.step-indicator {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.step-active {
  background: rgba(0, 255, 255, 0.2);
  border-color: theme('colors.accent-cyan');
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
  animation: step-pulse 1s ease-in-out infinite;
}

.step-complete {
  background: rgba(0, 255, 136, 0.2);
  border-color: theme('colors.success');
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
}

.step-number {
  font-family: 'JetBrains Mono', monospace;
  font-weight: bold;
  color: theme('colors.text-primary');
}

.step-content {
  flex: 1;
}

.step-title {
  font-weight: bold;
  color: theme('colors.text-primary');
  margin-bottom: 4px;
}

.step-description {
  font-size: 14px;
  color: theme('colors.text-muted');
  font-family: 'JetBrains Mono', monospace;
}

.modal-actions {
  justify-content: center;
}

.access-btn {
  padding: 12px 24px;
  background: rgba(0, 255, 255, 0.1);
  border: 2px solid rgba(0, 255, 255, 0.3);
  border-radius: 8px;
  color: theme('colors.accent-cyan');
  font-family: 'JetBrains Mono', monospace;
  font-weight: bold;
  text-transform: uppercase;
  transition: all 0.3s ease;
  cursor: pointer;
}

.access-btn:hover:not(:disabled) {
  background: rgba(0, 255, 255, 0.2);
  border-color: rgba(0, 255, 255, 0.6);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
}

.access-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  padding: 12px 24px;
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: theme('colors.text-muted');
  font-family: 'JetBrains Mono', monospace;
  font-weight: bold;
  text-transform: uppercase;
  transition: all 0.3s ease;
  cursor: pointer;
}

.cancel-btn:hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: theme('colors.text-primary');
}

@keyframes matrix-fall {
  0% { transform: translateY(-100vh); }
  100% { transform: translateY(100vh); }
}

@keyframes access-pulse {
  0%, 100% { opacity: 0.02; }
  50% { opacity: 0.05; }
}

@keyframes top-secret-pulse {
  0%, 100% { 
    box-shadow: 0 0 5px rgba(255, 0, 255, 0.3); 
  }
  50% { 
    box-shadow: 0 0 15px rgba(255, 0, 255, 0.6); 
  }
}

@keyframes materialization {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes progress-fill {
  0% { width: 0; }
  100% { width: 100%; }
}

@keyframes modal-fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes modal-slide-in {
  0% { 
    opacity: 0; 
    transform: translateY(-50px) scale(0.9); 
  }
  100% { 
    opacity: 1; 
    transform: translateY(0) scale(1); 
  }
}

@keyframes step-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  
  .documents-grid .grid {
    grid-template-columns: 1fr;
  }
  
  .document-stats {
    grid-template-columns: 1fr 1fr;
  }
  
  .access-modal {
    width: 95%;
    margin: 20px;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .access-btn,
  .cancel-btn {
    width: 100%;
  }
}
</style>