// src/screens/workCheckIn/progressClock/clock.js

// DOM Elements
const clockEl = document.getElementById('clock');
const todayLine = document.getElementById('todayLine');
const expectedCheckoutEl = document.getElementById('expectedCheckout');
const remainingEl = document.getElementById('remaining');
const headerBar = document.querySelector('.header-bar');

// Constants
const WORK_HOURS = 7; // 7 hours work day

// Utility functions
function pad(n) { return n.toString().padStart(2, '0'); }

function formatTime(d) {
	return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatHHMM(d) {
	return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateLine(d) {
	const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	return `${days[d.getDay()]}, ${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function parseTimeStr(timeStr) {
	if (!timeStr) return null;
	const [h, m] = timeStr.split(':').map(Number);
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
}

// Progress Bar Update
function updateHeaderProgress(inDate) {
	if (!headerBar || !inDate) return;

	const now = new Date();
	const workSec = WORK_HOURS * 3600;
	const elapsedSec = Math.floor((now - inDate) / 1000);
	const progress = Math.min(Math.max(elapsedSec / workSec, 0), 1); // 0 → 1
	const percent = Math.floor(progress * 100);

	let progressColor = '';
	let remainingColor = '';

	if (progress < 0.5) {
		// Less than 50% done → yellow + gray
		progressColor = '#ece07c';
		remainingColor = '#eee';
	} else {
		// 50% or more done → green + red
		progressColor = '#8bd98b';
		remainingColor = '#f08080';
	}

	headerBar.style.background = `linear-gradient(to right, 
        ${progressColor} 0%, ${progressColor} ${percent}%, 
        ${remainingColor} ${percent}%, ${remainingColor} 100%)`;
}

// Global variable for check-in
let checkInTime = null;

// Tick function to update UI every second
function tick() {
	const now = new Date();
	if (clockEl) clockEl.textContent = formatTime(now);

	if (!checkInTime) {
		if (expectedCheckoutEl) expectedCheckoutEl.textContent = '--:--';
		if (remainingEl) remainingEl.textContent = 'Remaining: --';
		updateHeaderProgress(null);
		return;
	}

	const inDate = parseTimeStr(checkInTime);
	const checkout = new Date(inDate.getTime() + WORK_HOURS * 3600 * 1000);

	// Checkout time
	if (expectedCheckoutEl) expectedCheckoutEl.textContent = formatHHMM(checkout);

	// Remaining time
	const remainingSec = Math.floor((checkout - now) / 1000);
	if (remainingSec > 0) {
		const hrs = Math.floor(remainingSec / 3600);
		const mins = Math.floor((remainingSec % 3600) / 60);
		const secs = remainingSec % 60;
		if (remainingEl) remainingEl.textContent = `Remaining: ${hrs} hr ${mins} min ${secs}s`;
	} else {
		if (remainingEl) remainingEl.textContent = '✅ Work completed!';
	}

	// Update progress bar
	updateHeaderProgress(inDate);
}

// Set check-in time from outside (from checkIn.js)
window.setCheckInTime = function (timeStr) {
	checkInTime = timeStr;
	tick(); // update UI immediately
};

// Initialize
function initClock() {
	if (todayLine) todayLine.textContent = formatDateLine(new Date());
	tick();
	setInterval(tick, 1000);
}

// Run
initClock();
