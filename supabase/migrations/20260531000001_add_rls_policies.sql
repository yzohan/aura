-- Enable Row Level Security (RLS) for all AI analysis tables
ALTER TABLE public.laporan_jalan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fasilitas_radius ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detail_lubang ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metadata_ali ENABLE ROW LEVEL SECURITY;

-- 1. Kebijakan untuk public.laporan_jalan
DROP POLICY IF EXISTS "Public select laporan_jalan" ON public.laporan_jalan;
CREATE POLICY "Public select laporan_jalan" ON public.laporan_jalan
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert laporan_jalan" ON public.laporan_jalan;
CREATE POLICY "Public insert laporan_jalan" ON public.laporan_jalan
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update laporan_jalan" ON public.laporan_jalan;
CREATE POLICY "Public update laporan_jalan" ON public.laporan_jalan
  FOR UPDATE USING (true) WITH CHECK (true);

-- 2. Kebijakan untuk public.fasilitas_radius
DROP POLICY IF EXISTS "Public select fasilitas_radius" ON public.fasilitas_radius;
CREATE POLICY "Public select fasilitas_radius" ON public.fasilitas_radius
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert fasilitas_radius" ON public.fasilitas_radius;
CREATE POLICY "Public insert fasilitas_radius" ON public.fasilitas_radius
  FOR INSERT WITH CHECK (true);

-- 3. Kebijakan untuk public.detail_lubang
DROP POLICY IF EXISTS "Public select detail_lubang" ON public.detail_lubang;
CREATE POLICY "Public select detail_lubang" ON public.detail_lubang
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert detail_lubang" ON public.detail_lubang;
CREATE POLICY "Public insert detail_lubang" ON public.detail_lubang
  FOR INSERT WITH CHECK (true);

-- 4. Kebijakan untuk public.metadata_ali
DROP POLICY IF EXISTS "Public select metadata_ali" ON public.metadata_ali;
CREATE POLICY "Public select metadata_ali" ON public.metadata_ali
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert metadata_ali" ON public.metadata_ali;
CREATE POLICY "Public insert metadata_ali" ON public.metadata_ali
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update metadata_ali" ON public.metadata_ali;
CREATE POLICY "Public update metadata_ali" ON public.metadata_ali
  FOR UPDATE USING (true) WITH CHECK (true);
