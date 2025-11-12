// src/screens/header/header.js

// ===== PERSONALIZE HEADER =====
function personalizeHeader() {
	const headerH1 = document.querySelector('.header-bar h1');
	const todayLine = document.getElementById('todayLine');
	if (!headerH1) return false;

	const profile = JSON.parse(localStorage.getItem('workAssistProfile') || '{}');
	const username = profile.name?.trim();

	headerH1.innerHTML = username
		? `<strong>${username}'s</strong> Work Assistant`
		: `<strong>Your</strong> Work Assistant`;

	if (todayLine) todayLine.textContent = new Date().toDateString();
	return true;
}

// Retry until header loaded
const waitForHeader = setInterval(() => {
	if (personalizeHeader()) clearInterval(waitForHeader);
  }, 100);

// ===== THEME TOGGLE =====
const themeToggleBtn = document.getElementById('themeToggle');

// Initialize theme from localStorage or default 'light'
let theme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', theme);
themeToggleBtn.setAttribute('aria-pressed', theme === 'dark');
updateToggleIcon();

themeToggleBtn.addEventListener('click', () => {
	theme = theme === 'light' ? 'dark' : 'light';
	document.documentElement.setAttribute('data-theme', theme);
	localStorage.setItem('theme', theme);
	themeToggleBtn.setAttribute('aria-pressed', theme === 'dark');
	updateToggleIcon();
});

function updateToggleIcon() {
	const sun = themeToggleBtn.querySelector('.sun');
	const moon = themeToggleBtn.querySelector('.moon');
	if (theme === 'dark') {
		sun.style.display = 'none';
		moon.style.display = 'inline';
	} else {
		sun.style.display = 'inline';
		moon.style.display = 'none';
	}
}
