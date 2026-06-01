import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  Camera, MapPin, FileText, Plus, ListChecks,
  Loader2, Crosshair, ShieldAlert, Clock, Users,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
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
  CATEGORY_LABEL, CATEGORY_ICON,
  STATUS_LABEL, STATUS_TONE,
  URGENCY_LABEL, URGENCY_TONE,
} from "@/lib/reports";

export const Route = createFileRoute("/_app/warga")({
  head: () => ({ meta: [{ title: "Lapor Kerusakan" }] }),
  component: WargaPage,
});

const NAV = [{ to: "/warga", label: "Lapor & Riwayat", icon: ListChecks }];

const reportSchema = z.object({
  category: z.enum(["jalan_berlubang", "pju_mati"]),
  detail_laporan: z.string().trim().min(10, "Detail laporan minimal 10 karakter").max(1000),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().trim().min(5, "Alamat wajib diisi minimal 5 karakter").max(200),
  name: z.string().trim().min(2, "Nama wajib diisi minimal 2 karakter").max(100),
  email: z.string().trim().min(1, "Email wajib diisi").email("Format email tidak valid"),
  phone: z.string().trim().min(8, "Nomor HP wajib diisi minimal 8 karakter").max(20),
});

// ──────────────────────────────────────────────────────────
// Cara pakai ip-api.com:
//   GET http://ip-api.com/json/?fields=query,status
//   → { "status": "success", "query": "114.10.52.133" }
//   field "query" = IP publik pengguna saat ini
//   PENTING: versi gratis hanya HTTP (bukan HTTPS)
//   Jika website pakai HTTPS di production, browser akan
async function fetchPublicIp(): Promise<string | null> {
  // Bypass untuk local development: agar tidak error karena AdBlock/CORS di localhost
  if (import.meta.env.DEV) {
    return "127.0.0.1";
  }

  // 1. Coba api.ipify.org (Paling standar untuk production)
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    if (res.ok) {
      const data = (await res.json()) as { ip?: string };
      if (data.ip) return data.ip;
    }
  } catch {}

  // 2. Fallback ke jsonip.com (Alternatif stabil dengan CORS support)
  try {
    const res = await fetch("https://jsonip.com");
    if (res.ok) {
      const data = (await res.json()) as { ip?: string };
      if (data.ip) return data.ip;
    }
  } catch {}

  return null;
}

async function fetchOSMPlaces(lat: number, lng: number): Promise<string[]> {
  // Query Overpass API untuk mencari amenity (fasilitas umum), bangunan penting, dan landuse pemukiman dalam radius 300m
  const query = `[out:json][timeout:15];(node(around:300,${lat},${lng})["amenity"];way(around:300,${lat},${lng})["amenity"];node(around:300,${lat},${lng})["building"~"school|hospital|residential|apartments|house"];way(around:300,${lat},${lng})["building"~"school|hospital|residential|apartments|house"];way(around:300,${lat},${lng})["landuse"~"residential"];relation(around:300,${lat},${lng})["landuse"~"residential"];);out tags center;`;
  
  try {
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("OSM Overpass query failed");
    
    const data = await response.json();
    const places: string[] = [];
    
    if (data.elements && Array.isArray(data.elements)) {
      for (const element of data.elements) {
        const tags = element.tags;
        if (!tags) continue;
        
        const name = tags.name;
        const amenity = tags.amenity;
        const building = tags.building;
        const landuse = tags.landuse;
        
        // Gunakan nama tempat jika ada, fallback ke tipe tempat
        if (name) {
          places.push(name);
        } else if (amenity) {
          places.push(amenity.replace(/_/g, " "));
        } else if (building) {
          places.push(building.replace(/_/g, " "));
        } else if (landuse) {
          places.push(landuse.replace(/_/g, " "));
        }
      }
    }
    
    return Array.from(new Set(places)).filter(Boolean);
  } catch (err) {
    console.error("Gagal mengambil data dari OSM Overpass:", err);
    return [];
  }
}

