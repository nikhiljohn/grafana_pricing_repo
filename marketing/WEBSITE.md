# Intellicore CMP — Marketing Website

Standalone marketing site for Intellicore CMP, Searce's AI-native cloud
management platform. No build step, no JS framework — three static
HTML/CSS files, deployed straight to a GCS bucket configured for static
website hosting.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Homepage — hero, trust bar, problem/contrast section, three product deep-dives, six-pillar overview, stats, architecture strip, customer quote, FAQ, CTA |
| `features.html` | Every feature as a one-line description + a concrete example, grouped by pillar (CloudOps, FinOps, Cloud Security, DevOps, AIOps, Memory) plus Assets/CMDB and platform-wide capabilities |
| `team.html` | Founder + team bios, photos, quotes, LinkedIn links |

## Design system

- **Theme**: light/white page background with CSS custom properties
  (`--navy`, `--panel`, `--text`, `--muted`, `-ink` variants for
  text-on-white contrast). The diagram "screens" (`.graph-card`,
  `.p-visual`, `.pillar-anim-wrap`) are intentionally kept dark — a
  device-screen-floating-on-a-light-page look.
- **Icons**: a single SVG `<symbol>` sprite defined once after `<body>`,
  reused everywhere via `<use href="#ic-...">` (server, db, shield, key,
  pulse, graph, check).
- **Lit-sequence animation**: every diagram (hero, product deep-dives, six
  pillar cards) uses a shared `@keyframes lit` pulse with staggered
  `animation-delay` per node/edge, paired with a numbered `.pf-story`
  caption list underneath that narrates the sequence in plain language —
  "this happened → here's what Intellicore did → here's what's next" —
  instead of a silent animation.
- **Logo hover-bloom**: "Intellicore" stays on one line; hovering the
  "CMP" letters expands each into its full word (Cloud / Management /
  Platform) via a staggered `max-width` transition. Implemented as plain
  `inline` layout (not flex) — flex-item wrapping of the bare text node
  was the original bug.

## Copy principles

- Plain, non-technical language throughout — every technical claim is
  paired with a concrete, relatable example.
- The hero deliberately names **no specific customer** — it describes
  the class of event (a security rule that opens too much, an AI job
  that spends too much, traffic nobody's seen before, a permission
  nobody reviewed) and frames Intellicore as the guide that gets you to
  an outcome, not an instant-fix engine: *"The outcome doesn't arrive in
  one step. Intellicore is the graph that gets you there."*
- All "Book a demo" / assessment CTAs `mailto:nikhil.john@searce.com`.

## Deployment

Static hosting on GCS bucket `intellicore-cmp-site-77682`.

```bash
# one-time bucket setup
bash marketing/deploy-gcs.sh

# redeploy a single page after an edit
gcloud storage cp marketing/index.html gs://intellicore-cmp-site-77682/index.html \
  --cache-control="public, max-age=300"
```

Team photos are hosted separately at
`gs://intellicore-cmp-site-77682/team-photos/` as `.png` files named by
first name (see `marketing/team-photos/README.md` for the exact list).
