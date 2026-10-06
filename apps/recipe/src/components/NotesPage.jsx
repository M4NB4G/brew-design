// NotesPage.jsx
// Methods and sources (docs/items/notes-page.md): each method the Recipe tab
// uses, in words, with its source (NM-S2), reached from the footer's "Notes"
// and left by "Back to the recipe" (NM-S1). The Water tab keeps its own Notes.
// Every constant quoted is read from the engine where it exports it; the one
// written here, 46 points per pound per gallon, is pinned against the engine
// by notes-page.test.js (NM-S3). Static text; nothing computed.
import Card from './shared/Card.jsx';
import { colors, tokens, radii } from './shared/styles.js';
import {
  PITCH_RATES,
  MASH_RV_RANGE_QT_PER_LB,
  MASH_R_RANGE_LB_PER_LB,
  MASH_PH_RANGE,
  MASH_PH_TESTED_RANGE,
  WATER_DENSITY_TABLE_C,
} from '@brew/engine';
import { tempUnit, referenceTemp, pitchRateUnit, mashRvUnit, mashRUnit } from '../display.js';

const bodyStyle = { fontSize: '0.92rem', lineHeight: 1.6, color: colors.textPrimary };
const sourceStyle = { ...tokens.notice, marginTop: '0.25rem' };
const backStyle = {
  padding: '0.38rem 0.9rem',
  background: 'transparent',
  border: `1px solid ${colors.inputBorder}`,
  borderRadius: radii.btn,
  color: colors.textSecondary,
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  marginBottom: '1rem',
};

// One method: its heading, what it does in words, and where it comes from.
function Method({ title, children, source }) {
  return (
    <Card>
      <div style={tokens.cardLabel}>{title}</div>
      <div style={bodyStyle}>{children}</div>
      <p style={sourceStyle}>Source: {source}</p>
    </Card>
  );
}

const range = (r) => `${r.low}–${r.high}`;
const rates = (r) => `${r.high}, ${r.mod} and ${r.low}`;

