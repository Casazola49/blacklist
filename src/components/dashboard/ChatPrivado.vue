<template>
  <div class="chat-privado">
    <!-- Chat Header -->
    <div class="chat-header">
      <div class="header-info">
        <div class="participant-info">
          <div class="avatar-container">
            <div class="avatar">
              <span>{{ otherParticipantAlias?.charAt(0).toUpperCase() }}</span>
            </div>
            <div class="status-indicator" :class="{ active: isOnline }"></div>
          </div>
          <div class="participant-details">
            <h3 class="participant-name">{{ otherParticipantAlias }}</h3>
            <p class="contract-title">{{ contract?.titulo }}</p>
          </div>
        </div>
        <div class="chat-actions">
          <button 
            @click="toggleFileUpload" 
            class="action-btn"
            :disabled="loading"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <button 
            @click="markAllAsRead" 
            class="action-btn"
            :disabled="loading || unreadCount === 0"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
      <div class="unread-indicator" v-if="unreadCount > 0">
        {{ unreadCount }} mensaje{{ unreadCount > 1 ? 's' : '' }} sin leer
      </div>
    </div>

    <!-- Messages Container -->
    <div class="messages-container" ref="messagesContainer">
      <div class="messages-list">
        <div 
          v-for="message in messages" 
          :key="message.id"
          class="message-wrapper"
          :class="{ 
            'own-message': message.autorId === currentUserId,
            'system-message': message.tipo === 'sistema',
            'unread': !message.leido && message.autorId !== currentUserId
          }"
        >
          <div class="message-bubble">
            <div class="message-header" v-if="message.tipo !== 'sistema'">
              <span class="message-author">
                {{ message.autorId === currentUserId ? 'Tú' : otherParticipantAlias }}
              </span>
              <span class="message-time">{{ formatTime(message.fechaEnvio) }}</span>
            </div>
            
            <div class="message-content">
              <p v-if="message.tipo === 'texto' || message.tipo === 'sistema'">
                {{ message.contenido }}
              </p>
              
              <div v-if="message.tipo === 'archivo'" class="file-message">
                <p class="file-description">{{ message.contenido }}</p>
                <div 
                  v-for="archivo in message.archivos" 
                  :key="archivo.url"
                  class="file-attachment"
                >
                  <div class="file-info">
                    <svg class="file-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div class="file-details">
                      <span class="file-name">{{ archivo.nombre }}</span>
                      <span class="file-size">{{ formatFileSize(archivo.tamaño) }}</span>
                    </div>
                  </div>
                  <a 
                    :href="archivo.url" 
                    target="_blank" 
                    class="download-btn"
                    @click="trackFileDownload(archivo)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            
            <div class="message-status" v-if="message.autorId === currentUserId && message.tipo !== 'sistema'">
              <svg v-if="message.leido" class="read-indicator" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              <svg v-else class="unread-indicator" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- File Upload Area -->
    <div v-if="showFileUpload" class="file-upload-area">
      <div class="upload-zone" @drop="handleFileDrop" @dragover.prevent @dragenter.prevent>
        <input 
          ref="fileInput" 
          type="file" 
          @change="handleFileSelect" 
          class="hidden"
          :accept="allowedFileTypes"
        />
        <div class="upload-content">
          <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p>Arrastra archivos aquí o <button @click="$refs.fileInput.click()" class="upload-link">selecciona archivos</button></p>
          <p class="upload-hint">Máximo 10MB por archivo</p>
        </div>
      </div>
      <div v-if="selectedFile" class="selected-file">
        <div class="file-preview">
          <span class="file-name">{{ selectedFile.name }}</span>
          <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
        </div>
        <div class="file-actions">
          <input 
            v-model="fileMessage" 
            placeholder="Mensaje opcional..." 
            class="file-message-input"
          />
          <button @click="sendFile" :disabled="uploading" class="send-file-btn">
            <CyberLoader v-if="uploading" size="sm" />
            <span v-else>Enviar</span>
          </button>
          <button @click="cancelFileUpload" class="cancel-btn">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Message Input -->
    <div class="message-input-container">
      <div class="input-wrapper">
        <textarea
          v-model="newMessage"
          @keydown.enter.prevent="handleEnterKey"
          placeholder="Escribe tu mensaje..."
          class="message-input"
          rows="1"
          ref="messageInput"
          :disabled="loading"
        ></textarea>
        <button 
          @click="sendMessage" 
          :disabled="!newMessage.trim() || loading"
          class="send-btn"
        >
          <CyberLoader v-if="loading" size="sm" />
          <svg v-else class="send-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Connection Status -->
    <div v-if="!isConnected" class="connection-status">
      <div class="status-indicator offline"></div>
      <span>Reconectando...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ChatService } from '../../services/chat'
