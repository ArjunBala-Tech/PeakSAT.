const pages = [
  { id: "home", label: "Home", href: "index.html" },
  { id: "sat-guide", label: "SAT Guide", href: "sat-guide.html" },
  { id: "sat-fundamentals", label: "The Arena", href: "sat-fundamentals.html" },
  { id: "reading-writing", label: "Reading & Writing", href: "reading-writing.html" },
  { id: "math", label: "Math", href: "math.html" },
  { id: "about", label: "About", href: "about.html" },
  { id: "contact", label: "Contact", href: "contact.html" },
  { id: "account", label: "Account", href: "account.html" }
];

let activeQuizQuestions = [];
let currentQuestionIndex = 0;
let currentScore = 0;
let currentStreak = 0;
let bestStreakThisSession = 0;
let sessionRecords = [];   // [{ topic, isCorrect }] for topic-wise analysis
let answeredCurrent = false;
let timerInterval;
let timeLeft = 90;

document.addEventListener("DOMContentLoaded", async () => {
  buildNav();
  buildFooter();
  setupReveal();
  setupTiltCards();

  if (typeof EnglishDatabase !== "undefined") await EnglishDatabase.init();
  if (typeof MathDatabase !== "undefined") await MathDatabase.init();

  setupFundamentalsPage();
  setupAuthPage();
});

function buildNav() {
  const navMount = document.getElementById("site-nav");
  if (!navMount) return;

  const currentPage = document.body.dataset.page || "home";
  const currentUser = getCurrentUser();

  const navLinksHtml = pages.map((page) => {
    const activeClass = page.id === currentPage ? "active" : "";
    return `<li><a href="${page.href}" class="nav-link ${activeClass}">${page.label}</a></li>`;
  }).join("");

  navMount.innerHTML = `
    <nav class="navbar glass-nav">
      <a href="index.html" class="brand">
        <div class="brand-mark">PS</div>
        <div class="brand-text">
          <span class="brand-name">PeakSAT</span>
          <span class="brand-sub">Elite Prep</span>
        </div>
      </a>
      <ul class="nav-links">
        ${navLinksHtml}
        ${currentUser
          ? `<li><span class="nav-user">Hi, ${escapeHtml(currentUser.name)}</span></li>
             <li><a href="#" class="nav-link" id="logoutLink" style="color:var(--chili);">Logout</a></li>`
          : ``
        }
      </ul>
    </nav>
  `;

  const logoutLink = document.getElementById("logoutLink");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("peakCurrentUser");
      window.location.href = "account.html";
    });
  }
}

function buildFooter() {
  const footerMount = document.getElementById("site-footer");
  if (!footerMount) return;
  footerMount.innerHTML = `
    <footer class="footer">
      <p>© 2026 PeakSAT • Built by Arjun Balasubramanian</p>
    </footer>
  `;
}

function setupReveal() {
  const elements = document.querySelectorAll(".reveal");
  setTimeout(() => {
    elements.forEach((el) => el.classList.add("show"));
  }, 80);
}

function setupTiltCards() {
  const tiltCards = document.querySelectorAll(".tilt-card");
  tiltCards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -2.5;
      const rotateY = ((x - centerX) / centerX) * 2.5;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(4px)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)";
    });
  });
}

// --- AUTH ---

function getUsers() {
  return JSON.parse(localStorage.getItem("peakUsers") || "{}");
}
function saveUsers(users) {
  localStorage.setItem("peakUsers", JSON.stringify(users));
}
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("peakCurrentUser") || "null");
}
function setCurrentUser(user) {
  localStorage.setItem("peakCurrentUser", JSON.stringify(user));
}

function setupAuthPage() {
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");
  const dashboard = document.getElementById("accountDashboard");
  const currentUser = getCurrentUser();

  if (dashboard && currentUser) renderAccountDashboard(dashboard, currentUser);

  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("signupName").value.trim();
      const email = document.getElementById("signupEmail").value.trim().toLowerCase();
      const password = document.getElementById("signupPassword").value;
      const users = getUsers();
      if (users[email]) { alert("An account with that email already exists."); return; }
      users[email] = { name, email, password, stats: { quizzesTaken: 0, questionsAnswered: 0, correctAnswers: 0, bestStreak: 0 } };
      saveUsers(users);
      setCurrentUser(users[email]);
      alert("Account created!");
      window.location.href = "account.html";
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim().toLowerCase();
      const password = document.getElementById("loginPassword").value;
      const users = getUsers();
      if (!users[email] || users[email].password !== password) { alert("Invalid email or password."); return; }
      setCurrentUser(users[email]);
      alert("Logged in successfully.");
      window.location.href = "account.html";
    });
  }
}

