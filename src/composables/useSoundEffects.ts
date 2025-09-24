import { ref, onMounted } from 'vue'

export interface SoundConfig {
  volume?: number
  playbackRate?: number
  loop?: boolean
}

export function useSoundEffects() {
  const isEnabled = ref(true)
  const masterVolume = ref(0.3)
  const audioContext = ref<AudioContext | null>(null)

  // Initialize audio context
  onMounted(() => {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      audioContext.value = new AudioContext()
    }
  })

  // Create synthetic sound using Web Audio API
  const createSyntheticSound = (
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    config: SoundConfig = {}
  ) => {
    if (!isEnabled.value || !audioContext.value) return

    const { volume = 0.1, playbackRate = 1 } = config

    const oscillator = audioContext.value.createOscillator()
    const gainNode = audioContext.value.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.value.destination)

    oscillator.frequency.setValueAtTime(frequency * playbackRate, audioContext.value.currentTime)
    oscillator.type = type

    // Create envelope for more natural sound
    gainNode.gain.setValueAtTime(0, audioContext.value.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume * masterVolume.value, audioContext.value.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.value.currentTime + duration)

    oscillator.start(audioContext.value.currentTime)
    oscillator.stop(audioContext.value.currentTime + duration)
  }

  // Create complex cyber sound
  const createCyberSound = (
    baseFreq: number,
    duration: number,
    complexity: 'simple' | 'medium' | 'complex' = 'medium'
  ) => {
    if (!isEnabled.value || !audioContext.value) return

    const complexityMap = {
      simple: 1,
      medium: 2,
      complex: 3
    }

    const layers = complexityMap[complexity]

    for (let i = 0; i < layers; i++) {
      const freq = baseFreq * (1 + i * 0.5)
      const vol = 0.05 / (i + 1)
      const delay = i * 0.02

      setTimeout(() => {
        createSyntheticSound(freq, duration, 'sawtooth', { volume: vol })
      }, delay * 1000)
    }
  }

  // Predefined sound effects
  const sounds = {
    // UI Interaction sounds
    hover: () => createSyntheticSound(800, 0.1, 'sine', { volume: 0.03 }),
    click: () => createCyberSound(400, 0.15, 'simple'),
    success: () => {
      createSyntheticSound(523, 0.1, 'sine', { volume: 0.05 })
      setTimeout(() => createSyntheticSound(659, 0.1, 'sine', { volume: 0.05 }), 100)
      setTimeout(() => createSyntheticSound(784, 0.2, 'sine', { volume: 0.05 }), 200)
    },
    error: () => {
      createSyntheticSound(200, 0.3, 'sawtooth', { volume: 0.08 })
      setTimeout(() => createSyntheticSound(150, 0.2, 'sawtooth', { volume: 0.06 }), 150)
    },
    notification: () => createCyberSound(600, 0.25, 'medium'),
    
    // Navigation sounds
    pageTransition: () => createCyberSound(300, 0.4, 'complex'),
    modalOpen: () => {
      createSyntheticSound(400, 0.1, 'triangle', { volume: 0.04 })
      setTimeout(() => createSyntheticSound(600, 0.15, 'sine', { volume: 0.03 }), 50)
    },
    modalClose: () => {
      createSyntheticSound(600, 0.1, 'sine', { volume: 0.03 })
      setTimeout(() => createSyntheticSound(400, 0.15, 'triangle', { volume: 0.04 }), 50)
    },
    
    // Action sounds
    upload: () => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          createSyntheticSound(400 + i * 100, 0.08, 'square', { volume: 0.02 })
        }, i * 50)
      }
    },
    download: () => {
      for (let i = 4; i >= 0; i--) {
        setTimeout(() => {
          createSyntheticSound(400 + i * 100, 0.08, 'square', { volume: 0.02 })
        }, (4 - i) * 50)
      }
    },
    message: () => createSyntheticSound(800, 0.12, 'sine', { volume: 0.04 }),
    
    // System sounds
    glitch: () => {
      const frequencies = [200, 300, 150, 400, 250]
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          createSyntheticSound(freq, 0.05, 'sawtooth', { volume: 0.03 })
        }, index * 20)
      })
    },
    scan: () => {
      createSyntheticSound(1000, 0.3, 'sine', { volume: 0.02 })
      setTimeout(() => createSyntheticSound(1200, 0.2, 'sine', { volume: 0.02 }), 100)
    },
    powerUp: () => {
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          createSyntheticSound(200 + i * 50, 0.05, 'sawtooth', { volume: 0.02 })
        }, i * 30)
      }
    },
    powerDown: () => {
      for (let i = 9; i >= 0; i--) {
        setTimeout(() => {
          createSyntheticSound(200 + i * 50, 0.05, 'sawtooth', { volume: 0.02 })
        }, (9 - i) * 30)
      }
    }
  }

  // Play sound by name
  const playSound = (soundName: keyof typeof sounds) => {
    if (!isEnabled.value) return
    
    try {
      sounds[soundName]()
    } catch (error) {
      console.warn(`Failed to play sound: ${soundName}`, error)
    }
  }

  // Toggle sound effects
  const toggleSounds = () => {
    isEnabled.value = !isEnabled.value
  }

  // Set master volume
  const setVolume = (volume: number) => {
    masterVolume.value = Math.max(0, Math.min(1, volume))
  }

  return {
    isEnabled,
    masterVolume,
    playSound,
    toggleSounds,
    setVolume,
    createSyntheticSound,
    createCyberSound
  }
}