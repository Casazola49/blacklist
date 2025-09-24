<template>
  <div class="space-y-6">
    <!-- Escrow Status Overview -->
    <div class="p-6 bg-bg-secondary rounded-lg border border-brand-primary/20">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-text-primary">Sistema de Escrow</h3>
        <EscrowStatusBadge v-if="escrowTransaction" :status="escrowTransaction.estado" />
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-8">
        <CyberLoader text="Cargando información de escrow..." />
      </div>

      <!-- Escrow Flow -->
      <div v-else-if="escrowTransaction" class="space-y-6">
        <!-- Progress Timeline -->
        <div class="relative">
          <div class="flex items-center justify-between">
            <div 
              v-for="(step, index) in escrowSteps" 
              :key="step.status"
              class="flex flex-col items-center relative"
              :class="{ 'flex-1': index < escrowSteps.length - 1 }"
            >
              <!-- Step Circle -->
              <div 
                :class="[
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all duration-300',
                  getStepClasses(step.status, index)
                ]"
              >
                <svg v-if="isStepCompleted(step.status)" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span v-else>{{ index + 1 }}</span>
              </div>

              <!-- Step Label -->
              <span 
                :class="[
                  'mt-2 text-xs text-center max-w-20',
                  isStepActive(step.status) ? 'text-accent-cyan font-medium' : 'text-text-muted'
                ]"
              >
                {{ step.label }}
              </span>

              <!-- Connection Line -->
              <div 
                v-if="index < escrowSteps.length - 1"
                :class="[
                  'absolute top-4 left-8 right-0 h-0.5 transition-all duration-300',
                  isStepCompleted(escrowSteps[index + 1].status) ? 'bg-accent-cyan' : 'bg-brand-primary/20'
                ]"
              ></div>
            </div>
          </div>
        </div>

        <!-- Current Step Details -->
        <div class="p-4 bg-bg-tertiary rounded-lg border border-brand-primary/10">
          <h4 class="font-medium text-text-primary mb-2">{{ getCurrentStepTitle() }}</h4>
          <p class="text-text-secondary text-sm mb-4">{{ getCurrentStepDescription() }}</p>

          <!-- Step-specific Actions -->
          <div v-if="escrowTransaction.estado === 'pendiente_deposito'" class="space-y-3">
            <NeonButton 
              variant="primary" 
              size="sm" 
              @click="showPaymentModal = true"
              class="w-full"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Realizar Pago
            </NeonButton>
          </div>

          <div v-else-if="escrowTransaction.estado === 'fondos_retenidos'" class="space-y-3">
            <div class="flex items-center text-blue-400 text-sm">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Fondos seguros en escrow. El especialista puede comenzar el trabajo.
            </div>
          </div>

          <div v-else-if="escrowTransaction.estado === 'liberado_especialista'" class="space-y-3">
            <div class="flex items-center text-green-400 text-sm">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Fondos liberados exitosamente al especialista.
            </div>
          </div>
        </div>

        <!-- Transaction Details -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Financial Breakdown -->
          <div class="p-4 bg-bg-tertiary rounded-lg border border-brand-primary/10">
            <h4 class="font-medium text-text-primary mb-3">Desglose Financiero</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-text-secondary">Monto Total:</span>
                <span class="text-accent-cyan font-semibold">${{ escrowTransaction.monto }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-secondary">Comisión Plataforma:</span>
                <span class="text-accent-magenta font-semibold">${{ escrowTransaction.comisionPlataforma }}</span>
              </div>
              <div class="flex justify-between border-t border-brand-primary/20 pt-2">
                <span class="text-text-secondary">Para Especialista:</span>
                <span class="text-brand-primary font-semibold">
                  ${{ (escrowTransaction.monto - escrowTransaction.comisionPlataforma).toFixed(2) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Transaction Info -->
          <div class="p-4 bg-bg-tertiary rounded-lg border border-brand-primary/10">
            <h4 class="font-medium text-text-primary mb-3">Información de Transacción</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-text-secondary">ID:</span>
                <span class="text-text-primary font-mono">{{ escrowTransaction.id.slice(0, 8) }}...</span>
              </div>
              <div v-if="escrowTransaction.fechaDeposito" class="flex justify-between">
                <span class="text-text-secondary">Depositado:</span>
                <span class="text-text-primary">{{ formatDate(escrowTransaction.fechaDeposito) }}</span>
              </div>
              <div v-if="escrowTransaction.referenciaTransaccion" class="flex justify-between">
                <span class="text-text-secondary">Referencia:</span>
                <span class="text-text-primary font-mono">{{ escrowTransaction.referenciaTransaccion }}</span>
              </div>
              <div v-if="escrowTransaction.fechaLiberacion" class="flex justify-between">
                <span class="text-text-secondary">Liberado:</span>
                <span class="text-text-primary">{{ formatDate(escrowTransaction.fechaLiberacion) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Dispute Option -->
        <div v-if="canDispute" class="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
          <div class="flex items-start justify-between">
            <div class="flex items-start">
              <svg class="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h5 class="text-red-400 font-medium text-sm">¿Hay un problema?</h5>
                <p class="text-text-secondary text-xs mt-1">
                  Si hay algún problema con la transacción, puedes iniciar una disputa.
                </p>
              </div>
            </div>
            <NeonButton 
              variant="danger" 
              size="xs" 
              @click="initiateDispute"
              :disabled="disputing"
            >
              {{ disputing ? 'Procesando...' : 'Disputar' }}
            </NeonButton>
          </div>
        </div>
      </div>

      <!-- No Escrow Transaction -->
      <div v-else class="text-center py-8">
        <div class="w-16 h-16 mx-auto mb-4 bg-bg-tertiary rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <h4 class="text-text-primary font-medium mb-2">Sin Transacción de Escrow</h4>
        <p class="text-text-secondary text-sm">
          No hay una transacción de escrow activa para este contrato.
        </p>
      </div>
    </div>

    <!-- Payment Confirmation Modal -->
    <PaymentConfirmationModal
      :is-open="showPaymentModal"
      :contract="contract"
      :payment-amount="contract.precioFinal || 0"
      @close="showPaymentModal = false"
      @confirmed="handlePaymentConfirmed"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Contrato, TransaccionEscrow, EstadoEscrow } from '../../types'
import { EscrowService } from '../../services/escrow'
import { CyberLoader, NeonButton } from '../ui'
import EscrowStatusBadge from './EscrowStatusBadge.vue'
import PaymentConfirmationModal from './PaymentConfirmationModal.vue'

interface Props {
  contract: Contrato
}

const props = defineProps<Props>()

// State
const escrowTransaction = ref<TransaccionEscrow | null>(null)
const loading = ref(false)
const showPaymentModal = ref(false)
const disputing = ref(false)
let unsubscribe: (() => void) | null = null

// Escrow flow steps
const escrowSteps = [
  { status: 'pendiente_deposito', label: 'Pago Pendiente' },
  { status: 'fondos_retenidos', label: 'Fondos Seguros' },
  { status: 'liberado_especialista', label: 'Fondos Liberados' }
]

// Computed
const canDispute = computed(() => {
  return escrowTransaction.value && 
         ['fondos_retenidos', 'liberado_especialista'].includes(escrowTransaction.value.estado)
})

// Methods
const loadEscrowTransaction = async () => {
  try {
    loading.value = true
    escrowTransaction.value = await EscrowService.getEscrowTransactionByContract(props.contract.id)
  } catch (error) {
    console.error('Error loading escrow transaction:', error)
  } finally {
    loading.value = false
  }
}

const subscribeToEscrowUpdates = () => {
  if (escrowTransaction.value) {
    unsubscribe = EscrowService.subscribeToEscrowTransaction(
      escrowTransaction.value.id,
      (transaction) => {
        escrowTransaction.value = transaction
      }
    )
  }
}

const getStepClasses = (status: EstadoEscrow, index: number): string => {
  const isCompleted = isStepCompleted(status)
  const isActive = isStepActive(status)
  
  if (isCompleted) {
    return 'bg-accent-cyan border-accent-cyan text-bg-primary'
  } else if (isActive) {
    return 'bg-bg-primary border-accent-cyan text-accent-cyan animate-pulse'
  } else {
    return 'bg-bg-tertiary border-brand-primary/20 text-text-muted'
  }
}

const isStepCompleted = (status: EstadoEscrow): boolean => {
  if (!escrowTransaction.value) return false
  
  const currentIndex = escrowSteps.findIndex(step => step.status === escrowTransaction.value!.estado)
  const stepIndex = escrowSteps.findIndex(step => step.status === status)
  
  return currentIndex > stepIndex
}

const isStepActive = (status: EstadoEscrow): boolean => {
  return escrowTransaction.value?.estado === status
}

const getCurrentStepTitle = (): string => {
  if (!escrowTransaction.value) return ''
  
  const titles: Record<EstadoEscrow, string> = {
    'pendiente_deposito': 'Esperando Pago del Cliente',
    'fondos_retenidos': 'Fondos Asegurados en Escrow',
    'liberado_especialista': 'Pago Completado',
    'reembolsado_cliente': 'Fondos Reembolsados',
    'en_disputa': 'Transacción en Disputa'
  }
  
  return titles[escrowTransaction.value.estado] || 'Estado Desconocido'
}

const getCurrentStepDescription = (): string => {
  if (!escrowTransaction.value) return ''
  
  const descriptions: Record<EstadoEscrow, string> = {
    'pendiente_deposito': 'El cliente debe realizar el pago para que los fondos queden en garantía y el especialista pueda comenzar el trabajo.',
    'fondos_retenidos': 'Los fondos están seguros en nuestro sistema de escrow. El especialista puede trabajar con confianza sabiendo que el pago está garantizado.',
    'liberado_especialista': 'El trabajo ha sido aprobado y los fondos han sido liberados al especialista exitosamente.',
    'reembolsado_cliente': 'Los fondos han sido reembolsados al cliente debido a la cancelación o disputa del contrato.',
    'en_disputa': 'Esta transacción está siendo revisada por nuestro equipo de administración para resolver la disputa.'
  }
  
  return descriptions[escrowTransaction.value.estado] || 'Estado no reconocido.'
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const handlePaymentConfirmed = () => {
  showPaymentModal.value = false
  // Reload escrow transaction to get updated status
  loadEscrowTransaction()
}

const initiateDispute = async () => {
  if (!escrowTransaction.value || disputing.value) return
  
  try {
    disputing.value = true
    await EscrowService.disputeTransaction(escrowTransaction.value.id)
    // The subscription will update the UI automatically
  } catch (error) {
    console.error('Error initiating dispute:', error)
    // TODO: Show error notification
  } finally {
    disputing.value = false
  }
}

// Lifecycle
onMounted(async () => {
  if (['esperando_deposito', 'fondos_garantia', 'entrega_realizada', 'completado'].includes(props.contract.estado)) {
    await loadEscrowTransaction()
    subscribeToEscrowUpdates()
  }
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>