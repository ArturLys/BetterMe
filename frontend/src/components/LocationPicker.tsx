import { useState, useRef, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const NYC: [number, number] = [40.7128, -74.006]

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`, {
      headers: { 'Accept-Language': 'en' },
    })
    const data = await res.json()
    if (!data.address) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    const { road, house_number, city, town, village, state } = data.address
    return [house_number, road, city || town || village, state].filter(Boolean).join(', ')
  } catch {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
  }
}

async function searchAddress(query: string) {
  if (query.length < 3) return []
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&viewbox=-80,45,-71,40&bounded=1`,
    { headers: { 'Accept-Language': 'en' } }
  )
  return res.json() as Promise<Array<{ display_name: string; lat: string; lon: string }>>
}

function ClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onSelect(e.latlng.lat, e.latlng.lng) })
  return null
}

function FlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo(position, 15, { duration: 1 })
  }, [position, map])
  return null
}

interface LocationPickerProps {
  latitude: string
  longitude: string
  onChange: (lat: string, lon: string) => void
  compact?: boolean // smaller height for dialogs
}

export default function LocationPicker({ latitude, longitude, onChange, compact }: LocationPickerProps) {
  const [addressQuery, setAddressQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [locationDisplay, setLocationDisplay] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const markerPos: [number, number] | null = latitude && longitude ? [parseFloat(latitude), parseFloat(longitude)] : null

  // Close suggestions on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // If initial coords exist, reverse geocode on mount
  useEffect(() => {
    if (latitude && longitude && !locationDisplay) {
      reverseGeocode(parseFloat(latitude), parseFloat(longitude)).then((name) => {
        setLocationDisplay(name)
        setAddressQuery(name)
        setConfirmed(true)
      })
    }
  }, []) // only on mount

  const handleAddressInput = useCallback((value: string) => {
    setAddressQuery(value)
    setConfirmed(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const results = await searchAddress(value)
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
    }, 350)
  }, [])

  const handleSuggestionPick = (s: { display_name: string; lat: string; lon: string }) => {
    onChange(s.lat, s.lon)
    setLocationDisplay(s.display_name)
    setAddressQuery(s.display_name)
    setShowSuggestions(false)
    setConfirmed(false)
  }

  const handleMapClick = async (lat: number, lng: number) => {
    onChange(lat.toFixed(6), lng.toFixed(6))
    setConfirmed(false)
    setLocationDisplay('...')
    const name = await reverseGeocode(lat, lng)
    setLocationDisplay(name)
    setAddressQuery(name)
  }

  return (
    <div className='space-y-3'>
      {/* Search */}
      <div className='relative' ref={suggestionsRef}>
        <Label className='text-xs mb-1 block'>📍 Location</Label>
        <Input
          placeholder='Search address or click on map...'
          value={addressQuery}
          onChange={(e) => handleAddressInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />
        {showSuggestions && (
          <div className='absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border bg-popover shadow-lg max-h-40 overflow-y-auto animate-[fadeIn_0.15s]'>
            {suggestions.map((s, i) => (
              <button
                key={i}
                type='button'
                onClick={() => handleSuggestionPick(s)}
                className='w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors border-b border-border/50 last:border-0'
              >
                📍 {s.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className={`rounded-lg overflow-hidden border ${compact ? 'h-48' : 'h-64'}`}>
        <MapContainer center={markerPos || NYC} zoom={markerPos ? 14 : 11} style={{ height: '100%', width: '100%' }} className='z-0'>
          <TileLayer attribution='&copy; OpenStreetMap' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
          <ClickHandler onSelect={handleMapClick} />
          <FlyTo position={markerPos} />
          {markerPos && <Marker position={markerPos} />}
        </MapContainer>
      </div>

      {/* Confirm */}
      {locationDisplay && (
        <div className={`rounded-lg border p-3 transition-all ${confirmed ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border bg-muted/30'}`}>
          <div className='flex items-start justify-between gap-2'>
            <div className='flex-1 min-w-0'>
              <p className='text-xs text-muted-foreground'>Delivery to:</p>
              <p className='text-sm font-medium truncate'>{locationDisplay}</p>
            </div>
            {!confirmed ? (
              <Button
                type='button'
                size='sm'
                onClick={() => setConfirmed(true)}
                className='shrink-0 bg-linear-to-r from-emerald-600 to-teal-600 text-white text-xs'
              >
                ✓ Confirm
              </Button>
            ) : (
              <span className='text-emerald-500 text-sm font-medium flex items-center gap-1'>
                <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2.5}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                </svg>
                OK
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function isLocationConfirmed(display: string) {
  return display.length > 0
}
