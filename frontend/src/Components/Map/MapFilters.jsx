import React from "react";
import { DAYS_OF_WEEK } from "../../config/campus";

export default function MapFilters({ filters, setFilters }) {
  const toggleDay = (idx) => {
    setFilters((f) => {
      const days = f.days.includes(idx) ? f.days.filter((d) => d !== idx) : [...f.days, idx];
      return { ...f, days };
    });
  };

  const reset = () =>
    setFilters({
      from: "",
      to: "",
      days: [],
      hourFrom: 0,
      hourTo: 23,
      status: "All",
    });

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-4 ring-1 ring-paper-300">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-700">
          From
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            className="input py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-700">
          To
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            className="input py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-700">
          From hour
          <select
            value={filters.hourFrom}
            onChange={(e) => setFilters((f) => ({ ...f, hourFrom: Number(e.target.value) }))}
            className="input py-1.5 text-sm"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-700">
          To hour
          <select
            value={filters.hourTo}
            onChange={(e) => setFilters((f) => ({ ...f, hourTo: Number(e.target.value) }))}
            className="input py-1.5 text-sm"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>{String(h).padStart(2, "0")}:59</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-ink-700">Days:</span>
        {DAYS_OF_WEEK.map((d, idx) => (
          <button
            key={d}
            type="button"
            onClick={() => toggleDay(idx)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              filters.days.includes(idx)
                ? "bg-ink-900 text-paper-50"
                : "bg-paper-100 text-ink-700 hover:bg-paper-200"
            }`}
          >
            {d}
          </button>
        ))}

        <span className="ml-3 text-xs font-medium text-ink-700">Status:</span>
        {["All", "Pending", "Completed"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilters((f) => ({ ...f, status: s }))}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              filters.status === s
                ? "bg-marigold-500 text-ink-900"
                : "bg-paper-100 text-ink-700 hover:bg-paper-200"
            }`}
          >
            {s}
          </button>
        ))}

        <button
          type="button"
          onClick={reset}
          className="ml-auto text-xs font-medium text-coral-700 hover:underline"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}
