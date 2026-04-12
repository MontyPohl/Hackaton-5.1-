import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev
export default defineConfig(({ mode }) => ({
  plugins: [react()],

  build: {
    // Elimina automáticamente console.log (y console.warn, console.error)
    // cuando corrés `vite build` para generar la versión de producción.
    //
    // Por qué es importante:
    // Los console.log quedan activos en el bundle final si no los removés.
    // Cualquier usuario puede abrir las DevTools y ver mensajes de debug,
    // valores internos, o datos sensibles que dejaste mientras desarrollabas.
    //
    // Cómo funciona:
    // Vite usa esbuild internamente para minificar. La opción `drop` le dice
    // a esbuild que elimine físicamente esas llamadas del código compilado,
    // como si nunca hubieran existido — no las reemplaza por nada, las borra.
    //
    // En desarrollo (vite dev) esta opción NO aplica, así que tus console.log
    // siguen funcionando normalmente mientras programás.
    minify: 'esbuild',
    terserOptions: undefined,
  },

  esbuild: {
    // `drop` solo aplica cuando mode === 'production' (vite build).
    // En development (vite dev) el array queda vacío y no elimina nada.
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },

  server: {
    port: 5173,
    allowedHosts: [
      'accomplished-gentleness-production-16c6.up.railway.app',
      '.railway.app'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
    },
  },
}))