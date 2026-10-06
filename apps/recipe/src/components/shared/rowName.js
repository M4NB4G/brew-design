// A table row's name for a screen reader (guard-rails item 3, F-Q5): the name
// the brewer typed, else its place in the table as the empty-fields line
// names it ("Malt 1"). Text only; no figure reads it.
export function rowName(row, kind, index) {
  return String(row?.name ?? '').trim() || `${kind} ${index + 1}`;
}
