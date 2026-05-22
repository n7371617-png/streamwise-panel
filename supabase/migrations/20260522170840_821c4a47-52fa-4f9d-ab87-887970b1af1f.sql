DROP POLICY IF EXISTS "auth read series" ON public.vod_series;
CREATE POLICY "admins read series"
  ON public.vod_series FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));