// === PETUALANGAN MATEMATIKA - JS LENGKAP V4 (Revisi Final) ===
const GameState = {
    currentScreen: 'welcome',
    category: null,
    difficulty: null,
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    userAnswers: [],
    timer: null,
    timeRemaining: 0,
    hintsLeft: 3,
    musicPlaying: false 
};

const DIFFICULTY_CONFIG = {
    easy: { questions: 10, timeMinutes: 5, hints: 2 },
    medium: { questions: 20, timeMinutes: 8, hints: 3 },
    hard: { questions: 30, timeMinutes: 12, hints: 5 }
};

const QUESTION_RANGES = {
    addition: { easy: [1, 15], medium: [1, 50], hard: [1, 150] },
    subtraction: { easy: [1, 15], medium: [1, 50], hard: [1, 150] },
    multiplication: { easy: [1, 10], medium: [1, 12], hard: [1, 15] },
    division: { easy: [1, 10], medium: [1, 12], hard: [1, 15] }
};

const CATEGORY_ICONS = {
    addition: '➕',
    subtraction: '➖',
    multiplication: '✖️',
    division: '➗'
};

// DOM Elements
const el = {
    screens: document.querySelectorAll('.screen'),
    container: document.getElementById('gameContainer'),
    bgOverlay: document.getElementById('bgOverlay'),
    
    startBtn: document.getElementById('startBtn'),
    infoBtn: document.getElementById('infoBtn'),
    musicToggle: document.getElementById('musicToggle'),
    backToCategory: document.getElementById('backToCategory'),
    categoryCards: document.querySelectorAll('.category-card'),
    difficultyCards: document.querySelectorAll('.difficulty-card'),

    categoryDisplay: document.getElementById('categoryDisplay'),
    difficultyDisplay: document.getElementById('difficultyDisplay'),
    hintBtn: document.getElementById('hintBtn'),
    hintCount: document.getElementById('hintCount'),
    timer: document.getElementById('timer'),
    progressText: document.getElementById('progressText'),
    scoreDisplay: document.getElementById('scoreDisplay'),
    progressFill: document.getElementById('progressFill'),
    questionText: document.getElementById('questionText'),
    answersGrid: document.getElementById('answersGrid'),

    resultsTitle: document.getElementById('resultsTitle'),
    finalScore: document.getElementById('finalScore'),
    scoreMessage: document.getElementById('scoreMessage'),
    answersList: document.getElementById('answersList'),

    timeupScore: document.getElementById('timeupScore'),
    timeupAnswersList: document.getElementById('timeupAnswersList'),

    playAgainBtn: document.getElementById('playAgainBtn'),
    changeCategory: document.getElementById('changeCategory'),
    tryAgainBtn: document.getElementById('tryAgainBtn'),
    backToStart: document.getElementById('backToStart'),

    bgMusic: document.getElementById('bgMusic'),
    winSound: document.getElementById('winSound'),
    timeupSound: document.getElementById('timeupSound'),
    hintSound: document.getElementById('hintSound'),
    clickSound: document.getElementById('clickSound'),

    groupModal: document.getElementById('groupModal'),
    closeModal: document.querySelector('.close-btn')
};

// === UTILITIES ===
const playSound = (id) => {
    const sound = el[id];
    if (sound) sound.play().catch(() => {});
};

const showScreen = (name) => {
    el.screens.forEach(s => s.classList.remove('active'));
    document.getElementById(name + 'Screen').classList.add('active');
    GameState.currentScreen = name;

    const body = document.body;
    body.className = '';
    if (name === 'quiz' && GameState.category) {
        body.classList.add(GameState.category);
    } 
    
    el.bgOverlay.className = 'bg-overlay';
    if (GameState.category) {
        el.bgOverlay.classList.add(GameState.category);
    }
};

/**
 * Fungsi untuk mencoba memutar musik secara otomatis.
 */
const autoplayMusic = () => {
    el.bgMusic.volume = 0.5; // Set volume agar tidak terlalu keras
    el.bgMusic.play()
        .then(() => {
            GameState.musicPlaying = true;
            el.musicToggle.textContent = '🔊';
        })
        .catch(error => {
            console.warn("Autoplay diblokir. Musik akan dimulai saat interaksi pertama.");
            GameState.musicPlaying = false;
            el.musicToggle.textContent = '🔇';
        });
};

