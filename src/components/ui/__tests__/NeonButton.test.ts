import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NeonButton from '../NeonButton.vue'

describe('NeonButton', () => {
  it('renders with default props', () => {
    const wrapper = mount(NeonButton, {
      slots: {
        default: 'Click me'
      }
    })

    expect(wrapper.text()).toBe('Click me')
    expect(wrapper.classes()).toContain('neon-button')
  })

  it('applies variant classes correctly', () => {
    const wrapper = mount(NeonButton, {
      props: {
        variant: 'primary'
      },
      slots: {
        default: 'Primary Button'
      }
    })

    expect(wrapper.classes()).toContain('neon-button--primary')
  })

  it('applies size classes correctly', () => {
    const wrapper = mount(NeonButton, {
      props: {
        size: 'large'
      },
      slots: {
        default: 'Large Button'
      }
    })

    expect(wrapper.classes()).toContain('neon-button--large')
  })

  it('handles disabled state', () => {
    const wrapper = mount(NeonButton, {
      props: {
        disabled: true
      },
      slots: {
        default: 'Disabled Button'
      }
    })

    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('neon-button--disabled')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(NeonButton, {
      slots: {
        default: 'Click me'
      }
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(NeonButton, {
      props: {
        disabled: true
      },
      slots: {
        default: 'Disabled Button'
      }
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('shows loading state correctly', () => {
    const wrapper = mount(NeonButton, {
      props: {
        loading: true
      },
      slots: {
        default: 'Loading Button'
      }
    })

    expect(wrapper.classes()).toContain('neon-button--loading')
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('applies glow effect on hover', async () => {
    const wrapper = mount(NeonButton, {
      props: {
        glow: true
      },
      slots: {
        default: 'Glow Button'
      }
    })

    expect(wrapper.classes()).toContain('neon-button--glow')
  })
})