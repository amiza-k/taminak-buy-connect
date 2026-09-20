import { NeshanMapPicker } from "./neshan-map-picker";
import type { MapPickerProps } from "./types";

export type { LatLng, MapPickerProps } from "./types";

/**
 * Provider-agnostic map picker backed by Neshan's Leaflet-compatible web SDK.
 * Keeping this facade means callers remain independent of the map provider.
 */
export function MapPicker(props: MapPickerProps) {
  return <NeshanMapPicker {...props} />;
}
