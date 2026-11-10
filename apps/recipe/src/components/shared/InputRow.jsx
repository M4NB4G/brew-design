// Labelled numeric input row — matches the prototype's `inputRow`/`input`
// pattern: label (with optional unit annotation) on the left, right-aligned
// number input on the right, dividing line beneath.
//
// Use this for any number entry inside a card. The optional `hint` prop
// renders small grey text under the input — used by the Recipe tab to show
// the solver's recommended value beneath each editable salt amount. The
// optional `placeholder` is the figure shown greyed inside an empty box (the
// browser's own placeholder grey); it is never a value. The box's accessible
// name is the label the brewer sees, with its unit (guard-rails item 3, F-Q5).
// The optional `editValue` and `editPlaceholder` are what the box and its
// greyed figure show while the cursor is in it (the full figure), `value` and
// `placeholder` what they show otherwise (boxes-and-access, BA1).
// With `limited`, the box can refuse an entry (docs/items/impossible-
// entries.md, IE-S1 to IE-S3), as NumberField does: `onChange` returns the
// line under the box when it refuses the figure, and the box keeps the entry
// while the cursor is in it, says why under it, puts the recipe back as it
// was when the typing began, and shows its figure again once left.

import { useContext, useRef, useState } from 'react';
import { colors, tokens } from './styles.js';
import { EntryContext, stillTyping } from './entry.js';

export default function InputRow({
  label,
  unit,
  value,
  onChange,
  step = 0.1,
  min,
  max,
  readOnly = false,
  highlight = false, // tints the input bg when the user has overridden it
  hint,
  placeholder,
  rightAdornment, // optional element rendered to the right of the input (e.g. unit picker)
  editValue,
  editPlaceholder,
  limited = false,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null); // the text typed while it is not a saved figure
  const [refused, setRefused] = useState(null); // the line under the box
  const entry = useContext(EntryContext);
  const typing = useRef(false); // the brewer has begun typing since the cursor came in

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '0.6rem 0',
    borderBottom: `1px solid ${colors.rowDivider}`,
    gap: '0.75rem',
  };

  const name = typeof label === 'string' ? (unit ? `${label} ${unit}` : label) : undefined;

  const inputStyle = {
    ...tokens.numberInput,
    background: highlight ? colors.inputBgOverride : colors.inputBg,
  };

  // Read-only values render as plain text — no border, no box — so they're
  // visually distinct from editable fields.
  if (readOnly) {
    return (
      <div style={rowStyle}>
        <div style={{ paddingTop: '0.45rem' }}>
          <span style={{ fontSize: '0.92rem', color: colors.textPrimary, fontWeight: 500 }}>
            {label}
          </span>
          {unit && (
            <span style={{ fontSize: '0.78rem', color: colors.textMuted, marginLeft: '0.4rem' }}>
              {unit}
            </span>
          )}
        </div>
        <div style={{ paddingTop: '0.45rem', textAlign: 'right' }}>
          <span
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: colors.textSecondary,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.01em',
            }}
          >
            {value}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={rowStyle}>
      <div style={{ paddingTop: '0.45rem' }}>
        <span style={{ fontSize: '0.92rem', color: colors.textPrimary, fontWeight: 500 }}>
          {label}
        </span>
        {unit && (
          <span style={{ fontSize: '0.78rem', color: colors.textMuted, marginLeft: '0.4rem' }}>
            {unit}
          </span>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end' }}>
          <input
            type="number"
            aria-label={name}
            step={step}
            min={min}
            max={max}
            value={draft ?? (editing && editValue !== undefined ? editValue : value)}
            placeholder={editing && editPlaceholder !== undefined ? editPlaceholder : placeholder}
            onChange={(e) => {
              if (!limited) {
                onChange(e);
                return;
              }
              if (!typing.current) {
                typing.current = true;
                entry.begin();
              }
              if (stillTyping(e.target)) {
                setDraft(e.target.value);
                return;
              }
              const line = onChange(e);
              if (typeof line === 'string') {
                setDraft(e.target.value);
                setRefused(line);
                entry.restore();
              } else {
                setDraft(null);
                setRefused(null);
              }
            }}
            onFocus={() => setEditing(true)}
            onBlur={() => {
              setEditing(false);
              setDraft(null);
              typing.current = false;
            }}
            style={inputStyle}
          />
          {rightAdornment}
        </div>
        {refused && (
          <div role="alert" style={tokens.refusedLine}>
            {refused}
          </div>
        )}
        {hint && (
          <div
            style={{
              fontSize: '0.72rem',
              color: colors.textMuted,
              marginTop: '0.2rem',
              fontStyle: 'italic',
            }}
          >
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}
