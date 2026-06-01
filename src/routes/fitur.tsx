import { createFileRoute } from "@tanstack/react-router";
import {
  Camera, MapPin, Bell, BarChart3, Users, ShieldCheck, Wrench, Layers, Database,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/fitur")({
  head: () => ({
    meta: [
      { title: "Fitur" },
      {
        name: "description",
        content:
          "Fitur AURA: pelaporan instan dengan foto & GPS, dashboard GIS real-time, work order otomatis ke petugas, dan analitik kota.",
      },
      { property: "og:title", content: "Fitur AURA" },
      { property: "og:description", content: "Pelaporan instan, GIS real-time, work order otomatis, dan analitik kota." },
    ],
  }),
  component: FeaturesPage,
});

const FEATURES = [
  { icon: Camera, t: "Lapor Instan", d: "Foto, lokasi GPS, kategori, dan deskripsi dalam satu form ringkas." },
  { icon: MapPin, t: "Peta GIS Real-time", d: "Sebaran laporan, status, dan tingkat urgensi tervisualisasi di peta." },
  { icon: Wrench, t: "Work Order Otomatis", d: "Admin menugaskan petugas lapangan langsung dari dashboard." },
  { icon: Bell, t: "Update Status", d: "Warga memantau perkembangan laporannya dari pending sampai selesai." },
  { icon: BarChart3, t: "Analitik Kota", d: "Statistik kategori, urgensi, dan response time per wilayah." },
  { icon: ShieldCheck, t: "Akses Aman", d: "Row-level security memastikan setiap user hanya akses data yang berhak." },
  { icon: Layers, t: "Indeks Urgensi", d: "Klasifikasi rendah, sedang, tinggi, kritis untuk prioritas penanganan." },
  { icon: Database, t: "Data Terpusat", d: "Riwayat laporan dan bukti perbaikan tersimpan rapi untuk audit." },
];

function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Fitur lengkap AURA</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Semua yang dibutuhkan untuk mendeteksi, memetakan, dan menangani kerusakan infrastruktur publik.
          </p>
        </section>
        <section className="container mx-auto grid gap-6 px-4 pb-20 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:shadow-elev">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-leaf-gradient text-primary-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
