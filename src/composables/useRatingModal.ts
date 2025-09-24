import { ref, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRatingsStore } from '../stores/ratings'
import type { Contrato } from '../types'

export function useRatingModal() {
  const authStore = useAuthStore()
  const ratingsStore = useRatingsStore()
  
  const isRatingModalOpen = ref(false)
  const contractToRate = ref<Contrato | null>(null)
  const pendingContracts = ref<Contrato[]>([])

  // Check if user needs to rate any contracts
  const checkPendingRatings = async (contracts: Contrato[]) => {
    if (!authStore.user) return

    const completedContracts = contracts.filter(c => c.estado === 'completado')
    const contractsNeedingRating: Contrato[] = []

    for (const contract of completedContracts) {
      const hasRated = await ratingsStore.checkIfUserRatedContract(authStore.user.uid, contract.id)
      if (!hasRated) {
        contractsNeedingRating.push(contract)
      }
    }

    pendingContracts.value = contractsNeedingRating

    // Auto-open modal for the first pending contract
    if (contractsNeedingRating.length > 0 && !isRatingModalOpen.value) {
      openRatingModal(contractsNeedingRating[0])
    }
  }

  const openRatingModal = (contract: Contrato) => {
    contractToRate.value = contract
    isRatingModalOpen.value = true
  }

  const closeRatingModal = () => {
    isRatingModalOpen.value = false
    contractToRate.value = null
  }

  const onRatingSubmitted = () => {
    // Remove the rated contract from pending list
    if (contractToRate.value) {
      const index = pendingContracts.value.findIndex(c => c.id === contractToRate.value!.id)
      if (index > -1) {
        pendingContracts.value.splice(index, 1)
      }
    }

    closeRatingModal()

    // If there are more pending contracts, open modal for the next one
    if (pendingContracts.value.length > 0) {
      setTimeout(() => {
        openRatingModal(pendingContracts.value[0])
      }, 1000) // Small delay for better UX
    }
  }

  const hasPendingRatings = computed(() => pendingContracts.value.length > 0)

  return {
    isRatingModalOpen,
    contractToRate,
    pendingContracts,
    hasPendingRatings,
    checkPendingRatings,
    openRatingModal,
    closeRatingModal,
    onRatingSubmitted
  }
}