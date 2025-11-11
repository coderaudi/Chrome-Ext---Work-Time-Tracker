# Theme Toggle Component

Files:
- `themeToggleButton.html` — self-contained HTML that includes the button and script tag.
- `themeToggleButton.css` — styling and theme variables for light/dark.
- `themeToggleButton.js` — logic to apply, persist, and toggle theme.

Usage:
1. Include the CSS in your page (best in `<head>`):
   <link rel="stylesheet" href="./src/components/theme/themeToggleButton.css">

2. Insert the HTML where you want the control (for example in the header):
   <!-- include the component file content or use server-side include -->
   <div id="theme-area"></div>

   Then either copy `themeToggleButton.html` content into that spot or load it using your build/includes.

Notes:
- Theme is applied by setting `data-theme="dark"` or `data-theme="light"` on the document root (`<html>`).
- The component stores preference in `localStorage` under key `wt_tracker_theme`.
- It falls back to the system `prefers-color-scheme` if no saved choice exists.

Quick example (in `workAssistanceApp.html`):
1. Add the CSS link in `<head>`.
2. Place the HTML markup inside the header area.
