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
