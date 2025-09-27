<template>
  <div id="app" class="min-h-screen bg-primary text-primary">
    <!-- Simplified for demo - no PWA, no sound effects -->
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<style scoped>
#app {
  font-family: 'Orbitron', 'Inter', system-ui, Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>