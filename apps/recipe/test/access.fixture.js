// access.fixture.js
// "The other accessibility findings" (docs/items/boxes-and-access.md, BA3)
// changed bytes the earlier "nothing else changes" scenarios compare: three
// greys darkened (BA3-S1), hidden "Remove" text in the remove columns'
// headers, each header cell positioned to hold it (BA3-S2), the wordmark a
// level-one heading in place of a block (BA3-S3), and the stats bar a named
// region (BA3-S4). Those scenarios compare through this,
// applied to both sides, which writes each of those changes back as it was
// and nothing else; the captures are never re-made. On a capture it changes
// nothing: none of what it looks for was there.
// Takes a page's or a card's HTML, or an object of cards' HTML by name; both
// static markup (`color:#536a85`) and a browser's (`color: rgb(83, 106, 133)`).

// Each grey as it is now, and as it was (styles.js before S14).
const GREYS = [
  ['#536a85', '#5a7390', 'rgb(83, 106, 133)', 'rgb(90, 115, 144)'], // textSecondary
  ['#586a81', '#7c8fa6', 'rgb(88, 106, 129)', 'rgb(124, 143, 166)'], // textMuted
  ['#5a6f88', '#9faec0', 'rgb(90, 111, 136)', 'rgb(159, 174, 192)'], // textFooter
];

export function withoutAccessChanges(html) {
  if (typeof html !== 'string') {
    return Object.fromEntries(Object.entries(html).map(([card, markup]) => [card, withoutAccessChanges(markup)]));
  }
  let out = html;
  for (const [hexNow, hexBefore, rgbNow, rgbBefore] of GREYS) {
    out = out.split(hexNow).join(hexBefore).split(rgbNow).join(rgbBefore);
  }
  return (
    out
      // BA3-S2: the hidden text in a remove column's header, and the
      // position: relative that keeps it inside the header.
      .replace(
        /<th style="([^"]*?)(;position:relative|; position: relative;)"><span style="position: ?absolute;[^"]*">Remove<\/span><\/th>/g,
        (all, style, kept) => `<th style="${style}${kept.startsWith('; ') ? ';' : ''}"></th>`,
      )
      // BA3-S3: the wordmark's heading, with the two lines that keep its look.
      .replace(/<h1 style="([^"]*?)(;margin:0;font-weight:400|; margin: 0px; font-weight: 400;)"(>[\s\S]*?>Brew <\/span>[\s\S]*?)<\/h1>/g, (all, style, kept, inner) =>
        `<div style="${style}${kept.startsWith('; ') ? ';' : ''}"${inner}</div>`,
      )
      // BA3-S4: the stats bar's region and its name.
      .replace(' role="region" aria-label="Recipe figures"', '')
  );
}
