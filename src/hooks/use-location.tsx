import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { citiesOf } from "@/lib/iran-locations";

export type MarketScope = "city" | "province" | "country";

export type MarketLocation = {
  province: string | null;
  city: string | null;
  scope: MarketScope;
};

type LocationContextValue = MarketLocation & {
  hydrated: boolean;
  setLocation: (next: { province: string | null; city: string | null }) => void;
  setScope: (scope: MarketScope) => void;
  clear: () => void;
};

const STORAGE_KEY = "taminak.location";

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MarketLocation>({ province: null, city: null, scope: "city" });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MarketLocation;
        setState({
          province: parsed.province ?? null,
          city: parsed.city && citiesOf(parsed.province).includes(parsed.city) ? parsed.city : null,
          scope: parsed.scope ?? "city",
        });
      }
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const value = useMemo<LocationContextValue>(
    () => ({
      ...state,
      hydrated,
      setLocation: ({ province, city }) =>
        setState((prev) => ({ ...prev, province, city, scope: city ? prev.scope : "province" })),
      setScope: (scope) => setState((prev) => ({ ...prev, scope })),
      clear: () => setState({ province: null, city: null, scope: "city" }),
    }),
    [state, hydrated],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useMarketLocation(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useMarketLocation must be used inside <LocationProvider>");
  return ctx;
}
