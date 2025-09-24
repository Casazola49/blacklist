<template>
  <button 
    @click="openChat"
    :disabled="loading || !canChat"
    class="chat-button"
    :class="{ 
      'has-unread': unreadCount > 0,
      'disabled': !canChat 
    }"
  >
    <div class="button-content">
      <svg class="chat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <span class="button-text">
        {{ loading ? 'Cargando...' : 'Chat Privado' }}
      </span>
      <div v-if="unreadCount > 0" class="unread-badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </div>
    </div>
    <CyberLoader v-if="loading" size="sm" class="ml-2" />
  </button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChatService } from '../../services/chat'
import { useAuthStore } from '../../stores/auth'
import type { Contrato } from '../../types'
import CyberLoader from '../ui/CyberLoader.vue'

interface Props {
  contract: Contrato
}

const props = defineProps<Props>()

const emit = defineEmits<{
  chatOpened: [chatId: string]
}>()

// Stores
const authStore = useAuthStore()

// Reactive data
const loading = ref(false)
const unreadCount = ref(0)
const chatId = ref<string | null>(null)

// Computed
const currentUserId = computed(() => authStore.user?.uid || '')
const canChat = computed(() => {
  // Can chat if contract is assigned and user is involved
  return props.contract.especialistaId && 
         (props.contract.clienteId === currentUserId.value || 
          props.contract.especialistaId === currentUserId.value) &&
         ['fondos_garantia', 'entrega_realizada', 'completado'].includes(props.contract.estado)
})

// Unsubscribe function
let unsubscribeUnreadCount: (() => void) | null = null

// Methods
const openChat = async () => {
  if (!canChat.value || loading.value) return
  
  try {
    loading.value = true
    
    // Get or create chat for this contract
    let chat = await ChatService.getChatByContract(props.contract.id)
    
    if (!chat && props.contract.especialistaId) {
      // Create new chat
      const newChatId = await ChatService.createChat(props.contract.id, [
        props.contract.clienteId,
        props.contract.especialistaId
      ])
      chat = await ChatService.getChat(newChatId)
    }
    
    if (chat) {
      chatId.value = chat.id
      emit('chatOpened', chat.id)
    }
  } catch (error) {
    console.error('Error opening chat:', error)
  } finally {
    loading.value = false
  }
}

const loadUnreadCount = async () => {
  if (!chatId.value) return
  
  try {
    unreadCount.value = await ChatService.getUnreadCount(chatId.value, currentUserId.value)
  } catch (error) {
    console.error('Error loading unread count:', error)
  }
}

const subscribeToUnreadCount = () => {
  if (!chatId.value) return
  
  unsubscribeUnreadCount = ChatService.subscribeToMessages(chatId.value, () => {
    loadUnreadCount()
  })
}

const initializeChat = async () => {
  if (!canChat.value) return
  
  try {
    // Check if chat already exists
    const chat = await ChatService.getChatByContract(props.contract.id)
    if (chat) {
      chatId.value = chat.id
      loadUnreadCount()
      subscribeToUnreadCount()
    }
  } catch (error) {
    console.error('Error initializing chat:', error)
  }
}

// Lifecycle
onMounted(() => {
  initializeChat()
})

onUnmounted(() => {
  if (unsubscribeUnreadCount) {
    unsubscribeUnreadCount()
  }
})
</script>

<style scoped>
.chat-button {
  @apply relative px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
}

.chat-button:not(.disabled):hover {
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
  transform: translateY(-1px);
}

.chat-button.has-unread {
  @apply ring-2 ring-cyan-400;
  animation: pulse-glow 2s infinite;
}

.chat-button.disabled {
  @apply bg-gray-600 cursor-not-allowed;
}

@keyframes pulse-glow {
  0%, 100% { 
    box-shadow: 0 0 5px rgba(0, 255, 255, 0.5); 
  }
  50% { 
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.8); 
  }
}

.button-content {
  @apply flex items-center space-x-2;
}

.chat-icon {
  @apply w-5 h-5;
}

.button-text {
  @apply text-sm font-medium;
}

.unread-badge {
  @apply absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1;
  font-size: 10px;
}
</style>