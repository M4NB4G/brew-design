// NumberField.jsx
// A plain controlled number input styled with the shared token. Works entirely
// in display units — the parent converts to/from canonical at the boundary.
// Emits a parsed Number, or NaN when the field is empty.
import { tokens, colors } from './shared/styles.js';
import { roundForInput } from '../format.js';

export default function NumberField({ value, onChange, style, ...rest }) {
  const shown = Number.isFinite(value) ? roundForInput(value) : '';
  return (
    <input
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
      onFocus={(e) => e.target.select()}
      {...rest}
    />
  );
}