interface MyReport {
  id: string;
  category: keyof typeof CATEGORY_LABEL;
  name: string;
  email: string | null;
  no_hp: string;
  detail_laporan: string;
  status_pelaporan: string;
  kategori_pelaporan: string;
  created_at: string;
  address: string | null;
  photo_url: string | null;
  ip_address: string | null;
  latitude: number;
  longitude: number;
}

function WargaPage() {
  return (
    <DashboardShell title="Lapor Kerusakan Infrastruktur" nav={NAV}>
      <ReportForm />
    </DashboardShell>
  );
}

function ReportForm() {
  const [category, setCategory] = useState<keyof typeof CATEGORY_LABEL>("jalan_berlubang");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [ipStatus, setIpStatus] = useState<"loading" | "ok" | "blocked" | "error">("loading");
  const [userIp, setUserIp] = useState<string | null>(null);
  const [remainingReports, setRemainingReports] = useState(5);
  const ipFetched = useRef(false);
  const [activeCategories, setActiveCategories] = useState<{
    jalan_berlubang: boolean;
  }>({
    jalan_berlubang: true,
  });

  // Ambil pengaturan kategori aktif dari Admin settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aura_system_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        const updated = {
          jalan_berlubang: parsed.catJalan !== false,
        };
        setActiveCategories(updated);

        // Jika default category tidak aktif, pindahkan ke kategori pertama yang aktif
        if (!updated.jalan_berlubang) {
          const firstActive = Object.keys(updated).find(
            (k) => updated[k as keyof typeof updated]
          ) as keyof typeof CATEGORY_LABEL | undefined;
          if (firstActive) {
            setCategory(firstActive);
          }
        }
      }
    } catch (e) {
      console.error("Gagal memuat pengaturan kategori aktif", e);
    }
  }, []);

  // Ambil IP & cek kuota saat halaman pertama dibuka
  useEffect(() => {
    if (ipFetched.current) return;
    ipFetched.current = true;

    (async () => {
      // DEV MODE: bypass IP fetch & RPC check agar bisa ditest tanpa migration SQL
      if (import.meta.env.DEV) {
        setUserIp("dev-mode");
        setRemainingReports(5);
        setIpStatus("ok");
        return;
      }

      // 1. Fetch IP publik
      const ip = await fetchPublicIp();
      if (!ip) { setIpStatus("error"); return; }
      setUserIp(ip);

      // 2. Panggil Supabase RPC: hitung laporan dari IP ini dalam 24 jam terakhir
      //    Fungsi ini kita buat di migration SQL: count_reports_by_ip(_ip TEXT) → INTEGER
      const { data, error } = await supabase.rpc("count_reports_by_ip", { _ip: ip });
      if (error) { 
        console.error("Supabase RPC Error:", error);
        setIpStatus("error"); 
        return; 
      }

      const count = (data as number) ?? 0;
      const remaining = Math.max(0, 5 - count);
      setRemainingReports(remaining);
      setIpStatus(count >= 5 ? "blocked" : "ok");
    })();
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) { toast.error("Browser tidak mendukung geolocation"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("Lokasi terdeteksi");
      },
      (err) => { setLocating(false); toast.error("Gagal ambil lokasi: " + err.message); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const mapUrgencyToKey = (val: string): "low" | "medium" | "high" | "critical" => {
    const norm = (val || "").toLowerCase();
    if (norm.includes("kecil") || norm.includes("ringan") || norm.includes("low")) return "low";
    if (norm.includes("sedang") || norm.includes("medium")) return "medium";
    if (norm.includes("tinggi") || norm.includes("berat") || norm.includes("high") || norm.includes("parah")) return "high";
    if (norm.includes("kritis") || norm.includes("critical") || norm.includes("sangat parah")) return "critical";
    return "medium";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (ipStatus === "blocked") { toast.error("Batas harian tercapai. Coba lagi besok."); return; }
    if (!userIp) { toast.error("IP tidak terdeteksi. Refresh halaman dan coba lagi."); return; }
    if (!coords) { toast.error("Ambil lokasi GPS terlebih dahulu"); return; }

    const parsed = reportSchema.safeParse({
      category, detail_laporan: description, name, email, phone,
      latitude: coords.lat, longitude: coords.lng,
      address,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

    setSubmitting(true);

    // Double-check cooldown di detik terakhir (security layer ke-2)
    const { data: freshCount } = await supabase.rpc("count_reports_by_ip", { _ip: userIp });
    if (((freshCount as number) ?? 0) >= 5) {
      setSubmitting(false);
      setIpStatus("blocked");
      setRemainingReports(0);
      toast.error("Batas harian tercapai. Silakan coba lagi besok (reset setiap 24 jam).");
      return;
    }

    // Upload foto (wajib) – simpan di folder 'anon'
    if (!photo) {
      toast.error("Foto bukti kerusakan wajib dilampirkan");
      return;
    }
    const ext = photo.name.split(".").pop() ?? "jpg";
    const photoPath = `anon/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("reports").upload(photoPath, photo, {
      cacheControl: "3600", upsert: false,
    });
    if (upErr) {
      setSubmitting(false);
      toast.error("Gagal upload foto: " + upErr.message);
      return;
    }

    // 1. Kirim berkas gambar & GPS ke API Kecerdasan Buatan (Hugging Face)
    let aiResponse: any = null;
    try {
      const apiFormData = new FormData();
      apiFormData.append("file", photo);
      apiFormData.append("lat", String(parsed.data.latitude));
      apiFormData.append("lon", String(parsed.data.longitude));

      const apiRes = await fetch("https://dennis1645-aura-ai.hf.space/api/v1/analyze", {
        method: "POST",
        body: apiFormData,
      });

      if (!apiRes.ok) {
        throw new Error(`API AI merespon dengan status ${apiRes.status}`);
      }

      aiResponse = await apiRes.json();
    } catch (apiErr: any) {
      setSubmitting(false);
      toast.error("Gagal melakukan analisis AI: " + apiErr.message);
      return;
    }

    // 2. Ambil data tempat sekitar dari OSM Overpass API secara realtime di sisi klien
    let osmPlaces: string[] = [];
    try {
      osmPlaces = await fetchOSMPlaces(parsed.data.latitude, parsed.data.longitude);
    } catch (err) {
      console.error("Gagal mengambil data OSM Overpass di onSubmit:", err);
    }

    // Gabungkan fasilitas dari AI response dan OSM Overpass
    const combinedFasilitas = Array.from(new Set([
      ...(aiResponse.Konteks_Geospasial?.Fasilitas_Radius_300m || []),
      ...osmPlaces
    ])).filter(Boolean);

    // 3. Simpan Laporan Utama ke tabel public.laporan_jalan
    const { data: jalanData, error: jalanErr } = await supabase
      .from("laporan_jalan")
      .insert({
        image_file: photoPath,
        total_lubang_terdeteksi: aiResponse.Total_Lubang_Terdeteksi ?? 0,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        detail_lokasi: aiResponse.Konteks_Geospasial?.Detail_Lokasi || parsed.data.address,
      })
      .select("id")
      .single();

    if (jalanErr || !jalanData) {
      setSubmitting(false);
      toast.error("Gagal menyimpan data laporan jalan: " + (jalanErr?.message || "Unknown error"));
      return;
    }

    const laporanId = jalanData.id;

    // 4. Simpan Fasilitas Radius 300 meter ke tabel public.fasilitas_radius
    if (combinedFasilitas.length > 0) {
      const insertFasilitas = combinedFasilitas.map((nama: string) => ({
        laporan_id: laporanId,
        nama_fasilitas: nama,
      }));
      const { error: fasErr } = await supabase.from("fasilitas_radius").insert(insertFasilitas);
      if (fasErr) {
        console.error("Gagal menyimpan fasilitas sekitar ke database:", fasErr.message);
      }
    }

    // Tentukan tingkat urgensi berdasarkan fasilitas sekitar (OSM)
    const hasCritical = combinedFasilitas.some((place: string) => {
      const norm = place.toLowerCase();
      return norm.includes("sekolah") || norm.includes("school") || 
             norm.includes("sd") || norm.includes("smp") || 
             norm.includes("sma") || norm.includes("smk") || 
             norm.includes("madrasah") || norm.includes("tk") ||
             norm.includes("rumah sakit") || norm.includes("hospital") || 
             norm.includes("klinik") || norm.includes("clinic") || 
             norm.includes("puskesmas") || norm.includes("apotek");
    });

    const hasMedium = combinedFasilitas.some((place: string) => {
      const norm = place.toLowerCase();
      return norm.includes("pemukiman") || norm.includes("residential") || 
             norm.includes("perumahan") || norm.includes("apartmen") || 
             norm.includes("kampung") || norm.includes("residence") || 
             norm.includes("house") || norm.includes("griya") || 
             norm.includes("kost") || norm.includes("warga");
    });

    let determinedUrgencyKey: "low" | "medium" | "high" | "critical" = "low";
    if (hasCritical) {
      determinedUrgencyKey = "critical";
    } else if (hasMedium) {
      determinedUrgencyKey = "medium";
    } else {
      determinedUrgencyKey = "low";
    }

    const urgencyLabelMap = {
      low: "Ringan",
      medium: "Sedang",
      high: "Tinggi",
      critical: "Kritis",
    };

    const determinedUrgencyOSMLabel = urgencyLabelMap[determinedUrgencyKey];

    // 5. Simpan Detail Analisis Lubang ke tabel public.detail_lubang
    const daftarAnalisis = aiResponse.Analisis_Kerusakan || [];
    const parsePctValue = (val: string | number) => {
      if (typeof val === "number") return val;
      if (!val) return 0;
      return parseFloat(val.replace("%", "")) || 0;
    };

    if (daftarAnalisis.length > 0) {
      const insertDetail = daftarAnalisis.map((item: any) => ({
        laporan_id: laporanId,
        severity_visual: item.Severity_Visual || item.Severity || "Kecil",
        persentase_kerusakan: parsePctValue(item.Persentase_Kerusakan || item["Persentase Kerusakan"]),
        persentase_kedalaman: parsePctValue(item.Persentase_Kedalaman || item["Persentase Kedalaman"]),
        kategori_pelaporan_osm: determinedUrgencyOSMLabel,
        nilai_score: item.Severity_Scoring?.Nilai_Score ?? 0,
        status_score: item.Severity_Scoring?.Status_Score ?? "Baik",
        petugas_penanganan: item.Severity_Scoring?.Petugas_Penanganan || "Dinas PUPR Kota Cirebon",
        estimasi_waktu_penanganan: item.Severity_Scoring?.Estimasi_Waktu_Penanganan || "24 Jam",
      }));
      const { error: detErr } = await supabase.from("detail_lubang").insert(insertDetail);
      if (detErr) {
        console.error("Gagal menyimpan analisis detail lubang:", detErr.message);
      }
    } else {
      // Fallback jika AI tidak menemukan lubang visual di jalan tersebut
      const { error: detErr } = await supabase.from("detail_lubang").insert({
        laporan_id: laporanId,
        severity_visual: "Kecil",
        persentase_kerusakan: 0,
        persentase_kedalaman: 0,
        kategori_pelaporan_osm: determinedUrgencyOSMLabel,
        nilai_score: 0,
        status_score: "Baik",
        petugas_penanganan: "Dinas PUPR Kota Cirebon",
        estimasi_waktu_penanganan: "24 Jam",
      });
      if (detErr) {
        console.error("Gagal menyimpan detail default lubang:", detErr.message);
      }
    }

    // 6. Update Akumulasi Indeks ALI Global ke tabel public.metadata_ali
    const indexAliTerbaru = aiResponse.AURA_Location_Index_Kumulatif ?? 0;
    if (indexAliTerbaru > 0) {
      const { error: aliErr } = await supabase
        .from("metadata_ali")
        .update({ total_index_ali: indexAliTerbaru })
        .eq("id", 1);
      if (aliErr) {
        console.error("Gagal memperbarui total index ALI:", aliErr.message);
      }
    }

    // 7. Simpan Laporan Utama ke data backup tabel reports untuk kelayakan admin panel
    const { data: newReportData, error: reportsBackupErr } = await supabase.from("reports").insert({
      reporter_id: null,
      ip_address: userIp,
      category: parsed.data.category,
      name: parsed.data.name,
      email: parsed.data.email,
      no_hp: parsed.data.phone,
      detail_laporan: parsed.data.detail_laporan,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      address: parsed.data.address,
      photo_url: photoPath,
      kategori_pelaporan: determinedUrgencyKey,
      status_pelaporan: "pending",
    }).select("id").single();

    setSubmitting(false);
    if (reportsBackupErr) {
      console.error("Gagal menyimpan data backup laporan:", reportsBackupErr.message);
    } else if (newReportData) {
      // Jalankan Auto-Assign jika diaktifkan di pengaturan sistem
      try {
        const savedSettings = localStorage.getItem("aura_system_settings");
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          if (parsedSettings.enableAutoAssign) {
            const { error: rpcErr } = await supabase.rpc("assign_petugas_auto", {
              report_id: newReportData.id
            });
            if (rpcErr) {
              console.error("Gagal memproses Auto-Assign via RPC:", rpcErr.message);
            } else {
              console.log("Auto-Assign berhasil via RPC untuk laporan ID:", newReportData.id);
            }
          }
        }
      } catch (e) {
        console.error("Gagal memproses Auto-Assign:", e);
      }
    }

    toast.success("Laporan berhasil dikirim dan dianalisis oleh AI!");
    setDescription(""); setAddress(""); setPhoto(null); setCoords(null);
    setName(""); setEmail(""); setPhone("");

    const newRemaining = Math.max(0, remainingReports - 1);
    setRemainingReports(newRemaining);
    if (newRemaining === 0) setIpStatus("blocked");
  };

  const formDisabled = ipStatus === "blocked" || ipStatus === "loading";

  const IpBanner = () => {
    if (ipStatus === "loading") return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        <span>Mendeteksi perangkat Anda…</span>
      </div>
    );
    if (ipStatus === "error") return (
      <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        <span>Tidak dapat mendeteksi jaringan. Pastikan internet aktif lalu refresh halaman.</span>
      </div>
    );
    if (ipStatus === "blocked") return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
        <Clock className="h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">Batas harian tercapai</p>
          <p className="text-xs opacity-80 mt-0.5">
            Anda sudah mengirim 3 laporan hari ini. Kuota reset otomatis setelah 24 jam.
          </p>
        </div>
      </div>
    );
    return (
      <div className="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm">
        <span className="text-green-700 dark:text-green-400 text-xs">
          IP terdeteksi: <code className="font-mono">{userIp}</code>
        </span>
        <span className="font-semibold text-green-700 dark:text-green-400">
          Sisa kuota: {remainingReports}/5
        </span>
      </div>
    );
  };

  return (
    <Card className="p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-leaf-gradient text-primary-foreground">
          <Plus className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Buat laporan baru</h2>
          <p className="text-xs text-muted-foreground">Tanpa akun · Maks. 5 laporan per hari per perangkat.</p>
        </div>
      </div>

      <div className="mt-4"><IpBanner /></div>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nama Lengkap</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama lengkap Anda" disabled={formDisabled} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com" disabled={formDisabled} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">No. HP / WhatsApp</Label>
          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="Contoh: 08123456789" disabled={formDisabled} required />
        </div>

        <div className="space-y-1.5">
          <Label>Kategori kerusakan</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as keyof typeof CATEGORY_LABEL)} disabled={formDisabled}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABEL)
                .filter(([k]) => activeCategories[k as keyof typeof activeCategories])
                .map(([k, v]) => {
                  const Icon = CATEGORY_ICON[k as keyof typeof CATEGORY_ICON];
                  return (
                    <SelectItem key={k} value={k}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" /><span>{v}</span>
                      </div>
                    </SelectItem>
                  );
                })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="desc">Detail Laporan</Label>
          <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan detail kondisi, ukuran, dan dampak kerusakan…" rows={3} disabled={formDisabled} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">Alamat Lengkap</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)}
            placeholder="Patokan / nama jalan" disabled={formDisabled} required />
        </div>

        <div className="space-y-1.5">
          <Label>Lokasi GPS</Label>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={getLocation}
              disabled={locating || formDisabled}>
              {locating
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <Crosshair className="mr-2 h-4 w-4" />}
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
          <Label htmlFor="photo">Foto Bukti Kerusakan</Label>
          <div className="flex items-center gap-3">
            <label htmlFor="photo"
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground hover:border-primary/40">
              <Camera className="h-4 w-4" /> {photo ? photo.name : "Pilih foto (Wajib)"}
            </label>
            <input id="photo" type="file" accept="image/*" capture="environment" className="sr-only"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} disabled={formDisabled} required />
          </div>
        </div>

        <Button type="submit"
          disabled={submitting || formDisabled || ipStatus === "error"}
          className="w-full bg-leaf-gradient text-primary-foreground hover:opacity-90">
          {submitting
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim…</>
            : <><FileText className="mr-2 h-4 w-4" /> Kirim laporan</>}
        </Button>
      </form>
    </Card>
  );
}

// ── Daftar laporan terbaru (semua, bukan per user) ─────────
function RecentReportsList() {
  const [reports, setReports] = useState<MyReport[] | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      setReports((data ?? []) as MyReport[]);
    };
    load();
    const channel = supabase
      .channel("recent-reports")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reports" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <Card className="p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
          <ListChecks className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Laporan terbaru</h2>
          <p className="text-xs text-muted-foreground">{reports?.length ?? 0} laporan termuat</p>
        </div>
      </div>
      <div className="mt-4 max-h-[640px] space-y-3 overflow-y-auto pr-2">
        {reports === null && <p className="text-sm text-muted-foreground">Memuat…</p>}
        {reports?.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Belum ada laporan. Jadilah yang pertama!
          </div>
        )}
        {reports?.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  {(() => { const Icon = CATEGORY_ICON[r.category]; return <Icon className="h-3 w-3" />; })()}
                  <span>{CATEGORY_LABEL[r.category]}</span>
                  <span>·</span>
                  <span>{formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: idLocale })}</span>
                </p>
                <p className="mt-0.5 truncate font-medium">{r.name} - {r.no_hp}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge variant="outline" className={r.status_pelaporan === 'progress' ? STATUS_TONE.in_progress : (STATUS_TONE[r.status_pelaporan as keyof typeof STATUS_TONE] || 'bg-secondary text-secondary-foreground')}>
                  {r.status_pelaporan === 'progress' ? 'Dikerjakan' : (STATUS_LABEL[r.status_pelaporan as keyof typeof STATUS_LABEL] || r.status_pelaporan)}
                </Badge>
                <Badge variant="outline" className={r.kategori_pelaporan === 'ringan' ? URGENCY_TONE.low : (URGENCY_TONE[r.kategori_pelaporan as keyof typeof URGENCY_TONE] || 'bg-secondary text-secondary-foreground')}>
                  {r.kategori_pelaporan === 'ringan' ? 'Ringan' : (URGENCY_LABEL[r.kategori_pelaporan as keyof typeof URGENCY_LABEL] || r.kategori_pelaporan)}
                </Badge>
              </div>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{r.detail_laporan}</p>
            {r.address && (
              <p className="mt-1 text-xs text-muted-foreground">
                <MapPin className="mr-1 inline h-3 w-3" />{r.address}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
