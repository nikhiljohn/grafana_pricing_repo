// Intellicore Memory — Neo4j schema
// Applied automatically by the backend at startup (see backend/app/db/neo4j.py).
// This file is provided as an operator reference and for manual reset scenarios.
//
// Run manually with: cypher-shell -f 01-schema.cypher

// ─── Uniqueness constraints (also create backing indexes) ───────────
CREATE CONSTRAINT event_id      IF NOT EXISTS FOR (e:Event)    REQUIRE (e.tenant_id, e.id) IS UNIQUE;
CREATE CONSTRAINT resource_id   IF NOT EXISTS FOR (r:Resource) REQUIRE (r.tenant_id, r.id) IS UNIQUE;
CREATE CONSTRAINT pattern_id    IF NOT EXISTS FOR (p:Pattern)  REQUIRE (p.tenant_id, p.id) IS UNIQUE;
CREATE CONSTRAINT tenant_id     IF NOT EXISTS FOR (t:Tenant)   REQUIRE  t.id IS UNIQUE;

// ─── Query indexes ─────────────────────────────────────────────────
CREATE INDEX event_tenant_ts       IF NOT EXISTS FOR (e:Event)    ON (e.tenant_id, e.timestamp);
CREATE INDEX event_tenant_type     IF NOT EXISTS FOR (e:Event)    ON (e.tenant_id, e.event_type);
CREATE INDEX event_tenant_severity IF NOT EXISTS FOR (e:Event)    ON (e.tenant_id, e.severity);
CREATE INDEX event_tenant_category IF NOT EXISTS FOR (e:Event)    ON (e.tenant_id, e.category);
CREATE INDEX resource_tenant_type  IF NOT EXISTS FOR (r:Resource) ON (r.tenant_id, r.type);
CREATE INDEX pattern_tenant_conf   IF NOT EXISTS FOR (p:Pattern)  ON (p.tenant_id, p.confidence);
