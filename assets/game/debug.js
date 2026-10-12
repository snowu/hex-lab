/* Keep existing repair links pointed at the native exercises. */
(window.LAB_VIEWS = window.LAB_VIEWS || []).push(H => {
  if (window.MODE !== 'gamedev') return;
  H.routes.push([/^#\/debug\/(damage|stuck|saves)$/, id => {
    location.hash = '#/game-kata/debug-' + id;
  }]);
});
