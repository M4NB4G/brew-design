// The phone switch (docs/items/phone-width.md): true while the screen is
// narrower than 700 px. Inline styles cannot hold a media query, so the
// components that lay out differently on a phone read this instead. Desktop,
// tablets and the printed sheet never see the phone layout. Layout only.
import { useSyncExternalStore } from 'react';

const PHONE_QUERY = '(max-width: 699.98px)';

function phoneQuery() {
  return typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(PHONE_QUERY) : null;
}

function subscribe(onChange) {
  const query = phoneQuery();
  if (!query) return () => {};
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function isPhone() {
  const query = phoneQuery();
  return query ? query.matches : false;
}

export default function usePhone() {
  return useSyncExternalStore(subscribe, isPhone, () => false);
}
