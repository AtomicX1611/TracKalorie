import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  if (!env.VITE_API_URL) {
    throw new Error('VITE_API_URL must be configured before starting or building the client')
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
    },
  }
})
