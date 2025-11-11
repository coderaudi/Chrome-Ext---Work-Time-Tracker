// Shim: delegate to new screen-local health script to avoid duplication.
(function(){
  var resolve = function(p){ return (window.chrome && chrome.runtime && chrome.runtime.getURL) ? chrome.runtime.getURL(p) : p; };
  var target = resolve('src/screens/healthAndWork/health.js');

  if (document.querySelector('script[src="' + target + '"]')) return;
  var s = document.createElement('script');
  s.src = target;
  s.onload = function(){ console.log('Loaded health shim ->', target); };
  s.onerror = function(e){ console.warn('Failed to load delegated health script', target, e); };
  document.body.appendChild(s);
})();
