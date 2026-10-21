-- v11: Integration platform (connections, secrets, outbox, audit events, health)
--
-- Access model:
--   * Admins can read/write connection settings and read the outbox, events and health.
--   * Secrets are never readable from the client: RLS is enabled with no policies, so only the
--     service role (edge functions) can touch integration_secrets.
--   * Outbox, events and health are written by edge functions (service role) only.
--   * Clinical staff request an outbound message through enqueue_integration_message(), which
--     stores a reference (type + subject id), never the clinical payload itself.

CREATE TABLE IF NOT EXISTS integration_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('fhir', 'tpa', 'lis', 'erx', 'wearable', 'device', 'ledger')),
  name TEXT NOT NULL,
  endpoint_url TEXT,
  auth_type TEXT NOT NULL DEFAULT 'none' CHECK (auth_type IN ('none', 'bearer', 'basic', 'api_key_header')),
  auth_header_name TEXT,                       -- only used for api_key_header
  mode TEXT NOT NULL DEFAULT 'sandbox' CHECK (mode IN ('sandbox', 'live')),
  enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,   -- non-secret settings, e.g. {"sendNric": false}
  secret_set BOOLEAN NOT NULL DEFAULT false,   -- whether a credential is stored (the secret itself is never readable)
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integration_secrets (
  connection_id UUID PRIMARY KEY REFERENCES integration_connections(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integration_outbox (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,                    -- e.g. consultation.completed
  subject_type TEXT NOT NULL,                  -- e.g. visit
  subject_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'dead')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  UNIQUE (connection_id, event_type, subject_id)
);
CREATE INDEX IF NOT EXISTS integration_outbox_due_idx ON integration_outbox (status, next_retry_at);

-- Audit trail. `detail` must stay free of patient data and credentials (metadata only).
CREATE TABLE IF NOT EXISTS integration_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID REFERENCES integration_connections(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound', 'admin')),
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'blocked')),
  http_status INTEGER,
  detail TEXT,
  actor UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS integration_events_recent_idx ON integration_events (created_at DESC);

CREATE TABLE IF NOT EXISTS integration_health (
  connection_id UUID PRIMARY KEY REFERENCES integration_connections(id) ON DELETE CASCADE,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_latency_ms INTEGER,
  last_error TEXT,
  consecutive_failures INTEGER NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.touch_integration_connection() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS integration_connections_touch ON integration_connections;
CREATE TRIGGER integration_connections_touch BEFORE UPDATE ON integration_connections
  FOR EACH ROW EXECUTE FUNCTION public.touch_integration_connection();

-- Row level security
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_secrets ENABLE ROW LEVEL SECURITY;   -- no policies: service role only
ALTER TABLE integration_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage integration connections" ON integration_connections
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins read integration outbox" ON integration_outbox
  FOR SELECT TO authenticated USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins read integration events" ON integration_events
  FOR SELECT TO authenticated USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins read integration health" ON integration_health
  FOR SELECT TO authenticated USING (public.get_user_role() = 'admin');

-- Queue an outbound message for every enabled connection of a type.
-- Stores a reference only; the worker reads the record from the database when it sends.
CREATE OR REPLACE FUNCTION public.enqueue_integration_message(
  p_type TEXT, p_event TEXT, p_subject_type TEXT, p_subject_id TEXT
) RETURNS INTEGER AS $$
DECLARE
  queued INTEGER;
BEGIN
  IF auth.uid() IS NULL OR public.get_user_role() IS NULL THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  INSERT INTO integration_outbox (connection_id, event_type, subject_type, subject_id)
  SELECT c.id, p_event, p_subject_type, p_subject_id
  FROM integration_connections c
  WHERE c.type = p_type AND c.enabled
  ON CONFLICT (connection_id, event_type, subject_id) DO NOTHING;

  GET DIAGNOSTICS queued = ROW_COUNT;
  RETURN queued;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.enqueue_integration_message(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enqueue_integration_message(TEXT, TEXT, TEXT, TEXT) TO authenticated;
