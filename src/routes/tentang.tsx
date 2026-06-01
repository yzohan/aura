import { createFileRoute } from "@tanstack/react-router";
import { Target, Globe2, HeartHandshake, Sparkles } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/tentang")({
  head: () => ({
    meta: [
      { title: "Tentang" },
      {
        name: "description",
        content:
          "Kenali AURA: ekosistem tata kota cerdas yang menyatukan warga, petugas, dan dinas untuk infrastruktur publik yang lebih baik.",
      },
      { property: "og:title", content: "Tentang AURA" },
      { property: "og:description", content: "Visi dan misi AURA dalam membangun tata kota yang responsif dan inklusif." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Tentang AURA</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Solusi tuntas untuk infrastruktur publik — bukan sekadar platform pelaporan.
          </p>
        </section>

        <section className="container mx-auto grid gap-6 px-4 pb-16 md:grid-cols-2">
          {[
            {
              icon: Target,
              t: "Fokus pada Mobilitas",
              d: "AURA berfokus pada kerusakan infrastruktur publik yang berdampak langsung pada mobilitas warga: jalan berlubang, trotoar rusak, dan malfungsi PJU.",
            },
            {
              icon: Globe2,
              t: "Berbasis GIS",
              d: "Dashboard monitoring berbasis Geographic Information System (GIS) memungkinkan pemetaan sebaran masalah kota secara real-time dan presisi.",
            },
            {
              icon: HeartHandshake,
              t: "Tiga Entitas, Satu Alur",
              d: "Warga sebagai pelapor, Petugas Lapangan sebagai eksekutor, Admin Dinas sebagai pengawas — terintegrasi dalam alur kerja terpadu.",
            },
            {
              icon: Sparkles,
              t: "Validitas Data Spasial",
              d: "Skala implementasi difokuskan pada simulasi data spasial perkotaan untuk menguji indeks aksesibilitas dan urgensi penanganan.",
            },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-border bg-card p-7 shadow-soft">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-xl font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </section>

        <section className="bg-secondary/40 py-16">
          <div className="container mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Pengembangan Kolaboratif</h2>
            <p className="mt-4 text-muted-foreground">
              Ekosistem AURA dikelola secara kolaboratif oleh tim multidisiplin dari beberapa path
              di program : Artificial
              Intelligence, Data Science, dan Full-Stack Development.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
