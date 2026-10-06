// economics.js
// Cost rollup only. No prices are shipped; all prices come from the caller.
// Margin, break-even, and revenue are out of scope for this phase.

/**
 * Sum line-item costs.
 * lineItems: [{ label, quantity, unitPrice }]
 * -> { items: [{ label, quantity, unitPrice, cost }], total }
 */
export function rollupCost(lineItems) {
  const items = lineItems.map((li) => ({
    ...li,
    cost: li.quantity * li.unitPrice,
  }));
  const total = items.reduce((s, i) => s + i.cost, 0);
  return { items, total };
}

/**
 * Cost per unit of output. A batch size that is zero, negative or not a
 * number gives no cost per unit: NaN (blank), never 0, which would be a
 * figure nobody entered (cost of a batch, EC-S4, EC-Q3).
 */
export function costPerUnit(total, batchSize) {
  if (!(batchSize > 0)) return NaN;
  return total / batchSize;
}
