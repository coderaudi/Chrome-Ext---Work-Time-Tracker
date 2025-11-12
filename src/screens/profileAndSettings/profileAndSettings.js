// src/screens/profileAndSettings/profileAndSettings.js

// Hash password using SHA-256
async function hashPassword(password) {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Update header H1 based on saved name
function updateHeaderName() {
	const headerH1 = document.querySelector('.header-bar h1');
	if (!headerH1) return;

	const profile = JSON.parse(localStorage.getItem('workAssistProfile') || '{}');
	const username = profile.name?.trim();

	if (username) {
		headerH1.innerHTML = `<strong>${username}'s</strong> Work Assistant`;
	} else {
		headerH1.innerHTML = `<strong>Your</strong> Work Assistant`;
	}
}

// Save profile settings to Chrome storage and localStorage
async function saveProfile() {
	const name = document.getElementById('profileName').value.trim();
	// const password = document.getElementById('profilePassword').value.trim();
	// const reminderSelect = document.getElementById('profileDefaultReminder');

	// Save locally
	const profileData = {
		name,
		// password,
		// defaultReminder: reminderSelect.value
	};
	localStorage.setItem('workAssistProfile', JSON.stringify(profileData));

	// Update header dynamically
	updateHeaderName();

	// Save to Chrome storage with password hash
	const dataToStore = {
		user: {
			name,
			// passwordHash: password ? await hashPassword(password) : undefined,
			// reminders: [] // can add reminder checkboxes if needed
		}
	};
	chrome.storage.local.set(dataToStore, () => {
		const status = document.getElementById('statusMsg');
		if (status) {
			status.textContent = '✅ Settings saved!';
			setTimeout(() => status.textContent = '', 2000);
		}
	});

	// Show small green message
	const card = document.getElementById('profileCard');
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
	setTimeout(() => { msg.textContent = ''; }, 3000);
}

// Attach toggle and save button handlers
function attachProfileHandlers() {
	const card = document.getElementById('profileCard');
	if (!card) return;

	// Collapsible toggle
	const toggle = card.querySelector('.health-toggle');
	if (toggle && !toggle.dataset.attached) {
		toggle.dataset.attached = '1';
		toggle.addEventListener('click', () => {
			card.classList.toggle('health-open');
			toggle.setAttribute('aria-expanded', card.classList.contains('health-open'));
		});
	}

	// Save button
	const saveBtn = document.getElementById('saveProfileBtn');
	if (saveBtn && !saveBtn.dataset.attached) {
		saveBtn.dataset.attached = '1';
		saveBtn.addEventListener('click', saveProfile);
	}
}

// Load saved profile **once on page load**
document.addEventListener('DOMContentLoaded', () => {
	const savedProfile = JSON.parse(localStorage.getItem('workAssistProfile') || '{}');
	if (savedProfile.name) document.getElementById('profileName').value = savedProfile.name;
	// if (savedProfile.password) document.getElementById('profilePassword').value = savedProfile.password;
	// if (savedProfile.defaultReminder) document.getElementById('profileDefaultReminder').value = savedProfile.defaultReminder;

	// Update header
	updateHeaderName();

	// Attach toggle and save button handlers
	attachProfileHandlers();
});

// Observe DOM changes in case the profile card is dynamically loaded
new MutationObserver(() => attachProfileHandlers()).observe(document.body, { childList: true, subtree: true });
