let currentStreak = 0;
let highestStreak = 0;

async function loadHighestStreak() {
    const response = await fetch('/api/highest-streak');
    const data = await response.json();
    highestStreak = data.highestStreak;
    updateStreakDisplay();
}

async function saveHighestStreak(streak) {
    await fetch('/api/highest-streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streak })
    });
}

function updateStreakDisplay() {
    document.getElementById('current-streak').innerText = `Current Streak: ${currentStreak}`;
    document.getElementById('highest-streak').innerText = `Highest Streak: ${highestStreak}`;
}

async function loadQuestion() {
    try {
        const response = await fetch('/api/question');
        const data = await response.json();

        console.log('Question Data:', data);

        document.getElementById('question-area').innerText = data.question || 'No question text available';

        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';

        const options = [...data.incorrect, data.correct].sort(() => Math.random() - 0.5);
        options.forEach(option => {
            const button = document.createElement('button');
            button.innerText = option;
            button.onclick = () => checkAnswer(option, data.correct);
            optionsContainer.appendChild(button);
        });
    } catch (error) {
        console.error('Error loading question:', error);
    }
}

function checkAnswer(selected, correct) {
    if (selected === correct) {
        currentStreak++;
        if (currentStreak > highestStreak) {
            highestStreak = currentStreak;
            saveHighestStreak(highestStreak);
        }
        loadQuestion();
    } else {
        currentStreak = 0;
        document.getElementById('game-over-overlay').classList.add('active');
    }
    updateStreakDisplay();
}

function restartGame() {
    currentStreak = 0;
    document.getElementById('game-over-overlay').classList.remove('active');
    loadQuestion();
}

loadHighestStreak();
loadQuestion();