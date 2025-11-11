// src/screens/header/header.js

function personalizeHeader() {
	const headerH1 = document.querySelector('.header-bar h1');
	const todayLine = document.getElementById('todayLine');
	if (!headerH1) return false; // Return false if header not yet loaded

	const profile = JSON.parse(localStorage.getItem('workAssistProfile') || '{}');
	const username = profile.name?.trim();

	headerH1.innerHTML = username
		? `<strong>${username}'s</strong> Work Assistant`
		: `<strong>Your</strong> Work Assistant`;

	if (todayLine) todayLine.textContent = new Date().toDateString();

	return true; // Header updated successfully
}

// Wait for header to exist, retry every 100ms until found
const waitForHeader = setInterval(() => {
	if (personalizeHeader()) clearInterval(waitForHeader);
}, 100);