const generateQuestion = (category, difficulty) => {
    const [min, max] = QUESTION_RANGES[category][difficulty];
    let a, b, question, answer;

    const randRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    if (category === 'addition') {
        a = randRange(min, max);
        b = randRange(min, max);
        question = `${a} + ${b}`;
        answer = a + b;
    } else if (category === 'subtraction') {
        let temp_a = randRange(min, max);
        let temp_b = randRange(min, max);
        a = Math.max(temp_a, temp_b);
        b = Math.min(temp_a, temp_b);
        if (a === b) a++;
        question = `${a} − ${b}`;
        answer = a - b;
    } else if (category === 'multiplication') {
        a = randRange(1, max);
        b = randRange(1, max);
        question = `${a} × ${b}`;
        answer = a * b;
    } else { // Division
        let divisor = randRange(1, max);
        let result = randRange(1, 10);
        a = divisor * result;
        b = divisor;
        question = `${a} ÷ ${b}`;
        answer = result;
    }

    const options = [answer];
    while (options.length < 4) {
        let wrong;
        do {
            const offset = randRange(-10, 10);
            wrong = answer + offset;
            if (category === 'division') {
                if (offset === 0) continue;
                wrong = randRange(Math.max(1, answer - 5), answer + 5);
                if (wrong === answer) continue;
            }
        } while (wrong <= 0 || options.includes(wrong));
        options.push(wrong);
    }
    
    return { question: question + ' = ?', answer, options: options.sort(() => Math.random() - 0.5) };
};

const generateQuestions = (category, difficulty, count) => {
    const questions = [];
    for (let i = 0; i < count; i++) {
        questions.push(generateQuestion(category, difficulty));
    }
    return questions;
};

const displayQuestion = () => {
    const q = GameState.questions[GameState.currentQuestionIndex];
    if (!q) return endQuiz();
    
    // Animasi transisi pertanyaan baru
    el.questionText.parentElement.style.opacity = '0';
    el.answersGrid.style.opacity = '0';

    setTimeout(() => {
        el.questionText.textContent = q.question;
        el.answersGrid.innerHTML = '';
        
        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.textContent = opt;
            btn.onclick = () => selectAnswer(opt, q.answer, btn);
            el.answersGrid.appendChild(btn);
        });

        el.questionText.parentElement.style.opacity = '1';
        el.answersGrid.style.opacity = '1';

        el.progressText.textContent = `Soal ${GameState.currentQuestionIndex + 1} dari ${GameState.questions.length}`;
        el.scoreDisplay.textContent = `Skor: ${GameState.score}`;
        const progress = ((GameState.currentQuestionIndex) / GameState.questions.length) * 100;
        el.progressFill.style.width = `${progress}%`;
    }, 300); // Tunggu sebentar untuk transisi
};

const selectAnswer = (selected, correct, btn) => {
    playSound('clickSound');
    const isCorrect = selected === correct;
    if (isCorrect) GameState.score++;
    
    GameState.userAnswers.push({ 
        question: GameState.questions[GameState.currentQuestionIndex].question, 
        selected: selected, 
        correct: correct, 
        isCorrect: isCorrect,
    });

    const buttons = el.answersGrid.querySelectorAll('button');
    buttons.forEach(b => {
        b.disabled = true;
        b.style.pointerEvents = 'none'; // Tambahkan ini untuk memastikan klik tidak tembus

        const answerVal = parseInt(b.textContent);
        
        if (answerVal === correct) {
            b.classList.add('correct');
            b.innerHTML = `${b.textContent} <span class="status-icon">✅</span>`;
        } else if (b === btn) {
            b.classList.add('incorrect');
            b.innerHTML = `${b.textContent} <span class="status-icon">❌</span>`;
        } else if (!b.classList.contains('correct') && b.classList.contains('hint-disabled')) {
             // Jika opsi salah dan sudah di-disable oleh hint, pastikan ikonnya tidak muncul
             b.innerHTML = `${b.textContent}`;
        }
    });

    el.scoreDisplay.textContent = `Skor: ${GameState.score}`;

    setTimeout(() => {
        GameState.currentQuestionIndex++;
        if (GameState.currentQuestionIndex < GameState.questions.length) {
            displayQuestion();
        } else {
            endQuiz();
        }
    }, 1800); // Transisi lebih lama untuk animasi feedback
};

el.hintBtn.onclick = () => {
    if (GameState.hintsLeft <= 0 || GameState.userAnswers.length > GameState.currentQuestionIndex) return;

    GameState.hintsLeft--;
    el.hintCount.textContent = GameState.hintsLeft;
    if (GameState.hintsLeft === 0) el.hintBtn.classList.add('disabled');
    playSound('hintSound');

    const correct = GameState.questions[GameState.currentQuestionIndex].answer;
    const buttons = el.answersGrid.querySelectorAll('button:not(:disabled):not(.correct):not(.hint-disabled)');
    
    let wrongOptions = Array.from(buttons).filter(b => parseInt(b.textContent) !== correct);
    
    // Pilih 2 opsi yang salah untuk di-disable
    const optionsToDisable = wrongOptions.sort(() => 0.5 - Math.random()).slice(0, 2);

    optionsToDisable.forEach(btn => {
        btn.disabled = true;
        btn.classList.add('hint-disabled');
    });
};

const startTimer = () => {
    clearInterval(GameState.timer);
    GameState.timer = setInterval(() => {
        GameState.timeRemaining--;
        const mins = Math.floor(GameState.timeRemaining / 60).toString().padStart(2, '0');
        const secs = (GameState.timeRemaining % 60).toString().padStart(2, '0');
        el.timer.textContent = `${mins}:${secs}`;
        
        if (GameState.timeRemaining <= 0) {
            clearInterval(GameState.timer);
            playSound('timeupSound');
            showTimeUp();
        }
    }, 1000);
};

