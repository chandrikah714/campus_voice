import React, { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { CAMPUS_CENTER, CAMPUS_DEFAULT_ZOOM, TILE_LAYERS } from "../../config/campus";

// Leaflet's default marker icon references image paths that don't resolve
// correctly through Vite's bundler — a well-known gotcha. Pointing at the
// CDN copies sidesteps it without needing to hand-manage asset imports.
const pinIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function ClickToPlace({ onPick }) {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

/**
 * Tap/click anywhere on the map to drop a pin. Value is [lat, lng] or null.
 */
export default function LocationPicker({ value, onChange }) {
  const [locating, setLocating] = useState(false);

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [onChange]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-700">Pin the exact spot</span>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="text-xs font-medium text-marigold-700 hover:underline disabled:opacity-60"
        >
          {locating ? "Locating..." : "Use my current location"}
        </button>
      </div>

      <div className="h-56 w-full overflow-hidden rounded-lg ring-1 ring-paper-300">
        <MapContainer
          center={value || CAMPUS_CENTER}
          zoom={CAMPUS_DEFAULT_ZOOM}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url={TILE_LAYERS.street.url} attribution={TILE_LAYERS.street.attribution} />
          <ClickToPlace onPick={onChange} />
          {value && <Marker position={value} icon={pinIcon} />}
        </MapContainer>
      </div>

      <p className="text-xs text-ink-300">
        {value
          ? `Pinned at ${value[0].toFixed(5)}, ${value[1].toFixed(5)}`
          : "Tap the map to mark where the issue is, or use your current location."}
      </p>
    </div>
  );
}
