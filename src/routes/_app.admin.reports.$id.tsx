import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, lazy, Suspense } from "react";
import {
  ArrowLeft, Camera, MapPin, Calendar, Loader2, ExternalLink, Clock, AlertTriangle, Tag,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_LABEL, CATEGORY_ICON, STATUS_LABEL, STATUS_TONE, URGENCY_LABEL, URGENCY_TONE,
} from "@/lib/reports";
import { URGENCY_COLORS } from "@/lib/leaflet-setup";

export const Route = createFileRoute("/_app/admin/reports/$id")({
  head: () => ({ meta: [{ title: "Detail Laporan" }] }),
  component: ReportDetailPage,
});

interface Report {
  id: string;
  reporter_id: string;
  category: keyof typeof CATEGORY_LABEL;
  title: string;
  description: string;
  status: keyof typeof STATUS_LABEL;
  urgency: keyof typeof URGENCY_LABEL;
  latitude: number;
  longitude: number;
  address: string | null;
  photo_url: string | null;
  created_at: string;
}

interface Petugas {
  id: string;
  full_name: string;
}

interface ReporterProfile {
  full_name: string | null;
  avatar_url: string | null;
}

function ReportDetailPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = Route.useParams();

  const [report, setReport] = useState<Report | null>(null);
  const [petugas, setPetugas] = useState<Petugas[]>([]);
  const [reporter, setReporter] = useState<ReporterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        toast.error("Laporan tidak ditemukan");
        navigate({ to: "/admin" });
        return;
      }

      const reportData = data as Report;
      setReport(reportData);
      if (reportData.photo_url) {
        const { data: signedData, error: signedErr } = await supabase.storage
          .from("reports")
          .createSignedUrl(reportData.photo_url, 3600);
        if (!signedErr && signedData?.signedUrl) {
          setPhotoUrl(signedData.signedUrl);
        } else {
          const { data: pubData } = supabase.storage
            .from("reports")
            .getPublicUrl(reportData.photo_url);
          setPhotoUrl(pubData.publicUrl);
        }
      }

      // Load reporter profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", data.reporter_id)
        .single();
      if (profile) setReporter(profile as ReporterProfile);

      // Load petugas
      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "petugas");
      const ids = (roleRows ?? []).map((r) => r.user_id);
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        setPetugas((profs ?? []) as Petugas[]);
      }

      setLoading(false);
    };

    load();
  }, [id, navigate]);

  const updateStatus = async (status: Report["status"]) => {
    if (!report) return;
    setReport((prev) => prev ? { ...prev, status } : prev);
    const { error } = await supabase.from("reports").update({ status }).eq("id", report.id);
    if (error) {
      toast.error(error.message);
      // Refetch to revert
      const { data } = await supabase.from("reports").select("*").eq("id", id).single();
      if (data) setReport(data as Report);
    } else {
      toast.success("Status diperbarui");
    }
  };

  const updateUrgency = async (urgency: Report["urgency"]) => {
    if (!report) return;
    setReport((prev) => prev ? { ...prev, urgency } : prev);
    const { error } = await supabase.from("reports").update({ urgency }).eq("id", report.id);
    if (error) {
      toast.error(error.message);
      const { data } = await supabase.from("reports").select("*").eq("id", id).single();
      if (data) setReport(data as Report);
    } else {
      toast.success("Urgensi diperbarui");
    }
  };

  const assignPetugas = async (assignedTo: string) => {
    if (!report || !user) return;
    setReport((prev) => prev ? { ...prev, status: "in_progress" as Report["status"] } : prev);

    const { error: woErr } = await supabase.from("work_orders").insert({
      report_id: report.id, assigned_to: assignedTo, assigned_by: user.id,
    });

    if (woErr) {
      toast.error(woErr.message);
      const { data } = await supabase.from("reports").select("*").eq("id", id).single();
      if (data) setReport(data as Report);
      return;
    }

    await supabase.from("reports").update({ status: "in_progress" }).eq("id", report.id);
    toast.success("Petugas berhasil ditugaskan");
  };

  if (loading || !report) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // photoUrl is already resolved via state

  const CategoryIcon = CATEGORY_ICON[report.category as keyof typeof CATEGORY_ICON];
  const urgencyColor = URGENCY_COLORS[report.urgency] ?? "#5a7a55";
  const createdDate = new Date(report.created_at);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => navigate({ to: "/admin" })}
        className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Dashboard
      </Button>

      {/* Hero Section with Photo */}
      <div className="relative overflow-hidden rounded-2xl shadow-elev">
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-secondary/30">
          {photoUrl && !photoError ? (
            <>
              {/* Blurred background fill */}
              <img
                src={photoUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover scale-110 blur-2xl opacity-60"
                onError={() => setPhotoError(true)}
              />
              {/* Main photo */}
              <img
                src={photoUrl}
                alt={report.title}
                onLoad={() => setPhotoLoaded(true)}
                onError={() => setPhotoError(true)}
                className={`relative z-10 h-full w-full object-contain transition-all duration-700 ${photoLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}
              />
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground bg-gradient-to-br from-secondary/40 to-secondary/10">
              <div className="rounded-2xl bg-secondary/60 p-6">
                <Camera className="h-16 w-16 opacity-30" />
              </div>
              <p className="text-sm font-medium italic opacity-60">Tidak ada foto bukti dilampirkan</p>
            </div>
          )}

          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 z-20 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 z-30 p-8">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-white/20 text-white backdrop-blur-sm border-white/20 gap-1.5">
                <CategoryIcon className="h-3.5 w-3.5" />
                {CATEGORY_LABEL[report.category as keyof typeof CATEGORY_LABEL]}
              </Badge>
              <Badge
                className="backdrop-blur-sm border-white/20 text-white"
                style={{ backgroundColor: urgencyColor + "CC" }}
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {URGENCY_LABEL[report.urgency as keyof typeof URGENCY_LABEL]}
              </Badge>
              <Badge className={`backdrop-blur-sm ${STATUS_TONE[report.status as keyof typeof STATUS_LABEL]}`}>
                {STATUS_LABEL[report.status as keyof typeof STATUS_LABEL]}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-lg">
              {report.title}
            </h1>
            <div className="flex items-center gap-4 mt-3 text-white/70 text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {createdDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatDistanceToNow(createdDate, { addSuffix: true, locale: idLocale })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: Detail Info */}
        <div className="space-y-6">
          {/* Description */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-xs font-bold uppercase text-primary/60 tracking-wider mb-4 flex items-center gap-2">
              <Tag className="h-3.5 w-3.5" />
              Deskripsi Laporan
            </h3>
            <div className="bg-secondary/10 p-5 rounded-xl border border-border/50">
              <p className="text-base text-foreground/90 leading-relaxed italic">
                "{report.description}"
              </p>
            </div>
          </Card>

          {/* Location */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-xs font-bold uppercase text-primary/60 tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              Lokasi Kejadian
            </h3>
            <div className="flex items-start gap-4 bg-secondary/10 p-5 rounded-xl border border-border/50">
              <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                <MapPin className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium">{report.address || "Lokasi GPS"}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                </p>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}#map=18/${report.latitude}/${report.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:underline font-medium"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Buka di OpenStreetMap
                </a>
              </div>
            </div>
          </Card>

          {/* Reporter */}
          {reporter && (
            <Card className="p-6 shadow-soft">
              <h3 className="text-xs font-bold uppercase text-primary/60 tracking-wider mb-4">
                Pelapor
              </h3>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-leaf-gradient flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {(reporter.full_name ?? "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{reporter.full_name ?? "Anonim"}</p>
                  <p className="text-xs text-muted-foreground">ID: {report.reporter_id.slice(0, 8)}…</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right: Admin Actions */}
        <div className="space-y-6">
          {/* Status Control */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-xs font-bold uppercase text-primary/60 tracking-wider mb-4">
              Update Status
            </h3>
            <Select
              value={report.status}
              onValueChange={(v) => updateStatus(v as Report["status"])}
            >
              <SelectTrigger className={`h-12 text-sm font-semibold rounded-xl ${STATUS_TONE[report.status as keyof typeof STATUS_LABEL]}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Urgency Control */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-xs font-bold uppercase text-primary/60 tracking-wider mb-4">
              Tingkat Urgensi
            </h3>
            <Select
              value={report.urgency}
              onValueChange={(v) => updateUrgency(v as Report["urgency"])}
            >
              <SelectTrigger className={`h-12 text-sm font-semibold rounded-xl ${URGENCY_TONE[report.urgency as keyof typeof URGENCY_LABEL]}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(URGENCY_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Assign Petugas */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-xs font-bold uppercase text-primary/60 tracking-wider mb-4">
              Tugaskan Petugas
            </h3>
            <Select onValueChange={(v) => assignPetugas(v)}>
              <SelectTrigger className="h-12 text-sm bg-secondary/50 border-dashed rounded-xl">
                <SelectValue placeholder="Pilih Petugas…" />
              </SelectTrigger>
              <SelectContent>
                {petugas.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Metadata */}
          <Card className="p-6 shadow-soft bg-secondary/20">
            <h3 className="text-xs font-bold uppercase text-primary/60 tracking-wider mb-4">
              Metadata
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID Laporan</span>
                <span className="font-mono text-xs">{report.id.slice(0, 8)}…</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dibuat</span>
                <span>{createdDate.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Koordinat</span>
                <span className="font-mono text-xs">{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