const endQuiz = () => {
    clearInterval(GameState.timer);
    playSound('winSound');
    showScreen('results');
    
    el.progressFill.style.width = '100%';

    const totalQuestions = GameState.questions.length;
    const percentage = Math.round((GameState.score / totalQuestions) * 100);
    
    el.finalScore.textContent = `${percentage}%`;

    let title = '', message = '';
    if (percentage >= 90) { title = 'Sempurna! 🏆'; message = 'Kamu jenius matematika, pertahankan!'; }
    else if (percentage >= 70) { title = 'Hebat! ✨'; message = 'Kerja bagus, sebentar lagi sempurna!'; }
    else if (percentage >= 50) { title = 'Bagus! ⭐'; message = 'Lumayan, ayo tingkatkan lagi akurasimu!'; }
    else { title = 'Coba Lagi! 💡'; message = 'Jangan menyerah, semua butuh latihan!'; }

    el.resultsTitle.textContent = title;
    el.scoreMessage.textContent = message;

    renderReviewList(el.answersList);
};

const showTimeUp = () => {
    clearInterval(GameState.timer);
    showScreen('timeup');
    
    const totalQuestions = GameState.questions.length;
    const percentage = Math.round((GameState.score / totalQuestions) * 100);
    
    el.timeupScore.textContent = `${percentage}%`;
    
    renderReviewList(el.timeupAnswersList);
};

const renderReviewList = (listElement) => {
    listElement.innerHTML = '';
    
    const answered = GameState.userAnswers.filter((_, index) => index < GameState.questions.length);

    answered.forEach(a => {
        const div = document.createElement('div');
        div.innerHTML = `
            <span class="question-text">${a.question}</span> 
            <span>
                <strong>${a.selected}</strong> 
                ${a.isCorrect ? '✅' : `❌ (Benar: ${a.correct})`}
            </span>
        `;
        listElement.appendChild(div);
    });
    
    for (let i = answered.length; i < GameState.questions.length; i++) {
        const q = GameState.questions[i];
        const div = document.createElement('div');
        div.style.opacity = '0.7';
        div.innerHTML = `
            <span class="question-text">${q.question}</span> 
            <span>— (Belum Dijawab)</span>
        `;
        listElement.appendChild(div);
    }
}

// === START QUIZ ===
const startQuiz = () => {
    const config = DIFFICULTY_CONFIG[GameState.difficulty];
    
    if (!GameState.category || !GameState.difficulty) {
        showScreen('welcome');
        return;
    }

    GameState.questions = generateQuestions(GameState.category, GameState.difficulty, config.questions);
    GameState.currentQuestionIndex = 0;
    GameState.score = 0;
    GameState.userAnswers = [];
    GameState.hintsLeft = config.hints;
    GameState.timeRemaining = config.timeMinutes * 60;

    el.categoryDisplay.textContent = {
        addition: 'Penjumlahan', subtraction: 'Pengurangan',
        multiplication: 'Perkalian', division: 'Pembagian'
    }[GameState.category];

    el.difficultyDisplay.textContent = GameState.difficulty.toUpperCase();
    el.hintCount.textContent = GameState.hintsLeft;
    el.hintBtn.classList.remove('disabled');
    if (GameState.hintsLeft <= 0) el.hintBtn.classList.add('disabled');

    showScreen('quiz');
    displayQuestion();
    startTimer();
};

// === MUSIC TOGGLE ===
el.musicToggle.onclick = () => {
    if (GameState.musicPlaying) {
        el.bgMusic.pause();
        el.musicToggle.textContent = '🔇';
    } else {
        el.bgMusic.play().catch(() => {});
        el.musicToggle.textContent = '🔊';
    }
    GameState.musicPlaying = !GameState.musicPlaying;
};

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    showScreen('welcome');
    
    // Auto-play music saat dimuat
    autoplayMusic();

    el.startBtn.onclick = () => showScreen('category');
    el.infoBtn.onclick = () => el.groupModal.style.display = 'flex';
    el.closeModal.onclick = () => el.groupModal.style.display = 'none';
    window.onclick = (e) => { if (e.target === el.groupModal) el.groupModal.style.display = 'none'; };

    el.categoryCards.forEach(card => {
        card.onclick = () => {
            GameState.category = card.dataset.category;
            showScreen('difficulty');
        };
    });

    el.difficultyCards.forEach(card => {
        card.onclick = () => {
            GameState.difficulty = card.dataset.difficulty;
            startQuiz();
        };
    });

    el.backToCategory.onclick = () => showScreen('category');
    el.playAgainBtn.onclick = startQuiz;
    el.changeCategory.onclick = () => showScreen('category');
    el.tryAgainBtn.onclick = startQuiz;
    el.backToStart.onclick = () => {
        GameState.category = null;
        GameState.difficulty = null;
        showScreen('welcome');
    };
});