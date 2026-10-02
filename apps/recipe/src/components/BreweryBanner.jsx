// BreweryBanner.jsx
// S4b item 4 (docs/items/water-as-brewed.md, BB-S1): while every My brewery
// figure is blank, a line on every tab recommends setting them up, with a
// button that opens Options and a "Not now". App decides when it shows
// (state.js) and keeps "Not now" (persistence.js); this only draws it.
import { colors, radii, tokens } from './shared/styles.js';

export default function BreweryBanner({ onSetUp, onNotNow }) {
  return (
    <div role="status" style={bannerStyle}>
      <span style={{ flex: '1 1 16rem' }}>Set up My brewery so new recipes start from your equipment.</span>
      <span style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="button" onClick={onSetUp} style={{ ...buttonStyle, color: colors.textPrimary }}>
          Set up My brewery
        </button>
        <button type="button" onClick={onNotNow} style={buttonStyle}>
          Not now
        </button>
      </span>
    </div>
  );
}

const bannerStyle = {
  ...tokens.notice,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '0.5rem 1rem',
  margin: '0 0 0.9rem',
  padding: '0.6rem 0.8rem',
  background: colors.noticeBg,
  border: `1px solid ${colors.inputBorder}`,
  borderRadius: radii.btn,
};

const buttonStyle = {
  padding: '0.32rem 0.8rem',
  background: 'transparent',
  border: `1px solid ${colors.inputBorder}`,
  borderRadius: radii.btn,
  color: colors.textSecondary,
  fontSize: '0.82rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