function renderAccountDashboard(container, user) {
  const accuracy = user.stats.questionsAnswered > 0
    ? Math.round((user.stats.correctAnswers / user.stats.questionsAnswered) * 100)
    : 0;
  container.innerHTML = `
    <div class="glass-card">
      <p class="eyebrow">YOUR DASHBOARD</p>
      <h2 class="form-title">Welcome back, ${escapeHtml(user.name)}</h2>
      <div class="quiz-stats">
        <div class="quiz-stat">
          <span class="quiz-stat-label">Quizzes Taken</span>
          <span class="quiz-stat-value">${user.stats.quizzesTaken}</span>
        </div>
        <div class="quiz-stat">
          <span class="quiz-stat-label">Questions Answered</span>
          <span class="quiz-stat-value">${user.stats.questionsAnswered}</span>
        </div>
        <div class="quiz-stat">
          <span class="quiz-stat-label">Accuracy</span>
          <span class="quiz-stat-value">${accuracy}%</span>
        </div>
        <div class="quiz-stat">
          <span class="quiz-stat-label">Best Streak</span>
          <span class="quiz-stat-value">🔥 ${user.stats.bestStreak || 0}</span>
        </div>
      </div>
    </div>
  `;
}

// --- QUIZ ENGINE ---

function setupFundamentalsPage() {
  const startQuizBtn = document.getElementById("startQuizBtn");
  if (!startQuizBtn) return;

  let sessionConfig = { subject: "all", difficulty: "all" };

  const subjectFilter = document.getElementById("subjectFilter");
  const difficultyFilter = document.getElementById("difficultyFilter");
  const sessionLengthFilter = document.getElementById("sessionLengthFilter");
  const quizContainer = document.getElementById("quizContainer");
  const quizSetup = document.getElementById("quizSetup");
  const quizDashboard = document.getElementById("quizDashboard");
  const currentQuestionLabel = document.getElementById("currentQuestionLabel");
  const scoreLabel = document.getElementById("scoreLabel");
  const accuracyLabel = document.getElementById("accuracyLabel");
  const quizProgressBar = document.getElementById("quizProgressBar");
  const loggedInBanner = document.getElementById("loggedInBanner");

  const currentUser = getCurrentUser();
  if (loggedInBanner) {
    // Initial render from any cached state; refreshed once Firebase resolves.
    loggedInBanner.innerHTML = currentUser
      ? `Logged in as <strong style="color:var(--peach);">${escapeHtml(currentUser.name)}</strong> — stats will be saved.`
      : `Not signed in. <a href="account.html" style="color:var(--peach);">Sign in</a> to save your stats.`;

    // The page module calls window.updatePeakBanner once auth is known.
    window.updatePeakBanner = (user) => {
      loggedInBanner.innerHTML = user
        ? `Signed in as <strong style="color:var(--peach);">${escapeHtml(user.displayName || user.email)}</strong> — sessions are saved to your dashboard.`
        : `Not signed in. <a href="account.html" style="color:var(--peach);">Sign in</a> to save your stats.`;
    };
  }

  startQuizBtn.addEventListener("click", () => {
    const subject = subjectFilter.value;
    const difficulty = difficultyFilter.value;
    const sessionLen = sessionLengthFilter ? parseInt(sessionLengthFilter.value) : 10;

    sessionConfig = { subject, difficulty };

    let pool = [];
    if (subject === "all") {
      pool = [...EnglishDatabase.getQuestions(difficulty), ...MathDatabase.getQuestions(difficulty)];
    } else if (subject === "english") {
      pool = EnglishDatabase.getQuestions(difficulty);
    } else if (subject === "math") {
      pool = MathDatabase.getQuestions(difficulty);
    }

    activeQuizQuestions = pool.sort(() => Math.random() - 0.5).slice(0, sessionLen);

    if (!activeQuizQuestions.length) {
      quizContainer.innerHTML = `<div class="empty-state glass-card reveal"><h3>No questions found</h3><p>Try different filters.</p></div>`;
      return;
    }

    quizSetup.style.display = "none";
    quizDashboard.style.display = "block";
    currentQuestionIndex = 0;
    currentScore = 0;
    currentStreak = 0;
    bestStreakThisSession = 0;
    sessionRecords = [];
    answeredCurrent = false;

    renderSingleQuestion();
  });

  function startTimer() {
    timeLeft = 90;
    clearInterval(timerInterval);
    const timerDisplay = document.getElementById("timerDisplay");
    updateTimerUI(timerDisplay);

    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerUI(timerDisplay);
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        handleAnswer(-1, activeQuizQuestions[currentQuestionIndex], false, true);
      }
    }, 1000);
  }

  function updateTimerUI(el) {
    if (!el) return;
    el.innerText = `⏱ ${timeLeft}s`;
    if (timeLeft <= 15) {
      el.style.color = "#E62E2D";
      el.style.fontWeight = "800";
      el.classList.add("timer-urgent");
    } else if (timeLeft <= 30) {
      el.style.color = "#FFB4A2";
      el.style.fontWeight = "700";
      el.classList.remove("timer-urgent");
    } else {
      el.style.color = "";
      el.style.fontWeight = "";
      el.classList.remove("timer-urgent");
    }
  }

  function renderSingleQuestion() {
    const q = activeQuizQuestions[currentQuestionIndex];
    if (!q) { renderQuizComplete(); return; }

    const isGrid = q.questionType !== "mcq";
    const streakDisplay = currentStreak >= 3 ? `🔥🔥 ${currentStreak} STREAK` : currentStreak > 0 ? `🔥 ${currentStreak}` : "–";

    quizContainer.innerHTML = `
      <article class="question-card glass-card">
        <div class="quiz-header-row">
          <div class="q-label">Q${currentQuestionIndex + 1} <span class="q-of">of ${activeQuizQuestions.length}</span></div>
          <div class="streak-pill ${currentStreak >= 3 ? 'streak-hot' : ''}">${streakDisplay}</div>
          <div class="timer-pill" id="timerDisplay">⏱ 90s</div>
        </div>

        <div class="question-meta">
          <span class="meta-tag subject-tag">${formatSubject(q.subject)}</span>
          <span class="meta-tag">${escapeHtml(q.topic)}</span>
          <span class="meta-tag diff-${q.difficulty}">${capitalize(q.difficulty)}</span>
        </div>

        ${q.passage ? `<div class="passage-box">${escapeHtml(q.passage)}</div>` : ""}

        <div class="question-text">${escapeHtml(q.question)}</div>

        <div class="options-grid" id="optionsGrid">
          ${isGrid ? `
            <input type="text" id="gridInput" class="grid-input" placeholder="Type your answer…">
            <button class="btn btn-primary" id="submitGridBtn" style="margin-top:12px;">Submit Answer</button>
          ` : q.options.map((opt, i) => `
            <button class="option-btn" data-index="${i}">
              <span class="option-letter">${String.fromCharCode(65 + i)}</span>
              <span class="option-text">${escapeHtml(opt)}</span>
            </button>
          `).join("")}
        </div>

        <div id="feedbackBox"></div>
        <div id="quizActionRow"></div>
      </article>
    `;

    if (isGrid) {
      document.getElementById("submitGridBtn").onclick = () => {
        const val = document.getElementById("gridInput").value.trim();
        if (!val) return;
        handleAnswer(val, q, true);
      };
      document.getElementById("gridInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const val = document.getElementById("gridInput").value.trim();
          if (val) handleAnswer(val, q, true);
        }
      });
    } else {
      document.querySelectorAll(".option-btn").forEach(btn => {
        btn.onclick = () => handleAnswer(parseInt(btn.dataset.index), q);
      });
    }

    updateDashboardUI();
    startTimer();
  }

  function handleAnswer(choice, q, isGrid = false, isTimeout = false) {
    if (answeredCurrent) return;
    answeredCurrent = true;
    clearInterval(timerInterval);

    let isCorrect = false;
    if (!isTimeout) {
      isCorrect = isGrid
        ? choice.toLowerCase() == String(q.correctAnswer).toLowerCase()
        : choice === q.correctAnswer;
    }

    if (isCorrect) {
      currentScore++;
      currentStreak++;
      if (currentStreak > bestStreakThisSession) bestStreakThisSession = currentStreak;
    } else {
      currentStreak = 0;
    }

    // Record this question for topic-wise analysis on the dashboard.
    sessionRecords.push({ topic: q.topic || "General", isCorrect });

    // Update scoreboard
    document.getElementById("scoreLabel").textContent = currentScore;
    const answered = currentQuestionIndex + 1;
    document.getElementById("accuracyLabel").textContent = Math.round((currentScore / answered) * 100) + "%";

    // Highlight MCQ options
    if (!isGrid) {
      document.querySelectorAll(".option-btn").forEach(btn => {
        btn.disabled = true;
        btn.style.pointerEvents = "none";
        const idx = parseInt(btn.dataset.index);
        if (idx === q.correctAnswer) {
          btn.classList.add("correct");
        } else if (idx === choice && !isCorrect && !isTimeout) {
          btn.classList.add("wrong");
        }
      });
    } else {
      const input = document.getElementById("gridInput");
      const submitBtn = document.getElementById("submitGridBtn");
      if (input) { input.disabled = true; input.classList.add(isCorrect ? "correct" : "wrong"); }
      if (submitBtn) submitBtn.disabled = true;
    }

    // Feedback
    const feedback = document.getElementById("feedbackBox");
    let icon = isCorrect ? "✅" : isTimeout ? "⏰" : "❌";
    let title = isCorrect ? "Correct!" : isTimeout ? "Time's Up" : "Incorrect";
    let color = isCorrect ? "#06D6A0" : "#E62E2D";
    let bgColor = isCorrect ? "rgba(6,214,160,0.08)" : "rgba(230,46,45,0.08)";

    const correctDisplay = q.questionType === "mcq"
      ? `<strong>${String.fromCharCode(65 + q.correctAnswer)}.</strong> ${escapeHtml(q.options[q.correctAnswer])}`
      : escapeHtml(String(q.correctAnswer));

    feedback.innerHTML = `
      <div class="feedback-box" style="background:${bgColor}; border-color:${color};">
        <div class="feedback-title" style="color:${color};">${icon} ${title}</div>
        <div class="feedback-correct">Correct Answer: ${correctDisplay}</div>
        <div class="feedback-explanation">${escapeHtml(q.explanation)}</div>
        ${currentStreak >= 3 ? `<div class="streak-banner">🔥 ${currentStreak} in a row! Keep it up!</div>` : ""}
      </div>
    `;

    document.getElementById("quizActionRow").innerHTML = `
      <button class="btn btn-primary next-btn" id="nextBtn">
        ${currentQuestionIndex + 1 < activeQuizQuestions.length ? "Next Question →" : "See Results 🏆"}
      </button>
    `;
    document.getElementById("nextBtn").onclick = () => {
      currentQuestionIndex++;
      answeredCurrent = false;
      renderSingleQuestion();
    };
  }

  function updateDashboardUI() {
    const total = activeQuizQuestions.length;
    currentQuestionLabel.textContent = `${currentQuestionIndex + 1} / ${total}`;
    scoreLabel.textContent = currentScore;
    if (currentQuestionIndex === 0) {
      accuracyLabel.textContent = "–";
    } else {
      accuracyLabel.textContent = Math.round((currentScore / currentQuestionIndex) * 100) + "%";
    }
    quizProgressBar.style.width = `${(currentQuestionIndex / total) * 100}%`;
  }

  function renderQuizComplete() {
    clearInterval(timerInterval);
    const pct = Math.round((currentScore / activeQuizQuestions.length) * 100);
    let grade = pct >= 90 ? "🏆 Elite" : pct >= 75 ? "⭐ Strong" : pct >= 60 ? "📈 Progress" : "📚 Keep Practicing";

    const total = activeQuizQuestions.length;
    const correct = currentScore;
    let saveNote = "";

    // Persist to Firebase via the bridge exposed by the page module.
    if (window.PeakSATData && window.PeakSATData.isSignedIn()) {
      saveNote = `<p class="results-save-note" id="resultsSaveNote">💾 Saving your session…</p>`;
      window.PeakSATData.saveArenaSession({
        subject: sessionConfig.subject,
        difficulty: sessionConfig.difficulty,
        total, correct,
        bestStreak: bestStreakThisSession,
        records: sessionRecords
      }).then(() => {
        const n = document.getElementById("resultsSaveNote");
        if (n) n.innerHTML = "✅ Saved to your account. <a href='account.html' style='color:var(--peach);'>View dashboard →</a>";
      }).catch(() => {
        const n = document.getElementById("resultsSaveNote");
        if (n) n.textContent = "⚠️ Could not save this session. Check your connection.";
      });
    } else {
      saveNote = `<p class="results-save-note"><a href="account.html" style="color:var(--peach);">Sign in</a> to save sessions and unlock your dashboard.</p>`;
    }

    quizContainer.innerHTML = `
      <div class="glass-card results-card" style="text-align:center; padding:60px 30px;">
        <div class="feature-badge" style="margin:0 auto 20px; font-size:2.2rem;">🏆</div>
        <h2>Session Complete!</h2>
        <p class="results-grade">${grade}</p>
        <p class="results-score">${correct} / ${total} correct</p>
        <p class="results-pct">${pct}% accuracy</p>
        <div class="results-bar-wrap">
          <div class="results-bar" style="width:${pct}%"></div>
        </div>
        ${saveNote}
        <button class="btn btn-primary" style="margin-top:32px;" onclick="location.reload()">Start New Session</button>
        <a href="account.html" class="btn btn-secondary" style="margin-top:12px; display:inline-block;">View Dashboard</a>
      </div>
    `;

    quizProgressBar.style.width = "100%";
  }
}

// --- UTILITIES ---

function formatSubject(subject) {
  return subject === "english" ? "Reading & Writing" : "Math";
}
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function escapeHtml(text) {
  if (text == null) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
