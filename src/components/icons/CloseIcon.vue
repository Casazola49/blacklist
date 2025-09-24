<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="close-icon"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
</template>

<style scoped>
.close-icon {
  width: 100%;
  height: 100%;
  transition: all 0.2s ease;
}

.close-icon:hover {
  transform: rotate(90deg);
  filter: drop-shadow(0 0 6px currentColor);
}
</style>