import { ref } from 'vue'

// Simplified sound effects for demo - no actual audio
export function useSoundEffects() {
  const isEnabled = ref(false) // Disabled for demo
  const masterVolume = ref(0.5)

  const playSound = (soundName: string) => {
    // Disabled for demo - just log
    console.log(`Sound effect: ${soundName} (disabled for demo)`)
  }

  const toggleSounds = () => {
    isEnabled.value = !isEnabled.value
    console.log(`Sound effects ${isEnabled.value ? 'enabled' : 'disabled'}`)
  }

  const setVolume = (volume: number) => {
    masterVolume.value = Math.max(0, Math.min(1, volume))
    console.log(`Volume set to: ${masterVolume.value}`)
  }

  return {
    playSound,
    toggleSounds,
    setVolume,
    masterVolume,
    isEnabled
  }
}