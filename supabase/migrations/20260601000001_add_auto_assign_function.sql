-- Create a security definer function to automatically assign a petugas to a report
-- This bypasses RLS and allows anyone (including anonymous users submitting reports)
-- to trigger the assignment if enabled in settings.

CREATE OR REPLACE FUNCTION public.assign_petugas_auto(report_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_petugas_id UUID;
  v_admin_id UUID;
BEGIN
  -- Ambil satu petugas secara acak
  SELECT user_id INTO v_petugas_id
  FROM public.user_roles
  WHERE role = 'petugas'
  ORDER BY random()
  LIMIT 1;

  -- Ambil satu admin secara acak (untuk assigned_by)
  SELECT user_id INTO v_admin_id
  FROM public.user_roles
  WHERE role = 'admin'
  ORDER BY random()
  LIMIT 1;

  -- Jika keduanya ditemukan, buat work order dan ubah status laporan
  IF v_petugas_id IS NOT NULL AND v_admin_id IS NOT NULL THEN
    -- Hapus work order lama jika ada (untuk menghindari duplikasi jika dipanggil ulang)
    DELETE FROM public.work_orders WHERE work_orders.report_id = assign_petugas_auto.report_id;

    INSERT INTO public.work_orders (report_id, assigned_to, assigned_by, notes)
    VALUES (assign_petugas_auto.report_id, v_petugas_id, v_admin_id, 'Ditugaskan secara otomatis oleh sistem (Auto-Assign).');

    UPDATE public.reports
    SET status_pelaporan = 'in_progress'
    WHERE id = assign_petugas_auto.report_id;
  END IF;
END;
$$;
