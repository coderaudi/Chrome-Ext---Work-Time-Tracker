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

// Robust delegation: handle toggles even if markup changes or if scripts load earlier/later
document.addEventListener('click', (ev) => {
  const toggle = ev.target.closest && ev.target.closest('.health-toggle');
  if (!toggle) return;
  const card = toggle.closest('.health-card');
  if (!card) return;
  card.classList.toggle('health-open');
  const open = card.classList.contains('health-open');
  try { toggle.setAttribute('aria-expanded', open ? 'true' : 'false'); } catch (e) {}
  // small debug log
  if (typeof console !== 'undefined') console.log('Health toggle clicked, open=', open);
  // show a small transient toast inside the card when opened
  if (open) {
    const toast = document.createElement('div');
    toast.className = 'health-toast';
    toast.textContent = 'Take care of your health while working !!!';
    toast.style.marginTop = '8px';
    toast.style.padding = '8px';
    toast.style.background = 'rgba(0,0,0,0.06)';
    toast.style.borderRadius = '6px';
    toast.style.fontSize = '12px';
    const content = card.querySelector('.health-content');
    if (content) {
      content.insertBefore(toast, content.firstChild);
      setTimeout(() => { try{ toast.remove(); }catch(e){} }, 3500);
    }

    // send a message to background to optionally show a system notification
    try { chrome.runtime.sendMessage({ type: 'HEALTH_CLICK' }); } catch (e) { }
  }
});

