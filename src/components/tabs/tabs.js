// ===== Main tabs =====
document.querySelectorAll('.tab-button').forEach(button => {
	button.addEventListener('click', () => {
		const targetTabId = button.dataset.tab;
		const targetTab = document.getElementById(targetTabId);

		// Remove active from all tabs
		document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
		document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

		// Set active
		button.classList.add('active');
		targetTab.classList.add('active');

		// Lazy-load Profile & Settings inside tab3
		if (targetTabId === 'tab3') {
			const profileContainer = document.getElementById('screen-profileAndSetting');
			if (profileContainer && !profileContainer.hasChildNodes()) {
				fetch('src/screens/profileAndSetting/profileAndSetting.html')
					.then(res => res.text())
					.then(html => {
						profileContainer.innerHTML = html;

						// Load CSS
						const link = document.createElement('link');
						link.rel = 'stylesheet';
						link.href = 'src/screens/profileAndSetting/profileAndSetting.css';
						document.head.appendChild(link);

						// Load JS
						const script = document.createElement('script');
						script.src = 'src/screens/profileAndSetting/profileAndSetting.js';
						document.body.appendChild(script);
					});
			}
		}
	});
});

// ===== Sub-tabs (inside tab2) =====
document.querySelectorAll('.sub-tab-button').forEach(button => {
	button.addEventListener('click', () => {
		const targetSubTabId = button.dataset.subtab;

		// Remove active from all sub-tabs
		document.querySelectorAll('.sub-tab-button').forEach(btn => btn.classList.remove('active'));
		document.querySelectorAll('.sub-tab-content').forEach(content => content.classList.remove('active'));

		// Set active
		button.classList.add('active');
		document.getElementById(targetSubTabId).classList.add('active');
	});
});
