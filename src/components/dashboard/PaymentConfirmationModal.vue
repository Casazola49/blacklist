<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-black/80 backdrop-blur-sm"
      @click="closeModal"
    ></div>
    
    <!-- Modal -->
    <div class="relative bg-bg-secondary border border-brand-primary/30 rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden">
      <!-- Header -->
      <div class="p-6 border-b border-brand-primary/20">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-text-primary">
            Confirmar Pago
          </h3>
          <button
            @click="closeModal"
            class="text-text-muted hover:text-text-primary transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Payment Details -->
        <div class="space-y-4">
          <div class="p-4 bg-bg-tertiary rounded-lg border border-brand-primary/10">
            <h4 class="font-medium text-text-primary mb-3">Detalles del Pago</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-text-secondary">Monto Total:</span>
                <span class="text-accent-cyan font-semibold">${{ paymentAmount }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-secondary">Comisión Plataforma (15%):</span>
                <span class="text-accent-magenta font-semibold">${{ commission }}</span>
              </div>
              <div class="flex justify-between border-t border-brand-primary/20 pt-2">
                <span class="text-text-secondary">Para Especialista:</span>
                <span class="text-brand-primary font-semibold">${{ specialistAmount }}</span>
              </div>
            </div>
          </div>

          <!-- QR Code Display -->
          <div class="text-center">
            <div class="inline-block p-4 bg-white rounded-lg mb-4">
              <div class="w-48 h-48 bg-white rounded grid grid-cols-16 gap-px p-2">
                <div 
                  v-for="(row, i) in qrPattern" 
                  :key="`row-${i}`"
                  class="contents"
                >
                  <div 
                    v-for="(pixel, j) in row"
                    :key="`pixel-${i}-${j}`"
                    :class="[
                      'aspect-square',
                      pixel ? 'bg-black' : 'bg-white'
                    ]"
                  ></div>
                </div>
              </div>
            </div>
            <p class="text-text-secondary text-sm mb-2">
              Escanea el código QR para realizar el pago
            </p>
            <p class="text-text-muted text-xs break-all">
              Código: {{ qrCode.slice(0, 32) }}...
            </p>
          </div>

          <!-- Bank Transfer Info -->
          <div v-if="bankTransferInfo" class="p-4 bg-bg-tertiary rounded-lg border border-brand-primary/10">
            <h4 class="font-medium text-text-primary mb-3">Información de Transferencia</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-text-secondary">Cuenta:</span>
                <span class="text-text-primary font-mono">{{ bankTransferInfo.accountNumber }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-secondary">Routing:</span>
                <span class="text-text-primary font-mono">{{ bankTransferInfo.routingNumber }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-secondary">Referencia:</span>
                <span class="text-accent-cyan font-mono">{{ bankTransferInfo.reference }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-secondary">Memo:</span>
                <span class="text-text-primary">{{ bankTransferInfo.memo }}</span>
              </div>
            </div>
          </div>

          <!-- Payment Reference Input -->
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">
              Referencia de Transacción
            </label>
            <input
              v-model="paymentReference"
              type="text"
              placeholder="Ingresa la referencia de tu pago"
              class="w-full px-3 py-2 bg-bg-tertiary border border-brand-primary/20 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan transition-colors"
            />
            <p class="text-text-muted text-xs mt-1">
              Esta referencia será utilizada para verificar tu pago
            </p>
          </div>
        </div>

        <!-- Security Notice -->
        <div class="p-3 bg-accent-cyan/5 border border-accent-cyan/20 rounded-lg">
          <div class="flex items-start">
            <svg class="w-4 h-4 text-accent-cyan mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <h5 class="text-accent-cyan font-medium text-xs">Pago Seguro</h5>
              <p class="text-text-secondary text-xs mt-1">
                Tus fondos estarán protegidos hasta que apruebes el trabajo final.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="p-6 border-t border-brand-primary/20 flex gap-3">
        <NeonButton
          variant="secondary"
          size="sm"
          @click="closeModal"
          class="flex-1"
        >
          Cancelar
        </NeonButton>
        <NeonButton
          variant="primary"
          size="sm"
          @click="confirmPayment"
          :disabled="!paymentReference.trim() || confirming"
          class="flex-1"
        >
          <CyberLoader v-if="confirming" size="xs" class="mr-2" />
          {{ confirming ? 'Confirmando...' : 'Confirmar Pago' }}
        </NeonButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NeonButton, CyberLoader } from '../ui'
import { EscrowService } from '../../services/escrow'
import { ContractsService } from '../../services/contracts'
import { QRGenerator } from '../../services/qrGenerator'
import type { Contrato } from '../../types'

interface Props {
  isOpen: boolean
  contract: Contrato
  paymentAmount: number
}

interface Emits {
  (e: 'close'): void
  (e: 'confirmed'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const paymentReference = ref('')
const confirming = ref(false)
const qrCode = ref('')
const qrPattern = ref<boolean[][]>([])
const bankTransferInfo = ref<any>(null)

// Computed
const commission = computed(() => Math.round(props.paymentAmount * 0.15 * 100) / 100)
const specialistAmount = computed(() => Math.round((props.paymentAmount - commission.value) * 100) / 100)

// Methods
const closeModal = () => {
  if (!confirming.value) {
    emit('close')
  }
}

const generateQRCode = () => {
  const expirationDate = new Date()
  expirationDate.setHours(expirationDate.getHours() + 24) // 24 hours expiration

  const qrData = {
    amount: props.paymentAmount,
    contractId: props.contract.id,
    reference: `PAY_${props.contract.id.slice(0, 8)}_${Date.now()}`,
    expirationDate
  }

  qrCode.value = QRGenerator.generatePaymentQR(qrData)
  qrPattern.value = QRGenerator.generateQRPattern(qrCode.value, 16)
  bankTransferInfo.value = QRGenerator.generateBankTransferInfo(qrData)
  
  // Set the payment reference automatically
  paymentReference.value = qrData.reference
}

const getQRPixel = (row: number, col: number): boolean => {
  return qrPattern.value[row]?.[col] || false
}

const confirmPayment = async () => {
  if (!paymentReference.value.trim() || confirming.value) return

  try {
    confirming.value = true

    // Create escrow transaction
    const transactionId = await EscrowService.createEscrowTransaction({
      contratoId: props.contract.id,
      clienteId: props.contract.clienteId,
      especialistaId: props.contract.especialistaId!,
      monto: props.paymentAmount,
      comisionPlataforma: commission.value
    })

    // Confirm the deposit with payment reference
    await EscrowService.confirmDeposit(transactionId, paymentReference.value.trim())

    // Update contract status to "fondos_garantia"
    await ContractsService.updateContract(props.contract.id, {
      estado: 'fondos_garantia'
    })

    emit('confirmed')
    emit('close')
  } catch (error) {
    console.error('Error confirming payment:', error)
    // TODO: Show error notification
  } finally {
    confirming.value = false
  }
}

// Lifecycle
onMounted(() => {
  generateQRCode()
})
</script>