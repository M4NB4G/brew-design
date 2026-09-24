// One ingredient row as a phone shows it (docs/items/phone-width.md, D2): the
// name box on top, the number boxes side by side beneath, each under its
// label, then the row's points or IBU and the remove button. Desktop keeps the
// table; the boxes here are the same ones the table's cells hold.

import { colors } from './styles.js';

const FIELD_LABEL = {
  fontSize: '0.75rem',
  color: colors.textSecondary,
  fontWeight: 600,
};

export default function IngredientBlock({ name, fields, resultLabel, result, remove, striped }) {
  return (
    <div
      style={{
        padding: '0.6rem 0.5rem',
        borderBottom: `1px solid ${colors.rowDivider}`,
        background: striped ? colors.noticeBg : 'transparent',
      }}
    >
      {name}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${fields.length}, minmax(0, 1fr))`,
          gap: '0.4rem',
          marginTop: '0.45rem',
        }}
      >
        {fields.map(({ label, input }) => (
          <label key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
            <span style={FIELD_LABEL}>{label}</span>
            {input}
          </label>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '0.35rem',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {resultLabel && <span style={FIELD_LABEL}>{resultLabel}</span>}
          {result}
        </span>
        {remove}
      </div>
    </div>
  );
}
