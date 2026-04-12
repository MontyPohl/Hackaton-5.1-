import { create } from 'zustand'
import api from '../services/api'
import { connectSocket, disconnectSocket } from '../services/socket'

/**
 * Decodifica el payload del JWT y devuelve true si el token ya expiró.
 *
 * Por qué existe esta función:
 * Un JWT tiene tres partes separadas por puntos: header.payload.firma
 * El payload está codificado en Base64 y contiene el campo 'exp'
 * (timestamp Unix en segundos) que indica cuándo vence el token.
 * Antes, isAuthenticated() solo verificaba si el token existía en
 * localStorage, pero no si seguía siendo válido — un token expirado
 * pasaba el check y el usuario veía la app hasta que hacía una petición
 * y recibía un 401 inesperado.
 */
function isTokenExpired(token) {
  try {
    // El payload es la segunda parte del JWT, codificada en Base64
    const payload = JSON.parse(atob(token.split('.')[1]))
    // exp está en segundos, Date.now() en milisegundos
    return payload.exp * 1000 < Date.now()
  } catch {
    // Si no se puede decodificar, lo tratamos como expirado por seguridad
    return true
  }
}

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  token: localStorage.getItem('jaiko_token') || null,
  loading: false,
  isNewUser: false,

  // ── Registro con email + contraseña + nombre + CAPTCHA ──────────────────────
  register: async ({ name, email, password, captcha_token }) => {
    set({ loading: true })
    try {
      const { data } = await api.post('/auth/register', {
        name,
        email,
        password,
        captcha_token
      })
      localStorage.setItem('jaiko_token', data.access_token)
      set({
        token: data.access_token,
        user: data.user,
        profile: data.profile || null,
        loading: false,
      })
      connectSocket()
      return { success: true }
    } catch (err) {
      set({ loading: false })
      return { success: false, error: err.response?.data?.error }
    }
  },

  // ── Login con email + contraseña ──────────────────────────────────────────
  login: async ({ email, password }) => {
    set({ loading: true })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('jaiko_token', data.access_token)
      set({
        token: data.access_token,
        user: data.user,
        profile: data.profile || null,
        loading: false,
      })
      connectSocket()
      return { success: true, role: data.user?.role }
    } catch (err) {
      set({ loading: false })
      return { success: false, error: err.response?.data?.error }
    }
  },

  // ── Login con Google ───────────────────────────────────────────────────────
  loginWithGoogle: async (idToken) => {
    set({ loading: true })
    try {
      const { data } = await api.post('/auth/google', { id_token: idToken })
      localStorage.setItem('jaiko_token', data.access_token)
      set({
        token: data.access_token,
        user: data.user,
        profile: data.profile,
        isNewUser: data.is_new_user,
        loading: false,
      })
      connectSocket()
      return { success: true, isNewUser: data.is_new_user, role: data.user?.role }
    } catch (err) {
      set({ loading: false })
      return { success: false, error: err.response?.data?.error }
    }
  },

  // ── Verificar sesión activa al recargar la página ─────────────────────────
  fetchMe: async () => {
    const { token } = get()

    // Si el token ya expiró localmente, limpiamos sin hacer petición al servidor.
    // Beneficio para el usuario: no ve un flash de contenido autenticado antes
    // de recibir el 401 — la app arranca directamente en estado "no logueado".
    if (token && isTokenExpired(token)) {
      localStorage.removeItem('jaiko_token')
      set({ token: null, user: null, profile: null, loading: false })
      return
    }

    set({ loading: true })
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data.user, profile: data.profile, loading: false })
      connectSocket()
    } catch {
      // El interceptor de api.js ya maneja el 401 (limpia token y redirige),
      // así que aquí solo limpiamos el estado de loading.
      set({ loading: false })
      localStorage.removeItem('jaiko_token')
    }
  },

  updateProfile: (profile) => set({ profile }),

  // ── Logout ─────────────────────────────────────────────────────────────────
  // Notificamos al backend para que anote el token en la lista negra (blocklist).
  // Si la petición falla (ej: sin internet), igualmente limpiamos el estado
  // local — el usuario queda deslogueado en el frontend aunque el token no
  // haya sido invalidado en el servidor (vence solo en 7 días máximo).
  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Silencioso: el logout local siempre procede aunque falle el servidor
    } finally {
      localStorage.removeItem('jaiko_token')
      disconnectSocket()
      set({ user: null, profile: null, token: null })
    }
  },

  // ── Helpers de estado ─────────────────────────────────────────────────────
  isAuthenticated: () => {
    const token = get().token
    if (!token) return false

    // CORRECCIÓN: verificar expiración además de existencia.
    // Si el token expiró, lo limpiamos y retornamos false.
    if (isTokenExpired(token)) {
      localStorage.removeItem('jaiko_token')
      set({ token: null, user: null, profile: null })
      return false
    }

    return true
  },

  isAdmin: () => get().user?.role === 'admin',
  isVerifier: () => ['admin', 'verifier'].includes(get().user?.role),
}))

export default useAuthStore