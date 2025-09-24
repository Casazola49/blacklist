<template>
  <div class="space-y-4">
    <!-- Use the comprehensive EscrowManager instead -->
    <EscrowManager :contract="contract" />
  </div>
</template>

<script setup lang="ts">
import type { Contrato } from '../../types'
import EscrowManager from './EscrowManager.vue'

interface Props {
  contract: Contrato
}

defineProps<Props>()
</script>