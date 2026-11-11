import L from "leaflet";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet default icon paths under bundlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
});

export const URGENCY_COLORS: Record<string, string> = {
  low: "#7a8b6f",
  medium: "#c79a3a",
  high: "#c97539",
  critical: "#c0432e",
};

// Titik Pusat Kota Tangerang Selatan (Kantor Walikota Tangsel / Pusat Geografis)
export const TANGSEL_CENTER: [number, number] = [-6.292, 106.712];

// Batas Geografis Kota Tangerang Selatan (Max Bounds untuk mengunci peta)
export const TANGSEL_BOUNDS: [[number, number], [number, number]] = [
  [-6.42, 106.58], // Barat Daya (Setu / Pamulang perbatasan)
  [-6.18, 106.82], // Timur Laut (Pondok Aren / Ciputat Timur perbatasan)
];

// Cek apakah koordinat berada di dalam area Kota Tangerang Selatan
export function isWithinTangsel(lat: number, lng: number): boolean {
  return lat >= -6.40 && lat <= -6.18 && lng >= 106.58 && lng <= 106.82;
}

// Preset titik-titik kecamatan di Tangerang Selatan
export const TANGSEL_PRESETS: { name: string; lat: number; lng: number }[] = [
  { name: "Pamulang", lat: -6.3421, lng: 106.7382 },
  { name: "Ciputat", lat: -6.3115, lng: 106.7452 },
  { name: "Ciputat Timur", lat: -6.3025, lng: 106.7610 },
  { name: "Pondok Aren (Bintaro)", lat: -6.2731, lng: 106.7214 },
  { name: "Serpong (BSD)", lat: -6.3074, lng: 106.6710 },
  { name: "Serpong Utara", lat: -6.2415, lng: 106.6582 },
  { name: "Setu (Puspitek)", lat: -6.3550, lng: 106.6850 },
];

export function urgencyDivIcon(urgency: string) {
  const color = URGENCY_COLORS[urgency] ?? "#5a7a55";
  return L.divIcon({
    className: "aura-marker",
    html: `<span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};box-shadow:0 4px 10px -2px rgba(0,0,0,.35);border:2px solid #fff;"></span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -26],
  });
}
