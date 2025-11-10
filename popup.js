// Audi Time Tracker with live-updating Remaining Time & Gradient Header Progress
const clockEl = document.getElementById('clock');
const todayLine = document.getElementById('todayLine');
const inTimeInput = document.getElementById('inTime');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const elapsedEl = document.getElementById('elapsed');
const expectedCheckoutEl = document.getElementById('expectedCheckout');
const remainingEl = document.getElementById('remaining');
const headerBar = document.querySelector('.header-bar');
const testBtn = document.getElementById("testBtn");

const STORAGE_KEY_PREFIX = 'audi_in_';

// Utilities
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

// Chrome storage helpers
function loadSaved(callback) {
	const key = STORAGE_KEY_PREFIX + nowISODate();
	chrome.storage.local.get([key], res => callback(res[key] || null));
}

function saveToday(data, cb) {
	const key = STORAGE_KEY_PREFIX + nowISODate();
	const obj = {};
	obj[key] = data;
	chrome.storage.local.set(obj, cb);
}

function clearToday(cb) {
	const key = STORAGE_KEY_PREFIX + nowISODate();
	chrome.storage.local.remove([key], cb);
}


// Function to interpolate colors
function interpolateColor(color1, color2, factor) {
	const result = color1.slice();
	for (let i = 0; i < 3; i++) {
		result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
	}
	return result;
}

function rgbToCSS(rgb) {
	return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}



// Progress calculation
function updateHeaderProgress(inDate) {
	const now = new Date();
	const workSec = 7 * 3600; // 7 hours
	const elapsedSec = Math.floor((now - inDate) / 1000);
	let progress = Math.min(Math.max(elapsedSec / workSec, 0), 1); // 0 → 1
	const percent = Math.floor(progress * 100);

	let progressColor = '';
	let remainingColor = '';

	if (progress <= 0.5) {
		// first half: progress in orange, remaining in gray
		progressColor = '#ece07c';
		remainingColor = '#eee';
	} else {
		// second half: progress in green, remaining in red
		progressColor = '#bef2b6';
		remainingColor = '#f3cbcb';
	}

	// Apply linear-gradient: progress portion first, then remaining
	// e.g., 30% progress: 30% orange, 70% gray
	headerBar.style.background = `linear-gradient(to right, 
	  ${progressColor} 0%, ${progressColor} ${percent}%, 
	  ${remainingColor} ${percent}%, ${remainingColor} 100%)`;
}

// Main live tick
let savedData = null;
function tick() {
	const now = new Date();
	clockEl.textContent = formatTime(now);

	if (!savedData || !savedData.inTime) {
		elapsedEl.textContent = '--';
		expectedCheckoutEl.textContent = '--:--';
		remainingEl.textContent = 'Time Remaining: --';
	  headerBar.style.backgroundSize = '0% 100%';
	  return;
  }

	const inDate = parseTimeStr(savedData.inTime);
	const elapsedSec = Math.floor((now - inDate) / 1000);
	elapsedEl.textContent = secondsToHrMin(elapsedSec);

	const checkout = new Date(inDate.getTime() + 7 * 3600 * 1000);
	expectedCheckoutEl.textContent = formatHHMM(checkout);

	const remainingSec = Math.floor((checkout - now) / 1000);
	if (remainingSec > 0) {
		const hrs = Math.floor(remainingSec / 3600);
	  const mins = Math.floor((remainingSec % 3600) / 60);
	  const secs = remainingSec % 60;
	  remainingEl.textContent = `Remaining: ${hrs} hr ${mins} min ${secs}s`;
  } else {
	  remainingEl.textContent = `✅ 7 hours completed!`;
  }

	// Update header gradient progress
	if (savedData && savedData.inTime) {
		const inDate = parseTimeStr(savedData.inTime);
		updateHeaderProgress(inDate); // <- update header progress
	}
}

// Initialization
function init() {
	todayLine.textContent = formatDateLine(new Date());
	loadSaved(saved => {
		savedData = saved;
		if (saved && saved.inTime) inTimeInput.value = saved.inTime;
		tick();
		setInterval(tick, 1000); // live update every second
	});
}

// Event Listeners
saveBtn.addEventListener('click', () => {
	const val = inTimeInput.value;
	if (!val) return alert('Please enter IN time.');
	savedData = { inTime: val, savedAt: new Date().toISOString() };
	saveToday(savedData, () => {
		saveBtn.textContent = 'Saved ✓';
	  setTimeout(() => (saveBtn.textContent = 'Check IN'), 900);
  });
});

clearBtn.addEventListener('click', () => {
	if (!confirm("Reset today's IN time?")) return;
	clearToday(() => {
		savedData = null;
		inTimeInput.value = '';
		tick();
	});
});

testBtn.addEventListener('click', () => {
	chrome.runtime.sendMessage({ type: "TEST_NOTIFICATION" });
});

// Start
init();
