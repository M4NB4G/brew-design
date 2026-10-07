// IngredientSearch.jsx
// The name box of a malt, boil-hop or dry-hop row: free text, with the owner's
// ingredient list suggested as the brewer types. Typing writes the name only;
// picking a suggestion (tap, click, or arrows + Enter) copies that
// ingredient's numbers into the row. Escape closes the list.
//
// My ingredients (docs/items/my-ingredients.md): the brewer's own malts and
// hops come first, marked "yours" (MI-S3). Under a malt or boil-hop name that
// is not on the owner's list, the last line offers "Save to my ingredients"
// with the numbers it would keep (MI-S1); for a name on the list, or a blank
// FGDB, colour or alpha, it says why it cannot (MI-S4, MI-Q3). What a save
// did is said under the box until the name is next typed. The app hands down
// the brewer's list and the save through MyIngredientsContext.
//
// The tables sit in sideways-scrolling boxes that clip their children, so the
// list is fixed-positioned from the box's on-screen rectangle and follows it
// on scroll and resize.
import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { colors, radii, shadows } from './shared/styles.js';
import { searchIngredients, suggestionDetail, pickIngredient, typeName, saveOffer } from '../ingredient-search.js';

// My ingredients as the app holds them, `{ malts, hops }`, and its save:
// onSave(field, row) -> { kept, message }, or null when nothing was saved.
// Without a provider the boxes offer the owner's list alone.
export const MyIngredientsContext = createContext({ mine: null, onSave: null });

const INPUT = {
  width: '100%',
  border: `1px solid ${colors.inputBorder}`,
  borderRadius: radii.input,
  padding: '0.4rem 0.55rem',
  fontSize: '0.92rem',
  fontFamily: 'inherit',
  color: colors.textPrimary,
  background: colors.inputBg,
};

// Where the list goes: under the box, at least its width, kept inside the
// window; above the box when there is little room below.
function listPlacement(rect) {
  const gap = 4;
  const edge = 8;
  const width = Math.min(Math.max(rect.width, 260), window.innerWidth - 2 * edge);
  const left = Math.max(edge, Math.min(rect.left, window.innerWidth - width - edge));
  const below = window.innerHeight - rect.bottom - gap - edge;
  const above = rect.top - gap - edge;
  if (below >= 160 || below >= above) {
    return { left, width, top: rect.bottom + gap, maxHeight: Math.min(280, below) };
  }
  return { left, width, bottom: window.innerHeight - rect.top + gap, maxHeight: Math.min(280, above) };
}

export default function IngredientSearch({ field, row, index, setRow, label }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [place, setPlace] = useState(null);
  const [said, setSaid] = useState(null); // what the last save did: { kept, message }
  const inputRef = useRef(null);
  const listId = useId();
  const { mine, onSave } = useContext(MyIngredientsContext);

  const suggestions = searchIngredients(field, row.name, mine);
  const offer = onSave ? saveOffer(field, row, mine) : null;
  // The save line is chosen as a suggestion is, after the last one.
  const saveAt = offer?.entry ? suggestions.length : -1;
  const last = saveAt === -1 ? suggestions.length - 1 : saveAt;
  const showing = open && (suggestions.length > 0 || offer !== null);

  // Write each key the new row changes, through the app's one-key row setter.
  const apply = (next) => {
    for (const key of Object.keys(next)) {
      if (!Object.is(next[key], row[key])) setRow(field, index, key, next[key]);
    }
  };

  const pick = (item) => {
    apply(pickIngredient(field, row, item));
    setOpen(false);
    setActive(-1);
  };

  const save = () => {
    setOpen(false);
    setActive(-1);
    setSaid(onSave(field, row));
  };

  // Place the list, and keep it on the box while anything scrolls or resizes.
  useLayoutEffect(() => {
    if (!showing) return undefined;
    const update = () => setPlace(listPlacement(inputRef.current.getBoundingClientRect()));
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [showing]);

  // Keep the highlighted suggestion in view while arrowing through the list.
  useEffect(() => {
    if (active >= 0) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, listId]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      setActive((a) => Math.min(a + 1, last));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      if (showing && active >= 0 && active < suggestions.length) {
        e.preventDefault();
        pick(suggestions[active]);
      } else if (showing && active === saveAt) {
        e.preventDefault();
        save();
      }
    } else if (e.key === 'Escape') {
      if (showing) e.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        value={row.name}
        aria-label={label}
        placeholder="Type to search"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showing}
        aria-controls={listId}
        aria-activedescendant={showing && active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => {
          apply(typeName(row, e.target.value));
          setOpen(true);
          setActive(-1);
          setSaid(null);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => {
          setOpen(false);
          setActive(-1);
        }}
        style={INPUT}
      />
      {showing && place && (
        <ul
          id={listId}
          role="listbox"
          // Keep focus in the box while the list is pressed or scrolled.
          onMouseDown={(e) => e.preventDefault()}
          style={{
            position: 'fixed',
            left: place.left,
            width: place.width,
            top: place.top,
            bottom: place.bottom,
            maxHeight: place.maxHeight,
            overflowY: 'auto',
            zIndex: 20,
            margin: 0,
            padding: '0.25rem 0',
            listStyle: 'none',
            background: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: radii.input,
            boxShadow: shadows.card,
          }}
        >
          {suggestions.map((item, i) => {
            const detail = suggestionDetail(field, item);
            return (
              <li
                key={`${item.yours ? 'yours' : 'list'}:${item.name}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onClick={() => pick(item)}
                onMouseEnter={() => setActive(i)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  padding: '0.45rem 0.7rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: colors.textPrimary,
                  background: i === active ? colors.noticeBg : 'transparent',
                }}
              >
                <span>
                  {item.name}
                  {item.yours && <span style={yoursStyle}>yours</span>}
                </span>
                {detail && (
                  <span
                    style={{
                      color: colors.textSecondary,
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {detail}
                  </span>
                )}
              </li>
            );
          })}
          {offer?.entry && (
            <li
              id={`${listId}-${saveAt}`}
              role="option"
              aria-selected={active === saveAt}
              onClick={save}
              onMouseEnter={() => setActive(saveAt)}
              style={{
                ...saveLineStyle,
                cursor: 'pointer',
                background: active === saveAt ? colors.noticeBg : 'transparent',
              }}
            >
              <span style={{ fontWeight: 600, color: colors.textNotice }}>Save to my ingredients</span>
              <span style={{ display: 'block', color: colors.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
                {offer.detail}
              </span>
            </li>
          )}
          {offer?.refused && (
            <li role="option" aria-disabled="true" aria-selected={false} style={{ ...saveLineStyle, color: colors.textMuted }}>
              {offer.refused}
            </li>
          )}
        </ul>
      )}
      {said && (
        <div role="status" style={{ ...saidStyle, color: said.kept ? colors.textSecondary : colors.textWarn }}>
          {said.message}
        </div>
      )}
    </>
  );
}

const yoursStyle = { marginLeft: '0.45rem', fontSize: '0.72rem', fontWeight: 600, color: colors.textMuted };
const saveLineStyle = {
  padding: '0.45rem 0.7rem',
  fontSize: '0.85rem',
  borderTop: `1px solid ${colors.rowDivider}`,
};
const saidStyle = { fontSize: '0.75rem', marginTop: '0.2rem', lineHeight: 1.3 };
