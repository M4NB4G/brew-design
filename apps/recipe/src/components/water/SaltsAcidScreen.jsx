// SaltsAcidScreen.jsx
// "Salts & Acid": the salt and acid additions, Brew Water Chem's RecipeTab in
// its wording, without its batch sheet or its print button (W7: Print prints
// the recipe sheet). Every figure — the recommended salts, the acid dose in
// the acid picked, each acid's mEq, the totals, the predicted profile and how
// near each figure is to its target — comes from computeWater as `figures`;
// the entries change only through water-state.js's steps.
//
// Salt and acid amounts are editable boxes that hold a draft while typing
// (the water app's DraftInput): the brewer's amount is taken as it is typed
// and a box left empty reads 0 when left, as in the water app. While a test
// result is blank the recommendation is blank: its boxes show empty and its
// figures "—" (W5). Salts are grams and liquid acid mL in both modes;
// acidulated malt shows oz (Home) or lb (Pro) and is held in grams (W-S4).
//
// Where the water is treated (docs/items/water-treatment.md): the Where the
// Water Goes card in place of the Mash Volume card; the salts and acid say
// where they go; salts in the kettle have their own card, with no acid; the
// predicted profile is labelled as the treated water (WT-S6).
//
// Mash pH from the grain bill (docs/items/mash-ph.md, MP-Q12): the predicted
// mash pH of a cooled sample at the top of the predicted profile card, the
// model cited beside it, with a warning outside the cooled-sample range
// (MP-Q10) and when acidulated malt is counted twice (MP-Q5).
import { useEffect, useState } from 'react';
import { SALT_CONTRIBUTIONS_PER_G_GAL, ACIDS, MASH_PH_RANGE } from '@brew/engine';
import { testedRangeNote } from './tested-range-note.js';
import Card from '../shared/Card.jsx';
import StatBox from '../shared/StatBox.jsx';
import { colors, radii, tokens } from '../shared/styles.js';
import WaterGoesCard, {
  volumeText,
  KETTLE_LABEL,
  KETTLE_CAVEAT,
  KETTLE_ASSUMPTION,
  KETTLE_BIAS_NOTE,
  KETTLE_HELD_NOTE,
} from './WaterGoesCard.jsx';
import {
  volumeUnit,
  saltUnit,
  liquidAcidUnit,
  acidMaltUnit,
  acidMaltFromCanonical,
  acidMaltToCanonical,
} from '../../display.js';
import { num } from '../../format.js';
import {
  setRaiseAlkSource,
  toggleSaltOnHand,
  setSaltAmount,
  setAcidAmount,
  setPrimaryAcid,
  setMultiAcid,
  resetToRecommended,
} from '../../water-state.js';

const ACID_KEYS = Object.keys(ACIDS);

// A number box holding a local draft while the brewer types; the parsed
// value goes to the parent as it is typed, and the box is tidied when left.
// When the value changes from outside (a reset, a new recommendation) the
// draft follows it, unless the brewer is mid-way through typing (the draft
// does not parse). A blank value shows an empty box.
function DraftInput({ initialValue, format, parse, onChange, style }) {
  const [draft, setDraft] = useState(() => format(initialValue));

  useEffect(() => {
    if (Number.isNaN(initialValue)) {
      setDraft('');
      return;
    }
    const parsed = parse(draft);
    if (parsed === null ? draft === '' : Math.abs(parsed - initialValue) > 1e-6) {
      setDraft(format(initialValue));
    }
    // parse/format are stable; intentionally not in deps to avoid resync loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        const v = parse(e.target.value);
        if (v !== null) onChange(v);
      }}
      onFocus={(e) => e.target.select()}
      onBlur={() => {
        if (draft === '' && Number.isNaN(initialValue)) return; // still blank
        const v = parse(draft) ?? 0;
        setDraft(format(v));
        onChange(v);
      }}
      style={style}
    />
  );
}

