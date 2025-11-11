// src/screens/workCheckIn/checkIn.js
const inTimeInput = document.getElementById('inTime');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const elapsedEl = document.getElementById('elapsed');

const STORAGE_KEY_PREFIX = 'audi_in_';

function pad(n) { return n.toString().padStart(2, '0'); }

function nowISODate(d = new Date()) {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseTimeStr(timeStr) {
	if (!timeStr) return null;
	const [h, m] = timeStr.split(':').map(Number);
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
}

function secondsToHrMin(sec) {
	const hr = Math.floor(sec / 3600);
	const min = Math.floor((sec % 3600) / 60);
	const s = sec % 60;
	return `${hr} hr ${min} min ${s}s`;
}

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

let savedData = null;

function updateElapsed() {
	if (!savedData || !savedData.inTime) {
		elapsedEl.textContent = '--';
		return;
	}
	const inDate = parseTimeStr(savedData.inTime);
	const now = new Date();
	const elapsedSec = Math.floor((now - inDate) / 1000);
	elapsedEl.textContent = secondsToHrMin(elapsedSec);
}

// Event Listeners
saveBtn.addEventListener('click', () => {
	const val = inTimeInput.value;
	if (!val) return alert('Please enter IN time.');
	savedData = { inTime: val, savedAt: new Date().toISOString() };
	saveToday(savedData, () => {
		saveBtn.textContent = 'Saved ✓';
		setTimeout(() => (saveBtn.textContent = 'Check IN'), 900);
		updateElapsed();
		// Update clock checkout time
		if (window.setCheckInTime) window.setCheckInTime(val);
	});
});

clearBtn.addEventListener('click', () => {
	if (!confirm("Reset today's IN time?")) return;
	clearToday(() => {
		savedData = null;
		inTimeInput.value = '';
		updateElapsed();
		// Reset checkout time
		if (window.setCheckInTime) window.setCheckInTime(null);
	});
});

// Initialization
function initCheckIn() {
	loadSaved(saved => {
		savedData = saved;
		if (saved && saved.inTime) inTimeInput.value = saved.inTime;
		updateElapsed();
		// Set initial checkout time
		if (window.setCheckInTime && saved && saved.inTime) {
			window.setCheckInTime(saved.inTime);
		}
		setInterval(updateElapsed, 1000);
	});
}

// Auto-run init
initCheckIn();
