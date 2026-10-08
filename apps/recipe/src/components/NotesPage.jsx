// NotesPage.jsx
// The References page (docs/items/references-page.md, RF-S1 to RF-S8): for each
// model the Recipe tab and the Water tab's mash pH use, its equation in
// symbols, each symbol with its unit, and its citation. Reached from the
// footer's "References" and left by "Back to the recipe". The Water tab keeps
// its own Notes. The file keeps its old name because App.jsx (Tier B) imports
// it by that name.
//
// Reference text, not brewing math (SPEC rule 7): the equations are written
// out for the reader and nothing here is computed. What the engine exports
// (pitch rates, mash ranges, the density table, the reference temperature,
// litres per gallon, quarts per gallon, grams per pound, the acid table) is
// read from the engine; every other coefficient is written once, in
// COEFFICIENTS below, and notes-page.test.js evaluates each equation with
// that list and compares the result with the engine's own (RF-S5). The
// equations are those the engine holds (RF-S6). Unit factors appear where a
// symbol is defined (RF-S3).
import { Fragment } from 'react';
import Card from './shared/Card.jsx';
import { colors, tokens, radii } from './shared/styles.js';
import {
  PITCH_RATES,
  MASH_RV_RANGE_QT_PER_LB,
  MASH_R_RANGE_LB_PER_LB,
  MASH_PH_RANGE,
  MASH_PH_TESTED_RANGE,
  WATER_DENSITY_TABLE_C,
  LITERS_PER_GALLON,
  QT_PER_GAL,
  G_PER_LB,
  ACIDS,
} from '@brew/engine';
import { tempUnit, referenceTemp, pitchRateUnit, mashRvUnit, mashRUnit } from '../display.js';

// The coefficients the engine does not export, as it holds them: grist.js,
// units.js (the two Plato conversions), hops.js, starter.js, water/ra.js and
// water/mash-ph.js (the paper's section is beside each there).
export const COEFFICIENTS = {
  ppg: 46, // points per lb per gal of sucrose
  sgToPlato: { c0: -616.868, c1: 1111.14, c2: -630.272, c3: 135.997 },
  platoToSg: { a: 258.6, b: 258.2, c: 227.1 },
  abv: { k: 76.08, upper: 1.775, divisor: 0.794 },
  morey: { k: 1.4922, p: 0.6859 },
  tinseth: { k: 1.65, base: 0.000125, rate: 0.04, divisor: 4.15 },
  whirlpool: { c2: 0.0003858, c1: -0.12885802, c0: 10.97839506 },
  mgPerLPerOzPerGal: 7489.1, // mg/L of alpha acid per oz/gal
  starter: {
    dmeGPerL: 115,
    // Each band: its pack, its curve, and the cells needed, C, it serves; the
    // cells an extra pack supplies are taken off (takes), else N = C.
    bands: [
      {
        band: '100B',
        packCells: 100,
        a: -0.055,
        b: 0.729,
        c: 1.86,
        ranges: [
          { from: 250, to: 400, toIncluded: false },
          { from: 400, to: 500, toIncluded: false, takes: 100 },
        ],
      },
      {
        band: '200B',
        packCells: 200,
        a: -0.03,
        b: 0.482,
        c: 1.674,
        ranges: [
          { from: 400, to: 700, toIncluded: false },
          { from: 700, to: 800, toIncluded: false, takes: 200 },
        ],
      },
      {
        band: '400B',
        packCells: 400,
        a: -0.006,
        b: 0.222,
        c: 1.738,
        ranges: [
          { from: 800, to: 1000, toIncluded: true },
          { from: 1000, fromIncluded: false, to: Infinity, takes: 200 },
        ],
      },
    ],
  },
  waterLbPerQt: 2.055, // lb of water per qt
  ra: { ca: 1.4, mg: 1.7 },
  mashPh: {
    mgCaCO3PerMeq: 50.04,
    ebcPerLovibond: 2.65,
    ebcOffset: 1.2,
    baseAtZero: 5.82,
    basePerEbc: -0.02,
    crystalBase: 14,
    crystalPerEbc: 0.13,
    roastAcidity: 40,
    titrationPh: 5.7,
    specialtySlope: 0.14,
    slopePerThickness: 0.013,
    slopeAtZero: 0.013,
    acidSide: 0.0814,
    acidSideThickness: 4,
  },
};
const k = COEFFICIENTS;

