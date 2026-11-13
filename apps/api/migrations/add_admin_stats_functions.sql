-- Aggregate admin stats in SQL instead of downloading every row to the API
-- (PostgREST also caps responses at 1000 rows by default, which made the old JS sums wrong).
-- Run this BEFORE deploying the API change that calls these functions.

-- Total revenue: sum of the course price over all enrollments (same semantics as before)
CREATE OR REPLACE FUNCTION public.admin_total_revenue()
RETURNS numeric
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(SUM(c.price), 0)
  FROM public.user_courses uc
  JOIN public.courses c ON c.id = uc.course_id;
$$;

-- Checklist stats; shape matches the API's `stats` response field
CREATE OR REPLACE FUNCTION public.admin_checklist_stats()
RETURNS json
LANGUAGE sql STABLE
AS $$
  SELECT json_build_object(
    'total', COUNT(*),
    'byStage', json_build_object(
      'awareness',    COUNT(*) FILTER (WHERE stage = 'awareness'),
      'builder',      COUNT(*) FILTER (WHERE stage = 'builder'),
      'professional', COUNT(*) FILTER (WHERE stage = 'professional'),
      'investor',     COUNT(*) FILTER (WHERE stage = 'investor')
    ),
    -- Only numeric scores count, like the old parseFloat/isNaN filter
    'avgScore', COALESCE(
      AVG(score::text::numeric) FILTER (WHERE score::text ~ '^\s*-?[0-9]+(\.[0-9]+)?\s*$'),
      0
    )
  )
  FROM public.checklist_responses;
$$;

-- Functions in `public` are callable through the REST API by anyone; keep these admin-only
REVOKE EXECUTE ON FUNCTION public.admin_total_revenue() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_checklist_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_total_revenue() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_checklist_stats() TO service_role;
