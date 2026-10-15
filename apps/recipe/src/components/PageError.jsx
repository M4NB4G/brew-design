// PageError.jsx
// Page keeps working after an error (docs/items/page-keeps-working-after-error.md,
// PE-S1, PE-S2, PE-Q1, PE-Q2): an error while a tab or the References page is
// drawn shows, in its place, a short message with a Reload button and a line
// on Export and Reset. It sits below the header, so Export, Import, Reset,
// Print and the unit and tab choices keep working; it writes nothing, so the
// saved recipe and the brewery's figures stay as they were (PE-S4).
//
// React catches an error while drawing only in a class component (an error
// boundary). The message clears, and the content is drawn again, when any of
// `resetKeys` changes after the error: another tab, Reset or an import (a new
// recipe), a unit choice (K, ordering).
//
// A second catch, `whole`, sits around the whole app where main.jsx draws it
// (docs/items/error-outside-the-tabs.md, EO-S1, EO-S2, EO-Q1): an error in the
// stats bar, the line under it, the header, the footer or the printed sheet,
// or in the figures the app works out before drawing, shows the same message
// and Reload in place of the whole page. The header is gone with it, so the
// line on Export and Reset is left out; it has no keys and clears only on
// Reload. An error in a tab reaches the catch below the header first.
//
// When the saved recipe itself causes that error, every Reload shows it again,
// so the whole-page message offers a way out of its own
// (docs/items/way-out-of-page-error.md, NW-S1 to NW-S4): "Export saved recipe"
// downloads the saved recipe exactly as storage holds it, readable or not,
// and changes nothing; "Start a new recipe" asks, removes only the saved
// recipe and reloads, and the load starts a new recipe from the brewery's
// figures (loadStartingState), as Reset to defaults does. With no saved
// recipe, or no storage, Export saved recipe is not offered.
import { Component } from 'react';
import { STORAGE_KEY, clearPersisted, recipeFileName } from '../persistence.js';
import { colors, radii, shadows, tokens } from './shared/styles.js';

// window.localStorage itself can throw when storage is blocked; treat that as
// no storage, as App.jsx does.
function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// The saved recipe as storage holds it, or null with none (or no storage).
function savedRecipeText() {
  try {
    return browserStorage()?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

// The saved recipe's name where its text can be read, else none, so the file
// gets the name a nameless recipe gets.
function savedRecipeName(text) {
  try {
    const name = JSON.parse(text)?.recipe?.name;
    return typeof name === 'string' ? name : '';
  } catch {
    return '';
  }
}

// NW-S2: the stored text, byte for byte, handed to the browser as a download.
// Reads only.
function exportSavedRecipe() {
  const text = savedRecipeText();
  if (text === null) return;
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = recipeFileName(savedRecipeName(text), new Date());
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url));
}

// NW-S3: on yes, the saved recipe is removed before the page is drawn again,
// so the new draw cannot read it; the brewery's figures, My ingredients and
// the banner's "Not now" are other keys and stay. A removal that fails
// changes nothing, and the reload draws the page again as Reload would.
function startNewRecipe() {
  if (
    !window.confirm(
      "Start a new recipe? The saved recipe will be removed; your brewery's figures and My ingredients are kept.",
    )
  ) {
    return;
  }
  clearPersisted(browserStorage());
  window.location.reload();
}

export default class PageError extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(prevProps, prevState) {
    // Only once the message is already shown: the update that drew it first
    // still carries the keys from before the error.
    if (!this.state.failed || !prevState.failed) return;
    const before = prevProps.resetKeys ?? [];
    const now = this.props.resetKeys ?? [];
    if (before.length !== now.length || before.some((k, i) => !Object.is(k, now[i]))) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const { whole } = this.props;
    const reload = (
      <button type="button" onClick={() => window.location.reload()} style={buttonStyle}>
        Reload
      </button>
    );
    const card = (
      <div role="alert" style={cardStyle}>
        <p style={{ margin: whole ? '0 0 0.9rem' : 0, fontWeight: 600, color: colors.textPrimary }}>
          Something went wrong drawing this page. Your saved recipe is kept as it was.
        </p>
        {!whole && (
          <p style={{ ...tokens.notice, fontStyle: 'normal', margin: '0.5rem 0 0.9rem' }}>
            Export in the header saves a copy, and Reset to defaults starts a new recipe.
          </p>
        )}
        {/* FLAG: with no saved recipe the line still names Export saved recipe,
            which is not offered then: NW-S1 gives the message the line and
            NW-S4 takes away only the button (way-out-of-page-error.md,
            builder's notes). */}
        {whole && (
          <p style={{ ...tokens.notice, fontStyle: 'normal', margin: '0 0 0.9rem' }}>
            Export saved recipe keeps a copy; Start a new recipe replaces it.
          </p>
        )}
        {whole ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {reload}
            {savedRecipeText() !== null && (
              <button type="button" onClick={exportSavedRecipe} style={buttonStyle}>
                Export saved recipe
              </button>
            )}
            <button type="button" onClick={startNewRecipe} style={buttonStyle}>
              Start a new recipe
            </button>
          </div>
        ) : (
          reload
        )}
      </div>
    );
    // In place of the whole page, the card sits where the page's content would.
    return whole ? <main style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem 1.25rem' }}>{card}</main> : card;
  }
}

const cardStyle = {
  background: colors.cardBg,
  borderRadius: radii.card,
  padding: '1.25rem 1.1rem',
  marginBottom: '1rem',
  boxShadow: shadows.card,
};

const buttonStyle = {
  padding: '0.45rem 1rem',
  background: 'transparent',
  border: `1px solid ${colors.inputBorder}`,
  borderRadius: radii.btn,
  color: colors.textPrimary,
  fontSize: '0.9rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
