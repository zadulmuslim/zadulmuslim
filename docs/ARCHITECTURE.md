# Zadulmuslim (যাদুল মুসলিম) — Architecture

> **ইলম, আমল ও সেবা — এক ঠিকানায়**
> Associated platforms: ফিকহ লাইট · হিদায়াহ হাব

## Stack (final)

| Layer | Technology | Responsibility |
|---|---|---|
| Framework | **Next.js 16** (App Router) + **TypeScript** | Pages, Route Handlers, Server Actions, `proxy.ts` |
| UI | **Tailwind CSS v4** + **shadcn/ui** (new-york, lucide) | Bengali-first UI, brand tokens in `globals.css` |
| Database | **Supabase PostgreSQL** | All relational data + file *metadata* |
| Auth | **Supabase Auth** (`@supabase/ssr`) | Sessions in cookies, roles in `public.profiles` |
| File storage | **Cloudflare R2** (S3-compatible API, AWS SDK v3) | Every binary file: images, PDFs, audio, video, assets |
| Hosting | **Vercel** | App, cron (`vercel.json`) |
| Source | **GitHub** | Repo, Vercel Git integration |

Supabase's own file-storage product is **not** used anywhere. Binary data is never stored in PostgreSQL.

## Request flow

```
Browser ──► Vercel (Next.js)
              ├─ proxy.ts ............ refreshes Supabase Auth session cookie
              ├─ Server Components ... read content from Supabase (RLS applies)
              ├─ /api/media/* ........ permission check → src/lib/storage → R2 + `media` table
              └─ Server Actions ...... small privileged uploads (e.g. profile photo)

Browser ──PUT (presigned)──► Cloudflare R2         (large uploads bypass Vercel)
Browser ──GET──► media.<domain> (R2 custom domain) (public assets, CDN-cached)
Browser ──GET──► /api/media/:id/download ─302─► signed R2 URL (private files)
```

## Branding

All brand strings come from `src/config/site.ts`:

- `nameBn` = **যাদুল মুসলিম** — every Bengali UI surface (header, footer, titles, OG `siteName`).
- `name` = **Zadulmuslim** — package name, technical identifiers, `applicationName`, English metadata.
- `tagline` = **ইলম, আমল ও সেবা — এক ঠিকানায়**.
- `associatedPlatforms` = ফিকহ লাইট, হিদায়াহ হাব.

`npm run check:brand` fails the build pipeline if the earlier working name or any Supabase file-storage call appears in source, config or docs.

## Directory map

```
src/
  app/
    layout.tsx                      global metadata / Open Graph
    (site)/layout.tsx, page.tsx     public header/footer + homepage
    (site)/(auth)/…                 login, signup, forgot/reset password
    (site)/account                  profile name + photo
    (site)/[section]/page.tsx       placeholders for কুরআন, হাদীস, প্রশ্নোত্তর …
    auth/confirm                    email-link landing (verifyOtp / PKCE)
    admin/…                         admin panel (own layout, role-guarded)
    actions/                        Server Actions (auth, account, admin/*)
    api/media/…                     storage endpoints (see STORAGE.md)
    api/cron/cleanup-media          daily cleanup of abandoned uploads
    actions/media.ts                Server Action example (profile photo)
    robots.ts, sitemap.ts, manifest.ts, icon.svg
  components/
    ui/                             shadcn/ui primitives
    admin/                          admin forms, Markdown editor, uploaders
    auth/                           auth forms
    content/markdown.tsx            safe Markdown renderer
    layout/                         header, footer, logo, mobile nav
    home/                           homepage sections from the approved design
  config/site.ts                    brand + navigation
  data/home.ts                      homepage content until it is served from Supabase
  lib/
    env.ts                          validated server env (server-only)
    storage/                        ★ storage abstraction (R2) — see STORAGE.md
    supabase/                       server / browser / admin / proxy clients + DB types
    auth/session.ts                 current user + role
    auth/guards.ts                  requireUser / requireStaff / requireAdmin (pages)
    auth/action-guard.ts            role check for Server Actions
  proxy.ts                          Next 16 proxy (formerly middleware)
supabase/
  migrations/…_init.sql             schema, RLS, triggers
  seed.sql                          article & question categories from the design
```

## Data model (summary)

- `profiles` — 1:1 with `auth.users`, `role` = member | editor | admin (only admins change roles).
- `media` — one row per R2 object: `bucket`, `object_key`, `public_url`, `mime_type`, `size_bytes`, `original_filename`, `visibility`, `status`, `owner_id`, `metadata`.
- `articles` (+ `article_categories`, `article_media` for inline images) → `featured_media_id`.
- `questions` (+ `question_categories`) — asker email hidden from public reads.
- `lectures` → `thumbnail_media_id`, `video_media_id`, `audio_media_id` (or `external_video_url`).
- `books` → `cover_media_id`, `file_media_id`.

Content tables reference `media.id`, never raw URLs, so replacing a file updates every page that uses it. Deleting a media row sets those references to `NULL`.

## Roles & access

| Action | member | editor | admin |
|---|---|---|---|
| Read published content | ✓ | ✓ | ✓ |
| Upload profile photo | ✓ | ✓ | ✓ |
| Upload article / book / lecture / Quran / Hadith media | – | ✓ | ✓ |
| Upload site assets | – | – | ✓ |
| Delete/replace own files | ✓ | ✓ | ✓ |
| Delete/replace any file | – | ✓ | ✓ |
| Change roles | – | – | ✓ |

## Security notes (auth & admin)

- Every admin page is guarded on the server (`requireStaff` in `admin/layout.tsx`); every Server Action re-checks the role (`actionUser`). Database RLS enforces the same rules a third time.
- Writes from the admin panel use the signed-in user's Supabase client, so RLS applies. The service-role client is used only where RLS can't (reading a question's asker email, listing auth users, changing roles), and only after an explicit role check.
- Post-login redirects accept only same-site relative paths (`safeNextPath`).
- Admins cannot remove their own admin role, which prevents locking everyone out.
- Pages that depend on the session always render per request (`connection()` in `getSessionUser`).
