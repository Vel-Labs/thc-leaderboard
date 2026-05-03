# THC Leaderboard

Next.js app for Automated Public Review reports using the THC methodology: Truth, Hardening, and Clarity.

The app can run locally with file-backed report JSON. Supabase setup docs and SQL are included for the public registry, auth, feedback, achievements, app stars, review jobs, owner scoreboards, and report history.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment

Copy `.env.example` to `.env.local`.

Required for live MiniMax review:

```txt
MINIMAX_API_KEY=
MINIMAX_MODEL=MiniMax-M2.7
THC_MINIMAX_TIMEOUT_MS=30000
```

Supabase registry setup for public v1:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
THC_STORAGE_DRIVER=supabase
THC_REVIEW_RATE_LIMIT_PER_HOUR=4
THC_REVIEW_RATE_LIMIT_BYPASS_GITHUB_LOGINS=velcrafting
```

Recommended for public launch:

```txt
NEXT_PUBLIC_SITE_URL=https://thcmethod.com
THC_SITE_URL=https://thcmethod.com
GITHUB_TOKEN=
THC_GITHUB_FETCH_TIMEOUT_MS=8000
THC_PREVIEW_RATE_LIMIT_PER_HOUR=30
```

See `docs/supabase/README.md` and `docs/supabase/schema.sql`.

Local development can keep `THC_STORAGE_DRIVER=file`. Production should use `supabase` so reports persist across deploys and appear in the public registry.

## Trust Boundaries

- Public reports are review artifacts, not certification.
- GitHub login can identify a user, but it does not automatically prove repo ownership.
- App stars, feedback, achievements, and owner profiles never affect THC score.
- Local THC artifacts are input hints; public review recomputes from public repository state.

## Supabase

Run `docs/supabase/schema.sql` in Supabase SQL Editor after creating a project. RLS is enabled on every table. Public reads are allowed for registry artifacts; privileged writes are reserved for server/worker secrets.

GitHub OAuth is supported by Supabase Auth and should be used for identity, feedback, app stars, and future owner profiles.

Public preview and review submissions require GitHub sign-in when Supabase is configured. Anonymous local submissions are only a development fallback. Supabase-backed deployments check `review_submissions` before review work and record a submission only after a report is saved, so failed provider or platform attempts do not burn quota. `velcrafting` is always bypassed; add more comma-separated GitHub logins with `THC_REVIEW_RATE_LIMIT_BYPASS_GITHUB_LOGINS`.

Browser auth uses Supabase's persisted PKCE session under a named app storage key. The browser never receives `SUPABASE_SECRET_KEY`; server routes verify bearer tokens before writes.

MiniMax is treated as a bounded sidecar for review notes. Production still requires `MINIMAX_API_KEY`, but provider timeouts, transient provider errors, and malformed provider output do not block deterministic THC scoring or report persistence.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
