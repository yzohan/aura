import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, MapPin, FileText, Plus, ListChecks, Loader2, Crosshair } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  CATEGORY_LABEL, CATEGORY_ICON, STATUS_LABEL, STATUS_TONE, URGENCY_LABEL, URGENCY_TONE,
} from "@/lib/reports";

export const Route = createFileRoute("/_app/warga")({
  head: () => ({ meta: [{ title: "Dashboard Warga" }] }),
  component: WargaPage,
});

const NAV = [
  { to: "/warga", label: "Lapor & Riwayat", icon: ListChecks },
];

const reportSchema = z.object({
  category: z.enum(["jalan_berlubang", "trotoar_rusak"]),
  title: z.string().trim().min(4, "Judul minimal 4 karakter").max(120),
  description: z.string().trim().min(10, "Deskripsi minimal 10 karakter").max(1000),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().trim().max(200).optional(),
});

interface MyReport {
  id: string;
  category: keyof typeof CATEGORY_LABEL;
  title: string;
  description: string;
  status: keyof typeof STATUS_LABEL;
  urgency: keyof typeof URGENCY_LABEL;
  created_at: string;
  address: string | null;
  photo_url: string | null;
  latitude: number;
  longitude: number;
}

function WargaPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role && role !== "warga") navigate({ to: "/" });
  }, [role, loading, navigate]);

  return (
    <DashboardShell title="Dashboard Warga" nav={NAV}>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <ReportForm userId={user?.id ?? ""} />
        <MyReportsList userId={user?.id ?? ""} />
      </div>
    </DashboardShell>
  );
}

function ReportForm({ userId }: { userId: string }) {
  const [category, setCategory] = useState<keyof typeof CATEGORY_LABEL>("jalan_berlubang");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Browser tidak mendukung geolocation");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("Lokasi terdeteksi");
      },
      (err) => {
        setLocating(false);
        toast.error("Gagal mengambil lokasi: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coords) {
      toast.error("Ambil lokasi GPS terlebih dahulu");
      return;
    }
    const parsed = reportSchema.safeParse({
      category,
      title,
      description,
      latitude: coords.lat,
      longitude: coords.lng,
      address: address || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    let photoPath: string | null = null;

    if (photo) {
      const ext = photo.name.split(".").pop() ?? "jpg";
      photoPath = `${userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("reports").upload(photoPath, photo, {
        cacheControl: "3600", upsert: false,
      });
      if (upErr) {
        setSubmitting(false);
        toast.error("Gagal upload foto: " + upErr.message);
        return;
      }
    }

    const { error } = await supabase.from("reports").insert({
      reporter_id: userId,
      category: parsed.data.category,
      title: parsed.data.title,
      description: parsed.data.description,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      address: parsed.data.address ?? null,
      photo_url: photoPath,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Laporan berhasil dikirim!");
    setTitle(""); setDescription(""); setAddress(""); setPhoto(null); setCoords(null);
  };

  return (
    <Card className="p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-leaf-gradient text-primary-foreground">
          <Plus className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Buat laporan baru</h2>
          <p className="text-xs text-muted-foreground">Sertakan foto & lokasi untuk verifikasi cepat.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label>Kategori kerusakan</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as keyof typeof CATEGORY_LABEL)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {CATEGORY_ICON[k as keyof typeof CATEGORY_ICON]} {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title">Judul singkat</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Lubang besar di Jl. Sudirman" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="desc">Deskripsi</Label>
          <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Jelaskan kondisi, ukuran, dan dampaknya…" rows={3} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">Alamat (opsional)</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Patokan / nama jalan" />
        </div>

        <div className="space-y-1.5">
          <Label>Lokasi GPS</Label>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={getLocation} disabled={locating}>
              {locating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crosshair className="mr-2 h-4 w-4" />}
              {coords ? "Ulang ambil lokasi" : "Ambil lokasi sekarang"}
            </Button>
            {coords && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="photo">Foto (opsional)</Label>
          <div className="flex items-center gap-3">
            <label htmlFor="photo" className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground hover:border-primary/40">
              <Camera className="h-4 w-4" /> {photo ? photo.name : "Pilih foto"}
            </label>
            <input id="photo" type="file" accept="image/*" capture="environment" className="sr-only"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
          </div>
        </div>

        <Button type="submit" disabled={submitting} className="w-full bg-leaf-gradient text-primary-foreground hover:opacity-90">
          {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim…</> : <><FileText className="mr-2 h-4 w-4" /> Kirim laporan</>}
        </Button>
      </form>
    </Card>
  );
}

function MyReportsList({ userId }: { userId: string }) {
  const [reports, setReports] = useState<MyReport[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const { data } = await supabase
        .from("reports")
        .select("*")
        .eq("reporter_id", userId)
        .order("created_at", { ascending: false });
      setReports((data ?? []) as MyReport[]);
    };
    load();
    const channel = supabase
      .channel("my-reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports", filter: `reporter_id=eq.${userId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return (
    <Card className="p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
          <ListChecks className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Riwayat laporan saya</h2>
          <p className="text-xs text-muted-foreground">{reports?.length ?? 0} laporan</p>
        </div>
      </div>
      <div className="mt-4 max-h-[640px] space-y-3 overflow-y-auto pr-2">
        {reports === null && <p className="text-sm text-muted-foreground">Memuat…</p>}
        {reports?.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Belum ada laporan. Buat laporan pertamamu di sebelah ←
          </div>
        )}
        {reports?.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {CATEGORY_ICON[r.category]} {CATEGORY_LABEL[r.category]} ·{" "}
                  {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: idLocale })}
                </p>
                <p className="mt-0.5 truncate font-medium">{r.title}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge variant="outline" className={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                <Badge variant="outline" className={URGENCY_TONE[r.urgency]}>{URGENCY_LABEL[r.urgency]}</Badge>
              </div>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
            {r.address && <p className="mt-1 text-xs text-muted-foreground"><MapPin className="mr-1 inline h-3 w-3" />{r.address}</p>}
          </div>
        ))}
      </div>
    </Card>
  );
}
