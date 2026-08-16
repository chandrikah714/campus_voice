import React, { useState } from "react";
import { useMap } from "react-leaflet";
import { FaCrosshairs } from "react-icons/fa";

export default function LocateControl() {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleClick = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 18, { duration: 1 });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={locating}
      className="absolute bottom-4 right-4 z-[1000] flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink-900 shadow-md ring-1 ring-paper-300 hover:bg-paper-100 disabled:opacity-60"
      aria-label="Locate me"
      title="Center on my location"
    >
      <FaCrosshairs className={locating ? "animate-pulse" : ""} />
    </button>
  );
}
