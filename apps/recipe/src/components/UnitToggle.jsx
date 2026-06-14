// UnitToggle.jsx
// Switches the display mode (Home/Pro) and, in Pro mode, the gravity unit
// (Plato default, SG optional). Holds no recipe state; it only flips the display
// settings that the boundary helpers in display.js read.
export default function UnitToggle({ mode, onMode, proGravityUnit, onProGravityUnit }) {
  return (
    <section>
      <h2>Units</h2>
      <label>
        Mode:{' '}
        <select value={mode} onChange={(e) => onMode(e.target.value)}>
          <option value="home">Home</option>
          <option value="pro">Pro</option>
        </select>
      </label>{' '}
      {mode === 'pro' && (
        <label>
          Gravity:{' '}
          <select value={proGravityUnit} onChange={(e) => onProGravityUnit(e.target.value)}>
            <option value="plato">Plato</option>
            <option value="sg">SG</option>
          </select>
        </label>
      )}
    </section>
  );
}
