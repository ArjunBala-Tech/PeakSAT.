/* ══════════════════════════════════════════════════════════════
   PeakSAT — Shared Firebase Data Layer
   peaksat-data.js  (ES Module)

   Single source of truth for everything that gets written to and
   read from Firestore. Both the Arena (script.js) and the Bluebook
   practice tests (bluebook.html) record results through here, and
   the account dashboard (firebase-auth.js) reads them back.

   Firestore shape — users/{uid}:
   {
     displayName, createdAt,
     stats: { quizzesTaken, questionsAnswered, correctAnswers, bestStreak },
     arenaSessions:  [ ArenaSession,  ... ]   // newest appended last
     practiceTests:  [ PracticeTest,  ... ]
     topicStats:     { "<topic>": { correct, total }, ... }
   }

   ArenaSession = {
     id, completedAt, subject, difficulty,
     total, correct, accuracy, bestStreak,
     topics: { "<topic>": { correct, total }, ... }
   }

   PracticeTest = {
     id, completedAt, testId, label, subject,
     level,                       // "Foundation" | "Core" | "Advanced"
     mod1: { score, total }, mod2: { score, total },
     total, correct, accuracy, scaledScore,
     topics: { "<topic>": { correct, total }, ... }
   }
   ══════════════════════════════════════════════════════════════ */

import { initializeApp, getApps, getApp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, increment }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ── Firebase config (same project as firebase-auth.js) ──────────
const firebaseConfig = {
  apiKey:            "AIzaSyCVpb1COT0LCNRFUqKWeK5gJyTpqYHWW6M",
  authDomain:        "peaksat-952ca.firebaseapp.com",
  projectId:         "peaksat-952ca",
  storageBucket:     "peaksat-952ca.firebasestorage.app",
  messagingSenderId: "1025131278284",
  appId:             "1:1025131278284:web:30b2a92d195a882bb1b769"
};

// Reuse the already-initialized app if firebase-auth.js ran first.
const app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

export { auth as fbAuth, db as fbDb };

// Map a test id → difficulty level shown on the practice pages.
// Tests 1/2/3 correspond to Foundation/Core/Advanced respectively.
const LEVEL_BY_TEST = {
  "math-test-1": "Foundation", "english-test-1": "Foundation",
  "math-test-2": "Core",       "english-test-2": "Core",
  "math-test-3": "Advanced",   "english-test-3": "Advanced",
};

export function levelForTest(testId) {
  return LEVEL_BY_TEST[testId] || "Foundation";
}

// ── small helpers ───────────────────────────────────────────────
function uid() { return auth.currentUser ? auth.currentUser.uid : null; }
function userRef(id) { return doc(db, "users", id); }
function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

/** Merge a per-topic tally object into an accumulator (mutates acc). */
function mergeTopics(acc, topics) {
  for (const [topic, t] of Object.entries(topics || {})) {
    if (!acc[topic]) acc[topic] = { correct: 0, total: 0 };
    acc[topic].correct += t.correct || 0;
    acc[topic].total   += t.total   || 0;
  }
  return acc;
}

/**
 * Build a { topic: {correct,total} } map from an array of per-question
 * records shaped like { topic, isCorrect }.
 */
export function tallyTopics(records) {
  const out = {};
  for (const r of records || []) {
    const topic = r.topic || "General";
    if (!out[topic]) out[topic] = { correct: 0, total: 0 };
    out[topic].total += 1;
    if (r.isCorrect) out[topic].correct += 1;
  }
  return out;
}

/** Ensure the user doc exists with the arrays/maps the dashboard expects. */
async function ensureShape(id) {
  const ref  = userRef(id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: auth.currentUser?.displayName || "Student",
      createdAt:   new Date().toISOString(),
      stats: { quizzesTaken: 0, questionsAnswered: 0, correctAnswers: 0, bestStreak: 0 },
      arenaSessions: [], practiceTests: [], topicStats: {}
    });
    return;
  }
  // Back-fill missing fields on older accounts.
  const data  = snap.data();
  const patch = {};
  if (!Array.isArray(data.arenaSessions)) patch.arenaSessions = [];
  if (!Array.isArray(data.practiceTests)) patch.practiceTests = [];
  if (!data.topicStats || typeof data.topicStats !== "object") patch.topicStats = {};
  if (Object.keys(patch).length) await updateDoc(ref, patch);
}

// ── PUBLIC: save an Arena session ───────────────────────────────
/**
 * @param {object} p
 * @param {string} p.subject       "all" | "math" | "english"
 * @param {string} p.difficulty    "all" | "easy" | "medium" | "hard"
 * @param {number} p.total
 * @param {number} p.correct
 * @param {number} p.bestStreak
 * @param {Array}  p.records        [{ topic, isCorrect }, ...]
 * @returns {Promise<ArenaSession|null>}
 */
export async function saveArenaSession({ subject, difficulty, total, correct, bestStreak, records }) {
  const id = uid();
  if (!id) return null;
  await ensureShape(id);

  const topics = tallyTopics(records);
  const session = {
    id: newId(),
    completedAt: new Date().toISOString(),
    subject: subject || "all",
    difficulty: difficulty || "all",
    total, correct,
    accuracy: total ? Math.round((correct / total) * 100) : 0,
    bestStreak: bestStreak || 0,
    topics
  };

  const ref  = userRef(id);
  const snap = await getDoc(ref);
  const topicStats = mergeTopics({ ...(snap.data().topicStats || {}) }, topics);

  await updateDoc(ref, {
    arenaSessions: arrayUnion(session),
    topicStats,
    "stats.quizzesTaken":      increment(1),
    "stats.questionsAnswered": increment(total),
    "stats.correctAnswers":    increment(correct),
  });
  await bumpStreak(ref, bestStreak);
  return session;
}

