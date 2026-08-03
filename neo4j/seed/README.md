# Seed data

The demo Memory graph is not loaded from Cypher files — it is generated
programmatically by `backend/scripts/seed_demo.py` so we can synthesize
timestamps relative to "today" (so the graph always looks fresh).

**Load the demo graph:**

```bash
make seed
```

This runs the mock event adapter → ingests events → runs pattern detection.
Result: ~50 events, ~15 resources, and 5+ surfaced patterns for the
`demo-tenant`.

**Manual reset:**

```bash
make shell-neo4j
# In the Cypher shell:
MATCH (n) WHERE n.tenant_id = 'demo-tenant' DETACH DELETE n;
```

Then re-seed.
