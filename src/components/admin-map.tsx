import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORY_ICON, CATEGORY_LABEL, STATUS_LABEL, URGENCY_LABEL } from "@/lib/reports";
import { urgencyDivIcon, URGENCY_COLORS } from "@/lib/leaflet-setup";

interface Report {
  id: string;
  category: string;
  name: string;
  no_hp: string;
  detail_laporan: string;
  status_pelaporan: string;
  kategori_pelaporan: string;
  latitude: number;
  longitude: number;
}

interface AdminMapProps {
  reports: Report[];
  center: [number, number];
}

export default function AdminMap({ reports, center }: AdminMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");
  const layersRef = useRef<{ standard: L.TileLayer; satellite: L.TileLayer } | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapContainerRef.current) return;

    const container = mapContainerRef.current;
    if ((container as any)._leaflet_id && !mapInstanceRef.current) {
      (container as any)._leaflet_id = null;
      container.innerHTML = "";
    }

    if (!mapInstanceRef.current) {
      const standard = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OSM',
      });

      const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri',
      });

      layersRef.current = { standard, satellite };

      const map = L.map(container, {
        center: center,
        zoom: 12,
        layers: [standard],
        zoomControl: false,
      });
      
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(center, 12);
    }

    const map = mapInstanceRef.current;

    // Switch Layer logic
    if (layersRef.current) {
      const { standard, satellite } = layersRef.current;
      if (mapType === "standard") {
        map.removeLayer(satellite);
        map.addLayer(standard);
      } else {
        map.removeLayer(standard);
        map.addLayer(satellite);
      }
    }

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add markers
    reports.forEach((r) => {
      const marker = L.marker([r.latitude, r.longitude], {
        icon: urgencyDivIcon(r.kategori_pelaporan),
      }).addTo(map);

      const popupContent = `
        <div style="min-width:180px;font-family:inherit;">
          <p style="font-weight:700;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin-bottom:6px;font-size:14px;">${r.name} - ${r.no_hp}</p>
          <p style="font-size:12px;opacity:0.7;margin-bottom:2px;">${(CATEGORY_LABEL as any)[r.category]}</p>
          <p style="font-size:12px;font-weight:500;margin-bottom:8px;">Status: ${r.status_pelaporan === 'progress' ? 'Dikerjakan' : ((STATUS_LABEL as any)[r.status_pelaporan] || r.status_pelaporan)}</p>
          <a href="/admin/reports/${r.id}" style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:#2e7d32;text-decoration:none;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
            Lihat Detail →
          </a>
        </div>
      `;
      marker.bindPopup(popupContent);
    });
  }, [isClient, center, reports, mapType]);

  // Final cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (!isClient) return <div className="h-full w-full bg-secondary/20 animate-pulse" />;

  return (
    <div className="relative h-full w-full group">
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      <div className="absolute top-4 right-4 z-[1000]">
        <div className="flex bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/40 shadow-2xl ring-1 ring-black/5 transition-all hover:shadow-primary/10">
          <button 
            onClick={() => setMapType("standard")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              mapType === "standard" 
                ? "bg-primary text-primary-foreground shadow-md scale-105" 
                : "text-muted-foreground hover:bg-black/5 hover:text-foreground"
            }`}
          >
            <div className={`p-1 rounded-md ${mapType === "standard" ? "bg-white/20" : "bg-primary/10 text-primary"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15"/><path d="M15 6v15"/></svg>
            </div>
            Standard
          </button>
          <button 
            onClick={() => setMapType("satellite")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              mapType === "satellite" 
                ? "bg-primary text-primary-foreground shadow-md scale-105" 
                : "text-muted-foreground hover:bg-black/5 hover:text-foreground"
            }`}
          >
            <div className={`p-1 rounded-md ${mapType === "satellite" ? "bg-white/20" : "bg-primary/10 text-primary"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            </div>
            Satelit
          </button>
        </div>
      </div>
    </div>
  );
}
