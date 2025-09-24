import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Calificacion, ResumenCalificaciones } from '../types'
import { RatingsService } from '../services/ratings'

export const useRatingsStore = defineStore('ratings', () => {
  // State
  const ratings = ref<Calificacion[]>([])
  const userRatings = ref<Calificacion[]>([])
  const ratingSummary = ref<ResumenCalificaciones | null>(null)
  const pendingRatings = ref<string[]>([]) // Contract IDs that need rating
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const hasRatedContract = computed(() => (contractId: string) => {
    return ratings.value.some(r => r.contratoId === contractId)
  })

  const getRatingForContract = computed(() => (contractId: string) => {
    return ratings.value.find(r => r.contratoId === contractId)
  })

  const averageRating = computed(() => {
    return ratingSummary.value?.promedioGeneral || 0
  })

  const totalRatings = computed(() => {
    return ratingSummary.value?.totalCalificaciones || 0
  })

  // Actions
  const loadUserRatings = async (userId: string) => {
    try {
      loading.value = true
      error.value = null
      userRatings.value = await RatingsService.getRatingsForUser(userId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar calificaciones'
      throw err
    } finally {
      loading.value = false
    }
  }

  const loadRatingsByUser = async (userId: string) => {
    try {
      loading.value = true
      error.value = null
      ratings.value = await RatingsService.getRatingsByUser(userId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar calificaciones enviadas'
      throw err
    } finally {
      loading.value = false
    }
  }

  const loadRatingSummary = async (userId: string) => {
    try {
      loading.value = true
      error.value = null
      ratingSummary.value = await RatingsService.getUserRatingSummary(userId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar resumen de calificaciones'
      throw err
    } finally {
      loading.value = false
    }
  }

  const submitRating = async (ratingData: Omit<Calificacion, 'id' | 'fechaCalificacion' | 'visible'>) => {
    try {
      loading.value = true
      error.value = null
      
      const ratingId = await RatingsService.createRating(ratingData)
      
      // Remove from pending ratings
      const index = pendingRatings.value.indexOf(ratingData.contratoId)
      if (index > -1) {
        pendingRatings.value.splice(index, 1)
      }
      
      // Reload user data
      await Promise.all([
        loadRatingsByUser(ratingData.evaluadorId),
        loadRatingSummary(ratingData.evaluadoId)
      ])
      
      return ratingId
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al enviar calificación'
      throw err
    } finally {
      loading.value = false
    }
  }

  const checkIfUserRatedContract = async (userId: string, contractId: string): Promise<boolean> => {
    try {
      return await RatingsService.hasUserRatedContract(userId, contractId)
    } catch (err) {
      console.error('Error checking if user rated contract:', err)
      return false
    }
  }

  const addPendingRating = (contractId: string) => {
    if (!pendingRatings.value.includes(contractId)) {
      pendingRatings.value.push(contractId)
    }
  }

  const removePendingRating = (contractId: string) => {
    const index = pendingRatings.value.indexOf(contractId)
    if (index > -1) {
      pendingRatings.value.splice(index, 1)
    }
  }

  const clearError = () => {
    error.value = null
  }

  // Real-time subscriptions
  const subscribeToUserRatings = (userId: string) => {
    return RatingsService.subscribeToUserRatings(userId, (updatedRatings) => {
      userRatings.value = updatedRatings
    })
  }

  return {
    // State
    ratings,
    userRatings,
    ratingSummary,
    pendingRatings,
    loading,
    error,
    // Getters
    hasRatedContract,
    getRatingForContract,
    averageRating,
    totalRatings,
    // Actions
    loadUserRatings,
    loadRatingsByUser,
    loadRatingSummary,
    submitRating,
    checkIfUserRatedContract,
    addPendingRating,
    removePendingRating,
    clearError,
    subscribeToUserRatings
  }
})