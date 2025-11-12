// src/screens/healthAndWork/health.js

// ------------------------------
// Section 0: Collapsible Card
// ------------------------------
function attachHealthHandlers() {
  const card = document.getElementById('healthCard');
  if (!card) return;

  const toggle = card.querySelector('.health-toggle');
  if (toggle && !toggle.dataset.attached) {
    toggle.dataset.attached = '1';
    toggle.addEventListener('click', () => {
      card.classList.toggle('health-open');
      toggle.setAttribute('aria-expanded', card.classList.contains('health-open'));
    });
  }
}
attachHealthHandlers();
new MutationObserver(() => attachHealthHandlers()).observe(document.body, { childList: true, subtree: true });

// ------------------------------
// Section 1: Reminder Handling
// ------------------------------
const ACTIVE_KEY = 'activeHealthReminders';
const reminderBoxes = document.querySelectorAll('.health-box');

// Toggle a single reminder
function toggleReminder(type, box) {
  const isActive = box.classList.contains('active');

  if (isActive) {
    // Stop this reminder in background
    chrome.runtime.sendMessage({ type: 'STOP_HEALTH_REMINDER', reminderType: type }, (resp) => {
      console.log(resp?.message || `${type} stopped`);
    });
    box.classList.remove('active');
  } else {
    // Start this reminder in background
    chrome.runtime.sendMessage({ type: 'START_HEALTH_REMINDER', reminderType: type }, (resp) => {
      console.log(resp?.message || `${type} started`);
    });
    box.classList.add('active');
  }

  // Save current active reminders
  saveActiveReminders();
}

// Persist active reminders to storage
function saveActiveReminders() {
  const active = [...document.querySelectorAll('.health-box.active')].map(b => b.dataset.type);
  chrome.storage.local.set({ [ACTIVE_KEY]: active });
}

// Restore active reminders when popup opens
function restoreActiveReminders() {
  chrome.storage.local.get(ACTIVE_KEY, (res) => {
    const active = res[ACTIVE_KEY] || [];
    reminderBoxes.forEach(box => {
      const type = box.dataset.type;
      if (active.includes(type)) {
        box.classList.add('active');
        // Ensure background knows this reminder should be active
        chrome.runtime.sendMessage({ type: 'START_HEALTH_REMINDER', reminderType: type });
      } else {
        box.classList.remove('active');
        chrome.runtime.sendMessage({ type: 'STOP_HEALTH_REMINDER', reminderType: type });
      }
    });
  });
}


// Attach click events to health boxes
reminderBoxes.forEach(box => {
  const type = box.dataset.type;
  box.addEventListener('click', () => toggleReminder(type, box));
});

restoreActiveReminders();

// ------------------------------
// Section 2: Stop All Reminders
// ------------------------------
const stopBtn = document.getElementById('stopAllBtn');

if (stopBtn) {
  stopBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'STOP_ALL_HEALTH_REMINDERS' }, (resp) => {
      console.log(resp?.message || 'All health reminders stopped');
      // Reset UI
      reminderBoxes.forEach(btn => btn.classList.remove('active'));
      saveActiveReminders();
    });
  });
}
