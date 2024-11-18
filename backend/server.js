const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

let highestStreak = 0;

// Load questions from `prolog_data.pl` file
function loadQuestionsFromProlog() {
    const filePath = path.join(__dirname, 'prolog_data.pl');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const questions = [];

    const questionRegex = /question\((\d+), "(.+?)", "(.+?)", \[(.+?)\]\)/g;
    let match;

    while ((match = questionRegex.exec(fileContent)) !== null) {
        const [, id, question, correctAnswer, incorrectAnswers] = match;
        questions.push({
            id: parseInt(id),
            question,
            correct: correctAnswer,
            incorrect: incorrectAnswers.split(', ').map(ans => ans.replace(/"/g, ''))
        });
    }

    return questions;
}

const questions = loadQuestionsFromProlog();

// Get a random question
function getRandomQuestion() {
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
}

// API endpoint to get a question
app.get('/api/question', (req, res) => {
    const question = getRandomQuestion();
    res.json(question);
});

// API endpoint to reset streak if wrong answer and update highest streak if necessary
app.post('/api/check-answer', express.json(), (req, res) => {
    const { selectedAnswer, correctAnswer, currentStreak } = req.body;
    let newStreak = currentStreak;

    if (selectedAnswer === correctAnswer) {
        newStreak += 1;
        res.json({ correct: true, newStreak });
    } else {
        highestStreak = Math.max(highestStreak, currentStreak);
        res.json({ correct: false, currentStreak: 0, highestStreak });
    }
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
