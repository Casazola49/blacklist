<template>
  <div class="chat-list">
    <div class="chat-list-header">
      <h3 class="header-title">Conversaciones</h3>
      <div class="header-actions">
        <button @click="refreshChats" :disabled="loading" class="refresh-btn">
          <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

    <div class="chat-list-content">
      <div v-if="loading && chats.length === 0" class="loading-state">
        <CyberLoader />
        <p>Cargando conversaciones...</p>
      </div>

      <div v-else-if="chats.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h4>No hay conversaciones</h4>
        <p>Las conversaciones aparecerán cuando tengas contratos asignados.</p>
      </div>

      <div v-else class="chats-container">
        <div 
          v-for="chat in sortedChats" 
          :key="chat.id"
          class="chat-item"
          :class="{ 
            'active': activeChatId === chat.id,
            'has-unread': chatUnreadCounts[chat.id] > 0
          }"
          @click="selectChat(chat)"
        >
          <div class="chat-avatar">
            <div class="avatar-circle">
              <span>{{ getOtherParticipantInitial(chat) }}</span>
            </div>
            <div 
              v-if="chatUnreadCounts[chat.id] > 0" 
              class="unread-badge"
            >
              {{ chatUnreadCounts[chat.id] > 99 ? '99+' : chatUnreadCounts[chat.id] }}
            </div>
          </div>

          <div class="chat-info">
            <div class="chat-header">
              <h4 class="chat-title">{{ getOtherParticipantAlias(chat) }}</h4>
              <span class="chat-time">{{ formatChatTime(chat.fechaCreacion) }}</span>
            </div>
            <div class="chat-preview">
              <p class="contract-title">{{ getContractTitle(chat) }}</p>
              <p v-if="lastMessages[chat.id]" class="last-message">
                {{ formatLastMessage(lastMessages[chat.id]) }}
              </p>
            </div>
          </div>

          <div class="chat-status">
            <div 
              class="status-dot" 
              :class="getContractStatusClass(chat)"
              :title="getContractStatusText(chat)"
            ></div>
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
import { ChatService } from '../../services/chat'
import { ContractsService } from '../../services/contracts'
import { UsersService } from '../../services/users'
import type { Chat, Mensaje, Contrato, Usuario } from '../../types'
import CyberLoader from '../ui/CyberLoader.vue'

interface Props {
  activeChatId?: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  chatSelected: [chat: Chat]
}>()

// Stores
const chatStore = useChatStore()
const authStore = useAuthStore()

// Reactive data
const loading = ref(false)
const chats = ref<Chat[]>([])
const contracts = ref<Record<string, Contrato>>({})
const participants = ref<Record<string, Usuario>>({})
const lastMessages = ref<Record<string, Mensaje>>({})
const chatUnreadCounts = ref<Record<string, number>>({})

// Computed
const currentUserId = computed(() => authStore.user?.uid || '')
const sortedChats = computed(() => {
  return [...chats.value].sort((a, b) => {
    // Sort by unread first, then by last activity
    const aUnread = chatUnreadCounts.value[a.id] || 0
    const bUnread = chatUnreadCounts.value[b.id] || 0
    
    if (aUnread !== bUnread) {
      return bUnread - aUnread
    }
    
    const aLastMessage = lastMessages.value[a.id]
    const bLastMessage = lastMessages.value[b.id]
    
    if (aLastMessage && bLastMessage) {
      return bLastMessage.fechaEnvio.getTime() - aLastMessage.fechaEnvio.getTime()
    }
    
    return b.fechaCreacion.getTime() - a.fechaCreacion.getTime()
  })
})

// Unsubscribe functions
const unsubscribeFunctions: (() => void)[] = []

