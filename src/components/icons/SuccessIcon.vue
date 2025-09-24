<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="success-icon"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22,4 12,14.01 9,11.01" />
  </svg>
</template>

<style scoped>
.success-icon {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 4px currentColor);
  animation: success-check 0.6s ease-in-out;
}

@keyframes success-check {
  0% { 
    transform: scale(0.8);
    opacity: 0;
  }
  50% { 
    transform: scale(1.1);
  }
  100% { 
    transform: scale(1);
    opacity: 1;
  }
}
</style>