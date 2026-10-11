/* Lesson time estimate, computed from what is actually in the lesson (the hand-written `minutes` values ignored the practice
   sections that were added later). reading = words / 120 per minute (technical prose you want to absorb); practice = each code challenge's own time budget plus a few
   minutes per simulation, bug hunt, predict question and quick check. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LessonTime = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const WPM = 120; /* technical prose you want to absorb, not skim */
  const PRACTICE = { sim: 5, bug: 4, predict: 3, quiz: 1 };
  /* fields that hold code, data or answers, not prose to read */
  const SKIP = new Set(['starter', 'solution', 'tests', 'code', 'schema', 'seed', 'hidden', 'verify', 'hint', 'notes', 'id', 'pid', 'type', 'kind', 'ref', 'level', 'names', 'bugs', 'ok']);
  const plain = (h) => String(h).replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');
  const words = (h) => (plain(h).match(/\S+/g) || []).length;
  function prose(v, skip) {
    if (typeof v === 'string') return words(v);
    if (Array.isArray(v)) return v.reduce((n, x) => n + prose(x, skip), 0);
    if (v && typeof v === 'object') return Object.keys(v).reduce((n, k) => n + (SKIP.has(k) || (skip && skip.has(k)) ? 0 : prose(v[k], skip)), 0);
    return 0;
  }
  const round = (m) => (m < 10 ? Math.max(5, Math.round(m)) : Math.round(m / 5) * 5); /* nothing is a 2-minute lesson */

  function estimate(lesson) {
    let w = 0, practice = 0;
    for (const s of lesson.sections || []) {
      w += prose(s, s.type === 'code' ? new Set(['prompt']) : null); /* a challenge's budget already covers reading its prompt */
      if (s.type === 'code') practice += s.minutes || 20;
      else practice += PRACTICE[s.type] || 0;
    }
    const read = w / WPM;
    return { read: Math.round(read), practice, total: round(read + practice) };
  }
  /** Replaces each lesson's hand-written minutes with the estimate (the old value is kept as authoredMinutes). */
  function apply(tracks) {
    for (const t of tracks) for (const l of t.lessons) {
      if (l.authoredMinutes == null) l.authoredMinutes = l.minutes;
      const e = estimate(l); l.timeParts = { read: e.read, practice: e.practice }; l.minutes = e.total;
    }
    return tracks;
  }
  return { estimate, apply, WPM };
});
