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

  // Generic component loader: can load a component into any placeholder found by
  // selector (supports `[data-component="name"]` or legacy `#screen-name`).
  const createComponentLoader = () => {
    const loadedPlaceholders = new WeakSet();

    const loadInto = async (placeholder, htmlPath, cssPath, jsPath) => {
      if (!placeholder || loadedPlaceholders.has(placeholder)) return false;
      try{
        const resp = await fetch(resolve(htmlPath));
        if (!resp.ok) return false;
        placeholder.innerHTML = await resp.text();
        loadedPlaceholders.add(placeholder);

        if (cssPath){
          const href = resolve(cssPath);
          if (!document.querySelector(`link[href="${href}"]`)){
            const l = document.createElement('link');
            l.rel = 'stylesheet';
            l.href = href;
            document.head.appendChild(l);
          }
        }

        if (jsPath){
          const src = resolve(jsPath);
          if (!document.querySelector(`script[src="${src}"]`)){
            const s = document.createElement('script');
            s.src = src;
            document.body.appendChild(s);
          }
        }
        return true;
      }catch(e){ console.warn('component load failed', htmlPath, e); return false }
    };

    const ensure = async (name, htmlPath, cssPath, jsPath, selector) => {
      const sel = selector || `[data-component="${name}"], #screen-${name}`;
      const nodes = document.querySelectorAll(sel);
      let any = false;
      for (const n of nodes){
        const r = await loadInto(n, htmlPath, cssPath, jsPath);
        any = any || r;
      }
      return any;
    };

    return { ensure, loadInto };
  };

  const componentLoader = createComponentLoader();

  // Observe DOM additions so components placed anywhere later will be auto-loaded
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations){
      for (const node of m.addedNodes){
        if (!(node instanceof HTMLElement)) continue;
        // quick checks for theme placeholder
        if (node.matches && (node.matches('[data-component="theme-toggle"]') || node.id === 'screen-theme')){
          componentLoader.ensure('theme-toggle', 'src/components/theme/themeToggleButton.html', 'src/components/theme/themeToggleButton.css', 'src/components/theme/themeToggleButton.js');
        } else {
          const inner = node.querySelector && node.querySelector('[data-component="theme-toggle"], #screen-theme');
          if (inner) componentLoader.ensure('theme-toggle', 'src/components/theme/themeToggleButton.html', 'src/components/theme/themeToggleButton.css', 'src/components/theme/themeToggleButton.js');
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  try{
    // load core fragments from src/components and src/screens
    // Theme toggle: attempt to load now. If #screen-theme is present inside another fragment
    // (for example footer.html), we'll attempt again after that fragment is injected.
    const loadThemeAssets = async () => {
      try{
        const injected = await loadFragment('screen-theme', 'src/components/theme/themeToggleButton.html');
        const themeCss = resolve('src/components/theme/themeToggleButton.css');
        if (!document.querySelector(`link[href="${themeCss}"]`)){
          const l = document.createElement('link');
          l.rel = 'stylesheet';
          l.href = themeCss;
          document.head.appendChild(l);
        }
        const themeJs = resolve('src/components/theme/themeToggleButton.js');
        if (!document.querySelector(`script[src="${themeJs}"]`)){
          const t = document.createElement('script');
          t.src = themeJs;
          document.body.appendChild(t);
        }
        return injected;
      }catch(e){ console.warn('Failed to load theme component', e); return false }
    };
    // first attempt
    let themeLoaded = await loadThemeAssets();

  await loadFragment('screen-header', 'src/screens/header/header.html', '<header class="header-bar"><div class="header-left"><h1>Work Assistance</h1><div class="small" id="todayLine"></div></div></header>');
  await loadFragment('screen-clock', 'src/screens/progressClock/clock.html');
  // health component moved to src/screens/healthAndWork/
  await loadFragment('screen-health', 'src/screens/healthAndWork/health.html');
  await loadFragment('screen-checkin', 'src/screens/workCheckIn/input.html');

    // load health behavior if available
    try{
  // health behaviour script moved alongside the screen
  const healthScriptSrc = resolve('src/screens/healthAndWork/health.js');
      if (!document.querySelector(`script[src="${healthScriptSrc}"]`)){
        const healthScript = document.createElement('script');
        healthScript.src = healthScriptSrc;
        document.body.appendChild(healthScript);
      }
    }catch(e){console.warn('Failed to load health script', e)}

    // footer
    try{
  const footerPlaceholder = document.getElementById('screen-footer');
      let footerLoaded = false;
      try{
  const footerResp = await fetch(resolve('src/screens/footer/footer.html'));
        if (footerResp.ok){
          const footerHtml = await footerResp.text();
          if (footerPlaceholder) footerPlaceholder.innerHTML = footerHtml;
          footerLoaded = true;
        }
      }catch(e){ console.warn('Footer fetch error', e) }

  const footerCss = resolve('src/screens/footer/footer.css');
      if (!document.querySelector(`link[href="${footerCss}"]`)){
        const footerLink = document.createElement('link');
        footerLink.rel = 'stylesheet';
        footerLink.href = footerCss;
        document.head.appendChild(footerLink);
      }

  const footerJs = resolve('src/screens/footer/footer.js');
      if (!document.querySelector(`script[src="${footerJs}"]`)){
        const scr = document.createElement('script');
        scr.src = footerJs;
        document.body.appendChild(scr);
      }

      if (footerPlaceholder && !footerLoaded && footerPlaceholder.innerHTML.trim() === ''){
        footerPlaceholder.innerHTML = '<footer class="app-footer">\n  <small>🔒 Local data only · Built by <strong>[Abhijeet K]</strong></small>\n</footer>';
      }
    }catch(e){console.warn('Failed footer load', e)}

    // If theme placeholder was inside footer and first attempt didn't find it, try loading again now
    if (!themeLoaded){
      try{ themeLoaded = await loadThemeAssets(); }catch(e){/* already logged */}
    }

    // finally load main app script and call init
    const mainJs = resolve('src/screens/index.js');
    const s = document.createElement('script');
    s.src = mainJs;
    s.onload = function(){ if (window.workAssistanceInit) try{ window.workAssistanceInit(); }catch(e){console.warn(e)} };
    s.onerror = function(e){ console.warn('Failed to load index.js', e) };
    document.body.appendChild(s);
  }catch(e){console.warn('Loader error', e)}
})();
