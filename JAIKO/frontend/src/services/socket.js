import { io } from 'socket.io-client'

let socket = null
const connectListeners = new Set()

export const connectSocket = () => {
  const token = localStorage.getItem('jaiko_token')
  if (!token || socket?.connected) return

  socket = io('/', {
    query: { token },
    transports: ['websocket'],
    reconnectionAttempts: 5,
  })

  socket.on('connect', () => {
    console.log('🟢 Socket connected')
    connectListeners.forEach(fn => fn(socket))
  })
  socket.on('disconnect', () => console.log('🔴 Socket disconnected'))
  socket.on('connect_error', (e) => console.error('Socket error:', e.message))

  return socket
}

export const getSocket = () => socket

/** Subscribe to socket-ready event. Returns an unsubscribe function. */
export const onSocketConnect = (fn) => {
  connectListeners.add(fn)
  return () => connectListeners.delete(fn)
}

export const disconnectSocket = () => {
  socket?.disconnect()
  socket = null
}
