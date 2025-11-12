(() => {
	// Longer and advanced text samples
	const textSamples = [
		"Consistency is the key to success in coding. Every day you practice, you sharpen your skills, improve logic, and become a faster developer. Remember to take breaks, stay hydrated, and focus on quality over quantity.",
		"Learning to code is like learning a new language. Patience, persistence, and curiosity will carry you far. Each mistake is an opportunity to grow, and every solved problem strengthens your understanding.",
		"Time management is crucial for developers. Allocate time to learning, building, and relaxing. A balanced schedule ensures steady progress without burnout. Always review your work and aim for incremental improvements.",
		"Advanced developers understand the importance of clean code, readability, and maintainability. Writing efficient code today saves hours of debugging tomorrow. Keep practicing, testing, and refining your skills daily."
	];

	let timer = 60;
	let interval;
	let originalText = "";
	const textEl = document.getElementById("textToType");
	const typingBox = document.getElementById("typingBox");
	const timerEl = document.getElementById("timer");
	const wpmEl = document.getElementById("wpm");
	const accuracyEl = document.getElementById("accuracy");
	const typedCharsEl = document.getElementById("typedChars");
	const restartBtn = document.getElementById("restartBtn");
	const cardBody = document.querySelector(".typemaster-body");
	const toggleBtn = document.querySelector(".toggle-arrow");

	function randomText() {
		return textSamples[Math.floor(Math.random() * textSamples.length)];
	}

	function startTest() {
		originalText = randomText();
		textEl.textContent = originalText;
		typingBox.value = "";
		typingBox.disabled = false;
		typingBox.focus();
		timer = 60;
		timerEl.textContent = `Time: ${timer}s`;
		wpmEl.textContent = `WPM: 0`;
		accuracyEl.textContent = `Accuracy: 0%`;
		typedCharsEl.textContent = `Typed: 0 chars`;

		clearInterval(interval);
		interval = setInterval(() => {
			timer--;
			timerEl.textContent = `Time: ${timer}s`;
			if (timer <= 0) endTest();
		}, 1000);
	}

	function endTest() {
		clearInterval(interval);
		typingBox.disabled = true;
		calculateResults();
	}

	function calculateResults() {
		const typed = typingBox.value;
		const typedWords = typed.split(/\s+/);
		const origWords = originalText.split(/\s+/);

		let correctWords = 0;
		for (let i = 0; i < Math.min(typedWords.length, origWords.length); i++) {
			if (typedWords[i] === origWords[i]) correctWords++;
		}
		const wpm = correctWords;
		wpmEl.textContent = `WPM: ${wpm}`;

		let correctChars = 0;
		for (let i = 0; i < Math.min(typed.length, originalText.length); i++) {
			if (typed[i] === originalText[i]) correctChars++;
		}
		const accuracy = Math.round((correctChars / originalText.length) * 100);
		accuracyEl.textContent = `Accuracy: ${accuracy}%`;
		typedCharsEl.textContent = `Typed: ${typed.length} chars`;
	}

	typingBox.addEventListener("input", () => {
		const typed = typingBox.value;
		if (originalText.startsWith(typed)) {
			typingBox.classList.add("correct");
			typingBox.classList.remove("incorrect");
		} else {
			typingBox.classList.add("incorrect");
			typingBox.classList.remove("correct");
		}

		// Live WPM & Accuracy update while typing
		const typedWords = typed.split(/\s+/);
		const origWords = originalText.split(/\s+/);
		let correctWords = 0;
		for (let i = 0; i < Math.min(typedWords.length, origWords.length); i++) {
			if (typedWords[i] === origWords[i]) correctWords++;
		}
		const wpm = correctWords;
		wpmEl.textContent = `WPM: ${wpm}`;

		let correctChars = 0;
		for (let i = 0; i < Math.min(typed.length, originalText.length); i++) {
			if (typed[i] === originalText[i]) correctChars++;
		}
		const accuracy = Math.round((correctChars / originalText.length) * 100);
		accuracyEl.textContent = `Accuracy: ${accuracy}%`;
		typedCharsEl.textContent = `Typed: ${typed.length} chars`;
	});

	restartBtn.addEventListener("click", startTest);

	// Toggle UI
	toggleBtn.addEventListener("click", () => {
		cardBody.classList.toggle("active");
		toggleBtn.textContent = cardBody.classList.contains("active") ? "▲" : "▼";
	});

	// Start first test automatically
	startTest();
})();
