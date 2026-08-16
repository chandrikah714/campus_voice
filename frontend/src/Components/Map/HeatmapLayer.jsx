import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "../../leafletSetup";

const PRIORITY_WEIGHT = { High: 1, Medium: 0.6, Low: 0.3 };

/**
 * Renders points as a heat layer. Weight combines priority (severity) with
 * natural point density (leaflet.heat accumulates overlapping points on its
 * own), so a cluster of low-priority reports and a single high-priority one
 * can both show up hot, for different reasons — which is the right
 * behavior for "where should we look first."
 */
export default function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const heatPoints = points.map((p) => [
      p.latitude,
      p.longitude,
      PRIORITY_WEIGHT[p.priority] ?? 0.4,
    ]);

    const layer = L.heatLayer(heatPoints, {
      radius: 28,
      blur: 22,
      maxZoom: 18,
      gradient: {
        0.2: "#2E9E63", // green — low
        0.5: "#C29A2E", // gold — medium
        0.8: "#A50034", // crimson — high
      },
    });

    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
}
