/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  const isProduction = mode === 'production'
  const isStaging = mode === 'staging'
  const isDevelopment = mode === 'development'

  return {
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      },
      manifest: {
        name: 'The Blacklist - Marketplace Académico de Élite',
        short_name: 'The Blacklist',
        description: 'Marketplace exclusivo que conecta estudiantes con académicos de élite',
        theme_color: '#800020',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        lang: 'es',
        categories: ['education', 'productivity', 'business'],
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'Acceder al dashboard principal',
            url: '/dashboard',
            icons: [{ src: '/icon-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Nuevo Contrato',
            short_name: 'Contrato',
            description: 'Crear nuevo contrato',
            url: '/dashboard/contratos/nuevo',
            icons: [{ src: '/icon-192x192.png', sizes: '192x192' }]
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  server: {
    port: 3000,
    host: true
  },
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    sourcemap: !isProduction,
    minify: isProduction ? 'terser' : false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Firebase chunk
          if (id.includes('firebase')) {
            return 'firebase'
          }
          // Vue ecosystem chunk
          if (id.includes('vue') || id.includes('pinia') || id.includes('@vue')) {
            return 'vue-vendor'
          }
          // UI components chunk
          if (id.includes('src/components/ui')) {
            return 'ui-components'
          }
          // Landing page chunk
          if (id.includes('src/components/landing') || id.includes('src/views/Landing')) {
            return 'landing'
          }
          // Dashboard chunks
          if (id.includes('src/components/dashboard') || id.includes('src/views/Dashboard')) {
            return 'dashboard'
          }
          // Animation and effects chunk
          if (id.includes('src/composables/useAnimations') || id.includes('src/composables/useGlobalAnimations')) {
            return 'animations'
          }
          // Node modules vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk'
          return `js/[name]-[hash].js`
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(css)$/.test(assetInfo.name)) {
            return `css/[name]-[hash].${ext}`
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `img/[name]-[hash].${ext}`
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `fonts/[name]-[hash].${ext}`
          }
          return `assets/[name]-[hash].${ext}`
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: isProduction,
        drop_debugger: isProduction
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true
  },
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
    __APP_ENVIRONMENT__: JSON.stringify(mode),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
  }
})