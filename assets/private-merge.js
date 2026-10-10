/* Merges the private study bundle (the owner's Neonomics material, delivered only after sign-in) into the public content arrays.
   Pure and idempotent so the browser, the validator and the tests all use the same code. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PrivateMerge = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  /** A bundle is {v:1, track?, trackIndex?, mock?, cards?, resources?}: any mix, so a topic pack can ship just a track, or just cards.
   g: {TRACKS, MOCK, CARDS, RESOURCES} arrays, mutated in place. Returns how many things were added. */
  function merge(g, bundle) {
    if (!bundle || bundle.v !== 1) return 0;
    let added = 0;
    if (bundle.track && !g.TRACKS.some((t) => t.id === bundle.track.id)) { g.TRACKS.splice(Math.min(bundle.trackIndex ?? g.TRACKS.length, g.TRACKS.length), 0, bundle.track); added++; }
    for (const q of bundle.mock || []) if (!g.MOCK.some((x) => x.q === q.q)) { g.MOCK.push(q); added++; }
    for (const c of bundle.cards || []) if (!g.CARDS.some((x) => x.q === c.q)) { g.CARDS.push(c); added++; }
    for (const r of bundle.resources || []) if (!g.RESOURCES.some((x) => x.url === r.url)) { g.RESOURCES.push(r); added++; }
    return added;
  }
  return { merge };
});
