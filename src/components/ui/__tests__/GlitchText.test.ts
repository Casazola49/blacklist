import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GlitchText from '../GlitchText.vue'

describe('GlitchText', () => {
  it('renders text content correctly', () => {
    const wrapper = mount(GlitchText, {
      props: {
        text: 'Glitch Effect'
      }
    })

    expect(wrapper.text()).toBe('Glitch Effect')
    expect(wrapper.classes()).toContain('glitch-text')
  })

  it('applies intensity prop correctly', () => {
    const wrapper = mount(GlitchText, {
      props: {
        text: 'High Intensity',
        intensity: 'high'
      }
    })

    expect(wrapper.classes()).toContain('glitch-text--high')
  })

  it('handles different animation speeds', () => {
    const wrapper = mount(GlitchText, {
      props: {
        text: 'Fast Animation',
        speed: 'fast'
      }
    })

    expect(wrapper.classes()).toContain('glitch-text--fast')
  })

  it('can be disabled', () => {
    const wrapper = mount(GlitchText, {
      props: {
        text: 'No Glitch',
        disabled: true
      }
    })

    expect(wrapper.classes()).toContain('glitch-text--disabled')
  })

  it('applies custom color correctly', () => {
    const wrapper = mount(GlitchText, {
      props: {
        text: 'Custom Color',
        color: 'cyan'
      }
    })

    expect(wrapper.classes()).toContain('glitch-text--cyan')
  })

  it('handles trigger prop for controlled animation', async () => {
    const wrapper = mount(GlitchText, {
      props: {
        text: 'Triggered Glitch',
        trigger: false
      }
    })

    expect(wrapper.classes()).not.toContain('glitch-text--active')

    await wrapper.setProps({ trigger: true })
    expect(wrapper.classes()).toContain('glitch-text--active')
  })

  it('emits animation events', async () => {
    const wrapper = mount(GlitchText, {
      props: {
        text: 'Event Test'
      }
    })

    // Simulate animation start
    await wrapper.find('.glitch-text').trigger('animationstart')
    expect(wrapper.emitted('animation-start')).toBeTruthy()

    // Simulate animation end
    await wrapper.find('.glitch-text').trigger('animationend')
    expect(wrapper.emitted('animation-end')).toBeTruthy()
  })
})