/*
 * Compatibility file.
 * The public schedule is synchronized by the single renderer in script.js.
 * This file intentionally does not contain a second renderer.
 */
(() => {
  'use strict';
  if (typeof window.belkaRefreshSchedule === 'function') {
    window.belkaRefreshSchedule();
  }
})();
