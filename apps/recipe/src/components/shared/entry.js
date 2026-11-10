// entry.js
// What a Recipe-tab box that can refuse an entry (docs/items/impossible-
// entries.md, IE-S1 to IE-S3) asks of the page: `begin()` when the brewer
// starts typing in it, keeping the recipe as it is then, and `restore()` when
// an entry is refused, putting that recipe back, so a refused entry saves
// nothing, not even the figures typed on the way to it ("1" and "12" on the
// way to "120"), as the salt and acid boxes do (N-1a). The page (App.jsx)
// provides it; drawn alone, a box keeps none.
import { createContext } from 'react';

export const EntryContext = createContext({ begin() {}, restore() {} });

// The box's text is a figure still being typed, not one to save (K, Typing):
// a number box reports a minus sign alone, or "1e", as no figure while its
// text is not empty; "-0" is a minus sign on the way to a figure.
export const stillTyping = (input) =>
  (input.value === '' && input.validity?.badInput === true) || Object.is(Number(input.value), -0);
