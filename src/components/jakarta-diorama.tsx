import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export function JakartaDiorama() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize MapLibre Map
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json", // Premium minimal light style
      center: [106.8229, -6.1948], // [Lon, Lat] for Jakarta (Bundaran HI)
      zoom: 16.5, // Increased initial zoom to show HI closely on load
      pitch: 52,
      bearing: 30,
      antialias: false // Disable antialiasing for a massive FPS boost on high-DPI mobile screens
    });

    map.on("load", () => {
      setIsLoading(false);

      // Add 3D building layer programmatically
      map.addLayer({
        id: "3d-buildings",
        source: "carto",
        "source-layer": "building",
        type: "fill-extrusion",
        minzoom: 16.3, // Only render 3D when zoomed in close to save mobile GPU memory
        paint: {
          // Clean white-to-light-grey gradient
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["get", "render_height"],
            0, "#ffffff",       // Footprints / ground level: pure white
            35, "#f9fafb",      // Short buildings: off-white
            60, "#f3f4f6",      // Medium buildings: soft grey
            120, "#e5e7eb",     // Tall: light silver
            200, "#d1d5db"      // Skyscrapers: classic architectural grey
          ],
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            16.3,
            0,
            16.6,
            ["get", "render_height"]
          ],
          "fill-extrusion-base": [
            "interpolate",
            ["linear"],
            ["zoom"],
            16.3,
            0,
            16.6,
            ["get", "render_min_height"]
          ],
          "fill-extrusion-opacity": 0.85
        }
      });
    });

    // Cleanup
    return () => {
      map.remove();
    };
  }, []);

  return (
    <div className="relative flex flex-col h-full w-full rounded-3xl border border-border shadow-elev overflow-hidden bg-[#fbf8f3]">
      {/* Brand Badge */}
      <div className="absolute top-4 left-4 z-20 bg-background/95 border border-border/80 px-3.5 py-1.5 rounded-2xl shadow-soft backdrop-blur flex items-center gap-2 select-none pointer-events-auto hover:scale-[1.02] transition-transform duration-200">
        <span className="relative flex h-5.5 w-5.5 rounded-lg bg-primary items-center justify-center text-white text-[11px] font-black shadow-sm">
          A
        </span>
        <span className="text-[12px] font-black tracking-wider text-foreground">
          AURA <span className="text-primary font-bold">3D</span>
        </span>
      </div>

      {/* Frame Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fbf8f3]/85 z-10 select-none">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs text-muted-foreground font-semibold mt-3">Memuat peta 3D Jakarta…</p>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainer} className="flex-1 w-full h-full" />

      {/* Tiny Sleek Interaction Guide Pill */}
      <div className="absolute bottom-4 right-4 z-20 bg-background/85 border border-border/65 px-3 py-1.5 rounded-full shadow-soft backdrop-blur text-[10px] text-muted-foreground font-semibold select-none flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        Klik kanan + seret untuk memutar 3D
      </div>
    </div>
  );
}
