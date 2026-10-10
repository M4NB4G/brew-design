// box-figures.fixture.js
// "A weight or volume box shows the printed sheet's precision while the cursor
// is elsewhere" (docs/items/boxes-and-access.md, BA1) changed what the malt
// weight, hop weight and volume boxes show: a Pro volume captured as
// "0.161290" bbl now shows "0.161". The earlier "nothing else changes"
// scenarios compare cards with captures made before it; they compare through
// this, so each captured box figure is set aside only where a box BA1 changed
// (named by BA1_BOX) now shows that same figure rounded (to at most three
// decimals), and every other byte,
// every other box figure included, is still compared. The captures are never
// re-made.
//
// Takes the captured HTML and the HTML drawn now (or objects of cards' HTML by
// name, as withoutBoxNames does); returns the captured HTML with each such box
// figure, and each such greyed figure in an empty box, written as it is drawn
// now. Boxes are paired in page order; a figure that is not the captured one
// rounded is left as captured, so the comparison fails on it.

// The boxes BA1 changed, by the name a screen reader reads: the malt and hop
// weights, the Volumes card's and My brewery's volumes, and the Water tab's.
export const BA1_BOX =
  /^(Weight|Wt) \(|^(Mash water|Pre-boil volume|Boil-off rate|Fermentation volume|Batch \(fermentation\) volume|Treated volume|Top-up level) \(|^(Sparge water|Treated volume|Top-up level) (gal|bbl)$/;

const decimals = (s) => (s.split('.')[1] ?? '').length;

function roundsTo(captured, drawn) {
  if (drawn === undefined || captured === drawn || captured === '' || drawn === '') return false;
  const d = decimals(drawn);
  return d <= 3 && decimals(captured) > d && Number(Number(captured).toFixed(d)) === Number(drawn);
}

const INPUT = /<input\b[^>]*>/g;
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

// One attribute, `value` or `placeholder` (My brewery's greyed figure).
function asDrawn(captured, drawnNow, name) {
  const drawn = [...drawnNow.matchAll(INPUT)]
    .map(([tag]) => ({ figure: attr(tag, name), ba1: BA1_BOX.test(attr(tag, 'aria-label') ?? '') }))
    .filter((box) => box.figure !== undefined);
  let i = 0;
  return captured.replace(new RegExp(`(<input\\b[^>]*?\\b${name}=")([^"]*)(")`, 'g'), (all, open, figure, close) => {
    const now = drawn[i++];
    return open + (now?.ba1 && roundsTo(figure, now.figure) ? now.figure : figure) + close;
  });
}

export function withBoxFiguresAsDrawn(captured, drawnNow) {
  if (typeof captured !== 'string') {
    return Object.fromEntries(Object.entries(captured).map(([card, markup]) => [card, withBoxFiguresAsDrawn(markup, drawnNow[card] ?? '')]));
  }
  return asDrawn(asDrawn(captured, drawnNow, 'value'), drawnNow, 'placeholder');
}
