// volumes-card-rows.js
// The Volumes card's rows, top to bottom, in its three parts (Mash, Boil,
// Ferment: the phone's one column), read by the card (VolumesSection.jsx) to
// draw them and by the line under the stats bar (empty-fields.js) to name the
// empty boxes in the same order (docs/items/volumes-card-one-list.md, VO-S1
// to VO-S3). A row moved here moves on the card and in the line together.
//
// Each row is a `key` the card draws it by; a box the brewer types in also
// has its `name`, as the line names it when empty (the worked-out figures,
// the warnings and the check have none). `waterBack: true` is a row shown
// only with water back on, `false` only with it off; without it, always.
// The same box can sit in two places, one for each (the fermentation volume's
// measurement temperature). Layout and names only; no figure.

export const VOLUMES_CARD_ROWS = [
  {
    part: 'Mash',
    rows: [{ key: 'mashWater', name: 'Mash water' }, { key: 'mashRv' }, { key: 'mashR' }],
  },
  {
    part: 'Boil',
    rows: [
      { key: 'preBoilVolume', name: 'Pre-boil volume' },
      { key: 'preBoilTemp', name: 'Pre-boil measurement temperature' },
      { key: 'preBoilAtReference' },
      { key: 'boilOffRate', name: 'Boil-off rate' },
      { key: 'boilTime', name: 'Boil time' },
      // The post-boil volume is worked out, not entered: its temperature box
      // sits after it.
      { key: 'postBoilMeasured' },
      { key: 'postBoilAtReference' },
      { key: 'postBoilTemp', name: 'Post-boil measurement temperature' },
    ],
  },
  {
    part: 'Ferment',
    rows: [
      { key: 'fermentVolume', name: 'Fermentation volume', waterBack: false },
      { key: 'fermentTemp', name: 'Fermentation measurement temperature', waterBack: false },
      { key: 'fermentAtReference', waterBack: false },
      // With water back on (WF-S2): the box that was the fermentation volume
      // is the wort from kettle, then the water back, its temperature, and
      // the fermentation volume worked out, with its temperature under it.
      { key: 'wortFromKettle', name: 'Wort from kettle', waterBack: true },
      { key: 'lessWortWarning' },
      { key: 'waterBackCheck' },
      { key: 'waterBack', name: 'Water back', waterBack: true },
      { key: 'waterBackTemp', name: 'Water back measurement temperature', waterBack: true },
      { key: 'fermentWorkedOut', waterBack: true },
      { key: 'fermentTemp', name: 'Fermentation measurement temperature', waterBack: true },
      { key: 'pitchAtReference', waterBack: true },
      { key: 'knockOutOG', waterBack: true },
      { key: 'knockOutIBU', waterBack: true },
    ],
  },
];

/** The rows of `rows` the card shows with water back on or off. */
export const rowsShown = (rows, waterBackOn) =>
  rows.filter((row) => row.waterBack === undefined || row.waterBack === waterBackOn);
