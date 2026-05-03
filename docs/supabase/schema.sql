-- THC Leaderboard Supabase schema.
-- Apply in Supabase SQL Editor after creating the project.
-- Principle: public reports are readable; report writes and review jobs are server/worker only.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_login TEXT NOT NULL UNIQUE,
  github_url TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.owners IS 'Public GitHub owners derived from reviewed repositories.';

CREATE TABLE IF NOT EXISTS public.repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.owners(id) ON DELETE RESTRICT,
  github_owner TEXT NOT NULL,
  github_repo TEXT NOT NULL,
  repository_url TEXT NOT NULL UNIQUE,
  default_branch TEXT,
  description TEXT,
  stars_count INTEGER NOT NULL DEFAULT 0 CHECK (stars_count >= 0),
  forks_count INTEGER NOT NULL DEFAULT 0 CHECK (forks_count >= 0),
  open_issues_count INTEGER NOT NULL DEFAULT 0 CHECK (open_issues_count >= 0),
  last_reviewed_commit_sha TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (github_owner, github_repo)
);

COMMENT ON TABLE public.repositories IS 'Public GitHub repositories known to THC Leaderboard.';

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY,
  repository_id UUID NOT NULL REFERENCES public.repositories(id) ON DELETE RESTRICT,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_name TEXT NOT NULL,
  repository_url TEXT NOT NULL,
  reviewed_commit_sha TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  rubric_version TEXT NOT NULL,
  review_label TEXT NOT NULL CHECK (review_label = 'Automated Public Review'),
  recommended_level TEXT NOT NULL,
  total_score INTEGER NOT NULL CHECK (total_score BETWEEN 0 AND 100),
  confidence TEXT NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
  truth_score INTEGER NOT NULL DEFAULT 0 CHECK (truth_score BETWEEN 0 AND 30),
  hardening_score INTEGER NOT NULL DEFAULT 0 CHECK (hardening_score BETWEEN 0 AND 35),
  clarity_score INTEGER NOT NULL DEFAULT 0 CHECK (clarity_score BETWEEN 0 AND 25),
  audit_history_score INTEGER NOT NULL DEFAULT 0 CHECK (audit_history_score BETWEEN 0 AND 10),
  top_strength TEXT NOT NULL,
  top_hidden_trust_finding TEXT NOT NULL,
  report JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (repository_id, reviewed_commit_sha, generated_at)
);

COMMENT ON TABLE public.reports IS 'Immutable public THC review artifacts. Scoring truth lives in the report payload plus indexed columns.';

CREATE TABLE IF NOT EXISTS public.report_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID NOT NULL REFERENCES public.repositories(id) ON DELETE CASCADE,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('submitted', 'queued', 'started', 'completed', 'failed', 're_reviewed')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.report_events IS 'Append-only audit trail for review lifecycle events.';

CREATE TABLE IF NOT EXISTS public.repo_stars (
  repository_id UUID NOT NULL REFERENCES public.repositories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (repository_id, user_id)
);

COMMENT ON TABLE public.repo_stars IS 'In-app stars by authenticated users. This does not affect THC scoring.';

CREATE TABLE IF NOT EXISTS public.github_profiles (
  github_login TEXT PRIMARY KEY,
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  dank_accessories JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.github_profiles IS 'Public GitHub-linked profile settings, including mode-specific cosmetic loadouts. These are display-only and never affect THC scoring.';

CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  repository_id UUID REFERENCES public.repositories(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('methodology', 'report', 'false_positive', 'false_negative', 'feature_request')),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 10 AND 4000),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'accepted', 'declined', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.feedback IS 'Authenticated feedback queue for reports and methodology improvements.';

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.achievements IS 'Public achievement definitions. Achievements are value-add signals, not THC score inputs.';

CREATE TABLE IF NOT EXISTS public.owner_achievements (
  owner_id UUID NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  awarded_from_report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_id, achievement_id)
);

COMMENT ON TABLE public.owner_achievements IS 'Derived owner achievements from public review artifacts.';

CREATE TABLE IF NOT EXISTS public.review_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_url TEXT NOT NULL,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'leased', 'completed', 'failed', 'cancelled')),
  priority INTEGER NOT NULL DEFAULT 0,
  run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lease_owner TEXT,
  leased_until TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error TEXT,
  report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.review_jobs IS 'Server/worker-only queue. Clients must not write directly.';

CREATE TABLE IF NOT EXISTS public.review_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repository_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.review_submissions IS 'Server-written submission ledger used for durable per-user review limits.';

