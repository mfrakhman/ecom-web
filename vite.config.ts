import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/local': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/local/, '/api'),
      },
      '/api': {
        target: 'https://api.mfrakhman.web.id',
        changeOrigin: true,
      },
    },
  },
})
