-- v30: Read-only system facts for the admin System Status page
--
-- Returns a handful of facts about this database so the page can show what is true instead of what is assumed:
-- server version, size, how many tables are protected by row-level security, which tables publish change events to
-- the realtime service, and how many migrations have been applied. It reads catalog metadata only (no patient or
-- business data) and is limited to administrators.

CREATE OR REPLACE FUNCTION public.system_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_migrations jsonb;
BEGIN
  PERFORM public.require_role(ARRAY['admin']);

  BEGIN
    SELECT jsonb_build_object('count', count(*), 'latest', max(version))
      INTO v_migrations FROM supabase_migrations.schema_migrations;
  EXCEPTION WHEN OTHERS THEN
    v_migrations := NULL;
  END;

  RETURN jsonb_build_object(
    'server_time', now(),
    'pg_version', current_setting('server_version'),
    'db_size_bytes', pg_database_size(current_database()),
    'tables', (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r'),
    'tables_without_rls', (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity),
    'functions', (SELECT count(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND prokind = 'f'),
    'migrations', v_migrations,
    'extensions', (SELECT coalesce(jsonb_agg(extname ORDER BY extname), '[]'::jsonb) FROM pg_extension WHERE extname <> 'plpgsql'),
    'realtime_tables', (SELECT coalesce(jsonb_agg(tablename ORDER BY tablename), '[]'::jsonb) FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public'),
    'accounts', (SELECT count(*) FROM auth.users)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.system_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.system_status() TO authenticated;
