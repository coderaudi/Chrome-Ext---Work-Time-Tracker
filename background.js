// background.js
// Chrome Extension Background Script
// Handles:
// 1️⃣ Audi Work Tracker Reminders (1-hour, 5-min, shift completed)
// 2️⃣ Persistent Health Reminders (Water, Eye Break, Stretch/Walk)
// 3️⃣ Manual test notifications
// 4️⃣ Notification clicks & optional snooze

// ------------------------------
// Section 0: Constants & State
// ------------------------------
const IN_KEY_PREFIX = 'audi_in_';
const NOTIFIED_PREFIX = 'audi_notified_';

// Health reminders configuration
const HEALTH_REMINDERS = {
	water: { title: '💧 Water Reminder', message: 'Time for a sip! Take a few sips of water 💦', intervalSec: 10 },  // 10 sec for testing
	eye: { title: '👀 Eye Break', message: 'Look away from the screen for 20 seconds.', intervalSec: 10 },
	stretch: { title: '🏃 Walk / Stretch Break', message: 'Stand up and stretch for 2–3 minutes 🧘‍♂️', intervalSec: 10 }
};

// Track active health reminders to avoid duplicates
const activeHealthReminders = {};
// Track if all health reminders are globally stopped
let healthRemindersStopped = false;
// ------------------------------
// Section 1: Utility Functions
// ------------------------------

// Get today's ISO date (YYYY-MM-DD)
function todayISO(d = new Date()) {
	return d.toISOString().slice(0, 10);
}

// Send a Chrome notification
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

// ------------------------------
// Section 2: Audi Work Tracker Reminders
// ------------------------------

// Create/check alarm on install/startup
chrome.runtime.onInstalled.addListener(() => {
	console.log('Audi Time Tracker background installed');
	chrome.alarms.create('checkExitTime', { periodInMinutes: 1 });
});
chrome.runtime.onStartup.addListener(() => {
	console.log('Audi Time Tracker background started');
	chrome.alarms.create('checkExitTime', { periodInMinutes: 1 });
});

