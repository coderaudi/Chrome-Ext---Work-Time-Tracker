// Component loader for Work Assistance app
(async function(){
  // resolve URL inside extension when chrome.runtime is available
  const resolve = (p) => (window.chrome && chrome.runtime && chrome.runtime.getURL) ? chrome.runtime.getURL(p) : p;

  const loadFragment = async (placeholderId, url, fallbackHtml='') => {
    const el = document.getElementById(placeholderId);
    if (!el) return false;
    try{
      const resp = await fetch(resolve(url));
      if (resp.ok){
        el.innerHTML = await resp.text();
        return true;
      }
    }catch(e){ console.warn('frag fetch failed', url, e) }
    if (fallbackHtml) el.innerHTML = fallbackHtml;
    return false;
  };

  try{
    // load core fragments from src/components and src/screens
    await loadFragment('comp-header', 'src/components/header.html', '<header class="header-bar"><div class="header-left"><h1>Work Assistance</h1><div class="small" id="todayLine"></div></div></header>');
    await loadFragment('comp-clock', 'src/components/clock.html');
    await loadFragment('comp-health', 'src/components/health.html');
    await loadFragment('comp-input', 'src/components/input.html');

    // load health behavior if available
    try{
      const healthScriptSrc = resolve('src/utils/health.js');
      if (!document.querySelector(`script[src="${healthScriptSrc}"]`)){
        const healthScript = document.createElement('script');
        healthScript.src = healthScriptSrc;
        document.body.appendChild(healthScript);
      }
    }catch(e){console.warn('Failed to load health script', e)}

    // footer
    try{
      const footerPlaceholder = document.getElementById('footerPlaceholder');
      let footerLoaded = false;
      try{
        const footerResp = await fetch(resolve('src/components/footer.html'));
        if (footerResp.ok){
          const footerHtml = await footerResp.text();
          if (footerPlaceholder) footerPlaceholder.innerHTML = footerHtml;
          footerLoaded = true;
        }
      }catch(e){ console.warn('Footer fetch error', e) }

      const footerCss = resolve('src/components/footer.css');
      if (!document.querySelector(`link[href="${footerCss}"]`)){
        const footerLink = document.createElement('link');
        footerLink.rel = 'stylesheet';
        footerLink.href = footerCss;
        document.head.appendChild(footerLink);
      }

      const footerJs = resolve('src/components/footer.js');
      if (!document.querySelector(`script[src="${footerJs}"]`)){
        const scr = document.createElement('script');
        scr.src = footerJs;
        document.body.appendChild(scr);
      }

      if (footerPlaceholder && !footerLoaded && footerPlaceholder.innerHTML.trim() === ''){
        footerPlaceholder.innerHTML = '<footer class="app-footer">\n  <small>🔒 Local data only · Built by <strong>[Abhijeet K]</strong></small>\n</footer>';
      }
    }catch(e){console.warn('Failed footer load', e)}

    // finally load main app script and call init
    const mainJs = resolve('src/screens/index.js');
    const s = document.createElement('script');
    s.src = mainJs;
    s.onload = function(){ if (window.workAssistanceInit) try{ window.workAssistanceInit(); }catch(e){console.warn(e)} };
    s.onerror = function(e){ console.warn('Failed to load index.js', e) };
    document.body.appendChild(s);
  }catch(e){console.warn('Loader error', e)}
})();
