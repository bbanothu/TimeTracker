import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';

import { createHeatLayer } from '@/lib/paddedHeatLayer';
import type { HeatmapPoint } from '@/utils/heatmapPoints';

import 'leaflet/dist/leaflet.css';

const DEFAULT_ZOOM = 11;

/** Google-style density heat: translucent green halos → yellow → orange → solid red cores. */
const HEAT_GRADIENT: Record<number, string> = {
  0.0: 'rgba(0, 255, 0, 0)',
  0.08: 'rgba(50, 205, 50, 0.35)',
  0.22: 'rgba(50, 205, 50, 0.65)',
  0.38: 'rgba(255, 255, 0, 0.75)',
  0.52: 'rgba(255, 200, 0, 0.82)',
  0.65: 'rgba(255, 140, 0, 0.88)',
  0.78: 'rgba(255, 80, 0, 0.94)',
  0.9: 'rgba(255, 0, 0, 0.98)',
  1.0: '#ff0000',
};

function heatOptions(points: HeatmapPoint[], zoom: number) {
  const maxIntensity = Math.max(...points.map((point) => point[2]), 1);
  const zoomFactor = Math.max(0.95, Math.min(1.25, (14 - zoom) * 0.1 + 1));

  return {
    radius: Math.round(58 * zoomFactor),
    blur: Math.round(42 * zoomFactor),
    max: maxIntensity * 0.72,
    minOpacity: 0.48,
    maxZoom: 18,
    gradient: HEAT_GRADIENT,
  };
}

interface HeatmapMapProps {
  points: HeatmapPoint[];
  center: [number, number];
  className?: string;
}

function HeatLayer({ points }: { points: HeatmapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;

    let layer = createHeatLayer(points, heatOptions(points, map.getZoom()));
    layer.addTo(map);

    const bounds = L.latLngBounds(points.map(([lat, lng]) => [lat, lng] as [number, number]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [64, 64], maxZoom: 13 });
    }

    const refreshLayer = () => {
      map.removeLayer(layer);
      layer = createHeatLayer(points, heatOptions(points, map.getZoom()));
      layer.addTo(map);
    };

    map.on('zoomend', refreshLayer);

    return () => {
      map.off('zoomend', refreshLayer);
      map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
}

function MapRecenter({
  center,
  zoom,
  hasPoints,
}: {
  center: [number, number];
  zoom: number;
  hasPoints: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (hasPoints) return;
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, hasPoints, map]);

  return null;
}

export function HeatmapMap({ points, center, className = '' }: HeatmapMapProps) {
  const hasPoints = points.length > 0;
  const mapCenter = useMemo(
    () => (hasPoints ? (points[0].slice(0, 2) as [number, number]) : center),
    [hasPoints, points, center],
  );

  return (
    <div className={`rounded-xl ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full overflow-hidden rounded-xl"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter center={center} zoom={DEFAULT_ZOOM} hasPoints={hasPoints} />
        {hasPoints ? <HeatLayer points={points} /> : null}
      </MapContainer>
    </div>
  );
}
