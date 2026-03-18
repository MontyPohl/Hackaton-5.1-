import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Adjuntar JWT automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jaiko_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Manejar 401 globalmente
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('jaiko_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

/**
 * Trae roomies compatibles usando el endpoint de búsqueda real.
 * FIX: antes llamaba a /api/roomies que no existe.
 */
export async function getRoomies(city = 'Asunción') {
  try {
    const response = await api.get('/profiles/search', {
      params: { city, per_page: 100, page: 1 },
    })
    return (response.data.profiles || []).map((r) => ({
      id: r.user_id,
      lat: r.lat,
      lng: r.lng,
      profile: r,
      compatibility: r.compatibility,
      matches: r.matches || [],
      mismatches: r.mismatches || [],
    }))
  } catch (error) {
    console.error('Error al traer roomies:', error)
    return []
  }
}

/**
 * Actualiza el perfil del usuario autenticado.
 */
export async function updateProfile(data) {
  try {
    const response = await api.put('/profiles/me', data)
    return response.data
  } catch (err) {
    console.error('Error al actualizar perfil:', err)
    throw err
  }
}

export default api