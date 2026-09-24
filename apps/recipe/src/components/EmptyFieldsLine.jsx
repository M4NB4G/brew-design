// EmptyFieldsLine.jsx
// The line under the stats bar that names the empty number boxes, on both
// tabs (Empty-field handling, E2 and E3): the figures that depend on them show
// "—" in the bar. It sits inside the app root, so the printed sheet never
// carries it. The text comes from empty-fields.js; nothing is computed here.
import { tokens } from './shared/styles.js';

export default function EmptyFieldsLine({ text }) {
  if (!text) return null;
  return (
    <p role="status" style={{ ...tokens.warning, margin: '0.45rem 0 0' }}>
      {text}
    </p>
  );
}
