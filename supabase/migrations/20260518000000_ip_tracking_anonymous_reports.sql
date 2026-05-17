ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS ip_address TEXT;

ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;

ALTER TABLE public.reports
  ALTER COLUMN reporter_id DROP NOT NULL;

DROP POLICY IF EXISTS "Anyone authenticated can view reports" ON public.reports;
DROP POLICY IF EXISTS "Warga create reports" ON public.reports;
DROP POLICY IF EXISTS "Reporter update own pending" ON public.reports;

CREATE POLICY "Public view reports" ON public.reports
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create reports" ON public.reports
  FOR INSERT WITH CHECK (true);

-- 5. Update policy storage agar anon bisa upload foto laporan
--    (kita simpan di folder 'anon' jika tidak ada userId)
DROP POLICY IF EXISTS "Authenticated upload report photos" ON storage.objects;

CREATE POLICY "Anyone can upload report photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'reports');

-- 6. Buat fungsi RPC untuk cek jumlah laporan dari IP dalam 24 jam terakhir
--    Fungsi ini dipanggil dari frontend sebelum insert
CREATE OR REPLACE FUNCTION public.count_reports_by_ip(_ip TEXT)
RETURNS INTEGER
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.reports
  WHERE ip_address = _ip
    AND created_at >= now() - INTERVAL '24 hours';
$$;