// A number with a true minus; a signed term for an equation.
const m = (x) => String(x).replace('-', '−');
const plus = (x) => (x < 0 ? `− ${Math.abs(x)}` : `+ ${x}`);

// The citations, as the owner's sheet gives them (references-page.md).
const PALMER = (
  <>Palmer, J. J. (2017). <em>How to Brew</em> (4th ed.). Brewers Publications. ISBN 978-1938469350.</>
);
const BREWERS_FRIEND = (
  <>Brewer&apos;s Friend. Plato to SG Conversion Chart (the ASBC polynomial). brewersfriend.com/plato-to-sg-conversion-chart/</>
);
const HALL = (
  <>Hall, M. L. (1995). Brew by the Numbers: Add Up What&apos;s in Your Beer. <em>Zymurgy</em>, 18(2), Summer 1995.</>
);
const MOREY = (
  <>Morey, D. (1998). Approximating SRM beer color of homebrew based on recipe formulation. <em>BrewingTechniques</em>, 6(1), 42–46.</>
);
const TINSETH = <>Tinseth, G. Glenn&apos;s Hop Utilization Numbers. realbeer.com/hops/research.html</>;
const MEINERS = <>Meiners, L., &amp; Cavanna, M. (2022). Skeptical Brewing, Part 3. <em>Zymurgy</em>, May/June 2022.</>;
const WHITE = (
  <>White, C., &amp; Zainasheff, J. (2010). <em>Yeast: The Practical Guide to Beer Fermentation</em>. Brewers Publications.</>
);
const STARTER_CURVES = (
  <>A quadratic fit to the output of MoreBeer&apos;s yeast starter calculator (morebeer.com), by Persyn Chemical Engineering.</>
);
const WAGNER = (
  <>Wagner, W., &amp; Pruß, A. (2002). The IAPWS formulation 1995 for the thermodynamic properties of ordinary water substance. <em>J. Phys. Chem. Ref. Data</em>, 31(2), 387–535.</>
);
const KOLBACH = (
  <>Kolbach, P. (1953). Der Einfluss des Brauwassers auf die Bierfarbe. <em>Monatsschrift für Brauerei</em>, 6, 167–171.</>
);
const TROESTER = (
  <>Troester, K. (2009). The effect of brewing water and grist composition on the pH of the mash. braukaiser.com (archived: web.archive.org/web/20250906010619/https://braukaiser.com/documents/effect_of_water_and_grist_on_mash_pH.pdf). Sections 2, 3.1, 3.3 to 3.6, 3.10; the acid-side slope is the app&apos;s fit to Table 3.</>
);
const PALMER_KAMINSKI = (
  <>Palmer, J. J., &amp; Kaminski, C. (2013). <em>Water: A Comprehensive Guide for Brewers</em>. Brewers Publications.</>
);
const TROESTER_TABLES = <>Troester (2009), Tables 3, 15 and 16.</>;

const mathFont = "Cambria, 'Times New Roman', serif";
const bodyStyle = { fontSize: '0.92rem', lineHeight: 1.6, color: colors.textPrimary, margin: '0.4rem 0' };
const sourceStyle = { ...tokens.notice, marginTop: '0.35rem', marginBottom: '0.6rem', overflowWrap: 'anywhere' };
const citeStyle = { fontStyle: 'normal' };
const modelTitleStyle = { ...tokens.cardLabel, margin: '0 0 0.4rem' };
const blockLabelStyle = { fontSize: '0.85rem', fontWeight: 600, color: colors.textSecondary, margin: '0.9rem 0 0.2rem' };
const eqStyle = {
  background: colors.noticeBg,
  borderRadius: radii.input,
  padding: '0.45rem 0.75rem',
  margin: '0.35rem 0',
  fontFamily: mathFont,
  fontSize: '0.98rem',
  lineHeight: 1.9,
  color: colors.textPrimary,
  overflowWrap: 'anywhere',
};
const captionStyle = { fontFamily: 'inherit', fontSize: '0.78rem', color: colors.textSecondary, marginRight: '0.6rem' };
const symbolsStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(3.5rem, max-content) 1fr',
  columnGap: '0.9rem',
  rowGap: '0.15rem',
  margin: '0.5rem 0',
  fontSize: '0.88rem',
  lineHeight: 1.5,
  color: colors.textPrimary,
};
const symbolStyle = { fontFamily: mathFont, margin: 0, overflowWrap: 'anywhere' };
const meaningStyle = { margin: 0, minWidth: 0, overflowWrap: 'anywhere' };
const tableStyle = { borderCollapse: 'collapse', fontSize: '0.88rem', margin: '0.5rem 0', color: colors.textPrimary };
const cellStyle = { padding: '0.2rem 0.7rem 0.2rem 0', textAlign: 'left', fontWeight: 400, verticalAlign: 'top' };
const headStyle = { ...cellStyle, fontWeight: 600, color: colors.textSecondary };
const chipsStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.2rem 0.9rem',
  margin: '0.5rem 0',
  padding: 0,
  listStyle: 'none',
  fontSize: '0.85rem',
  color: colors.textPrimary,
};
const listStyle = { ...bodyStyle, paddingLeft: '1.1rem' };
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

