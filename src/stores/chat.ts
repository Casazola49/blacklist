import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ChatService } from '../services/chat'
import type { Chat, Mensaje } from '../types'

export const useChatStore = defineStore('chat', () => {
  // State
  const chats = ref<Chat[]>([])
  const activeChat = ref<Chat | null>(null)
  const messages = ref<Mensaje[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const activeChatId = computed(() => activeChat.value?.id || null)
  const unreadChatsCount = computed(() => {
    // This would need to be calculated based on unread messages
    return 0 // Placeholder
  })

  // Actions
  const setActiveChat = (chat: Chat | null) => {
    activeChat.value = chat
    if (chat) {
      loadMessages(chat.id)
    } else {
      messages.value = []
    }
  }

  const loadUserChats = async (userId: string) => {
    try {
      loading.value = true
      error.value = null
      chats.value = await ChatService.getUserChats(userId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error loading chats'
      console.error('Error loading user chats:', err)
    } finally {
      loading.value = false
    }
  }

  const loadMessages = async (chatId: string) => {
    try {
      loading.value = true
      error.value = null
      messages.value = await ChatService.getMessages(chatId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error loading messages'
      console.error('Error loading messages:', err)
    } finally {
      loading.value = false
    }
  }

  const sendMessage = async (chatId: string, userId: string, content: string) => {
    try {
      error.value = null
      await ChatService.sendMessage(chatId, userId, content)
      // Messages will be updated via real-time subscription
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error sending message'
      console.error('Error sending message:', err)
      throw err
    }
  }

  const sendFileMessage = async (chatId: string, userId: string, file: File, message?: string) => {
    try {
      error.value = null
      await ChatService.sendFileMessage(chatId, userId, file, message)
      // Messages will be updated via real-time subscription
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error sending file'
      console.error('Error sending file:', err)
      throw err
    }
  }

  const markAllAsRead = async (chatId: string, userId: string) => {
    try {
      error.value = null
      await ChatService.markAllMessagesAsRead(chatId, userId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error marking messages as read'
      console.error('Error marking messages as read:', err)
    }
  }

  const createChatForContract = async (contractId: string, participants: string[]) => {
    try {
      loading.value = true
      error.value = null
      const chatId = await ChatService.createChat(contractId, participants)
      const chat = await ChatService.getChat(chatId)
      if (chat) {
        chats.value.unshift(chat)
        return chat
      }
      return null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error creating chat'
      console.error('Error creating chat:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getChatByContract = async (contractId: string) => {
    try {
      const chat = await ChatService.getChatByContract(contractId)
      return chat
    } catch (err) {
      console.error('Error getting chat by contract:', err)
      return null
    }
  }

  const archiveChat = async (chatId: string) => {
    try {
      error.value = null
      await ChatService.archiveChat(chatId)
      // Update local state
      const chatIndex = chats.value.findIndex(c => c.id === chatId)
      if (chatIndex !== -1) {
        chats.value[chatIndex].estado = 'archivado'
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error archiving chat'
      console.error('Error archiving chat:', err)
    }
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    chats.value = []
    activeChat.value = null
    messages.value = []
    loading.value = false
    error.value = null
  }

  return {
    // State
    chats,
    activeChat,
    messages,
    loading,
    error,
    
    // Computed
    activeChatId,
    unreadChatsCount,
    
    // Actions
    setActiveChat,
    loadUserChats,
    loadMessages,
    sendMessage,
    sendFileMessage,
    markAllAsRead,
    createChatForContract,
    getChatByContract,
    archiveChat,
    clearError,
    reset
  }
})