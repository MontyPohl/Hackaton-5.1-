import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="font-display font-extrabold text-9xl text-primary-200 leading-none mb-4">404</div>
      <h1 className="font-display font-bold text-3xl mb-3">Página no encontrada</h1>
      <p className="text-orange-400 mb-8 max-w-sm">
        La página que buscás no existe o fue movida.
      </p>
      <Link to="/" className="btn-primary">Volver al inicio</Link>
    </div>
  )
}
