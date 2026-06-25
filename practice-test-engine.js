// ══════════════════════════════════════════════════════
//  PeakSAT Inline Practice Test Engine
//  Handles full 2-module SAT-style tests embedded on page
// ══════════════════════════════════════════════════════

const PracticeTestEngine = (() => {

  // Each test definition: { id, label, subject, modules: [{title, questions:[ids], timeSeconds}] }
  // Questions are sliced from the loaded DB by ID

  const MATH_TESTS = [
    {
      id: "math-test-1",
      label: "Math Practice Test 1",
      subject: "math",
      modules: [
        {
          number: 1,
          title: "Module 1 — Foundations",
          description: "Algebra, problem solving, and core geometry. Mixed difficulty.",
          timeSeconds: 35 * 60,
          qIds: ["m-e-01","m-e-02","m-e-03","m-e-04","m-e-05",
                 "m-e-06","m-e-07","m-e-08","m-e-09","m-e-10",
                 "m-m-11","m-m-12","m-m-13","m-m-14","m-m-15",
                 "m-m-16","m-m-17","m-m-18","m-m-19","m-m-20",
                 "m-h-21","m-h-22"]
        },
        {
          number: 2,
          title: "Module 2 — Advanced",
          description: "Advanced math, complex expressions, and multi-step reasoning.",
          timeSeconds: 35 * 60,
          qIds: ["m-h-23","m-h-24","m-h-25","m-h-26","m-h-27",
                 "m-h-28","m-h-29","m-h-30","m-h-31","m-h-32",
                 "m-h-33","m-h-34","m-h-35","m-h-36","m-h-37",
                 "m-h-38","m-h-39","m-h-40","m-e-01","m-e-02",
                 "m-m-11","m-m-12"]
        }
      ]
    },
    {
      id: "math-test-2",
      label: "Math Practice Test 2",
      subject: "math",
      modules: [
        {
          number: 1,
          title: "Module 1 — Core Skills",
          description: "Equations, ratios, data analysis, and geometry fundamentals.",
          timeSeconds: 35 * 60,
          qIds: ["m-e-03","m-e-04","m-e-05","m-e-06","m-e-07",
                 "m-e-08","m-e-09","m-e-10","m-e-01","m-e-02",
                 "m-m-13","m-m-14","m-m-15","m-m-16","m-m-17",
                 "m-m-18","m-m-19","m-m-20","m-m-11","m-m-12",
                 "m-h-21","m-h-22"]
        },
        {
          number: 2,
          title: "Module 2 — Passport to Advanced",
          description: "Rational expressions, exponents, functions, and trigonometry.",
          timeSeconds: 35 * 60,
          qIds: ["m-h-25","m-h-26","m-h-27","m-h-28","m-h-29",
                 "m-h-30","m-h-31","m-h-32","m-h-33","m-h-34",
                 "m-h-35","m-h-36","m-h-37","m-h-38","m-h-39",
                 "m-h-40","m-h-23","m-h-24","m-e-05","m-e-06",
                 "m-m-15","m-m-16"]
        }
      ]
    },
    {
      id: "math-test-3",
      label: "Math Practice Test 3",
      subject: "math",
      modules: [
        {
          number: 1,
          title: "Module 1 — Mixed Challenge",
          description: "Balanced mix of algebra, word problems, and analytical geometry.",
          timeSeconds: 35 * 60,
          qIds: ["m-e-02","m-e-04","m-e-06","m-e-08","m-e-10",
                 "m-e-01","m-e-03","m-e-05","m-e-07","m-e-09",
                 "m-m-12","m-m-14","m-m-16","m-m-18","m-m-20",
                 "m-m-11","m-m-13","m-m-15","m-m-17","m-m-19",
                 "m-h-40","m-h-39"]
        },
        {
          number: 2,
          title: "Module 2 — Elite Difficulty",
          description: "The hardest SAT math questions. Complex numbers, exponentials, circles.",
          timeSeconds: 35 * 60,
          qIds: ["m-h-21","m-h-22","m-h-23","m-h-24","m-h-25",
                 "m-h-26","m-h-27","m-h-28","m-h-29","m-h-30",
                 "m-h-31","m-h-32","m-h-33","m-h-34","m-h-35",
                 "m-h-36","m-h-37","m-h-38","m-e-07","m-e-08",
                 "m-m-17","m-m-18"]
        }
      ]
    }
  ];

  const ENGLISH_TESTS = [
    {
      id: "english-test-1",
      label: "Reading & Writing Practice Test 1",
      subject: "english",
      modules: [
        {
          number: 1,
          title: "Module 1 — Core Comprehension",
          description: "Vocabulary in context, main ideas, basic grammar and punctuation.",
          timeSeconds: 32 * 60,
          qIds: ["e-e-01","e-e-02","e-e-03","e-e-04","e-e-05",
                 "e-e-06","e-e-07","e-e-08","e-e-09","e-e-10",
                 "e-m-11","e-m-12","e-m-13","e-m-14","e-m-15",
                 "e-m-16","e-m-17","e-m-18","e-m-19","e-m-20",
                 "e-h-21","e-h-22","e-h-23","e-h-24","e-h-25",
                 "e-h-26","e-h-27"]
        },
        {
          number: 2,
          title: "Module 2 — Advanced Analysis",
          description: "Rhetorical analysis, argument structure, and advanced conventions.",
          timeSeconds: 32 * 60,
          qIds: ["e-h-28","e-h-29","e-h-30","e-h-31","e-h-32",
                 "e-h-33","e-h-34","e-h-35","e-h-36","e-h-37",
                 "e-h-38","e-h-39","e-h-40","e-e-01","e-e-02",
                 "e-e-03","e-e-04","e-m-11","e-m-12","e-m-13",
                 "e-m-14","e-m-15","e-m-16","e-m-17","e-m-18",
                 "e-h-21","e-h-22"]
        }
      ]
    },
    {
      id: "english-test-2",
      label: "Reading & Writing Practice Test 2",
      subject: "english",
      modules: [
        {
          number: 1,
          title: "Module 1 — Craft & Structure",
          description: "Author purpose, tone, text structure, and evidence-based reading.",
          timeSeconds: 32 * 60,
          qIds: ["e-e-05","e-e-06","e-e-07","e-e-08","e-e-09",
                 "e-e-10","e-e-01","e-e-02","e-e-03","e-e-04",
                 "e-m-13","e-m-14","e-m-15","e-m-16","e-m-17",
                 "e-m-18","e-m-19","e-m-20","e-m-11","e-m-12",
                 "e-h-23","e-h-24","e-h-25","e-h-26","e-h-27",
                 "e-h-28","e-h-29"]
        },
        {
          number: 2,
          title: "Module 2 — Expression & Conventions",
          description: "Transitions, sentence structure, grammar mastery, and revision.",
          timeSeconds: 32 * 60,
          qIds: ["e-h-30","e-h-31","e-h-32","e-h-33","e-h-34",
                 "e-h-35","e-h-36","e-h-37","e-h-38","e-h-39",
                 "e-h-40","e-h-21","e-h-22","e-h-23","e-e-07",
                 "e-e-08","e-e-09","e-e-10","e-m-19","e-m-20",
                 "e-m-15","e-m-16","e-m-17","e-m-18","e-m-11",
                 "e-h-24","e-h-25"]
        }
      ]
    },
    {
      id: "english-test-3",
      label: "Reading & Writing Practice Test 3",
      subject: "english",
      modules: [
        {
          number: 1,
          title: "Module 1 — Information & Ideas",
          description: "Inference, data interpretation, paired passages, and central ideas.",
          timeSeconds: 32 * 60,
          qIds: ["e-e-02","e-e-04","e-e-06","e-e-08","e-e-10",
                 "e-e-01","e-e-03","e-e-05","e-e-07","e-e-09",
                 "e-m-12","e-m-14","e-m-16","e-m-18","e-m-20",
                 "e-m-11","e-m-13","e-m-15","e-m-17","e-m-19",
                 "e-h-40","e-h-39","e-h-38","e-h-37","e-h-36",
                 "e-h-35","e-h-34"]
        },
        {
          number: 2,
          title: "Module 2 — Full Spectrum",
          description: "The complete SAT RW skillset — hardest questions, mixed topics.",
          timeSeconds: 32 * 60,
          qIds: ["e-h-21","e-h-22","e-h-23","e-h-24","e-h-25",
                 "e-h-26","e-h-27","e-h-28","e-h-29","e-h-30",
                 "e-h-31","e-h-32","e-h-33","e-e-05","e-e-06",
                 "e-e-07","e-e-08","e-m-11","e-m-12","e-m-13",
                 "e-m-14","e-m-15","e-m-16","e-m-17","e-m-18",
                 "e-h-36","e-h-37"]
        }
      ]
    }
  ];

  // ── STATE ──────────────────────────────────────────
  let state = {
    active: false,
    testDef: null,
    moduleIndex: 0,
    qIndex: 0,
    questions: [],      // resolved question objects for current module
    answers: [],        // { chosen, correct, isCorrect } per question
    mod1Score: 0,
    timerInterval: null,
    timeLeft: 0,
    answered: false,
    mountId: null       // DOM id of container to render into
  };

  // ── RESOLVE QUESTIONS FROM DB ──────────────────────
  function resolveQuestions(qIds, db) {
    return qIds.map(id => db.find(q => q.id === id)).filter(Boolean);
  }

  // ── PUBLIC: LAUNCH TEST ────────────────────────────
  function launchTest(testDef, db, mountId) {
    state = {
      active: true, testDef, moduleIndex: 0, qIndex: 0,
      questions: resolveQuestions(testDef.modules[0].qIds, db),
      answers: [], mod1Score: 0,
      timerInterval: null,
      timeLeft: testDef.modules[0].timeSeconds,
      answered: false, mountId
    };
    renderTestUI();
  }

  // ── MAIN RENDER ────────────────────────────────────
  function renderTestUI() {
    const mod = state.testDef.modules[state.moduleIndex];
    const q   = state.questions[state.qIndex];
    if (!q) { finishModule(); return; }

    const mount = document.getElementById(state.mountId);
    if (!mount) return;

    const isGrid = q.questionType !== "mcq";
    const progress = Math.round((state.qIndex / state.questions.length) * 100);
    const mm = Math.floor(state.timeLeft / 60);
    const ss = String(state.timeLeft % 60).padStart(2,"0");
    const timerClass = state.timeLeft <= 120 ? "pt-timer-urgent" : state.timeLeft <= 300 ? "pt-timer-warn" : "";

    mount.innerHTML = `
      <div class="pt-test-shell">

        <!-- TOP BAR -->
        <div class="pt-topbar">
          <div class="pt-topbar-left">
            <span class="pt-test-label">${escH(state.testDef.label)}</span>
            <span class="pt-module-badge">Module ${mod.number} of 2</span>
          </div>
          <div class="pt-topbar-center">
            <div class="pt-progress-wrap">
              <div class="pt-progress-fill" style="width:${progress}%"></div>
            </div>
            <span class="pt-progress-label">${state.qIndex + 1} / ${state.questions.length}</span>
          </div>
          <div class="pt-topbar-right">
            <div class="pt-timer ${timerClass}" id="ptTimerDisplay">⏱ ${mm}:${ss}</div>
            <button class="pt-exit-btn" onclick="PracticeTestEngine.exitTest('${state.mountId}')">✕ Exit</button>
          </div>
        </div>

        <!-- MODULE HEADER -->
        <div class="pt-module-header">
          <h3>${escH(mod.title)}</h3>
          <span class="pt-mod-desc">${escH(mod.description)}</span>
        </div>

        <!-- QUESTION AREA -->
        <div class="pt-question-area">
          <div class="pt-question-meta">
            <span class="meta-tag subject-tag">${q.subject === "math" ? "Math" : "Reading & Writing"}</span>
            <span class="meta-tag">${escH(q.topic)}</span>
            <span class="meta-tag diff-${q.difficulty}">${cap(q.difficulty)}</span>
          </div>

          ${q.passage ? `<div class="passage-box">${escH(q.passage)}</div>` : ""}

          <div class="pt-question-text">
            <span class="pt-q-num">Q${state.qIndex + 1}.</span> ${escH(q.question)}
          </div>

          <div class="pt-options" id="ptOptions">
            ${isGrid
              ? `<input type="text" id="ptGridInput" class="grid-input" placeholder="Enter your answer…">
                 <button class="btn btn-primary" id="ptGridSubmit" style="margin-top:12px;">Submit Answer</button>`
              : q.options.map((opt, i) => `
                  <button class="pt-option-btn" data-idx="${i}" onclick="PracticeTestEngine._handleAnswer(${i})">
                    <span class="pt-option-letter">${String.fromCharCode(65+i)}</span>
                    <span class="pt-option-text">${escH(opt)}</span>
                  </button>`).join("")
            }
          </div>

          <div id="ptFeedback"></div>
          <div id="ptNextRow"></div>
        </div>

        <!-- BOTTOM NAV BAR -->
        <div class="pt-bottombar">
          <span class="pt-answered-count">${state.answers.length} answered · ${state.questions.length - state.answers.length} remaining</span>
          <span class="pt-score-live">Score: <strong>${state.answers.filter(a=>a.isCorrect).length}</strong></span>
        </div>
      </div>
    `;

    if (isGrid) {
      document.getElementById("ptGridSubmit").onclick = () => {
        const v = document.getElementById("ptGridInput").value.trim();
        if (v) _handleAnswer(v, true);
      };
      document.getElementById("ptGridInput").addEventListener("keydown", e => {
        if (e.key === "Enter") {
          const v = document.getElementById("ptGridInput").value.trim();
          if (v) _handleAnswer(v, true);
        }
      });
    }

    startTimer();
  }

  // ── TIMER ──────────────────────────────────────────
  function startTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      state.timeLeft--;
      const el = document.getElementById("ptTimerDisplay");
      if (el) {
        const mm = Math.floor(state.timeLeft / 60);
        const ss = String(state.timeLeft % 60).padStart(2,"0");
        el.textContent = `⏱ ${mm}:${ss}`;
        if (state.timeLeft <= 120) { el.className = "pt-timer pt-timer-urgent"; }
        else if (state.timeLeft <= 300) { el.className = "pt-timer pt-timer-warn"; }
      }
      if (state.timeLeft <= 0) {
        clearInterval(state.timerInterval);
        timeUp();
      }
    }, 1000);
  }

  function timeUp() {
    // Auto-submit remaining questions as wrong, then finish module
    const remaining = state.questions.length - state.qIndex;
    for (let i = 0; i < remaining; i++) {
      state.answers.push({ chosen: -1, correct: state.questions[state.qIndex + i]?.correctAnswer, isCorrect: false, timeout: true });
    }
    if (state.moduleIndex === 0) state.mod1Score = state.answers.filter(a=>a.isCorrect).length;
    finishModule();
  }

  // ── HANDLE ANSWER ──────────────────────────────────
  function _handleAnswer(choice, isGrid = false) {
    if (state.answered) return;
    state.answered = true;
    clearInterval(state.timerInterval);

    const q = state.questions[state.qIndex];
    const isCorrect = isGrid
      ? String(choice).toLowerCase() === String(q.correctAnswer).toLowerCase()
      : choice === q.correctAnswer;

    state.answers.push({ chosen: choice, correct: q.correctAnswer, isCorrect, isGrid });

    // Highlight options
    if (!isGrid) {
      document.querySelectorAll(".pt-option-btn").forEach(btn => {
        btn.disabled = true;
        const idx = parseInt(btn.dataset.idx);
        if (idx === q.correctAnswer) btn.classList.add("pt-correct");
        else if (idx === choice && !isCorrect) btn.classList.add("pt-wrong");
      });
    } else {
      const inp = document.getElementById("ptGridInput");
      const sub = document.getElementById("ptGridSubmit");
      if (inp) { inp.disabled = true; inp.classList.add(isCorrect ? "pt-grid-correct" : "pt-grid-wrong"); }
      if (sub) sub.disabled = true;
    }

    // Inline feedback
    const fb = document.getElementById("ptFeedback");
    const color = isCorrect ? "#06D6A0" : "#E62E2D";
    const bg    = isCorrect ? "rgba(6,214,160,0.08)" : "rgba(230,46,45,0.08)";
    const icon  = isCorrect ? "✅" : "❌";
    const correctDisplay = q.questionType === "mcq"
      ? `<strong>${String.fromCharCode(65+q.correctAnswer)}.</strong> ${escH(q.options[q.correctAnswer])}`
      : escH(String(q.correctAnswer));

    fb.innerHTML = `
      <div class="pt-feedback" style="background:${bg}; border-color:${color};">
        <div class="pt-feedback-title" style="color:${color};">${icon} ${isCorrect ? "Correct!" : "Incorrect"}</div>
        <div class="pt-feedback-answer">Correct Answer: ${correctDisplay}</div>
        <div class="pt-feedback-exp">${escH(q.explanation)}</div>
      </div>
    `;

    const nr = document.getElementById("ptNextRow");
    const isLastQ = state.qIndex + 1 >= state.questions.length;
    const isLastMod = state.moduleIndex + 1 >= state.testDef.modules.length;
    nr.innerHTML = `
      <button class="btn btn-primary pt-next-btn" onclick="PracticeTestEngine._next()">
        ${isLastQ ? (isLastMod ? "Finish Test 🏆" : "Continue to Module 2 →") : "Next Question →"}
      </button>
    `;
  }

  function _next() {
    state.qIndex++;
    state.answered = false;
    if (state.qIndex >= state.questions.length) {
      finishModule();
    } else {
      renderTestUI();
    }
  }

  // ── MODULE TRANSITION ──────────────────────────────
  function finishModule() {
    clearInterval(state.timerInterval);
    const modScore = state.answers.filter(a => a.isCorrect).length;

    if (state.moduleIndex === 0) {
      state.mod1Score = modScore;
      // Show module break screen
      renderModuleBreak(modScore);
    } else {
      renderResults();
    }
  }

  function renderModuleBreak(mod1Score) {
    const mount = document.getElementById(state.mountId);
    if (!mount) return;
    const mod2 = state.testDef.modules[1];
    const pct = Math.round((mod1Score / state.testDef.modules[0].qIds.length) * 100);

    mount.innerHTML = `
      <div class="pt-test-shell">
        <div class="pt-break-screen glass-card">
          <div class="pt-break-icon">⏸</div>
          <p class="eyebrow">MODULE 1 COMPLETE</p>
          <h2>Module 1 Results</h2>
          <p class="pt-break-score">${mod1Score} / ${state.testDef.modules[0].qIds.length} correct — ${pct}%</p>
          <div class="results-bar-wrap" style="max-width:320px; margin:16px auto;">
            <div class="results-bar" style="width:${pct}%"></div>
          </div>
          <div class="pt-break-info glass-card">
            <p class="eyebrow" style="margin-bottom:8px;">UP NEXT</p>
            <h3>${escH(mod2.title)}</h3>
            <p style="color:var(--muted); font-size:0.9rem;">${escH(mod2.description)}</p>
            <p style="color:var(--peach); font-weight:700; margin-top:8px;">⏱ ${Math.round(mod2.timeSeconds/60)} minutes · ${mod2.qIds.length} questions</p>
          </div>
          <p style="color:var(--muted); font-size:0.88rem; margin-top:8px;">On the real SAT you'd have a short break here.</p>
          <button class="btn btn-primary" style="margin-top:24px; min-width:260px;" onclick="PracticeTestEngine._startModule2()">
            Start Module 2 →
          </button>
        </div>
      </div>
    `;
  }

  function _startModule2() {
    const mod2 = state.testDef.modules[1];
    state.moduleIndex = 1;
    state.qIndex = 0;
    state.answered = false;
    state.timeLeft = mod2.timeSeconds;
    // Resolve mod2 questions
    const dbKey = state.testDef.subject === "math" ? "MathDatabase" : "EnglishDatabase";
    const db = window[dbKey] ? window[dbKey].questions : [];
    state.questions = resolveQuestions(mod2.qIds, db);
    renderTestUI();
  }

  // ── FINAL RESULTS ──────────────────────────────────
  function renderResults() {
    clearInterval(state.timerInterval);
    const mount = document.getElementById(state.mountId);
    if (!mount) return;

    const mod1Q   = state.testDef.modules[0].qIds.length;
    const mod2Q   = state.testDef.modules[1].qIds.length;
    const total   = mod1Q + mod2Q;
    const mod2Answers = state.answers.slice(mod1Q);
    const mod1Score   = state.mod1Score;
    const mod2Score   = mod2Answers.filter(a => a.isCorrect).length;
    const totalScore  = mod1Score + mod2Score;
    const pct = Math.round((totalScore / total) * 100);

    const grade = pct >= 90 ? "🏆 Elite" : pct >= 78 ? "⭐ Strong" : pct >= 62 ? "📈 Making Progress" : "📚 Keep Practicing";

    // Estimate SAT scaled score (rough)
    const subjectMax  = state.testDef.subject === "math" ? 800 : 800;
    const scaledScore = Math.round(200 + (pct / 100) * 600);

    mount.innerHTML = `
      <div class="pt-test-shell">
        <div class="pt-results-screen">
          <div class="pt-results-hero glass-card">
            <div class="pt-results-trophy">🏆</div>
            <p class="eyebrow">TEST COMPLETE</p>
            <h2>${escH(state.testDef.label)}</h2>
            <div class="pt-results-scaled">~${scaledScore}</div>
            <p style="color:var(--muted); font-size:0.9rem;">Estimated section score (out of 800)</p>
            <p class="results-grade">${grade}</p>
          </div>

          <div class="pt-results-modules">
            <div class="glass-card pt-results-mod-card">
              <p class="eyebrow">MODULE 1</p>
              <h3>${escH(state.testDef.modules[0].title)}</h3>
              <div class="pt-results-score-big">${mod1Score} / ${mod1Q}</div>
              <div class="results-bar-wrap" style="margin-top:10px;">
                <div class="results-bar" style="width:${Math.round(mod1Score/mod1Q*100)}%"></div>
              </div>
              <p class="pt-results-pct">${Math.round(mod1Score/mod1Q*100)}% correct</p>
            </div>

            <div class="glass-card pt-results-mod-card">
              <p class="eyebrow">MODULE 2</p>
              <h3>${escH(state.testDef.modules[1].title)}</h3>
              <div class="pt-results-score-big">${mod2Score} / ${mod2Q}</div>
              <div class="results-bar-wrap" style="margin-top:10px;">
                <div class="results-bar" style="width:${Math.round(mod2Score/mod2Q*100)}%"></div>
              </div>
              <p class="pt-results-pct">${Math.round(mod2Score/mod2Q*100)}% correct</p>
            </div>
          </div>

          <div class="glass-card pt-results-total">
            <div class="pt-results-total-row">
              <span>Total Score</span>
              <span class="pt-results-total-val">${totalScore} / ${total} (${pct}%)</span>
            </div>
            <div class="results-bar-wrap" style="margin-top:12px;">
              <div class="results-bar" style="width:${pct}%"></div>
            </div>
          </div>

          <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-top:8px;">
            <button class="btn btn-primary" onclick="PracticeTestEngine.exitTest('${state.mountId}')">
              Try Another Test
            </button>
            <a href="sat-fundamentals.html" class="btn btn-secondary">Open The Arena</a>
          </div>
        </div>
      </div>
    `;
  }

  // ── EXIT ───────────────────────────────────────────
  function exitTest(mountId) {
    clearInterval(state.timerInterval);
    state.active = false;
    const mount = document.getElementById(mountId);
    if (mount) mount.innerHTML = "";
    // Show the test selector again
    const selector = document.getElementById(mountId + "-selector");
    if (selector) selector.style.display = "block";
    // Scroll back up to test section
    const section = document.getElementById(mountId + "-section");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  }

  // ── HELPERS ────────────────────────────────────────
  function escH(t) {
    if (t == null) return "";
    const d = document.createElement("div");
    d.textContent = t;
    return d.innerHTML;
  }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }

  // ── PUBLIC API ─────────────────────────────────────
  return {
    MATH_TESTS, ENGLISH_TESTS,
    launchTest, exitTest,
    _handleAnswer, _next, _startModule2,
    escH
  };
})();

