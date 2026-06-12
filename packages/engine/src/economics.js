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
 * Cost per unit of output. Guards a non-positive batch size by returning 0
 * rather than dividing by zero.
 */
export function costPerUnit(total, batchSize) {
  if (batchSize <= 0) return 0;
  return total / batchSize;
}
