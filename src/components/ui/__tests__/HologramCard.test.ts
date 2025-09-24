import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import HologramCard from '../HologramCard.vue'

describe('HologramCard', () => {
  it('renders with default props', () => {
    const wrapper = mount(HologramCard, {
      slots: {
        default: '<div>Card Content</div>'
      }
    })

    expect(wrapper.text()).toContain('Card Content')
    expect(wrapper.classes()).toContain('hologram-card')
  })

  it('applies elevation correctly', () => {
    const wrapper = mount(HologramCard, {
      props: {
        elevation: 3
      },
      slots: {
        default: 'Elevated Card'
      }
    })

    expect(wrapper.classes()).toContain('hologram-card--elevation-3')
  })

  it('handles hover effects', async () => {
    const wrapper = mount(HologramCard, {
      props: {
        hover: true
      },
      slots: {
        default: 'Hover Card'
      }
    })

    expect(wrapper.classes()).toContain('hologram-card--hover')

    await wrapper.trigger('mouseenter')
    expect(wrapper.classes()).toContain('hologram-card--hovered')

    await wrapper.trigger('mouseleave')
    expect(wrapper.classes()).not.toContain('hologram-card--hovered')
  })

  it('applies glow effect when specified', () => {
    const wrapper = mount(HologramCard, {
      props: {
        glow: true,
        glowColor: 'cyan'
      },
      slots: {
        default: 'Glowing Card'
      }
    })

    expect(wrapper.classes()).toContain('hologram-card--glow')
    expect(wrapper.classes()).toContain('hologram-card--glow-cyan')
  })

  it('handles click events', async () => {
    const wrapper = mount(HologramCard, {
      props: {
        clickable: true
      },
      slots: {
        default: 'Clickable Card'
      }
    })

    expect(wrapper.classes()).toContain('hologram-card--clickable')

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('applies loading state correctly', () => {
    const wrapper = mount(HologramCard, {
      props: {
        loading: true
      },
      slots: {
        default: 'Loading Card'
      }
    })

    expect(wrapper.classes()).toContain('hologram-card--loading')
    expect(wrapper.find('.hologram-card__loader')).toBeTruthy()
  })

  it('handles different variants', () => {
    const wrapper = mount(HologramCard, {
      props: {
        variant: 'outlined'
      },
      slots: {
        default: 'Outlined Card'
      }
    })

    expect(wrapper.classes()).toContain('hologram-card--outlined')
  })

  it('supports custom animations', () => {
    const wrapper = mount(HologramCard, {
      props: {
        animation: 'pulse'
      },
      slots: {
        default: 'Animated Card'
      }
    })

    expect(wrapper.classes()).toContain('hologram-card--pulse')
  })
})