// A line of plain text with subscripts and superscripts: "x_{sub}" and
// "x^{sup}" (nested braces allowed). No math library (RF-Q3).
function mark(src) {
  const out = [];
  let plain = '';
  let key = 0;
  let i = 0;
  while (i < src.length) {
    if ((src[i] === '_' || src[i] === '^') && src[i + 1] === '{') {
      let depth = 1;
      let j = i + 2;
      while (j < src.length && depth > 0) {
        if (src[j] === '{') depth += 1;
        else if (src[j] === '}') depth -= 1;
        j += 1;
      }
      if (plain) out.push(plain);
      plain = '';
      const Tag = src[i] === '_' ? 'sub' : 'sup';
      out.push(<Tag key={key++}>{mark(src.slice(i + 2, j - 1))}</Tag>);
      i = j;
    } else {
      plain += src[i];
      i += 1;
    }
  }
  if (plain) out.push(plain);
  return out;
}

function Source({ children }) {
  return (
    <p style={sourceStyle}>
      Source: <cite style={citeStyle}>{children}</cite>
    </p>
  );
}

// One piece of a model: an optional label, its equations (a string, or
// { label, eq } with a caption before it), what any extra content adds, its
// symbols as [symbol, meaning, unit], and its source where it has one.
function Block({ label, equations = [], symbols = [], source, children }) {
  return (
    <>
      {label && <h3 style={blockLabelStyle}>{label}</h3>}
      {equations.map((e) => {
        const { label: caption, eq } = typeof e === 'string' ? { eq: e } : e;
        return (
          <div key={eq} style={eqStyle}>
            {caption && <span style={captionStyle}>{caption}</span>}
            {mark(eq)}
          </div>
        );
      })}
      {children}
      {symbols.length > 0 && (
        <dl style={symbolsStyle}>
          {symbols.map(([symbol, meaning, unit]) => (
            <Fragment key={symbol}>
              <dt style={symbolStyle}>{mark(symbol)}</dt>
              <dd style={meaningStyle}>
                {meaning} ({unit})
              </dd>
            </Fragment>
          ))}
        </dl>
      )}
      {source && <Source>{source}</Source>}
    </>
  );
}

