<template>
  <div class="chat-container">
    <div class="chat-layout">
      <!-- Chat List Sidebar -->
      <div class="chat-sidebar" :class="{ 'hidden': selectedChat && isMobile }">
        <ChatList 
          :active-chat-id="selectedChat?.id"
          @chat-selected="handleChatSelected"
        />
      </div>

      <!-- Chat Interface -->
      <div class="chat-main" :class="{ 'hidden': !selectedChat && isMobile }">
        <div v-if="selectedChat" class="chat-content">
          <!-- Mobile Back Button -->
          <div v-if="isMobile" class="mobile-header">
            <button @click="goBackToList" class="back-btn">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Conversaciones</span>
            </button>
          </div>

          <!-- Chat Interface -->
          <ChatPrivado 
            :chat-id="selectedChat.id"
            :contract-id="selectedChat.contratoId"
            class="flex-1"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="empty-chat-state">
          <div class="empty-content">
            <div class="empty-icon">
              <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3>Selecciona una conversación</h3>
            <p>Elige una conversación de la lista para comenzar a chatear de forma segura.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Connection Status Overlay -->
    <div v-if="!isOnline" class="connection-overlay">
      <div class="connection-status">
        <div class="status-content">
          <div class="status-icon">
            <svg class="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div class="status-text">
            <h4>Reconectando...</h4>
            <p>Verificando conexión a internet</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useChatStore } from '../../stores/chat'
import { useAuthStore } from '../../stores/auth'
import type { Chat } from '../../types'
import ChatList from './ChatList.vue'
import ChatPrivado from './ChatPrivado.vue'

interface Props {
  contractId?: string // If provided, will auto-open chat for this contract
}

const props = defineProps<Props>()

// Stores
const chatStore = useChatStore()
const authStore = useAuthStore()

// Reactive data
const selectedChat = ref<Chat | null>(null)
const isMobile = ref(false)
const isOnline = ref(navigator.onLine)

// Computed
const currentUserId = computed(() => authStore.user?.uid || '')

// Methods
const handleChatSelected = (chat: Chat) => {
  selectedChat.value = chat
  chatStore.setActiveChat(chat)
}

const goBackToList = () => {
  selectedChat.value = null
  chatStore.setActiveChat(null)
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

const handleOnlineStatus = () => {
  isOnline.value = navigator.onLine
}

const initializeChat = async () => {
  if (props.contractId && currentUserId.value) {
    try {
      // Try to find existing chat for this contract
      let chat = await chatStore.getChatByContract(props.contractId)
      
      if (chat) {
        selectedChat.value = chat
        chatStore.setActiveChat(chat)
      }
    } catch (error) {
      console.error('Error initializing chat:', error)
    }
  }
}

// Event listeners
const handleResize = () => {
  checkMobile()
}

// Lifecycle
onMounted(() => {
  checkMobile()
  initializeChat()
  
  window.addEventListener('resize', handleResize)
  window.addEventListener('online', handleOnlineStatus)
  window.addEventListener('offline', handleOnlineStatus)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('online', handleOnlineStatus)
  window.removeEventListener('offline', handleOnlineStatus)
})
</script>

<style scoped>
.chat-container {
  @apply relative h-full;
}

.chat-layout {
  @apply flex h-full;
}

.chat-sidebar {
  @apply w-80 flex-shrink-0 border-r border-gray-700;
}

.chat-main {
  @apply flex-1 flex flex-col;
}

.chat-content {
  @apply flex flex-col h-full;
}

.mobile-header {
  @apply p-4 border-b border-gray-700 bg-gray-800 md:hidden;
}

.back-btn {
  @apply flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors;
}

.empty-chat-state {
  @apply flex items-center justify-center h-full bg-gray-900;
}

.empty-content {
  @apply text-center space-y-4 max-w-md mx-auto p-8;
}

.empty-icon {
  @apply text-gray-600 mx-auto;
}

.empty-content h3 {
  @apply text-xl font-semibold text-gray-300;
}

.empty-content p {
  @apply text-gray-400;
}

.connection-overlay {
  @apply absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.connection-status {
  @apply bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-sm mx-4;
}

.status-content {
  @apply flex items-center space-x-4;
}

.status-icon {
  @apply text-cyan-400;
}

.status-text h4 {
  @apply text-white font-semibold;
}

.status-text p {
  @apply text-gray-400 text-sm;
}

/* Mobile Responsive */
@media (max-width: 767px) {
  .chat-sidebar.hidden {
    display: none;
  }
  
  .chat-main.hidden {
    display: none;
  }
  
  .chat-sidebar {
    @apply w-full;
  }
}

/* Desktop */
@media (min-width: 768px) {
  .mobile-header {
    display: none;
  }
}
</style>