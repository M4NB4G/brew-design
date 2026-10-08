// Footer.jsx
// Persyn attribution below the page, as in Brew Water Chem's footer: the full
// logo at the left and the company name beside it, with the "References" link
// to the references page under it. On screen only — it lives inside #root,
// which the print rules hide.

import logoSrc from '../assets/persyn-logo.png';
import { colors } from './shared/styles.js';

// The "References" link opens the references page (docs/items/references-page.md,
// RF-S1), in the size of the page's back button.
const notesStyle = {
  background: 'none',
  border: 'none',
  padding: 0,
  marginTop: '0.3rem',
  color: colors.textFooter,
  fontSize: '0.85rem',
  fontFamily: 'inherit',
  textDecoration: 'underline',
  cursor: 'pointer',
  display: 'block',
};

export default function Footer({ onNotes }) {
  return (
    <footer style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>

        {/* Persyn logo — decorative; the text beside it names the company */}
        <img
          src={logoSrc}
          alt=""
          aria-hidden="true"
          style={{ maxWidth: '120px', width: '100%', objectFit: 'contain', flexShrink: 0 }}
        />

        <div>
          <p style={{ fontSize: '0.72rem', lineHeight: 1.6, margin: 0, color: colors.textFooter }}>
            Persyn Chemical Engineering and Consulting
          </p>
          <button type="button" onClick={onNotes} style={notesStyle}>References</button>
        </div>
      </div>
    </footer>
  );
}
