-- Adds the post-webinar course email (1 hour after the webinar ends) for people who registered
-- before it existed. New registrations get it automatically. Safe to run more than once.
INSERT INTO public.webinar_notifications (registration_id, channel, template_key, scheduled_for)
SELECT r.id, 'email', 'post_webinar',
       s.scheduled_at + (COALESCE(s.duration, 60) + 60) * INTERVAL '1 minute'
FROM public.webinar_registrations r
JOIN public.live_sessions s ON s.id = r.live_session_id
WHERE s.status <> 'cancelled'
  AND s.scheduled_at + (COALESCE(s.duration, 60) + 60) * INTERVAL '1 minute' > NOW()
ON CONFLICT (registration_id, channel, template_key) DO NOTHING;