export default function SaltsAcidScreen({ water, figures, mode, proVolumeUnit, setWater }) {
  const { style, target, salts, raiseSalt, acid, final, mashPh } = figures;

  // Grams: whole in Pro, one decimal at Home (the water app's precision).
  const gramDigits = mode === 'pro' ? 0 : 1;
  const formatGrams = (g) => (Number.isFinite(g) ? g.toFixed(gramDigits) : '');
  const parseGrams = (s) => {
    const v = parseFloat(s);
    return isNaN(v) || v < 0 ? null : v;
  };

  // Where the treated water's additions go (water treatment, WT-S1).
  const tankTreated = figures.setup.treatment === 'tank';
  const treatedVolume = `${volumeText(figures.volumes.treatedGal, mode, proVolumeUnit)} ${volumeUnit(mode, proVolumeUnit)}`;

  const saltRow = (row, warnings) => (
    <div key={row.key} style={editableRowStyle}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={recipeNameStyle}>{row.name}</div>
        {row.reason && <div style={recipeReasonStyle}>{row.reason}</div>}
        {warnings}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end' }}>
          <DraftInput
            key={`${row.key}-${mode}`}
            initialValue={row.amount}
            format={formatGrams}
            parse={parseGrams}
            onChange={(v) => setWater((w) => setSaltAmount(w, row.key, v))}
            style={{
              ...tokens.numberInput,
              width: '80px',
              background: row.overridden ? colors.inputBgOverride : colors.inputBg,
            }}
          />
          <span style={unitLabelStyle}>{saltUnit(mode)}</span>
        </div>
        <div style={hintStyle}>
          rec {num(row.recommended, gramDigits)} {saltUnit(mode)}
        </div>
      </div>
    </div>
  );

  const limeWarning = (
    <div style={{ ...recipeReasonStyle, color: colors.textWarn }}>
      ⚠ Strong base. Add to mash, never directly to grain.
    </div>
  );

  const rowOf = (key) => acid.rows.find((r) => r.key === key);
  const primaryRow = rowOf(acid.primary);
  const onSetPrimaryAcid = (key) => setWater((w) => setPrimaryAcid(w, acid.amounts, key));
  const onChangeAcid = (key) => (v) => setWater((w) => setAcidAmount(w, acid.amounts, key, v));

  const singleReason = Number.isNaN(acid.recommendedMeq)
    ? '—'
    : acid.recommendedMeq > 0
      ? `Neutralize ${num(acid.totals.ppm_alk_reduced, 0)} mg/L alkalinity (${num(acid.totals.total_meq, 1)} mEq total)`
      : 'No acid required by solver — adjust if desired.';

  const MATCH = { near: colors.matchNear, off: colors.matchOff, far: colors.matchFar };
  const tileStyle = (match) => ({ fontSize: '1.6rem', color: match ? MATCH[match] : colors.textPrimary });
  const sign = (n) => (n > 0 ? '+' : '');
  const ions = final?.ions;
  const kettleProfile = figures.kettle?.profile;
  const kettleIons = kettleProfile?.ions;

  return (
    <>
      <WaterGoesCard water={water} figures={figures} mode={mode} proVolumeUnit={proVolumeUnit} setWater={setWater} />

      <Card>
        <div style={tokens.cardLabel}>Available Salts</div>
        <div style={{ fontSize: '0.8rem', color: colors.textMuted, marginBottom: '0.6rem' }}>
          Check the salts you have on hand. The solver will only use enabled salts.
        </div>
        <div style={saltGridStyle}>
          {Object.entries(SALT_CONTRIBUTIONS_PER_G_GAL).map(([key, meta]) => (
            <label key={key} style={saltCheckStyle}>
              <input
                type="checkbox"
                checked={water.enabledSalts.includes(key)}
                onChange={() => setWater((w) => toggleSaltOnHand(w, key))}
                style={{ marginRight: '0.4rem', accentColor: colors.accent }}
              />
              {meta.name}
            </label>
          ))}
        </div>
      </Card>

      {figures.hasVolume && (
        <>
          <Card>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.4rem',
                gap: '0.5rem',
              }}
            >
              <span style={{ ...tokens.cardLabel, marginBottom: 0 }}>Salt Additions</span>
              {figures.customized && (
                <button type="button" onClick={() => setWater(resetToRecommended)} style={resetButtonStyle}>
                  Reset to recommended
                </button>
              )}
            </div>
            <div style={tokens.cardTitle}>{style.name}</div>
            <div style={whereStyle}>
              {tankTreated
                ? `Into the HLT's first fill (${treatedVolume})`
                : `Into the mash water (${treatedVolume})`}
            </div>
            <div style={tokens.accentBar} />

            {salts.length === 0 && (
              <p style={tokens.notice}>
                No salt additions needed — source water is already within tolerance
                of the target profile.
              </p>
            )}

            {salts.map((row) =>
              saltRow(
                row,
                <>
                  {row.key === 'chalk' && (
                    <div style={{ ...recipeReasonStyle, color: colors.textWarn }}>
                      ⚠ Chalk dissolves poorly — pre-dissolve in CO₂-saturated mash water.
                    </div>
                  )}
                  {row.key === 'pickling_lime' && limeWarning}
                </>,
              ),
            )}
          </Card>

          <Card>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.4rem',
                gap: '0.5rem',
              }}
            >
              <span style={{ ...tokens.cardLabel, marginBottom: 0 }}>
                {acid.multi ? 'Acid Additions' : 'Acid Dose'}
              </span>
              <label style={multiToggleStyle}>
                <input
                  type="checkbox"
                  checked={acid.multi}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setWater((w) => setMultiAcid(w, acid.amounts, on));
                  }}
                  style={{ marginRight: '0.4rem', accentColor: colors.accent }}
                />
                Use multiple acids
              </label>
            </div>

            {!acid.multi ? (
              <AcidRow
                row={primaryRow}
                mode={mode}
                onChangeAmount={onChangeAcid(acid.primary)}
                primary
                single
                primaryAcidType={acid.primary}
                onSetPrimaryAcid={onSetPrimaryAcid}
                reason={singleReason}
              />
            ) : (
              <>
                <div style={subsectionHeaderStyle}>Primary</div>
                <AcidRow
                  row={primaryRow}
                  mode={mode}
                  onChangeAmount={onChangeAcid(acid.primary)}
                  primary
                  primaryAcidType={acid.primary}
                  onSetPrimaryAcid={onSetPrimaryAcid}
                />

                <div style={{ ...subsectionHeaderStyle, marginTop: '0.5rem' }}>
                  Add secondary acids (optional)
                </div>
                {ACID_KEYS.filter((k) => k !== acid.primary).map((k) => (
                  <AcidRow key={k} row={rowOf(k)} mode={mode} onChangeAmount={onChangeAcid(k)} />
                ))}

                <div style={totalRowStyle}>
                  Total acid: {num(acid.totals.total_meq, 1)} mEq{'  '}→{'  '}
                  −{num(acid.totals.ppm_alk_reduced, 0)} ppm Alk
                </div>
              </>
            )}

            <p style={tokens.notice}>
              Phosphoric acid treated as monoprotic at mash pH 5.4 (pKa₁=2.15,
              pKa₂=7.20). See Troester (2009), Braukaiser.com.
            </p>
            {tankTreated && figures.setup.acidPlace === 'salts' && (
              <p style={tokens.notice}>
                The acid goes in the HLT with the salts, so the sparge liquor's treated share carries acid too.
              </p>
            )}
            {figures.setup.acidPlace === 'mash' && (
              <p style={tokens.notice}>
                The acid goes into the mash; the sparge and the water left in the HLT carry none.
              </p>
            )}
          </Card>

          <Card>
            <div style={tokens.cardLabel}>Alkalinity Raise</div>
            <div style={{ marginBottom: '0.6rem' }}>
              <div style={{ ...tokens.cardLabel, marginBottom: '0.4rem' }}>Source (if needed)</div>
              <select
                value={water.raiseAlkSource}
                onChange={(e) => {
                  const key = e.target.value;
                  setWater((w) => setRaiseAlkSource(w, key));
                }}
                style={tokens.select}
              >
                <option value="baking_soda">Baking Soda (NaHCO₃) — adds Na⁺</option>
                <option value="pickling_lime">Pickling Lime (Ca(OH)₂) — adds Ca²⁺</option>
              </select>
            </div>
            {saltRow(
              {
                ...raiseSalt,
                reason: `Raise alkalinity to target${raiseSalt.key === 'baking_soda' ? ' (adds Na⁺)' : ' (adds Ca²⁺)'}`,
              },
              raiseSalt.key === 'pickling_lime' && limeWarning,
            )}
          </Card>

          {figures.kettle && (
            <Card>
              <div style={tokens.cardLabel}>Kettle Salts</div>
              <div style={{ fontSize: '0.8rem', color: colors.textMuted, marginBottom: '0.4rem' }}>
                These bring the kettle water ({volumeText(figures.kettle.volumeGal, mode, proVolumeUnit)} {volumeUnit(mode, proVolumeUnit)}) to the{' '}
                {style.name} target.
              </div>
              {figures.kettle.overTarget.length > 0 && (
                <p role="status" style={{ ...tokens.warning, margin: '0 0 0.4rem' }}>
                  Already over the target from the mash:{' '}
                  {figures.kettle.overTarget.map((k) => SALT_CONTRIBUTIONS_PER_G_GAL[k].name).join(', ')}
                </p>
              )}
              {figures.kettle.salts.length === 0 && <p style={tokens.notice}>—</p>}
              {figures.kettle.salts.map((row) => (
                <div key={row.key} style={editableRowStyle}>
                  <div style={recipeNameStyle}>{row.name}</div>
                  <div style={{ ...recipeNameStyle, color: colors.textSecondary }}>
                    {num(row.amount, gramDigits)} {saltUnit(mode)}
                  </div>
                </div>
              ))}
              <p style={tokens.notice}>No acid goes in the kettle.</p>
            </Card>
          )}

          <Card>
            <div style={tokens.cardLabel}>Predicted Final Profile</div>
            <div style={tokens.cardTitle}>
              {figures.setup.acidPlace === 'mash'
                ? 'The water the mash draws (the treated HLT water with the acid)'
                : tankTreated
                  ? 'The treated HLT water (first fill)'
                  : 'The treated mash water'}
            </div>
            <p style={{ ...tokens.notice, marginTop: 0 }}>
              This is the water as treated, not the wort in the kettle.
            </p>

            <div style={{ ...tokens.statGrid, marginBottom: '0.5rem' }}>
              <StatBox value={num(mashPh.ph, 1)} label="Predicted mash pH (cooled sample)" />
            </div>
            {mashPh.outsideRange && (
              <p role="status" style={tokens.warning}>
                Outside {MASH_PH_RANGE.low}–{MASH_PH_RANGE.high}, the range for a cooled sample (Palmer &amp; Kaminski,
                Water, 2013).
              </p>
            )}
            {mashPh.testedRange.length > 0 && (
              <p role="status" style={tokens.warning}>
                {testedRangeNote(mashPh.testedRange)}
              </p>
            )}
            {mashPh.countedTwice && (
              <p role="status" style={tokens.warning}>
                Acidulated malt is in the grain bill and is the acid here too: it is counted twice.
              </p>
            )}
            <p style={tokens.notice}>
              Mash pH by Troester's model (2009, braukaiser.com): each malt from its type and color, or its measured
              figure; the treated water's residual alkalinity; the mash water and grain as entered.
            </p>

            <div style={profileSectionLabel}>Mash Chemistry</div>
            <div style={tokens.statGrid}>
              {[['Ca', 'Calcium'], ['Mg', 'Magnesium']].map(([key, label]) => (
                <StatBox
                  key={key}
                  value={num(ions?.[key], 0)}
                  label={label}
                  sublabel={`tgt ${target[key]}`}
                  valueStyle={tileStyle(final?.match[key])}
                />
              ))}
              <StatBox
                value={final ? `${sign(final.residualAlkalinity)}${num(final.residualAlkalinity, 0)}` : '—'}
                label="Residual Alk"
                sublabel={`tgt ${sign(target.RA)}${target.RA}`}
                valueStyle={tileStyle(final?.match.residualAlkalinity)}
              />
              <StatBox
                value={num(ions?.Alk, 0)}
                label="Total Alkalinity"
                sublabel={`tgt ${target.Alk}`}
                valueStyle={tileStyle(final?.match.Alk)}
              />
            </div>

            <div style={{ ...profileSectionLabel, marginTop: '1rem' }}>Flavor</div>
            <div style={tokens.statGrid}>
              {[['SO4', 'Sulfate'], ['Cl', 'Chloride'], ['Na', 'Sodium']].map(([key, label]) => (
                <StatBox
                  key={key}
                  value={num(ions?.[key], 0)}
                  label={label}
                  sublabel={`tgt ${target[key]}`}
                  valueStyle={tileStyle(final?.match[key])}
                />
              ))}
              <StatBox
                value={final ? (Number.isFinite(final.ratio) ? num(final.ratio, 2) : '∞') : '—'}
                label="SO₄:Cl Ratio"
                sublabel={`tgt ${style.so4_cl_target.toFixed(2)}`}
                valueStyle={tileStyle(final?.match.ratio)}
              />
            </div>

            <p style={tokens.notice}>RA per Kolbach (1953): Alk − (Ca/1.4 + Mg/1.7), all as CaCO₃.</p>
          </Card>

          {figures.kettle && (
            <Card>
              <div style={tokens.cardLabel}>Kettle Water</div>
              <div style={tokens.cardTitle}>{KETTLE_LABEL}</div>
              <p style={{ ...tokens.notice, marginTop: 0 }}>{KETTLE_CAVEAT}</p>
              <p style={{ ...tokens.notice, marginTop: 0 }}>{KETTLE_ASSUMPTION[figures.setup.spargeMethod]}</p>
              <div style={tokens.statGrid}>
                {[['Ca', 'Calcium'], ['Mg', 'Magnesium'], ['Na', 'Sodium'], ['SO4', 'Sulfate'], ['Cl', 'Chloride']].map(
                  ([key, label]) => (
                    <StatBox
                      key={key}
                      value={num(kettleIons?.[key], 0)}
                      label={label}
                      sublabel={`tgt ${target[key]}`}
                      valueStyle={tileStyle(kettleProfile?.match[key])}
                    />
                  ),
                )}
                <StatBox
                  value={
                    kettleProfile ? (Number.isFinite(kettleProfile.ratio) ? num(kettleProfile.ratio, 2) : '∞') : '—'
                  }
                  label="SO₄:Cl Ratio"
                  sublabel={`tgt ${style.so4_cl_target.toFixed(2)}`}
                  valueStyle={tileStyle(kettleProfile?.match.ratio)}
                />
              </div>
              <p style={tokens.notice}>The boil concentrates each figure by the pre-boil ÷ post-boil volume.</p>
              {figures.setup.spargeMethod !== 'none' && <p style={tokens.notice}>{KETTLE_BIAS_NOTE}</p>}
              {figures.kettle.held && (
                <p role="status" style={tokens.warning}>
                  {KETTLE_HELD_NOTE}
                </p>
              )}
              <p style={tokens.notice}>
                A kettle sample may read lower in calcium and higher in magnesium: calcium partly reacts with the
                malt's phosphate, and the malt adds its own magnesium.
              </p>
            </Card>
          )}
        </>
      )}
    </>
  );
}

