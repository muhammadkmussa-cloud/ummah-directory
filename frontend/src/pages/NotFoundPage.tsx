import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <p className="text-lg text-gray-600 mb-6">Page not found</p>
      <div className="flex gap-3">
        <Link to="/" className="btn-primary">Go Home</Link>
        <Link to="/search" className="btn-outline">Search</Link>
      </div>
    </div>
  )
}
