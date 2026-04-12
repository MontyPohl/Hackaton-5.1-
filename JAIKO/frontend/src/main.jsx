import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

// Línea eliminada: console.log("CLIENT ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID)
// Por qué: imprimía el Client ID de Google en la consola del navegador en
// producción, visible para cualquier usuario que abra las DevTools.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              borderRadius: '12px',
              background: '#1a0a00',
              color: '#fff7ed',
            },
          }}
        />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
)