function Model({ title, children }) {
  return (
    <Card>
      <h2 style={modelTitleStyle}>{title}</h2>
      {children}
    </Card>
  );
}

const range = (r) => `${r.low}–${r.high}`;
const rangeText = (r) =>
  r.to === Infinity
    ? `C ${r.fromIncluded === false ? '>' : '≥'} ${r.from}`
    : `${r.from} ≤ C ${r.toIncluded ? '≤' : '<'} ${r.to}`;

export default function ReferencesPage({ onBack, temperatureUnit }) {
  const ref = `${referenceTemp(temperatureUnit)} ${tempUnit(temperatureUnit)}`;
  const tableC = Object.keys(WATER_DENSITY_TABLE_C).map(Number);
  const ra = MASH_PH_TESTED_RANGE.residualAlkalinityMeq;
  const thickness = MASH_PH_TESTED_RANGE.thicknessLPerKg;
  const lactic = ACIDS.acidulated_malt;
  const litresPerGal = String(LITERS_PER_GALLON);
  const gPerLb = String(G_PER_LB);
  const p = k.mashPh;

  return (
    <>
      <Card>
        <h1 style={{ ...tokens.cardTitle, marginTop: 0 }}>References</h1>
        <p style={{ ...bodyStyle, margin: 0 }}>
          The equation behind each model the Recipe tab uses, each symbol with its unit, and where the model comes
          from. The mash pH is the Water tab&apos;s; its salts and acids have their own notes there.
        </p>
      </Card>
      <button type="button" onClick={onBack} style={backStyle}>
        ← Back to the recipe
      </button>

      <Model title="Gravity from the grain bill">
        <Block
          label="Extract and pre-boil gravity"
          equations={[`points_{i} = ${k.ppg} × FGDB_{i} × η × W_{i} / V_{pre}`, 'SG_{pre} = 1 + Σ points_{i} / 1000']}
          symbols={[
            [String(k.ppg), 'extract of sucrose', 'points per lb per gal'],
            ['1000', 'gravity points in one unit of SG', 'points per SG'],
            ['points_{i}', 'gravity points malt i adds', 'points'],
            ['FGDB_{i}', 'fine-grind dry-basis extract of malt i', 'fraction'],
            ['η', 'brewhouse efficiency', 'fraction'],
            ['W_{i}', 'weight of malt i', 'lb'],
            ['V_{pre}', `pre-boil volume at ${ref}`, 'gal'],
            ['SG_{pre}', 'pre-boil gravity', 'SG'],
          ]}
          source={PALMER}
        />
        <Block
          label="Specific gravity and degrees Plato"
          equations={[
            `P(SG) = ${m(k.sgToPlato.c0)} ${plus(k.sgToPlato.c1)} SG ${plus(k.sgToPlato.c2)} SG^{2} ${plus(k.sgToPlato.c3)} SG^{3}`,
            `SG(P) = 1 + P / (${k.platoToSg.a} − (P / ${k.platoToSg.b}) × ${k.platoToSg.c})`,
          ]}
          symbols={[
            ['SG', 'specific gravity', 'SG'],
            ['P', 'gravity in degrees Plato', '°P'],
          ]}
          source={BREWERS_FRIEND}
        />
        <Block
          label="Boil concentration"
          equations={['P_{pre} = P(SG_{pre})', 'P_{post} = P_{pre} × V_{pre} / V_{post}', 'OG = SG(P_{post})']}
          symbols={[
            ['P_{pre}', 'pre-boil gravity', '°P'],
            ['P_{post}', 'post-boil gravity', '°P'],
            ['V_{post}', `post-boil volume at ${ref}`, 'gal'],
            ['OG', 'original gravity', 'SG'],
          ]}
        />
      </Model>

      <Model title="Final gravity and alcohol by volume">
        <Block
          label="Final gravity"
          equations={['FG = OG − AA × (OG − 1)']}
          symbols={[
            ['FG', 'final gravity', 'SG'],
            ['AA', 'apparent attenuation, of the gravity points', 'fraction'],
          ]}
        />
        <Block
          label="Alcohol by volume"
          equations={[`ABV = ${k.abv.k} × (OG − FG) / (${k.abv.upper} − OG) × (FG / ${k.abv.divisor})`]}
          symbols={[
            ['OG', 'original gravity', 'SG'],
            ['ABV', 'alcohol by volume', '% by volume'],
          ]}
          source={HALL}
        />
      </Model>

      <Model title="Colour">
        <Block
          equations={['MCU = Σ L_{i} × W_{i} / V_{post}', `SRM = ${k.morey.k} × MCU^{${k.morey.p}}`]}
          symbols={[
            ['L_{i}', 'colour of malt i', '°L'],
            ['W_{i}', 'weight of malt i', 'lb'],
            ['V_{post}', `post-boil volume at ${ref}`, 'gal'],
            ['MCU', 'malt colour units', '°L lb/gal'],
            ['SRM', 'beer colour', 'SRM'],
          ]}
          source={MOREY}
        />
      </Model>

      <Model title="Bitterness">
        <Block
          label="Utilization"
          equations={[
            `U(t) = ${k.tinseth.k} × ${k.tinseth.base}^{(SG_{pre} − 1)} × (1 − e^{(−${k.tinseth.rate} t)}) / ${k.tinseth.divisor}`,
          ]}
          symbols={[
            ['U', 'utilization', 'fraction'],
            ['t', 'minutes in the wort', 'min'],
            ['SG_{pre}', 'pre-boil gravity', 'SG'],
            ['e', 'base of the natural logarithm', 'dimensionless'],
          ]}
          source={TINSETH}
        />
        <Block
          label="Whirlpool temperature factor"
          equations={[`f(T) = ${k.whirlpool.c2} T^{2} ${plus(k.whirlpool.c1)} T ${plus(k.whirlpool.c0)}`]}
          symbols={[
            ['f', 'factor on the utilization', 'fraction'],
            ['T', 'temperature of the wort at the addition', '°F'],
          ]}
          source={MEINERS}
        />
        <Block
          label="International Bitterness Units"
          equations={[`IBU_{i} = H_{i} × α_{i} × U_{i} × f_{i} × ${k.mgPerLPerOzPerGal} / V_{post}`, 'IBU = Σ IBU_{i}']}
          symbols={[
            ['H_{i}', 'weight of hop addition i', 'oz'],
            ['α_{i}', 'alpha acid of addition i', 'fraction'],
            ['U_{i}', 'utilization U(t) at the addition’s minutes', 'fraction'],
            ['f_{i}', 'factor f(T) at the addition’s wort temperature', 'fraction'],
            ['V_{post}', `post-boil volume at ${ref}`, 'gal'],
            [String(k.mgPerLPerOzPerGal), 'milligrams per litre in one ounce per gallon', 'mg/L per oz/gal'],
            ['IBU_{i}', 'bitterness of addition i', 'IBU'],
            ['IBU', 'bitterness of the beer, rounded to a whole number', 'IBU'],
          ]}
        />
      </Model>

      <Model title="Pitch rates and cells needed">
        <Block
          equations={[`C = r × P_{post} × ${litresPerGal} × V_{ferm}`]}
          symbols={[
            ['C', 'cells needed, rounded to the nearest 10', 'billion cells'],
            ['r', 'pitch rate, from the table below', pitchRateUnit()],
            ['P_{post}', 'post-boil gravity', '°P'],
            ['V_{ferm}', `fermentation volume at ${ref}`, 'gal'],
            [litresPerGal, 'litres in a US gallon', 'L/gal'],
          ]}
        >
          <table style={tableStyle}>
            <thead>
              <tr>
                <th scope="col" style={headStyle}>Yeast character</th>
                <th scope="col" style={headStyle}>High</th>
                <th scope="col" style={headStyle}>Moderate</th>
                <th scope="col" style={headStyle}>Low</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Ale', PITCH_RATES.ale],
                ['Lager', PITCH_RATES.lager],
              ].map(([name, rates]) => (
                <tr key={name}>
                  <th scope="row" style={cellStyle}>{name}</th>
                  <td style={cellStyle}>{rates.high}</td>
                  <td style={cellStyle}>{rates.mod}</td>
                  <td style={cellStyle}>{rates.low}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Block>
        <Source>{WHITE}</Source>
      </Model>

      <Model title="Starters">
        <Block
          label="Growth curve"
          equations={['G(V) = a V^{2} + b V + c', 'V = (−b ± √(b^{2} − 4 a (c − N / S))) / (2 a)']}
          symbols={[
            ['G', 'growth, cells in the starter per cell in the pack', '×'],
            ['V', 'starter volume, the smaller positive root', 'L'],
            ['a', 'curve coefficient of the band', '×/L²'],
            ['b', 'curve coefficient of the band', '×/L'],
            ['c', 'curve coefficient of the band', '×'],
            ['N', 'cells the starter must reach', 'billion cells'],
            ['S', 'cells in the band’s pack', 'billion cells'],
            ['C', 'cells needed, as under Pitch rates', 'billion cells'],
          ]}
          source={STARTER_CURVES}
        />
        <Block
          label="Dry malt extract"
          equations={[`m = ${k.starter.dmeGPerL} × V`]}
          symbols={[
            ['m', 'dry malt extract', 'g'],
            [String(k.starter.dmeGPerL), 'dry malt extract per litre of starter', 'g/L'],
          ]}
          source={PALMER}
        />
        <Block label="Bands">
          <table style={tableStyle}>
            <thead>
              <tr>
                <th scope="col" style={headStyle}>Band</th>
                <th scope="col" style={headStyle}>S</th>
                <th scope="col" style={headStyle}>a</th>
                <th scope="col" style={headStyle}>b</th>
                <th scope="col" style={headStyle}>c</th>
              </tr>
            </thead>
            <tbody>
              {k.starter.bands.map((b) => (
                <tr key={b.band}>
                  <th scope="row" style={cellStyle}>{b.band}</th>
                  <td style={cellStyle}>{b.packCells}</td>
                  <td style={cellStyle}>{m(b.a)}</td>
                  <td style={cellStyle}>{m(b.b)}</td>
                  <td style={cellStyle}>{m(b.c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul style={listStyle}>
            {k.starter.bands.flatMap((b) =>
              b.ranges.map((r) => (
                <li key={`${b.band}${r.from}`}>
                  {b.band} {rangeText(r)}: {r.takes ? `N = C − ${r.takes}` : 'N = C'}
                  {r.takes ? ` (one extra ${r.takes}B pack)` : ''}
                </li>
              )),
            )}
          </ul>
          <Source>none; the bands are the app&apos;s own rule.</Source>
        </Block>
      </Model>

      <Model title="Volumes at the reference temperature">
        <Block
          equations={['V_{ref} = V_{T} × ρ(T_{C}) / ρ(T_{ref})', 'T_{C} = (T_{F} − 32) × 5 / 9']}
          symbols={[
            ['V_{ref}', 'volume at the reference temperature', 'gal'],
            ['V_{T}', 'volume as measured', 'gal'],
            ['ρ', 'density of water, linear between the table’s neighbours', 'kg/m³'],
            ['T_{C}', 'temperature of the measurement', '°C'],
            ['T_{F}', 'temperature of the measurement', '°F'],
            ['T_{ref}', 'reference temperature', ref],
          ]}
        >
          <ul style={chipsStyle}>
            {Object.entries(WATER_DENSITY_TABLE_C).map(([c, rho]) => (
              <li key={c} style={{ whiteSpace: 'nowrap' }}>
                {c} °C: {rho}
              </li>
            ))}
          </ul>
          <p style={bodyStyle}>
            The table of density in kg/m³ runs {Math.min(...tableC)}–{Math.max(...tableC)} °C; a temperature outside
            it leaves the volume blank. The pre-boil, post-boil and fermentation volumes are corrected this way; the
            mash water is used as entered.
          </p>
        </Block>
        <Source>{WAGNER}</Source>
      </Model>

      <Model title="Mash thickness">
        <Block
          equations={[`R_{v} = ${QT_PER_GAL} × V_{mash} / W_{grain}`, `R = ${k.waterLbPerQt} × R_{v}`]}
          symbols={[
            ['R_{v}', 'mash thickness by volume', mashRvUnit()],
            ['R', 'mash thickness by weight', mashRUnit()],
            ['V_{mash}', 'mash water, as entered', 'gal'],
            ['W_{grain}', 'weight of the grain', 'lb'],
            [String(QT_PER_GAL), 'quarts in a US gallon', 'qt/gal'],
            [String(k.waterLbPerQt), 'weight of a quart of mash water', 'lb/qt'],
          ]}
        >
          <p style={bodyStyle}>
            Recommended: R<sub>v</sub> {range(MASH_RV_RANGE_QT_PER_LB)} {mashRvUnit()}, R {range(MASH_R_RANGE_LB_PER_LB)}{' '}
            {mashRUnit()}.
          </p>
        </Block>
        <Source>{PALMER}</Source>
      </Model>

      <Model title="Residual alkalinity">
        <Block
          equations={[`RA = Alk − (Ca / ${k.ra.ca} + Mg / ${k.ra.mg})`]}
          symbols={[
            ['RA', 'residual alkalinity', 'mg/L as CaCO3'],
            ['Alk', 'alkalinity', 'mg/L as CaCO3'],
            ['Ca', 'calcium', 'mg/L'],
            ['Mg', 'magnesium', 'mg/L'],
          ]}
          source={KOLBACH}
        >
          <p style={bodyStyle}>Salt additions and acid doses are described in the Water tab&apos;s Notes.</p>
        </Block>
      </Model>

      <Model title="Mash pH">
        <Block
          label="Colour in EBC"
          equations={[`EBC = ${p.ebcPerLovibond} L − ${p.ebcOffset}`]}
          symbols={[
            ['L', 'colour of a malt', '°L'],
            ['EBC', 'colour of a malt', 'EBC'],
          ]}
        />
        <Block
          label="A base malt"
          equations={[`pH_{i} = ${p.baseAtZero} ${plus(p.basePerEbc)} EBC_{i}`]}
          symbols={[['pH_{i}', 'distilled-water pH of base malt i, or as measured', 'pH']]}
        />
        <Block
          label="A specialty malt"
          equations={[
            { label: 'Crystal', eq: `A_{i} = ${p.crystalBase} + ${p.crystalPerEbc} EBC_{i}` },
            { label: 'Roast', eq: `A_{i} = ${p.roastAcidity}` },
            { label: 'Acidulated', eq: 'A_{i} = 1000 × (1000 x / M)' },
          ]}
          symbols={[
            ['A_{i}', 'acidity of specialty malt i, or as measured', 'mEq/kg'],
            ['x', `lactic acid in acidulated malt, ${lactic.weight_fraction_lactic} by weight`, 'fraction'],
            ['M', `molar mass of lactic acid, ${lactic.mw_lactic}`, 'g/mol'],
            ['1000', 'grams in a kilogram, and milliequivalents in an equivalent', 'g/kg, mEq/eq'],
          ]}
        >
          <p style={bodyStyle}>A malt typed none counts as nothing in the mash.</p>
        </Block>
        <Block
          label="Mash thickness"
          equations={[`R_{kg} = ${litresPerGal} V_{mash} / (${gPerLb} W_{grain} / 1000)`]}
          symbols={[
            ['R_{kg}', 'mash thickness', 'L/kg'],
            ['V_{mash}', 'mash water, as entered', 'gal'],
            ['W_{grain}', 'weight of the grain in the mash', 'lb'],
            [litresPerGal, 'litres in a US gallon', 'L/gal'],
            [gPerLb, 'grams in a pound', 'g/lb'],
            ['1000', 'grams in a kilogram', 'g/kg'],
          ]}
        />
        <Block
          label="The grist in distilled water"
          equations={[
            `pH_{grist} = Σ_{base} s_{i} pH_{i} + ${p.titrationPh} s_{sp} − ${p.specialtySlope} Σ_{sp} s_{i} A_{i} / R_{kg}`,
          ]}
          symbols={[
            ['s_{i}', 'share of malt i in the grain weight', 'fraction'],
            ['s_{sp}', 'share of the specialty malts in the grain weight', 'fraction'],
            ['pH_{grist}', 'pH of the grist in distilled water', 'pH'],
          ]}
        >
          <p style={bodyStyle}>
            Σ<sub>base</sub> sums the base malts and Σ<sub>sp</sub> the specialty malts (crystal, roast and
            acidulated). A specialty malt counts at {p.titrationPh}, the pH its acidity was titrated to, and its
            acidity lowers the grist pH by {p.specialtySlope} per mEq/L of acidity in the mash water.
          </p>
        </Block>
        <Block
          label="The water"
          equations={[
            `S(R_{kg}) = ${p.slopePerThickness} R_{kg} + ${p.slopeAtZero}`,
            { label: 'Alkalinity at or above zero', eq: 'pH = pH_{grist} + S(R_{kg}) × RA_{mEq}' },
            { label: 'Alkalinity below zero', eq: 'pH = pH_{grist} + S(R_{kg}) × H + S_{a}(R_{kg}) × Alk_{mEq}' },
            `RA_{mEq} = RA / ${p.mgCaCO3PerMeq}`,
            `Alk_{mEq} = Alk / ${p.mgCaCO3PerMeq}`,
            `H = −(Ca / ${k.ra.ca} + Mg / ${k.ra.mg}) / ${p.mgCaCO3PerMeq}`,
            `S_{a}(R_{kg}) = ${p.acidSide} × S(R_{kg}) / S(${p.acidSideThickness})`,
          ]}
          symbols={[
            ['pH', 'predicted mash pH of a cooled sample', 'pH'],
            ['S', 'slope of pH on residual alkalinity', 'pH L/mEq'],
            ['S_{a}', 'slope of pH on alkalinity below zero', 'pH L/mEq'],
            ['RA', 'residual alkalinity of the mash water', 'mg/L as CaCO3'],
            ['Alk', 'alkalinity of the mash water', 'mg/L as CaCO3'],
            ['Ca', 'calcium of the mash water', 'mg/L'],
            ['Mg', 'magnesium of the mash water', 'mg/L'],
            ['RA_{mEq}', 'residual alkalinity', 'mEq/L'],
            ['Alk_{mEq}', 'alkalinity', 'mEq/L'],
            ['H', 'calcium and magnesium term', 'mEq/L'],
            [String(p.mgCaCO3PerMeq), 'milligrams as CaCO3 in one milliequivalent', 'mg/L as CaCO3 per mEq/L'],
          ]}
          source={TROESTER}
        />
        <Block label="Range for a cooled sample" source={PALMER_KAMINSKI}>
          <p style={bodyStyle}>The predicted mash pH is checked against {range(MASH_PH_RANGE)}.</p>
        </Block>
        <Block label="Range the model was tested on" source={TROESTER_TABLES}>
          <p style={bodyStyle}>
            Residual alkalinity {m(ra.low)} to {ra.high} mEq/L and mash thickness {range(thickness)} L/kg. Beyond
            either, the figure is shown with a note.
          </p>
        </Block>
      </Model>
    </>
  );
}