import { ContractsService } from '../../services/contracts'
import { UsersService } from '../../services/users'
import { useAuthStore } from '../../stores/auth'
import type { Chat, Mensaje, Contrato, Usuario, ArchivoAdjunto } from '../../types'
import CyberLoader from '../ui/CyberLoader.vue'

interface Props {
  chatId?: string
  contractId?: string
}

const props = defineProps<Props>()

// Stores
const authStore = useAuthStore()

// Reactive data
const chat = ref<Chat | null>(null)
const contract = ref<Contrato | null>(null)
const messages = ref<Mensaje[]>([])
const newMessage = ref('')
const loading = ref(false)
const uploading = ref(false)
const isConnected = ref(true)
const isOnline = ref(false)
const unreadCount = ref(0)

// File upload
const showFileUpload = ref(false)
const selectedFile = ref<File | null>(null)
const fileMessage = ref('')
const allowedFileTypes = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar'

// Refs
const messagesContainer = ref<HTMLElement>()
const messageInput = ref<HTMLTextAreaElement>()
const fileInput = ref<HTMLInputElement>()

// Computed
const currentUserId = computed(() => authStore.user?.uid || '')
const otherParticipantId = computed(() => {
  if (!chat.value) return ''
  return chat.value.participantes.find(id => id !== currentUserId.value) || ''
})
const otherParticipantAlias = ref<string>('')

// Unsubscribe functions
let unsubscribeMessages: (() => void) | null = null
let unsubscribeChat: (() => void) | null = null

// Methods
const initializeChat = async () => {
  try {
    loading.value = true
    
    let chatToLoad: Chat | null = null
    
    if (props.chatId) {
      chatToLoad = await ChatService.getChat(props.chatId)
    } else if (props.contractId) {
      chatToLoad = await ChatService.getChatByContract(props.contractId)
      
      // If no chat exists for this contract, create one
      if (!chatToLoad) {
        const contractData = await ContractsService.getContract(props.contractId)
        if (contractData && contractData.especialistaId) {
          const chatId = await ChatService.createChat(props.contractId, [
            contractData.clienteId,
            contractData.especialistaId
          ])
          chatToLoad = await ChatService.getChat(chatId)
        }
      }
    }
    
    if (chatToLoad) {
      chat.value = chatToLoad
      
      // Load contract details
      if (chatToLoad.contratoId) {
        contract.value = await ContractsService.getContract(chatToLoad.contratoId)
      }
      
      // Load other participant info
      if (otherParticipantId.value) {
        const otherUser = await UsersService.getUser(otherParticipantId.value)
        if (otherUser) {
          otherParticipantAlias.value = otherUser.alias
        }
      }
      
      // Subscribe to real-time updates
      subscribeToUpdates()
      
      // Load initial unread count
      updateUnreadCount()
    }
  } catch (error) {
    console.error('Error initializing chat:', error)
  } finally {
    loading.value = false
  }
}

