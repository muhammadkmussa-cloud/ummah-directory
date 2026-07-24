import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapProps {
  latitude: number
  longitude: number
  name?: string
  className?: string
}

export default function Map({ latitude, longitude, name, className = 'h-64' }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current).setView([latitude, longitude], 15)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup(name || '')

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [latitude, longitude, name])

  return <div ref={mapRef} className={`${className} rounded-lg z-0`} />
}
