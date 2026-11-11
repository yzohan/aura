import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Target, Globe2, Crosshair, Network, User, UserCog, ShieldCheck, CheckCircle2,
  TrendingUp, HardHat, Brain, PieChart, Code2, ArrowRight,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { PageHero } from "@/components/page-hero";
import { CtaBanner } from "@/components/cta-banner";
import ciputatImg from "@/assets/ciputat_road.jpg";

export const Route = createFileRoute("/tentang")({
  head: () => ({
    meta: [
      { title: "Tentang" },
      { name: "description", content: "Kenali AURA: ekosistem tata kota cerdas yang menyatukan warga, petugas, dan dinas untuk infrastruktur publik yang lebih baik." },
      { property: "og:title", content: "Tentang AURA" },
      { property: "og:description", content: "Visi dan misi AURA dalam membangun tata kota yang responsif dan inklusif." },
    ],
  }),
  component: AboutPage,
});

const Icon = ({ children, dark = true }: { children: React.ReactNode; dark?: boolean }) => (
  <span className={`flex h-14 w-14 items-center justify-center rounded-full ${dark ? "bg-forest text-primary" : "bg-white text-forest"}`}>{children}</span>
);

function AboutPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader overlay />
      <main className="flex-1">
        <PageHero
          pill="Tentang"
          title="Tentang AURA"
          subtitle="Solusi tuntas untuk infrastruktur publik — bukan sekadar platform pelaporan."
        />

        {/* APA YANG KAMI KERJAKAN */}
        <section className="mx-auto max-w-[1200px] px-4 py-14">
          <div className="mb-8 grid items-end gap-4 md:grid-cols-[1.4fr_1fr]">
            <div className="space-y-4">
              <span className="inline-flex w-fit rounded-full bg-sage px-4 py-1.5 text-xs font-bold text-forest">Apa yang kami kerjakan</span>
              <h2 className="text-3xl font-extrabold text-forest md:text-4xl dark:text-foreground">Menjaga jalan kota tetap aman dan terpantau</h2>
            </div>
            <p className="text-sm text-muted-foreground">AURA menghubungkan warga, petugas, dan admin dalam satu ekosistem berbasis data spasial.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="card-dashed p-7">
              <Icon><Target className="h-6 w-6" /></Icon>
              <h3 className="mt-6 text-xl font-extrabold text-forest">Fokus pada Mobilitas</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Jalan berlubang adalah sumber risiko harian pengendara. AURA memprioritaskan kerusakan jalan yang paling mengganggu mobilitas warga Tangerang Selatan.
              </p>
            </div>
            <div className="card-dashed p-7">
              <Icon><Globe2 className="h-6 w-6" /></Icon>
              <h3 className="mt-6 text-xl font-extrabold text-forest">Berbasis GIS</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Setiap laporan tersimpan sebagai titik koordinat pada peta, sehingga sebaran dan kepadatan kerusakan terlihat jelas secara real-time.
              </p>
            </div>
            <div className="card-dashed flex flex-col p-7 md:row-span-2">
              <Icon><Crosshair className="h-6 w-6" /></Icon>
              <h3 className="mt-6 text-xl font-extrabold text-forest">Validitas Data Spasial</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Verifikasi AI dan pencocokan koordinat memastikan setiap laporan akurat, tidak duplikat, dan layak ditindaklanjuti.
              </p>
              <div className="mt-auto space-y-3 rounded-3xl bg-card p-5 pt-5">
                <div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide"><span>Akurasi lokasi</span><span>96%</span></div>
                  <div className="mt-2 h-2 rounded-full bg-sage"><div className="h-2 w-[96%] rounded-full bg-forest" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide"><span>Laporan duplikat</span><span>&lt; 3%</span></div>
                  <div className="mt-2 h-2 rounded-full bg-sage"><div className="h-2 w-[10%] rounded-full bg-primary" /></div>
                </div>
                <p className="flex items-center gap-2 text-xs font-semibold"><CheckCircle2 className="h-4 w-4 text-forest" /> Terverifikasi otomatis</p>
              </div>
            </div>

            <div className="card-dashed p-7 md:col-span-2">
              <div className="flex items-center gap-4">
                <Icon><Network className="h-6 w-6" /></Icon>
                <div>
                  <h3 className="text-xl font-extrabold text-forest">Tiga Entitas Satu Alur</h3>
                  <p className="text-sm text-muted-foreground">Peran yang jelas, alur yang tidak terputus.</p>
                </div>
              </div>
              <div className="mt-8 flex items-center justify-between gap-2">
                {[{ i: User, t: "Warga", d: "pelapor" }, { i: UserCog, t: "Petugas", d: "eksekutor" }, { i: ShieldCheck, t: "Admin", d: "pengawas" }].map((r, idx) => (
                  <div key={r.t} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center text-center">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-forest text-primary md:h-20 md:w-20"><r.i className="h-7 w-7" /></span>
                      <p className="mt-3 font-extrabold">{r.t}</p>
                      <p className="text-xs text-muted-foreground">{r.d}</p>
                    </div>
                    {idx < 2 && (
                      <div className="mx-2 flex flex-1 items-center">
                        <div className="h-0 flex-1 border-t-2 border-dashed border-forest/30" />
                        <span className="mx-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><ArrowRight className="h-4 w-4" /></span>
                        <div className="h-0 flex-1 border-t-2 border-dashed border-forest/30" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* DAMPAK NYATA */}
        <section className="mx-auto max-w-[1200px] px-4 pb-14">
          <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <div className="relative min-h-[420px] overflow-hidden rounded-[36px] bg-forest text-white">
              <img src={ciputatImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/50 to-transparent" />
              <span className="absolute left-6 top-6 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground">Dampak nyata</span>
              <div className="absolute inset-x-8 bottom-8">
                <h3 className="max-w-md text-3xl font-extrabold text-balance md:text-4xl">Bekerja dengan tujuan untuk kota yang lebih baik</h3>
                <p className="mt-2 max-w-md text-sm text-white/80">Setiap laporan yang selesai berarti satu ruas jalan lebih aman bagi warga.</p>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="flex items-center justify-between rounded-[28px] bg-forest p-6 text-white">
                <div><p className="text-sm">Laporan Selesai</p><p className="mt-2 text-5xl font-extrabold text-primary">2.4k+</p></div>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground"><CheckCircle2 className="h-5 w-5" /></span>
              </div>
              <div className="flex items-center justify-between rounded-[28px] bg-sage p-6 text-forest">
                <div><p className="text-sm">Penyelesaian</p><p className="mt-2 text-5xl font-extrabold">94%</p></div>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-forest text-primary"><TrendingUp className="h-5 w-5" /></span>
              </div>
              <div className="flex items-center justify-between rounded-[28px] border border-border bg-card p-6 shadow-soft">
                <div><p className="text-sm text-muted-foreground">Petugas Siaga</p><p className="mt-2 text-5xl font-extrabold">37</p></div>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sage text-forest"><HardHat className="h-5 w-5" /></span>
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