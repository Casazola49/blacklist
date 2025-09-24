/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary background colors
        'bg-primary': '#0a0a0a',
        'bg-secondary': '#1a1a1a',
        'bg-tertiary': '#2a2a2a',
        
        // Brand colors
        'brand-primary': '#800020',
        'brand-secondary': '#a00030',
        
        // Accent colors
        'accent-cyan': '#00ffff',
        'accent-magenta': '#ff00ff',
        
        // Text colors
        'text-primary': '#eaeaea',
        'text-secondary': '#cccccc',
        'text-muted': '#888888',
        
        // State colors
        'success': '#00ff88',
        'warning': '#ffaa00',
        'error': '#ff3366',
        'info': '#3366ff',
        
        // Aliases for easier use
        'primary': '#0a0a0a',
        'secondary': '#cccccc',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'monospace'],
        'mono': ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px #00ffff',
        'glow-magenta': '0 0 20px #ff00ff',
        'glow-brand': '0 0 20px #800020',
        'neon': '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor',
      },
      animation: {
        'glitch': 'glitch 2s infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite alternate',
        'scan': 'scan 2s infinite',
      },
      keyframes: {
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        'pulse-glow': {
          'from': { boxShadow: '0 0 5px currentColor' },
          'to': { boxShadow: '0 0 20px currentColor, 0 0 30px currentColor' },
        },
        scan: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(200px)', opacity: '0' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}