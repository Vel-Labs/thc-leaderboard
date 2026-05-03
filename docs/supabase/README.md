# Supabase Setup for THC Leaderboard

This app can run with local JSON storage for development and Supabase for the public registry. Supabase should be treated as the registry and queue substrate, not as scoring authority.

## Security Model

- Public users can read owners, repositories, reports, report events, achievements, owner achievements, and in-app repo stars.
- Authenticated users can create/delete only their own in-app repo stars.
- Authenticated users can create and read only their own feedback.
- Clients cannot write reports, owner records, repository records, achievements, review events, or review jobs directly.
- Server routes and the external worker use `SUPABASE_SECRET_KEY` for privileged writes.
- THC scoring remains derived from public repository evidence. GitHub login, achievements, stars, feedback, or owner reputation never affect score.

## Environment Variables

Copy `.env.example` to `.env.local` and fill:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=
SUPABASE_SECRET_KEY=
THC_SITE_URL=
THC_STORAGE_DRIVER=supabase
THC_REVIEW_RATE_LIMIT_PER_HOUR=4
THC_REVIEW_RATE_LIMIT_BYPASS_GITHUB_LOGINS=velcrafting
THC_PREVIEW_RATE_LIMIT_PER_HOUR=30
GITHUB_TOKEN=
THC_GITHUB_FETCH_TIMEOUT_MS=8000
THC_MINIMAX_TIMEOUT_MS=30000
THC_REVIEW_WORKER_SHARED_SECRET=
```

Use `THC_STORAGE_DRIVER=file` only for local development. Use `THC_STORAGE_DRIVER=supabase` for public v1 so reports are written to `owners`, `repositories`, `reports`, and `report_events` with `SUPABASE_SECRET_KEY` on the server.

## Database Setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Run `docs/supabase/schema.sql`.
4. Confirm Row Level Security is enabled for every table in the SQL file.
5. Confirm anon/authenticated users cannot insert into:
   - `owners`
   - `repositories`
   - `reports`
   - `report_events`
   - `achievements`
   - `owner_achievements`
   - `review_jobs`
   - `review_submissions`
6. Confirm authenticated users can insert/delete only their own `repo_stars`.
7. Confirm authenticated users can insert/read only their own `feedback`.

## GitHub Auth

Supabase supports GitHub OAuth. The secure flow is:

1. Create a GitHub OAuth app.
2. Use the Supabase callback URL:
   `https://<project-ref>.supabase.co/auth/v1/callback`
3. Enable GitHub under Supabase Auth providers.
4. Store the GitHub OAuth client secret only in Supabase provider settings.
5. In the app, use Supabase Auth only to identify the signed-in GitHub user.

GitHub login proves account control. It does not prove ownership of every submitted repo. For owner-sensitive features, use one of:

- repo owner matches the GitHub login,
- verified org membership with explicit GitHub scopes,
- a committed public verification file,
- a committed local THC provenance artifact signed or authored by that account.

## Public Review Submissions

When Supabase is configured, `/api/repositories/preview` and `/api/reviews` require a signed-in Supabase/GitHub session. The browser sends the current Supabase access token to the route, and the route verifies it server-side before doing GitHub or review work. The server checks successful saved submissions before review work and inserts into `review_submissions` only after the report is saved, so failed provider/platform attempts do not burn user quota. `velcrafting` is always bypassed for owner testing; add more comma-separated GitHub logins with `THC_REVIEW_RATE_LIMIT_BYPASS_GITHUB_LOGINS`.

Browser session policy is intentionally simple: Supabase persists the user session with PKCE and auto-refresh under a named app storage key. The app does not create a second custom auth cookie or store server secrets in the browser. Server routes remain the authority for protected writes.

Production review generation also requires `MINIMAX_API_KEY`. If MiniMax is not configured, production review creation fails closed instead of publishing mock AI reasoning. Provider timeouts and transient provider failures fall back to clearly labeled deterministic section notes so public scoring and report persistence can still complete. `MINIMAX_ALLOW_MOCKS=true` is only for explicit local/demo use. External GitHub and MiniMax calls are timeout-bounded; set `GITHUB_TOKEN` in production to raise GitHub API rate limits.

## In-App Repo Stars

In-app stars are allowed and useful for UX, but they are not GitHub stars. Label them as app stars or community stars.

Rules:

- Require GitHub login.
- Store one row per `(repository_id, user_id)` in `repo_stars`.
- Do not use app stars in score, level, caps, owner achievements, or methodology claims.
- Display GitHub stars separately from app stars.

## Feedback

Feedback should help improve the methodology and review quality without becoming scoring truth.

Suggested types:

- `methodology`
- `report`
- `false_positive`
- `false_negative`
- `feature_request`

Do not automatically alter scores from feedback. Treat feedback as triage input.

## Achievements

Achievements are value-add signals derived from public reports. They are not score inputs.

Examples:

- First Public Review
- THC-3 Repo
- THC-4 Repo
- No Caps Applied
- Hidden Trust Reducer
- Most Improved Repo
- Multi-Repo Builder
- High-Clarity Owner
- Consistent Hardened Builder

Award achievements from server/worker jobs after reports are saved.

## Worker Queue

For safe scaling, Vercel cron should enqueue jobs only. A separate worker should poll Supabase outbound and process reviews.

Worker rules:

- No inbound public tunnel.
- Store `SUPABASE_SECRET_KEY` only on the worker and server.
- Clone repos into disposable temp directories.
- Do not mount host secrets into repo workspaces.
- Do not execute project code by default.
- If sandboxed tests are added later, run them in a locked-down container with timeouts, memory/CPU limits, no host mounts, and no credentials.
- Deduplicate re-reviews by repository and current commit SHA.
- Preserve old reports for history charts.

## History Surfaces

The schema supports:

- repo score history by commit,
- owner scoreboards across repos,
- owner achievement profiles,
- improvement-over-time charts,
- repeated hidden-trust pattern analysis.

Those should be computed from stored public reports, not from GitHub reputation.