// ── INIT PRACTICE TEST SELECTORS ON PAGE LOAD ─────────
document.addEventListener("DOMContentLoaded", () => {
  initPracticeTestSelectors();
});

function initPracticeTestSelectors() {
  // MATH PAGE
  const mathMount = document.getElementById("mathPracticeTests");
  if (mathMount) {
    renderTestSelector(mathMount, PracticeTestEngine.MATH_TESTS, "math");
  }
  // ENGLISH PAGE
  const engMount = document.getElementById("englishPracticeTests");
  if (engMount) {
    renderTestSelector(engMount, PracticeTestEngine.ENGLISH_TESTS, "english");
  }
}

function renderTestSelector(mount, tests, subject) {
  const colors = ["", "pt-badge-easy", "pt-badge-medium", "pt-badge-hard"];
  const labels = ["", "Foundation", "Core", "Advanced"];
  const icons  = ["", "📐", "📊", "🎯"];

  const selectorId = mount.id + "-selector";
  const timeLabel  = subject === "math" ? "35 min per module" : "32 min per module";
  const qLabel     = subject === "math" ? "22 questions per module" : "27 questions per module";

  mount.innerHTML = `
    <div id="${selectorId}">
      <div class="pt-selector-grid">
        ${tests.map((test, i) => `
          <div class="pt-selector-card glass-card tilt-card">
            <div class="pt-selector-header">
              <div class="pt-badge ${colors[i+1]}">${labels[i+1]}</div>
              <span class="pt-selector-num">${icons[i+1]} Test ${i+1}</span>
            </div>
            <h3>${PracticeTestEngine.escH(test.label)}</h3>

            <div class="pt-module-list">
              ${test.modules.map(m => `
                <div class="pt-module-row">
                  <span class="pt-module-dot"></span>
                  <div>
                    <strong>${PracticeTestEngine.escH(m.title)}</strong>
                    <p>${PracticeTestEngine.escH(m.description)}</p>
                  </div>
                </div>
              `).join("")}
            </div>

            <div class="pt-selector-meta">
              <span>⏱ ${timeLabel}</span>
              <span>📝 ${qLabel}</span>
              <span>📋 2 modules</span>
            </div>

            <button class="btn btn-primary pt-launch-btn"
              onclick="startPracticeTest('${test.id}', '${mount.id}', '${subject}')">
              Start Test ${i+1} →
            </button>
          </div>
        `).join("")}
      </div>
    </div>
    <div id="${mount.id}-runner" style="display:none;"></div>
  `;

  // Re-apply tilt to new cards
  if (typeof setupTiltCards === "function") setupTiltCards();
}

function startPracticeTest(testId, mountId, subject) {
  const tests = subject === "math"
    ? PracticeTestEngine.MATH_TESTS
    : PracticeTestEngine.ENGLISH_TESTS;
  const testDef = tests.find(t => t.id === testId);
  if (!testDef) return;

  const db = subject === "math"
    ? (typeof MathDatabase !== "undefined" ? MathDatabase.questions : [])
    : (typeof EnglishDatabase !== "undefined" ? EnglishDatabase.questions : []);

  if (!db.length) {
    alert("Questions not loaded yet. Please wait a moment and try again.");
    return;
  }

  // Hide selector, show runner
  const selector = document.getElementById(mountId + "-selector");
  const runner   = document.getElementById(mountId + "-runner");
  if (selector) selector.style.display = "none";
  if (runner)   runner.style.display   = "block";

  // Scroll to test
  const section = document.getElementById(mountId + "-section");
  if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });

  PracticeTestEngine.launchTest(testDef, db, mountId + "-runner");
}
