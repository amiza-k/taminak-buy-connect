import { MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { IRAN_PROVINCES, citiesOf } from "@/lib/iran-locations";
import { useMarketLocation, type MarketScope } from "@/hooks/use-location";

const SCOPE_LABELS: Record<MarketScope, string> = {
  city: "فقط شهر من",
  province: "کل استان",
  country: "سراسر ایران",
};

export function LocationPicker({ className }: { className?: string }) {
  const { province, city, scope, hydrated, setLocation, setScope } = useMarketLocation();

  const label = !hydrated
    ? "انتخاب موقعیت"
    : city
      ? `${city}، ${province}`
      : province
        ? province
        : "انتخاب موقعیت";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <MapPin className="size-4" />
          <span className="max-w-[10rem] truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-4">
        <div className="space-y-2">
          <Label>استان</Label>
          <Select
            {...(province ? { value: province } : {})}
            onValueChange={(value) => setLocation({ province: value, city: null })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="انتخاب استان" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {IRAN_PROVINCES.map((p) => (
                <SelectItem key={p.name} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>شهر</Label>
          <Select
            {...(city ? { value: city } : {})}
            disabled={!province}
            onValueChange={(value) => setLocation({ province, city: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="انتخاب شهر" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {citiesOf(province).map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>محدوده جست‌وجوی تأمین‌کننده</Label>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            {(Object.keys(SCOPE_LABELS) as MarketScope[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setScope(key)}
                disabled={key === "city" && !city}
                className={`rounded-md px-2 py-1.5 text-xs transition-colors disabled:opacity-40 ${
                  scope === key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {SCOPE_LABELS[key]}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}