import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORY_LABEL, CATEGORY_ICON, STATUS_LABEL, STATUS_TONE, URGENCY_LABEL, URGENCY_TONE,
} from "@/lib/reports";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, MapPin, CalendarDays, ChevronRight, Image as ImageIcon } from "lucide-react";

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

function AdminReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const fetch = async () => {
    const { data, error } = await supabase
      .from("reports")
      .select("id,category,name,email,no_hp,detail_laporan,status_pelaporan,kategori_pelaporan,address,created_at,photo_url")
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

  const filtered = useMemo(() => reports.filter((r) =>
    (filterStatus === "all" || r.status_pelaporan === filterStatus) &&
    (filterCategory === "all" || r.category === filterCategory) &&
    (r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.detail_laporan.toLowerCase().includes(search.toLowerCase()) ||
      (r.address ?? "").toLowerCase().includes(search.toLowerCase()))
  ), [reports, filterStatus, filterCategory, search]);

  const getPhotoUrl = (photoPath: string | null) => {
    if (!photoPath) return null;
    return signedUrls[photoPath] || supabase.storage.from("reports").getPublicUrl(photoPath).data.publicUrl;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight md:text-2xl">Kelola Laporan</h2>
        <p className="text-sm text-muted-foreground">{reports.length} total laporan masuk</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari judul atau lokasi..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-9 w-full sm:w-44 select-none"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-9 w-full sm:w-44 select-none"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex h-40 items-center justify-center text-sm text-muted-foreground italic shadow-soft">
          Tidak ada laporan ditemukan.
        </Card>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((r) => {
            const Icon = CATEGORY_ICON[r.category as keyof typeof CATEGORY_ICON] || ImageIcon;
            const date = new Date(r.created_at).toLocaleDateString("id-ID", {
              day: "numeric", month: "short", year: "numeric",
            });
            const photoUrl = getPhotoUrl(r.photo_url);
            const urgencyKey = getUrgencyKey(r.kategori_pelaporan);

            return (
              <Card
                key={r.id}
                className="group relative flex flex-col md:flex-row cursor-pointer items-stretch gap-4 border border-border/80 p-4 transition-all hover:bg-secondary/10 hover:shadow-soft hover:border-primary/30 active:scale-[0.998] rounded-xl bg-card"
                onClick={() => navigate({ to: "/admin/reports/$id", params: { id: r.id } })}
              >
                {/* Thumbnail Image */}
                <div className="relative h-24 w-full md:w-28 shrink-0 overflow-hidden rounded-lg bg-secondary/40 border border-border/50">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={r.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary/35 to-secondary/15 text-muted-foreground">
                      <Icon className="h-6 w-6 opacity-60" />
                    </div>
                  )}
                </div>

                {/* Content info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-sm md:text-base text-foreground group-hover:text-primary transition-colors flex items-center flex-wrap gap-2">
                          <Icon className="h-4.5 w-4.5 text-primary shrink-0" />
                          <span>{CATEGORY_LABEL[r.category as keyof typeof CATEGORY_LABEL] || r.category}</span>
                          <Badge className={`text-[10px] px-2 py-0.5 rounded shadow-sm border-none font-bold ${
                            r.status_pelaporan === 'progress' ? STATUS_TONE.in_progress : (STATUS_TONE[r.status_pelaporan as keyof typeof STATUS_TONE] || 'bg-secondary text-secondary-foreground')
                          }`}>
                            {r.status_pelaporan === 'progress' ? 'Dikerjakan' : (STATUS_LABEL[r.status_pelaporan as keyof typeof STATUS_LABEL] || r.status_pelaporan)}
                          </Badge>
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                          Pelapor: <span className="text-foreground font-semibold">{r.name}</span> ({r.no_hp})
                        </p>
                      </div>

                      {/* Urgency Badge in Top Right */}
                      <Badge variant="outline" className={`shrink-0 text-[10px] rounded-full border px-2.5 py-0.5 font-semibold ${
                        urgencyKey === 'low' ? URGENCY_TONE.low : (URGENCY_TONE[urgencyKey as keyof typeof URGENCY_TONE] || 'bg-secondary text-secondary-foreground')
                      }`}>
                        {URGENCY_LABEL[urgencyKey] || urgencyKey}
                      </Badge>
                    </div>

                    {/* Report Description */}
                    <p className="mt-2 line-clamp-2 text-xs md:text-sm text-muted-foreground leading-relaxed">
                      "{r.detail_laporan}"
                    </p>
                  </div>

                  {/* Metadata footer */}
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] md:text-xs text-muted-foreground border-t border-border/40 pt-2.5">
                    <span className="flex items-center gap-1 max-w-[250px] truncate font-medium">
                      <MapPin className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                      {r.address || "Lokasi GPS"}
                    </span>
                    <span className="flex items-center gap-1 shrink-0 font-medium">
                      <CalendarDays className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                      {date}
                    </span>
                    <span className="ml-auto text-[9px] font-mono text-muted-foreground/60 group-hover:text-primary/60 transition-colors">
                      ID: {r.id.slice(0, 8)}
                    </span>
                  </div>
                </div>

                {/* Right Arrow indicator */}
                <div className="hidden md:flex items-center justify-center pl-2 shrink-0 border-l border-border/30 group-hover:bg-primary/5 transition-colors self-stretch rounded-r-xl px-2">
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all duration-300 transform group-hover:translate-x-0.5" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
