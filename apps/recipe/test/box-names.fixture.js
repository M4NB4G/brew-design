// box-names.fixture.js
// "Every box has a name" (docs/items/guard-rails.md, item 3) added an
// aria-label to the number boxes, text boxes and choices the earlier
// "nothing else changes" scenarios drew before it. Those scenarios compare a
// card with a capture made before the names existed; they compare through
// this strip, applied to both sides, so only the box names are set aside and
// every other byte is still compared. The captures are never re-made.
// Takes a card's HTML, or an object of cards' HTML by name.
export function withoutBoxNames(html) {
  if (typeof html !== 'string') {
    return Object.fromEntries(Object.entries(html).map(([card, markup]) => [card, withoutBoxNames(markup)]));
  }
  return html.replace(/(<(?:input|select|textarea)\b[^>]*?) aria-label="[^"]*"/g, '$1');
}
