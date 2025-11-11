// src/screens/progressClock/clock.js
(() => {
	const clockEl = document.getElementById('clock');
	const remainingEl = document.getElementById('remaining');
	const expectedCheckoutEl = document.getElementById('expectedCheckout');

	if (!clockEl) return;

	const WORK_HOURS = 9; // default working hours duration

	function pad(n) { return n.toString().padStart(2, '0'); }

	let checkInDate = null; // will store today's check-in time
	let checkoutDate = null; // will store computed checkout time

	function secondsToHrMin(sec) {
		const hr = Math.floor(sec / 3600);
		const min = Math.floor((sec % 3600) / 60);
		const s = sec % 60;
		return `${hr} hr ${min} min ${s}s`;
	}

	// Function to update the clock and remaining time
	function updateClock() {
		const now = new Date();
		clockEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

		if (checkInDate && checkoutDate) {
			let remainingMs = checkoutDate - now;
			if (remainingMs < 0) remainingMs = 0;

			// Today's Progress (remaining time)
			const remH = Math.floor(remainingMs / (1000 * 60 * 60));
			const remM = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
			const remS = Math.floor((remainingMs % (1000 * 60)) / 1000);
			remainingEl.textContent = `${remH} hr ${remM} min ${remS}s`;

			// Color coding
			if (remainingMs > 3 * 3600 * 1000) {
				remainingEl.style.color = 'green';
			} else if (remainingMs > 1 * 3600 * 1000) {
				remainingEl.style.color = 'orange';
			} else {
				remainingEl.style.color = 'red';
			}

			// Checkout At
			expectedCheckoutEl.textContent = `${pad(checkoutDate.getHours())}:${pad(checkoutDate.getMinutes())}`;
		} else {
			remainingEl.textContent = '--';
			expectedCheckoutEl.textContent = '--:--';
			remainingEl.style.color = '';
		}
	}

	// Function to set check-in time from checkIn.js
	window.setCheckInTime = (inTimeStr) => {
		if (!inTimeStr) {
			checkInDate = null;
			checkoutDate = null;
		} else {
			const [h, m] = inTimeStr.split(':').map(Number);
			const now = new Date();
			checkInDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
			checkoutDate = new Date(checkInDate.getTime() + WORK_HOURS * 3600 * 1000);
		}
		updateClock(); // update immediately
	};

	// Update clock every second
	setInterval(updateClock, 1000);
})();
