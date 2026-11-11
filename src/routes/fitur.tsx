import { createFileRoute } from "@tanstack/react-router";
import {
  Camera, MapPin, Bell, BarChart3, ShieldCheck, ClipboardList, Gauge, Database, ArrowRight,
  Smartphone, Cpu, CheckCircle2, ChevronDown, X, Wand2,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { PageHero } from "@/components/page-hero";
import { CtaBanner } from "@/components/cta-banner";
import pamulangImg from "@/assets/pamulang_road.jpg";
import pondokImg from "@/assets/pondok_aren_road.png";

export const Route = createFileRoute("/fitur")({
  head: () => ({
    meta: [
      { title: "Fitur" },
      { name: "description", content: "Fitur AURA: pelaporan instan dengan foto & GPS, dashboard GIS real-time, work order otomatis ke petugas, dan analitik kota." },
      { property: "og:title", content: "Fitur AURA" },
      { property: "og:description", content: "Pelaporan instan, GIS real-time, work order otomatis, dan analitik kota." },
    ],
  }),
  component: FeaturesPage,
});

function More({ light = false }: { light?: boolean }) {
  return (
    <span className={`mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold ${light ? "text-primary" : "text-forest"}`}>
      Pelajari <ArrowRight className="h-4 w-4" />
    </span>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex w-fit rounded-full bg-sage px-4 py-1.5 text-xs font-bold text-forest">{children}</span>;
}

function FeaturesPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader overlay />
      <main className="flex-1">
        <PageHero
          pill="Fitur"
          title="Fitur lengkap AURA"
          subtitle="Semua yang dibutuhkan untuk mendeteksi, memetakan, dan menangani kerusakan infrastruktur publik."
        />

        <section className="mx-auto max-w-[1200px] px-4 py-14">
          <div className="mb-8 grid items-end gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <Pill>Kemampuan Platform</Pill>
              <h2 className="text-3xl font-extrabold text-forest md:text-4xl dark:text-foreground">Delapan fitur dalam satu alur kerja</h2>
            </div>
            <p className="text-sm text-muted-foreground md:max-w-xs md:justify-self-end">
              Dari laporan warga sampai bukti perbaikan, semuanya terhubung dan bisa dipantau.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-4">
            <div className="flex min-h-[340px] flex-col rounded-[32px] bg-forest p-8 text-white md:col-span-2">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><Camera className="h-6 w-6" /></span>
              <h3 className="mt-8 text-3xl font-extrabold">Lapor Instan</h3>
              <p className="mt-3 max-w-sm text-white/75">Foto, lokasi GPS, kategori, dan deskripsi dalam satu form ringkas.</p>
              <More light />
            </div>

            <div className="relative flex min-h-[340px] flex-col overflow-hidden rounded-[32px] p-6 text-white">
              <img src={pamulangImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/50 to-transparent" />
              <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground"><MapPin className="h-5 w-5" /></span>
              <div className="relative mt-auto">
                <h3 className="text-2xl font-extrabold">Peta GIS Real-time</h3>
                <p className="mt-1 text-sm text-white/80">Sebaran laporan, status, dan urgensi di peta.</p>
                <More light />
              </div>
            </div>

            <div className="flex min-h-[340px] flex-col rounded-[32px] bg-sage p-6 text-forest">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest text-primary"><ClipboardList className="h-6 w-6" /></span>
              <h3 className="mt-6 text-2xl font-extrabold">Work Order Otomatis</h3>
              <p className="mt-2 text-sm text-forest/75">Admin menugaskan petugas langsung dari dashboard.</p>
              <More />
            </div>

            <div className="card-dashed flex min-h-[340px] flex-col p-6">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-forest"><Bell className="h-6 w-6" /></span>
              <h3 className="mt-6 text-2xl font-extrabold text-forest">Update Status</h3>
              <p className="mt-2 text-sm text-muted-foreground">Warga memantau laporan dari pending sampai selesai.</p>
              <More />
            </div>

            <div className="relative flex min-h-[340px] flex-col overflow-hidden rounded-[32px] p-6 text-white">
              <img src={pondokImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/50 to-transparent" />
              <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground"><BarChart3 className="h-5 w-5" /></span>
              <div className="relative mt-auto">
                <h3 className="text-2xl font-extrabold">Analitik Kota</h3>
                <p className="mt-1 text-sm text-white/80">Statistik kategori, urgensi, response time per wilayah.</p>
                <More light />
              </div>
            </div>

            <div className="flex min-h-[340px] flex-col rounded-[32px] bg-forest p-6 text-white md:col-span-2">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><ShieldCheck className="h-6 w-6" /></span>
              <h3 className="mt-6 text-2xl font-extrabold">Akses Aman</h3>
              <p className="mt-2 max-w-sm text-sm text-white/75">Row-level security, tiap pengguna hanya melihat data yang berhak.</p>
              <More light />
            </div>

            <div className="flex min-h-[300px] flex-col rounded-[32px] bg-sage p-8 text-forest md:col-span-2">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest text-primary"><Gauge className="h-6 w-6" /></span>
              <h3 className="mt-6 text-3xl font-extrabold">Indeks Urgensi</h3>
              <p className="mt-2 text-forest/75">Rendah, Sedang, Tinggi, Kritis. Prioritas perbaikan terukur jelas.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {[["Rendah", "#9db88a"], ["Sedang", "#f2c23b"], ["Tinggi", "#e8752f"], ["Kritis", "#d64545"]].map(([l, c]) => (
                  <span key={l} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold">
                    <span className="h-3 w-3 rounded-full" style={{ background: c }} /> {l}
                  </span>
                ))}
              </div>
              <More />
            </div>

            <div className="card-dashed flex min-h-[300px] flex-col p-8 md:col-span-2">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-forest"><Database className="h-6 w-6" /></span>
              <h3 className="mt-6 text-3xl font-extrabold text-forest">Data Terpusat</h3>
              <p className="mt-2 text-muted-foreground">Riwayat laporan dan bukti perbaikan untuk audit.</p>
              <More />
            </div>
          </div>
        </section>

        <section className="rounded-t-[48px] bg-sage-soft py-16 md:rounded-t-[64px] dark:bg-card">
          <div className="mx-auto max-w-[1200px] px-4">
            <div className="mx-auto mb-10 max-w-2xl space-y-4 text-center">
              <Pill>Cara kerja</Pill>
              <h2 className="text-3xl font-extrabold text-forest md:text-4xl dark:text-foreground">Tiga langkah dari laporan sampai jalan mulus</h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {/* 01 */}
              <div className="flex flex-col rounded-[32px] border border-border bg-card p-6 shadow-soft">
                <div className="flex items-start justify-between">
                  <span className="text-5xl font-extrabold text-forest dark:text-foreground">01</span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage text-forest"><Smartphone className="h-5 w-5" /></span>
                </div>
                <h3 className="mt-3 text-2xl font-extrabold">Lapor</h3>
                <p className="mt-1 text-sm text-muted-foreground">Warga memotret lubang, lokasi terisi otomatis.</p>
                <div className="mx-auto mt-8 w-full max-w-[240px] rounded-[32px] border-[8px] border-forest bg-card p-3">
                  <div className="flex items-center justify-between text-xs font-bold"><span>Buat Laporan</span><X className="h-3 w-3" /></div>
                  <div className="mt-3 flex h-24 items-end rounded-2xl bg-secondary p-2">
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">Foto terambil</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 rounded-full bg-secondary px-3 py-2 text-[11px]"><MapPin className="h-3 w-3" /> Jl. Pahlawan Seribu, BSD</div>
                  <div className="mt-2 flex items-center justify-between rounded-full bg-secondary px-3 py-2 text-[11px]">Kategori: Jalan berlubang <ChevronDown className="h-3 w-3" /></div>
                  <div className="mt-3 rounded-full bg-forest py-2.5 text-center text-[11px] font-bold text-white">Kirim Laporan</div>
                </div>
              </div>

              {/* 02 */}
              <div className="flex flex-col rounded-[32px] border border-border bg-card p-6 shadow-soft">
                <div className="flex items-start justify-between">
                  <span className="text-5xl font-extrabold text-forest dark:text-foreground">02</span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage text-forest"><Cpu className="h-5 w-5" /></span>
                </div>
                <h3 className="mt-3 text-2xl font-extrabold">Verifikasi AI dan penugasan</h3>
                <p className="mt-1 text-sm text-muted-foreground">AI menilai kerusakan, admin menugaskan petugas.</p>
                <div className="mt-8 rounded-3xl bg-sage-soft p-3 dark:bg-secondary">
                  <div className="flex items-center justify-between px-1 text-xs font-bold">
                    <span>Dashboard Admin</span>
                    <span className="rounded-full bg-forest px-2 py-0.5 text-[10px] text-primary">3 baru</span>
                  </div>
                  <div className="mt-2 rounded-2xl bg-card p-3">
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-10 rounded-xl bg-secondary" />
                      <div className="flex-1 text-[11px]"><p className="font-bold">#AURA-4028</p><p className="text-muted-foreground">Jl. Pahlawan Seribu</p></div>
                      <span className="rounded-full bg-orange/15 px-2 py-0.5 text-[10px] font-bold text-orange">Tinggi</span>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 rounded-full bg-sage px-3 py-1 text-[10px] font-bold"><Wand2 className="h-3 w-3" /> AI: Jalan berlubang 94.6%</p>
                  </div>
                  <div className="mt-2 rounded-2xl bg-card p-3 text-[11px]">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Tugaskan ke</p>
                    <div className="flex items-center justify-between rounded-xl bg-sage-soft p-2"><span><b>Agus Pratama</b><br /><span className="text-muted-foreground">1,2 km dari lokasi</span></span><CheckCircle2 className="h-4 w-4 text-forest" /></div>
                    <div className="mt-1 p-2"><b>Rudi Hartono</b><br /><span className="text-muted-foreground">2,8 km dari lokasi</span></div>
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2 rounded-full bg-forest py-3 text-xs font-bold text-white">Buat Work Order <ArrowRight className="h-3 w-3" /></div>
                </div>
              </div>

              {/* 03 */}
              <div className="flex flex-col rounded-[32px] border border-border bg-card p-6 shadow-soft">
                <div className="flex items-start justify-between">
                  <span className="text-5xl font-extrabold text-forest dark:text-foreground">03</span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground"><CheckCircle2 className="h-5 w-5" /></span>
                </div>
                <h3 className="mt-3 text-2xl font-extrabold">Pantau status</h3>
                <p className="mt-1 text-sm text-muted-foreground">Warga melihat progres sampai perbaikan selesai.</p>
                <div className="mx-auto mt-8 w-full max-w-[240px] rounded-[32px] border-[8px] border-forest bg-card p-3">
                  <p className="text-xs font-bold">Status Laporan</p>
                  <div className="mt-2 rounded-2xl bg-primary p-3 text-primary-foreground">
                    <p className="text-[10px]">Tiket</p>
                    <p className="text-sm font-extrabold">#AURA-4028</p>
                    <p className="text-[10px]">Jl. Pahlawan Seribu, BSD</p>
                  </div>
                  <ul className="mt-3 space-y-2 text-[11px]">
                    {[["Laporan diterima", "08.12", true], ["Terverifikasi AI", "08.13", true], ["Petugas ditugaskan", "09.40", true], ["Sedang diperbaiki", "Estimasi hari ini", false], ["Selesai", "", false]].map(([t, h, done]) => (
                      <li key={t as string} className="flex items-center gap-2">
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full ${done ? "bg-forest text-primary" : "border-2 border-primary"}`}>
                          {done && <CheckCircle2 className="h-3 w-3" />}
                        </span>
                        <span><b>{t as string}</b>{h && <><br /><span className="text-muted-foreground">{h as string}</span></>}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <CtaBanner />
      </main>
      <SiteFooter />
    </div>
  );
}