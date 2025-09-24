// Export all UI components for easy importing
import NeonButton from './NeonButton.vue'
import GlitchText from './GlitchText.vue'
import HologramCard from './HologramCard.vue'
import CyberLoader from './CyberLoader.vue'
import RadialProgress from './RadialProgress.vue'
import AnimatedCounter from './AnimatedCounter.vue'
import NotificationCenter from './NotificationCenter.vue'
import NotificationPreferences from './NotificationPreferences.vue'
import ToggleSwitch from './ToggleSwitch.vue'
import NotificationPreferenceItem from './NotificationPreferenceItem.vue'
import AnimatedEntrance from './AnimatedEntrance.vue'
import GlitchEffect from './GlitchEffect.vue'
import InteractiveElement from './InteractiveElement.vue'
import PageTransition from './PageTransition.vue'

export {
  NeonButton,
  GlitchText,
  HologramCard,
  CyberLoader,
  RadialProgress,
  AnimatedCounter,
  NotificationCenter,
  NotificationPreferences,
  ToggleSwitch,
  NotificationPreferenceItem,
  AnimatedEntrance,
  GlitchEffect,
  InteractiveElement,
  PageTransition
}

// Type definitions for component props
export interface NeonButtonProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost'
  loading?: boolean
  disabled?: boolean
  pulse?: boolean
}

export interface GlitchTextProps {
  text: string
  active?: boolean
  typing?: boolean
  intense?: boolean
  variant?: 'primary' | 'secondary' | 'accent'
  size?: string
  showScanLines?: boolean
  typingSpeed?: number
}

export interface HologramCardProps {
  variant?: 'primary' | 'secondary' | 'accent'
  active?: boolean
  showParticles?: boolean
  intensity?: number
}

export interface CyberLoaderProps {
  size?: 'small' | 'medium' | 'large' | 'xl'
  text?: string
  variant?: 'primary' | 'secondary' | 'accent'
  pulsing?: boolean
  showProgress?: boolean
  progress?: number
  segmentCount?: number
}

export interface RadialProgressProps {
  value: number
  max?: number
  size?: 'small' | 'medium' | 'large' | 'xl'
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error'
  strokeWidth?: number
  animated?: boolean
  showGlow?: boolean
  showParticles?: boolean
  showUnit?: boolean
  unit?: string
  duration?: number
}

export interface AnimatedCounterProps {
  target: number
  duration?: number
  startValue?: number
  decimals?: number
  separator?: string
  prefix?: string
  suffix?: string
}

export interface AnimatedEntranceProps {
  animation?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scaleIn' | 'glitchIn'
  delay?: number
  duration?: number
  threshold?: number
  triggerOnce?: boolean
  stagger?: number
  staggerChildren?: boolean
}

export interface GlitchEffectProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger'
  intensity?: 'low' | 'medium' | 'high' | 'extreme'
  continuous?: boolean
  hoverTrigger?: boolean
  clickTrigger?: boolean
  duration?: number
  frequency?: number
  showScanLines?: boolean
  showNoise?: boolean
  showRgbSplit?: boolean
  scanLineCount?: number
  enableSound?: boolean
}

export interface InteractiveElementProps {
  tag?: string
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost'
  disabled?: boolean
  showScanLine?: boolean
  showGlow?: boolean
  showRipple?: boolean
  enableGlitch?: boolean
  enableSounds?: boolean
  glitchIntensity?: 'low' | 'medium' | 'high'
  hoverScale?: number
  clickScale?: number
}

export interface PageTransitionProps {
  type?: 'slide' | 'fade' | 'glitch' | 'matrix' | 'hologram' | 'cyber'
  direction?: 'up' | 'down' | 'left' | 'right'
  duration?: number
  mode?: 'in-out' | 'out-in' | 'default'
  appear?: boolean
  playSound?: boolean
}