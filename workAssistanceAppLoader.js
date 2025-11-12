// workAssistanceAppLoader.js
// Component loader for Work Assistance app
(async function () {
  // resolve URL inside extension when chrome.runtime is available
  const resolve = (p) => (window.chrome && chrome.runtime && chrome.runtime.getURL) ? chrome.runtime.getURL(p) : p;

  const loadFragment = async (placeholderId, url, fallbackHtml = '') => {
    const el = document.getElementById(placeholderId);
    if (!el) return false;
    try {
      const resp = await fetch(resolve(url));
      if (resp.ok) {
        el.innerHTML = await resp.text();
        return true;
      }
    } catch (e) { console.warn('frag fetch failed', url, e) }
    if (fallbackHtml) el.innerHTML = fallbackHtml;
    return false;
  };

  // Generic component loader
  const createComponentLoader = () => {
    const loadedPlaceholders = new WeakSet();

    const loadInto = async (placeholder, htmlPath, cssPath, jsPath) => {
      if (!placeholder || loadedPlaceholders.has(placeholder)) return false;
      try {
        const resp = await fetch(resolve(htmlPath));
        if (!resp.ok) return false;
        placeholder.innerHTML = await resp.text();
        loadedPlaceholders.add(placeholder);

        if (cssPath) {
          const href = resolve(cssPath);
          if (!document.querySelector(`link[href="${href}"]`)) {
            const l = document.createElement('link');
            l.rel = 'stylesheet';
            l.href = href;
            document.head.appendChild(l);
          }
        }

        if (jsPath) {
          const src = resolve(jsPath);
          if (!document.querySelector(`script[src="${src}"]`)) {
            const s = document.createElement('script');
            s.src = src;
            document.body.appendChild(s);
          }
        }
        return true;
      } catch (e) { console.warn('component load failed', htmlPath, e); return false }
    };

    const ensure = async (name, htmlPath, cssPath, jsPath, selector) => {
      const sel = selector || `[data-component="${name}"], #screen-${name}`;
      const nodes = document.querySelectorAll(sel);
      let any = false;
      for (const n of nodes) {
        const r = await loadInto(n, htmlPath, cssPath, jsPath);
        any = any || r;
      }
      return any;
    };

    return { ensure, loadInto };
  };

  const componentLoader = createComponentLoader();

  // Observe DOM additions so dynamically added placeholders are auto-loaded
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;

        if (node.matches && (node.matches('[data-component="theme-toggle"]') || node.id === 'screen-theme')) {
          componentLoader.ensure(
            'theme-toggle',
            'src/components/theme/themeToggleButton.html',
            'src/components/theme/themeToggleButton.css',
            'src/components/theme/themeToggleButton.js'
          );
        } else {
          const inner = node.querySelector && node.querySelector('[data-component="theme-toggle"], #screen-theme');
          if (inner) componentLoader.ensure(
            'theme-toggle',
            'src/components/theme/themeToggleButton.html',
            'src/components/theme/themeToggleButton.css',
            'src/components/theme/themeToggleButton.js'
          );
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  try {
  // Load theme first
    const loadThemeAssets = async () => {
      try {
        const injected = await loadFragment('screen-theme', 'src/components/theme/themeToggleButton.html');
        const themeCss = resolve('src/components/theme/themeToggleButton.css');
        if (!document.querySelector(`link[href="${themeCss}"]`)) {
          const l = document.createElement('link');
          l.rel = 'stylesheet';
          l.href = themeCss;
          document.head.appendChild(l);
        }
        const themeJs = resolve('src/components/theme/themeToggleButton.js');
        if (!document.querySelector(`script[src="${themeJs}"]`)) {
          const t = document.createElement('script');
          t.src = themeJs;
          document.body.appendChild(t);
        }
        return injected;
      } catch (e) { console.warn('Failed to load theme component', e); return false }
    };
    let themeLoaded = await loadThemeAssets();

    // Load core screens
    await loadFragment('screen-header', 'src/screens/header/header.html',
      '<header class="header-bar"><div class="header-left"><h1>Work Assistance</h1><div class="small" id="todayLine"></div></div></header>'
    );

    await componentLoader.loadInto(
      document.getElementById('screen-header'),           // placeholder
      'src/screens/header/header.html',                   // HTML
      'src/screens/header/header.css',                    // CSS
      'src/screens/header/header.js'                      // JS (personalization script)
    );

    await componentLoader.loadInto(
      document.getElementById('screen-clock'), // placeholder
      'src/screens/progressClock/clock.html',  // HTML
      null,                                    // CSS (if any)
      'src/screens/progressClock/clock.js'     // JS
    );

    await componentLoader.loadInto(
      document.getElementById('screen-typemaster'),
      'src/screens/gamezone/typemaster/typemaster.html',
      'src/screens/gamezone/typemaster/typemaster.css',
      'src/screens/gamezone/typemaster/typemaster.js'
    );


    await componentLoader.loadInto(
      document.getElementById('screen-profileAndSetting'), // placeholder
      'src/screens/profileAndSettings/profileAndSettings.html', // HTML
      'src/screens/profileAndSettings/profileAndSettings.css',  // CSS
      'src/screens/profileAndSettings/profileAndSettings.js'    // JS
    );

    await componentLoader.loadInto(
      document.getElementById('screen-tabs'),
      'src/components/tabs/tabs.html',  // HTML for tabs
      'src/components/tabs/tabs.css',   // CSS
      'src/components/tabs/tabs.js'     // JS
    );


    await loadFragment('screen-health', 'src/screens/healthAndWork/health.html');
    await loadFragment('screen-checkin', 'src/screens/workCheckIn/checkIn.html');

    // Load associated scripts for check-in and health
    const checkInJs = resolve('src/screens/workCheckIn/checkIn.js');
    if (!document.querySelector(`script[src="${checkInJs}"]`)) {
      const s = document.createElement('script');
      s.src = checkInJs;
      document.body.appendChild(s);
    }

    const healthJs = resolve('src/screens/healthAndWork/health.js');
    if (!document.querySelector(`script[src="${healthJs}"]`)) {
      const h = document.createElement('script');
      h.src = healthJs;
      document.body.appendChild(h);
    }

    // Load footer
    try {
      const footerPlaceholder = document.getElementById('screen-footer');
      let footerLoaded = false;
      try {
        const footerResp = await fetch(resolve('src/screens/footer/footer.html'));
        if (footerResp.ok) {
          const footerHtml = await footerResp.text();
          if (footerPlaceholder) footerPlaceholder.innerHTML = footerHtml;
          footerLoaded = true;
        }
      } catch (e) { console.warn('Footer fetch error', e) }

      const footerCss = resolve('src/screens/footer/footer.css');
      if (!document.querySelector(`link[href="${footerCss}"]`)) {
        const footerLink = document.createElement('link');
        footerLink.rel = 'stylesheet';
        footerLink.href = footerCss;
        document.head.appendChild(footerLink);
      }

      const footerJs = resolve('src/screens/footer/footer.js');
      if (!document.querySelector(`script[src="${footerJs}"]`)) {
        const scr = document.createElement('script');
        scr.src = footerJs;
        document.body.appendChild(scr);
      }

      if (footerPlaceholder && !footerLoaded && footerPlaceholder.innerHTML.trim() === '') {
        footerPlaceholder.innerHTML = '<footer class="app-footer">\n  <small>🔒 Local data only · Built by <strong>[Abhijeet K]</strong></small>\n</footer>';
      }
    } catch (e) { console.warn('Failed footer load', e) }

    // If theme was inside footer and first attempt didn't find it, try again
    if (!themeLoaded) {
      try { themeLoaded = await loadThemeAssets(); } catch (e) { }
    }

    // Finally, load main app script
    const mainJs = resolve('src/screens/index.js');
    const s = document.createElement('script');
    s.src = mainJs;
    s.onload = function () {
      if (window.workAssistanceInit) try { window.workAssistanceInit(); } catch (e) { console.warn(e) }
    };
    s.onerror = function (e) { console.warn('Failed to load index.js', e) };
    document.body.appendChild(s);

  } catch (e) { console.warn('Loader error', e) }
})();


// -----------------------------
// Sub-tabs & Profile Section Logic
// -----------------------------
function initSubTabs() {
  const tabContents = document.querySelectorAll('.tab-content');

  tabContents.forEach(tab => {
    const subTabButtons = tab.querySelectorAll('.sub-tab-button');
    const subTabContents = tab.querySelectorAll('.sub-tab-content');

    if (!subTabButtons.length) return;

    subTabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.subtab;

        // Deactivate all buttons and contents
        subTabButtons.forEach(b => b.classList.remove('active'));
        subTabContents.forEach(c => c.classList.remove('active'));

        // Activate clicked
        btn.classList.add('active');
        const content = tab.querySelector(`#${target}`);
        if (content) content.classList.add('active');

        // Move Profile & Settings into Step 3
        const profileSection = document.getElementById('screen-profileAndSetting');
        if (!profileSection) return;

        if (target === 'step3' && content && !content.contains(profileSection)) {
          content.appendChild(profileSection);
        } else {
          // Move back to main container if not step3
          const container = document.querySelector('.container');
          if (container && !container.contains(profileSection)) {
            container.appendChild(profileSection);
          }
        }
      });
    });
  });
}

// Wait until all components are loaded before initializing sub-tabs
window.addEventListener('load', () => {
  // Small delay to ensure loader injected HTML
  setTimeout(() => {
    initSubTabs();
  }, 300);
});

