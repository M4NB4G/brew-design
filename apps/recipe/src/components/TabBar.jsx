// TabBar.jsx
// The Recipe · Options tab row, a copy of Brew Water Chem's "Tabs" block
// (src/App.jsx there): text buttons, the active one bold with a 2 px underline
// in the primary text color, the row closed by a 1 px border. Sits under the
// header and above the sticky stats bar, as in the water app. Navigation only:
// the active tab is not persisted and every load opens on Recipe.
import { colors } from './shared/styles.js';

const TABS = [
  ['recipe', 'Recipe'],
  ['options', 'Options'],
];

export default function TabBar({ tab, onTab }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '1.5rem',
        padding: '0.85rem 1.25rem',
        borderBottom: `1px solid ${colors.border}`,
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      {TABS.map(([id, label]) => {
        const active = tab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTab(id)}
            style={{
              fontFamily: 'inherit',
              fontSize: '1rem',
              fontWeight: active ? 700 : 400,
              color: active ? colors.textPrimary : colors.textMuted,
              background: 'transparent',
              border: 'none',
              padding: '0.25rem 0',
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
  );
}
