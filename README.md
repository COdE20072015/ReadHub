# ReadHub

Unified comic and book reader web app — upload EPUB, PDF, and more, then read in-browser with progress tracking.

## Phase 1 MVP

- Email/password authentication
- Drag-and-drop file upload (EPUB, PDF)
- Dashboard with grid/list views, search, filters, and Continue Reading
- EPUB reader (paginated, font size, themes)
- PDF reader (page/scroll modes, zoom, keyboard navigation)
- Auto-save reading progress per document
- **Vercel-ready:** PostgreSQL + Vercel Blob / S3-R2 storage

---

## Local development

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- PostgreSQL database ([Neon](https://neon.tech) free tier works great)

### Setup

```bash
cd readhub
cp .env.example .env
# Edit .env — set DATABASE_URL to your Postgres connection string
npm install
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For local dev, leave `STORAGE_PROVIDER=local` (default). Files are stored in `./storage`.

---

## Deploy to Vercel

### 1. Create cloud services

| Service | Recommendation | Purpose |
|---|---|---|
| **Database** | [Neon](https://neon.tech) or [Vercel Postgres](https://vercel.com/storage/postgres) | User data, documents, progress |
| **File storage** | [Vercel Blob](https://vercel.com/storage/blob) or [Cloudflare R2](https://developers.cloudflare.com/r2/) | EPUB/PDF files and covers |

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "Initial ReadHub MVP"
git remote add origin <your-repo-url>
git push -u origin main
```

### 3. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) → import your repo
2. Set **Root Directory** to `readhub` if the repo root is `G:\APP`
3. Add environment variables (see below)
4. Deploy

### 4. Environment variables (Vercel dashboard)

**Required:**

| Variable | Example |
|---|---|
| `DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/readhub?sslmode=require` |
| `NEXTAUTH_SECRET` | Random 32+ char string (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `STORAGE_PROVIDER` | `blob` |
| `BLOB_READ_WRITE_TOKEN` | From Vercel → Storage → Blob → Create Store |

**For S3/R2 instead of Blob:**

| Variable | Example |
|---|---|
| `STORAGE_PROVIDER` | `s3` |
| `S3_BUCKET` | `readhub-files` |
| `S3_REGION` | `auto` |
| `S3_ACCESS_KEY_ID` | Your access key |
| `S3_SECRET_ACCESS_KEY` | Your secret key |
| `S3_ENDPOINT` | `https://<account>.r2.cloudflarestorage.com` |
| `S3_PUBLIC_URL` | `https://files.yourdomain.com` (optional CDN) |

### 5. Run database migration

Vercel runs `prisma migrate deploy` automatically during build (see `package.json` build script).

For first deploy, ensure your Postgres database is empty or compatible.

### 6. Enable Vercel Blob (if using blob storage)

1. Vercel project → **Storage** → **Create Database/Store** → **Blob**
2. Connect to project — this auto-sets `BLOB_READ_WRITE_TOKEN`
3. Redeploy

---

## Storage architecture

| Provider | When | Upload flow |
|---|---|---|
| `local` | Dev | Multipart POST to `/api/upload` |
| `blob` | Vercel | Browser → Vercel Blob (direct) → `/api/upload/register` |
| `s3` | R2/AWS | Browser → presigned S3 URL → `/api/upload/register` |

Cloud uploads bypass Vercel's 4.5 MB serverless body limit by uploading directly from the browser.

File and cover API routes still require authentication — they fetch from cloud storage server-side and stream to the reader.

---

## Project structure

```
readhub/
├── prisma/
│   ├── schema.prisma          # PostgreSQL schema
│   └── migrations/            # Versioned migrations
├── src/app/
│   ├── (auth)/                # Login, register
│   ├── (app)/                 # Dashboard, upload, reader
│   └── api/                   # REST + upload handlers
├── src/lib/storage/           # local | blob | s3 adapters
└── src/components/            # UI + readers
```

---

## Roadmap

| Phase | Features |
|---|---|
| **1 (MVP)** | Upload, dashboard, EPUB + PDF, progress, auth, Vercel deploy |
| **2** | CBZ/CBR comics, DOCX, collections/tags |
| **3** | Reading stats/gamification, offline cache, highlights |
| **4** | OCR, TXT/MOBI, shared collections |

---

## Tech stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS
- **Readers:** epub.js, PDF.js
- **Backend:** Next.js API routes (serverless)
- **Database:** Prisma + PostgreSQL
- **Auth:** NextAuth.js (credentials)
- **Storage:** Vercel Blob / S3-R2 / local disk

## License

Private — all rights reserved.
