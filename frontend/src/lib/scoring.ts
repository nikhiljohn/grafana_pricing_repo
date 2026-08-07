/* ------------------------------------------------------------------ */
/*  Intellicore CMP — pillar health score methodology                  */
/*  Published formula for how each pillar's 0-100 Intelligence Score    */
/*  is meant to be derived once Command Center is wired to live         */
/*  signals (see BACKLOG.md — "wire Command Center scores to live       */
/*  signals"). The seed data on this demo book has 5 tenant narratives  */
/*  hand-authored to match the customer demo script, so those scores    */
/*  are illustrative rather than run through this function today — but  */
/*  every score a customer sees in production must be reproducible      */
/*  from this formula, not a magic number. This file exists so nobody   */
/*  has to answer "how is 82 calculated?" with "it's hardcoded."        */
/* ------------------------------------------------------------------ */

export interface ScoreSignals {
  /** Open findings/attention items at critical severity for this pillar. */
  criticalOpen: number;
  /** Open findings/attention items at warning severity for this pillar. */
  warningOpen: number;
  /** Active cost or reliability anomalies for this pillar right now. */
  activeAnomalies: number;
  /** Recurring patterns tied to this pillar that are NOT yet auto-resolved. */
  unresolvedRecurringPatterns: number;
  /** Recurring patterns tied to this pillar with a validated >=85% confidence fix on file. */
  highConfidenceFixesAvailable: number;
}

export const SCORE_WEIGHTS = {
  criticalOpen: 14,
  warningOpen: 6,
  activeAnomalies: 8,
  unresolvedRecurringPatterns: 5,
  // A validated high-confidence fix on file lowers the practical risk of an
  // open item even before it's applied — small credit, capped below.
  highConfidenceFixCredit: 2,
} as const;

/**
 * score = 100
 *   − (criticalOpen                 × 14)
 *   − (warningOpen                  ×  6)
 *   − (activeAnomalies              ×  8)
 *   − (unresolvedRecurringPatterns  ×  5)
 *   + min(penalty, highConfidenceFixesAvailable × 2)
 * clamped to [0, 99] — a pillar is never shown as a "perfect" 100; in a
 * live system there's always another event on the way.
 */
export function computePillarScore(signals: ScoreSignals): number {
  const w = SCORE_WEIGHTS;
  const penalty =
    signals.criticalOpen * w.criticalOpen +
    signals.warningOpen * w.warningOpen +
    signals.activeAnomalies * w.activeAnomalies +
    signals.unresolvedRecurringPatterns * w.unresolvedRecurringPatterns;
  const credit = Math.min(penalty, signals.highConfidenceFixesAvailable * w.highConfidenceFixCredit);
  return Math.max(0, Math.min(99, Math.round(100 - penalty + credit)));
}

export const SCORE_METHODOLOGY_SUMMARY =
  "Score = 100, minus 14 per open critical item, 6 per open warning item, " +
  "8 per active anomaly, and 5 per unresolved recurring pattern for this " +
  "pillar — plus a small credit back when a validated high-confidence fix " +
  "is already on file. Capped at 99: a pillar is never shown as a perfect " +
  "100, because there's always another event on the way.";