// Methods
const loadChats = async () => {
  if (!currentUserId.value) return
  
  try {
    loading.value = true
    chats.value = await ChatService.getUserChats(currentUserId.value)
    
    // Load additional data for each chat
    await Promise.all(chats.value.map(async (chat) => {
      // Load contract
      if (chat.contratoId) {
        try {
          const contract = await ContractsService.getContract(chat.contratoId)
          if (contract) {
            contracts.value[chat.contratoId] = contract
          }
        } catch (error) {
          console.error('Error loading contract:', error)
        }
      }
      
      // Load other participant
      const otherParticipantId = chat.participantes.find(id => id !== currentUserId.value)
      if (otherParticipantId && !participants.value[otherParticipantId]) {
        try {
          const user = await UsersService.getUser(otherParticipantId)
          if (user) {
            participants.value[otherParticipantId] = user
          }
        } catch (error) {
          console.error('Error loading participant:', error)
        }
      }
      
      // Load last message and unread count
      loadChatMetadata(chat.id)
    }))
  } catch (error) {
    console.error('Error loading chats:', error)
  } finally {
    loading.value = false
  }
}

const loadChatMetadata = async (chatId: string) => {
  try {
    // Load last message
    const messages = await ChatService.getMessages(chatId, 1)
    if (messages.length > 0) {
      lastMessages.value[chatId] = messages[messages.length - 1]
    }
    
    // Load unread count
    const unreadCount = await ChatService.getUnreadCount(chatId, currentUserId.value)
    chatUnreadCounts.value[chatId] = unreadCount
    
    // Subscribe to real-time updates for this chat
    const unsubscribe = ChatService.subscribeToMessages(chatId, (messages) => {
      if (messages.length > 0) {
        lastMessages.value[chatId] = messages[messages.length - 1]
      }
      
      // Update unread count
      ChatService.getUnreadCount(chatId, currentUserId.value).then(count => {
        chatUnreadCounts.value[chatId] = count
      })
    })
    
    unsubscribeFunctions.push(unsubscribe)
  } catch (error) {
    console.error('Error loading chat metadata:', error)
  }
}

const refreshChats = () => {
  loadChats()
}

const selectChat = (chat: Chat) => {
  emit('chatSelected', chat)
}

const getOtherParticipantId = (chat: Chat): string => {
  return chat.participantes.find(id => id !== currentUserId.value) || ''
}

const getOtherParticipantAlias = (chat: Chat): string => {
  const otherParticipantId = getOtherParticipantId(chat)
  const participant = participants.value[otherParticipantId]
  return participant?.alias || 'Usuario'
}

const getOtherParticipantInitial = (chat: Chat): string => {
  const alias = getOtherParticipantAlias(chat)
  return alias.charAt(0).toUpperCase()
}

const getContractTitle = (chat: Chat): string => {
  if (!chat.contratoId) return 'Sin contrato'
  const contract = contracts.value[chat.contratoId]
  return contract?.titulo || 'Cargando...'
}

const getContractStatusClass = (chat: Chat): string => {
  if (!chat.contratoId) return 'status-unknown'
  const contract = contracts.value[chat.contratoId]
  if (!contract) return 'status-unknown'
  
  switch (contract.estado) {
    case 'abierto':
      return 'status-open'
    case 'esperando_deposito':
      return 'status-pending'
    case 'fondos_garantia':
      return 'status-active'
    case 'entrega_realizada':
      return 'status-delivered'
    case 'completado':
      return 'status-completed'
    case 'disputado':
      return 'status-disputed'
    case 'cancelado':
      return 'status-cancelled'
    default:
      return 'status-unknown'
  }
}

const getContractStatusText = (chat: Chat): string => {
  if (!chat.contratoId) return 'Sin contrato'
  const contract = contracts.value[chat.contratoId]
  if (!contract) return 'Cargando...'
  
  switch (contract.estado) {
    case 'abierto':
      return 'Abierto'
    case 'esperando_deposito':
      return 'Esperando depósito'
    case 'fondos_garantia':
      return 'En progreso'
    case 'entrega_realizada':
      return 'Entregado'
    case 'completado':
      return 'Completado'
    case 'disputado':
      return 'En disputa'
    case 'cancelado':
      return 'Cancelado'
    default:
      return 'Desconocido'
  }
}

const formatChatTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (hours < 1) return 'Ahora'
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  
  return date.toLocaleDateString()
}

const formatLastMessage = (message: Mensaje): string => {
  if (message.tipo === 'sistema') {
    return message.contenido
  }
  
  if (message.tipo === 'archivo') {
    return '📎 Archivo compartido'
  }
  
  const prefix = message.autorId === currentUserId.value ? 'Tú: ' : ''
  const content = message.contenido.length > 50 
    ? message.contenido.substring(0, 50) + '...' 
    : message.contenido
  
  return prefix + content
}

// Lifecycle
onMounted(() => {
  loadChats()
})

onUnmounted(() => {
  unsubscribeFunctions.forEach(unsubscribe => unsubscribe())
})
</script>

<style scoped>
.chat-list {
  @apply flex flex-col h-full bg-gray-900 border border-gray-700 rounded-lg overflow-hidden;
}

.chat-list-header {
  @apply flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800;
}

.header-title {
  @apply text-lg font-semibold text-white;
}

.refresh-btn {
  @apply p-2 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 rounded-lg transition-colors;
}

.chat-list-content {
  @apply flex-1 overflow-hidden;
}

.loading-state {
  @apply flex flex-col items-center justify-center h-full space-y-4 text-gray-400;
}

.empty-state {
  @apply flex flex-col items-center justify-center h-full space-y-4 text-gray-400 p-8 text-center;
}

.empty-icon {
  @apply text-gray-600;
}

.empty-state h4 {
  @apply text-lg font-semibold text-gray-300;
}

.chats-container {
  @apply overflow-y-auto h-full;
  scrollbar-width: thin;
  scrollbar-color: #800020 #1a1a1a;
}

.chats-container::-webkit-scrollbar {
  width: 6px;
}

.chats-container::-webkit-scrollbar-track {
  background: #1a1a1a;
}

.chats-container::-webkit-scrollbar-thumb {
  background: #800020;
  border-radius: 3px;
}

.chat-item {
  @apply flex items-center p-4 border-b border-gray-700 hover:bg-gray-800 cursor-pointer transition-colors relative;
}

.chat-item.active {
  @apply bg-gray-800 border-l-4 border-l-cyan-400;
}

.chat-item.has-unread {
  @apply bg-gray-850;
}

.chat-item.has-unread::before {
  content: '';
  @apply absolute left-0 top-0 bottom-0 w-1 bg-cyan-400;
}

.chat-avatar {
  @apply relative mr-3;
}

.avatar-circle {
  @apply w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm;
}

.unread-badge {
  @apply absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1;
  font-size: 10px;
}

.chat-info {
  @apply flex-1 min-w-0;
}

.chat-header {
  @apply flex items-center justify-between mb-1;
}

.chat-title {
  @apply font-semibold text-white truncate;
}

.chat-time {
  @apply text-xs text-gray-400 flex-shrink-0 ml-2;
}

.chat-preview {
  @apply space-y-1;
}

.contract-title {
  @apply text-sm text-cyan-400 truncate;
}

.last-message {
  @apply text-sm text-gray-400 truncate;
}

.chat-status {
  @apply ml-2;
}

.status-dot {
  @apply w-3 h-3 rounded-full;
}

.status-open {
  @apply bg-blue-400;
}

.status-pending {
  @apply bg-yellow-400;
}

.status-active {
  @apply bg-green-400;
}

.status-delivered {
  @apply bg-purple-400;
}

.status-completed {
  @apply bg-green-600;
}

.status-disputed {
  @apply bg-red-400;
}

.status-cancelled {
  @apply bg-gray-400;
}

.status-unknown {
  @apply bg-gray-600;
}
</style>