export default function NotesPage({ onBack, temperatureUnit }) {
  const ref = `${referenceTemp(temperatureUnit)} ${tempUnit(temperatureUnit)}`;
  const tableC = Object.keys(WATER_DENSITY_TABLE_C).map(Number);
  const ra = MASH_PH_TESTED_RANGE.residualAlkalinityMeq;
  const thickness = MASH_PH_TESTED_RANGE.thicknessLPerKg;

  return (
    <>
      <Card>
        <h1 style={{ ...tokens.cardTitle, marginTop: 0 }}>Methods and sources</h1>
        <p style={{ ...bodyStyle, margin: 0 }}>
          How the Recipe tab works out each figure, and where each method comes from. The water figures have their
          own notes: see the Water tab&apos;s Notes.
        </p>
      </Card>
      <button type="button" onClick={onBack} style={backStyle}>
        ← Back to the recipe
      </button>

      <Method
        title="Where the recipe math comes from"
        source="Experiments Are Fun Recipe Designer, Rev 3 (Persyn Chemical Engineering)."
      >
        <p style={{ marginTop: 0 }}>
          Every recipe figure follows the Experiments Are Fun Recipe Designer spreadsheet, Rev 3: its formulas and its
          constants, reproduced exactly, and checked against the spreadsheet&apos;s own results. Where the spreadsheet
          gives a result that looks wrong, it is kept and marked, not quietly changed. One rule departs from Rev 3 on
          its author&apos;s word: where the largest starter band begins and ends.
        </p>
      </Method>

      <Method title="Gravity from the grain bill" source="the Recipe Designer, Rev 3; SG and °P conversions after Brewer's Friend and the ASBC.">
        <p style={{ marginTop: 0 }}>
          Each malt gives its points: its fine-grind dry-basis extract (FGDB) times 46 points per pound per gallon, the
          extract of sucrose, times the brewhouse efficiency, times its weight in pounds, over the pre-boil volume in
          gallons at the reference temperature. The points
          add to the pre-boil gravity. The boil concentrates it by the ratio of the pre-boil to the post-boil volume,
          with the spreadsheet&apos;s empirical boil correction, to the original gravity.
        </p>
        <p style={{ marginBottom: 0 }}>
          SG goes to °P by the Brewer&apos;s Friend cubic and °P back to SG by the ASBC polynomial. The two are not
          exact inverses, so a gravity taken there and back moves very slightly; Design to target OG shows it.
        </p>
      </Method>

      <Method title="Alcohol by volume" source="the Recipe Designer, Rev 3 (the standard &quot;advanced&quot; formula).">
        <p style={{ margin: 0 }}>
          The final gravity is the original gravity less the apparent attenuation of its gravity points. Alcohol by
          volume follows from the original and final gravity by the standard &quot;advanced&quot; formula, which
          corrects for the density of the alcohol in the finished beer.
        </p>
      </Method>

      <Method title="Colour" source="Morey's equation, as the Recipe Designer uses it.">
        <p style={{ margin: 0 }}>
          Each malt adds its malt colour units, its colour in °L times its weight in pounds over the post-boil volume
          in gallons. Morey&apos;s equation, a power curve fitted to measured beers, turns their sum into SRM; malt
          colour units alone overstate a dark beer.
        </p>
      </Method>

      <Method
        title="Bitterness"
        source="Glenn Tinseth's utilization model; the whirlpool factor from Zymurgy, May/June 2022 (a quadratic fit)."
      >
        <p style={{ margin: 0 }}>
          Each kettle addition&apos;s utilization is Tinseth&apos;s: a gravity factor (read at the pre-boil gravity,
          as the spreadsheet does) times a time factor that rises with the minutes in the wort. A whirlpool or
          late addition is scaled by a factor for its wort temperature, a quadratic fitted over whirlpool
          temperatures: almost no change at a full boil, less as the wort cools through the usual whirlpool range.
          IBU is the hop weight times its alpha acid times that utilization, over the post-boil volume.
        </p>
      </Method>

      <Method
        title="Pitch rates and starters"
        source="pitch rates after White and Zainasheff; the starter bands are the Recipe Designer's, solved directly in place of its goal-seek."
      >
        <p style={{ marginTop: 0 }}>
          Cells needed are the pitch rate times the post-boil gravity in °P times the fermentation volume in litres. The
          rates, in {pitchRateUnit()}, are {rates(PITCH_RATES.ale)} for an ale and {rates(PITCH_RATES.lager)} for a
          lager, from a high to a low yeast character.
        </p>
        <p style={{ marginBottom: 0 }}>
          A starter is chosen from three pack sizes, each with its own growth curve over the starter&apos;s volume, fitted
          in the spreadsheet; its dry malt extract is a fixed weight per litre.
        </p>
      </Method>

      <Method
        title="Volumes at the reference temperature"
        source="water density from the IAPWS-95 formulation."
      >
        <p style={{ marginTop: 0 }}>
          The pre-boil, post-boil and fermentation volumes are taken to their equivalent at {ref}, the reference the
          recipe math expects: the measured volume times the water&apos;s density at its measurement temperature over
          its density at {ref}. The density table runs {Math.min(...tableC)}–{Math.max(...tableC)} °C; a temperature
          outside it leaves the volume blank. The mash water is used as entered.
        </p>
        <p style={{ marginBottom: 0 }}>
          Mash thickness is read against the spreadsheet&apos;s ranges: {range(MASH_RV_RANGE_QT_PER_LB)} {mashRvUnit()}{' '}
          and {range(MASH_R_RANGE_LB_PER_LB)} {mashRUnit()}.
        </p>
      </Method>

      <Method
        title="Water chemistry"
        source="Palmer and Kaminski, Water: A Comprehensive Guide for Brewers (2013); residual alkalinity after Kolbach (1953); acids after Troester, An Overview of pH (2009); styles also from Palmer, How to Brew (2006), and Janish, The New IPA (2019). The chemistry is Brew Water Chem's."
      >
        <p style={{ margin: 0 }}>
          Salt additions bring the source water toward the style&apos;s ion targets; an acid dose takes out the excess
          alkalinity; residual alkalinity and the sulfate to chloride ratio describe the result. The Water tab&apos;s
          Notes give the details and limits.
        </p>
      </Method>

      <Method
        title="Mash pH"
        source="Kai Troester, The effect of brewing water and grist composition on the pH of the mash, braukaiser.com, 2009."
      >
        <p style={{ margin: 0 }}>
          The predicted mash pH of a cooled sample comes from Troester&apos;s model: each malt&apos;s distilled-water pH
          and acidity, by its type or as measured, against the residual alkalinity of the water the mash draws and the
          mash thickness. It is checked against {range(MASH_PH_RANGE)}; the model was tested on water of {ra.low} to{' '}
          {ra.high} mEq/L residual alkalinity and mashes of {range(thickness)} L/kg, and a note says when a recipe
          is beyond either.
        </p>
      </Method>
    </>
  );
}
