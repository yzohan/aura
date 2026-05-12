import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Halaman tidak ditemukan</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang kamu cari tidak tersedia atau sudah dipindahkan.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AURA — Ekosistem Tata Kota Cerdas" },
      {
        name: "description",
        content:
          "AURA: platform pelaporan kerusakan infrastruktur kota berbasis GIS untuk warga, petugas lapangan, dan admin dinas.",
      },
      { name: "author", content: "Tim AURA — Coding Camp 2026" },
      { property: "og:title", content: "AURA — Ekosistem Tata Kota Cerdas" },
      {
        property: "og:description",
        content:
          "Lapor jalan berlubang, trotoar rusak, dan PJU mati. Pantau perbaikan kota secara real-time melalui dashboard GIS.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "AURA — Ekosistem Tata Kota Cerdas" },
      { name: "description", content: "Aura City Guardian is a smart city ecosystem for public infrastructure issue detection and resolution." },
      { property: "og:description", content: "Aura City Guardian is a smart city ecosystem for public infrastructure issue detection and resolution." },
      { name: "twitter:description", content: "Aura City Guardian is a smart city ecosystem for public infrastructure issue detection and resolution." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b9b8fa07-76b7-4b37-8fbf-17c126812bc8/id-preview-d1f4a745--3ab92156-916e-4e26-bae2-ef3f1d724344.lovable.app-1776929359254.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b9b8fa07-76b7-4b37-8fbf-17c126812bc8/id-preview-d1f4a745--3ab92156-916e-4e26-bae2-ef3f1d724344.lovable.app-1776929359254.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster richColors position="top-center" />
    </AuthProvider>
  );
}
