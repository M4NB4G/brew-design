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
import { useEffect, useState } from 'react';
import { SALT_CONTRIBUTIONS_PER_G_GAL, ACIDS } from '@brew/engine';
import Card from '../shared/Card.jsx';
import StatBox from '../shared/StatBox.jsx';
import InputRow from '../shared/InputRow.jsx';
import { colors, radii, tokens } from '../shared/styles.js';
import {
  volumeToCanonical,
  volumeFromCanonical,
  volumeUnit,
  saltUnit,
  liquidAcidUnit,
  acidMaltUnit,
  acidMaltFromCanonical,
  acidMaltToCanonical,
} from '../../display.js';
import { num, roundForInput } from '../../format.js';
import {
  setWaterVolume,
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

export default function SaltsAcidScreen({ water, figures, mode, setWater }) {
  const { style, target, salts, raiseSalt, acid, final } = figures;

  // Grams: whole in Pro, one decimal at Home (the water app's precision).
  const gramDigits = mode === 'pro' ? 0 : 1;
  const formatGrams = (g) => (Number.isFinite(g) ? g.toFixed(gramDigits) : '');
  const parseGrams = (s) => {
    const v = parseFloat(s);
    return isNaN(v) || v < 0 ? null : v;
  };

  const volumeShown = Number.isFinite(water.volumeGal)
    ? roundForInput(volumeFromCanonical(water.volumeGal, mode))
    : '';

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

  return (
    <>
      <Card>
        <div style={tokens.cardLabel}>Mash Volume</div>
        <InputRow
          label="Volume"
          unit={volumeUnit(mode)}
          value={volumeShown}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            setWater((w) => setWaterVolume(w, Number.isNaN(v) ? NaN : volumeToCanonical(v, mode)));
          }}
          step={0.1}
          min={0}
        />
      </Card>

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

          <Card>
            <div style={tokens.cardLabel}>Predicted Final Profile</div>

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
