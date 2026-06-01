-- Policy to allow authenticated users (or public for demo) to delete reports
DROP POLICY IF EXISTS "Public delete reports" ON public.reports;
CREATE POLICY "Public delete reports" ON public.reports
  FOR DELETE USING (true);
