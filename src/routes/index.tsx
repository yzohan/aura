import { useEffect, useRef, useState, ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  MapPin,
  Camera,
  Wrench,
  ShieldCheck,
  Activity,
  Leaf,
  Lightbulb,
  Footprints,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Quote,
  Sparkles,
  AlertCircle,
  Info,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import heroImg from "@/assets/hero-city.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AURA" },
      {
        name: "description",
        content:
          "AURA membantu warga melaporkan kerusakan jalan, trotoar, dan PJU. Admin dinas memantau lewat peta GIS real-time dan menugaskan petugas lapangan secara otomatis.",
      },
      { property: "og:title", content: "AURA — Ekosistem Tata Kota Cerdas" },
      {
        property: "og:description",
        content:
          "Lapor kerusakan infrastruktur kota dalam hitungan detik. Pantau penanganan secara real-time melalui dashboard GIS.",
      },
    ],
  }),
  component: HomePage,
});

const PARTNERS = ["Dinas PUPR", "Dishub", "PJU Kota", "Tata Ruang", "Bappeda", "Kominfo"];

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden grain">
          <div className="absolute inset-0 grid-pattern opacity-60" />
          <div
            className="pointer-events-none absolute -top-40 -right-32 h-[480px] w-[480px] rounded-full opacity-35 blur-3xl animate-pulse-glow will-change-gpu"
            style={{ background: "radial-gradient(closest-side, var(--primary-glow), transparent)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl animate-pulse-glow animation-delay-300 will-change-gpu"
            style={{ background: "radial-gradient(closest-side, var(--accent), transparent)" }}
          />

          <div className="container relative mx-auto grid gap-12 px-4 py-20 md:grid-cols-[1.05fr_1fr] md:py-28">
            <div className="flex flex-col justify-center">
              <Badge className="w-fit gap-1.5 border-primary/20 bg-primary/10 px-3 py-1 text-primary hover:bg-primary/15 animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Live di 3 kelurahan percontohan
              </Badge>

              <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance md:text-[3.75rem] md:leading-[1.05] animate-fade-in-up animation-delay-100">
                Kota yang{" "}
                <span className="relative inline-block text-primary">
                  menyembuhkan
                  <svg
                    aria-hidden
                    viewBox="0 0 220 14"
                    className="absolute -bottom-1 left-0 h-3 w-full text-primary/40"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 9 C 60 2, 140 2, 218 9"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{" "}
                dirinya sendiri.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground text-balance animate-fade-in-up animation-delay-200">
                AURA mengintegrasikan warga, petugas lapangan, dan admin dinas dalam satu alur
                kerja terpadu — dari laporan foto di trotoar sampai work order yang selesai sore
                itu juga.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 animate-fade-in-up animation-delay-300">
                <Button
                  asChild
                  size="lg"
                  className="bg-leaf-gradient text-primary-foreground shadow-elev hover:opacity-90 hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  <Link to="/warga">
                    Lapor Sekarang <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="hover:bg-secondary/50 hover:scale-105 active:scale-95 transition-all duration-300">
                  <Link to="/fitur">Lihat cara kerjanya</Link>
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground animate-fade-in-up animation-delay-400">
                <div className="flex items-center gap-2 group cursor-default">
                  <ShieldCheck className="h-4 w-4 text-primary transition-transform duration-300 group-hover:scale-110" /> Data spasial terverifikasi
                </div>
                <div className="flex items-center gap-2 group cursor-default">
                  <Activity className="h-4 w-4 text-primary transition-transform duration-300 group-hover:scale-110" /> Update tiap detik
                </div>
                <div className="flex items-center gap-2 group cursor-default">
                  <Leaf className="h-4 w-4 text-primary transition-transform duration-300 group-hover:scale-110" /> Eco-urban first
                </div>
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative animate-fade-in-up animation-delay-200">
              <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-leaf-gradient opacity-25 blur-2xl animate-pulse-glow" />
              <div className="relative overflow-hidden rounded-3xl ring-1 ring-border shadow-elev group">
                <img
                  src={heroImg}
                  alt="Ilustrasi kota cerdas dengan infrastruktur yang terawat"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
              </div>

              {/* Floating UI cards */}
              <div className="absolute -bottom-6 -left-6 hidden w-[260px] rounded-2xl border border-border bg-card/95 p-4 shadow-soft backdrop-blur md:block animate-float-1 will-change-gpu hover:scale-105 hover:shadow-glow transition-transform duration-300 cursor-default">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Laporan minggu ini</p>
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success animate-pulse">
                    +12%
                  </span>
                </div>
                <p className="mt-1 text-2xl font-bold tracking-tight">128 selesai</p>
                <div className="mt-3 flex h-10 items-end gap-1">
                  {[40, 65, 35, 80, 55, 90, 70].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-leaf-gradient transition-all duration-500 hover:opacity-85"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>

              <div className="absolute -top-4 -right-4 hidden rounded-2xl border border-border bg-card/95 p-3 shadow-soft backdrop-blur md:flex md:items-center md:gap-3 animate-float-2 will-change-gpu hover:scale-105 hover:shadow-glow transition-transform duration-300 cursor-default">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/15 text-success">
                  <CheckCircle2 className="h-5 w-5 animate-bounce" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Jl. Asia Afrika</p>
                  <p className="text-sm font-semibold">Lubang ditambal</p>
                </div>
              </div>
            </div>
          </div>

          {/* Partner marquee */}
          <div className="relative border-y border-border/60 py-6 bg-muted/20 overflow-hidden flex items-center">
            <div className="absolute left-0 z-10 bg-gradient-to-r from-background via-background/90 to-transparent pl-4 pr-12 py-6 hidden md:block select-none">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/50">Dipercaya oleh:</span>
            </div>
            <div className="marquee-fade flex flex-1 whitespace-nowrap overflow-hidden">
              <div className="animate-marquee flex gap-16 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 select-none md:pl-32">
                {[...PARTNERS, ...PARTNERS, ...PARTNERS].map((p, i) => (
                  <span key={i} className="transition-colors hover:text-primary flex items-center gap-2 cursor-pointer">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" />
                    {p}
                  </span>
                ))}
              </div>
              <div className="animate-marquee flex gap-16 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 select-none md:pl-32" aria-hidden="true">
                {[...PARTNERS, ...PARTNERS, ...PARTNERS].map((p, i) => (
                  <span key={`dup-${i}`} className="transition-colors hover:text-primary flex items-center gap-2 cursor-pointer">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" />
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* STATS STRIP */}
        <section className="border-b border-border bg-card">
          <div className="container mx-auto grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 md:divide-y-0">
            {[
              { v: "2.4k+", l: "Laporan masuk" },
              { v: "94%", l: "Tingkat penyelesaian" },
              { v: "< 6 jam", l: "Rerata respon" },
              { v: "37", l: "Petugas aktif" },
            ].map((s, index) => (
              <ScrollReveal key={s.l} delay={index * 100} direction="up" className="w-full h-full">
                <div className="h-full p-6 text-center md:p-8 hover:bg-muted/30 transition-all duration-300 group cursor-default">
                  <p className="text-3xl font-bold tracking-tight text-primary md:text-4xl transition-all duration-300 group-hover:scale-105 group-hover:translate-y-[-2px]">{s.v}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.l}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="border-b border-border bg-secondary/40 relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
          <div className="container mx-auto px-4 py-20 relative z-10">
            <ScrollReveal direction="up">
              <div className="mx-auto max-w-2xl text-center">
                <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 px-3 py-1 font-semibold uppercase tracking-wider text-xs">
                  Fokus penanganan
                </Badge>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance md:text-4xl">
                  Tiga Jenis Prioritas Laporan
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Setiap laporan diverifikasi dan diklasifikasikan ke dalam tiga tingkat urgensi untuk efisiensi penanganan.
                </p>
              </div>
            </ScrollReveal>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: AlertTriangle,
                  t: "Jalan Berlubang Kritis",
                  d: "Kerusakan parah yang berlokasi di dekat fasilitas vital seperti sekolah, rumah sakit, tempat ibadah, atau jalan protokol utama dengan volume lalu lintas yang sangat padat.",
                  tag: "Kritis",
                  color: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
                },
                {
                  icon: AlertCircle,
                  t: "Jalan Berlubang Sedang",
                  d: "Kerusakan menengah yang berada di dalam kawasan pemukiman padat penduduk, jalan penghubung antar-kecamatan, atau rute alternatif warga yang ramai dilalui.",
                  tag: "Sedang",
                  color: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                },
                {
                  icon: Info,
                  t: "Jalan Berlubang Ringan",
                  d: "Kerusakan kecil atau retakan yang berlokasi di jalanan sepi, gang lingkungan perumahan kecil, atau jalan alternatif yang jarang dilalui oleh kendaraan warga.",
                  tag: "Ringan",
                  color: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                },
              ].map(({ icon: Icon, t, d, tag, color }, index) => (
                <ScrollReveal key={t} delay={index * 150} direction="up" className="w-full h-full">
                  <div
                    className="h-full group relative overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-2 hover:shadow-glow flex flex-col justify-between"
                  >
                    <div
                      className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-30"
                      style={{ background: "var(--primary-glow)" }}
                    />
                    <div className="flex items-start justify-between">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-all duration-300 group-hover:scale-105 ${color}`}>
                        {tag}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold transition-colors duration-300 group-hover:text-primary">{t}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="container mx-auto px-4 py-24 relative overflow-hidden">
          <ScrollReveal direction="up">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="border-accent/30 text-accent bg-accent/5 px-3 py-1 font-semibold uppercase tracking-wider text-xs">
                <Sparkles className="mr-1 h-3 w-3 animate-pulse" /> Alur kerja
              </Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance md:text-4xl animate-fade-in-up">
                Dari foto laporan ke perbaikan, dalam hitungan jam
              </h2>
            </div>
          </ScrollReveal>

          <div className="relative mt-14 grid gap-6 md:grid-cols-4">
            <div
              aria-hidden
              className="absolute left-0 right-0 top-12 hidden h-px md:block animate-pulse"
              style={{
                background:
                  "repeating-linear-gradient(to right, var(--border) 0 8px, transparent 8px 16px)",
              }}
            />
            {[
              {
                n: "01",
                icon: Camera,
                t: "Warga melapor",
                d: "Mengirimkan laporan foto kerusakan jalan, lokasi GPS, dan deskripsi kendala secara publik dalam 30 detik.",
              },
              {
                n: "02",
                icon: Sparkles,
                t: "Sistem AI mengolah",
                d: "AI otomatis mendeteksi lubang, menganalisis objek, serta mengklasifikasikan tingkat keparahan laporan secara real-time.",
              },
              {
                n: "03",
                icon: Wrench,
                t: "Petugas menangani",
                d: "Petugas lapangan menerima instruksi kerja (work order), melakukan perbaikan, dan mengirimkan bukti foto selesai.",
              },
              {
                n: "04",
                icon: ShieldCheck,
                t: "Admin memverifikasi",
                d: "Admin meninjau status penanganan dan memverifikasi apakah petugas sudah selesai mengerjakan tugasnya dengan benar.",
              },
            ].map(({ n, icon: Icon, t, d }, index) => (
              <ScrollReveal key={n} delay={index * 150} direction="up" className="w-full h-full">
                <div
                  className="h-full relative rounded-3xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:shadow-glow hover:-translate-y-2 group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-leaf-gradient px-3 py-1 text-xs font-bold text-primary-foreground shadow-soft transition-transform duration-300 group-hover:scale-110">
                      {n}
                    </span>
                    <Icon className="h-7 w-7 text-primary/70 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold transition-colors duration-300 group-hover:text-primary">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* TESTIMONIAL */}
        <section className="border-y border-border bg-warm-gradient overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <ScrollReveal direction="up">
            <div className="container mx-auto grid gap-10 px-4 py-20 md:grid-cols-[auto_1fr] md:items-center relative z-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-elev hover:rotate-6 transition-all duration-300 cursor-default">
                <Quote className="h-7 w-7" />
              </div>
              <div>
                <blockquote className="text-xl font-medium leading-relaxed text-foreground text-balance md:text-2xl italic">
                  “Dulu lapor lubang harus telpon kelurahan, ditunda berminggu. Sekarang foto, kirim,
                  tiga hari sudah ditambal. Anak saya jalan kaki ke sekolah jadi aman lagi.”
                </blockquote>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                    RS
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Rini Suryani</p>
                    <p className="text-xs text-muted-foreground">
                      Warga Kelurahan Babakan · pengguna sejak Maret
                    </p>
                  </div>
                  <span className="ml-3 hidden items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground md:inline-flex hover:bg-muted transition-colors">
                    <Clock className="h-3 w-3 text-primary animate-pulse" /> Resolusi 3 hari
                  </span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-20">
          <ScrollReveal direction="up">
            <div className="grain relative overflow-hidden rounded-3xl bg-hero-gradient p-10 text-primary-foreground shadow-elev md:p-16 animate-gradient-shift">
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-35 blur-3xl animate-pulse-glow"
                style={{ background: "var(--accent)" }}
              />
              <div
                className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full opacity-20 blur-3xl animate-pulse-glow animation-delay-500"
                style={{ background: "var(--primary-glow)" }}
              />
              <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
                    Jadilah bagian dari kota yang lebih baik.
                  </h2>
                  <p className="mt-3 max-w-xl text-primary-foreground/85">
                    Lapor kerusakan infrastruktur langsung tanpa perlu mendaftar. Admin dan petugas
                    dinas dapat masuk untuk memantau dan mengelola penanganan.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" variant="secondary" className="hover:scale-105 active:scale-95 transition-all duration-300 shadow-soft">
                    <Link to="/warga">Lapor Sekarang</Link>
                  </Button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

function ScrollReveal({ children, className = "", delay = 0, direction = "up" }: ScrollRevealProps) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const directionClasses = {
    up: "translate-y-8",
    down: "-translate-y-8",
    left: "translate-x-8",
    right: "-translate-x-8",
    none: "",
  };

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] will-change-gpu duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isIntersecting 
          ? "opacity-100 translate-y-0 translate-x-0" 
          : `opacity-0 ${directionClasses[direction]}`
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

