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
import { Component } from 'react';
import { colors, radii, shadows, tokens } from './shared/styles.js';

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
    const before = prevProps.resetKeys;
    const now = this.props.resetKeys;
    if (before.length !== now.length || before.some((k, i) => !Object.is(k, now[i]))) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" style={cardStyle}>
        <p style={{ margin: 0, fontWeight: 600, color: colors.textPrimary }}>
          Something went wrong drawing this page. Your saved recipe is kept as it was.
        </p>
        <p style={{ ...tokens.notice, fontStyle: 'normal', margin: '0.5rem 0 0.9rem' }}>
          Export in the header saves a copy, and Reset to defaults starts a new recipe.
        </p>
        <button type="button" onClick={() => window.location.reload()} style={buttonStyle}>
          Reload
        </button>
      </div>
    );
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
