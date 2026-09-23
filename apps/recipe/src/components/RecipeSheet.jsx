// RecipeSheet.jsx
// The print-only recipe sheet. Never shown on screen (the .print-sheet rules
// in index.css); App.jsx portals it into <body> beside the app root, and the
// browser's print command renders it alone. Brew Water Chem's batch sheet is
// the formatting reference.
//
// Computes nothing: every value comes from recipeSheet() (recipe-sheet-data.js),
// which reads the recipe and the derived values the screen renders from, so
// what prints is what is on screen. Printing reads only: it touches no state
// and triggers no save. The only number held here is today's date, refreshed
// as the print dialog opens so a tab left open overnight still prints today.

import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import logoSrc from '../assets/persyn-logo.png';
import { printColors as C } from './shared/styles.js';
import { recipeSheet } from './recipe-sheet-data.js';

const SS3 = "'Source Sans 3', system-ui, sans-serif";

export default function RecipeSheet({ recipe, derived, mode, proGravityUnit }) {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => flushSync(() => setToday(new Date()));
    window.addEventListener('beforeprint', refresh);
    return () => window.removeEventListener('beforeprint', refresh);
  }, []);

  const s = recipeSheet({ recipe, derived, mode, proGravityUnit, today });

  return (
    <div className="print-sheet" style={{ fontFamily: SS3, color: C.body, background: C.page }}>

      {/* Header band */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
        <img
          src={logoSrc}
          alt="Persyn Chemical Engineering and Consulting"
          style={{ width: '140px', objectFit: 'contain' }}
        />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: C.navy, letterSpacing: '0.05em' }}>
            BREW DESIGN
          </div>
          <div style={{ fontSize: '9px', color: C.gray, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: '2px' }}>
            Recipe Sheet
          </div>
        </div>
      </div>
      <hr style={{ border: 'none', borderTop: `1.5px solid ${C.border}`, margin: '0 0 7px' }} />

      {/* Name, style, batch volume, date */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '9px' }}>
        {s.title && (
          <div style={{ fontSize: '15px', fontWeight: 700, color: C.navy, lineHeight: 1.2 }}>{s.title}</div>
        )}
        {s.meta.map((m) => (
          <Meta key={m.label} label={m.label} value={m.value} />
        ))}
      </div>

      {/* The six headline numbers */}
      <Heading>Predicted</Heading>
      <table style={tbl}>
        <thead>
          <tr style={{ background: C.headerBg }}>
            {s.headline.map((h) => (
              <th key={h.label} style={th}>
                {h.label}
                {h.unit && ` (${h.unit})`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {s.headline.map((h) => (
              <td key={h.label} style={{ ...td, fontSize: '13px', fontWeight: 700, color: C.navy, padding: '5px' }}>
                {h.value}
                {h.measuredBox && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
                    <span style={measuredLabel}>Measured</span>
                    <MeasuredBox />
                  </div>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Grain bill */}
      <Heading>Grain Bill</Heading>
      <table style={tbl}>
        <thead>
          <tr style={{ background: C.headerBg }}>
            <th style={{ ...th, textAlign: 'left', width: '44%' }}>Malt</th>
            <th style={th}>Weight ({s.grain.weightUnit})</th>
            <th style={th}>Share (%)</th>
            <th style={th}>Yield, FGDB (%)</th>
            <th style={th}>Color (°L)</th>
          </tr>
        </thead>
        <tbody>
          {s.grain.rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 ? C.rowAlt : C.page }}>
              <td style={{ ...td, textAlign: 'left' }}>{r.name}</td>
              <td style={td}>{r.weight}</td>
              <td style={td}>{r.share}</td>
              <td style={td}>{r.yield}</td>
              <td style={td}>{r.color}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Caption>
        Brewhouse efficiency {s.grain.efficiency}% · Apparent attenuation {s.grain.attenuation}%
      </Caption>

      {/* Water and volumes */}
      <Heading>Water &amp; Volumes</Heading>
      <table style={tbl}>
        <thead>
          <tr style={{ background: C.headerBg }}>
            <th style={{ ...th, textAlign: 'left', width: '44%' }}>Volume</th>
            <th style={th}>Predicted ({s.volumes.unit})</th>
            <th style={th}>Measured ({s.volumes.unit})</th>
          </tr>
        </thead>
        <tbody>
          {s.volumes.rows.map((r, i) => (
            <tr key={r.key} style={{ background: i % 2 ? C.rowAlt : C.page }}>
              <td style={{ ...td, textAlign: 'left' }}>
                {r.label}
                {r.tempNote && <span style={tempNoteStyle}>{r.tempNote}</span>}
              </td>
              <td style={td}>{r.value}</td>
              <td style={{ ...td, padding: '3px 5px' }}>{r.measuredBox && <MeasuredBox />}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Caption>
        Mash ratio {s.volumes.mashRv} {s.volumes.mashRvUnit} · {s.volumes.mashR} {s.volumes.mashRUnit}
        {' · '}Boil {s.volumes.boilTime} min at {s.volumes.boilOff} {s.volumes.unit}/hr boil-off
      </Caption>

      {/* Hops */}
      <Heading>Hop Schedule</Heading>
      <table style={tbl}>
        <thead>
          <tr style={{ background: C.headerBg }}>
            <th style={{ ...th, textAlign: 'left', width: '36%' }}>Kettle hop</th>
            <th style={th}>Time (min)</th>
            <th style={th}>Temp ({s.hops.tempUnit})</th>
            <th style={th}>Weight ({s.hops.weightUnit})</th>
            <th style={th}>Alpha (%)</th>
            <th style={th}>IBU</th>
          </tr>
        </thead>
        <tbody>
          {s.hops.kettle.map((r, i) => (
            <tr key={i} style={{ background: i % 2 ? C.rowAlt : C.page }}>
              <td style={{ ...td, textAlign: 'left' }}>{r.name}</td>
              <td style={td}>{r.time}</td>
              <td style={td}>{r.temp}</td>
              <td style={td}>{r.weight}</td>
              <td style={td}>{r.alpha}</td>
              <td style={td}>{r.ibu}</td>
            </tr>
          ))}
          <tr style={{ background: C.headerBg }}>
            <td style={{ ...td, textAlign: 'left', fontWeight: 700 }} colSpan={5}>
              Total IBU
              <span style={{ fontWeight: 400, color: C.gray }}> — the rounded total of the unrounded additions</span>
            </td>
            <td style={{ ...td, fontWeight: 700 }}>{s.hops.totalIbu}</td>
          </tr>
        </tbody>
      </table>

      <table style={{ ...tbl, marginTop: '5px' }}>
        <thead>
          <tr style={{ background: C.headerBg }}>
            <th style={{ ...th, textAlign: 'left', width: '72%' }}>Dry hop</th>
            <th style={th}>Weight ({s.hops.weightUnit})</th>
          </tr>
        </thead>
        <tbody>
          {s.hops.dry.map((r, i) => (
            <tr key={i} style={{ background: i % 2 ? C.rowAlt : C.page }}>
              <td style={{ ...td, textAlign: 'left' }}>{r.name}</td>
              <td style={td}>{r.weight}</td>
            </tr>
          ))}
          <tr style={{ background: C.headerBg }}>
            <td style={{ ...td, textAlign: 'left', fontWeight: 700 }}>Dry-hop rate</td>
            <td style={{ ...td, fontWeight: 700 }}>
              {s.hops.dryRate} {s.hops.dryRateUnit}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Yeast and starter */}
      <Heading>Yeast &amp; Starter</Heading>
      <table style={{ ...tbl, marginBottom: '5px' }}>
        <thead>
          <tr style={{ background: C.headerBg }}>
            <th style={th}>Type</th>
            <th style={th}>Yeast character</th>
            <th style={th}>Pitch rate ({s.yeast.pitchRateUnit})</th>
            <th style={th}>Cells needed ({s.yeast.cellsUnit})</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={td}>{s.yeast.type}</td>
            <td style={td}>{s.yeast.character}</td>
            <td style={td}>{s.yeast.pitchRate}</td>
            <td style={td}>{s.yeast.cells}</td>
          </tr>
        </tbody>
      </table>
      {s.yeast.starter.length === 0 ? (
        <p style={noData}>No usable starter band for this cell count.</p>
      ) : (
        <table style={tbl}>
          <thead>
            <tr style={{ background: C.headerBg }}>
              <th style={{ ...th, textAlign: 'left' }}>Beginning cell count</th>
              <th style={th}>Starter volume ({s.yeast.starterVolumeUnit})</th>
              <th style={th}>DME (g)</th>
              <th style={{ ...th, textAlign: 'left' }}>Note</th>
            </tr>
          </thead>
          <tbody>
            {s.yeast.starter.map((r, i) => (
              <tr key={i} style={{ background: i % 2 ? C.rowAlt : C.page }}>
                <td style={{ ...td, textAlign: 'left' }}>{r.band}</td>
                <td style={td}>{r.volume}</td>
                <td style={td}>{r.dme}</td>
                <td style={{ ...td, textAlign: 'left' }}>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Notes, only when there are any */}
      {s.notes && (
        <>
          <Heading>Notes</Heading>
          <div style={{ fontSize: '10px', lineHeight: 1.45, whiteSpace: 'pre-wrap', color: C.body }}>{s.notes}</div>
        </>
      )}

      {/* Footer */}
      <div style={{ marginTop: '10px', borderTop: `1px solid ${C.border}`, paddingTop: '7px' }}>
        <p style={{ fontSize: '8px', color: C.gray, margin: '0 0 8px', lineHeight: 1.5 }}>
          For process guidance only. Verify gravities and volumes by measurement before production use.
          Persyn Chemical Engineering and Consulting assumes no liability for brewing outcomes.
        </p>
        <div style={{ fontSize: '10px', color: C.signature, borderTop: `1px dashed ${C.border}`, paddingTop: '6px' }}>
          Brewer:&#x2003;____________________________&#x2003;&#x2003;
          Date brewed:&#x2003;____________________________
        </div>
      </div>

    </div>
  );
}

function Heading({ children }) {
  return (
    <div
      style={{
        fontSize: '9px',
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: C.navy,
        borderBottom: `1.5px solid ${C.navy}`,
        paddingBottom: '2px',
        marginTop: '9px',
        marginBottom: '4px',
      }}
    >
      {children}
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.gray }}>
        {label}
      </div>
      <div style={{ fontSize: '10px', fontWeight: 600, color: C.navy }}>{value}</div>
    </div>
  );
}

function Caption({ children }) {
  return <p style={{ fontSize: '9px', color: C.navy, margin: '3px 0 2px' }}>{children}</p>;
}

// A blank box to write a measured value in, sized for handwriting.
function MeasuredBox() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: '80px',
        height: '24px',
        border: `1px solid ${C.border}`,
        borderRadius: '2px',
        background: C.page,
        verticalAlign: 'middle',
      }}
    />
  );
}

const tbl = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '10px',
  marginBottom: '2px',
};

const th = {
  padding: '3px 5px',
  textAlign: 'center',
  fontWeight: 700,
  color: C.navy,
  border: `1px solid ${C.border}`,
  fontSize: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const td = {
  padding: '3px 5px',
  textAlign: 'center',
  border: `1px solid ${C.border}`,
  color: C.body,
  fontVariantNumeric: 'tabular-nums',
};

const measuredLabel = {
  fontSize: '7px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: C.gray,
};

const tempNoteStyle = {
  marginLeft: '6px',
  fontSize: '9px',
  fontStyle: 'italic',
  color: C.navy,
};

const noData = {
  fontSize: '9px',
  fontStyle: 'italic',
  color: C.gray,
  margin: '2px 0 4px',
};