// Check exit time and send work reminders
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

		// 1-hour reminder
		if (!flags.oneHourSent && diffMin <= 60.5 && diffMin > 59.0) {
			sendNotification(
				'Checkout in 1 hour ⏳',
				`Hey Audi — your checkout is at ${checkout.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. 1 hour left.`
			);
			flags.oneHourSent = true;
		}

		// 5-minute reminder
		if (!flags.fiveMinSent && diffMin <= 5.5 && diffMin > 4.0) {
			sendNotification(
				'Checkout in 5 minutes ⏰',
				`Hey Audi — your checkout is at ${checkout.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. 5 minutes left.`
			);
			flags.fiveMinSent = true;
		}

		// Completion notice
		if (!flags.completedSent && diffMin <= 0.5 && diffMin > -30) {
			sendNotification(
				'Shift Completed ✅',
				`Great! Your 7-hour shift completed at ${checkout.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
			);
			flags.completedSent = true;
		}

		// persist updated flags
		chrome.storage.local.set({ [notifyKey]: flags }, () => {
			const minutesPast = (now - checkout) / 60000;
			if (minutesPast > 120) {
				chrome.storage.local.remove([notifyKey], () => { });
			}
		});
	});
}

// ------------------------------
// Section 3: Handle Incoming Messages (Popup / UI triggers)
// ------------------------------
chrome.runtime.onMessage.addListener((msg, sender, sendResp) => {
	if (!msg || !msg.type) return;

	switch (msg.type) {

		// --------------------------
		// Manual test notifications
		// --------------------------
		case 'TEST_NOTIFICATION':
			sendNotification('Work Time Tracker! 🔔', '⏰ You’ll receive 2 reminders before checkout — 1️⃣ hour before and another 5️⃣ minutes before your shift ends.');
			sendResp({ ok: true });
			break;

		case 'TEST_1HR':
			sendNotification('Reminder ⏳', 'You have 1 hour remaining before your checkout time. Please wrap up your ongoing tasks.');
			sendResp({ ok: true });
			break;

		case 'TEST_5MIN':
			sendNotification('Final Reminder ⏰', 'Only 5 minutes left until checkout. Save your work and prepare to log out.');
			sendResp({ ok: true });
			break;

		case 'TEST_COMPLETE':
			sendNotification('Shift Completed ✅', 'Good job today! Your shift time is completed.');
			sendResp({ ok: true });
			break;

		// --------------------------
		// Health Reminder (manual single notification)
		// --------------------------
		case 'HEALTH_REMINDER':
			sendNotification('Take care of your health', 'Take care of your health while working !!!');
			sendResp({ ok: true });
			break;

		// --------------------------
		// START a persistent health reminder
		// --------------------------
		case 'START_HEALTH_REMINDER': {
			const type = msg.reminderType;
			healthRemindersStopped = false; // reset global stop

			if (!HEALTH_REMINDERS[type]) break;

			// Only start if globally not stopped
			if (!activeHealthReminders[type] && !healthRemindersStopped) {
				chrome.alarms.create('health_' + type, { periodInMinutes: HEALTH_REMINDERS[type].intervalSec / 60 });
				activeHealthReminders[type] = true;

				// Initial notification immediately
				sendNotification(HEALTH_REMINDERS[type].title, HEALTH_REMINDERS[type].message);
			}
			sendResp({ ok: true, message: `${type} reminder started` });
			break;
		}

		// --------------------------
		// STOP all persistent health reminders
		// --------------------------
		case 'STOP_ALL_HEALTH_REMINDERS': {
			// 1️⃣ Clear all alarms
			Object.keys(activeHealthReminders).forEach(type => {
				chrome.alarms.clear('health_' + type, cleared => {
					if (cleared) console.log(`${type} reminder stopped`);
				});
			});

			// 2️⃣ Clear tracker
			for (const key in activeHealthReminders) delete activeHealthReminders[key];

			// 3️⃣ Set global stop flag
			healthRemindersStopped = true;

			// 4️⃣ Respond to popup
			sendResp({ ok: true, message: 'All health reminders stopped' });
			break;
		}

		// --------------------------
		// STOP a single health reminder
		// --------------------------
		case 'STOP_HEALTH_REMINDER': {
			const type = msg.reminderType;
			if (type && activeHealthReminders[type]) {
				chrome.alarms.clear('health_' + type, cleared => {
					if (cleared) console.log(`${type} reminder stopped`);
				});
				delete activeHealthReminders[type];
			}
			sendResp({ ok: true, message: `${type} reminder stopped` });
			break;
		}


		default:
			console.warn('Unknown message type:', msg.type);
			break;
	}

	return true; // keep message channel open
});

// ------------------------------
// Section 4: Handle Chrome Alarms
// ------------------------------
chrome.alarms.onAlarm.addListener((alarm) => {
	// Health reminders
	if (alarm.name.startsWith('health_')) {
		if (healthRemindersStopped) return; // HARD STOP: do nothing

		const type = alarm.name.replace('health_', '');
		const reminder = HEALTH_REMINDERS[type];
		if (reminder) sendNotification(reminder.title, reminder.message);
	}

	// Work tracker alarms
	if (alarm.name === 'checkExitTime') checkForReminder();

	// Snooze alarms (optional)
	if (alarm.name && alarm.name.startsWith('snooze_')) {
		chrome.notifications.create({
			type: 'basic',
			iconUrl: 'icons/icon128.png',
			title: 'Snoozed Reminder ⏰',
			message: 'This is your snoozed reminder — time to wrap up.',
			priority: 2
		});
	}
});

// ------------------------------
// Section 5: Notification Clicks & Buttons
// ------------------------------
chrome.notifications.onClicked.addListener((notificationId) => {
	console.log('Notification clicked:', notificationId);
	chrome.notifications.create({
		type: 'basic',
		iconUrl: 'icons/icon128.png',
		title: 'Thanks for checking!',
		message: 'You clicked the reminder — don\'t forget to finish up and logout on time.',
		priority: 2
	});
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
	console.log('Notification button clicked:', notificationId, buttonIndex);
	if (buttonIndex === 0) {
		chrome.notifications.create({
			type: 'basic',
			iconUrl: 'icons/icon128.png',
			title: 'Snoozed',
			message: 'Reminder snoozed for 5 minutes.',
			priority: 2
		});
		chrome.alarms.create(`snooze_${Date.now()}`, { delayInMinutes: 5 });
	} else {
		chrome.notifications.create({
			type: 'basic',
			iconUrl: 'icons/icon128.png',
			title: 'Dismissed',
			message: 'Reminder dismissed.',
			priority: 2
		});
	}
});