// One acid's row: the primary (a picker, and in the one-acid card the
// reason line and "rec X" hint) or a secondary (its name, and a hint of its
// mEq and the recommendation's). Acidulated malt shows oz or lb; the amount
// stays in grams.
function AcidRow({ row, mode, onChangeAmount, primary = false, single = false, primaryAcidType, onSetPrimaryAcid, reason }) {
  const solid = row.solid;
  const unit = solid ? acidMaltUnit(mode) : liquidAcidUnit(mode);

  // Liquid acid in whole mL; acidulated malt to 0.01 oz or lb.
  const shown = (v) => (solid ? acidMaltFromCanonical(v, mode) : v);
  const digits = solid ? 2 : 0;
  const format = (v) => (Number.isFinite(v) ? shown(v).toFixed(digits) : '');
  const parse = (raw) => {
    const v = parseFloat(raw);
    const amount = isNaN(v) || v < 0 ? 0 : v;
    return solid ? acidMaltToCanonical(amount, mode) : amount;
  };

  const isOverridden = Math.abs(row.amount - row.recommended) > 1e-6;
  const hintText = single
    ? `rec ${num(shown(row.recommended), digits)} ${unit}`
    : `${num(row.meq, 1)} mEq · rec ${num(row.recommendedMeq, 1)}`;

  return (
    <div style={editableRowStyle}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {primary ? (
          <select
            value={primaryAcidType}
            onChange={(e) => onSetPrimaryAcid(e.target.value)}
            style={{ ...tokens.select, marginBottom: '0.2rem' }}
          >
            {ACID_KEYS.map((k) => (
              <option key={k} value={k}>
                {ACIDS[k].name}
              </option>
            ))}
          </select>
        ) : (
          <div style={recipeNameStyle}>{row.name}</div>
        )}
        {reason && <div style={recipeReasonStyle}>{reason}</div>}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end' }}>
          <DraftInput
            key={`${row.key}-${mode}`}
            initialValue={row.amount}
            format={format}
            parse={parse}
            onChange={onChangeAmount}
            style={{
              ...tokens.numberInput,
              width: '90px',
              background: isOverridden ? colors.inputBgOverride : colors.inputBg,
            }}
          />
          <span style={unitLabelStyle}>{unit}</span>
        </div>
        <div style={hintStyle}>{hintText}</div>
      </div>
    </div>
  );
}

const editableRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: '0.85rem 0',
  borderBottom: `1px solid ${colors.rowDivider}`,
  gap: '0.75rem',
};

const recipeNameStyle = {
  fontSize: '0.95rem',
  fontWeight: 600,
  color: colors.textPrimary,
};

const recipeReasonStyle = {
  fontSize: '0.78rem',
  color: colors.textMuted,
  marginTop: '0.2rem',
};

const hintStyle = {
  fontSize: '0.72rem',
  color: colors.textMuted,
  marginTop: '0.2rem',
  fontStyle: 'italic',
};

const unitLabelStyle = {
  fontSize: '0.78rem',
  color: colors.textMuted,
};

const profileSectionLabel = {
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: colors.textMuted,
  marginBottom: '0.5rem',
};

const subsectionHeaderStyle = {
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: colors.textMuted,
  marginTop: '0.4rem',
  marginBottom: '0.2rem',
};

const totalRowStyle = {
  fontSize: '1rem',
  fontWeight: 700,
  color: colors.textPrimary,
  padding: '0.75rem 0 0.25rem',
  textAlign: 'right',
};

const saltGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '0.5rem 1rem',
};

const saltCheckStyle = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '0.82rem',
  color: colors.textPrimary,
  cursor: 'pointer',
};

const multiToggleStyle = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '0.78rem',
  color: colors.textSecondary,
  cursor: 'pointer',
};

const whereStyle = {
  fontSize: '0.82rem',
  color: colors.textSecondary,
  marginTop: '0.2rem',
};

const resetButtonStyle = {
  background: 'transparent',
  border: `1px solid ${colors.border}`,
  color: colors.textSecondary,
  padding: '0.4rem 0.7rem',
  borderRadius: radii.btn,
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  cursor: 'pointer',
  fontFamily: 'inherit',
};
