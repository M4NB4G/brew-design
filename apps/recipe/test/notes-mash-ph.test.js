// notes-mash-ph.test.js
// Scenario for the roadmap item "Water Notes still say mash pH is not
// predicted" (S10 item 1, Tier C). Since S5 and S5b the Water tab predicts the
// mash pH of a cooled sample from the grain bill (Troester's model), with
// warnings outside its tested range, so the Notes' Scope & Limitations and
// the last Application Assumption must say so and no longer say it is not
// predicted. Only those two passages change; the rest of the Notes stay word
// for word (water-tab.test.js, notes-wording.test.js).
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
  it('Scope & Limitations and the last assumption say the Water tab predicts the mash pH of a cooled sample from the grain bill, within the range tested, and no longer say it is not predicted', async () => {
    const t = await notes();

    // Scope & Limitations: what the tab predicts, from what, and its limit.
    expect(t).toContain("Mash pH is predicted from the recipe's grain bill.");
    expect(t).toContain("The Water tab estimates the mash pH of a cooled sample with Troester's model (2009, braukaiser.com)");
    expect(t).toContain("It is an estimate within the range the model was tested on");
    expect(t).toContain("the tab warns when the water's residual alkalinity or the mash thickness is beyond that range");

    // The last Application Assumption.
    expect(t).toContain(
      'This application calculates salt and acid additions to reach a target ion profile, and predicts the mash pH of a cooled sample from the grain bill, within the range the model was tested on.',
    );
    expect(t).toContain('All outputs are process guidance and should be verified against direct analytical testing and pH measurement before production use.');

    // What was untrue is gone.
    expect(t).not.toContain('not predicted');
    expect(t).not.toContain('does not predict mash pH');
    expect(t).not.toContain('requires grain bill data');
    expect(t).not.toContain('water program step 5');
    expect(t).not.toContain('Kaiser');
  });
});
