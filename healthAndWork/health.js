// Health & Work collapsible card behavior
// Health fragment may be injected dynamically. Observe DOM and attach handler when available.
function attachHealthHandlers() {
  const card = document.getElementById('healthCard');
  if (!card) return;
  const toggle = card.querySelector('.health-toggle');
  if (!toggle) return;
  // avoid double-attach
  if (toggle.dataset.attached) return;
  toggle.dataset.attached = '1';
  toggle.addEventListener('click', () => {
    card.classList.toggle('health-open');
    const open = card.classList.contains('health-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

// Try immediate attach, and also observe DOM mutations for later injection
attachHealthHandlers();
const observer = new MutationObserver(() => attachHealthHandlers());
observer.observe(document.body, { childList: true, subtree: true });

