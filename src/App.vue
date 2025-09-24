<template>
  <div id="app" class="min-h-screen bg-primary text-primary">
    <!-- PWA Status and Controls -->
    <PWAStatus />
    
    <!-- Main Application -->
    <PageTransition type="cyber" direction="right" :play-sound="true">
      <RouterView />
    </PageTransition>

    <!-- Global Notification Center -->
    <NotificationCenter />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import PageTransition from './components/ui/PageTransition.vue'
import PWAStatus from './components/ui/PWAStatus.vue'
import NotificationCenter from './components/ui/NotificationCenter.vue'
</script>

<style scoped>
#app {
  font-family: 'Orbitron', 'Inter', system-ui, Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>