// src/screens/profileAndSettings/profileAndSettings.js

// Hash password using SHA-256
async function hashPassword(password) {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Save profile settings
async function saveProfile() {
	const name = document.getElementById('userName').value.trim();
	const password = document.getElementById('userPassword').value.trim();

	// Get checked reminders
	const activeReminders = Array.from(document.querySelectorAll('.reminder-checkboxes input[type="checkbox"]:checked'))
		.map(cb => cb.dataset.type);

	const dataToStore = {
		user: {
			name,
			passwordHash: password ? await hashPassword(password) : undefined,
			reminders: activeReminders
		}
	};

	chrome.storage.local.set(dataToStore, () => {
		const status = document.getElementById('statusMsg');
		status.textContent = '✅ Settings saved!';
		setTimeout(() => status.textContent = '', 2000);
	});
}

// Load saved profile
function loadProfile() {
	chrome.storage.local.get('user', ({ user }) => {
		if (!user) return;
		if (user.name) document.getElementById('userName').value = user.name;
		if (user.reminders) {
			document.querySelectorAll('.reminder-checkboxes input[type="checkbox"]').forEach(cb => {
				cb.checked = user.reminders.includes(cb.dataset.type);
			});
		}
	});
}

function attachProfileHandlers() {
	const card = document.getElementById('profileCard');
	if (!card) return;

	const toggle = card.querySelector('.health-toggle');
	if (toggle && !toggle.dataset.attached) {
		toggle.dataset.attached = '1';
		toggle.addEventListener('click', () => {
			card.classList.toggle('health-open');
			toggle.setAttribute('aria-expanded', card.classList.contains('health-open'));
		});
	}

	const nameInput = document.getElementById('profileName');
	const passwordInput = document.getElementById('profilePassword');
	const reminderSelect = document.getElementById('profileDefaultReminder');
	const saveBtn = document.getElementById('saveProfileBtn');

	// Load saved profile from localStorage
	const savedProfile = JSON.parse(localStorage.getItem('workAssistProfile') || '{}');
	if (savedProfile.name) nameInput.value = savedProfile.name;
	if (savedProfile.password) passwordInput.value = savedProfile.password;
	if (savedProfile.defaultReminder) reminderSelect.value = savedProfile.defaultReminder;

	if (saveBtn && !saveBtn.dataset.attached) {
		saveBtn.dataset.attached = '1';
		saveBtn.addEventListener('click', () => {
			const name = nameInput.value.trim();
			const password = passwordInput.value.trim();
			const defaultReminder = reminderSelect.value;

			localStorage.setItem('workAssistProfile', JSON.stringify({ name, password, defaultReminder }));

			// Show small green message
			let msg = card.querySelector('.save-msg');
			if (!msg) {
				msg = document.createElement('div');
				msg.className = 'save-msg';
				card.querySelector('.profile-form').appendChild(msg);
			}
			msg.textContent = '✅ Settings saved locally';
			msg.style.color = 'green';
			msg.style.fontSize = '12px';
			msg.style.marginTop = '6px';

			// Auto-hide after 3s
			setTimeout(() => { msg.textContent = ''; }, 3000);
		});
	}
}

attachProfileHandlers();
new MutationObserver(() => attachProfileHandlers()).observe(document.body, { childList: true, subtree: true });


// Event listener
document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);

// Initialize
document.addEventListener('DOMContentLoaded', loadProfile);
