import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { toast } from 'react-hot-toast'
import useAuthStore from '../context/authStore'

export default function LoginPage() {
  const { loginWithGoogle, isAuthenticated, loading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated()) navigate('/', { replace: true })
  }, [])

  const handleSuccess = async (credentialResponse) => {
    const result = await loginWithGoogle(credentialResponse.credential)
    if (result.success) {
      toast.success('¡Bienvenido a JAIKO!')
      navigate(result.isNewUser ? '/profile/edit' : '/', { replace: true })
    } else {
      toast.error(result.error || 'Error al iniciar sesión')
    }
  }

  return (
    <div className="min-h-dvh bg-brand-dark flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-primary-700/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-10 text-center shadow-2xl">
          {/* Logo */}
          <div className="font-display font-extrabold text-5xl text-primary-400 mb-2">
            JAIKO<span className="text-white">!</span>
          </div>
          <p className="text-orange-300 text-sm mb-8 font-light">
            La plataforma para encontrar roomies en Paraguay 🇵🇾
          </p>

          <div className="flex flex-col items-center gap-4">
            <p className="text-orange-200 text-sm">Ingresá con tu cuenta de Google</p>

            {loading ? (
              <div className="w-8 h-8 border-4 border-primary-300 border-t-primary-500 rounded-full animate-spin" />
            ) : (
              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={() => toast.error('Error con Google. Intentá de nuevo.')}
                  theme="filled_black"
                  shape="rectangular"
                  size="large"
                  width="300"
                  text="continue_with"
                  locale="es"
                />
              </div>
            )}
          </div>

          <p className="text-orange-400/60 text-xs mt-8 leading-relaxed">
            Al ingresar aceptás nuestros Términos de Uso y Política de Privacidad.
            Tu información está protegida.
          </p>
        </div>

        <p className="text-center text-orange-400/40 text-xs mt-6">
          © {new Date().getFullYear()} JAIKO! – Solo en Paraguay
        </p>
      </div>
    </div>
  )
}
