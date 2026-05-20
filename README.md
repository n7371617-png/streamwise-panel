# IPTV Control — Production-ready IPTV Management Platform

Xtream Codes-style admin panel with subscribers, resellers, M3U & VOD management,
and a Xtream-compatible API for IPTV Smarters, TiviMate, OTT Navigator and VLC.

## Stack
- TanStack Start (React 19) + Tailwind v4 + shadcn/ui
- Lovable Cloud (PostgreSQL + Auth + RLS)
- Docker + Nginx (HTTPS on 443)

## First-run
1. Open `/login` and **sign up** with `qqksaqq577@gmail.com` — this email is
   auto-promoted to `admin` by a database trigger.
2. Sign in → you land on `/admin`.

## Xtream API endpoints
- `GET /player_api.php?username=&password=&action=get_live_streams|...`
- `GET /get.php?username=&password=&type=m3u_plus` → full M3U playlist

## VPS deployment (HTTPS on 443)
```bash
# Put your TLS cert in ./certs/{fullchain.pem,privkey.pem}
docker compose up -d --build
```
The reverse proxy listens on 80/443 and forwards to the app on port 3000.

## Notes
- Backend runs on Lovable Cloud (PostgreSQL with RLS). For fully self-hosted
  PostgreSQL, swap the Supabase URL/keys in `.env` for a self-hosted Supabase
  instance — the schema migration lives in `supabase/migrations/`.
- All ports are editable from **Admin → Settings**.
