# File storage — Cloudflare R2

All files for Zadulmuslim live in **Cloudflare R2**. PostgreSQL stores only metadata in `public.media`.

## The abstraction

Application code imports from **`@/lib/storage`** only:

| Function | Purpose |
|---|---|
| `initiateUpload(user, req)` | Validate + authorise, reserve a key, insert a `pending` row, return a presigned PUT |
| `completeUpload(user, id)` | Verify the object in R2 (exists, exact size, real file type by magic bytes) → `ready` |
| `uploadFromServer(user, { category, file })` | Server-side upload of small files (Server Actions, ≤ 4 MB) |
| `initiateReplace(user, id, req)` | Upload a new version; on completion the **same id** points to the new object and the old object is deleted |
| `deleteMedia(user, id)` | Soft-delete row → delete R2 object → delete row (FKs become `NULL`) |
| `getAccessUrl(user, id, { download })` | Public URL, or a 5-minute signed URL after an access check |
| `getMedia`, `toPublicMedia` | Safe metadata for the client |
| `cleanupStaleMedia()` | Cron: remove abandoned `pending` uploads, retry failed deletes |

Only `src/lib/storage/r2.ts` talks to R2. It is `server-only`, so importing it from a client component fails the build. Browser code uses `src/lib/storage/client-upload.ts`, which never sees credentials.

## Object keys

```
<prefix><yyyy>/<mm>/<uuid>-<ascii-slug>.<ext>
articles/2026/11/7c1e…-taqlid-keno-joruri.webp
```

| Category | Prefix | Types | Max | Default visibility | Who can upload |
|---|---|---|---|---|---|
| article-featured | `articles/` | images | 5 MB | public | editor |
| article-inline | `articles/inline/` | images | 5 MB | public | editor |
| quran | `quran/` | PDF/EPUB, images, audio | 200 MB | public | editor |
| hadith | `hadith/` | PDF/EPUB, images | 100 MB | public | editor |
| book | `books/` | PDF/EPUB, images | 200 MB | public | editor |
| lecture-thumbnail | `lectures/thumbnails/` | images | 5 MB | public | editor |
| lecture-video | `lectures/video/` | MP4, WebM | 2 GB | public | editor |
| audio | `audio/` | MP3, M4A, AAC, OGG, WAV, WebM | 300 MB | public | editor |
| document | `documents/` | PDF/EPUB | 50 MB | **private** | editor |
| profile | `profiles/` | JPEG/PNG/WebP | 2 MB | public | member |
| site-asset | `site-assets/` | images | 10 MB | public | admin |

Change these limits in `src/lib/storage/categories.ts`. SVG uploads are deliberately not allowed (script-injection risk). R2 single PUT uploads are capped at 5 GB; anything larger needs multipart upload.

## Visibility

- **public**: served permanently from `R2_PUBLIC_URL` (custom domain, CDN-cached, `immutable`).
- **authenticated**: any signed-in user gets a signed URL.
- **private**: owner or editor/admin only, via a signed URL.

Non-public files go to `R2_PRIVATE_BUCKET_NAME` (a bucket with **no** public domain), which is recommended. If that variable is empty they are stored under `private/` in the main bucket. In that case, add a Cloudflare WAF rule on the public domain that blocks `/private/*`.

## Upload flow (browser)

```ts
import { uploadFile } from "@/lib/storage/client-upload";
const media = await uploadFile(file, { category: "article-featured", onProgress: setPct });
// media.id → save as articles.featured_media_id
```

1. `POST /api/media/uploads` with `{ category, filename, mimeType, size }`. The server validates type, extension, size and role.
2. The browser sends `PUT` to the presigned URL. Content-Type and Content-Length are signed, so they can't be altered.
3. `POST /api/media/uploads/:id/complete`. The server checks the object's size and first bytes; a mismatch deletes the object.

Replace: `uploadFile(file, { category, replaceId })`. Delete: `DELETE /api/media/:id`. Private download: link to `/api/media/:id/download`.

## Cloudflare setup

1. **R2 → Create bucket** `zadulmuslim-media` (public), and optionally `zadulmuslim-private`.
2. **Public bucket → Settings → Custom Domains**: connect, e.g. `media.zadulmuslim.com`, and set it as `R2_PUBLIC_URL`. Don't enable the `r2.dev` URL in production.
3. **R2 → Manage API tokens**: create an *Object Read & Write* token scoped to these buckets only. Copy the Access Key ID and Secret into `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`. `R2_ACCOUNT_ID` is shown on the R2 overview page.
4. **CORS** on both buckets (needed for browser PUTs and signed GETs):

```json
[
  {
    "AllowedOrigins": ["https://zadulmuslim.com", "https://www.zadulmuslim.com", "http://localhost:3000"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["content-type", "cache-control"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Replace the origins with your real domains and Vercel preview domain.

5. Optional: add a lifecycle rule to abort incomplete multipart uploads after 1 day.
