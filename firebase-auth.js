/* ══════════════════════════════════════════
   PeakSAT — Firebase Authentication Module
   firebase-auth.js  (ES Module, loaded as type="module")
   ══════════════════════════════════════════ */

import { initializeApp, getApps, getApp }
                                     from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth,
         createUserWithEmailAndPassword,
         signInWithEmailAndPassword,
         signOut,
         onAuthStateChanged,
         updateProfile }             from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore,
         doc, setDoc, getDoc,
         updateDoc, increment }      from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { buildAnalytics, getUserData as getUserDoc } from "./peaksat-data.js";

// ── Firebase config ──────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyCVpb1COT0LCNRFUqKWeK5gJyTpqYHWW6M",
  authDomain:        "peaksat-952ca.firebaseapp.com",
  projectId:         "peaksat-952ca",
  storageBucket:     "peaksat-952ca.firebasestorage.app",
  messagingSenderId: "1025131278284",
  appId:             "1:1025131278284:web:30b2a92d195a882bb1b769"
};

const app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Helpers ──────────────────────────────────────────────────

/** Fetch or create a Firestore user-stats document */
async function ensureUserDoc(uid, displayName) {
  const ref  = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName,
      stats: { quizzesTaken: 0, questionsAnswered: 0, correctAnswers: 0, bestStreak: 0 },
      arenaSessions: [], practiceTests: [], topicStats: {},
      createdAt: new Date().toISOString()
    });
    return { displayName, stats: { quizzesTaken:0, questionsAnswered:0, correctAnswers:0, bestStreak:0 } };
  }
  return snap.data();
}

/** Read user doc from Firestore */
async function getUserData(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

/** Increment quiz stats for the logged-in user (called from quiz engine) */
export async function saveQuizStats({ questionsAnswered, correctAnswers, streak }) {
  const user = auth.currentUser;
  if (!user) return;
  const ref = doc(db, "users", user.uid);
  await updateDoc(ref, {
    "stats.quizzesTaken":       increment(1),
    "stats.questionsAnswered":  increment(questionsAnswered),
    "stats.correctAnswers":     increment(correctAnswers),
  });
  // Best streak — read-modify-write
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const current = snap.data().stats.bestStreak || 0;
    if (streak > current) await updateDoc(ref, { "stats.bestStreak": streak });
  }
}

/** Returns the Firebase Auth current user (null if signed out) */
export function getFirebaseUser() {
  return auth.currentUser;
}

/** Listen for auth-state changes (used by nav / other pages) */
export function onUserChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/** Sign out */
export async function firebaseSignOut() {
  await signOut(auth);
  localStorage.removeItem("peakCurrentUser");
}

// ── Account page bootstrap ───────────────────────────────────

