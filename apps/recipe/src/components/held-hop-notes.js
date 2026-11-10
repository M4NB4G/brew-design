// held-hop-notes.js
// The line for each kettle hop whose wort is cooler than the whirlpool
// factor's range (docs/items/whirlpool-hop-range.md, WH-S4): the Hops card
// and the printed hop schedule show the same lines. The engine decides which
// hops (each addition's `belowRange`) and holds the limit (WHIRLPOOL_RANGE_F);
// the line names the hop as the card does, with its minutes, and gives the
// limit in the header's temperature unit. Text only; it computes nothing.
import { WHIRLPOOL_RANGE_F } from '@brew/engine';
import { tempReadout, tempUnit } from '../display.js';
import { num } from '../format.js';
import { rowName } from './shared/rowName.js';

export function heldHopNotes(kettleAdditions, hops, temperatureUnit) {
  const low = `${tempReadout(WHIRLPOOL_RANGE_F.low, temperatureUnit)} ${tempUnit(temperatureUnit)}`;
  return kettleAdditions.flatMap((a, i) => {
    if (!hops.additions[i]?.belowRange) return [];
    const minutes = Number.isFinite(a.timeMin) ? `, ${num(a.timeMin, 0)} min` : '';
    return [`${rowName(a, 'Kettle hop', i)}${minutes}: below ${low}, its bitterness is held at the ${low} figure.`];
  });
}
