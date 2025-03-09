import { defineVitestConfig } from '@nuxt/test-utils/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineVitestConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    exclude: ['**/node_modules/**'],
    deps: {
      optimizer: {
        web: {
          include: ['@nuxt/test-utils']
        }
      }
    },
    environmentOptions: {
      // Set mock environment variables for testing
      env: {
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_KEY: 'mock-anon-key'
      }
    }
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./', import.meta.url)),
      '@': fileURLToPath(new URL('./', import.meta.url))
    },
    conditions: ['development', 'browser']
  }
})