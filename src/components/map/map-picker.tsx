import { LeafletMapPicker } from "./leaflet-map-picker";
import type { MapPickerProps } from "./types";

export type { LatLng, MapPickerProps } from "./types";

/**
 * Provider-agnostic map picker. Currently backed by Leaflet/OpenStreetMap
 * (no API key needed). To switch providers later (e.g. Neshan, Google),
 * swap the implementation here -- callers never change.
 */
export function MapPicker(props: MapPickerProps) {
  return <LeafletMapPicker {...props} />;
}