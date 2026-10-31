-- PostgreSQL foundation. Apply with a migration account, never the app role.
BEGIN;
CREATE TABLE IF NOT EXISTS economic_release (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 provider text NOT NULL, provider_id text NOT NULL,
 UNIQUE(provider,provider_id)
);
CREATE TABLE IF NOT EXISTS economic_release_version (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 release_id bigint NOT NULL REFERENCES economic_release(id),
 captured_at timestamptz NOT NULL DEFAULT now(),
 scheduled_at timestamptz,
 content_hash text NOT NULL,
 payload jsonb NOT NULL,
 UNIQUE(release_id,content_hash)
);
CREATE INDEX IF NOT EXISTS release_versions_timeline ON economic_release_version(release_id,captured_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS release_versions_calendar ON economic_release_version(scheduled_at,id);
CREATE TABLE IF NOT EXISTS collection_run (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 started_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz,
 requested_from timestamptz NOT NULL, requested_to timestamptz NOT NULL,
 status text NOT NULL CHECK(status IN ('running','complete','failed')),
 records_seen integer, error_code text
);
CREATE TABLE IF NOT EXISTS trade_version (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 owner_id uuid NOT NULL, trade_id uuid NOT NULL,
 captured_at timestamptz NOT NULL DEFAULT now(),
 revision integer NOT NULL CHECK(revision>0), payload jsonb NOT NULL,
 UNIQUE(owner_id,trade_id,revision)
);
CREATE INDEX IF NOT EXISTS trade_versions_owner ON trade_version(owner_id,trade_id,revision DESC);
CREATE TABLE IF NOT EXISTS trade_release_snapshot (
 trade_version_id bigint NOT NULL REFERENCES trade_version(id),
 release_version_id bigint NOT NULL REFERENCES economic_release_version(id),
 PRIMARY KEY(trade_version_id,release_version_id)
);
CREATE OR REPLACE FUNCTION reject_archive_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Archive versions are immutable; append a new version'; END;
$$;
CREATE TRIGGER immutable_release BEFORE UPDATE OR DELETE ON economic_release_version FOR EACH ROW EXECUTE FUNCTION reject_archive_mutation();
CREATE TRIGGER immutable_trade BEFORE UPDATE OR DELETE ON trade_version FOR EACH ROW EXECUTE FUNCTION reject_archive_mutation();
CREATE TRIGGER immutable_trade_context BEFORE UPDATE OR DELETE ON trade_release_snapshot FOR EACH ROW EXECUTE FUNCTION reject_archive_mutation();
ALTER TABLE trade_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_release_snapshot ENABLE ROW LEVEL SECURITY;
-- Deliberately no public policy: private records remain inaccessible until auth is configured.
REVOKE ALL ON trade_version,trade_release_snapshot FROM PUBLIC;
COMMIT;
