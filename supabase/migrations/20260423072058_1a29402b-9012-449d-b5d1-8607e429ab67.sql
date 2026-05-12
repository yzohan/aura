
-- Fix function search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Restrict storage listing: drop broad SELECT, keep only object access via known URLs
DROP POLICY IF EXISTS "Public read report photos" ON storage.objects;
CREATE POLICY "Authenticated read report photos" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'reports');
