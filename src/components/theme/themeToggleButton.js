(() => {
  const STORAGE_KEY = 'wt_tracker_theme';
  const root = document.documentElement;
  const button = document.getElementById('theme-toggle-button');
  const label = button && button.querySelector('.label');

  function applyTheme(theme) {
    if (!theme) return;
    root.setAttribute('data-theme', theme);
    if (button) {
      const isDark = theme === 'dark';
      button.setAttribute('aria-pressed', String(isDark));
      if (label) label.textContent = isDark ? 'Dark' : 'Light';
    }
  }

  function getPreferredTheme() {
    // 1. saved preference
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    // 2. system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  }

  function toggleTheme() {
    const current = root.getAttribute('data-theme') || getPreferredTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  // Initialize on DOMContentLoaded if element exists, otherwise run immediately
  function init() {
    if (!button) return;
    const theme = getPreferredTheme();
    applyTheme(theme);
    button.addEventListener('click', toggleTheme);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
