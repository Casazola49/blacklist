<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="info-icon"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m12 16-4-4 4-4" />
    <path d="m16 12H8" />
  </svg>
</template>

<style scoped>
.info-icon {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 4px currentColor);
  animation: info-glow 3s infinite;
}

@keyframes info-glow {
  0%, 100% { filter: drop-shadow(0 0 4px currentColor); }
  50% { filter: drop-shadow(0 0 8px currentColor); }
}
</style>