const subscribeToUpdates = () => {
  if (!chat.value) return
  
  // Subscribe to messages
  unsubscribeMessages = ChatService.subscribeToMessages(chat.value.id, (newMessages) => {
    messages.value = newMessages
    updateUnreadCount()
    nextTick(() => scrollToBottom())
  })
  
  // Subscribe to chat updates
  unsubscribeChat = ChatService.subscribeToChat(chat.value.id, (updatedChat) => {
    if (updatedChat) {
      chat.value = updatedChat
    }
  })
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || !chat.value || loading.value) return
  
  try {
    loading.value = true
    await ChatService.sendMessage(chat.value.id, currentUserId.value, newMessage.value.trim())
    newMessage.value = ''
    
    // Auto-resize textarea
    if (messageInput.value) {
      messageInput.value.style.height = 'auto'
    }
  } catch (error) {
    console.error('Error sending message:', error)
  } finally {
    loading.value = false
  }
}

const handleEnterKey = (event: KeyboardEvent) => {
  if (event.shiftKey) {
    // Allow new line with Shift+Enter
    return
  }
  
  event.preventDefault()
  sendMessage()
}

const toggleFileUpload = () => {
  showFileUpload.value = !showFileUpload.value
  if (!showFileUpload.value) {
    cancelFileUpload()
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectFile(target.files[0])
  }
}

const handleFileDrop = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    selectFile(event.dataTransfer.files[0])
  }
}

const selectFile = (file: File) => {
  // Validate file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    alert('El archivo es demasiado grande. Máximo 10MB.')
    return
  }
  
  selectedFile.value = file
}

const sendFile = async () => {
  if (!selectedFile.value || !chat.value || uploading.value) return
  
  try {
    uploading.value = true
    await ChatService.sendFileMessage(
      chat.value.id,
      currentUserId.value,
      selectedFile.value,
      fileMessage.value.trim() || undefined
    )
    
    cancelFileUpload()
  } catch (error) {
    console.error('Error sending file:', error)
    alert('Error al enviar el archivo. Inténtalo de nuevo.')
  } finally {
    uploading.value = false
  }
}

const cancelFileUpload = () => {
  selectedFile.value = null
  fileMessage.value = ''
  showFileUpload.value = false
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const markAllAsRead = async () => {
  if (!chat.value || unreadCount.value === 0) return
  
  try {
    await ChatService.markAllMessagesAsRead(chat.value.id, currentUserId.value)
    updateUnreadCount()
  } catch (error) {
    console.error('Error marking messages as read:', error)
  }
}

const updateUnreadCount = async () => {
  if (!chat.value) return
  
  try {
    unreadCount.value = await ChatService.getUnreadCount(chat.value.id, currentUserId.value)
  } catch (error) {
    console.error('Error getting unread count:', error)
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const formatTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  
  return date.toLocaleDateString()
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const trackFileDownload = (archivo: ArchivoAdjunto) => {
  // Track file download for audit
  console.log('File downloaded:', archivo.nombre)
}

// Auto-resize textarea
watch(newMessage, () => {
  nextTick(() => {
    if (messageInput.value) {
      messageInput.value.style.height = 'auto'
      messageInput.value.style.height = messageInput.value.scrollHeight + 'px'
    }
  })
})

// Lifecycle
onMounted(() => {
  initializeChat()
})

onUnmounted(() => {
  if (unsubscribeMessages) unsubscribeMessages()
  if (unsubscribeChat) unsubscribeChat()
})
</script>

<style scoped>
.chat-privado {
  @apply flex flex-col h-full bg-gray-900 border border-gray-700 rounded-lg overflow-hidden;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
}

.chat-header {
  @apply p-4 border-b border-gray-700 bg-gray-800;
  background: linear-gradient(90deg, #800020 0%, #a00030 100%);
}

.header-info {
  @apply flex items-center justify-between;
}

.participant-info {
  @apply flex items-center space-x-3;
}

.avatar-container {
  @apply relative;
}

.avatar {
  @apply w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-black font-bold;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
}

.status-indicator {
  @apply absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800;
  background: #666;
}

.status-indicator.active {
  @apply bg-green-400;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.8);
}

.participant-details h3 {
  @apply text-white font-semibold;
}

.participant-details p {
  @apply text-gray-300 text-sm;
}

.chat-actions {
  @apply flex space-x-2;
}

.action-btn {
  @apply p-2 text-cyan-400 hover:text-cyan-300 hover:bg-gray-700 rounded-lg transition-all duration-200;
}

.action-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.unread-indicator {
  @apply mt-2 text-sm text-cyan-400 font-medium;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
}

.messages-container {
  @apply flex-1 overflow-y-auto p-4;
  scrollbar-width: thin;
  scrollbar-color: #800020 #1a1a1a;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: #1a1a1a;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #800020;
  border-radius: 3px;
}

.message-wrapper {
  @apply mb-4;
}

.message-wrapper.own-message {
  @apply flex justify-end;
}

.message-wrapper.system-message .message-bubble {
  @apply bg-gray-700 text-center mx-auto max-w-md;
}

.message-wrapper.unread .message-bubble {
  @apply ring-2 ring-cyan-400;
  animation: pulse-glow 2s infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 5px rgba(0, 255, 255, 0.5); }
  50% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.8); }
}

