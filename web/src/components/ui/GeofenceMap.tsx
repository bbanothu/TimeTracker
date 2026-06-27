import { useEffect } from 'react';
import { Circle, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';

import type { Geofence } from '@/types';

import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER: [number, number] = [37.78825, -122.4324];
const DEFAULT_ZOOM = 13;

interface GeofenceMapProps {
  geofences: Geofence[];
  draftLat: number | null;
  draftLng: number | null;
  radiusMeters: number;
  primaryColor: string;
  disabledColor: string;
  center: [number, number];
  onMapClick: (latitude: number, longitude: number) => void;
  className?: string;
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);

  return null;
}

export function GeofenceMap({
  geofences,
  draftLat,
  draftLng,
  radiusMeters,
  primaryColor,
  disabledColor,
  center,
  onMapClick,
  className = '',
}: GeofenceMapProps) {
  const hasDraft = draftLat != null && draftLng != null;
  const draftRadius = Math.max(25, Number(radiusMeters) || 150);

  return (
    <div className={`overflow-hidden rounded-xl ${className}`}>
      <MapContainer center={center} zoom={DEFAULT_ZOOM} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter center={center} zoom={DEFAULT_ZOOM} />
        <MapClickHandler onMapClick={onMapClick} />

        {geofences.map((geofence) => {
          const color = geofence.tag?.color ?? primaryColor;
          return (
            <Circle
              key={geofence.id}
              center={[geofence.latitude, geofence.longitude]}
              radius={geofence.radiusMeters}
              pathOptions={{
                color: geofence.enabled ? color : disabledColor,
                fillColor: color,
                fillOpacity: geofence.enabled ? 0.22 : 0.1,
                weight: 2,
              }}
            />
          );
        })}

        {hasDraft ? (
          <Circle
            center={[draftLat, draftLng]}
            radius={draftRadius}
            pathOptions={{
              color: primaryColor,
              fillColor: primaryColor,
              fillOpacity: 0.18,
              weight: 2,
              dashArray: '6 4',
            }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}

export { DEFAULT_CENTER };
