import React, { useMemo, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { useComplaints } from "../../hooks/useComplaints";
import { useCurrentUser } from "../../context/AuthContext";
import { CAMPUS_CENTER, CAMPUS_DEFAULT_ZOOM, TILE_LAYERS } from "../../config/campus";
import HeatmapLayer from "./HeatmapLayer";
import ClusterLayer from "./ClusterLayer";
import MapFilters from "./MapFilters";
import LocateControl from "./LocateControl";
import MapLegend from "./MapLegend";

const DEFAULT_FILTERS = {
  from: "",
  to: "",
  days: [],
  hourFrom: 0,
  hourTo: 23,
  status: "All",
};

/**
 * scope="department" restricts to the current user's department (staff
 * view); scope="all" shows every complaint (admin/student view).
 */
export default function MapView({ scope = "all" }) {
  const { user } = useCurrentUser();
  const { complaints, loading } = useComplaints();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [mode, setMode] = useState("heatmap"); // "heatmap" | "pins"
  const [base, setBase] = useState("street"); // "street" | "satellite"

  const pointed = useMemo(
    () => complaints.filter((c) => typeof c.latitude === "number" && typeof c.longitude === "number"),
    [complaints]
  );

  const scoped = useMemo(
    () => (scope === "department" ? pointed.filter((c) => c.department === user?.department) : pointed),
    [pointed, scope, user?.department]
  );

  const filtered = useMemo(() => {
    return scoped.filter((c) => {
      if (filters.status !== "All" && c.status !== filters.status) return false;
      if (!c.timestamp?.seconds) return filters.from || filters.to || filters.days.length ? false : true;

      const date = new Date(c.timestamp.seconds * 1000);

      if (filters.from && date < new Date(filters.from)) return false;
      if (filters.to && date > new Date(`${filters.to}T23:59:59`)) return false;
      if (filters.days.length && !filters.days.includes(date.getDay())) return false;

      const hour = date.getHours();
      if (filters.hourFrom <= filters.hourTo) {
        if (hour < filters.hourFrom || hour > filters.hourTo) return false;
      } else {
        // wraps past midnight, e.g. 22 -> 4
        if (hour < filters.hourFrom && hour > filters.hourTo) return false;
      }

      return true;
    });
  }, [scoped, filters]);

  const missingCoords = complaints.length - pointed.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900">Campus map</h2>
          <p className="text-sm text-ink-500">
            {filtered.length} of {pointed.length} pinned tickets shown
            {missingCoords > 0 && ` · ${missingCoords} older tickets have no pin yet`}
          </p>
        </div>

        <div className="flex gap-2">
          <ToggleGroup
            value={mode}
            onChange={setMode}
            options={[
              { value: "heatmap", label: "Heat map" },
              { value: "pins", label: "Pins" },
            ]}
          />
          <ToggleGroup
            value={base}
            onChange={setBase}
            options={[
              { value: "street", label: "Street" },
              { value: "satellite", label: "Satellite" },
            ]}
          />
        </div>
      </div>

      <MapFilters filters={filters} setFilters={setFilters} />

      {loading ? (
        <p className="font-mono text-sm text-ink-300">Loading...</p>
      ) : (
        <div className="relative h-[560px] w-full overflow-hidden rounded-2xl shadow-sm ring-1 ring-paper-300">
          <MapContainer
            center={CAMPUS_CENTER}
            zoom={CAMPUS_DEFAULT_ZOOM}
            scrollWheelZoom
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer key={base} url={TILE_LAYERS[base].url} attribution={TILE_LAYERS[base].attribution} />
            {mode === "heatmap" ? (
              <HeatmapLayer points={filtered} />
            ) : (
              <ClusterLayer points={filtered} />
            )}
            <LocateControl />
          </MapContainer>
          <MapLegend mode={mode} />
        </div>
      )}
    </div>
  );
}

function ToggleGroup({ value, onChange, options }) {
  return (
    <div className="flex overflow-hidden rounded-lg ring-1 ring-paper-300">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-sm font-medium transition ${
            value === opt.value
              ? "bg-sky-700 text-white"
              : "bg-white text-ink-700 hover:bg-paper-100"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
