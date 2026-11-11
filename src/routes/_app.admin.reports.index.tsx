import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORY_LABEL, CATEGORY_ICON, STATUS_LABEL, STATUS_TONE, URGENCY_LABEL, URGENCY_TONE,
} from "@/lib/reports";
import {
  KECAMATAN_LIST,
  TANGSEL_KECAMATAN,
  findNearestKelurahan,
} from "@/lib/tangsel-data";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, MapPin, CalendarDays, ArrowRight, Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/_app/admin/reports/")({
  head: () => ({ meta: [{ title: "Kelola Laporan" }] }),
  component: AdminReportsPage,
});

interface Report {
  id: string;
  category: keyof typeof CATEGORY_LABEL;
  name: string;
  email: string | null;
  no_hp: string;
  detail_laporan: string;
  status_pelaporan: string;
  kategori_pelaporan: string;
  latitude?: number;
  longitude?: number;
  address: string | null;
  created_at: string;
  photo_url: string | null;
}

const getUrgencyKey = (val: string): "low" | "medium" | "high" | "critical" => {
  const norm = (val || "").toLowerCase();
  if (norm === "low" || norm === "medium" || norm === "high" || norm === "critical") {
    return norm;
  }
  if (norm.includes("ringan") || norm.includes("kecil") || norm.includes("low")) return "low";
  if (norm.includes("sedang") || norm.includes("medium")) return "medium";
  if (norm.includes("tinggi") || norm.includes("berat") || norm.includes("high") || norm.includes("parah")) return "high";
  if (norm.includes("kritis") || norm.includes("critical") || norm.includes("sangat parah")) return "critical";
  return "medium";
};

const STATUS_FILTERS = [{ key: "all", label: "Semua" }];

function AdminReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterKecamatan, setFilterKecamatan] = useState("all");
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const fetch = async () => {
    const { data, error } = await supabase
      .from("reports")
      .select("id,category,name,email,no_hp,detail_laporan,status_pelaporan,kategori_pelaporan,latitude,longitude,address,created_at,photo_url")
      .order("created_at", { ascending: false });
    if (error) return;
    setReports((data ?? []) as Report[]);

    // Batch load signed URLs for private photos
    const paths = (data ?? []).map((r) => r.photo_url).filter(Boolean) as string[];
    if (paths.length > 0) {
      const { data: signedData, error: signedErr } = await supabase.storage
        .from("reports")
        .createSignedUrls(paths, 3600);
      if (!signedErr && signedData) {
        const urlsMap: Record<string, string> = {};
        signedData.forEach((item) => {
          if (item.error === null && item.signedUrl) {
            urlsMap[item.path] = item.signedUrl;
          }
        });
        setSignedUrls(urlsMap);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetch();

    const ch = supabase
      .channel("reports-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, fetch)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const filtered = useMemo(() => reports.filter((r) => {
    if (filterStatus !== "all" && r.status_pelaporan !== filterStatus) return false;
    if (filterCategory !== "all" && r.category !== filterCategory) return false;

    const kel = (typeof r.latitude === "number" && typeof r.longitude === "number")
      ? findNearestKelurahan(r.latitude, r.longitude)
      : null;

    if (filterKecamatan !== "all") {
      if (!kel || kel.kecamatanId !== filterKecamatan) return false;
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      const matchesStandard =
        r.name.toLowerCase().includes(s) ||
        r.detail_laporan.toLowerCase().includes(s) ||
        (r.address ?? "").toLowerCase().includes(s);

      if (!matchesStandard) {
        if (kel && (kel.name.toLowerCase().includes(s) || kel.kecamatanName.toLowerCase().includes(s))) {
          return true;
        }
        return false;
      }
    }

    return true;
  }), [reports, filterStatus, filterCategory, filterKecamatan, search]);

  const getPhotoUrl = (photoPath: string | null) => {
    if (!photoPath) return null;
    return signedUrls[photoPath] || supabase.storage.from("reports").getPublicUrl(photoPath).data.publicUrl;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 px-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-forest md:text-4xl dark:text-foreground">
            Kelola Laporan
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{reports.length} total laporan masuk dari warga.</p>
        </div>

        {/* Filter */}
        <div className="flex flex-col flex-wrap gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama, kelurahan, lokasi…"
              className="pl-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterKecamatan} onValueChange={setFilterKecamatan}>
            <SelectTrigger className="h-12 w-full select-none sm:w-52">
              <SelectValue placeholder="Semua Kecamatan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kecamatan (7)</SelectItem>
              {KECAMATAN_LIST.map((kec) => (
                <SelectItem key={kec.id} value={kec.id}>
                  {kec.code} {kec.shortName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-12 w-full select-none sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-12 w-full select-none sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Daftar */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-forest" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-[32px] border-[1.5px] border-dashed border-forest-soft/40 bg-card text-sm italic text-muted-foreground">
          Tidak ada laporan ditemukan untuk filter ini.
        </div>
      ) : (
        <div className="space-y-4 rounded-[32px] bg-card/70 p-3 shadow-soft md:p-4">
          {filtered.map((r) => {
            const Icon = CATEGORY_ICON[r.category as keyof typeof CATEGORY_ICON] || ImageIcon;
            const date = new Date(r.created_at).toLocaleDateString("id-ID", {
              day: "numeric", month: "short", year: "numeric",
            });
            const photoUrl = getPhotoUrl(r.photo_url);
            const urgencyKey = getUrgencyKey(r.kategori_pelaporan);

            const kel = (typeof r.latitude === "number" && typeof r.longitude === "number")
              ? findNearestKelurahan(r.latitude, r.longitude)
              : null;
            const kec = kel ? TANGSEL_KECAMATAN[kel.kecamatanId] : null;

            return (
              <div
                key={r.id}
                className="group flex cursor-pointer flex-col items-stretch gap-4 rounded-[28px] bg-card p-4 transition-shadow hover:shadow-elev md:flex-row"
                onClick={() => navigate({ to: "/admin/reports/$id", params: { id: r.id } })}
              >
                {/* Thumbnail */}
                <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-3xl bg-sage md:h-28 md:w-36">
                  {photoUrl ? (
                    <img src={photoUrl} alt={r.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-forest">
                      <Icon className="h-7 w-7 opacity-60" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="flex items-center gap-2 text-base font-extrabold text-forest dark:text-foreground">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span>{CATEGORY_LABEL[r.category as keyof typeof CATEGORY_LABEL] || r.category}</span>
                          </h3>

                          {kec && kel && (
                            <span
                              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-extrabold text-white shadow-xs"
                              style={{ backgroundColor: kec.color }}
                            >
                              <span>{kec.code} {kec.shortName}</span>
                              <span className="opacity-70">•</span>
                              <span>Kel. {kel.name}</span>
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Pelapor: <span className="font-bold text-foreground">{r.name}</span> ({r.no_hp})
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                          r.status_pelaporan === "progress"
                            ? STATUS_TONE.in_progress
                            : (STATUS_TONE[r.status_pelaporan as keyof typeof STATUS_TONE] || "bg-secondary text-secondary-foreground")
                        }`}>
                          {r.status_pelaporan === "progress" ? "Dikerjakan" : (STATUS_LABEL[r.status_pelaporan as keyof typeof STATUS_LABEL] || r.status_pelaporan)}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                          urgencyKey === "low" ? URGENCY_TONE.low : (URGENCY_TONE[urgencyKey as keyof typeof URGENCY_TONE] || "bg-secondary text-secondary-foreground")
                        }`}>
                          {URGENCY_LABEL[urgencyKey] || urgencyKey}
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      “{r.detail_laporan}”
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                    <span className="flex max-w-[340px] items-center gap-1.5 truncate font-medium">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>{r.address || (kel ? `Kel. ${kel.name}, ${kec?.shortName}` : "Tangerang Selatan")}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 font-medium">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                      {date}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground/70">
                      ID: {r.id.slice(0, 8)}
                    </span>
                  </div>
                </div>

                {/* Panah */}
                <div className="hidden items-center md:flex">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sage text-forest transition-colors group-hover:bg-primary">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}