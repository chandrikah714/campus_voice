// Default map center when there's no better signal to center on (e.g. an
// empty map, or before the location picker gets a GPS fix). Swap this for
// your actual campus's coordinates — right now it's set to Chennai as a
// reasonable placeholder.
export const CAMPUS_CENTER = [13.0827, 80.2707];
export const CAMPUS_DEFAULT_ZOOM = 16;

export const TILE_LAYERS = {
  street: {
    name: "Street",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
  },
};

export const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