// ── PUBLIC: save a full Bluebook practice test ──────────────────
/**
 * @param {object} p
 * @param {string} p.testId        e.g. "math-test-2"
 * @param {string} p.label
 * @param {string} p.subject       "math" | "english"
 * @param {object} p.mod1          { score, total }
 * @param {object} p.mod2          { score, total }
 * @param {number} p.scaledScore
 * @param {Array}  p.records        [{ topic, isCorrect }, ...] across both modules
 * @returns {Promise<PracticeTest|null>}
 */
export async function savePracticeTest({ testId, label, subject, mod1, mod2, scaledScore, records }) {
  const id = uid();
  if (!id) return null;
  await ensureShape(id);

  const total   = (mod1.total || 0) + (mod2.total || 0);
  const correct = (mod1.score || 0) + (mod2.score || 0);
  const topics  = tallyTopics(records);

  const test = {
    id: newId(),
    completedAt: new Date().toISOString(),
    testId, label, subject,
    level: levelForTest(testId),
    mod1, mod2,
    total, correct,
    accuracy: total ? Math.round((correct / total) * 100) : 0,
    scaledScore: scaledScore || 0,
    topics
  };

  const ref  = userRef(id);
  const snap = await getDoc(ref);
  const topicStats = mergeTopics({ ...(snap.data().topicStats || {}) }, topics);

  await updateDoc(ref, {
    practiceTests: arrayUnion(test),
    topicStats,
    "stats.quizzesTaken":      increment(1),
    "stats.questionsAnswered": increment(total),
    "stats.correctAnswers":    increment(correct),
  });
  return test;
}

async function bumpStreak(ref, streak) {
  if (!streak) return;
  const snap = await getDoc(ref);
  const cur  = snap.data()?.stats?.bestStreak || 0;
  if (streak > cur) await updateDoc(ref, { "stats.bestStreak": streak });
}

// ── PUBLIC: read the whole user doc ─────────────────────────────
export async function getUserData(id = uid()) {
  if (!id) return null;
  const snap = await getDoc(userRef(id));
  return snap.exists() ? snap.data() : null;
}

// ── PUBLIC: derive dashboard analytics from a user doc ──────────
/**
 * Turns the raw user doc into everything the dashboard renders:
 * separated test lists, per-level groupings, trends, and topic
 * strengths/weaknesses. Pure function — no network.
 */
export function buildAnalytics(data) {
  const arena = [...(data?.arenaSessions || [])].sort(byDate);
  const tests = [...(data?.practiceTests || [])].sort(byDate);

  // Group practice tests by level for the Module Test Analysis section.
  const levels = { Foundation: [], Core: [], Advanced: [] };
  for (const t of tests) (levels[t.level] || (levels[t.level] = [])).push(t);

  const levelSummary = {};
  for (const lvl of ["Foundation", "Core", "Advanced"]) {
    const list = levels[lvl] || [];
    const attempts = list.length;
    const best  = attempts ? Math.max(...list.map(t => t.accuracy)) : 0;
    const last  = attempts ? list[list.length - 1].accuracy : 0;
    const avg   = attempts ? Math.round(list.reduce((s, t) => s + t.accuracy, 0) / attempts) : 0;
    const bestScaled = attempts ? Math.max(...list.map(t => t.scaledScore || 0)) : 0;
    // Trend = change from first to most recent attempt at this level.
    const trend = attempts >= 2 ? last - list[0].accuracy : 0;
    levelSummary[lvl] = { attempts, best, last, avg, bestScaled, trend, list };
  }

  // Topic strengths / weaknesses from the rolled-up map.
  const topicStats = data?.topicStats || {};
  const topics = Object.entries(topicStats)
    .map(([topic, t]) => ({
      topic,
      correct: t.correct, total: t.total,
      accuracy: t.total ? Math.round((t.correct / t.total) * 100) : 0
    }))
    .filter(t => t.total >= 1);

  const ranked    = [...topics].sort((a, b) => b.accuracy - a.accuracy || b.total - a.total);
  const strengths = ranked.filter(t => t.accuracy >= 70).slice(0, 5);
  const weaknesses = [...ranked].reverse().filter(t => t.accuracy < 70).slice(0, 5);

  // Practice-test accuracy trend over time (chronological).
  const testTrend  = tests.map(t => ({ at: t.completedAt, accuracy: t.accuracy, label: t.label, scaled: t.scaledScore }));
  const arenaTrend = arena.map(s => ({ at: s.completedAt, accuracy: s.accuracy, subject: s.subject }));

  const totals = {
    arenaCount: arena.length,
    testCount:  tests.length,
    bestScaled: tests.length ? Math.max(...tests.map(t => t.scaledScore || 0)) : 0,
  };

  return { arena, tests, levels, levelSummary, topics: ranked, strengths, weaknesses, testTrend, arenaTrend, totals };
}

function byDate(a, b) { return new Date(a.completedAt) - new Date(b.completedAt); }
