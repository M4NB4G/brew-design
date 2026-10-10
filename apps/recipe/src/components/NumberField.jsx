// NumberField.jsx
// A plain controlled number input styled with the shared token. Works entirely
// in display units — the parent converts to/from canonical at the boundary.
// Emits a parsed Number, or NaN when the field is empty.
// With `digits`, the box shows the figure to that many decimals while the
// cursor is elsewhere, and the full figure while it is in the box; the figure
// itself changes only by typing (docs/items/boxes-and-access.md, BA1).
import { useLayoutEffect, useRef, useState } from 'react';
import { tokens } from './shared/styles.js';
import { roundForInput } from '../format.js';

export default function NumberField({ value, onChange, style, digits, ...rest }) {
  const [editing, setEditing] = useState(false);
  const ref = useRef(null);
  // Select the full figure once it is shown, so typing replaces it.
  useLayoutEffect(() => {
    if (editing) ref.current?.select();
  }, [editing]);
  const shown = Number.isFinite(value) ? roundForInput(value, editing ? undefined : digits) : '';
  return (
    <input
      ref={ref}
      type="number"
      value={shown}
      onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
      style={{
        ...tokens.numberInput,
        // Table context: let the column width constrain the field.
        width: '100%',
        minWidth: '60px',
        maxWidth: '110px',
        ...style,
      }}
      onFocus={() => setEditing(true)}
      onBlur={() => setEditing(false)}
      {...rest}
    />
  );
}
