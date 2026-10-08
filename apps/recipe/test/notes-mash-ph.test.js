// notes-mash-ph.test.js
// Scenario for the roadmap item "Water Notes still say mash pH is not
// predicted" (S10 item 1, Tier C), with the review's fixes (2026-10-08,
// agreed by the owner) and the roadmap item "Water Notes say the acid
// neutralizes alkalinity toward the style" (Tier C) folded in. Since S5 and
// S5b the Water tab predicts the mash pH of a cooled sample from the grain
// bill (Troester's model), and since S9 the acid is aimed at the recipe's
// target mash pH, falling back to the style's alkalinity only while the pH
// cannot be predicted. The Notes say so:
// - the opening line and the last Application Assumption describe the salts
//   and the acid as they are now;
// - Scope & Limitations says the mash pH is predicted, that the model was
//   tested on a limited range and that beyond it the tab still shows the
//   prediction with a note, and, as a separate warning, the range for a
//   cooled sample; it never says every prediction is inside the tested range;
// - the Features list describes the acid as aimed at the target mash pH.
// The rest of the Notes stay word for word (water-tab.test.js,
// notes-wording.test.js). The Notes name no figure of either range.
// Rendered to markup with react-dom/server, as notes-wording.test.js does.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const notes = async () => {
  const { default: NotesScreen } = await import('../src/components/water/NotesScreen.jsx');
  return renderToStaticMarkup(createElement(NotesScreen))
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/ ([.,;:])/g, '$1');
};

describe('water notes say the mash pH is predicted', () => {
  it("the Notes say the Water tab predicts the mash pH of a cooled sample from the grain bill and aims the acid at the recipe's target mash pH, and what it shows beyond the range the model was tested on", async () => {
    const t = await notes();

    // The opening line: the salts toward the ion profile, the acid at the mash pH.
    expect(t).toContain(
      "This calculator computes salt additions to move source water toward a target ion profile, and an acid dose aimed at the recipe's target mash pH.",
    );

    // Scope & Limitations: what the tab predicts, from what, and its limits.
    expect(t).toContain("Mash pH is predicted from the recipe's grain bill.");
    expect(t).toContain("The Water tab estimates the mash pH of a cooled sample with Troester's model (2009, braukaiser.com)");
    expect(t).toContain(
      'The model was tested on a limited range of water and mash thickness; beyond it the tab still shows the prediction and aims the acid at it, with a note naming the limit crossed.',
    );
    expect(t).toContain('Separately, the tab warns when the predicted mash pH is outside the usual range for a cooled sample.');

    // The Features list: the acid as it is aimed now.
    expect(t).toContain('What the Water tab does:');
    expect(t).toContain(
      "Recommend an acid dose that brings the predicted mash pH to the recipe's target, or, while the mash pH cannot be predicted, takes the water to the style's alkalinity",
    );

    // The last Application Assumption.
    expect(t).toContain(
      "This application calculates salt additions to reach a target ion profile and an acid dose aimed at the recipe's target mash pH, and predicts the mash pH of a cooled sample from the grain bill.",
    );
    expect(t).toContain('All outputs are process guidance and should be verified against direct analytical testing and pH measurement before production use.');

    // What was untrue is gone.
    expect(t).not.toContain('not predicted');
    expect(t).not.toContain('does not predict mash pH');
    expect(t).not.toContain('requires grain bill data');
    expect(t).not.toContain('water program step 5');
    expect(t).not.toContain('Kaiser');
    expect(t).not.toContain('within the range the model was tested on');
    expect(t).not.toContain('neutralize excess alkalinity');
    expect(t).not.toContain('does do');
    expect(t).not.toContain('salt and acid additions to reach a target ion profile');
    expect(t).not.toContain('salt additions and acid dose to move source water');
  });
});
