// Work Assistance UI script (moved from timetracker/index.js)
const STORAGE_KEY_PREFIX = 'audi_in_';

function pad(n) { return n.toString().padStart(2, '0'); }

function formatDateLine(d) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function nowISODate(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function secondsToHrMin(sec) {
  const hr = Math.floor(sec / 3600);
  const min = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${hr} hr ${min} min ${s}s`;
}

function parseTimeStr(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
}

function formatTime(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatHHMM(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function loadSaved(callback) {
  const key = STORAGE_KEY_PREFIX + nowISODate();
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get([key], res => callback(res[key] || null));
  } else {
    callback(null);
  }
}

function saveToday(data, cb) {
  const key = STORAGE_KEY_PREFIX + nowISODate();
  const obj = {};
  obj[key] = data;
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set(obj, cb);
  } else {
    cb && cb();
  }
}

function clearToday(cb) {
  const key = STORAGE_KEY_PREFIX + nowISODate();
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.remove([key], cb);
  } else {
    cb && cb();
  }
}

function updateHeaderProgress(headerBar, inDate) {
  const now = new Date();
  const workSec = 7 * 3600; // 7 hours
  const elapsedSec = Math.floor((now - inDate) / 1000);
  let progress = Math.min(Math.max(elapsedSec / workSec, 0), 1); // 0 → 1
  const percent = Math.floor(progress * 100);

  let progressColor = '';
  let remainingColor = '';

  if (progress <= 0.5) {
    progressColor = '#ece07c';
    remainingColor = '#eee';
  } else {
    progressColor = '#bef2b6';
    remainingColor = '#f3cbcb';
  }

  if (headerBar) headerBar.style.background = `linear-gradient(to right, ${progressColor} 0%, ${progressColor} ${percent}%, ${remainingColor} ${percent}%, ${remainingColor} 100%)`;
}

let savedData = null;
let tickInterval = null;
function tick(selectors) {
  const { clockEl, elapsedEl, expectedCheckoutEl, remainingEl, headerBar } = selectors;
  const now = new Date();
  if (clockEl) clockEl.textContent = formatTime(now);

  if (!savedData || !savedData.inTime) {
    if (elapsedEl) elapsedEl.textContent = '--';
    if (expectedCheckoutEl) expectedCheckoutEl.textContent = '--:--';
    if (remainingEl) remainingEl.textContent = 'Time Remaining: --';
    if (headerBar) headerBar.style.backgroundSize = '0% 100%';
    return;
  }

  const inDate = parseTimeStr(savedData.inTime);
  const elapsedSec = Math.floor((now - inDate) / 1000);
  if (elapsedEl) elapsedEl.textContent = secondsToHrMin(elapsedSec);

  const checkout = new Date(inDate.getTime() + 7 * 3600 * 1000);
  if (expectedCheckoutEl) expectedCheckoutEl.textContent = formatHHMM(checkout);

  const remainingSec = Math.floor((checkout - now) / 1000);
  if (remainingEl) {
    if (remainingSec > 0) {
      const hrs = Math.floor(remainingSec / 3600);
      const mins = Math.floor((remainingSec % 3600) / 60);
      const secs = remainingSec % 60;
      remainingEl.textContent = `Remaining: ${hrs} hr ${mins} min ${secs}s`;
    } else {
      remainingEl.textContent = `✅ 7 hours completed!`;
    }
  }

  if (savedData && savedData.inTime) {
    updateHeaderProgress(headerBar, inDate);
  }
}

function init() {
  // Query DOM elements (components should already be loaded by the caller)
  const clockEl = document.getElementById('clock');
  const todayLine = document.getElementById('todayLine');
  const inTimeInput = document.getElementById('inTime');
  const saveBtn = document.getElementById('saveBtn');
  const clearBtn = document.getElementById('clearBtn');
  const elapsedEl = document.getElementById('elapsed');
  const expectedCheckoutEl = document.getElementById('expectedCheckout');
  const remainingEl = document.getElementById('remaining');
  const headerBar = document.querySelector('.header-bar');
  const testBtn = document.getElementById('testBtn');

  if (todayLine) todayLine.textContent = formatDateLine(new Date());

  loadSaved(saved => {
    savedData = saved;
    if (saved && saved.inTime && inTimeInput) inTimeInput.value = saved.inTime;
    tick({ clockEl, elapsedEl, expectedCheckoutEl, remainingEl, headerBar });
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = setInterval(() => tick({ clockEl, elapsedEl, expectedCheckoutEl, remainingEl, headerBar }), 1000);
  });

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const val = document.getElementById('inTime')?.value;
      if (!val) return alert('Please enter IN time.');
      savedData = { inTime: val, savedAt: new Date().toISOString() };
      saveToday(savedData, () => {
        const btn = document.getElementById('saveBtn');
        if (btn) btn.textContent = 'Saved ✓';
        setTimeout(() => { if (btn) btn.textContent = 'Check IN' }, 900);
      });
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm("Reset today's IN time?")) return;
      clearToday(() => {
        savedData = null;
        const input = document.getElementById('inTime');
        if (input) input.value = '';
        tick({ clockEl, elapsedEl, expectedCheckoutEl, remainingEl, headerBar });
      });
    });
  }

  if (testBtn) {
    testBtn.addEventListener('click', () => {
      try { chrome.runtime.sendMessage({ type: "TEST_NOTIFICATION" }); } catch(e){ console.warn('chrome runtime not available', e) }
    });
  }
}

// Expose initializer so external loaders can call when components are present
window.workAssistanceInit = init;
// index.js (popup script)
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const testBtn = document.getElementById('testNotif');
const test1hr = document.getElementById('test1hr');
const test5min = document.getElementById('test5min');
const status = document.getElementById('status');

function setStatus(text) {
	status.textContent = 'Status: ' + text;
}

startBtn.addEventListener('click', async () => {
	// Save current time as IN in storage
	const now = new Date();
	const hh = now.getHours().toString().padStart(2, '0');
	const mm = now.getMinutes().toString().padStart(2, '0');
	const key = 'audi_in_' + now.toISOString().slice(0,10);
	await chrome.storage.local.set({ [key]: { inTime: `${hh}:${mm}` } });
	setStatus('shift started at ' + `${hh}:${mm}`);
});

stopBtn.addEventListener('click', async () => {
	// Remove today's in time
	const key = 'audi_in_' + new Date().toISOString().slice(0,10);
	await chrome.storage.local.remove([key]);
	setStatus('shift stopped');
});

function sendTest(type) {
	chrome.runtime.sendMessage({ type }, (resp) => {
		if (resp && resp.ok) {
			setStatus(resp.message);
		} else {
			setStatus('no response');
		}
	});
}

testBtn.addEventListener('click', () => sendTest('TEST_NOTIFICATION'));
test1hr.addEventListener('click', () => sendTest('TEST_1HR'));
test5min.addEventListener('click', () => sendTest('TEST_5MIN'));

// On load, show current stored IN time if any
(async function init() {
	const key = 'audi_in_' + new Date().toISOString().slice(0,10);
	const res = await chrome.storage.local.get([key]);
	if (res && res[key] && res[key].inTime) {
		setStatus('shift started at ' + res[key].inTime);
	} else {
		setStatus('idle');
	}
})();
