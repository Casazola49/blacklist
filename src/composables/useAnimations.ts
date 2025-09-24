import { ref, onMounted, onUnmounted } from 'vue'

export interface AnimationConfig {
  duration?: number
  delay?: number
  easing?: string
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  iterations?: number | 'infinite'
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both'
}

export interface GlitchConfig {
  intensity?: 'low' | 'medium' | 'high'
  frequency?: number
  duration?: number
  colors?: string[]
}

export interface TransitionConfig {
  type?: 'slide' | 'fade' | 'glitch' | 'matrix' | 'hologram'
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

export function useAnimations() {
  const isReducedMotion = ref(false)

  // Check for reduced motion preference
  const checkReducedMotion = () => {
    if (typeof window !== 'undefined') {
      isReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
  }

  onMounted(() => {
    checkReducedMotion()
    window.addEventListener('resize', checkReducedMotion)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', checkReducedMotion)
  })

  // Create entrance animation
  const createEntranceAnimation = (
    element: HTMLElement,
    type: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scaleIn' | 'glitchIn' = 'fadeIn',
    config: AnimationConfig = {}
  ) => {
    if (isReducedMotion.value) {
      element.style.opacity = '1'
      element.style.transform = 'none'
      return
    }

    const {
      duration = 600,
      delay = 0,
      easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
      fillMode = 'both'
    } = config

    const animations: Record<string, Keyframe[]> = {
      fadeIn: [
        { opacity: 0 },
        { opacity: 1 }
      ],
      slideUp: [
        { opacity: 0, transform: 'translateY(30px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      slideDown: [
        { opacity: 0, transform: 'translateY(-30px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      slideLeft: [
        { opacity: 0, transform: 'translateX(30px)' },
        { opacity: 1, transform: 'translateX(0)' }
      ],
      slideRight: [
        { opacity: 0, transform: 'translateX(-30px)' },
        { opacity: 1, transform: 'translateX(0)' }
      ],
      scaleIn: [
        { opacity: 0, transform: 'scale(0.8)' },
        { opacity: 1, transform: 'scale(1)' }
      ],
      glitchIn: [
        { opacity: 0, transform: 'translateX(-10px) skew(10deg)', filter: 'hue-rotate(90deg)' },
        { opacity: 0.7, transform: 'translateX(5px) skew(-5deg)', filter: 'hue-rotate(0deg)' },
        { opacity: 1, transform: 'translateX(0) skew(0deg)', filter: 'hue-rotate(0deg)' }
      ]
    }

    return element.animate(animations[type], {
      duration,
      delay,
      easing,
      fill: fillMode
    })
  }

  // Create exit animation
  const createExitAnimation = (
    element: HTMLElement,
    type: 'fadeOut' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scaleOut' | 'glitchOut' = 'fadeOut',
    config: AnimationConfig = {}
  ) => {
    if (isReducedMotion.value) {
      element.style.opacity = '0'
      return Promise.resolve()
    }

    const {
      duration = 400,
      delay = 0,
      easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
      fillMode = 'both'
    } = config

    const animations: Record<string, Keyframe[]> = {
      fadeOut: [
        { opacity: 1 },
        { opacity: 0 }
      ],
      slideUp: [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(-30px)' }
      ],
      slideDown: [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(30px)' }
      ],
      slideLeft: [
        { opacity: 1, transform: 'translateX(0)' },
        { opacity: 0, transform: 'translateX(-30px)' }
      ],
      slideRight: [
        { opacity: 1, transform: 'translateX(0)' },
        { opacity: 0, transform: 'translateX(30px)' }
      ],
      scaleOut: [
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(0.8)' }
      ],
      glitchOut: [
        { opacity: 1, transform: 'translateX(0) skew(0deg)', filter: 'hue-rotate(0deg)' },
        { opacity: 0.3, transform: 'translateX(-5px) skew(5deg)', filter: 'hue-rotate(90deg)' },
        { opacity: 0, transform: 'translateX(10px) skew(-10deg)', filter: 'hue-rotate(180deg)' }
      ]
    }

    const animation = element.animate(animations[type], {
      duration,
      delay,
      easing,
      fill: fillMode
    })

    return animation.finished
  }

  // Create glitch effect
  const createGlitchEffect = (
    element: HTMLElement,
    config: GlitchConfig = {}
  ) => {
    if (isReducedMotion.value) return

    const {
      intensity = 'medium',
      frequency = 0.1,
      duration = 200,
      colors = ['#00ffff', '#ff00ff', '#800020']
    } = config

    const intensityMap = {
      low: { maxOffset: 2, maxSkew: 1 },
      medium: { maxOffset: 4, maxSkew: 2 },
      high: { maxOffset: 8, maxSkew: 5 }
    }

    const { maxOffset, maxSkew } = intensityMap[intensity]

    const glitchFrames: Keyframe[] = []
    const steps = 10

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps
      const shouldGlitch = Math.random() < frequency

      if (shouldGlitch) {
        const offsetX = (Math.random() - 0.5) * maxOffset * 2
        const offsetY = (Math.random() - 0.5) * maxOffset * 2
        const skew = (Math.random() - 0.5) * maxSkew * 2
        const color = colors[Math.floor(Math.random() * colors.length)]

        glitchFrames.push({
          transform: `translate(${offsetX}px, ${offsetY}px) skew(${skew}deg)`,
          filter: `hue-rotate(${Math.random() * 360}deg) saturate(${1 + Math.random()})`,
          textShadow: `2px 0 ${color}, -2px 0 ${color}`,
          offset: progress
        })
      } else {
        glitchFrames.push({
          transform: 'translate(0, 0) skew(0deg)',
          filter: 'hue-rotate(0deg) saturate(1)',
          textShadow: 'none',
          offset: progress
        })
      }
    }

    return element.animate(glitchFrames, {
      duration,
      easing: 'steps(10, end)'
    })
  }

  // Create micro-interaction
  const createMicroInteraction = (
    element: HTMLElement,
    type: 'hover' | 'click' | 'focus' = 'hover'
  ) => {
    if (isReducedMotion.value) return

    const interactions = {
      hover: {
        enter: [
          { transform: 'scale(1) translateY(0)', boxShadow: '0 0 0 currentColor' },
          { transform: 'scale(1.02) translateY(-2px)', boxShadow: '0 0 20px currentColor' }
        ],
        leave: [
          { transform: 'scale(1.02) translateY(-2px)', boxShadow: '0 0 20px currentColor' },
          { transform: 'scale(1) translateY(0)', boxShadow: '0 0 0 currentColor' }
        ]
      },
      click: {
        frames: [
          { transform: 'scale(1)' },
          { transform: 'scale(0.95)' },
          { transform: 'scale(1.05)' },
          { transform: 'scale(1)' }
        ]
      },
      focus: {
        frames: [
          { boxShadow: '0 0 0 currentColor' },
          { boxShadow: '0 0 0 2px currentColor, 0 0 20px currentColor' }
        ]
      }
    }

    if (type === 'hover') {
      const handleMouseEnter = () => {
        element.animate(interactions.hover.enter, {
          duration: 200,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'forwards'
        })
      }

      const handleMouseLeave = () => {
        element.animate(interactions.hover.leave, {
          duration: 200,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'forwards'
        })
      }

      element.addEventListener('mouseenter', handleMouseEnter)
      element.addEventListener('mouseleave', handleMouseLeave)

      return () => {
        element.removeEventListener('mouseenter', handleMouseEnter)
        element.removeEventListener('mouseleave', handleMouseLeave)
      }
    } else if (type === 'click') {
      const handleClick = () => {
        element.animate(interactions.click.frames, {
          duration: 300,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        })
      }

      element.addEventListener('click', handleClick)
      return () => element.removeEventListener('click', handleClick)
    } else if (type === 'focus') {
      const handleFocus = () => {
        element.animate(interactions.focus.frames, {
          duration: 200,
          easing: 'ease-out',
          fill: 'forwards'
        })
      }

      const handleBlur = () => {
        element.animate([...interactions.focus.frames].reverse(), {
          duration: 200,
          easing: 'ease-in',
          fill: 'forwards'
        })
      }

      element.addEventListener('focus', handleFocus)
      element.addEventListener('blur', handleBlur)

      return () => {
        element.removeEventListener('focus', handleFocus)
        element.removeEventListener('blur', handleBlur)
      }
    }
  }

  return {
    isReducedMotion,
    createEntranceAnimation,
    createExitAnimation,
    createGlitchEffect,
    createMicroInteraction
  }
}