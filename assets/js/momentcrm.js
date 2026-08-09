// MomentCRM live-chat/tracking widget, preserved from the live site
// (teamVanityId/doChat/doTracking unchanged). Injected dynamically so it
// never blocks page rendering; init only fires once the library has
// actually loaded.
(function () {
  var s = document.createElement('script');
  s.src = 'https://www.momentcrm.com/embed';
  s.async = true;
  s.onload = function () {
    if (typeof MomentCRM === 'function') {
      MomentCRM('init', {
        teamVanityId: 'vs-salesteam',
        doChat: true,
        doTracking: true,
      });
    }
  };
  document.head.appendChild(s);
})();
