// NumberField.jsx
// A plain controlled number input styled with the shared token. Works entirely
// in display units — the parent converts to/from canonical at the boundary.
// Emits a parsed Number, or NaN when the field is empty.
// With `digits`, the box shows the figure to that many decimals while the
// cursor is elsewhere, and the full figure while it is in the box; the figure
// itself changes only by typing (docs/items/boxes-and-access.md, BA1).
// With `limited`, the box can refuse an entry (docs/items/impossible-
// entries.md, IE-S1 to IE-S3): `onChange` returns the line under the box when
// it refuses the figure (entry-limits.js's `typed`), and then the box keeps
// the entry as typed while the cursor is in it, says why under it, puts the
// recipe back as it was when the typing began (EntryContext), and shows its
// figure again once left; the line stays until the box takes an entry. A
// figure still being typed (a minus sign alone) is not handed on.
// FLAG: the line stays under the box once left, while the box shows the
// figure as it was ("Negative: nothing is saved." under a 1), until the box
// takes an entry: as the salt and acid boxes' line does (N-1a, SPEC rule 9).
import { useContext, useLayoutEffect, useRef, useState } from 'react';
import { tokens } from './shared/styles.js';
import { roundForInput } from '../format.js';
import { EntryContext, stillTyping } from './shared/entry.js';

export default function NumberField({ value, onChange, style, digits, limited = false, ...rest }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null); // the text typed while it is not a saved figure
  const [refused, setRefused] = useState(null); // the line under the box
  const entry = useContext(EntryContext);
  const typing = useRef(false); // the brewer has begun typing since the cursor came in
  const ref = useRef(null);
  // Select the full figure once it is shown, so typing replaces it.
  useLayoutEffect(() => {
    if (editing) ref.current?.select();
  }, [editing]);
  const shown = Number.isFinite(value) ? roundForInput(value, editing ? undefined : digits) : '';
  const input = (
    <input
      ref={ref}
      type="number"
      value={draft ?? shown}
      onChange={(e) => {
        if (!limited) {
          onChange(e.target.value === '' ? NaN : Number(e.target.value));
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
        const line = onChange(e.target.value === '' ? NaN : Number(e.target.value));
        if (typeof line === 'string') {
          setDraft(e.target.value);
          setRefused(line);
          entry.restore();
        } else {
          setDraft(null);
          setRefused(null);
        }
      }}
      style={{
        ...tokens.numberInput,
        // Table context: let the column width constrain the field.
        width: '100%',
        minWidth: '60px',
        maxWidth: '110px',
        ...style,
      }}
      onFocus={() => setEditing(true)}
      onBlur={() => {
        setEditing(false);
        setDraft(null);
        typing.current = false;
      }}
      {...rest}
    />
  );
  // The line follows the box, so the box itself is drawn as before.
  return (
    <>
      {input}
      {refused && (
        <div role="alert" style={tokens.refusedLine}>
          {refused}
        </div>
      )}
    </>
  );
}
