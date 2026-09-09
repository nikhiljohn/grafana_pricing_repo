/**
 * The Intellicore CMP brand mark — the favicon glyph in its dark tile.
 *
 * The glyph is the same memory-graph node diagram used as the favicon
 * (`src/app/icon.svg`) and in the marketing site's header, so the browser
 * tab and the in-app header show one identical mark.
 *
 * The tile itself (`.ic-brand-mark`) supplies the dark rounded background,
 * which is why the glyph here omits the backing <rect> the favicon has.
 */

export function BrandGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <circle cx="16" cy="8" r="2.6" fill="#34D399" />
      <circle cx="7" cy="20" r="2.6" fill="#38BDF8" />
      <circle cx="25" cy="20" r="2.6" fill="#38BDF8" />
      <circle cx="16" cy="24" r="2.2" fill="#818CF8" />
      <path
        d="M16 10.4L8.6 18.2M16 10.4L23.4 18.2M9.3 21.4L14.4 23.3M22.7 21.4L17.6 23.3"
        stroke="#CBD5E1"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The glyph in its tile, with no wordmark. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={`ic-brand-mark ${className ?? ""}`}>
      <BrandGlyph />
    </div>
  );
}

/**
 * Full lockup: tile + "Intellicore" + the CMP acronym, which blooms into
 * "Cloud Management Platform" on hover (see `.cmp-expand` in globals.css).
 *
 * The three `.cmp-letter` spans must remain the only element children of
 * `.cmp-expand` — the reveal timing keys off `:nth-child`.
 */
export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <span className="ic-brand" style={compact ? { fontSize: 15 } : undefined}>
      <BrandMark />
      <span className="ic-brand-text">Intellicore</span>
      <span className="cmp-expand" title="Cloud Management Platform">
        {/* The explicit {" "} matter: the site's HTML has newlines between
            these spans, which render as spaces (collapsed state reads
            "C M P"). JSX strips inter-element whitespace, so without these
            the acronym renders tight and drifts from the site. Text nodes
            don't affect the :nth-child timing above. */}
        <span className="cmp-letter">
          C<span className="cmp-word">loud&nbsp;</span>
        </span>{" "}
        <span className="cmp-letter">
          M<span className="cmp-word">anagement&nbsp;</span>
        </span>{" "}
        <span className="cmp-letter">
          P<span className="cmp-word">latform</span>
        </span>
      </span>
    </span>
  );
}
