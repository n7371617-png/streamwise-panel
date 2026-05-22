-- Restrict SELECT on stream/VOD tables to admins only.
-- The IPTV API edge function uses the service role and bypasses RLS,
-- so external clients still receive content via the Xtream API.
-- The admin panel reads as the admin user (has_role admin) — also allowed.

DROP POLICY IF EXISTS "auth read streams" ON public.streams;
CREATE POLICY "admins read streams"
  ON public.streams FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "auth read movies" ON public.vod_movies;
CREATE POLICY "admins read movies"
  ON public.vod_movies FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "auth read episodes" ON public.vod_episodes;
CREATE POLICY "admins read episodes"
  ON public.vod_episodes FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));