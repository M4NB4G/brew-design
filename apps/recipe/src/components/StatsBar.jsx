// StatsBar.jsx
// Persistent live summary of the derived beer stats, rendered as a horizontal
// row of compact StatBoxes. Every value is formatted from canonical units at
// the display boundary; nothing here is computed. The SRM box carries a small
// color swatch derived only from the SRM number.
import StatBox from './shared/StatBox.jsx';
import {
  resolveGravityUnit,
  gravityFromCanonical,
  gravityUnitLabel,
  cellsFromCanonical,
  cellsUnit,
} from '../display.js';
import { num, gravity } from '../format.js';

// SRM → approximate RGB via linear interpolation of a standard color table.
// This is a display-only mapping; no brewing math is performed.
function srmToColor(srm) {
  if (!Number.isFinite(srm) || srm <= 0) return 'rgb(255, 250, 210)';
  const stops = [
    [0,   255, 250, 210],
    [2,   255, 232, 120],
    [4,   255, 202,  90],
    [6,   255, 191,  66],
    [8,   251, 177,  35],
    [10,  248, 166,   0],
    [14,  234, 143,   0],
    [18,  222, 124,   0],
    [24,  203,  98,   0],
    [30,  181,  79,   0],
    [35,  160,  58,   0],
    [40,  149,  45,   0],
  ];
  const clamped = Math.min(srm, 40);
  let lo = stops[0];
  let hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i][0] && clamped <= stops[i + 1][0]) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const t = lo[0] === hi[0] ? 0 : (clamped - lo[0]) / (hi[0] - lo[0]);
  const r = Math.round(lo[1] + t * (hi[1] - lo[1]));
  const g = Math.round(lo[2] + t * (hi[2] - lo[2]));
  const b = Math.round(lo[3] + t * (hi[3] - lo[3]));
  return `rgb(${r}, ${g}, ${b})`;
}

// Compact StatBox sized for the sticky header strip.
const STRIP_BOX = { flex: '1 1 0', minWidth: 0, padding: '0.45rem 0.35rem' };
const STRIP_VAL = { fontSize: '1.35rem', letterSpacing: '-0.01em' };

export default function StatsBar({ derived, mode, proGravityUnit }) {
  const { grist, hops, cells, starter } = derived;
  const gu = resolveGravityUnit(mode, proGravityUnit);
  const gLabel = gravityUnitLabel(gu);

  const srmColor = srmToColor(grist.SRM);
  const starterNote = starter[0]
    ? `Starter ${num(starter[0].volumeL, 2)} L`
    : 'No starter band';

  return (
    <div style={{ display: 'flex', gap: '0.4rem', overflow: 'hidden' }}>
      <StatBox
        value={gravity(gravityFromCanonical(grist.OG, gu), gu)}
        label="OG"
        sublabel={gLabel}
        style={STRIP_BOX}
        valueStyle={STRIP_VAL}
      />
      <StatBox
        value={gravity(gravityFromCanonical(grist.FG, gu), gu)}
        label="FG"
        sublabel={gLabel}
        style={STRIP_BOX}
        valueStyle={STRIP_VAL}
      />
      <StatBox
        value={`${num(grist.ABV * 100, 1)}%`}
        label="ABV"
        style={STRIP_BOX}
        valueStyle={STRIP_VAL}
      />
      <StatBox
        value={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
            <div
              aria-hidden="true"
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: srmColor,
                border: '1px solid rgba(0,0,0,0.12)',
                flexShrink: 0,
              }}
            />
            {num(grist.SRM, 1)}
          </div>
        }
        label="SRM"
        style={STRIP_BOX}
        valueStyle={STRIP_VAL}
      />
      <StatBox
        value={hops.totalIBU}
        label="IBU"
        style={STRIP_BOX}
        valueStyle={STRIP_VAL}
      />
      <StatBox
        value={num(cellsFromCanonical(cells, mode), mode === 'pro' ? 2 : 0)}
        label={`Cells / ${cellsUnit(mode)}`}
        sublabel={starterNote}
        style={STRIP_BOX}
        valueStyle={{ ...STRIP_VAL, fontSize: '1.15rem' }}
      />
    </div>
  );
}
