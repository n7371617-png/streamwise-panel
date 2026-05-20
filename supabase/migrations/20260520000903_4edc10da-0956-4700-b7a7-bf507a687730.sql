
-- Roles enum and RBAC
CREATE TYPE public.app_role AS ENUM ('admin', 'reseller', 'user');
CREATE TYPE public.iptv_status AS ENUM ('active', 'disabled', 'banned', 'expired');
CREATE TYPE public.stream_type AS ENUM ('live', 'movie', 'series');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- Resellers
CREATE TABLE public.resellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 0,
  total_sales INTEGER NOT NULL DEFAULT 0,
  can_create_trials BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- IPTV subscriber accounts
CREATE TABLE public.iptv_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT,
  status iptv_status NOT NULL DEFAULT 'active',
  is_trial BOOLEAN NOT NULL DEFAULT false,
  max_connections INTEGER NOT NULL DEFAULT 1,
  expire_at TIMESTAMPTZ,
  reseller_id UUID REFERENCES public.resellers(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_iptv_users_username ON public.iptv_users(username);
CREATE INDEX idx_iptv_users_reseller ON public.iptv_users(reseller_id);

-- Categories & Streams
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type stream_type NOT NULL DEFAULT 'live',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type stream_type NOT NULL DEFAULT 'live',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  logo TEXT,
  epg_id TEXT,
  tvg_name TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_streams_category ON public.streams(category_id);
CREATE INDEX idx_streams_type ON public.streams(type);

-- VOD
CREATE TABLE public.vod_movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  poster TEXT,
  backdrop TEXT,
  description TEXT,
  year INTEGER,
  rating NUMERIC(3,1),
  duration_min INTEGER,
  genre TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.vod_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  poster TEXT,
  backdrop TEXT,
  description TEXT,
  year INTEGER,
  rating NUMERIC(3,1),
  genre TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.vod_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES public.vod_series(id) ON DELETE CASCADE,
  season INTEGER NOT NULL DEFAULT 1,
  episode INTEGER NOT NULL,
  title TEXT,
  url TEXT NOT NULL,
  duration_min INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (series_id, season, episode)
);

-- Logs and sessions
CREATE TABLE public.user_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iptv_user_id UUID REFERENCES public.iptv_users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_logs_user ON public.user_logs(iptv_user_id);

CREATE TABLE public.online_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iptv_user_id UUID NOT NULL REFERENCES public.iptv_users(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES public.streams(id) ON DELETE SET NULL,
  ip TEXT,
  user_agent TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_ping TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Server settings (singleton)
CREATE TABLE public.server_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  domain TEXT NOT NULL DEFAULT 'example.com',
  http_port INTEGER NOT NULL DEFAULT 443,
  https_port INTEGER NOT NULL DEFAULT 443,
  rtmp_port INTEGER NOT NULL DEFAULT 8880,
  site_name TEXT NOT NULL DEFAULT 'IPTV Platform',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.server_settings (id) VALUES (1);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_iptv_users_updated BEFORE UPDATE ON public.iptv_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_resellers_updated BEFORE UPDATE ON public.resellers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  -- Auto-grant admin to the configured owner email
  IF NEW.email = 'qqksaqq577@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iptv_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vod_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vod_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vod_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: users see own, admins see all
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- user_roles: only admins manage; users can see own
CREATE POLICY "see own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Admin-only full access helper policies
CREATE POLICY "admins all resellers" ON public.resellers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "reseller see self" ON public.resellers FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "admins all credit_tx" ON public.credit_transactions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "reseller see own credit_tx" ON public.credit_transactions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.resellers r WHERE r.id = reseller_id AND r.user_id = auth.uid())
);

CREATE POLICY "admins all iptv_users" ON public.iptv_users FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "reseller manage own iptv_users" ON public.iptv_users FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.resellers r WHERE r.id = reseller_id AND r.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.resellers r WHERE r.id = reseller_id AND r.user_id = auth.uid())
);

CREATE POLICY "auth read categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "auth read streams" ON public.streams FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write streams" ON public.streams FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "auth read movies" ON public.vod_movies FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write movies" ON public.vod_movies FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "auth read series" ON public.vod_series FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write series" ON public.vod_series FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "auth read episodes" ON public.vod_episodes FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write episodes" ON public.vod_episodes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "admins read logs" ON public.user_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins write logs" ON public.user_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "admins manage sessions" ON public.online_sessions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "auth read settings" ON public.server_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write settings" ON public.server_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
