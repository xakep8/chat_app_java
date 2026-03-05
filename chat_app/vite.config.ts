import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      global: 'window',
    },
    plugins: [react()],
    server: {
      proxy: {
        '/auth': {
          target: env.VITE_API_ENDPOINT || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
        '/users': {
          target: env.VITE_API_ENDPOINT || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
        '/chats': {
          target: env.VITE_API_ENDPOINT || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
        '/messages': {
          target: env.VITE_API_ENDPOINT || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: env.VITE_API_ENDPOINT || 'http://localhost:8080',
          ws: true,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})