export function initAccountPage() {
  const page = document.body.dataset.page;
  if (page !== "account") return;

  // ── element refs ──
  const tabBtns      = document.querySelectorAll(".auth-tab");
  const loginPanel   = document.getElementById("loginPanel");
  const signupPanel  = document.getElementById("signupPanel");
  const dashPanel    = document.getElementById("dashPanel");

  const alertLogin   = document.getElementById("alertLogin");
  const alertSignup  = document.getElementById("alertSignup");

  const loginForm    = document.getElementById("loginForm");
  const signupForm   = document.getElementById("signupForm");
  const logoutBtn    = document.getElementById("logoutBtn");

  // ── tab switching ──
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.tab;
      loginPanel.style.display  = target === "login"  ? "block" : "none";
      signupPanel.style.display = target === "signup" ? "block" : "none";
    });
  });

  // ── password visibility toggles ──
  document.querySelectorAll(".toggle-pw").forEach(btn => {
    btn.addEventListener("click", () => {
      const inp = btn.previousElementSibling;
      if (inp && inp.type) {
        inp.type = inp.type === "password" ? "text" : "password";
        btn.textContent = inp.type === "password" ? "SHOW" : "HIDE";
      }
    });
  });

  // ── password strength ──
  const pwInput  = document.getElementById("signupPassword");
  const pwFill   = document.getElementById("pwStrengthFill");
  const pwLabel  = document.getElementById("pwStrengthLabel");
  if (pwInput && pwFill) {
    pwInput.addEventListener("input", () => {
      const val = pwInput.value;
      let score = 0;
      if (val.length >= 8)              score++;
      if (/[A-Z]/.test(val))           score++;
      if (/[0-9]/.test(val))           score++;
      if (/[^A-Za-z0-9]/.test(val))    score++;
      const pct    = (score / 4) * 100;
      const colors = ["#E62E2D","#FFD166","#06D6A0","#06D6A0"];
      const labels = ["Weak","Fair","Good","Strong"];
      pwFill.style.width      = pct + "%";
      pwFill.style.background = colors[Math.max(0, score-1)] || "#E62E2D";
      if (pwLabel) pwLabel.textContent = val.length ? labels[Math.max(0, score-1)] : "";
    });
  }

  // ── show alert helper ──
  function showAlert(el, msg, type) {
    if (!el) return;
    el.textContent = msg;
    el.className = `auth-alert auth-alert-${type}`;
    el.style.display = "block";
  }
  function clearAlert(el) {
    if (!el) return;
    el.style.display = "none";
    el.textContent = "";
  }

  // ── loading state helper ──
  function setLoading(btn, loading) {
    const spinner = btn.querySelector(".btn-spinner");
    btn.disabled = loading;
    if (spinner) spinner.style.display = loading ? "inline-block" : "none";
  }

  // ── sign-up ──
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAlert(alertSignup);
      const name     = document.getElementById("signupName").value.trim();
      const email    = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value;
      const submitBtn = signupForm.querySelector(".auth-submit");

      if (!name) { showAlert(alertSignup, "Please enter your name.", "error"); return; }
      if (password.length < 6) { showAlert(alertSignup, "Password must be at least 6 characters.", "error"); return; }

      setLoading(submitBtn, true);
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await ensureUserDoc(cred.user.uid, name);
        showAlert(alertSignup, "Account created! Welcome to PeakSAT 🎉", "success");
        signupForm.reset();
        if (pwFill)  { pwFill.style.width = "0%"; }
        if (pwLabel) { pwLabel.textContent = ""; }
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        const msgs = {
          "auth/email-already-in-use": "An account with that email already exists.",
          "auth/invalid-email":        "Please enter a valid email address.",
          "auth/weak-password":        "Password must be at least 6 characters."
        };
        showAlert(alertSignup, msgs[err.code] || err.message, "error");
      } finally {
        setLoading(submitBtn, false);
      }
    });
  }

  // ── sign-in ──
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAlert(alertLogin);
      const email    = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;
      const submitBtn = loginForm.querySelector(".auth-submit");

      setLoading(submitBtn, true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
        showAlert(alertLogin, "Signed in successfully!", "success");
        setTimeout(() => window.location.reload(), 900);
      } catch (err) {
        const msgs = {
          "auth/user-not-found":   "No account found with that email.",
          "auth/wrong-password":   "Incorrect password.",
          "auth/invalid-email":    "Please enter a valid email address.",
          "auth/invalid-credential": "Incorrect email or password."
        };
        showAlert(alertLogin, msgs[err.code] || err.message, "error");
      } finally {
        setLoading(submitBtn, false);
      }
    });
  }

  // ── sign-out ──
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await firebaseSignOut();
      window.location.reload();
    });
  }

  // ── auth state → show dashboard or forms ──
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // signed in
      loginPanel.style.display  = "none";
      signupPanel.style.display = "none";
      document.querySelector(".auth-tabs")?.style && (document.querySelector(".auth-tabs").style.display = "none");
      dashPanel.style.display   = "block";
      await renderDashboard(user);
    } else {
      // signed out
      dashPanel.style.display   = "none";
      loginPanel.style.display  = "block";
      signupPanel.style.display = "none";
      document.querySelector(".auth-tabs")?.style && (document.querySelector(".auth-tabs").style.display = "flex");
    }
  });

  // ── render dashboard ──
  async function renderDashboard(user) {
    if (!dashPanel) return;
    const data = await getUserDoc(user.uid);
    const a    = buildAnalytics(data || {});
    const stats = data?.stats || { quizzesTaken:0, questionsAnswered:0, correctAnswers:0, bestStreak:0 };
    const accuracy = stats.questionsAnswered > 0
      ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100) : 0;
    const initial  = (user.displayName || user.email || "?")[0].toUpperCase();

    dashPanel.innerHTML = `
      <div class="glass-card auth-card dash-wide">
        <div class="dash-header">
          <div class="dash-avatar">${escapeHtml(initial)}</div>
          <div class="dash-user-info">
            <p class="eyebrow" style="margin-bottom:4px;">SIGNED IN</p>
            <h2 style="font-size:1.5rem;margin-bottom:4px;">${escapeHtml(user.displayName || "Student")}</h2>
            <p style="color:var(--muted);font-size:0.88rem;">${escapeHtml(user.email)}</p>
          </div>
          <div class="dash-grade-badge">PeakSAT Student</div>
        </div>

        <p class="eyebrow" style="margin-bottom:16px;">YOUR STATS</p>
        <div class="quiz-stats dash-stats" style="margin-bottom:8px;">
          ${statCard("Quizzes Taken", stats.quizzesTaken)}
          ${statCard("Questions", stats.questionsAnswered)}
          ${statCard("Accuracy", accuracy + "%")}
          ${statCard("Best Streak", "🔥 " + stats.bestStreak)}
        </div>

        <div class="dash-tabs">
          <button class="dash-tab active" data-dtab="tests">Practice Tests</button>
          <button class="dash-tab" data-dtab="modules">Module Tests</button>
          <button class="dash-tab" data-dtab="topics">Topic Analysis</button>
        </div>

        <div class="dash-tab-panel" id="dtab-tests">${renderPracticeTab(a)}</div>
        <div class="dash-tab-panel" id="dtab-modules" style="display:none;">${renderModuleTab(a)}</div>
        <div class="dash-tab-panel" id="dtab-topics" style="display:none;">${renderTopicsTab(a)}</div>

        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:28px;">
          <a href="sat-fundamentals.html" class="btn btn-primary" style="flex:1;min-width:180px;">Enter The Arena</a>
          <a href="math.html" class="btn btn-secondary" style="flex:1;min-width:140px;">Practice Tests</a>
          <button id="logoutBtn" class="btn btn-secondary" style="flex:1;min-width:120px;">Sign Out</button>
        </div>
      </div>
    `;

    // tab switching
    dashPanel.querySelectorAll(".dash-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        dashPanel.querySelectorAll(".dash-tab").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const t = btn.dataset.dtab;
        ["tests","modules","topics"].forEach(name => {
          const el = document.getElementById("dtab-" + name);
          if (el) el.style.display = name === t ? "block" : "none";
        });
      });
    });

    document.getElementById("logoutBtn")?.addEventListener("click", async () => {
      await firebaseSignOut();
      window.location.reload();
    });
  }

  // ════════ TAB: PRACTICE TEST ANALYSIS ════════
  function renderPracticeTab(a) {
    if (!a.tests.length && !a.arena.length) {
      return emptyState("No sessions yet",
        "Take a quiz in The Arena or a full practice test to start building your performance history.");
    }

    // Topic-wise accuracy across everything tracked.
    const topicBars = a.topics.length
      ? a.topics.map(t => topicBar(t)).join("")
      : `<p class="dash-muted">Answer a few questions to see topic-level accuracy.</p>`;

    // Strengths / improvement areas.
    const strengthChips = a.strengths.length
      ? a.strengths.map(t => chip(t, "good")).join("")
      : `<span class="dash-muted">Not enough data yet.</span>`;
    const weakChips = a.weaknesses.length
      ? a.weaknesses.map(t => chip(t, "weak")).join("")
      : `<span class="dash-muted">No weak areas — nice work.</span>`;

    // Recent Arena sessions table.
    const recentArena = a.arena.slice(-6).reverse();
    const arenaRows = recentArena.length
      ? recentArena.map(s => `
          <div class="dash-row">
            <span class="dash-row-main">${subjectLabel(s.subject)} · ${cap(s.difficulty)}</span>
            <span class="dash-row-sub">${s.correct}/${s.total}</span>
            <span class="dash-row-val ${accClass(s.accuracy)}">${s.accuracy}%</span>
            <span class="dash-row-date">${fmtDate(s.completedAt)}</span>
          </div>`).join("")
      : `<p class="dash-muted">No Arena sessions recorded yet.</p>`;

    return `
      <div class="dash-section">
        <h3 class="dash-h3">Performance summary</h3>
        <div class="dash-mini-grid">
          ${miniStat(a.totals.arenaCount, "Arena sessions")}
          ${miniStat(a.totals.testCount, "Practice tests")}
          ${miniStat(overallAccuracy(a) + "%", "Overall accuracy")}
          ${miniStat(a.totals.bestScaled || "—", "Best section score")}
        </div>
      </div>

      <div class="dash-section">
        <h3 class="dash-h3">Topic-wise accuracy</h3>
        <div class="dash-topic-bars">${topicBars}</div>
      </div>

      <div class="dash-section">
        <h3 class="dash-h3">Areas of strength &amp; improvement</h3>
        <div class="dash-split">
          <div>
            <p class="dash-label good">💪 Strengths</p>
            <div class="dash-chips">${strengthChips}</div>
          </div>
          <div>
            <p class="dash-label weak">🎯 Focus next</p>
            <div class="dash-chips">${weakChips}</div>
          </div>
        </div>
      </div>

      <div class="dash-section">
        <h3 class="dash-h3">Recent Arena sessions</h3>
        <div class="dash-rows">${arenaRows}</div>
      </div>
    `;
  }

  // ════════ TAB: MODULE / LEVEL TEST ANALYSIS ════════
  function renderModuleTab(a) {
    if (!a.tests.length) {
      return emptyState("No practice tests yet",
        "Open a full Bluebook practice test from the Math or Reading &amp; Writing pages. Foundation, Core, and Advanced results will appear here.");
    }

    const levelCards = ["Foundation","Core","Advanced"].map(lvl => {
      const s = a.levelSummary[lvl];
      return levelCard(lvl, s);
    }).join("");

    // Comparative bar chart across the three levels (best accuracy each).
    const compare = comparativeChart(a.levelSummary);

    // Score trend across all practice tests over time.
    const trend = trendChart(a.testTrend);

    return `
      <div class="dash-section">
        <h3 class="dash-h3">By difficulty level</h3>
        <div class="dash-level-grid">${levelCards}</div>
      </div>

      <div class="dash-section">
        <h3 class="dash-h3">Comparative analysis</h3>
        <p class="dash-muted" style="margin-bottom:14px;">Best accuracy reached at each difficulty level.</p>
        ${compare}
      </div>

      <div class="dash-section">
        <h3 class="dash-h3">Performance trend</h3>
        <p class="dash-muted" style="margin-bottom:14px;">Accuracy across your practice tests, oldest to newest.</p>
        ${trend}
      </div>
    `;
  }

  // ════════ TAB: TOPIC ANALYSIS ════════
  function renderTopicsTab(a) {
    if (!a.topics.length) {
      return emptyState("No topic data yet",
        "Topic-level accuracy builds up as you answer questions in the Arena and in practice tests.");
    }
    const rows = a.topics.map(t => `
      <div class="dash-topic-row">
        <div class="dash-topic-name">${escapeHtml(t.topic)}</div>
        <div class="dash-topic-track">
          <div class="dash-topic-fill ${accClass(t.accuracy)}" style="width:${t.accuracy}%"></div>
        </div>
        <div class="dash-topic-num">${t.accuracy}% <span class="dash-muted">(${t.correct}/${t.total})</span></div>
      </div>`).join("");

    return `
      <div class="dash-section">
        <h3 class="dash-h3">Every topic, ranked by accuracy</h3>
        <div class="dash-topic-list">${rows}</div>
      </div>
    `;
  }

  // ── small render helpers ──
  function statCard(label, val) {
    return `<div class="quiz-stat"><span class="quiz-stat-label">${label}</span><span class="quiz-stat-value">${val}</span></div>`;
  }
  function miniStat(val, label) {
    return `<div class="dash-mini"><span class="dash-mini-val">${val}</span><span class="dash-mini-label">${label}</span></div>`;
  }
  function topicBar(t) {
    return `
      <div class="dash-tbar">
        <div class="dash-tbar-top"><span>${escapeHtml(t.topic)}</span><span>${t.accuracy}%</span></div>
        <div class="dash-tbar-track"><div class="dash-tbar-fill ${accClass(t.accuracy)}" style="width:${t.accuracy}%"></div></div>
      </div>`;
  }
  function chip(t, kind) {
    return `<span class="dash-chip dash-chip-${kind}">${escapeHtml(t.topic)} · ${t.accuracy}%</span>`;
  }
  function levelCard(lvl, s) {
    const trendStr = s.attempts >= 2
      ? (s.trend > 0 ? `▲ +${s.trend}%` : s.trend < 0 ? `▼ ${s.trend}%` : "● 0%")
      : "—";
    const trendCls = s.trend > 0 ? "good" : s.trend < 0 ? "weak" : "flat";
    return `
      <div class="dash-level-card">
        <div class="dash-level-head">
          <span class="dash-level-badge dash-badge-${lvl.toLowerCase()}">${lvl}</span>
          <span class="dash-level-attempts">${s.attempts} ${s.attempts === 1 ? "attempt" : "attempts"}</span>
        </div>
        ${s.attempts ? `
          <div class="dash-level-score">${s.bestScaled || "—"}<span>best score</span></div>
          <div class="dash-level-stats">
            <div><strong>${s.best}%</strong><span>best acc.</span></div>
            <div><strong>${s.avg}%</strong><span>avg acc.</span></div>
            <div><strong>${s.last}%</strong><span>latest</span></div>
          </div>
          <div class="dash-level-trend ${trendCls}">${trendStr} <span class="dash-muted">trend</span></div>
        ` : `<p class="dash-muted" style="margin-top:14px;">Not attempted yet.</p>`}
      </div>`;
  }

  // Comparative SVG bar chart across levels.
  function comparativeChart(summary) {
    const levels = ["Foundation","Core","Advanced"];
    const colors = { Foundation:"#06D6A0", Core:"#FFD166", Advanced:"#E62E2D" };
    const W = 520, H = 200, pad = 36, bw = 90, gap = (W - pad*2 - bw*3) / 2;
    let bars = "";
    levels.forEach((lvl, i) => {
      const val = summary[lvl].best || 0;
      const x = pad + i * (bw + gap);
      const h = (val / 100) * (H - pad - 24);
      const y = H - 24 - h;
      bars += `
        <rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="8" fill="${colors[lvl]}" opacity="0.85"/>
        <text x="${x + bw/2}" y="${y - 8}" text-anchor="middle" fill="#FFF0ED" font-size="15" font-weight="700">${val}%</text>
        <text x="${x + bw/2}" y="${H - 6}" text-anchor="middle" fill="#C8A49D" font-size="12">${lvl}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" class="dash-svg" role="img" aria-label="Comparative accuracy by level">
      <line x1="${pad}" y1="${H-24}" x2="${W-pad}" y2="${H-24}" stroke="rgba(255,180,162,0.18)"/>
      ${bars}
    </svg>`;
  }

  // Line/area trend chart of practice-test accuracy.
  function trendChart(points) {
    if (!points.length) return `<p class="dash-muted">No tests yet.</p>`;
    const W = 520, H = 180, pad = 30;
    const n = points.length;
    const xFor = i => n === 1 ? W/2 : pad + (i / (n - 1)) * (W - pad*2);
    const yFor = v => (H - pad) - (v / 100) * (H - pad*2);
    const pts = points.map((p, i) => [xFor(i), yFor(p.accuracy)]);
    const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    const area = `${line} L${pts[n-1][0].toFixed(1)},${H-pad} L${pts[0][0].toFixed(1)},${H-pad} Z`;
    const dots = pts.map((p, i) =>
      `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4" fill="#FFB4A2"/>
       <text x="${p[0].toFixed(1)}" y="${(p[1]-10).toFixed(1)}" text-anchor="middle" fill="#FFF0ED" font-size="11">${points[i].accuracy}%</text>`).join("");
    const grid = [0,25,50,75,100].map(v =>
      `<line x1="${pad}" y1="${yFor(v)}" x2="${W-pad}" y2="${yFor(v)}" stroke="rgba(255,180,162,0.08)"/>
       <text x="4" y="${(yFor(v)+4).toFixed(1)}" fill="#C8A49D" font-size="10">${v}</text>`).join("");
    return `<svg viewBox="0 0 ${W} ${H}" class="dash-svg" role="img" aria-label="Accuracy trend across practice tests">
      <defs><linearGradient id="dashTrend" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="rgba(255,180,162,0.35)"/><stop offset="100%" stop-color="rgba(255,180,162,0)"/>
      </linearGradient></defs>
      ${grid}
      <path d="${area}" fill="url(#dashTrend)"/>
      <path d="${line}" fill="none" stroke="#FFB4A2" stroke-width="2.5"/>
      ${dots}
    </svg>`;
  }

  function emptyState(title, body) {
    return `<div class="dash-empty"><div class="dash-empty-icon">📊</div><h3>${title}</h3><p class="dash-muted">${body}</p></div>`;
  }

  // ── tiny data utils ──
  function accClass(p) { return p >= 80 ? "acc-high" : p >= 60 ? "acc-mid" : "acc-low"; }
  function subjectLabel(s) { return s === "math" ? "Math" : s === "english" ? "Reading & Writing" : "Mixed"; }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
  function fmtDate(iso) {
    try { return new Date(iso).toLocaleDateString(undefined, { month:"short", day:"numeric" }); }
    catch { return ""; }
  }
  function overallAccuracy(a) {
    let c = 0, t = 0;
    a.arena.forEach(s => { c += s.correct; t += s.total; });
    a.tests.forEach(s => { c += s.correct; t += s.total; });
    return t ? Math.round((c / t) * 100) : 0;
  }
}

// tiny XSS helper (mirrors the one in script.js)
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
