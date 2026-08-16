// leaflet.heat and leaflet.markercluster are older plugins that attach
// themselves to a global `L` rather than importing "leaflet" as an ES
// module. Under Vite's bundler that global doesn't exist unless we put it
// there ourselves first — this file does that, once, before either plugin
// loads.
import L from "leaflet";

if (typeof window !== "undefined" && !window.L) {
  window.L = L;
}

import "leaflet.heat";
import "leaflet.markercluster";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

export default L;
