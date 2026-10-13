// target-og-with-water-back.test.js
// Scenario for batch S15c item 2, "Design to target OG with water back on"
// (docs/items/target-og-with-water-back.md, TO-S1): the engine works back from
// the °P at pitch to the °P from the kettle by the same sugar balance the
// figures at pitch use (°P x SG x volume kept, SG by the engine's platoToSg;
// the wort from kettle and the water back each at 60 °F). Water back is not in
// Rev 4: every figure is worked by hand.
//
// The balance: °P_k x SG(°P_k) x V_k = °P_p x SG(°P_p) x (V_k + V_w), with
// SG(P) = 1 + P / (258.6 - (P / 258.2) x 227.1). With k = 227.1 / 258.2 and
// K = °P_p x SG(°P_p) x (V_k + V_w) / V_k, °P_k is the positive root of
// (1 - k) P^2 + (258.6 + kK) P - 258.6 K = 0.
//
// The owner's 400 gal from the kettle and 78 gal of water back (S15b's pin,
// read the other way): from 10.11768692132 °P at pitch,
//   SG(10.11768692132) = 1 + 10.11768692132 / (258.6 - 0.0391854 x 227.1) = 1.04051921174
//   K = 10.11768692132 x 1.04051921174 x 478 / 400 = 12.58053891
//   °P from the kettle = 12.0000000 (the 12 °P S15b started from)
// The built-in recipe, 5.5 gal from the kettle and 1 gal of water back, for an
// OG at pitch of 1.056:
//   °P at pitch = -616.868 + 1111.14 x 1.056 - 630.272 x 1.056^2 + 135.997 x 1.056^3 = 13.80468203
//   SG(13.80468203) = 1.05601229
//   K = 13.80468203 x 1.05601229 x 6.5 / 5.5 = 17.22844372
//   °P from the kettle = 16.15988322; OG from the kettle SG(16.15988322) = 1.06612427

import { describe, it, expect } from 'vitest';
import { knockOutPlato, computeWaterBack, platoToSg, sgToPlato } from '../src/index.js';

describe('the OG from the kettle for an OG at pitch (TO-S1)', () => {
  it('works back from the °P at pitch by the sugar balance', () => {
    expect(knockOutPlato({ plato: 10.11768692132, knockOutGal: 400, waterBackGal: 78 })).toBeCloseTo(12, 8);
    const p = knockOutPlato({ plato: sgToPlato(1.056), knockOutGal: 5.5, waterBackGal: 1 });
    expect(p).toBeCloseTo(16.15988322, 7);
    expect(platoToSg(p)).toBeCloseTo(1.06612427, 8);
  });

  it('is the forward balance read the other way', () => {
    const p = knockOutPlato({ plato: 13.80468203, knockOutGal: 5.5, waterBackGal: 1 });
    const forward = computeWaterBack({ knockOutGal: 5.5, waterBackGal: 1, plato: p, mcu: 0, ibu: 0, apparentAttenuation: 0.77 });
    expect(forward.plato).toBeCloseTo(13.80468203, 8);
  });

  it('no water back leaves the °P as it is; a blank volume blanks it', () => {
    expect(knockOutPlato({ plato: 12, knockOutGal: 5.5, waterBackGal: 0 })).toBeCloseTo(12, 10);
    expect(knockOutPlato({ plato: 12, knockOutGal: 5.5, waterBackGal: NaN })).toBeNaN();
    expect(knockOutPlato({ plato: 12, knockOutGal: NaN, waterBackGal: 1 })).toBeNaN();
  });
});
