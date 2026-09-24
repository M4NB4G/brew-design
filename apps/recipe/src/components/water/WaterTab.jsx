// WaterTab.jsx
// The Water tab (docs/items/water-tab.md, item 2): Brew Water Chem's four
// screens under a second row of tabs — Water In · Style · Salts & Acid ·
// Notes, its "Recipe" renamed so there are not two (W2) — with a line saying
// the entries are not saved (W6) and a line naming any blank test result
// (W5). Every figure comes from computeWater (selectors.js) as `figures`; the
// entries change only through water-state.js's steps, handed to `setWater`.
// Nothing here is computed.
import { colors, tokens } from '../shared/styles.js';
import WaterInScreen, { REPORT_LABELS } from './WaterInScreen.jsx';
import StyleScreen from './StyleScreen.jsx';
import SaltsAcidScreen from './SaltsAcidScreen.jsx';
import NotesScreen from './NotesScreen.jsx';

const SCREENS = [
  ['water', 'Water In'],
  ['style', 'Style'],
  ['salts', 'Salts & Acid'],
  ['notes', 'Notes'],
];

export default function WaterTab({ water, figures, mode, screen, onScreen, setWater }) {
  const blank = figures.missing.map((k) => REPORT_LABELS[k]);
  return (
    <>
      {/* The water app's tab row, one size down, inside the Water tab */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.4rem 1.25rem',
          paddingBottom: '0.6rem',
          marginBottom: '0.75rem',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        {SCREENS.map(([id, label]) => {
          const active = screen === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onScreen(id)}
              style={{
                fontFamily: 'inherit',
                fontSize: '0.92rem',
                fontWeight: active ? 700 : 400,
                color: active ? colors.textPrimary : colors.textMuted,
                background: 'transparent',
                border: 'none',
                padding: '0.2rem 0',
                borderBottom: active ? `2px solid ${colors.textPrimary}` : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <p style={{ ...tokens.notice, marginTop: 0, marginBottom: '0.75rem' }}>
        Not saved yet: the water entries last until the page is reloaded.
      </p>

      {blank.length > 0 && (
        <p role="status" style={{ ...tokens.warning, margin: '0 0 0.9rem' }}>
          Blank test results: {blank.join(', ')}
        </p>
      )}

      {screen === 'water' && <WaterInScreen source={water.source} figures={figures} setWater={setWater} />}
      {screen === 'style' && <StyleScreen styleId={water.styleId} figures={figures} setWater={setWater} />}
      {screen === 'salts' && (
        <SaltsAcidScreen water={water} figures={figures} mode={mode} setWater={setWater} />
      )}
      {screen === 'notes' && <NotesScreen />}
    </>
  );
}
