// src/screens/healthAndWork/health.js

// Collapsible behavior for Health & Work card
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

// ===== Reminder intervals =====
const reminderIntervals = {};

// Reminder config for each type
const REMINDERS = {
  water: {
    title: '💧 Water Reminder',
    message: 'Time for a sip! Take a few sips of water 💦',
    // interval: 60 * 60 * 1000 // 1 hour
    interval: 10 * 1000  // 10 seconds for testing

  },
  eye: {
    title: '👀 Eye Break',
    message: 'Look away from the screen for 20 seconds (20-20-20 rule).',
    // interval: 20 * 60 * 1000 // 20 minutes
    interval: 10 * 1000  // 10 seconds for testing

  },
  stretch: {
    title: '🏃 Walk / Stretch Break',
    message: 'Stand up and stretch or walk for 2–3 minutes 🧘‍♂️',
    interval: 78 * 60 * 1000 // ~1.3 hours
  }
};

// Show desktop notification
function showNotification(title, message) {
  if (Notification.permission === 'granted') {
    new Notification(title, { body: message, icon: 'icons/icon128.png' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') new Notification(title, { body: message, icon: 'icons/icon128.png' });
      else alert(`${title}\n\n${message}`); // fallback
    });
  } else {
    alert(`${title}\n\n${message}`); // fallback
  }
}

// Toggle a reminder
function toggleReminder(type, box) {
  if (reminderIntervals[type]) {
    clearInterval(reminderIntervals[type]);
    delete reminderIntervals[type];
    box.classList.remove('active');
  } else {
    const { title, message, interval } = REMINDERS[type];

    // Show first notification immediately
    showNotification(title, message);

    // Start interval
    reminderIntervals[type] = setInterval(() => showNotification(title, message), interval);

    box.classList.add('active');
  }
}


// Attach buttons
// Attach click event to the whole card instead of the button
document.querySelectorAll('.health-box').forEach(box => {
  const type = box.dataset.type;
  box.addEventListener('click', () => {
    toggleReminder(type, box);
  });
});


const stopBtn = document.getElementById('stopAllBtn');

if (stopBtn) {
  stopBtn.addEventListener('click', stopAllReminders);
}

function stopAllReminders() {
  chrome.runtime.sendMessage({ type: 'STOP_ALL_HEALTH_REMINDERS' }, (resp) => {
    console.log(resp.message);

    // Reset all buttons UI
    document.querySelectorAll('.reminder-btn').forEach(btn => {
      btn.classList.remove('active');
      btn.textContent = 'Start';
    });
  });
}
