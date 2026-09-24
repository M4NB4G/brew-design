// Header.jsx
// Product header for the Recipe Designer, adapted from the Brew Water Chem
// header.  Same stack order: brand row → 3 px accent strip → toggle row.
// The Pro/Home toggle and (Pro-only) gravity-unit toggle both live here,
// matching the water app's convention of keeping unit controls in the header.

import { useRef } from 'react';
import markSrc from '../assets/persyn-header-mark.png';
import { colors, radii, shadows } from './shared/styles.js';
import usePhone from './shared/usePhone.js';

const SS3 = "'Source Sans 3', system-ui, sans-serif";

// Outlined pill for the recipe-level actions: Export, Import, Reset to defaults.
const actionButton = {
  padding: '0.35rem 0.8rem',
  background: 'transparent',
  border: `1px solid ${colors.inputBorder}`,
  borderRadius: radii.pill,
  color: colors.textSecondary,
  fontSize: '0.8rem',
  fontWeight: 600,
  letterSpacing: '0.05em',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

// On a phone the four actions fill two rows of two equal buttons.
const phoneActionButton = { ...actionButton, width: '100%', padding: '0.5rem 0.6rem' };

// Small pill-button toggle shared by both the Pro/Home and gravity selectors.
// Compact (phone): narrower buttons, so Home/Pro fits beside the brand.
function PillToggle({ value, onChange, options, compact = false }) {
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
              padding: compact ? '0.35rem 0.7rem' : '0.35rem 0.95rem',
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

export default function Header({
  mode,
  onMode,
  proGravityUnit,
  onProGravityUnit,
  onReset,
  onExport,
  onImportFile,
  fileMessage,
}) {
  const phone = usePhone();

  // The system file picker, opened by the Import button.
  const fileInput = useRef(null);
  const onFileChosen = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // choosing the same file again still counts as a choice
    if (file) onImportFile(file);
  };

  return (
    <header style={{ background: colors.cardBg, boxShadow: shadows.header }}>

      {/* Brand row */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0.85rem 1.25rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: phone ? '0.6rem' : '0.8rem' }}>

          {/* Persyn medallion — decorative; the kicker names the company in text */}
          <img
            src={markSrc}
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
                // Phone: may wrap under the wordmark, leaving room for Home/Pro.
                whiteSpace: phone ? 'normal' : 'nowrap',
              }}
            >
              Persyn Chemical Engineering
            </div>
          </div>

          {/* Phone: Home/Pro on the brand row, and Pro's gravity unit under it */}
          {phone && (
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '0.35rem',
                flexShrink: 0,
              }}
            >
              <PillToggle
                value={mode}
                onChange={onMode}
                options={[['pro', 'Pro'], ['home', 'Home']]}
                compact
              />
              {mode === 'pro' && (
                <PillToggle
                  value={proGravityUnit}
                  onChange={onProGravityUnit}
                  options={[['plato', '°P'], ['sg', 'SG']]}
                  compact
                />
              )}
            </div>
          )}

        </div>
      </div>

      {/* Accent gradient strip */}
      <div style={{ height: '3px', background: colors.accent, marginTop: '1rem' }} />

      {/* Toggle row — right-aligned: recipe actions and Print, then gravity (Pro only), then Pro/Home.
          Phone: the four actions alone, two by two. */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0.55rem 1.25rem 0.5rem' }}>
        {phone ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button type="button" onClick={onExport} style={phoneActionButton}>
              Export
            </button>
            <button type="button" onClick={() => fileInput.current.click()} style={phoneActionButton}>
              Import
            </button>
            <input ref={fileInput} type="file" onChange={onFileChosen} style={{ display: 'none' }} />
            <button type="button" onClick={() => window.print()} style={phoneActionButton}>
              Print recipe
            </button>
            <button type="button" onClick={onReset} style={phoneActionButton}>
              Reset to defaults
            </button>
          </div>
        ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.6rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button type="button" onClick={onExport} style={actionButton}>
            Export
          </button>
          <button type="button" onClick={() => fileInput.current.click()} style={actionButton}>
            Import
          </button>
          <input ref={fileInput} type="file" onChange={onFileChosen} style={{ display: 'none' }} />
          <button type="button" onClick={onReset} style={actionButton}>
            Reset to defaults
          </button>
          {/* The browser's print dialog, on the print-only recipe sheet (RecipeSheet.jsx) */}
          <button type="button" onClick={() => window.print()} style={actionButton}>
            Print recipe
          </button>
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
        )}

        {/* An import refusal, until the next action */}
        {fileMessage && (
          <div
            role="alert"
            style={{
              textAlign: 'right',
              color: colors.textWarn,
              fontSize: '0.82rem',
              marginTop: '0.45rem',
              lineHeight: 1.4,
            }}
          >
            {fileMessage}
          </div>
        )}
      </div>

    </header>
  );
}
