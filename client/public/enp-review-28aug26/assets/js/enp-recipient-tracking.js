/* ENP recipient-level site activity helper.
 * Loaded after the inline URL scrubber and before GA4.
 * Sends only path + static CTA category to Connect; never sends identity, query, hash or full URL.
 */
(function () {
  'use strict';

  if (window.ENP_RECIPIENT_ACTIVITY_ENABLED !== true) return;

  var script = document.currentScript;
  var endpoint = script && script.getAttribute('data-endpoint');
  if (!endpoint) return;

  var token = '';
  try {
    token = sessionStorage.getItem('wkel_ref') || '';
  } catch (error) {
    return;
  }
  if (!/^[a-f0-9]{64}$/.test(token)) return;

  function record(eventName, category) {
    var body = new URLSearchParams({
      wkel_ref: token,
      event: eventName,
      path: window.location.pathname,
      category: category || ''
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, body);
      return;
    }

    fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      credentials: 'omit',
      body: body,
      keepalive: true
    });
  }

  record('page_view', '');

  document.addEventListener('click', function (event) {
    var target = event.target;
    var element = target instanceof Element ? target.closest('[data-wkel-track]') : null;
    if (!element) return;

    var category = (element.getAttribute('data-wkel-track') || '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 40);
    if (category) record('cta', category);
  }, true);
}());