.message-bubble {
  @apply max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative;
  background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
  border: 1px solid #333;
}

.own-message .message-bubble {
  @apply bg-gradient-to-r from-indigo-600 to-purple-600;
  border: 1px solid #4f46e5;
}

.message-header {
  @apply flex justify-between items-center mb-1 text-xs;
}

.message-author {
  @apply font-semibold text-cyan-400;
}

.message-time {
  @apply text-gray-400;
}

.message-content p {
  @apply text-white break-words;
}

.file-message {
  @apply space-y-2;
}

.file-description {
  @apply text-white text-sm;
}

.file-attachment {
  @apply flex items-center justify-between p-2 bg-gray-800 rounded border border-gray-600;
}

.file-info {
  @apply flex items-center space-x-2;
}

.file-icon {
  @apply w-5 h-5 text-cyan-400;
}

.file-details {
  @apply flex flex-col;
}

.file-name {
  @apply text-white text-sm font-medium;
}

.file-size {
  @apply text-gray-400 text-xs;
}

.download-btn {
  @apply p-1 text-cyan-400 hover:text-cyan-300 hover:bg-gray-700 rounded transition-colors;
}

.message-status {
  @apply absolute -bottom-1 -right-1;
}

.read-indicator {
  @apply w-4 h-4 text-green-400;
}

.unread-indicator {
  @apply w-4 h-4 text-gray-400;
}

.file-upload-area {
  @apply p-4 border-t border-gray-700 bg-gray-800;
}

.upload-zone {
  @apply border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-cyan-400 transition-colors;
}

.upload-content {
  @apply space-y-2;
}

.upload-icon {
  @apply w-8 h-8 mx-auto text-gray-400;
}

.upload-link {
  @apply text-cyan-400 hover:text-cyan-300 underline;
}

.upload-hint {
  @apply text-gray-500 text-sm;
}

.selected-file {
  @apply mt-4 p-4 bg-gray-700 rounded-lg;
}

.file-preview {
  @apply flex justify-between items-center mb-3;
}

.file-actions {
  @apply flex space-x-2;
}

.file-message-input {
  @apply flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400;
}

.send-file-btn {
  @apply px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-medium transition-colors;
}

.send-file-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.cancel-btn {
  @apply px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors;
}

.message-input-container {
  @apply p-4 border-t border-gray-700 bg-gray-800;
}

.input-wrapper {
  @apply flex items-end space-x-2;
}

.message-input {
  @apply flex-1 px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400;
  min-height: 40px;
  max-height: 120px;
}

.send-btn {
  @apply p-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200;
}

.send-btn:not(:disabled):hover {
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
}

.send-icon {
  @apply w-5 h-5;
}

.connection-status {
  @apply flex items-center justify-center space-x-2 p-2 bg-red-900 text-red-200 text-sm;
}

.status-indicator.offline {
  @apply w-2 h-2 bg-red-400 rounded-full;
  animation: pulse 2s infinite;
}

.hidden {
  display: none;
}
</style>