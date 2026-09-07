export type LatLng = { lat: number; lng: number };

export type MapPickerProps = {
  value: LatLng | null;
  onChange: (value: LatLng) => void;
  /** Used only when value is null (first open). */
  defaultCenter?: LatLng;
  className?: string;
};