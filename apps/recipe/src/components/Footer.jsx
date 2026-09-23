// Footer.jsx
// Persyn attribution below the page, as in Brew Water Chem's footer: the full
// logo at the left and the company name beside it. On screen only — it lives
// inside #root, which the print rules hide.

import logoSrc from '../assets/persyn-logo.png';
import { colors } from './shared/styles.js';

export default function Footer() {
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

        <p style={{ fontSize: '0.72rem', lineHeight: 1.6, margin: 0, color: colors.textFooter }}>
          Persyn Chemical Engineering and Consulting
        </p>
      </div>
    </footer>
  );
}
