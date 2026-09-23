// IdentitySection.jsx
// The recipe's identity: name and style at the top of the Recipe tab, notes
// in a multi-line box at the bottom. All three are free text, stored as typed
// (no trimming, no length limit, never parsed as a number), and read by no
// calculation. Empty on a new recipe; the app never invents a name.
import Card from './shared/Card.jsx';
import { colors, tokens } from './shared/styles.js';

const LABEL = {
  display: 'block',
  fontSize: '0.92rem',
  color: colors.textPrimary,
  fontWeight: 500,
  marginBottom: '0.35rem',
};

function TextField({ label, value, onChange }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={LABEL}>{label}</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={tokens.select} />
    </label>
  );
}

export default function IdentitySection({ name, style, setField }) {
  return (
    <Card>
      <span style={tokens.cardLabel}>Recipe</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem 1.5rem' }}>
        <TextField label="Name" value={name} onChange={(v) => setField('name', v)} />
        <TextField label="Style" value={style} onChange={(v) => setField('style', v)} />
      </div>
    </Card>
  );
}

export function NotesSection({ notes, setField }) {
  return (
    <Card>
      <span style={tokens.cardLabel}>Notes</span>
      <textarea
        aria-label="Notes"
        value={notes}
        onChange={(e) => setField('notes', e.target.value)}
        rows={6}
        style={{ ...tokens.select, resize: 'vertical', lineHeight: 1.5, display: 'block' }}
      />
    </Card>
  );
}
