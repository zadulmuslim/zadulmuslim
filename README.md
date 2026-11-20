# যাদুল মুসলিম · Zadulmuslim

**ইলম, আমল ও সেবা — এক ঠিকানায়**
কুরআন, হাদীস, ফিকহ, নামাজের সময়, দু'আ ও মাসায়েল — নির্ভরযোগ্য আলেমদের দিকনির্দেশনায়।
Associated platforms: ফিকহ লাইট · হিদায়াহ হাব

**Stack:** Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui · Supabase PostgreSQL + Supabase Auth · Cloudflare R2 · Vercel · GitHub

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): stack, data model, roles
- [docs/STORAGE.md](docs/STORAGE.md): Cloudflare R2 setup, upload/download flows

## Local setup

```bash
npm install
cp .env.example .env.local     # fill in Supabase + R2 values
npm run dev                    # http://localhost:3000
```

The homepage renders without any env values. Auth and media endpoints need them.

### Supabase (database + auth)

1. Create a project, then copy the URL, anon key and service-role key into `.env.local`.
2. Apply the schema: `npx supabase link --project-ref <ref> && npx supabase db push`
   (or paste `supabase/migrations/*.sql`, then `supabase/seed.sql`, into the SQL editor).
3. Make yourself an admin after signing up:
   `update public.profiles set role = 'admin' where id = '<your auth user id>';`

### Cloudflare R2 (files)

See [docs/STORAGE.md](docs/STORAGE.md#cloudflare-setup): buckets, custom domain, API token, CORS.

## Scripts

| Command | |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check:brand` | Fails if the earlier working name or Supabase file-storage usage reappears |

## Deploy (Vercel + GitHub)

1. Push to GitHub and import the repo in Vercel.
2. Add every variable from `.env.example` to Production and Preview. Keep `SUPABASE_SERVICE_ROLE_KEY`, `R2_*` and `CRON_SECRET` **without** a `NEXT_PUBLIC_` prefix.
3. Add your Vercel domains to the R2 CORS rule and to Supabase Auth → URL configuration.
4. `vercel.json` schedules the daily media cleanup (03:30 Asia/Dhaka).

## Before launch

- Replace placeholder homepage stats and testimonials (`src/data/home.ts`) with real figures and genuine feedback.
- Set the official contact email in `src/config/site.ts`, and add store links for the app.
