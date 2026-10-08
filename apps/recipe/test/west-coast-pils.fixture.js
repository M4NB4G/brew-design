// west-coast-pils.fixture.js
// The owner's West Coast Pilsner, the recipe the acid's doses are worked by
// hand on (docs/items/mash-ph-acid.md's case): 20 lb of base malt, 8 gal of
// mash water, the example report, Pilsner / Light Lager, the tank treated at
// 14 gal and topped up to 12, fly sparge 10 gal, kettle salts on, the salts
// as recommended, 75 % phosphoric as the acid. The same recipe as
// acid-in-mash.test.js's (the roadmap's "One West Coast Pilsner for the acid
// tests" moves the other copies here).

import { ACIDS } from '@brew/engine';
import { defaultRecipeState } from '../src/state.js';
import { defaultWaterState, EXAMPLE_SOURCE } from '../src/water-state.js';

const malt = (name, weightLb, colorL) => ({
  name,
  weightLb,
  fgdb: 0.8,
  colorL,
  type: 'base',
  distilledWaterPh: NaN,
  acidityMeqPerKg: NaN,
  pricePerLb: NaN,
});
const noAcid = () => Object.fromEntries(Object.keys(ACIDS).map((k) => [k, 0]));

// `acidPlace` 'mash' or 'salts' (left out: the recipe's default); `acidMl`
// the brewer's own dose of 75 % phosphoric (null follows the recommendation).
export const wcPils = ({ acidPlace, acidMl = null, treatment = 'tank' } = {}) => ({
  ...defaultRecipeState(),
  name: 'Home Grown WC Pils',
  malts: [malt('Pilsner Northstar', 12, 2), malt('Pilsner Weyermann', 7, 1.8), malt('Carafoam', 1, 2)],
  mashWaterGal: 8,
  water: {
    ...defaultWaterState(),
    source: { ...EXAMPLE_SOURCE },
    styleId: 'pilsner',
    primaryAcid: 'phosphoric_75',
    treatment,
    tankTreatedGal: 14,
    tankTopUpGal: 12,
    spargeMethod: 'fly',
    spargeGal: 10,
    kettleSalts: true,
    ...(acidPlace === undefined ? {} : { acidPlace }),
    acidAmounts: acidMl === null ? null : { ...noAcid(), phosphoric_75: acidMl },
  },
});

// By hand (as acid-in-mash.test.js works it). The acid brings the predicted
// mash pH to the target, 5.4. The salts bring calcium and magnesium to 50
// and 10 and add no alkalinity. Mash pH: grist 5.74171 (12 x 5.738 + 7 x
// 5.7486 + 5.738, over 20); R 3.33816450378314 L/kg; slope
// 0.0563961385491808; acid slope 0.0706253181215894; hardness -(50 / 1.4 +
// 10 / 1.7) / 50.04 = -0.831267758902122 mEq/L; at zero alkalinity 5.74171 -
// 0.0563961385491808 x 0.831267758902122 = 5.69482970829749. The alkalinity
// 5.4 needs is (5.4 - 5.69482970829749) / 0.0706253181215894 x 50.04 =
// -208.895039280488 mg/L; from the report's 50, 258.895039280488 mg/L to
// take out, 5.17376177618880 mEq/L.
// 75 % phosphoric: 1.579 g/mL x 0.75 x 1000 / 97.99 = 12.0854168792734 mEq/mL.
//   Into the mash, for the 8 gal of mash water (8 x 3.785411784 =
//   30.283294272 L): 156.678550361551 mEq = 12.9642652733193 mL.
//   With the salts, for the tank's 14 gal (52.995764976 L):
//   274.187463132714 mEq = 22.6874642283088 mL.
export const MASH_REC_ML = 12.9642652733193;
export const TANK_REC_ML = 22.6874642283088;
