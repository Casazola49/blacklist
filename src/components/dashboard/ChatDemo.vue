<template>
  <div class="chat-demo">
    <div class="demo-header">
      <h2 class="demo-title">Sistema de Chat Privado</h2>
      <p class="demo-description">
        Comunicación segura y en tiempo real entre clientes y especialistas
      </p>
    </div>

    <div class="demo-content">
      <!-- Chat Features -->
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3>Mensajería en Tiempo Real</h3>
          <p>Comunicación instantánea con actualizaciones en vivo</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </div>
          <h3>Compartir Archivos</h3>
          <p>Envío seguro de documentos y recursos hasta 10MB</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3>Seguridad Total</h3>
          <p>Conversaciones privadas con logging para auditoría</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4.828 4.828A4 4 0 015.5 4H9v1H5.5a3 3 0 00-2.121.879l-.707.707A1 1 0 002 7.414V16.5A1.5 1.5 0 003.5 18H12v1H3.5A2.5 2.5 0 011 16.5V7.414a2 2 0 01.586-1.414l.707-.707z" />
            </svg>
          </div>
          <h3>Indicadores de Estado</h3>
          <p>Mensajes leídos/no leídos y estado de conexión</p>
        </div>
      </div>

      <!-- Demo Actions -->
      <div class="demo-actions">
        <div class="action-section">
          <h3>Probar Funcionalidades</h3>
          <div class="action-buttons">
            <button @click="showChatContainer = !showChatContainer" class="demo-btn primary">
              {{ showChatContainer ? 'Ocultar' : 'Mostrar' }} Chat Container
            </button>
            <button @click="showChatList = !showChatList" class="demo-btn secondary">
              {{ showChatList ? 'Ocultar' : 'Mostrar' }} Lista de Chats
            </button>
          </div>
        </div>

        <div class="stats-section">
          <h3>Estadísticas del Sistema</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">100%</div>
              <div class="stat-label">Tiempo Real</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">10MB</div>
              <div class="stat-label">Máx. Archivo</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">24/7</div>
              <div class="stat-label">Disponibilidad</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">🔒</div>
              <div class="stat-label">Seguro</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Container Demo -->
      <div v-if="showChatContainer" class="demo-section">
        <h3>Chat Container (Responsive)</h3>
        <div class="chat-container-demo">
          <ChatContainer />
        </div>
      </div>

      <!-- Chat List Demo -->
      <div v-if="showChatList" class="demo-section">
        <h3>Lista de Conversaciones</h3>
        <div class="chat-list-demo">
          <ChatList />
        </div>
      </div>
    </div>

    <!-- Implementation Status -->
    <div class="implementation-status">
      <h3>Estado de Implementación</h3>
      <div class="status-grid">
        <div class="status-item completed">
          <svg class="status-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <span>Servicio de Chat (ChatService)</span>
        </div>
        <div class="status-item completed">
          <svg class="status-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <span>Componente ChatPrivado</span>
        </div>
        <div class="status-item completed">
          <svg class="status-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <span>Lista de Conversaciones</span>
        </div>
        <div class="status-item completed">
          <svg class="status-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <span>Compartir Archivos</span>
        </div>
        <div class="status-item completed">
          <svg class="status-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <span>Indicadores Leído/No Leído</span>
        </div>
        <div class="status-item completed">
          <svg class="status-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <span>Logging para Auditoría</span>
        </div>
        <div class="status-item completed">
          <svg class="status-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <span>Reglas de Seguridad Firestore</span>
        </div>
        <div class="status-item completed">
          <svg class="status-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <span>Índices de Base de Datos</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ChatContainer from './ChatContainer.vue'
import ChatList from './ChatList.vue'

// Reactive data
const showChatContainer = ref(false)
const showChatList = ref(false)
</script>

<style scoped>
.chat-demo {
  @apply max-w-6xl mx-auto p-6 space-y-8;
}

.demo-header {
  @apply text-center space-y-4;
}

.demo-title {
  @apply text-3xl font-bold text-white;
  background: linear-gradient(45deg, #00ffff, #ff00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.demo-description {
  @apply text-gray-300 text-lg;
}

.features-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
}

.feature-card {
  @apply bg-gray-800 border border-gray-700 rounded-lg p-6 text-center space-y-4 hover:border-cyan-400 transition-colors;
}

.feature-icon {
  @apply text-cyan-400 mx-auto;
}

.feature-card h3 {
  @apply text-white font-semibold;
}

.feature-card p {
  @apply text-gray-400 text-sm;
}

.demo-actions {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-8;
}

.action-section, .stats-section {
  @apply bg-gray-800 border border-gray-700 rounded-lg p-6;
}

.action-section h3, .stats-section h3 {
  @apply text-white font-semibold mb-4;
}

.action-buttons {
  @apply flex flex-wrap gap-3;
}

.demo-btn {
  @apply px-4 py-2 rounded-lg font-medium transition-all duration-200;
}

.demo-btn.primary {
  @apply bg-cyan-600 hover:bg-cyan-700 text-white;
}

.demo-btn.secondary {
  @apply bg-gray-600 hover:bg-gray-700 text-white;
}

.stats-grid {
  @apply grid grid-cols-2 lg:grid-cols-4 gap-4;
}

.stat-item {
  @apply text-center;
}

.stat-value {
  @apply text-2xl font-bold text-cyan-400;
}

.stat-label {
  @apply text-gray-400 text-sm;
}

.demo-section {
  @apply bg-gray-800 border border-gray-700 rounded-lg p-6;
}

.demo-section h3 {
  @apply text-white font-semibold mb-4;
}

.chat-container-demo {
  @apply h-96 border border-gray-600 rounded-lg overflow-hidden;
}

.chat-list-demo {
  @apply h-64 border border-gray-600 rounded-lg overflow-hidden;
}

.implementation-status {
  @apply bg-gray-800 border border-gray-700 rounded-lg p-6;
}

.implementation-status h3 {
  @apply text-white font-semibold mb-4;
}

.status-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-3;
}

.status-item {
  @apply flex items-center space-x-3 p-3 rounded-lg;
}

.status-item.completed {
  @apply bg-green-900 bg-opacity-30 border border-green-700;
}

.status-icon {
  @apply w-5 h-5 text-green-400;
}

.status-item span {
  @apply text-gray-300;
}
</style>