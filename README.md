# AURA — Ekosistem Tata Kota Cerdas (Full-Stack App / FS)

AURA adalah platform tata kota cerdas yang menghubungkan warga dengan petugas dinas untuk penanganan infrastruktur publik secara cepat, transparan, dan berbasis data spasial. Platform ini mempermudah warga untuk melaporkan kerusakan jalan, trotoar, dan PJU, yang kemudian diidentifikasi menggunakan model AI (Computer Vision) dan dipetakan ke dalam dashboard GIS Admin untuk penugasan petugas dinas secara real-time.

---

> [!NOTE]
> Ini adalah dokumentasi khusus untuk folder **FS (Full-Stack Web Application)**, bukan untuk repositori/folder AI (Machine Learning).

---

## Tech Stack dan Fitur Utama

- **Core**: React 19 & TypeScript
- **Framework & Router**: TanStack Start (Full-stack framework berbasis Vite & TanStack Router)
- **Database & Auth**: Supabase (REST APIs, PostgreSQL, Real-time Spasial, dan Multi-role Auth Warga/Petugas/Admin)
- **Styling**: Tailwind CSS v4 dengan skema Eco-Urban (Forest green, Sage, Emerald, Terracotta)
- **Map & GIS**: Leaflet & MapLibre GL (Peta interaktif 3D spasial)
- **Deployment**: Cloudflare Workers / Pages

---

## Panduan Setup dan Menjalankan secara Lokal

### Prerequisites (Prasyarat)

Pastikan perangkat lokal Anda sudah terinstall:
- Node.js (versi 18+) atau Bun (Sangat direkomendasikan karena file lock yang digunakan di repositori ini adalah `bun.lockb`).
- Akun Supabase untuk database lokal / testing.

---

### Langkah-Langkah Instalasi

#### 1. Clone Repositori
Silakan clone repositori ini ke folder lokal Anda:
```bash
git clone https://github.com/Zidfar/AURA.git
cd aura
```

#### 2. Install Dependencies
Gunakan Bun (rekomendasi) atau npm untuk menginstall seluruh dependensi package:
```bash
# Menggunakan Bun (Rekomendasi)
bun install

# Atau menggunakan npm
npm install
```

#### 3. Setup Environment Variables
Buat file bernama `.env` pada root directory project dan salin variabel berikut. Sesuaikan dengan Supabase project Anda sendiri:
```env
SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-key"
SUPABASE_URL="https://your-supabase-project-id.supabase.co"
VITE_SUPABASE_PROJECT_ID="your-supabase-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-key"
VITE_SUPABASE_URL="https://your-supabase-project-id.supabase.co"
```

#### 4. Jalankan Aplikasi secara Lokal (Development Mode)
Jalankan dev server lokal untuk memulai proses koding:
```bash
# Menggunakan Bun (Rekomendasi)
bun run dev

# Atau menggunakan npm
npm run dev
```
Setelah dijalankan, buka browser di alamat: `http://localhost:3000` (atau port lain yang tertera di terminal).

---

## Build dan Deploy

### Build untuk Produksi
Gunakan perintah build untuk mengompilasi aset klien & server ke folder `dist`:
```bash
# Menggunakan Bun
bun run build

# Atau menggunakan npm
npm run build
```

### Deploy via Wrangler (Cloudflare Workers)
Jika Anda sudah login menggunakan Wrangler CLI (`npx wrangler login`), Anda bisa langsung mempublikasikannya ke Cloudflare:
```bash
npx wrangler deploy
```

---

## Struktur Folder Utama (FS)

```text
├── components/          # Komponen UI Reusable (Site Header, Site Footer, dll)
│   ├── ui/              # Komponen dasar UI Shadcn (Button, Card, Badge, dll)
│   └── jakarta-diorama  # Map 3D Diorama menggunakan MapLibre GL
├── hooks/               # Custom hooks React
├── lib/                 # Utilitas konfigurasi (auth, supabase client, helper API)
├── routes/              # Routing utama TanStack Start/Router
│   ├── _app/            # Wrapper layout dashboard
│   ├── admin/           # Dashboard khusus Admin dinas
│   ├── petugas/         # Portal khusus Petugas lapangan
│   ├── warga/           # Portal pelaporan warga
│   ├── index.tsx        # Homepage utama AURA
│   ├── tim.tsx          # Halaman Tim pengembang
│   └── tentang.tsx      # Halaman profil AURA
├── styles.css           # Custom theme design system & Tailwind layer
└── wrangler.jsonc       # Konfigurasi Cloudflare Workers/Pages
```

---

## Tim Pengembang Full-Stack (FS)

- **Nathania Englandia Saraswati** (Full-Stack Development / Database & Auth / Cloudflare Serverless) — [GitHub](https://github.com/yzohan)
- **Nethania Emmanuela Rahadian** (Full-Stack Development / Main Dashboard Layout & Statistics Chart) — [GitHub](https://github.com/nethania)

*Catatan: Proyek kolaborasi Lintas Path - Coding Camp 2026 didukung oleh DBS Foundation.*
