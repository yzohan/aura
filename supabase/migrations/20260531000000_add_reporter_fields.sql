-- Hapus tabel lama jika ingin membuat ulang dari awal
DROP TABLE IF EXISTS public.reports CASCADE;

-- Buat ulang tabel reports sesuai request ketua
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Dibuat nullable agar warga anonim bisa lapor tanpa akun
  category public.report_category NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL, -- Wajib diisi sesuai request (tidak boleh kosong)
  no_hp TEXT NOT NULL, -- Diubah ke TEXT agar nomor HP tidak overflow (INT maksimal hanya 2 milyar) & angka 0 di depan tidak hilang
  detail_laporan TEXT NOT NULL,
  photo_url TEXT NOT NULL, -- Wajib dilampirkan
  address TEXT NOT NULL, -- Wajib diisi lokasi lengkapnya
  latitude DOUBLE PRECISION NOT NULL, -- Wajib ada untuk koordinat Peta
  longitude DOUBLE PRECISION NOT NULL, -- Wajib ada untuk koordinat Peta
  status_pelaporan TEXT NOT NULL DEFAULT 'progress', -- Ditambahkan tipe data TEXT agar sintaks SQL valid
  kategori_pelaporan TEXT NOT NULL DEFAULT 'ringan', -- Ditambahkan tipe data TEXT agar sintaks SQL valid
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT -- Dibutuhkan untuk membatasi kuota 3 laporan sehari per IP
);

-- RLS & Kebijakan Keamanan (Wajib ada di Supabase)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view reports" ON public.reports
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create reports" ON public.reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin update reports" ON public.reports
  FOR UPDATE TO authenticated USING (true);
