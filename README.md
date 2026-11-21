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
3. **Authentication → URL Configuration**
   - Site URL: `https://<your-domain>` (or the Vercel URL)
   - Redirect URLs: `https://<your-domain>/auth/confirm`, `https://*-<team>.vercel.app/auth/confirm`, `http://localhost:3000/auth/confirm`
4. *(Recommended)* **Authentication → Emails**: in the "Confirm signup" and "Reset password" templates, change the link to
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}`
   so links also work when opened in a different browser or app. You can translate the email text into Bengali here too.
5. Sign up on the site at `/signup`, confirm your email, then make yourself the first admin in the SQL editor:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
   After that, manage everyone else's roles from **/admin/users**.

### Roles

`member` < `editor` < `admin` < `super_admin`

| Can… | editor | admin | super_admin |
|---|---|---|---|
| Write and publish Q&A and articles, upload media, manage categories | ✓ | ✓ | ✓ |
| See users and the activity log, make someone editor or member, delete members and editors | – | ✓ | ✓ |
| Make someone **admin**, remove an admin, delete an admin | – | – | ✓ |

**super_admin can only be set manually in Supabase** (SQL editor). No screen in the app can grant it, and the database itself enforces this (`guard_role_change` trigger):

```sql
update public.profiles set role = 'super_admin'
where id = (select id from auth.users where email = 'you@example.com');
```

### Cloudflare R2 (files)

See [docs/STORAGE.md](docs/STORAGE.md#cloudflare-setup): buckets, custom domain, API token, CORS.

## What's built

| Area | Routes |
|---|---|
| Public site | `/`, section placeholders (`/quran`, `/qa`, …) |
| Auth | `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/confirm`, `/account` |
| Public content | `/qa`, `/qa/[slug]`, `/articles`, `/articles/[slug]`, `/ask` (reader questions), `/search` |
| Admin panel (editor+) | `/admin` dashboard · `/admin/questions` · `/admin/articles` (WYSIWYG editor, search, filters, bulk actions) · `/admin/media` · `/admin/categories` · `/admin/users` and `/admin/activity` (admin+) |

The editor is WYSIWYG: formatting and images appear exactly as readers see them. Content is stored as Markdown, and raw HTML is never rendered.
Emails go through Resend: staff two-step login codes and "your question was answered" need `RESEND_API_KEY`; Supabase auth emails use Resend SMTP. Login security (staff OTP, captcha, remember me) is described in `docs/EMAIL.md`.

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
