import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons broken by webpack/vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Orange custom marker
const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

function FlyTo({ center }) {
  const map = useMap()
  useEffect(() => { if (center) map.flyTo(center, 14, { duration: 1 }) }, [center])
  return null
}

/**
 * Props:
 *  center   – [lat, lng]       (default: Asunción)
 *  markers  – [{ lat, lng, title, description, link }]
 *  height   – string CSS height (default: '400px')
 *  flyTo    – [lat, lng] | null
 */
export default function JaikoMap({
  center = [-25.2867, -57.647],
  markers = [],
  height = '400px',
  flyTo = null,
}) {
  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height, width: '100%', borderRadius: '16px' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {flyTo && <FlyTo center={flyTo} />}
      {markers.map((m, i) => (
        <Marker key={i} position={[m.lat, m.lng]} icon={orangeIcon}>
          <Popup>
            <div className="font-body">
              <strong className="font-display">{m.title}</strong>
              {m.description && <p className="text-xs text-gray-500 mt-1">{m.description}</p>}
              {m.link && (
                <a href={m.link} className="text-xs text-primary-600 underline mt-1 block">
                  Ver detalle →
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
