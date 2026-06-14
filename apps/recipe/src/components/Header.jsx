// Header.jsx
// Product header for the Recipe Designer, adapted from the Brew Water Chem
// header.  Same stack order: brand row → 3 px accent strip → toggle row.
// The Pro/Home toggle and (Pro-only) gravity-unit toggle both live here,
// matching the water app's convention of keeping unit controls in the header.

import flaskSrc from '../assets/bwc-flask-header.svg';
import { colors, radii, shadows } from './shared/styles.js';

const SS3 = "'Source Sans 3', system-ui, sans-serif";

// Small pill-button toggle shared by both the Pro/Home and gravity selectors.
function PillToggle({ value, onChange, options }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        background: colors.togglePillBg,
        borderRadius: radii.pill,
        padding: '3px',
        gap: '2px',
      }}
    >
      {options.map(([id, label]) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            style={{
              padding: '0.35rem 0.95rem',
              borderRadius: radii.pill,
              border: 'none',
              background: active ? colors.toggleActiveBg : 'transparent',
              color: active ? colors.toggleActiveText : colors.textSecondary,
              fontWeight: 600,
              fontSize: '0.82rem',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function Header({ mode, onMode, proGravityUnit, onProGravityUnit }) {
  return (
    <header style={{ background: colors.cardBg, boxShadow: shadows.header }}>

      {/* Brand row */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0.85rem 1.25rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>

          {/* Flask icon */}
          <img
            src={flaskSrc}
            alt=""
            aria-hidden="true"
            style={{ height: 'clamp(40px, 5vw, 48px)', width: 'auto', flexShrink: 0 }}
          />

          {/* Text lockup */}
          <div>
            {/* Wordmark */}
            <div
              style={{
                fontFamily: SS3,
                fontSize: 'clamp(1.2rem, 5vw, 1.4rem)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                lineHeight: 1.1,
              }}
            >
              <span style={{ fontWeight: 400, color: colors.textPrimary }}>Brew </span>
              <span style={{ fontWeight: 700, color: colors.accentAmber }}>Design</span>
            </div>

            {/* Kicker */}
            <div
              style={{
                fontFamily: SS3,
                fontWeight: 500,
                fontSize: '0.58rem',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: colors.textMuted,
                marginTop: '0.3rem',
                whiteSpace: 'nowrap',
              }}
            >
              Persyn Chemical Engineering
            </div>
          </div>

        </div>
      </div>

      {/* Accent gradient strip */}
      <div style={{ height: '3px', background: colors.accent, marginTop: '1rem' }} />

      {/* Toggle row — right-aligned, Pro/Home first then gravity (Pro only) */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0.55rem 1.25rem 0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', alignItems: 'center' }}>
          {mode === 'pro' && (
            <PillToggle
              value={proGravityUnit}
              onChange={onProGravityUnit}
              options={[['plato', '°P'], ['sg', 'SG']]}
            />
          )}
          <PillToggle
            value={mode}
            onChange={onMode}
            options={[['pro', 'Pro'], ['home', 'Home']]}
          />
        </div>
      </div>

    </header>
  );
}
