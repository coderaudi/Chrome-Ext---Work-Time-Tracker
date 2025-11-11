// src/screens/healthAndWork/health.js

// Health & Work Balance collapsible behavior + reminder button
function attachHealthHandlers() {
  const card = document.getElementById('healthCard');
  if (!card) return;

  const toggle = card.querySelector('.health-toggle');
  if (toggle && !toggle.dataset.attached) {
    toggle.dataset.attached = '1';
    toggle.addEventListener('click', () => {
      card.classList.toggle('health-open');
      const open = card.classList.contains('health-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  const btn = card.querySelector('#healthNotifyBtn');
  if (btn && !btn.dataset.handlerAttached) {
    btn.dataset.handlerAttached = '1';
    btn.addEventListener('click', () => {
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Sending...';

      const showFallbackAlert = () => {
        alert('💡 Take care of your health while working!');
        btn.disabled = false;
        btn.textContent = originalText;
      };

      const tryLocalNotification = () => {
        if (chrome?.notifications?.create) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Health Reminder',
            message: 'Take care of your health while working! 🌿',
            priority: 2
          }, () => {
            btn.disabled = false;
            btn.textContent = originalText;
          });
          return true;
        }
        return false;
      };

      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ type: 'HEALTH_REMINDER' }, (resp) => {
          if (chrome.runtime.lastError) {
            console.warn('sendMessage failed:', chrome.runtime.lastError);
            if (!tryLocalNotification()) showFallbackAlert();
          } else {
            btn.disabled = false;
            btn.textContent = originalText;
          }
        });
      } else {
        if (!tryLocalNotification()) showFallbackAlert();
      }
    });
  }
}

// Try to attach immediately, and reattach if DOM changes (for dynamic injection)
attachHealthHandlers();
const observer = new MutationObserver(() => attachHealthHandlers());
observer.observe(document.body, { childList: true, subtree: true });
