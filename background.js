// background.js
// Sends notifications at ~1 hour, ~5 minutes before checkout and when 7 hours complete.
// Stores per-day flags so each reminder is sent only once per day.
// Also supports manual test messages: TEST_NOTIFICATION, TEST_1HR, TEST_5MIN, TEST_COMPLETE

const IN_KEY_PREFIX = 'audi_in_';
const NOTIFIED_PREFIX = 'audi_notified_';

// create/check alarm on install/startup
chrome.runtime.onInstalled.addListener(() => {
	console.log('Audi Time Tracker background installed');
	chrome.alarms.create('checkExitTime', { periodInMinutes: 1 });
});
chrome.runtime.onStartup.addListener(() => {
	console.log('Audi Time Tracker background started');
	chrome.alarms.create('checkExitTime', { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name === 'checkExitTime') checkForReminder();
});

// Utility: todays ISO date (YYYY-MM-DD)
function todayISO(d = new Date()) {
	return d.toISOString().slice(0, 10);
}

// send a chrome notification
function sendNotification(title, message) {
	chrome.notifications.create({
		type: 'basic',
		iconUrl: 'icons/icon128.png',
		title,
		message,
		priority: 2
	}, id => {
		console.log('Notification created:', id, title, message);
	});
}

function checkForReminder() {
	const today = todayISO();
	const inKey = IN_KEY_PREFIX + today;
	const notifyKey = NOTIFIED_PREFIX + today;

	chrome.storage.local.get([inKey, notifyKey], (res) => {
		const saved = res[inKey];
		let flags = res[notifyKey] || { oneHourSent: false, fiveMinSent: false, completedSent: false };

		if (!saved || !saved.inTime) {
			// no IN time -> clean up stale flags if any
			if (flags.oneHourSent || flags.fiveMinSent || flags.completedSent) {
				chrome.storage.local.remove([notifyKey], () => { });
			}
			return;
		}

		// parse saved.inTime (HH:MM)
		const [h, m] = saved.inTime.split(':').map(Number);
		const inDate = new Date();
		inDate.setHours(h, m, 0, 0);

		const checkout = new Date(inDate.getTime() + 7 * 3600 * 1000);
		const now = new Date();
		const diffMin = (checkout - now) / 60000; // minutes until checkout

		// 1-hour reminder (approx)
		if (!flags.oneHourSent && diffMin <= 60.5 && diffMin > 59.0) {
			sendNotification(
				'Checkout in 1 hour ⏳',
				`Hey Audi — your checkout is at ${checkout.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. 1 hour left.`
			);
			flags.oneHourSent = true;
		}

		// 5-minute reminder (approx)
		if (!flags.fiveMinSent && diffMin <= 5.5 && diffMin > 4.0) {
			sendNotification(
				'Checkout in 5 minutes ⏰',
				`Hey Audi — your checkout is at ${checkout.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. 5 minutes left.`
			);
			flags.fiveMinSent = true;
		}

		// COMPLETION notice: when checkout time has arrived / just passed
		// Use a tolerance window so the alarm minute granularity won't miss it.
		// Fire once when diffMin <= 0.5 and diffMin > -30 (within 30 minutes after checkout)
		if (!flags.completedSent && diffMin <= 0.5 && diffMin > -30) {
			sendNotification(
				'Shift Completed ✅',
				`Great! Your 7-hour shift completed at ${checkout.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
			);
			flags.completedSent = true;
		}

		// persist updated flags
		chrome.storage.local.set({ [notifyKey]: flags }, () => {
			// optional cleanup: if it's long past checkout (e.g., > 2 hours), clear flags for next day
			const minutesPast = (now - checkout) / 60000;
			if (minutesPast > 120) {
				chrome.storage.local.remove([notifyKey], () => { });
			}
		});
	});
}

// Listen for manual test messages from popup or UI actions
chrome.runtime.onMessage.addListener((msg, sender, sendResp) => {
	if (!msg || !msg.type) return;

	switch (msg.type) {
		case 'TEST_NOTIFICATION':
			sendNotification(
				'Work Time Tracker! 🔔',
				'⏰ You’ll receive 2 reminders before checkout — 1️⃣ hour before and another 5️⃣ minutes before your shift ends.'
			);

			sendResp({ ok: true, message: 'Test notification sent successfully.' });
			break;

		case 'TEST_1HR':
			sendNotification(
				'Reminder ⏳',
				'You have 1 hour remaining before your checkout time. Please wrap up your ongoing tasks.'
			);
			sendResp({ ok: true, message: '1-hour reminder test sent.' });
			break;

		case 'TEST_5MIN':
			sendNotification(
				'Final Reminder ⏰',
				'Only 5 minutes left until checkout. Save your work and prepare to log out.'
			);
			sendResp({ ok: true, message: '5-minute reminder test sent.' });
			break;

		case 'TEST_COMPLETE':
			sendNotification(
				'Shift Completed ✅',
				'Good job today! Your shift time is completed. Don’t forget to log your work summary if required.'
			);
			sendResp({ ok: true, message: 'Shift complete test sent.' });
			break;

		default:
			console.warn('Unknown message type:', msg.type);
			break;
	}

	// Keep the message channel open if sendResp is used asynchronously
	return true;
});