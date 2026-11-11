import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORY_LABEL, STATUS_LABEL } from "@/lib/reports";
import { urgencyDivIcon, TANGSEL_CENTER, TANGSEL_BOUNDS, isWithinTangsel } from "@/lib/leaflet-setup";
import { TANGSEL_POLYGON, WORLD_MASK_RING } from "@/lib/tangsel-boundary";
import {
  TANGSEL_KECAMATAN,
  KECAMATAN_LIST,
  findKecamatanByCoords,
} from "@/lib/tangsel-data";
import { TANGSEL_KECAMATAN_GEOJSON } from "@/lib/tangsel-geojson";

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
  selectedKecamatanId?: string;
  onSelectKecamatan?: (kecamatanId: string) => void;
}

export default function AdminMap({
  reports,
  selectedKecamatanId,
  onSelectKecamatan,
}: AdminMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");
  const [isMasked, setIsMasked] = useState(true); // Masking luar Tangsel
  const [showZones, setShowZones] = useState(true); // Peta Zona Wilayah (Peta ala game teritorial)
  const [activeKecamatanId, setActiveKecamatanId] = useState<string>(selectedKecamatanId || "all");
  const [hoveredKecamatan, setHoveredKecamatan] = useState<string | null>(null);

  const layersRef = useRef<{ standard: L.TileLayer; satellite: L.TileLayer } | null>(null);
  const maskLayerRef = useRef<L.Polygon | null>(null);
  const borderLineRef = useRef<L.Polyline | null>(null);
  const zonesLayerRef = useRef<L.GeoJSON | null>(null);
  const labelsLayerRef = useRef<L.LayerGroup | null>(null);
  const reportMarkersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sinkronisasi jika prop selectedKecamatanId berubah dari luar
  useEffect(() => {
    if (selectedKecamatanId !== undefined) {
      setActiveKecamatanId(selectedKecamatanId);
      if (mapInstanceRef.current) {
        if (selectedKecamatanId === "all") {
          mapInstanceRef.current.flyTo(TANGSEL_CENTER, 12, { duration: 1 });
        } else {
          const target = TANGSEL_KECAMATAN[selectedKecamatanId];
          if (target) {
            mapInstanceRef.current.flyTo(target.center, 13.5, { duration: 1 });
          }
        }
      }
    }
  }, [selectedKecamatanId]);

  // Filter laporan khusus wilayah Tangerang Selatan
  const tangselReports = useMemo(
    () => reports.filter((r) => isWithinTangsel(r.latitude, r.longitude)),
    [reports]
  );

  // Hitung jumlah laporan per Kecamatan
  const reportCountsByKecamatan = useMemo(() => {
    const counts: Record<string, number> = {};
    KECAMATAN_LIST.forEach((k) => (counts[k.id] = 0));

    tangselReports.forEach((r) => {
      const kec = findKecamatanByCoords(r.latitude, r.longitude);
      if (kec && counts[kec.id] !== undefined) {
        counts[kec.id] += 1;
      }
    });
    return counts;
  }, [tangselReports]);

  // 1. Inisialisasi Peta (Hanya 1x saat Client Mount)
  useEffect(() => {
    if (!isClient || !mapContainerRef.current || mapInstanceRef.current) return;

    const standard = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    });

    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "&copy; Esri",
        maxZoom: 18,
      }
    );

    layersRef.current = { standard, satellite };

    const map = L.map(mapContainerRef.current, {
      center: TANGSEL_CENTER,
      zoom: 12,
      minZoom: 11,
      maxZoom: 18,
      maxBounds: TANGSEL_BOUNDS,
      maxBoundsViscosity: 0.9,
      layers: [standard],
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Layer groups
    zonesLayerRef.current = L.geoJSON(null).addTo(map);
    labelsLayerRef.current = L.layerGroup().addTo(map);
    reportMarkersRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isClient]);

  // 2. Ganti Layer Standard vs Satelit
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !layersRef.current) return;
    const { standard, satellite } = layersRef.current;
    if (mapType === "standard") {
      if (map.hasLayer(satellite)) map.removeLayer(satellite);
      if (!map.hasLayer(standard)) map.addLayer(standard);
    } else {
      if (map.hasLayer(standard)) map.removeLayer(standard);
      if (!map.hasLayer(satellite)) map.addLayer(satellite);
    }
  }, [mapType]);

  // 3. Efek Masking Luar Tangsel (Soft Vignette, tidak terlalu gelap hitam pekat)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (maskLayerRef.current) {
      map.removeLayer(maskLayerRef.current);
      maskLayerRef.current = null;
    }
    if (borderLineRef.current) {
      map.removeLayer(borderLineRef.current);
      borderLineRef.current = null;
    }

    if (isMasked) {
      const mask = L.polygon([WORLD_MASK_RING, TANGSEL_POLYGON], {
        color: "#c5e04b",
        weight: 2,
        opacity: 0.9,
        fillColor: "#05130d",
        fillOpacity: 0.35, // Dibuat lembut 35% agar tidak hitam pekat menusuk mata
        interactive: false,
      }).addTo(map);
      maskLayerRef.current = mask;

      const border = L.polyline(TANGSEL_POLYGON, {
        color: "#c5e04b",
        weight: 2,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);
      borderLineRef.current = border;
    }
  }, [isMasked, isClient]);

  // 4. Render Zona Wilayah Kekuasaan (Game-style Territory Polygons)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (zonesLayerRef.current) {
      map.removeLayer(zonesLayerRef.current);
      zonesLayerRef.current = null;
    }
    if (labelsLayerRef.current) {
      labelsLayerRef.current.clearLayers();
    }

    if (showZones) {
      const geoLayer = L.geoJSON(TANGSEL_KECAMATAN_GEOJSON as any, {
        style: (feature: any) => {
          const isSelected = activeKecamatanId === feature.id;
          const isAll = activeKecamatanId === "all";
          const p = feature.properties;

          return {
            color: isSelected ? "#ffffff" : p.color,
            weight: isSelected ? 3.5 : (isAll ? 2 : 1),
            opacity: isSelected ? 1 : (isAll ? 0.9 : 0.4),
            fillColor: p.fillColor,
            fillOpacity: isSelected ? 0.38 : (isAll ? 0.22 : 0.08),
            dashArray: isSelected ? "" : "3 3",
          };
        },
        onEachFeature: (feature: any, layer: L.Layer) => {
          const p = feature.properties;

          layer.on({
            mouseover: (e) => {
              const target = e.target as L.Path;
              target.setStyle({
                weight: 3.5,
                color: "#ffffff",
                fillOpacity: 0.42,
              });
              setHoveredKecamatan(p.name);
            },
            mouseout: (e) => {
              geoLayer.resetStyle(e.target);
              setHoveredKecamatan(null);
            },
            click: () => {
              handleSelectKecamatan(feature.id);
            },
          });
        },
      }).addTo(map);
      zonesLayerRef.current = geoLayer;

      // Label Watermark Wilayah Minimalis di Tengah Tiap Kecamatan
      if (labelsLayerRef.current) {
        KECAMATAN_LIST.forEach((kec) => {
          const isSelected = activeKecamatanId === kec.id;
          const count = reportCountsByKecamatan[kec.id] || 0;

          const labelIcon = L.divIcon({
            className: "game-territory-label",
            html: `
              <div style="
                font-family: inherit;
                font-size: 10px;
                font-weight: 900;
                letter-spacing: 0.6px;
                background: ${isSelected ? kec.color : "rgba(255, 255, 255, 0.88)"};
                color: ${isSelected ? "#ffffff" : kec.textColor};
                backdrop-filter: blur(4px);
                border: 1px solid ${kec.color};
                padding: 2px 7px;
                border-radius: 999px;
                white-space: nowrap;
                transform: translate(-50%, -50%);
                pointer-events: none;
                box-shadow: 0 2px 6px rgba(0,0,0,0.12);
                display: inline-flex;
                align-items: center;
                gap: 4px;
              ">
                <span style="
                  background: ${isSelected ? "rgba(255,255,255,0.3)" : kec.bgLight};
                  color: ${isSelected ? "#ffffff" : kec.textColor};
                  padding: 0 4px;
                  border-radius: 3px;
                  font-size: 8px;
                  font-weight: 900;
                ">${kec.code}</span>
                <span>${kec.shortName.toUpperCase()}</span>
                ${count > 0 ? `
                  <span style="
                    background: ${isSelected ? "#ffffff" : kec.color};
                    color: ${isSelected ? kec.textColor : "#ffffff"};
                    padding: 0 5px;
                    border-radius: 999px;
                    font-size: 9px;
                  ">${count}</span>
                ` : ""}
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          });

          const m = L.marker(kec.center, { icon: labelIcon, interactive: false });
          labelsLayerRef.current?.addLayer(m);
        });
      }
    }
  }, [showZones, activeKecamatanId, reportCountsByKecamatan, isClient]);

  // 5. Render Titik Marker Kerusakan
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !reportMarkersRef.current) return;

    reportMarkersRef.current.clearLayers();

    const filteredReports = tangselReports.filter((r) => {
      if (activeKecamatanId === "all") return true;
      const kec = findKecamatanByCoords(r.latitude, r.longitude);
      return kec?.id === activeKecamatanId;
    });

    filteredReports.forEach((r) => {
      const marker = L.marker([r.latitude, r.longitude], {
        icon: urgencyDivIcon(r.kategori_pelaporan),
      });

      const reportKec = findKecamatanByCoords(r.latitude, r.longitude);

      const popupContent = `
        <div style="min-width: 210px; font-family: inherit;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 800; background: ${reportKec.bgLight}; color: ${reportKec.textColor}; padding: 2px 8px; border-radius: 99px;">
              ${reportKec.shortName}
            </span>
            <span style="font-weight: 700; font-size: 13px; color: #0f172a;">${r.name}</span>
          </div>
          <p style="font-size: 12px; color: #334155; margin-bottom: 4px; font-weight: 700;">${(CATEGORY_LABEL as any)[r.category] || r.category}</p>
          <p style="font-size: 11px; color: #64748b; margin-bottom: 8px; line-height: 1.4;">${
            r.detail_laporan
              ? r.detail_laporan.length > 70
                ? r.detail_laporan.slice(0, 70) + "…"
                : r.detail_laporan
              : "-"
          }</p>
          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px dashed #e2e8f0; padding-top: 6px;">
            <span style="font-size: 11px; font-weight: 700; color: #0f2e22;">${
              r.status_pelaporan === "progress"
                ? "Dikerjakan"
                : (STATUS_LABEL as any)[r.status_pelaporan] || r.status_pelaporan
            }</span>
            <a href="/admin/reports/${r.id}" style="display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 800; color: #2f9e5b; text-decoration: none;">
              Lihat Detail &rarr;
            </a>
          </div>
        </div>
      `;
      marker.bindPopup(popupContent);
      reportMarkersRef.current?.addLayer(marker);
    });
  }, [
    isClient,
    tangselReports,
    activeKecamatanId,
  ]);

  const handleSelectKecamatan = (id: string) => {
    setActiveKecamatanId(id);
    if (onSelectKecamatan) onSelectKecamatan(id);

    if (mapInstanceRef.current) {
      if (id === "all") {
        mapInstanceRef.current.flyTo(TANGSEL_CENTER, 12, { duration: 1 });
      } else {
        const target = TANGSEL_KECAMATAN[id];
        if (target) {
          mapInstanceRef.current.flyTo(target.center, 13.5, { duration: 1 });
        }
      }
    }
  };

  const resetToTangsel = () => {
    handleSelectKecamatan("all");
  };

  if (!isClient) return <div className="h-full w-full bg-secondary/20 animate-pulse" />;

  const activeKec = activeKecamatanId !== "all" ? TANGSEL_KECAMATAN[activeKecamatanId] : null;

  return (
    <div className="relative h-full w-full group overflow-hidden select-none outline-none focus:outline-none">
      <div ref={mapContainerRef} className="h-full w-full z-0 outline-none focus:outline-none" />

      {/* Top Left: Game HUD Badge (Interaktif & Mulus) */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 pointer-events-none">
        <div className="inline-flex items-center gap-2 rounded-2xl border border-forest/15 bg-white/95 px-3.5 py-2 text-xs font-bold text-forest shadow-md backdrop-blur-md">
          <span className="h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-forest/20 animate-pulse" />
          <span>
            {hoveredKecamatan
              ? `Arah Kursor: ${hoveredKecamatan}`
              : activeKec
              ? `${activeKec.name} (${reportCountsByKecamatan[activeKec.id] || 0} Titik Kerusakan)`
              : `Kota Tangerang Selatan (7 Zona Wilayah)`}
          </span>
        </div>
      </div>

      {/* Top Right: Kontrol Peta */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-wrap items-center justify-end gap-2">
        {/* Toggle Zona Wilayah (Game Map) */}
        <button
          onClick={() => setShowZones((z) => !z)}
          title="Tampilkan warna zona wilayah (peta game teritorial)"
          className={`flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-bold shadow-md backdrop-blur-md transition-all ${
            showZones
              ? "border-forest/20 bg-forest text-primary shadow-forest/20"
              : "border-white/50 bg-white/90 text-forest hover:bg-sage"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${showZones ? "bg-primary" : "bg-muted-foreground"}`} />
          {showZones ? "Zona: Aktif" : "Zona: Polos"}
        </button>

        {/* Toggle Luar Tangsel Gelap (Masking) */}
        <button
          onClick={() => setIsMasked((m) => !m)}
          title={isMasked ? "Matikan efek gelap luar Tangsel" : "Aktifkan efek gelap luar Tangsel"}
          className={`flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-bold shadow-md backdrop-blur-md transition-all ${
            isMasked
              ? "border-forest/20 bg-forest text-primary shadow-forest/20"
              : "border-white/50 bg-white/90 text-forest hover:bg-sage"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${isMasked ? "bg-primary" : "bg-muted-foreground"}`} />
          {isMasked ? "Gelap Luar" : "Terang"}
        </button>

        {/* Switcher Standard / Satelit */}
        <div className="flex bg-white/90 backdrop-blur-md p-1 rounded-2xl border border-white/50 shadow-md">
          <button
            onClick={() => setMapType("standard")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              mapType === "standard"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-black/5"
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setMapType("satellite")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              mapType === "satellite"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-black/5"
            }`}
          >
            Satelit
          </button>
        </div>
      </div>

      {/* Bottom Center: Bar Pemilih Kecamatan Bersih (Tanpa Scrollbar Abu-abu Kaku) */}
      <div
        className="absolute bottom-3 left-3 right-16 z-[1000] flex items-center overflow-x-auto py-1 gap-1.5"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex items-center gap-1 rounded-2xl border border-white/60 bg-white/95 p-1.5 shadow-lg backdrop-blur-md">
          <button
            onClick={resetToTangsel}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeKecamatanId === "all"
                ? "bg-forest text-primary shadow-sm"
                : "text-muted-foreground hover:bg-black/5 hover:text-forest"
            }`}
          >
            Semua
          </button>

          {KECAMATAN_LIST.map((kec) => {
            const isSelected = activeKecamatanId === kec.id;
            const count = reportCountsByKecamatan[kec.id] || 0;

            return (
              <button
                key={kec.id}
                onClick={() => handleSelectKecamatan(kec.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-forest text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-black/5 hover:text-forest"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: kec.color }}
                />
                <span>{kec.shortName}</span>
                {count > 0 && (
                  <span className="text-[10px] font-extrabold bg-primary/20 text-forest px-1.5 rounded-full">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
