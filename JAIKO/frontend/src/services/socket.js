import { io } from 'socket.io-client'

let socket = null

export const connectSocket = () => {
  const token = localStorage.getItem('jaiko_token')
  if (!token || socket?.connected) return

  socket = io('/', {
    query: { token },
    transports: ['websocket'],
    reconnectionAttempts: 5,
  })

  socket.on('connect', () => console.log('🟢 Socket connected'))
  socket.on('disconnect', () => console.log('🔴 Socket disconnected'))
  socket.on('connect_error', (e) => console.error('Socket error:', e.message))

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  socket?.disconnect()
  socket = null
}
