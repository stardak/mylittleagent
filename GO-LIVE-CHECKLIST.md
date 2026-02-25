# 🚀 Go-Live Checklist — My Little Agent

Everything that needs to happen when moving from local development to production at **www.mylittleagent.co**.

---

## 1. Domain & DNS

- [ ] Purchase/connect domain `mylittleagent.co`
- [ ] Point DNS to hosting provider (Vercel recommended for Next.js)
- [ ] Add `www.mylittleagent.co` as primary domain in Vercel dashboard
- [ ] Enable HTTPS / SSL certificate (automatic on Vercel)
- [ ] Set up any required subdomains (e.g. `api.mylittleagent.co` if needed)

## 2. Hosting & Deployment

- [ ] Create Vercel project linked to the Git repo
- [ ] Set Node.js version to match local (`>=18`)
- [ ] Configure build command: `npx prisma generate && next build`
- [ ] Verify production build succeeds: `npm run build`
- [ ] Set up CI/CD — pushes to `main` auto-deploy to production
- [ ] Configure preview deployments for PRs (Vercel does this by default)

## 3. Database (PostgreSQL)

- [ ] Provision a managed PostgreSQL database (recommended: **Neon**, Supabase, or Railway)
- [ ] Set `DATABASE_URL` in production environment variables
- [ ] Run `npx prisma db push` or `npx prisma migrate deploy` against production DB
- [ ] Enable connection pooling (PgBouncer / Neon's pooler) for serverless compatibility
- [ ] Set up automated database backups
- [ ] Verify Prisma can connect from deployed serverless functions

## 4. Environment Variables

All of these must be set in the hosting provider's environment settings:

| Variable | Description | Action |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Point to production DB |
| `AUTH_SECRET` | NextAuth.js secret | Generate a new, strong random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Canonical app URL | Set to `https://www.mylittleagent.co` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Update authorised redirect URIs in Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Same project, same secret |
| `ENCRYPTION_KEY` | Key for encrypting API keys at rest | Generate a new production key, **never reuse the dev key** |

> [!CAUTION]
> Never commit `.env` to Git. Use the hosting provider's secrets UI.

## 5. Authentication & OAuth

- [ ] Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
- [ ] Add `https://www.mylittleagent.co/api/auth/callback/google` to **Authorised redirect URIs**
- [ ] Remove any `localhost` redirect URIs (or keep them for dev only)
- [ ] Verify Google sign-in works on the live domain
- [ ] If using credentials auth, ensure passwords are properly hashed (bcrypt — ✅ already done)

## 6. Email & Gmail

- [ ] Set up Google Workspace or Gmail for `hello@mylittleagent.co` (or similar)
- [ ] Connect domain in Google Workspace — add MX, SPF, DKIM, DMARC DNS records
- [ ] If the app sends emails (outreach, notifications), set up a transactional email provider:
  - Recommended: **Resend**, Postmark, or SendGrid
  - Add `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` env vars as needed
- [ ] Verify outreach email sending works with the production email setup

## 7. File Uploads & Storage

Currently uploads go to `public/uploads/` (local filesystem). This **will not work** on serverless (Vercel) because the filesystem is ephemeral.

- [ ] Migrate file uploads to cloud storage: **AWS S3**, **Cloudflare R2**, or **Vercel Blob**
- [ ] Update `/api/upload/route.ts` to write to cloud storage instead of `public/uploads/`
- [ ] Store returned URLs as full `https://` URLs in the database
- [ ] Set storage credentials as env vars (`S3_BUCKET`, `S3_ACCESS_KEY`, etc.)

## 8. Security Hardening

- [ ] Generate fresh `AUTH_SECRET` and `ENCRYPTION_KEY` for production
- [ ] Ensure all API routes validate authentication (✅ already using `auth()` middleware)
- [ ] Add rate limiting to public API endpoints (`/api/public/*`)
- [ ] Set `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options` headers
- [ ] Review CORS settings if any external apps will call the API
- [ ] Rotate any API keys that were used during development
- [ ] Add `Content-Security-Policy` header
- [ ] Ensure the `[slug]/mediacard` public route cannot be abused (rate limit, caching)

## 9. Performance & Caching

- [ ] Enable Next.js ISR or caching for the public media card page
- [ ] Add `Cache-Control` headers to static assets
- [ ] Consider a CDN for uploaded images (automatic on Vercel/Cloudflare)
- [ ] Monitor with Vercel Analytics or add a lightweight analytics tool

## 10. Monitoring & Error Tracking

- [ ] Set up error tracking: **Sentry** (recommended) or LogRocket
- [ ] Add `SENTRY_DSN` env var and install `@sentry/nextjs`
- [ ] Set up uptime monitoring (UptimeRobot, Better Stack, or similar)
- [ ] Configure alerts for 5xx errors and downtime

## 11. SEO & Meta

- [ ] Add proper `<title>` and `<meta description>` to all pages
- [ ] Create `/robots.txt` and `/sitemap.xml`
- [ ] Add Open Graph meta tags for the public media card page (so it previews nicely when shared)
- [ ] Submit sitemap to Google Search Console
- [ ] Add favicon and app icons

## 12. Legal & Compliance

- [ ] Add Privacy Policy page
- [ ] Add Terms of Service page
- [ ] Cookie consent banner (if serving EU users)
- [ ] GDPR — ensure user data can be exported/deleted on request

## 13. Pre-Launch Testing

- [ ] Full end-to-end test on staging/preview deployment
- [ ] Test Google OAuth sign-in on production domain
- [ ] Test onboarding flow creates workspace + brand profile
- [ ] Test media card generation, download, and public URL
- [ ] Test outreach email sending
- [ ] Test on mobile browsers (responsive)
- [ ] Load test critical API endpoints
- [ ] Verify database migrations applied cleanly

---

## Quick Reference — Deployment Commands

```bash
# Generate Prisma client
npx prisma generate

# Push schema to production DB
DATABASE_URL="your-production-url" npx prisma db push

# Build for production
npm run build

# Start production server (if self-hosting)
npm start
```

---

*Last updated: 24 Feb 2026*
