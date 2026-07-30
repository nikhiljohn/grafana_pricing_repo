"""Memory Chat — natural language over the graph.

Flow:
1. Take the user's question.
2. Ask Claude to generate a read-only Cypher query scoped to the tenant.
3. Execute it against the graph.
4. Ask Claude to translate the result rows into a grounded natural-language
   answer, citing specific event/pattern ids.

Guardrails:
- Only read queries (MATCH, WITH, RETURN) allowed. Any CREATE/DELETE/MERGE
  is rejected.
- All queries must include `{tenant_id: $tenant_id}` — the client injects
  tenant_id as a parameter and refuses to run queries that don't reference it.
- Answers that can't be grounded in returned rows are refused with a
  "I don't have enough graph evidence to answer that" reply.
"""

import logging
import re

from app.db.neo4j import get_driver
from app.services.claude_client import ask_claude

logger = logging.getLogger(__name__)

CYPHER_SYSTEM_PROMPT = """You are a Cypher query generator for Intellicore Cloud Management Platform's Memory graph.

The graph schema:
- (:Event {tenant_id, id, event_type, category, severity, timestamp, title, summary, source})
  categories: cost | security | reliability | deployment | ai
  severities: info | warning | critical
- (:Resource {tenant_id, id, type})
- (:Pattern {tenant_id, id, title, category, occurrence_count, confidence, impact_estimate})
- Edges: (Event)-[:AFFECTS]->(Resource), (Event)-[:PRECEDED|CAUSED]->(Event),
         (Pattern)-[:EVIDENCED_BY]->(Event)

Rules:
1. Generate ONLY read queries (MATCH, WITH, RETURN, ORDER BY, LIMIT).
2. Every query MUST filter by tenant_id: {tenant_id: $tenant_id} on Event/Resource/Pattern matches.
3. Never use CREATE, DELETE, MERGE, SET, REMOVE, DROP, CALL.
4. Limit results to at most 50 rows.
5. Return only the Cypher query, no explanation, no code fences.
"""

ANSWER_SYSTEM_PROMPT = """You are the Intellicore Memory assistant for Intellicore CMP.
Given a user question and the graph rows that answer it, write a clear, concise reply.

Rules:
1. Only make claims that are directly supported by the rows.
2. Cite specific event ids (evt_...) or pattern ids (pat_...) in your reply.
3. If the rows are empty, say "I don't have enough graph evidence to answer that yet."
4. Keep answers under 200 words. Use short paragraphs, not bullets, unless the answer is a list.
5. Never invent event ids or facts.
"""

CYPHER_FORBIDDEN = re.compile(r"\b(CREATE|DELETE|MERGE|SET|REMOVE|DROP|CALL)\b", re.IGNORECASE)
CYPHER_TENANT_REQUIRED = re.compile(r"tenant_id\s*:\s*\$tenant_id", re.IGNORECASE)


async def answer_memory_question(*, tenant_id: str, question: str) -> dict:
    """Convert a natural-language question into a grounded, cited answer."""
    # Step 1 — generate Cypher
    try:
        cypher = await ask_claude(
            system=CYPHER_SYSTEM_PROMPT,
            user=f"Question: {question}\n\nGenerate the Cypher query:",
            max_tokens=400,
        )
        cypher = cypher.strip().removeprefix("```cypher").removeprefix("```").removesuffix("```").strip()
    except RuntimeError as exc:
        return {
            "answer": f"Memory Chat is not configured: {exc}",
            "cited_event_ids": [],
            "cited_pattern_ids": [],
            "cypher_used": None,
        }

    # Guardrail — reject writes, require tenant scoping
    if CYPHER_FORBIDDEN.search(cypher):
        return {
            "answer": "I generated an unsafe query and refused to run it. Please rephrase.",
            "cited_event_ids": [],
            "cited_pattern_ids": [],
            "cypher_used": cypher,
        }
    if not CYPHER_TENANT_REQUIRED.search(cypher):
        return {
            "answer": "I couldn't scope that query to your tenant safely. Please rephrase.",
            "cited_event_ids": [],
            "cited_pattern_ids": [],
            "cypher_used": cypher,
        }

    # Step 2 — execute
    driver = get_driver()
    try:
        async with driver.session() as session:
            result = await session.run(cypher, tenant_id=tenant_id)
            rows = [record.data() async for record in result]
    except Exception as exc:
        logger.warning("Cypher execution failed: %s", exc)
        return {
            "answer": f"I couldn't run that query: {exc}",
            "cited_event_ids": [],
            "cited_pattern_ids": [],
            "cypher_used": cypher,
        }

    # Step 3 — narrate
    row_text = "\n".join(str(r) for r in rows[:20])
    answer = await ask_claude(
        system=ANSWER_SYSTEM_PROMPT,
        user=f"Question: {question}\n\nGraph rows:\n{row_text or '(no results)'}",
        max_tokens=500,
    )

    # Extract cited ids for the frontend to link
    cited_events = list(set(re.findall(r"\bevt_[a-z0-9]+", answer)))
    cited_patterns = list(set(re.findall(r"\bpat_[a-z0-9_]+", answer)))

    return {
        "answer": answer,
        "cited_event_ids": cited_events,
        "cited_pattern_ids": cited_patterns,
        "cypher_used": cypher,
    }