CREATE OR REPLACE FUNCTION public.register_review_submission(
  p_user_id UUID,
  p_repository_url TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER DEFAULT 3600
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  submission_count INTEGER;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'service_role_required';
  END IF;

  IF p_limit < 1 OR p_limit > 100 THEN
    RAISE EXCEPTION 'invalid_review_submission_limit';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::TEXT, 0));

  SELECT COUNT(*)
  INTO submission_count
  FROM public.review_submissions
  WHERE user_id = p_user_id
    AND created_at >= NOW() - make_interval(secs => p_window_seconds);

  IF submission_count >= p_limit THEN
    RAISE EXCEPTION 'review_submission_limit_exceeded';
  END IF;

  INSERT INTO public.review_submissions (user_id, repository_url)
  VALUES (p_user_id, p_repository_url);
END;
$$;

REVOKE ALL ON FUNCTION public.register_review_submission(UUID, TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.register_review_submission(UUID, TEXT, INTEGER, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.register_review_submission(UUID, TEXT, INTEGER, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.register_review_submission(UUID, TEXT, INTEGER, INTEGER) TO service_role;

CREATE INDEX IF NOT EXISTS idx_repositories_owner_id ON public.repositories(owner_id);
CREATE INDEX IF NOT EXISTS idx_reports_repository_generated ON public.reports(repository_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_total_score ON public.reports(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_reports_truth_score ON public.reports(truth_score DESC);
CREATE INDEX IF NOT EXISTS idx_reports_hardening_score ON public.reports(hardening_score DESC);
CREATE INDEX IF NOT EXISTS idx_reports_clarity_score ON public.reports(clarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_reports_audit_history_score ON public.reports(audit_history_score DESC);
CREATE INDEX IF NOT EXISTS idx_report_events_repository_created ON public.report_events(repository_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_repo_stars_user_id ON public.repo_stars(user_id);
CREATE INDEX IF NOT EXISTS idx_github_profiles_auth_user_id ON public.github_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_created ON public.feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_jobs_status_run_after ON public.review_jobs(status, run_after);
CREATE INDEX IF NOT EXISTS idx_review_submissions_user_created ON public.review_submissions(user_id, created_at DESC);

ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repo_stars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners are public readable"
ON public.owners FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "repositories are public readable"
ON public.repositories FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "reports are public readable"
ON public.reports FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "report events are public readable"
ON public.report_events FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "repo stars are public readable"
ON public.repo_stars FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "authenticated users can star repos"
ON public.repo_stars FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "authenticated users can unstar own repo stars"
ON public.repo_stars FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "github profiles are public readable"
ON public.github_profiles FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "authenticated users can create own github profile"
ON public.github_profiles FOR INSERT TO authenticated
WITH CHECK (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "authenticated users can update own github profile"
ON public.github_profiles FOR UPDATE TO authenticated
USING (auth_user_id = (SELECT auth.uid()))
WITH CHECK (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "authenticated users can create own feedback"
ON public.feedback FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "authenticated users can read own feedback"
ON public.feedback FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "achievements are public readable"
ON public.achievements FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "owner achievements are public readable"
ON public.owner_achievements FOR SELECT TO anon, authenticated
USING (true);

-- No anon/authenticated write policies exist for owners, repositories, reports,
-- report_events, achievements, owner_achievements, review_jobs, or
-- review_submissions.
-- Those writes must happen through server-side routes or the external worker
-- using SUPABASE_SECRET_KEY / service role.

CREATE OR REPLACE VIEW public.owner_scoreboard AS
SELECT
  o.id AS owner_id,
  o.github_login,
  o.github_url,
  COUNT(DISTINCT r.repository_id) AS reviewed_repositories,
  COUNT(*) AS report_count,
  ROUND(AVG(r.total_score)::numeric, 2) AS average_total_score,
  MAX(r.total_score) AS best_total_score,
  ROUND(AVG(r.truth_score)::numeric, 2) AS average_truth_score,
  ROUND(AVG(r.hardening_score)::numeric, 2) AS average_hardening_score,
  ROUND(AVG(r.clarity_score)::numeric, 2) AS average_clarity_score,
  ROUND(AVG(r.audit_history_score)::numeric, 2) AS average_audit_history_score,
  MAX(r.generated_at) AS last_reviewed_at
FROM public.owners o
JOIN public.repositories repo ON repo.owner_id = o.id
JOIN public.reports r ON r.repository_id = repo.id
GROUP BY o.id, o.github_login, o.github_url;

CREATE OR REPLACE VIEW public.repository_score_history AS
SELECT
  repo.id AS repository_id,
  repo.github_owner,
  repo.github_repo,
  repo.repository_url,
  r.id AS report_id,
  r.reviewed_commit_sha,
  r.generated_at,
  r.recommended_level,
  r.total_score,
  r.truth_score,
  r.hardening_score,
  r.clarity_score,
  r.audit_history_score
FROM public.repositories repo
JOIN public.reports r ON r.repository_id = repo.id
ORDER BY repo.github_owner, repo.github_repo, r.generated_at;

GRANT SELECT ON public.owner_scoreboard TO anon, authenticated;
GRANT SELECT ON public.repository_score_history TO anon, authenticated;
