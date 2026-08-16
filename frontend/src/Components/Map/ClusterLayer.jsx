import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { createRoot } from "react-dom/client";
import L from "../../leafletSetup";
import StatusStamp from "../Shared/StatusStamp";
import PriorityBadge from "../Shared/PriorityBadge";
import { docketNumber, formatTimestamp } from "../../utils/docket";

const PRIORITY_COLOR = { High: "#A50034", Medium: "#C29A2E", Low: "#2E9E63" };

function pinIcon(priority) {
  const color = PRIORITY_COLOR[priority] || "#4A5F7A";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:16px;height:16px;border-radius:50% 50% 50% 0;
      background:${color};transform:rotate(-45deg);
      border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 16],
  });
}

function popupContent(complaint) {
  const el = document.createElement("div");
  el.className = "min-w-[220px]";
  const root = createRoot(el);
  root.render(
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] text-ink-300">{docketNumber(complaint.id)}</span>
        <StatusStamp status={complaint.status} />
      </div>
      <p className="font-display text-sm font-bold text-ink-900">{complaint.title}</p>
      <p className="text-xs text-ink-700">{complaint.description}</p>
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink-500">
        <span>{complaint.department}</span>
        <span>·</span>
        <span>{complaint.location}</span>
      </div>
      <div className="flex items-center justify-between">
        <PriorityBadge priority={complaint.priority} />
        <span className="font-mono text-[10px] text-ink-300">{formatTimestamp(complaint.timestamp)}</span>
      </div>
    </div>
  );
  return el;
}

/**
 * Groups nearby markers into a count bubble when zoomed out; clicking a
 * cluster (or zooming in) breaks it apart into individual pins.
 */
export default function ClusterLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const group = L.markerClusterGroup({
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size = count < 10 ? 34 : count < 30 ? 42 : 50;
        return L.divIcon({
          html: `<div style="
            width:${size}px;height:${size}px;border-radius:50%;
            background:#002147;color:#FFFFFF;display:flex;
            align-items:center;justify-content:center;
            font-family:'IBM Plex Mono',monospace;font-weight:600;
            font-size:12px;border:3px solid #D4AF37;
          ">${count}</div>`,
          className: "",
          iconSize: [size, size],
        });
      },
    });

    points.forEach((p) => {
      const marker = L.marker([p.latitude, p.longitude], { icon: pinIcon(p.priority) });
      marker.bindPopup(popupContent(p), { minWidth: 220 });
      group.addLayer(marker);
    });

    map.addLayer(group);
    return () => {
      map.removeLayer(group);
    };
  }, [map, points]);

  return null;
}
