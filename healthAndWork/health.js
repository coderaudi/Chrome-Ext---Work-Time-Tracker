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

  // attach notification button handler
  const btn = card.querySelector('#healthNotifyBtn');
  if (btn && !btn.dataset.handlerAttached) {
    btn.dataset.handlerAttached = '1';
    btn.addEventListener('click', () => {
      // provide quick UI feedback
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Sending...';

      const showFallbackAlert = () => {
        try { alert('Take care of your health while working!'); } catch (e) { console.log('Fallback alert failed', e); }
        btn.disabled = false;
        btn.textContent = originalText;
      };

      const tryCreateLocalNotification = () => {
        if (chrome && chrome.notifications && chrome.notifications.create) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Take care of your health',
            message: 'Take care of your health while working !!!',
            priority: 2
          }, id => {
            console.log('Local notification created (popup):', id);
            btn.disabled = false;
            btn.textContent = originalText;
          });
          return true;
        }
        return false;
      };

      // Prefer sending to background service worker which centralizes notifications
      if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'HEALTH_REMINDER' }, (resp) => {
          if (chrome.runtime.lastError) {
            console.warn('sendMessage failed:', chrome.runtime.lastError);
            // try to create notification directly from popup as a fallback
            if (!tryCreateLocalNotification()) showFallbackAlert();
          } else {
            console.log('Health reminder message sent', resp);
            btn.disabled = false;
            btn.textContent = originalText;
          }
        });
      } else {
        // no runtime available; try to create notification directly or fallback to alert
        if (!tryCreateLocalNotification()) showFallbackAlert();
      }
    });
  }
}

// Try immediate attach, and also observe DOM mutations for later injection
attachHealthHandlers();
const observer = new MutationObserver(() => attachHealthHandlers());
observer.observe(document.body, { childList: true, subtree: true });

