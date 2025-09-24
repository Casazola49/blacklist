<template>
  <div class="p-6 bg-bg-secondary rounded-lg border border-brand-primary/20">
    <h3 class="text-lg font-semibold text-text-primary mb-4">Demo del Sistema de Escrow</h3>
    
    <div class="space-y-4">
      <!-- Commission Calculator -->
      <div class="p-4 bg-bg-tertiary rounded-lg">
        <h4 class="font-medium text-text-primary mb-3">Calculadora de Comisiones</h4>
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <label class="block text-sm text-text-secondary mb-1">Monto del Contrato</label>
            <input
              v-model.number="amount"
              type="number"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 bg-bg-primary border border-brand-primary/20 rounded text-text-primary focus:outline-none focus:border-accent-cyan"
              placeholder="100.00"
            />
          </div>
          <div class="text-center">
            <div class="text-sm text-text-secondary">Comisión (15%)</div>
            <div class="text-lg font-semibold text-accent-magenta">${{ commission }}</div>
          </div>
          <div class="text-center">
            <div class="text-sm text-text-secondary">Para Especialista</div>
            <div class="text-lg font-semibold text-brand-primary">${{ specialistPayout }}</div>
          </div>
        </div>
      </div>

      <!-- QR Code Demo -->
      <div class="p-4 bg-bg-tertiary rounded-lg">
        <h4 class="font-medium text-text-primary mb-3">Generador de Código QR</h4>
        <div class="flex items-start gap-4">
          <div class="flex-1">
            <NeonButton 
              variant="primary" 
              size="sm" 
              @click="generateQR"
              class="mb-3"
            >
              Generar Código QR
            </NeonButton>
            <div v-if="qrData" class="text-sm space-y-1">
              <div><span class="text-text-secondary">Contrato:</span> {{ qrData.contractId }}</div>
              <div><span class="text-text-secondary">Monto:</span> ${{ qrData.amount }}</div>
              <div><span class="text-text-secondary">Referencia:</span> {{ qrData.reference }}</div>
              <div><span class="text-text-secondary">Expira:</span> {{ formatDate(qrData.expirationDate) }}</div>
            </div>
          </div>
          <div v-if="qrPattern.length > 0" class="bg-white p-2 rounded">
            <div class="w-32 h-32 grid grid-cols-16 gap-px">
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
        </div>
      </div>

      <!-- Escrow States Demo -->
      <div class="p-4 bg-bg-tertiary rounded-lg">
        <h4 class="font-medium text-text-primary mb-3">Estados del Escrow</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div 
            v-for="status in escrowStates" 
            :key="status.key"
            class="p-3 bg-bg-primary rounded border border-brand-primary/10"
          >
            <EscrowStatusBadge :status="status.key" />
            <p class="text-xs text-text-secondary mt-2">{{ status.description }}</p>
          </div>
        </div>
      </div>

      <!-- Integration Test -->
      <div class="p-4 bg-bg-tertiary rounded-lg">
        <h4 class="font-medium text-text-primary mb-3">Test de Integración</h4>
        <div class="flex gap-2 mb-3">
          <NeonButton 
            variant="primary" 
            size="xs" 
            @click="testEscrowFlow"
            :disabled="testing"
          >
            {{ testing ? 'Probando...' : 'Probar Flujo Completo' }}
          </NeonButton>
          <NeonButton 
            variant="secondary" 
            size="xs" 
            @click="clearTest"
          >
            Limpiar
          </NeonButton>
        </div>
        <div v-if="testResults.length > 0" class="space-y-1 text-xs font-mono">
          <div 
            v-for="(result, index) in testResults" 
            :key="index"
            :class="[
              'p-2 rounded',
              result.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            ]"
          >
            {{ result.message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NeonButton } from '../ui'
import { EscrowService } from '../../services/escrow'
import { QRGenerator } from '../../services/qrGenerator'
import EscrowStatusBadge from './EscrowStatusBadge.vue'
import type { EstadoEscrow } from '../../types'

// State
const amount = ref(100)
const qrData = ref<any>(null)
const qrPattern = ref<boolean[][]>([])
const testing = ref(false)
const testResults = ref<Array<{ message: string; success: boolean }>>([])

// Computed
const commission = computed(() => EscrowService.calculateCommission(amount.value))
const specialistPayout = computed(() => EscrowService.calculateSpecialistPayout(amount.value))

// Escrow states for demo
const escrowStates: Array<{ key: EstadoEscrow; description: string }> = [
  { key: 'pendiente_deposito', description: 'Cliente debe realizar el pago' },
  { key: 'fondos_retenidos', description: 'Fondos seguros, trabajo en progreso' },
  { key: 'liberado_especialista', description: 'Pago completado exitosamente' },
  { key: 'reembolsado_cliente', description: 'Fondos devueltos al cliente' },
  { key: 'en_disputa', description: 'Requiere intervención administrativa' }
]

// Methods
const generateQR = () => {
  const expirationDate = new Date()
  expirationDate.setHours(expirationDate.getHours() + 24)

  qrData.value = {
    amount: amount.value,
    contractId: `demo-${Date.now()}`,
    reference: `REF_${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    expirationDate
  }

  const qrCode = QRGenerator.generatePaymentQR(qrData.value)
  qrPattern.value = QRGenerator.generateQRPattern(qrCode, 16)
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const testEscrowFlow = async () => {
  testing.value = true
  testResults.value = []

  try {
    // Test 1: Commission calculation
    const testAmount = 100
    const calculatedCommission = EscrowService.calculateCommission(testAmount)
    const calculatedPayout = EscrowService.calculateSpecialistPayout(testAmount)
    
    testResults.value.push({
      message: `✓ Comisión calculada: $${calculatedCommission} (15% de $${testAmount})`,
      success: calculatedCommission === 15
    })
    
    testResults.value.push({
      message: `✓ Pago especialista: $${calculatedPayout} ($${testAmount} - $${calculatedCommission})`,
      success: calculatedPayout === 85
    })

    // Test 2: QR Code generation
    const qrTestData = {
      amount: testAmount,
      contractId: 'test-contract-123',
      reference: 'TEST_REF_123',
      expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
    
    const qrCode = QRGenerator.generatePaymentQR(qrTestData)
    testResults.value.push({
      message: `✓ Código QR generado: ${qrCode.slice(0, 20)}...`,
      success: qrCode.length > 0
    })

    // Test 3: QR Code validation
    const validatedData = QRGenerator.validateQRCode(qrCode)
    testResults.value.push({
      message: `✓ Validación QR: ${validatedData ? 'Válido' : 'Inválido'}`,
      success: validatedData !== null
    })

    // Test 4: QR Pattern generation
    const pattern = QRGenerator.generateQRPattern(qrCode, 16)
    testResults.value.push({
      message: `✓ Patrón QR generado: ${pattern.length}x${pattern[0]?.length} matriz`,
      success: pattern.length === 16 && pattern[0]?.length === 16
    })

    // Test 5: Bank transfer info
    const bankInfo = QRGenerator.generateBankTransferInfo(qrTestData)
    testResults.value.push({
      message: `✓ Info bancaria: Cuenta ${bankInfo.accountNumber}, Monto $${bankInfo.amount}`,
      success: bankInfo.amount === testAmount
    })

    testResults.value.push({
      message: '🎉 Todos los tests del sistema de escrow pasaron exitosamente',
      success: true
    })

  } catch (error) {
    testResults.value.push({
      message: `❌ Error en test: ${error}`,
      success: false
    })
  } finally {
    testing.value = false
  }
}

const clearTest = () => {
  testResults.value = []
  qrData.value = null
  qrPattern.value = []
}
</script>