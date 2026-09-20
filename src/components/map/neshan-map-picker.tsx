import { useEffect, useRef, useState } from "react";

import type { MapPickerProps } from "./types";

const NESHAN_CSS = "https://static.neshan.org/sdk/leaflet/1.4.0/leaflet.css";
const NESHAN_JS = "https://static.neshan.org/sdk/leaflet/1.4.0/leaflet.js";
const NESHAN_API_KEY = import.meta.env.VITE_NESHAN_API_KEY;

// Iran's rough center, used only if the caller gives no defaultCenter.
const FALLBACK_CENTER = { lat: 32.4279, lng: 53.688 };

type NeshanLeaflet = {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => MapInstance;
  marker: (coordinates: [number, number], options: { draggable: boolean }) => MarkerInstance;
};

type MapInstance = {
  on: (event: "click", callback: (event: { latlng: { lat: number; lng: number } }) => void) => void;
  remove: () => void;
  invalidateSize: () => void;
  getZoom: () => number;
  setView: (coordinates: [number, number], zoom: number) => void;
};

type MarkerInstance = {
  addTo: (map: MapInstance) => MarkerInstance;
  on: (event: "dragend", callback: () => void) => void;
  getLatLng: () => { lat: number; lng: number };
  setLatLng: (coordinates: [number, number]) => MarkerInstance;
};

declare global {
  interface Window {
    L?: NeshanLeaflet;
  }
}

let neshanLoadPromise: Promise<NeshanLeaflet> | null = null;

function loadNeshan(): Promise<NeshanLeaflet> {
  if (typeof window === "undefined")
    return Promise.reject(new Error("No browser window is available."));
  if (window.L) return Promise.resolve(window.L);

  if (!neshanLoadPromise) {
    neshanLoadPromise = new Promise((resolve, reject) => {
      if (!document.querySelector(`link[href="${NESHAN_CSS}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = NESHAN_CSS;
        document.head.appendChild(link);
      }

      const script = document.createElement("script");
      script.src = NESHAN_JS;
      script.async = true;
      script.onload = () =>
        window.L ? resolve(window.L) : reject(new Error("Neshan SDK did not initialize."));
      script.onerror = () => reject(new Error("Failed to load the Neshan map SDK."));
      document.body.appendChild(script);
    });
  }

  return neshanLoadPromise;
}

/** Neshan implementation of MapPickerProps using its Leaflet-compatible web SDK. */
export function NeshanMapPicker({ value, onChange, defaultCenter, className }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const markerRef = useRef<MarkerInstance | null>(null);
  const onChangeRef = useRef(onChange);
  const [error, setError] = useState<string | null>(null);
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;

    if (!NESHAN_API_KEY) {
      setError("کلید دسترسی نقشه نشان تنظیم نشده است.");
      return;
    }

    loadNeshan()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return;

        const center = value ?? defaultCenter ?? FALLBACK_CENTER;
        const map = new L.Map(containerRef.current, {
          key: NESHAN_API_KEY,
          maptype: "standard-day",
          poi: true,
          traffic: false,
          center: [center.lat, center.lng],
          zoom: value ? 15 : 6,
        });
        const marker = L.marker([center.lat, center.lng], { draggable: true }).addTo(map);

        marker.on("dragend", () => onChangeRef.current(marker.getLatLng()));
        map.on("click", (event) => {
          marker.setLatLng(event.latlng);
          onChangeRef.current(event.latlng);
        });

        mapRef.current = map;
        markerRef.current = marker;
        // A dialog starts hidden, so recalculate once it has a visible size.
        requestAnimationFrame(() => map.invalidateSize());
      })
      .catch(() => {
        if (!cancelled)
          setError("بارگذاری نقشه نشان ناموفق بود. اتصال اینترنت و کلید دسترسی را بررسی کنید.");
      });

    return () => {
      cancelled = true;
      markerRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // The map is intentionally created only once per mounted picker.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !value) return;
    markerRef.current.setLatLng([value.lat, value.lng]);
    mapRef.current.setView([value.lat, value.lng], mapRef.current.getZoom());
  }, [value]);

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div ref={containerRef} className={className ?? "h-64 w-full"} />
      {error && (
        <p
          className="absolute inset-0 grid place-items-center bg-muted p-4 text-center text-sm text-muted-foreground"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
