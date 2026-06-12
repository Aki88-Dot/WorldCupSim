import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
//  2026 FIFA WORLD CUP — MONTE CARLO SIMULATOR
//  5,000 simulations · Dixon-Coles Poisson model · All 104 games
// ═══════════════════════════════════════════════════════════════

// Baseline goals per team per match. 2022 WC ran 2.69/game (1.35/team);
// 2026 qualifiers ran hotter (UEFA 3.31, global 2.81) and the 48-team
// field adds mismatches → more blowouts. We calibrate to ~2.9 total/game,
// between the last WC and the qualifiers, to reflect modern attacking play.
const MU = 1.45;
const NSIMS = 5000;

// ── GROUP ASSIGNMENTS (confirmed: ESPN / NBC Sports / Yahoo Sports) ──
const GS = {
  A:['Mexico','South Korea','South Africa','Czechia'],
  B:['Canada','Qatar','Switzerland','Bosnia-Herz.'],
  C:['Brazil','Morocco','Haiti','Scotland'],
  D:['USA','Paraguay','Australia','Türkiye'],
  E:['Germany','Curaçao',"Côte d'Ivoire",'Ecuador'],
  F:['Netherlands','Japan','Tunisia','Sweden'],
  G:['Belgium','Egypt','Iran','New Zealand'],
  H:['Spain','Cape Verde','Uruguay','Saudi Arabia'],
  I:['France','Senegal','Iraq','Norway'],
  J:['Argentina','Algeria','Austria','Jordan'],
  K:['Portugal','DR Congo','Uzbekistan','Colombia'],
  L:['England','Croatia','Ghana','Panama'],
};

// ── TEAM RATINGS  att/def relative to world average (1.00) ──
// Sources: FIFA Rankings Apr 2026 · BetMGM/FanDuel implied probs
//          Polymarket ($1.5B volume) · ESPN Power Rankings
const T = {
  'France':        {a:1.55,d:1.45,f:'🇫🇷',c:'#0055A4'},
  'Spain':         {a:1.52,d:1.48,f:'🇪🇸',c:'#c60b1e'},
  'England':       {a:1.40,d:1.35,f:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',c:'#012169'},
  'Argentina':     {a:1.45,d:1.38,f:'🇦🇷',c:'#74ACDF'},
  'Brazil':        {a:1.42,d:1.33,f:'🇧🇷',c:'#009C3B'},
  'Portugal':      {a:1.38,d:1.28,f:'🇵🇹',c:'#006600'},
  'Germany':       {a:1.32,d:1.25,f:'🇩🇪',c:'#999'},
  'Netherlands':   {a:1.28,d:1.22,f:'🇳🇱',c:'#FF6600'},
  'Belgium':       {a:1.25,d:1.20,f:'🇧🇪',c:'#EF3340'},
  'Colombia':      {a:1.22,d:1.15,f:'🇨🇴',c:'#D4AF37'},
  'Croatia':       {a:1.18,d:1.18,f:'🇭🇷',c:'#FF3030'},
  'Uruguay':       {a:1.20,d:1.15,f:'🇺🇾',c:'#5EB6E4'},
  'Morocco':       {a:1.12,d:1.18,f:'🇲🇦',c:'#C1272D'},
  'Japan':         {a:1.15,d:1.12,f:'🇯🇵',c:'#BC002D'},
  'Norway':        {a:1.18,d:1.10,f:'🇳🇴',c:'#EF2B2D'},
  'Ecuador':       {a:1.10,d:1.08,f:'🇪🇨',c:'#FFD100'},
  'South Korea':   {a:1.12,d:1.08,f:'🇰🇷',c:'#003478'},
  'Switzerland':   {a:1.10,d:1.12,f:'🇨🇭',c:'#FF0000'},
  'Senegal':       {a:1.12,d:1.05,f:'🇸🇳',c:'#00A859'},
  "Côte d'Ivoire": {a:1.12,d:1.02,f:'🇨🇮',c:'#F77F00'},
  'Austria':       {a:1.10,d:1.05,f:'🇦🇹',c:'#ED2939'},
  'Sweden':        {a:1.08,d:1.05,f:'🇸🇪',c:'#006AA7'},
  'Mexico':        {a:1.10,d:1.02,f:'🇲🇽',c:'#006847',host:1},
  'USA':           {a:1.05,d:1.02,f:'🇺🇸',c:'#B22234',host:1},
  'Canada':        {a:1.02,d:0.98,f:'🇨🇦',c:'#FF0000',host:1},
  'Algeria':       {a:1.02,d:0.98,f:'🇩🇿',c:'#006233'},
  'Türkiye':       {a:1.05,d:0.98,f:'🇹🇷',c:'#E30A17'},
  'Czechia':       {a:1.05,d:1.02,f:'🇨🇿',c:'#D7141A'},
  'Scotland':      {a:0.98,d:0.98,f:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',c:'#003FA5'},
  'Ghana':         {a:1.00,d:0.95,f:'🇬🇭',c:'#006B3F'},
  'Paraguay':      {a:1.00,d:0.98,f:'🇵🇾',c:'#D52B1E'},
  'Egypt':         {a:1.02,d:0.98,f:'🇪🇬',c:'#C8102E'},
  'Iran':          {a:0.98,d:1.00,f:'🇮🇷',c:'#239F40'},
  'Australia':     {a:1.00,d:0.98,f:'🇦🇺',c:'#002B7F'},
  'Tunisia':       {a:1.00,d:1.02,f:'🇹🇳',c:'#E70013'},
  'Bosnia-Herz.':  {a:0.98,d:0.95,f:'🇧🇦',c:'#002395'},
  'South Africa':  {a:0.95,d:0.92,f:'🇿🇦',c:'#007A4D'},
  'DR Congo':      {a:0.95,d:0.90,f:'🇨🇩',c:'#007FFF'},
  'Uzbekistan':    {a:0.90,d:0.88,f:'🇺🇿',c:'#1EB53A'},
  'Cape Verde':    {a:0.92,d:0.90,f:'🇨🇻',c:'#003893'},
  'Saudi Arabia':  {a:0.92,d:0.88,f:'🇸🇦',c:'#006C35'},
  'Jordan':        {a:0.85,d:0.88,f:'🇯🇴',c:'#007A3D'},
  'Iraq':          {a:0.90,d:0.85,f:'🇮🇶',c:'#6B3020'},
  'Panama':        {a:0.85,d:0.88,f:'🇵🇦',c:'#DA121A'},
  'Haiti':         {a:0.80,d:0.82,f:'🇭🇹',c:'#00209F'},
  'Qatar':         {a:0.85,d:0.85,f:'🇶🇦',c:'#8D1B3D'},
  'New Zealand':   {a:0.80,d:0.85,f:'🇳🇿',c:'#444'},
  'Curaçao':       {a:0.75,d:0.80,f:'🇨🇼',c:'#003DA5'},
};

// FIFA Men's World Ranking (Apr 1 2026 snapshot, via ESPN/Wikipedia) for all
// 48 finalists. Used ONLY as the final tiebreaker when teams are level on
// points, goal difference, and goals scored — the official best-thirds order.
const FIFA_RANK = {
  France: 1, Spain: 2, Argentina: 3, England: 4, Portugal: 5, Brazil: 6,
  Netherlands: 7, Morocco: 8, Belgium: 9, Germany: 10, Croatia: 11, Colombia: 13,
  Senegal: 14, Mexico: 15, USA: 16, Uruguay: 17, Japan: 18, Switzerland: 19,
  Iran: 21, 'Türkiye': 22, Ecuador: 23, Austria: 24, 'South Korea': 25,
  Australia: 27, Algeria: 28, Egypt: 29, Canada: 30, Norway: 31, Panama: 33,
  "Côte d'Ivoire": 34, Sweden: 38, Paraguay: 40, Czechia: 41, Scotland: 43,
  Tunisia: 44, 'DR Congo': 46, Uzbekistan: 50, Qatar: 55, Iraq: 57,
  'South Africa': 60, 'Saudi Arabia': 61, Jordan: 63, 'Bosnia-Herz.': 65,
  'Cape Verde': 69, Ghana: 74, 'Curaçao': 82, Haiti: 83, 'New Zealand': 85,
};

// Official ranking order: points → goal difference → goals scored → FIFA rank
// (lower rank number is better, so it sorts ascending). Shared by group tables
// and the best-third comparison so the whole qualification path is consistent.
const byStanding = (a, b) =>
  b.pts - a.pts ||
  b.gd - a.gd ||
  b.gf - a.gf ||
  (FIFA_RANK[a.t] || 999) - (FIFA_RANK[b.t] || 999);

// ── SIMULATION UTILITIES ──────────────────────────────────────────

function pois(λ) {
  const L = Math.exp(-λ); let k = 0, p = 1;
  while (p > L) { p *= Math.random(); k++; }
  return k - 1;
}

// ── PLAYER-AVAILABILITY OVERLAY ───────────────────────────────────
// Generalises the old hardcoded Yamal/Neymar tweaks into a data-driven
// layer sourced from June 2026 squad/injury reporting (ESPN · Sports Mole ·
// SI · Gulf News · Yahoo). Each entry carries an importance weight w (the
// share of the team's attack or defence that player represents), a side,
// and a status. 'out' removes the full weighted share, 'doubt' half of it.
// The net effect is a bounded multiplier — at most −20% per side — so a
// thin team losing a talisman is hit hard while a deep squad shrugs off a
// fringe absence. Tournament-wide status (no per-stage timeline) for now.
const ABSENCE = { out: 1, doubt: 0.5, fit: 0 };
const SEED_PLAYERS = {
  'Spain':     [{ n: 'Lamine Yamal', w: 0.15, side: 'att', status: 'doubt' }],   // hamstring, expected back but eased in
  'Brazil':    [{ n: 'Neymar', w: 0.10, side: 'att', status: 'doubt' }],          // ongoing fitness doubts
  'Germany':   [{ n: 'Serge Gnabry', w: 0.10, side: 'att', status: 'out' },       // thigh, out
                { n: 'Marc-André ter Stegen', w: 0.06, side: 'def', status: 'out' }], // hamstring, out
  'Japan':     [{ n: 'Kaoru Mitoma', w: 0.16, side: 'att', status: 'out' },       // hamstring, out
                { n: 'Takumi Minamino', w: 0.06, side: 'att', status: 'out' }],   // ACL, out
  'England':   [{ n: 'Jack Grealish', w: 0.05, side: 'att', status: 'out' },
                { n: 'Jarrad Branthwaite', w: 0.06, side: 'def', status: 'out' },
                { n: 'Ben White', w: 0.04, side: 'def', status: 'out' }],
  'France':    [{ n: 'Hugo Ekitike', w: 0.03, side: 'att', status: 'out' }],      // deep squad, fringe — minimal
  'Argentina': [{ n: 'Cristian Romero', w: 0.12, side: 'def', status: 'out' },    // knee, ruled out for season
                { n: 'Juan Foyth', w: 0.04, side: 'def', status: 'out' }],
  'Canada':    [{ n: 'Alphonso Davies', w: 0.13, side: 'att', status: 'doubt' }], // hamstring, race to be fit
  'USA':       [{ n: 'Cameron Carter-Vickers', w: 0.06, side: 'def', status: 'out' },
                { n: 'Chris Richards', w: 0.06, side: 'def', status: 'doubt' }],
  'Algeria':   [{ n: 'Luca Zidane', w: 0.05, side: 'def', status: 'doubt' }],     // GK, facial injury
};

// LIVE_INJ holds the availability table the engine currently uses. The
// component sets it from app state (seed + UI edits) before each simulation,
// so getAD always reflects the latest injuries/doubts entered in the UI.
let LIVE_INJ = JSON.parse(JSON.stringify(SEED_PLAYERS));

function getAD(team, ctx = {}) {
  let a = T[team].a, d = T[team].d;
  if (T[team].host) { a *= 1.09; d *= 1.07; }
  const roster = LIVE_INJ[team];
  if (roster) {
    let pa = 0, pd = 0;
    for (const p of roster) {
      const f = ABSENCE[p.status] || 0;
      if (!f) continue;
      if (p.side === 'def') pd += p.w * f; else pa += p.w * f;
    }
    a *= Math.max(0.80, 1 - pa);   // each side degraded by at most 20%
    d *= Math.max(0.80, 1 - pd);
  }
  return { a, d };
}

// ── LIVE RESULTS CONDITIONING ─────────────────────────────────────
// As real games are played, record them here. The model then treats them
// as FACTS — locking in completed matches and only simulating what hasn't
// happened yet (group standings re-form around real results, the bracket
// re-runs from the actual qualifiers). With this table empty, the output
// is a pure pre-tournament projection; every entry sharpens the forecast.
//
//  • Group games: "TeamA|TeamB": [goalsA, goalsB]  (either team order works)
//  • Knockout games: { a, b, ga, gb, pens?, win? }  (win names the advancer;
//    only needed when a tie is settled on penalties / can't be inferred)
//
// Examples (commented out — fill in once the tournament kicks off):
// Optional code-level seed. You can pre-fill results here, but the normal
// way to enter scores is now the "Results" tab in the app — those are saved
// in your browser (on a deployed site) and merged over this seed on load.
//
//  • Group games: "TeamA|TeamB": [goalsA, goalsB]  (either team order works)
//  • Knockout games: { a, b, ga, gb, pens?, win? }  (win names the advancer)
const SEED_RESULTS = {
  group: {
    // 'Brazil|Scotland': [2, 0],
  },
  ko: [
    // { a: 'France', b: 'Senegal', ga: 2, gb: 0 },
  ],
};

// LIVE holds the results the engine currently conditions on. The component
// sets this from app state (seed + UI entries) immediately before each
// simulation run, so actualGroup / actualKO always read the latest scores.
let LIVE = { group: { ...SEED_RESULTS.group }, ko: [...SEED_RESULTS.ko] };

// Completed group result for a pair, oriented to the (tA, tB) call order.
function actualGroup(tA, tB) {
  const r = LIVE.group[`${tA}|${tB}`];
  if (r) return { gA: r[0], gB: r[1] };
  const r2 = LIVE.group[`${tB}|${tA}`];
  if (r2) return { gA: r2[1], gB: r2[0] };
  return null;
}
// Completed knockout result for a pair, oriented to the (tA, tB) call order.
function actualKO(tA, tB) {
  for (const m of LIVE.ko) {
    let gA, gB;
    if (m.a === tA && m.b === tB) { gA = m.ga; gB = m.gb; }
    else if (m.a === tB && m.b === tA) { gA = m.gb; gB = m.ga; }
    else continue;
    const winner = m.win || (gA > gB ? tA : gB > gA ? tB : tA);
    // Penalty score stored in the entry's a-b order; output winner-first so
    // "{winner} win {pens} on penalties" always reads correctly.
    const pens = m.pens
      ? (winner === m.a ? m.pens : m.pens.split('-').reverse().join('-'))
      : null;
    return { gA, gB, winner, pens, aet: gA === gB };
  }
  return null;
}
const N_RESULTS = () => Object.keys(LIVE.group).length + LIVE.ko.length;

// ── RESULTS PERSISTENCE (guarded) ─────────────────────────────────
// On a deployed site this persists entries across reloads via localStorage.
// In sandboxed previews localStorage may be unavailable, so every access is
// wrapped — it silently degrades to in-memory (session-only) and never throws.
const LS_KEY = 'wc2026_live_results';
function loadResults() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const r = JSON.parse(raw);
      if (r && r.group && Array.isArray(r.ko)) return r;
    }
  } catch (e) { /* sandboxed / disabled — fall through */ }
  return { group: { ...SEED_RESULTS.group }, ko: [...SEED_RESULTS.ko] };
}
function saveResults(r) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(r)); } catch (e) { /* no-op */ }
}
const clampGoal = v => {
  const n = parseInt(v, 10);
  if (isNaN(n)) return null;
  return Math.max(0, Math.min(20, n));
};

// ── INJURY PERSISTENCE (guarded) ──────────────────────────────────
// Same approach as results: persists across reloads on a deployed site,
// degrades to in-memory in sandboxed previews, and never throws.
const LS_INJ = 'wc2026_injuries';
const cloneInj = o => JSON.parse(JSON.stringify(o));
function loadInjuries() {
  try {
    const raw = localStorage.getItem(LS_INJ);
    if (raw) { const o = JSON.parse(raw); if (o && typeof o === 'object' && !Array.isArray(o)) return o; }
  } catch (e) { /* sandboxed / disabled */ }
  return cloneInj(SEED_PLAYERS);
}
function saveInjuries(o) {
  try { localStorage.setItem(LS_INJ, JSON.stringify(o)); } catch (e) { /* no-op */ }
}
// Importance presets shown when adding a new injury (share of a side's rating).
const IMP_PRESETS = [['Star', 0.15], ['Key', 0.08], ['Squad', 0.03]];
const impLabel = w => (w >= 0.12 ? 'Star' : w >= 0.06 ? 'Key' : 'Squad');

function sg(tA, tB, ko = false, ctx = {}) {
  const { a: aA, d: dA } = getAD(tA, ctx);
  const { a: aB, d: dB } = getAD(tB, ctx);
  const xA = Math.max(0.15, (aA / dB) * MU);
  const xB = Math.max(0.15, (aB / dA) * MU);
  let gA = pois(xA), gB = pois(xB), pens = false;
  if (ko && gA === gB) {
    gA += pois(xA * 0.33); gB += pois(xB * 0.33);
    if (gA === gB) {
      const pw = 0.5 + (aA + dA - aB - dB) * 0.055;
      if (Math.random() < Math.min(0.65, Math.max(0.35, pw))) gA++;
      else gB++;
      pens = true;
    }
  }
  return { gA, gB, w: gA > gB ? tA : tB, pens };
}

function xgPair(tA, tB, ctx = {}) {
  const { a: aA, d: dA } = getAD(tA, ctx);
  const { a: aB, d: dB } = getAD(tB, ctx);
  return [+(aA / dB * MU).toFixed(2), +(aB / dA * MU).toFixed(2)];
}

// ── ANALYTICAL SCORELINE PREDICTION ───────────────────────────────
//
// The naive "most likely exact scoreline" is a poor predictor: for two
// evenly matched teams the single most frequent score is genuinely 1-1,
// even when one side is 60% to win. So every game looked the same.
//
// Instead we build the full Dixon-Coles Poisson goal grid P(a,b) =
// Pois(a|xgA)·Pois(b|xgB), aggregate it into P(win A) / P(draw) /
// P(win B), decide the RESULT first, then report the single most likely
// scoreline *conditional on that result*. A 1.9-vs-1.0 xG game becomes a
// 2-1 / 2-0 win, a 2.4-vs-0.7 game a 3-0, and only genuinely level games
// stay drawn — producing varied, realistic scorelines grounded in xG.

const FACT = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800];
function pmf(lam, k) { return Math.exp(-lam) * Math.pow(lam, k) / FACT[k]; }

function analyzeMatch(tA, tB, ctx = {}) {
  const [xgA, xgB] = xgPair(tA, tB, ctx);
  const MAXG = 9;
  const pA = [], pB = [];
  for (let k = 0; k <= MAXG; k++) { pA.push(pmf(xgA, k)); pB.push(pmf(xgB, k)); }
  let pWinA = 0, pDraw = 0, pWinB = 0;
  let mWA = [1, 0], mD = [1, 1], mWB = [0, 1];
  let pmWA = 0, pmD = 0, pmWB = 0;
  const all = [];
  for (let a = 0; a <= MAXG; a++) for (let b = 0; b <= MAXG; b++) {
    const p = pA[a] * pB[b];
    if (a <= 6 && b <= 6) all.push({ sc: `${a}-${b}`, p });
    if (a > b)      { pWinA += p; if (p > pmWA) { pmWA = p; mWA = [a, b]; } }
    else if (a < b) { pWinB += p; if (p > pmWB) { pmWB = p; mWB = [a, b]; } }
    else            { pDraw += p; if (p > pmD)  { pmD  = p; mD  = [a, b]; } }
  }
  all.sort((x, y) => y.p - x.p);
  const top3 = all.slice(0, 3).map(x => ({ sc: x.sc, p: +(x.p * 100).toFixed(1) }));
  return { xgA, xgB, pWinA, pDraw, pWinB, mWA, mD, mWB, top3 };
}

// ── REPRESENTATIVE SCORELINE ──────────────────────────────────────
//
// Any single deterministic statistic on low-scoring Poisson data is
// lumpy: the strict mode collapses to 1-0, rounding collapses to 2-1.
// Real tournaments get variety from VARIANCE. So we draw ONE plausible
// scoreline per game *sampled from the xG-derived Poisson*, constrained
// to respect the predicted result (favourites still win, level ties
// draw), and seeded per-matchup so it stays stable across renders.
// The result: a natural spread (1-0, 2-0, 3-1, 0-0, 2-2 …) grounded in
// real xG, with full W/D/L probabilities shown alongside for rigour.

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function poisSeeded(lam, rng) {
  const L = Math.exp(-lam); let k = 0, p = 1;
  do { k++; p *= rng(); } while (p > L);
  return k - 1;
}

// result: 'A' | 'B' | 'D'. Draw a scoreline consistent with the predicted
// result from the xG-derived Poisson. We let the natural Poisson tail
// through — capping only the extreme freak results — so the spread matches
// real tournaments: routine 2-1 / 3-1 / 2-0, regular 3-2 / 4-1 / 4-0, and
// the occasional 5-1 / 6-1 blowout (cf. Spain 7-0 CRC, England 6-2 Iran,
// Israel 4-5 Italy). The losing side scores in proportion to its own xG,
// so minnows don't bag a hatful, but a shootout can still break out.
function sampleScore(m, result, seedKey) {
  const rng = mulberry32(seedStr(seedKey));
  const gap = Math.abs(m.xgA - m.xgB);
  // Only the very lopsided games hard-cap the loser; even games stay open.
  const loserCap = gap >= 1.6 ? 2 : gap >= 0.9 ? 3 : 4;
  for (let i = 0; i < 160; i++) {
    const a = poisSeeded(m.xgA, rng), b = poisSeeded(m.xgB, rng);
    if (a > 6 || b > 6 || a + b > 8) continue;          // trim freak tails only
    if (Math.min(a, b) > loserCap) continue;            // no implausible losing hauls
    if (result === 'A' && a > b) return [a, b];
    if (result === 'B' && b > a) return [a, b];
    if (result === 'D' && a === b && a <= 3) return [a, b]; // draws up to 3-3
  }
  // Deterministic fallback (rare — the sampler almost always finds a fit)
  if (result === 'D') { const g = Math.min(2, Math.round((m.xgA + m.xgB) / 2)); return [g, g]; }
  const aWins = result === 'A';
  const wX = aWins ? m.xgA : m.xgB, lX = aWins ? m.xgB : m.xgA;
  let wG = Math.max(1, Math.min(6, Math.round(wX) + (wX % 1 >= 0.5 ? 1 : 0)));
  let lG = Math.min(loserCap, Math.max(0, Math.round(lX)));
  if (lG >= wG) lG = wG - 1;
  return aWins ? [wG, lG] : [lG, wG];
}

function predScGroup(tA, tB, ctx = {}) {
  const m = analyzeMatch(tA, tB, ctx);
  const edge = m.pWinA - m.pWinB;
  const result = Math.abs(edge) < 0.075 ? 'D' : edge > 0 ? 'A' : 'B';
  const [gA, gB] = sampleScore(m, result, `${tA}|${tB}`);
  const prob = pmf(m.xgA, gA) * pmf(m.xgB, gB);
  return { gA, gB, score: `${gA}-${gB}`, prob, m };
}

// Knockout game. Mirrors the real flow the simulation engine already uses
// for win probabilities: 90 minutes → extra time → penalty shootout if still
// level. The predicted advancer is never shown losing, but a tight tie can
// finish level and be settled on penalties — so close matchups (a France–
// Spain final) surface "(a.e.t.) · won on penalties" while lopsided ties are
// decided in normal time. Returns the regulation/ET scoreline plus an
// extra-time flag and, when it goes the distance, the shootout result.
function predScKO(tA, tB, winner, ctx = {}) {
  const m = analyzeMatch(tA, tB, ctx);
  const winA = winner === tA || (winner !== tB && m.xgA >= m.xgB);
  const rng = mulberry32(seedStr(`${tA}|${tB}|${winner}|ko`));

  // Settled inside 90 minutes? Use the genuine draw probability for this tie.
  if (rng() > m.pDraw) {
    const [gA, gB] = sampleScore(m, winA ? 'A' : 'B', `${tA}|${tB}|${winner}|reg`);
    return { score: `${gA}-${gB}`, aet: false, pens: null };
  }

  // Level after 90 → extra time. Take a plausible level score to carry in.
  const [lvl] = sampleScore(m, 'D', `${tA}|${tB}|${winner}|draw`);

  // Does extra time break the deadlock, or do we go to spot-kicks? Roughly
  // half of WC ties reaching ET are settled before penalties; higher-scoring
  // sides break it slightly more often.
  const pETwin = Math.min(0.6, Math.max(0.35, 0.45 + (m.xgA + m.xgB - 2.4) * 0.1));
  if (rng() < pETwin) {
    const wa = winA ? lvl + 1 : lvl, wb = winA ? lvl : lvl + 1;
    return { score: `${wa}-${wb}`, aet: true, pens: null };
  }

  // Still level → penalty shootout. The predicted winner takes it.
  // Stored winner-first so "{winner} win {pens} on penalties" always reads right.
  const winP = 3 + Math.floor(rng() * 3);          // 3–5
  let loseP = winP - (1 + Math.floor(rng() * 2));  // 1–2 fewer
  if (loseP < 0) loseP = 0;
  return { score: `${lvl}-${lvl}`, aet: true, pens: `${winP}-${loseP}` };
}

// ── GROUP STAGE SIMULATION ────────────────────────────────────────

function simGrp(g) {
  const teams = GS[g];
  const pts = {}, gd = {}, gf = {};
  teams.forEach(t => { pts[t] = 0; gd[t] = 0; gf[t] = 0; });
  const scores = []; let spN = 0;
  const fx = [];
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) fx.push([teams[i], teams[j]]);
  fx.forEach(([tA, tB]) => {
    let gA, gB;
    const act = actualGroup(tA, tB);
    if (act) {                       // completed game — lock in the real score
      gA = act.gA; gB = act.gB;
    } else {                         // not played yet — simulate
      const ctx = {};
      if (tA === 'Spain' || tB === 'Spain') ctx.spN = ++spN;
      const r = sg(tA, tB, false, ctx);
      gA = r.gA; gB = r.gB;
    }
    scores.push({ tA, tB, gA, gB });
    gf[tA] += gA; gf[tB] += gB;
    gd[tA] += (gA - gB); gd[tB] += (gB - gA);
    if (gA > gB) pts[tA] += 3;
    else if (gB > gA) pts[tB] += 3;
    else { pts[tA]++; pts[tB]++; }
  });
  const standings = teams
    .map(t => ({ t, pts: pts[t], gd: gd[t], gf: gf[t] }))
    .sort(byStanding);
  return { standings, scores, fx };
}

// ── OFFICIAL R32 BRACKET TOPOLOGY (FIFA 2026, matches 73–100) ──────
// Each R32 slot lists its two feeders. 'win'/'run' = that group's winner /
// runner-up; 'third' = a best-third whose group lies in the allowed set
// (FIFA Annex C). Source: FIFA / USA TODAY official match list. Note that
// group winners never meet other winners in the R32.
const R32_SLOTS = [
  { a: ['run', 'A'], b: ['run', 'B'] },                          // M73
  { a: ['win', 'E'], b: ['third', ['A','B','C','D','F']] },      // M74
  { a: ['win', 'F'], b: ['run', 'C'] },                          // M75
  { a: ['win', 'C'], b: ['run', 'F'] },                          // M76
  { a: ['win', 'I'], b: ['third', ['C','D','F','G','H']] },      // M77
  { a: ['run', 'E'], b: ['run', 'I'] },                          // M78
  { a: ['win', 'A'], b: ['third', ['C','E','F','H','I']] },      // M79
  { a: ['win', 'L'], b: ['third', ['E','H','I','J','K']] },      // M80
  { a: ['win', 'D'], b: ['third', ['B','E','F','I','J']] },      // M81
  { a: ['win', 'G'], b: ['third', ['A','E','H','I','J']] },      // M82
  { a: ['run', 'K'], b: ['run', 'L'] },                          // M83
  { a: ['win', 'H'], b: ['run', 'J'] },                          // M84
  { a: ['win', 'B'], b: ['third', ['E','F','G','I','J']] },      // M85
  { a: ['win', 'J'], b: ['run', 'H'] },                          // M86
  { a: ['win', 'K'], b: ['third', ['D','E','I','J','L']] },      // M87
  { a: ['run', 'D'], b: ['run', 'G'] },                          // M88
];
// Feeder topology for later rounds, as indices into the previous round's
// match array (matches 89–100). R16[i] = winners of R32[x],R32[y], etc.
const R16_FEED = [[1,4],[0,2],[3,5],[6,7],[10,11],[8,9],[13,15],[12,14]]; // M89–M96 ← R32 idx
const QF_FEED  = [[0,1],[4,5],[2,3],[6,7]];                              // M97–M100 ← R16 idx
const SF_FEED  = [[0,1],[2,3]];                                         // SF ← QF idx
// The 8 R32 slots that take a best-third, with their allowed group sets.
const THIRD_SLOTS = R32_SLOTS
  .map((s, i) => ({ i, from: s.b[0] === 'third' ? s.b[1] : null }))
  .filter(s => s.from);

// FIFA Annex C: assign each qualifying third-place GROUP to a third-slot,
// respecting the allowed sets, as a deterministic bipartite perfect matching
// (valid for every one of the 495 possible 8-of-12 combinations).
function assignThirds(thirdGroups) {
  const order = [...thirdGroups].sort();   // set-deterministic ordering
  const assign = {}; const used = new Set();
  const bt = k => {
    if (k === THIRD_SLOTS.length) return true;
    const slot = THIRD_SLOTS[k];
    for (const g of order) {
      if (used.has(g) || !slot.from.includes(g)) continue;
      used.add(g); assign[slot.i] = g;
      if (bt(k + 1)) return true;
      used.delete(g); delete assign[slot.i];
    }
    return false;
  };
  bt(0);
  return assign;   // R32 slot index -> group letter
}

// Best 8 third-place teams → ranked groups + team-by-group, using the four
// official tiebreakers (byStanding: points → GD → goals → FIFA rank).
function best3rds(thirdRowByGroup) {
  const ranked = Object.keys(thirdRowByGroup)
    .map(g => ({ g, ...thirdRowByGroup[g] }))
    .sort(byStanding).slice(0, 8);
  const teamByGroup = {}; ranked.forEach(x => { teamByGroup[x.g] = x.t; });
  return { groups: ranked.map(x => x.g), teamByGroup };
}

// Build the 16 R32 team pairs from winners/runners-up (q) and the best thirds.
function buildR32(q, thirds) {
  const assign = assignThirds(thirds.groups);
  const teamFor = (side, slotIdx) => {
    const [kind, arg] = side;
    if (kind === 'win') return q[arg].p1;
    if (kind === 'run') return q[arg].p2;
    return thirds.teamByGroup[assign[slotIdx]];   // 'third'
  };
  return R32_SLOTS.map((s, i) => [teamFor(s.a, i), teamFor(s.b, i)]);
}

// ── MONTE CARLO ENGINE ─────────────────────────────────────────────

function runMC() {
  const wf = {}, rf = {}, gsf = {}, gsa = {};
  const koA = {}, koB = {}, koW = {};
  const rounds = ['r32', 'r16', 'qf', 'sf', 'f', 'tp'];
  const rSz = { r32: 16, r16: 8, qf: 4, sf: 2, f: 1, tp: 1 };

  Object.keys(GS).forEach(g => {
    gsf[g] = Array.from({ length: 6 }, () => ({}));
    gsa[g] = {};
    GS[g].forEach(t => {
      wf[t] = 0; rf[t] = { r32: 0, r16: 0, qf: 0, sf: 0, f: 0, w: 0 };
      gsa[g][t] = { pts: 0, gd: 0, gf: 0, ga: 0, w: 0, d: 0, l: 0 };
    });
  });
  rounds.forEach(rnd => {
    const n = rSz[rnd];
    koA[rnd] = Array.from({ length: n }, () => ({}));
    koB[rnd] = Array.from({ length: n }, () => ({}));
    koW[rnd] = Array.from({ length: n }, () => ({}));
  });

  // Play a knockout tie: lock in a completed result if recorded, else simulate.
  const koPlay = (a, b) => { const act = actualKO(a, b); return act ? { w: act.winner } : sg(a, b, true); };

  for (let s = 0; s < NSIMS; s++) {
    const gr = {}; for (const g of Object.keys(GS)) gr[g] = simGrp(g);

    // Accumulate group stats
    for (const [g, res] of Object.entries(gr)) {
      res.scores.forEach((sc, i) => {
        const k = `${sc.gA}-${sc.gB}`;
        gsf[g][i][k] = (gsf[g][i][k] || 0) + 1;
        const ag = gsa[g];
        if (sc.gA > sc.gB) { ag[sc.tA].w++; ag[sc.tB].l++; }
        else if (sc.gB > sc.gA) { ag[sc.tB].w++; ag[sc.tA].l++; }
        else { ag[sc.tA].d++; ag[sc.tB].d++; }
      });
      res.standings.forEach(({ t, pts, gd, gf }) => {
        const a = gsa[g][t]; a.pts += pts; a.gd += gd; a.gf += gf; a.ga += gf - gd;
      });
    }

    // Qualifiers
    const q = {};
    for (const [g, r] of Object.entries(gr)) q[g] = { p1: r.standings[0].t, p2: r.standings[1].t };
    const thirdRow = {}; for (const [g, r] of Object.entries(gr)) thirdRow[g] = r.standings[2];
    const thirds = best3rds(thirdRow);

    // R32 — official slot topology + Annex C third-place assignment
    const r32 = buildR32(q, thirds);
    const r32r = r32.map(([a, b]) => koPlay(a, b));
    const r32w = r32r.map(r => r.w);
    r32.forEach(([a, b], i) => {
      koA.r32[i][a] = (koA.r32[i][a] || 0) + 1;
      koB.r32[i][b] = (koB.r32[i][b] || 0) + 1;
      koW.r32[i][r32w[i]] = (koW.r32[i][r32w[i]] || 0) + 1;
      rf[a].r32++; rf[b].r32++; rf[r32w[i]].r16++;
    });

    // R16 — threaded through the official feeders
    const r16 = R16_FEED.map(([x, y]) => [r32w[x], r32w[y]]);
    const r16r = r16.map(([a, b]) => koPlay(a, b));
    const r16w = r16r.map(r => r.w);
    r16.forEach(([a, b], i) => {
      koA.r16[i][a] = (koA.r16[i][a] || 0) + 1;
      koB.r16[i][b] = (koB.r16[i][b] || 0) + 1;
      koW.r16[i][r16w[i]] = (koW.r16[i][r16w[i]] || 0) + 1;
      rf[r16w[i]].qf++;
    });

    // QF
    const qf = QF_FEED.map(([x, y]) => [r16w[x], r16w[y]]);
    const qfr = qf.map(([a, b]) => koPlay(a, b));
    const qfw = qfr.map(r => r.w);
    qf.forEach(([a, b], i) => {
      koA.qf[i][a] = (koA.qf[i][a] || 0) + 1;
      koB.qf[i][b] = (koB.qf[i][b] || 0) + 1;
      koW.qf[i][qfw[i]] = (koW.qf[i][qfw[i]] || 0) + 1;
      rf[qfw[i]].sf++;
    });

    // SF
    const sf = SF_FEED.map(([x, y]) => [qfw[x], qfw[y]]);
    const sfr = sf.map(([a, b]) => koPlay(a, b));
    const sfw = sfr.map(r => r.w);
    const sfl = sfr.map((r, i) => sf[i][r.w === sf[i][0] ? 1 : 0]);
    sf.forEach(([a, b], i) => {
      koA.sf[i][a] = (koA.sf[i][a] || 0) + 1;
      koB.sf[i][b] = (koB.sf[i][b] || 0) + 1;
      koW.sf[i][sfw[i]] = (koW.sf[i][sfw[i]] || 0) + 1;
      rf[sfw[i]].f++;
    });

    // 3rd place
    const tp = [sfl[0], sfl[1]];
    const tpr = koPlay(tp[0], tp[1]);
    koA.tp[0][tp[0]] = (koA.tp[0][tp[0]] || 0) + 1;
    koB.tp[0][tp[1]] = (koB.tp[0][tp[1]] || 0) + 1;
    koW.tp[0][tpr.w] = (koW.tp[0][tpr.w] || 0) + 1;

    // Final
    const fn = [sfw[0], sfw[1]];
    const fnr = koPlay(fn[0], fn[1]);
    koA.f[0][fn[0]] = (koA.f[0][fn[0]] || 0) + 1;
    koB.f[0][fn[1]] = (koB.f[0][fn[1]] || 0) + 1;
    koW.f[0][fnr.w] = (koW.f[0][fnr.w] || 0) + 1;
    rf[fnr.w].w++; wf[fnr.w] = (wf[fnr.w] || 0) + 1;
  }

  // Normalize group accumulators
  for (const teams of Object.values(gsa))
    for (const v of Object.values(teams))
      for (const k of ['pts','gd','gf','ga','w','d','l']) v[k] /= NSIMS;

  const top = obj => Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0] || '?';
  const topN = (n, obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);

  // Group game predictions — analytical conditional-mode scorelines
  const groupGames = {};
  for (const g of Object.keys(GS)) {
    const teams = GS[g]; let spN = 0, fi = 0;
    const fx = [];
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
      const [tA, tB] = [teams[i], teams[j]];
      const act = actualGroup(tA, tB);
      if (act) {
        // Completed game — show the real result, not a projection.
        const gA = act.gA, gB = act.gB;
        fx.push({
          tA, tB, gA, gB, score: `${gA}-${gB}`, actual: true,
          wA: gA > gB ? 100 : 0, wB: gB > gA ? 100 : 0, dr: gA === gB ? 100 : 0,
        });
      } else {
        const ctx = {}; if (tA === 'Spain' || tB === 'Spain') ctx.spN = ++spN;
        const pred = predScGroup(tA, tB, ctx);
        const m = pred.m;
        fx.push({
          tA, tB, gA: pred.gA, gB: pred.gB, score: pred.score, xg: [m.xgA, m.xgB],
          topFreq: +(pred.prob * 100).toFixed(0), top3: m.top3,
          wA: +(m.pWinA * 100).toFixed(0), wB: +(m.pWinB * 100).toFixed(0),
          dr: +(m.pDraw * 100).toFixed(0),
        });
      }
      fi++;
    }
    groupGames[g] = fx;
  }

  // Group standings — derived from the SAME predicted scorelines shown in
  // the fixtures list, so the W/D/L/GF/GA/Pts columns match exactly.
  const groupStandings = {};
  for (const g of Object.keys(GS)) {
    const tbl = {};
    GS[g].forEach(t => { tbl[t] = { t, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }; });
    groupGames[g].forEach(({ tA, tB, gA, gB }) => {
      tbl[tA].gf += gA; tbl[tA].ga += gB; tbl[tB].gf += gB; tbl[tB].ga += gA;
      if (gA > gB) { tbl[tA].w++; tbl[tA].pts += 3; tbl[tB].l++; }
      else if (gB > gA) { tbl[tB].w++; tbl[tB].pts += 3; tbl[tA].l++; }
      else { tbl[tA].d++; tbl[tB].d++; tbl[tA].pts++; tbl[tB].pts++; }
    });
    GS[g].forEach(t => { tbl[t].gd = tbl[t].gf - tbl[t].ga; });
    groupStandings[g] = Object.values(tbl).sort(byStanding);
  }

  // KO slot predictions
  // ── COHERENT THREADED BRACKET (official FIFA topology) ─────────────
  // Participants come from the predicted group tables; each tie's winner is
  // carried forward through the real match wiring (M73–M104). Because every
  // later game is fed by two DISTINCT earlier games, it's structurally
  // impossible for an eliminated team to reappear or for a team to play itself.

  // Qualifiers + best thirds straight from the predicted standings.
  const q = {};
  for (const g of Object.keys(GS)) q[g] = { p1: groupStandings[g][0].t, p2: groupStandings[g][1].t };
  const thirdRowD = {}; for (const g of Object.keys(GS)) thirdRowD[g] = groupStandings[g][2];
  const thirds = best3rds(thirdRowD);
  const thirdAssign = assignThirds(thirds.groups);
  const r32pairs = buildR32(q, thirds);

  // Human-readable slot label, e.g. "M74 · E1 v 3rd C".
  const slotCode = side => side[0] === 'win' ? side[1] + '1' : side[1] + '2';
  const r32Labels = R32_SLOTS.map((s, i) => {
    const a = slotCode(s.a);
    const b = s.b[0] === 'third' ? `3rd ${thirdAssign[i] || '—'}` : slotCode(s.b);
    return `M${73 + i} · ${a} v ${b}`;
  });

  // Head-to-head advancement probability for tA (regulation win + a share of
  // the draw, resolved in extra time / penalties proportional to strength).
  const advProbA = (tA, tB) => {
    const m = analyzeMatch(tA, tB);
    const denom = m.pWinA + m.pWinB || 1;
    return m.pWinA + m.pDraw * (m.pWinA / denom);
  };
  // Per-slot Monte Carlo context (who else tends to occupy this slot), kept
  // purely as supplementary colour in the expanded card / alternates line.
  const mcCtx = (rnd, idx, tA, tB) => {
    const sA = (koA[rnd] && koA[rnd][idx]) || {}, sB = (koB[rnd] && koB[rnd][idx]) || {};
    const top4 = o => Object.entries(o).sort((x, y) => y[1] - x[1]).slice(0, 4).map(([t, c]) => ({ t, p: +(c / NSIMS * 100).toFixed(0) }));
    return { pA: (sA[tA] || 0) / NSIMS, pB: (sB[tB] || 0) / NSIMS, altA: top4(sA), altB: top4(sB) };
  };
  const koGame = (rnd, idx, tA, tB) => {
    const { pA, pB, altA, altB } = mcCtx(rnd, idx, tA, tB);
    const act = actualKO(tA, tB);
    if (act) {
      // Completed knockout tie — lock in the real result and winner.
      return {
        tA, tB, winner: act.winner, winPA: act.winner === tA ? 1 : 0, winP: 1,
        score: `${act.gA}-${act.gB}`, aet: act.aet, pens: act.pens, actual: true,
        pA, pB, altA, altB,
      };
    }
    const aAdv = advProbA(tA, tB);
    const winner = aAdv >= 0.5 ? tA : tB;
    const ko = predScKO(tA, tB, winner);
    return {
      tA, tB, winner, winPA: +aAdv.toFixed(2), winP: +Math.max(aAdv, 1 - aAdv).toFixed(2),
      score: ko.score, aet: ko.aet, pens: ko.pens, pA, pB, altA, altB,
    };
  };
  const loserOf = g => (g.tA === g.winner ? g.tB : g.tA);

  // Thread winners forward through the official feeder topology.
  const r32 = r32pairs.map(([a, b], i) => ({ ...koGame('r32', i, a, b), label: r32Labels[i] }));
  const r16 = R16_FEED.map(([x, y], i) => koGame('r16', i, r32[x].winner, r32[y].winner));
  const qf  = QF_FEED.map(([x, y], i) => koGame('qf', i, r16[x].winner, r16[y].winner));
  const sf  = SF_FEED.map(([x, y], i) => koGame('sf', i, qf[x].winner, qf[y].winner));
  const final = koGame('f', 0, sf[0].winner, sf[1].winner);
  const tp = koGame('tp', 0, loserOf(sf[0]), loserOf(sf[1]));   // 3rd place = losing semi-finalists
  const bracket = { r32, r16, qf, sf, final, tp };

  const winProbs = Object.entries(wf)
    .map(([t, c]) => ({ t, p: +(c / NSIMS * 100).toFixed(1) }))
    .filter(x => x.p > 0.04).sort((a, b) => b.p - a.p);

  const reachProbs = Object.entries(rf)
    .filter(([_, v]) => v.r32 > 0)
    .map(([t, v]) => ({
      t, ...Object.fromEntries(Object.entries(v).map(([k, c]) => [k, +(c / NSIMS * 100).toFixed(1)]))
    }))
    .sort((a, b) => (b.w || 0) - (a.w || 0)).slice(0, 16);

  return { groupGames, groupStandings, bracket, winProbs, reachProbs, nResults: N_RESULTS() };
}

// ═══════════════════════════════════════════════════════════════
//  REACT COMPONENT
// ═══════════════════════════════════════════════════════════════

const F = t => T[t]?.f || '⚽';
const C = t => T[t]?.c || '#555';

export default function WC2026() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('prediction');
  const [grp, setGrp] = useState('A');
  const [rnd, setRnd] = useState('r32');
  const [expanded, setExpanded] = useState(null);
  const [results, setResults] = useState(loadResults);
  const [injuries, setInjuries] = useState(loadInjuries);
  const [injDraft, setInjDraft] = useState({ team: '', n: '', side: 'att', w: 0.08, status: 'out' });
  const [scoreDraft, setScoreDraft] = useState({});   // in-progress score boxes, keyed per fixture
  const [computing, setComputing] = useState(false);

  // Re-condition and re-simulate whenever results OR injuries change (and on
  // mount). Pushing both into LIVE / LIVE_INJ just before runMC keeps the
  // engine in sync. The cleanup-cancel naturally debounces rapid edits.
  useEffect(() => {
    LIVE = results;
    LIVE_INJ = injuries;
    saveResults(results);
    saveInjuries(injuries);
    setComputing(true);
    const t = setTimeout(() => { setData(runMC()); setComputing(false); }, 80);
    return () => clearTimeout(t);
  }, [results, injuries]);

  // ── Score-entry handlers ──
  const setGroupScore = (tA, tB, aStr, bStr) => {
    setResults(prev => {
      const group = { ...prev.group };
      delete group[`${tA}|${tB}`]; delete group[`${tB}|${tA}`];
      const a = clampGoal(aStr), b = clampGoal(bStr);
      if (a != null && b != null) group[`${tA}|${tB}`] = [a, b];
      return { ...prev, group };
    });
  };
  const setKOScore = (tA, tB, aStr, bStr, penWin) => {
    setResults(prev => {
      const ko = prev.ko.filter(m => !((m.a === tA && m.b === tB) || (m.a === tB && m.b === tA)));
      const a = clampGoal(aStr), b = clampGoal(bStr);
      if (a != null && b != null) {
        const entry = { a: tA, b: tB, ga: a, gb: b };
        if (a === b) entry.win = penWin || tA;   // a draw needs a shootout winner
        ko.push(entry);
      }
      return { ...prev, ko };
    });
  };
  const clearAllResults = () => { setResults({ group: {}, ko: [] }); setScoreDraft({}); };

  // ── Injury-entry handlers ──
  const setInjStatus = (team, idx, status) => setInjuries(prev => ({
    ...prev, [team]: prev[team].map((p, i) => (i === idx ? { ...p, status } : p)),
  }));
  const removeInjury = (team, idx) => setInjuries(prev => {
    const arr = prev[team].filter((_, i) => i !== idx);
    const next = { ...prev };
    if (arr.length) next[team] = arr; else delete next[team];
    return next;
  });
  const addInjury = () => {
    const { team, n, side, w, status } = injDraft;
    if (!team || !n.trim()) return;
    setInjuries(prev => ({ ...prev, [team]: [...(prev[team] || []), { n: n.trim(), w, side, status }] }));
    setInjDraft({ team: '', n: '', side: 'att', w: 0.08, status: 'out' });
  };
  const resetInjuries = () => setInjuries(cloneInj(SEED_PLAYERS));

  // Current stored value for an input pair (group), oriented to (tA,tB).
  const groupVal = (tA, tB) => {
    const r = results.group[`${tA}|${tB}`];
    if (r) return [r[0], r[1]];
    const r2 = results.group[`${tB}|${tA}`];
    if (r2) return [r2[1], r2[0]];
    return ['', ''];
  };
  const koVal = (tA, tB) => {
    const m = results.ko.find(m => (m.a === tA && m.b === tB) || (m.a === tB && m.b === tA));
    if (!m) return ['', '', null];
    return m.a === tA ? [m.ga, m.gb, m.win] : [m.gb, m.ga, m.win];
  };

  if (!data) return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(900px 460px at 50% 30%, #243667 0%, rgba(36,54,103,0) 65%), linear-gradient(168deg,#131C42,#0B1029)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <div style={{ fontSize: '3rem', animation: 'spin 1.5s linear infinite' }}>⚽</div>
      <div style={{ color: '#FFCE3A', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.2em', marginTop: '20px' }}>SIMULATING TOURNAMENT</div>
      <div style={{ color: '#93A4CC', fontSize: '0.72rem', marginTop: '8px', letterSpacing: '0.1em' }}>5,000 MONTE CARLO ITERATIONS · 104 GAMES EACH</div>
      <div style={{ color: '#62749F', fontSize: '0.65rem', marginTop: '4px' }}>Poisson xG model · Injury adjustments · Bracket projection</div>
    </div>
  );

  const winner = data.bracket.final.winner;
  const finalist = data.bracket.final.tA === winner ? data.bracket.final.tB : data.bracket.final.tA;
  const winP = data.winProbs.find(x => x.t === winner)?.p || 0;
  const maxWP = data.winProbs[0]?.p || 1;

  // ── STYLES ──
  // Brighter, more vibrant palette: lifted text tones for readability, a
  // richer royal-blue ground with a soft top glow, and clearer card/borders.
  const bg = '#0C1330', card = '#16213F', border = '#2C3D66';
  const gold = '#FFCE3A', silver = '#D8E2F7', dim = '#93A4CC', dimmer = '#62749F';
  const green = '#34D399', amber = '#FBBF24', red = '#F87171', accent = '#3DA9FC';
  const font = "'Courier New', Courier, monospace";

  const sx = {
    app: {
      minHeight: '100vh',
      background: 'radial-gradient(1100px 520px at 50% -8%, #243667 0%, rgba(36,54,103,0) 62%), linear-gradient(168deg,#131C42 0%, #0E1534 52%, #0B1029 100%)',
      backgroundColor: '#0C1330', backgroundAttachment: 'fixed',
      fontFamily: font, color: silver,
    },
    hdr: { background: 'linear-gradient(180deg, rgba(40,58,110,0.55) 0%, rgba(12,19,48,0) 100%)', borderBottom: `1px solid ${border}`, padding: '20px 20px 0' },
    card: { background: card, border: `1px solid ${border}`, padding: '14px', borderRadius: '8px' },
    label: { fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: dim },
    tab: { background: 'none', border: 'none', padding: '11px 16px', fontFamily: font, fontSize: '0.75rem', cursor: 'pointer', letterSpacing: '0.08em', borderBottom: '2px solid transparent', transition: 'all .18s ease' },
    rndBtn: { background: 'none', border: 'none', padding: '8px 12px', fontFamily: font, fontSize: '0.7rem', cursor: 'pointer', letterSpacing: '0.1em', borderBottom: '2px solid transparent', borderRadius: '6px 6px 0 0', transition: 'all .18s ease' },
    grpBtn: { background: 'none', border: `1px solid ${border}`, color: dim, padding: '5px 10px', fontFamily: font, cursor: 'pointer', fontSize: '0.72rem', borderRadius: '6px', transition: 'all .18s ease' , letterSpacing: '0.05em' },
    bar: { height: '3px', background: dimmer, borderRadius: '2px', overflow: 'hidden' },
    mono: { fontFamily: font },
  };

  // ── MATCH CARD (reusable) ──
  const MatchCard = ({ g, roundLabel, idx, isGroupGame = false }) => {
    const key = `${roundLabel}-${idx}`;
    const open = expanded === key;
    const [sA, sB] = g.score.split('-').map(Number);
    const isKO = g.winPA != null;
    const pctA = isKO ? +(g.winPA * 100).toFixed(0) : (g.wA != null ? g.wA : (sA > sB ? 60 : sB > sA ? 40 : 50));
    const pctB = isKO ? 100 - pctA : (g.wB != null ? g.wB : 100 - pctA);
    const pctD = isKO ? 0 : (g.dr != null ? g.dr : 0);
    const hasWinner = sA !== sB;
    // Who advances — from the explicit winner for KO ties (covers penalty
    // draws where the score is level), else from the scoreline itself.
    const advA = g.winner ? g.winner === g.tA : sA > sB;
    const advB = g.winner ? g.winner === g.tB : sB > sA;

    return (
      <div onClick={() => setExpanded(open ? null : key)}
        style={{ ...sx.card, cursor: 'pointer', borderColor: g.actual ? green : open ? accent : border, marginBottom: 0, transition: 'border-color .15s' }}>
        <div style={{ ...sx.label, marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{roundLabel} {isGroupGame ? `· Match ${idx + 1}` : `· #${idx + 1}`}</span>
          {g.actual && <span style={{ color: green, fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em' }}>✓ RESULT</span>}
          {!g.actual && g.label && <span style={{ color: dimmer, fontSize: '0.55rem' }}>{g.label}</span>}
          {!g.actual && g.xg && <span style={{ color: dimmer, fontSize: '0.58rem' }}>xG {g.xg[0]}–{g.xg[1]}</span>}
        </div>

        {/* Score row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '8px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>{F(g.tA)}</div>
            <div style={{ fontSize: '0.72rem', color: advA ? '#fff' : silver, marginTop: '4px', lineHeight: 1.2 }}>{g.tA}</div>
            <div style={{ fontSize: '0.58rem', color: advA ? (g.actual ? green : gold) : dim, marginTop: '3px' }}>{g.actual ? (advA ? 'W' : sA === sB ? 'D' : 'L') : `${pctA}%`}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '0 4px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '0.1em', lineHeight: 1 }}>
              {sA}<span style={{ color: dim, fontSize: '1.4rem', margin: '0 2px' }}>–</span>{sB}
            </div>
            <div style={{ fontSize: '0.52rem', color: g.actual ? green : g.aet ? '#E8B45A' : dimmer, letterSpacing: '0.12em', marginTop: '2px' }}>
              {g.actual ? (g.pens ? 'PENALTIES' : g.aet ? 'A.E.T. · FINAL' : 'FINAL') : g.aet ? 'A.E.T.' : 'PREDICTED'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>{F(g.tB)}</div>
            <div style={{ fontSize: '0.72rem', color: advB ? '#fff' : silver, marginTop: '4px', lineHeight: 1.2 }}>{g.tB}</div>
            <div style={{ fontSize: '0.58rem', color: advB ? (g.actual ? green : gold) : dim, marginTop: '3px' }}>{g.actual ? (advB ? 'W' : sA === sB ? 'D' : 'L') : `${pctB}%`}</div>
          </div>
        </div>

        {/* Penalty shootout line */}
        {g.pens && (
          <div style={{ textAlign: 'center', fontSize: '0.62rem', color: '#E8B45A', marginTop: '6px', letterSpacing: '0.04em' }}>
            {g.winner} win {g.pens} on penalties
          </div>
        )}

        {/* Probability bar (3-way for group games, 2-way for knockouts) */}
        <div style={{ ...sx.bar, margin: '8px 0 4px', display: 'flex' }}>
          <div style={{ width: `${pctA}%`, height: '100%', background: C(g.tA) + 'CC' }} />
          {pctD > 0 && <div style={{ width: `${pctD}%`, height: '100%', background: dim }} />}
          <div style={{ flex: 1, height: '100%', background: C(g.tB) + 'CC' }} />
        </div>
        {!isKO && pctD > 0 && (
          <div style={{ textAlign: 'center', fontSize: '0.52rem', color: dimmer, letterSpacing: '0.08em' }}>draw {pctD}%</div>
        )}

        {/* Expanded details */}
        {open && (
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${border}`, fontSize: '0.62rem', color: dim, lineHeight: 1.8 }}>
            {g.winner && <div>Predicted winner: <span style={{ color: gold }}>{g.winner}</span> ({+(g.winP * 100).toFixed(0)}% of sims)</div>}
            {g.pA != null && <div>Slot A ({g.tA}) probability: {+(g.pA * 100).toFixed(0)}% of sims</div>}
            {g.pB != null && <div>Slot B ({g.tB}) probability: {+(g.pB * 100).toFixed(0)}% of sims</div>}
            {g.altA?.length > 1 && <div>Alt for slot A: {g.altA.slice(1, 4).map(x => `${x.t} (${x.p}%)`).join(', ')}</div>}
            {g.altB?.length > 1 && <div>Alt for slot B: {g.altB.slice(1, 4).map(x => `${x.t} (${x.p}%)`).join(', ')}</div>}
            {g.top3 && <div>Top outcomes: {g.top3.map(x => `${x.sc} (${x.p}%)`).join(' · ')}</div>}
            {g.wA != null && <div>W/D/L: {g.tA} {g.wA}% · Draw {g.dr}% · {g.tB} {g.wB}%</div>}
          </div>
        )}
      </div>
    );
  };

  // ── PREDICTION TAB ──
  const renderPrediction = () => {
    const path = ['r32','r16','qf','sf'].map(r => ({
      rnd: r.toUpperCase().replace('r', 'R'), rndRaw: r,
      g: data.bracket[r].find(g => g.winner === winner)
    })).concat([{ rnd: 'FINAL', rndRaw: 'f', g: data.bracket.final }])
      .filter(x => x.g);

    return (
      <div>
        {/* Champion card */}
        <div style={{ ...sx.card, border: `2px solid ${gold}`, marginBottom: '16px', background: 'linear-gradient(135deg,#1B2A55,#101A3C)' }}>
          <div style={{ ...sx.label, color: '#D7B24A', marginBottom: '12px' }}>◈ Monte Carlo Champion — {NSIMS.toLocaleString()} Simulations</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
            {/* Winner */}
            <div style={{ textAlign: 'center', minWidth: '110px' }}>
              <div style={{ fontSize: '3.5rem', lineHeight: 1 }}>{F(winner)}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', marginTop: '8px', letterSpacing: '0.05em' }}>{winner.toUpperCase()}</div>
              <div style={{ fontSize: '2rem', color: gold, fontWeight: 900, lineHeight: 1 }}>{winP}%</div>
              <div style={{ ...sx.label, marginTop: '2px' }}>win probability</div>
            </div>
            {/* Path */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ ...sx.label, marginBottom: '10px' }}>Predicted path to glory</div>
              {path.map(({ rnd, g }) => {
                const opp = g.tA === winner ? g.tB : g.tA;
                const [a, b] = g.score.split('-').map(Number);
                const dispScore = g.tA === winner ? `${a}-${b}` : `${b}-${a}`;
                const tag = g.pens ? ' pens' : g.aet ? ' aet' : '';
                return (
                  <div key={rnd} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '0.75rem' }}>
                    <span style={{ color: dimmer, width: '42px', flexShrink: 0, fontSize: '0.6rem', letterSpacing: '0.08em' }}>{rnd}</span>
                    <span style={{ color: dim, fontSize: '0.65rem' }}>{g.pens ? 'bt' : 'def.'}</span>
                    <span style={{ fontSize: '1rem' }}>{F(opp)}</span>
                    <span style={{ color: silver, flex: 1 }}>{opp}</span>
                    <span style={{ color: gold, fontWeight: 700, fontFamily: font }}>
                      {dispScore}{tag && <span style={{ color: '#E8B45A', fontSize: '0.62rem', fontWeight: 400 }}>{tag}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Final matchup */}
            <div style={{ minWidth: '200px' }}>
              <div style={{ ...sx.label, marginBottom: '8px' }}>Predicted final</div>
              <div style={{ background: '#0F1733', border: `1px solid ${border}`, padding: '10px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.4rem' }}>{F(winner)}</span>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>{winner}</span>
                  <span style={{ color: gold, fontWeight: 900, fontSize: '1.3rem', margin: '0 6px' }}>
                    {(() => { const [a, b] = data.bracket.final.score.split('-').map(Number); return data.bracket.final.tA === winner ? `${a}-${b}` : `${b}-${a}`; })()}
                  </span>
                  <span style={{ color: silver, fontSize: '0.8rem' }}>{finalist}</span>
                  <span style={{ fontSize: '1.4rem' }}>{F(finalist)}</span>
                </div>
                {data.bracket.final.pens
                  ? <div style={{ textAlign: 'center', fontSize: '0.58rem', color: '#E8B45A', marginTop: '6px' }}>a.e.t. · won {data.bracket.final.pens} on penalties · MetLife Stadium</div>
                  : <div style={{ textAlign: 'center', fontSize: '0.58rem', color: dimmer, marginTop: '6px' }}>{data.bracket.final.aet ? 'after extra time · ' : ''}MetLife Stadium · July 19, 2026</div>}
              </div>
              <div style={{ ...sx.label, marginBottom: '6px' }}>3rd place</div>
              <div style={{ fontSize: '0.75rem', color: dim }}>
                {F(data.bracket.tp.winner)} {data.bracket.tp.winner}
                <span style={{ color: dimmer, margin: '0 6px' }}>vs</span>
                {F(data.bracket.tp.tA === data.bracket.tp.winner ? data.bracket.tp.tB : data.bracket.tp.tA)}
                {' '}{data.bracket.tp.tA === data.bracket.tp.winner ? data.bracket.tp.tB : data.bracket.tp.tA}
              </div>
            </div>
          </div>
        </div>

        {/* Top 12 probabilities */}
        <div style={{ ...sx.label, marginBottom: '10px' }}>Win probability — top 12 contenders</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '8px', marginBottom: '20px' }}>
          {data.winProbs.slice(0, 12).map((x, i) => (
            <div key={x.t} style={{ ...sx.card, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: i < 3 ? [gold, silver, '#CD7F32'][i] : dim, fontWeight: 700, fontSize: '0.8rem', width: '18px' }}>{i + 1}</span>
              <span style={{ fontSize: '1.3rem' }}>{F(x.t)}</span>
              <span style={{ flex: 1, color: i < 3 ? '#fff' : silver, fontSize: '0.82rem' }}>{x.t}</span>
              <div style={{ minWidth: '90px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '3px' }}>
                  <span style={{ color: i === 0 ? gold : i < 3 ? silver : dim, fontWeight: 700, fontSize: '0.8rem' }}>{x.p}%</span>
                </div>
                <div style={{ ...sx.bar }}>
                  <div style={{ width: `${x.p / maxWP * 100}%`, height: '100%', background: i === 0 ? `linear-gradient(90deg,${C(x.t)},${gold})` : C(x.t) + '88', transition: 'width 1s ease' }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Semi-finals preview */}
        <div style={{ ...sx.label, marginBottom: '10px' }}>Predicted semi-finals</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {data.bracket.sf.map((g, i) => (
            <MatchCard key={i} g={g} roundLabel="SF" idx={i} />
          ))}
        </div>
      </div>
    );
  };

  // ── GROUPS TAB ──
  const renderGroups = () => {
    const standing = data.groupStandings[grp];
    const games = data.groupGames[grp];
    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '16px' }}>
          {Object.keys(GS).map(g => (
            <button key={g} onClick={() => setGrp(g)} className={`wc-grp${grp === g ? ' on' : ''}`} style={{
              ...sx.grpBtn,
              background: grp === g ? 'linear-gradient(135deg,#1B2E5E,#16264E)' : 'none',
              color: grp === g ? gold : dim,
              borderColor: grp === g ? gold : border,
            }}>
              {g}
            </button>
          ))}
        </div>

        {/* Standings */}
        <div style={{ ...sx.card, marginBottom: '14px', overflowX: 'auto' }}>
          <div style={{ ...sx.label, marginBottom: '12px' }}>Group {grp} — Predicted Final Standings (from the fixtures below)</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', minWidth: '420px' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${border}` }}>
                {['', 'Team', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'].map((h, j) => (
                  <th key={j} style={{ padding: '4px 8px', textAlign: j > 1 ? 'right' : 'left', color: dimmer, fontWeight: 400, fontSize: '0.6rem', letterSpacing: '0.1em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {standing.map((row, i) => (
                <tr key={row.t} style={{ borderBottom: `1px solid #223354`, background: i < 2 ? '#1A2950' : i === 2 ? '#141E40' : 'none' }}>
                  <td style={{ padding: '7px 8px', color: i < 2 ? green : i === 2 ? amber : red, fontSize: '0.65rem', fontWeight: 700 }}>
                    {i < 2 ? '▲' : i === 2 ? '◆' : '▼'}
                  </td>
                  <td style={{ padding: '7px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.9rem' }}>{F(row.t)}</span>
                      <span style={{ color: i < 2 ? '#fff' : silver }}>{row.t}</span>
                    </div>
                  </td>
                  {[row.w, row.d, row.l, row.gf, row.ga, row.gd, row.pts].map((v, j) => (
                    <td key={j} style={{
                      padding: '7px 8px', textAlign: 'right',
                      color: j === 6 ? gold : j === 5 ? (v > 0 ? green : v < 0 ? red : silver) : silver,
                      fontWeight: j === 6 ? 700 : 400,
                    }}>
                      {j === 5 && v > 0 ? '+' : ''}{v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '8px', fontSize: '0.58rem', color: dimmer }}>
            ▲ Qualifies for R32 · ◆ 3rd place (may qualify as best 3rd) · ▼ Eliminated
          </div>
        </div>

        {/* Fixtures */}
        <div style={{ ...sx.label, marginBottom: '10px' }}>Group {grp} — All 6 Fixtures · Click any match for details</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '8px' }}>
          {games.map((g, i) => <MatchCard key={i} g={g} roundLabel={`Group ${grp}`} idx={i} isGroupGame />)}
        </div>
      </div>
    );
  };

  // ── BRACKET TAB ──
  const renderBracket = () => {
    const rounds = {
      r32: { label: 'Round of 32', games: data.bracket.r32, n: 16 },
      r16: { label: 'Round of 16', games: data.bracket.r16, n: 8 },
      qf:  { label: 'Quarter-Finals', games: data.bracket.qf, n: 4 },
      sf:  { label: 'Semi-Finals', games: data.bracket.sf, n: 2 },
      final: { label: 'Final + 3rd Place', games: [data.bracket.final, data.bracket.tp], n: 2 },
    };
    const cur = rounds[rnd];

    return (
      <div>
        {/* Round selector */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${border}`, marginBottom: '16px', flexWrap: 'wrap' }}>
          {[['r32','R32',16],['r16','R16',8],['qf','QF',4],['sf','SF',2],['final','Final',2]].map(([id, label, n]) => (
            <button key={id} onClick={() => setRnd(id)} className="wc-rnd" style={{
              ...sx.rndBtn,
              color: rnd === id ? gold : dim,
              borderBottomColor: rnd === id ? gold : 'transparent',
              background: rnd === id ? 'rgba(255,206,58,0.08)' : 'none',
              marginBottom: '-1px',
            }}>
              {label} <span style={{ fontSize: '0.58rem', color: dimmer }}>·{n}</span>
            </button>
          ))}
        </div>

        <div style={{ ...sx.label, marginBottom: '14px' }}>
          {cur.label} · Predicted matchups from {NSIMS.toLocaleString()} simulations · Click for alternate scenarios
        </div>

        {rnd === 'final' ? (
          <div>
            {/* THE FINAL — special treatment */}
            <div style={{ ...sx.card, border: `2px solid ${gold}`, marginBottom: '16px', background: 'linear-gradient(135deg,#1B2A55,#101A3C)', position: 'relative' }}>
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <span style={{ background: gold, color: '#000', fontSize: '0.6rem', fontWeight: 900, padding: '3px 12px', letterSpacing: '0.2em' }}>🏆 THE FINAL · MetLife Stadium · July 19</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '16px', padding: '10px 0' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem' }}>{F(data.bracket.final.tA)}</div>
                  <div style={{ color: data.bracket.final.winner === data.bracket.final.tA ? '#fff' : silver, fontWeight: data.bracket.final.winner === data.bracket.final.tA ? 700 : 400, fontSize: '0.9rem', marginTop: '8px' }}>{data.bracket.final.tA}</div>
                  <div style={{ color: data.bracket.final.winner === data.bracket.final.tA ? gold : dim, fontSize: '0.7rem', marginTop: '4px' }}>{+(data.bracket.final.winPA * 100).toFixed(0)}% to lift the trophy</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#fff', letterSpacing: '0.15em', lineHeight: 1 }}>{data.bracket.final.score}</div>
                  <div style={{ fontSize: '0.55rem', color: data.bracket.final.aet ? '#E8B45A' : dimmer, letterSpacing: '0.15em', marginTop: '6px' }}>
                    {data.bracket.final.aet ? 'AFTER EXTRA TIME' : 'PREDICTED SCORE'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem' }}>{F(data.bracket.final.tB)}</div>
                  <div style={{ color: data.bracket.final.winner === data.bracket.final.tB ? '#fff' : silver, fontWeight: data.bracket.final.winner === data.bracket.final.tB ? 700 : 400, fontSize: '0.9rem', marginTop: '8px' }}>{data.bracket.final.tB}</div>
                  <div style={{ color: data.bracket.final.winner === data.bracket.final.tB ? gold : dim, fontSize: '0.7rem', marginTop: '4px' }}>{100 - +(data.bracket.final.winPA * 100).toFixed(0)}% to lift the trophy</div>
                </div>
              </div>
              {data.bracket.final.pens && (
                <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#E8B45A', fontWeight: 700, margin: '2px 0 8px', letterSpacing: '0.05em' }}>
                  🏆 {data.bracket.final.winner} win {data.bracket.final.pens} on penalties
                </div>
              )}
              <div style={{ ...sx.bar, display: 'flex', margin: '10px 0 6px' }}>
                <div style={{ width: `${+(data.bracket.final.winPA * 100).toFixed(0)}%`, height: '100%', background: C(data.bracket.final.tA) + 'CC' }} />
                <div style={{ flex: 1, height: '100%', background: C(data.bracket.final.tB) + 'CC' }} />
              </div>
              {data.bracket.final.altA?.length > 1 && (
                <div style={{ fontSize: '0.62rem', color: dim, marginTop: '6px' }}>
                  Alt finalists: {data.bracket.final.altA.slice(1, 4).map(x => `${F(x.t)} ${x.t} (${x.p}%)`).join(' · ')} vs {data.bracket.final.altB.slice(1, 4).map(x => `${F(x.t)} ${x.t} (${x.p}%)`).join(' · ')}
                </div>
              )}
            </div>
            {/* 3rd place */}
            <div style={{ ...sx.label, marginBottom: '8px' }}>3rd Place Play-off</div>
            <MatchCard g={data.bracket.tp} roundLabel="3rd Place" idx={0} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: '10px' }}>
            {cur.games.map((g, i) => g && T[g.tA] && T[g.tB] ? (
              <MatchCard key={i} g={g} roundLabel={cur.label} idx={i} />
            ) : null)}
          </div>
        )}

        {/* Bracket context note */}
        <div style={{ ...sx.card, marginTop: '16px', fontSize: '0.62rem', color: dimmer, lineHeight: 1.8 }}>
          <div style={{ ...sx.label, marginBottom: '6px' }}>Bracket structure</div>
          Official FIFA 2026 layout (matches 73–104). The 32 qualifiers are placed into fixed Round-of-32 slots: group winners are never paired with other winners — across the 16 ties, 8 pit a winner against a best-third, 4 a winner against a runner-up, and 4 a runner-up against a runner-up.
          <br />The 8 best 3rd-place teams (ranked by points → goal difference → goals scored → FIFA World Ranking) are slotted by FIFA's Annex C: each third-place team can only fill a winner-slot drawn from that slot's allowed five-group set, and never faces a side from its own group.
          <br />Winners then thread forward through the real match wiring (R16 89–96, QF 97–100, SF, final) — so the two tournament halves and every quarter follow the published bracket rather than a simple adjacent-group pattern.
        </div>
      </div>
    );
  };

  // ── STATS TAB ──
  const renderStats = () => (
    <div>
      <div style={{ ...sx.label, marginBottom: '10px' }}>Win probability — all {data.winProbs.length} contenders</div>
      <div style={{ ...sx.card, marginBottom: '20px' }}>
        {data.winProbs.map((x, i) => (
          <div key={x.t} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
            <span style={{ color: dimmer, fontSize: '0.68rem', width: '20px', textAlign: 'right' }}>{i + 1}</span>
            <span style={{ fontSize: '1rem', width: '22px', textAlign: 'center' }}>{F(x.t)}</span>
            <span style={{ width: '110px', fontSize: '0.78rem', color: i < 3 ? '#fff' : silver, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.t}</span>
            <div style={{ flex: 1, height: '10px', background: '#101A3A', position: 'relative', borderRadius: '1px' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${x.p / maxWP * 100}%`, background: i === 0 ? `linear-gradient(90deg,${C(x.t)},${gold})` : C(x.t) + '77', transition: 'width 1.2s ease' }} />
            </div>
            <span style={{ width: '42px', textAlign: 'right', color: i === 0 ? gold : i < 3 ? silver : dim, fontWeight: i < 3 ? 700 : 400, fontSize: '0.8rem' }}>{x.p}%</span>
          </div>
        ))}
      </div>

      <div style={{ ...sx.label, marginBottom: '10px' }}>Round-by-round reach probabilities — top 16 teams</div>
      <div style={{ ...sx.card, overflowX: 'auto', marginBottom: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', minWidth: '480px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${border}` }}>
              <th style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 400, color: dim, fontSize: '0.6rem' }}>Team</th>
              {['R32', 'R16', 'QF', 'SF', 'Final', 'Win'].map(h => (
                <th key={h} style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 400, color: dim, fontSize: '0.6rem', letterSpacing: '0.1em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.reachProbs.map((row, i) => (
              <tr key={row.t} style={{ borderBottom: `1px solid #1A2746` }}>
                <td style={{ padding: '6px 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.9rem' }}>{F(row.t)}</span>
                    <span style={{ color: i < 3 ? '#fff' : silver }}>{row.t}</span>
                  </div>
                </td>
                {[row.r32, row.r16, row.qf, row.sf, row.f, row.w].map((v, j) => (
                  <td key={j} style={{
                    padding: '6px 8px', textAlign: 'right',
                    color: j === 5 ? gold : (v || 0) > 60 ? green : (v || 0) > 30 ? amber : (v || 0) > 10 ? silver : dim,
                    fontWeight: j === 5 ? 700 : 400,
                  }}>
                    {(v || 0).toFixed(0)}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ ...sx.card, fontSize: '0.65rem', color: dimmer, lineHeight: 1.9 }}>
        <div style={{ ...sx.label, color: dim, marginBottom: '8px' }}>Methodology & sources</div>
        {[
          `Dixon-Coles Poisson model: xG(A vs B) = att_A ÷ def_B × μ  where μ=${MU} (calibrated to 2022 WC 2.69/game + 2026 qualifiers 2.8–3.3/game)`,
          'Player-availability layer: key absences/doubts (Yamal, Mitoma, Gnabry, Romero, Davies, ter Stegen, Grealish …) cut a team\u2019s attack or defence by each player\u2019s weighted share — capped at \u221220% per side. Sourced from June 2026 reporting (ESPN, Sports Mole, SI, Yahoo) and editable live in the Injuries tab as fitness news breaks',
          'Host advantage: Mexico/USA/Canada att×1.09 · def×1.07',
          'Knockout: 90min → Extra time (33% xG) → Penalty shootout (skill-weighted, ±15% from base 50%)',
          'Team ratings calibrated from: FIFA rankings (Apr 2026) · BetMGM/FanDuel/DraftKings implied probs · Polymarket $1.5B trading volume · ESPN Power Rankings',
          'Expert consensus incorporated: Carragher (Telegraph) · CBS SportsLine · Flashscore analysts · Oddschecker',
          `Live results conditioning: completed games are locked in as facts — group tables re-form around real scores and the bracket re-runs from the actual qualifiers, so only unplayed matches are still simulated. With no results entered the output is a pure pre-tournament projection`,
          `Scorelines: drawn from each match\u2019s xG-derived Poisson distribution (seeded per-matchup), conditioned on the predicted result — reproducing the real spread of 1-0s, 3-1s and the occasional 5-0, not a flattened average`,
          `Monte Carlo: ${NSIMS.toLocaleString()} tournament simulations × 104 games = ${(NSIMS * 104).toLocaleString()} outcomes`,
        ].map((line, i) => (
          <div key={i} style={{ paddingLeft: '10px', borderLeft: `2px solid ${border}`, marginBottom: '4px' }}>→ {line}</div>
        ))}
        <div style={{ marginTop: '10px', color: dimmer, fontSize: '0.6rem' }}>
          For entertainment purposes only. Predictions inherently uncertain. Please gamble responsibly.
        </div>
      </div>
    </div>
  );

  // ── INJURIES / AVAILABILITY TAB ──
  // Like the results tab, rows are plain host elements (no nested component)
  // so the "add injury" name field keeps focus while typing.
  const renderInjuries = () => {
    const teams = Object.keys(T).sort();
    const flagged = Object.keys(injuries).filter(t => injuries[t] && injuries[t].length).sort();
    const activeCount = Object.values(injuries).flat().filter(p => p.status === 'out' || p.status === 'doubt').length;

    const STATUSES = [['fit', 'Fit', green], ['doubt', 'Doubt', amber], ['out', 'Out', red]];
    const pill = (active, color, label, onClick, key) => (
      <button key={key} onClick={onClick} style={{
        background: active ? color : 'none', color: active ? '#08122B' : dim,
        border: `1px solid ${active ? color : border}`, borderRadius: '5px',
        fontSize: '0.6rem', fontWeight: 700, padding: '4px 8px', cursor: 'pointer',
        fontFamily: font, letterSpacing: '0.04em',
      }}>{label}</button>
    );

    return (
      <div>
        {/* Status + reset */}
        <div style={{ ...sx.card, marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ ...sx.label, marginBottom: '4px', color: activeCount > 0 ? amber : dim }}>
              {activeCount > 0 ? `● ${activeCount} active ${activeCount === 1 ? 'absence/doubt' : 'absences & doubts'} affecting ratings` : '○ No active absences'}
            </div>
            <div style={{ fontSize: '0.66rem', color: dimmer, lineHeight: 1.6 }}>
              Set a player Out, Doubtful, or Fit as news breaks. Out removes their full weighted share of the team's attack or defence; Doubt removes half; Fit restores it. Each side is capped at −20%.
              {computing && <span style={{ color: amber, marginLeft: '6px' }}>updating…</span>}
            </div>
          </div>
          <button onClick={resetInjuries} style={{
            background: 'none', border: `1px solid ${dimmer}`, color: dim, borderRadius: '6px',
            padding: '6px 12px', fontSize: '0.66rem', fontWeight: 700, cursor: 'pointer', fontFamily: font, letterSpacing: '0.05em',
          }}>RESET TO DEFAULTS</button>
        </div>

        {/* Add a new injury */}
        <div style={{ ...sx.card, marginBottom: '18px' }}>
          <div style={{ ...sx.label, marginBottom: '10px', color: gold }}>Add an injury / absence</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '0.55rem', color: dimmer, marginBottom: '3px', letterSpacing: '0.1em' }}>TEAM</div>
              <select value={injDraft.team} onChange={e => setInjDraft({ ...injDraft, team: e.target.value })}
                style={{ background: '#0C1330', color: '#fff', border: `1px solid ${border}`, borderRadius: '5px', padding: '6px 8px', fontFamily: font, fontSize: '0.72rem', outline: 'none' }}>
                <option value="">Select…</option>
                {teams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <div style={{ fontSize: '0.55rem', color: dimmer, marginBottom: '3px', letterSpacing: '0.1em' }}>PLAYER</div>
              <input type="text" value={injDraft.n} placeholder="Player name"
                onChange={e => setInjDraft({ ...injDraft, n: e.target.value })}
                style={{ width: '100%', background: '#0C1330', color: '#fff', border: `1px solid ${border}`, borderRadius: '5px', padding: '6px 8px', fontFamily: font, fontSize: '0.72rem', outline: 'none' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.55rem', color: dimmer, marginBottom: '3px', letterSpacing: '0.1em' }}>AFFECTS</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {pill(injDraft.side === 'att', accent, 'Attack', () => setInjDraft({ ...injDraft, side: 'att' }), 'att')}
                {pill(injDraft.side === 'def', accent, 'Defence', () => setInjDraft({ ...injDraft, side: 'def' }), 'def')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.55rem', color: dimmer, marginBottom: '3px', letterSpacing: '0.1em' }}>IMPORTANCE</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {IMP_PRESETS.map(([lab, w]) => pill(Math.abs(injDraft.w - w) < 0.001, gold, lab, () => setInjDraft({ ...injDraft, w }), lab))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.55rem', color: dimmer, marginBottom: '3px', letterSpacing: '0.1em' }}>STATUS</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {pill(injDraft.status === 'out', red, 'Out', () => setInjDraft({ ...injDraft, status: 'out' }), 'o')}
                {pill(injDraft.status === 'doubt', amber, 'Doubt', () => setInjDraft({ ...injDraft, status: 'doubt' }), 'd')}
              </div>
            </div>
            <button onClick={addInjury} disabled={!injDraft.team || !injDraft.n.trim()} style={{
              background: (!injDraft.team || !injDraft.n.trim()) ? '#1B294C' : gold,
              color: (!injDraft.team || !injDraft.n.trim()) ? dimmer : '#08122B',
              border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '0.7rem', fontWeight: 800,
              cursor: (!injDraft.team || !injDraft.n.trim()) ? 'default' : 'pointer', fontFamily: font, letterSpacing: '0.05em',
            }}>+ ADD</button>
          </div>
        </div>

        {/* Current injuries by team */}
        <div style={{ ...sx.label, marginBottom: '10px' }}>Current list · {flagged.length} {flagged.length === 1 ? 'team' : 'teams'}</div>
        {flagged.length === 0 && (
          <div style={{ ...sx.card, color: dim, fontSize: '0.72rem' }}>No injuries recorded — every squad at full strength. Add one above, or hit “Reset to defaults” to restore the researched June-2026 list.</div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))', gap: '10px' }}>
          {flagged.map(team => (
            <div key={team} style={sx.card}>
              <div style={{ ...sx.label, marginBottom: '8px', color: gold, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1rem' }}>{F(team)}</span> {team}
              </div>
              {injuries[team].map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: `1px solid #101A3A` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.76rem', color: silver, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.n}</div>
                    <div style={{ fontSize: '0.55rem', color: dimmer, letterSpacing: '0.06em', marginTop: '1px' }}>
                      {p.side === 'def' ? 'DEFENCE' : 'ATTACK'} · {impLabel(p.w)} · −{Math.round(p.w * 100)}% if out
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {STATUSES.map(([st, lab, col]) => pill(p.status === st, col, lab, () => setInjStatus(team, i, st), st))}
                  </div>
                  <button onClick={() => removeInjury(team, i)} title="Remove" style={{
                    background: 'none', border: 'none', color: dimmer, cursor: 'pointer', fontSize: '1rem', fontFamily: font, padding: '0 2px', lineHeight: 1,
                  }}>×</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── ENTER RESULTS TAB ──
  // Rows are built by a plain function returning host elements (not a nested
  // component) so the score <input>s keep focus across the recompute re-render.
  const renderEnter = () => {
    const groupFix = {};
    Object.keys(GS).forEach(g => {
      const t = GS[g]; const fx = [];
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) fx.push([t[i], t[j]]);
      groupFix[g] = fx;
    });
    const koRounds = [
      ['Round of 32', data.bracket.r32], ['Round of 16', data.bracket.r16],
      ['Quarter-Finals', data.bracket.qf], ['Semi-Finals', data.bracket.sf],
      ['Final', [data.bracket.final]], ['3rd Place', [data.bracket.tp]],
    ];
    const inStyle = {
      width: '34px', textAlign: 'center', fontFamily: font, fontSize: '0.95rem', fontWeight: 700,
      background: '#0C1330', color: '#fff', border: `1px solid ${border}`, borderRadius: '5px',
      padding: '5px 0', outline: 'none',
    };
    const clean = v => v.replace(/[^0-9]/g, '').slice(0, 2);
    // Show in-progress typing (draft) if present, else the committed result.
    // This lets a single box hold a digit before its partner is filled.
    const shownVal = (key, committed) => scoreDraft[key] || [
      committed[0] === '' || committed[0] == null ? '' : String(committed[0]),
      committed[1] === '' || committed[1] == null ? '' : String(committed[1]),
    ];
    const putDraft = (key, pair) => setScoreDraft(d => ({ ...d, [key]: pair }));

    const row = (k, tA, tB, val, opts = {}) => {
      const { koMode, winSel, onScore, onWin } = opts;
      const [a, b] = val;
      const level = a !== '' && b !== '' && Number(a) === Number(b);
      return (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: `1px solid #101A3A` }}>
          <div style={{ flex: 1, textAlign: 'right', fontSize: '0.78rem', color: silver, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {tA} <span style={{ fontSize: '0.95rem' }}>{F(tA)}</span>
          </div>
          <input type="text" inputMode="numeric" value={a === '' ? '' : String(a)} placeholder="–"
            style={inStyle} onChange={e => onScore(clean(e.target.value), b)} />
          <span style={{ color: dimmer, fontSize: '0.7rem' }}>–</span>
          <input type="text" inputMode="numeric" value={b === '' ? '' : String(b)} placeholder="–"
            style={inStyle} onChange={e => onScore(a, clean(e.target.value))} />
          <div style={{ flex: 1, textAlign: 'left', fontSize: '0.78rem', color: silver, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            <span style={{ fontSize: '0.95rem' }}>{F(tB)}</span> {tB}
          </div>
          {koMode && level && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
              <span style={{ fontSize: '0.55rem', color: dimmer, letterSpacing: '0.08em' }}>PENS</span>
              {[tA, tB].map(t => (
                <button key={t} onClick={() => onWin(t)} style={{
                  background: winSel === t ? gold : 'none', color: winSel === t ? '#000' : dim,
                  border: `1px solid ${winSel === t ? gold : border}`, borderRadius: '4px',
                  fontSize: '0.62rem', fontWeight: 700, padding: '3px 6px', cursor: 'pointer', fontFamily: font,
                }}>{F(t)}</button>
              ))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div>
        <div style={{ ...sx.card, marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ ...sx.label, marginBottom: '4px', color: data.nResults > 0 ? green : dim }}>
              {data.nResults > 0 ? `● Conditioning on ${data.nResults} completed ${data.nResults === 1 ? 'game' : 'games'}` : '○ No results entered — pure projection'}
            </div>
            <div style={{ fontSize: '0.66rem', color: dimmer, lineHeight: 1.6 }}>
              Type a score for any completed match. The forecast locks it in and re-simulates everything still to play.
              {computing && <span style={{ color: amber, marginLeft: '6px' }}>updating…</span>}
            </div>
          </div>
          {data.nResults > 0 && (
            <button onClick={clearAllResults} style={{
              background: 'none', border: `1px solid ${red}`, color: red, borderRadius: '6px',
              padding: '6px 12px', fontSize: '0.66rem', fontWeight: 700, cursor: 'pointer', fontFamily: font, letterSpacing: '0.05em',
            }}>CLEAR ALL</button>
          )}
        </div>

        {/* Group stage entry */}
        <div style={{ ...sx.label, marginBottom: '10px' }}>Group stage · 72 fixtures</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))', gap: '10px', marginBottom: '20px' }}>
          {Object.keys(GS).map(g => (
            <div key={g} style={sx.card}>
              <div style={{ ...sx.label, marginBottom: '6px', color: gold }}>Group {g}</div>
              {groupFix[g].map(([tA, tB], i) => {
                const dk = `g|${tA}|${tB}`;
                const shown = shownVal(dk, groupVal(tA, tB));
                return row(`${g}-${i}`, tA, tB, shown, {
                  onScore: (a, b) => { putDraft(dk, [a, b]); setGroupScore(tA, tB, a, b); },
                });
              })}
            </div>
          ))}
        </div>

        {/* Knockout entry */}
        <div style={{ ...sx.label, marginBottom: '4px' }}>Knockouts · matchups follow the results you enter</div>
        <div style={{ fontSize: '0.62rem', color: dimmer, marginBottom: '10px', lineHeight: 1.6 }}>
          Ties shown are the model's current bracket — they firm up into the real matchups as group results go in. Enter each round as it's played; a level score reveals a penalty-winner toggle.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))', gap: '10px' }}>
          {koRounds.map(([label, games]) => (
            <div key={label} style={sx.card}>
              <div style={{ ...sx.label, marginBottom: '6px', color: gold }}>{label}</div>
              {games.map((gm, i) => {
                const dk = `k|${gm.tA}|${gm.tB}`;
                const [ca, cb, win] = koVal(gm.tA, gm.tB);
                const shown = shownVal(dk, [ca, cb]);
                return row(`${label}-${i}`, gm.tA, gm.tB, shown, {
                  koMode: true, winSel: win,
                  onScore: (na, nb) => { putDraft(dk, [na, nb]); setKOScore(gm.tA, gm.tB, na, nb, win); },
                  onWin: w => setKOScore(gm.tA, gm.tB, shown[0], shown[1], w),
                });
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── MAIN RENDER ──
  return (
    <div style={sx.app}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        button{transition:all .18s ease}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:#0B1029}
        ::-webkit-scrollbar-thumb{background:#34487A;border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:#3DA9FC}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        /* Dynamic tabs */
        .wc-tab:hover{color:#FFE07A !important;background:rgba(61,169,252,0.10) !important}
        .wc-tab.on{background:rgba(255,206,58,0.08) !important}
        /* Dynamic round pills */
        .wc-rnd:hover{color:#FFE07A !important;background:rgba(61,169,252,0.12) !important}
        /* Dynamic group chips — lift + glow */
        .wc-grp:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(61,169,252,0.28);border-color:#3DA9FC !important;color:#EAF1FF !important}
        .wc-grp.on{box-shadow:0 4px 14px rgba(255,206,58,0.22)}
        /* Cards gently respond */
        .wc-press:active{transform:scale(0.997)}
      `}</style>

      {/* Header */}
      <div style={sx.hdr}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'clamp(1.3rem,3.5vw,2rem)', fontWeight: 900, color: '#fff', letterSpacing: '0.06em' }}>2026 WORLD CUP SIMULATOR</span>
              <span style={{ background: gold, color: '#000', fontSize: '0.55rem', fontWeight: 700, padding: '2px 7px', letterSpacing: '0.15em', alignSelf: 'center' }}>BETA</span>
            </div>
            <div style={{ color: dim, fontSize: '0.62rem', letterSpacing: '0.14em', marginTop: '4px' }}>
              {NSIMS.toLocaleString()} MONTE CARLO SIMULATIONS · POISSON xG MODEL · ALL 104 GAMES · FULL BRACKET
            </div>
            {data.nResults > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '7px', background: 'rgba(52,211,153,0.12)', border: `1px solid ${green}`, borderRadius: '5px', padding: '3px 9px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: green, boxShadow: `0 0 6px ${green}` }} />
                <span style={{ color: green, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em' }}>LIVE · conditioned on {data.nResults} completed {data.nResults === 1 ? 'game' : 'games'}</span>
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', paddingBottom: '2px' }}>
            <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 700 }}>{F(winner)} {winner} {winP}%</div>
            <div style={{ fontSize: '0.6rem', color: dim }}>predicted champion</div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${border}`, gap: 0, overflowX: 'auto' }}>
          {[['prediction','🏆 Prediction'],['groups','⚽ Group Stage'],['bracket','🏅 Bracket'],['stats','📊 Statistics'],['enter','📝 Results'],['injuries','🩹 Injuries']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`wc-tab${tab === id ? ' on' : ''}`} style={{
              ...sx.tab,
              color: tab === id ? gold : dim,
              borderBottomColor: tab === id ? gold : 'transparent',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px', animation: 'fadeIn .3s ease' }}>
        {tab === 'prediction' && renderPrediction()}
        {tab === 'groups' && renderGroups()}
        {tab === 'bracket' && renderBracket()}
        {tab === 'stats' && renderStats()}
        {tab === 'enter' && renderEnter()}
        {tab === 'injuries' && renderInjuries()}
      </div>

      <div style={{ padding: '12px 20px', borderTop: `1px solid ${dimmer}`, fontSize: '0.58rem', color: dimmer, textAlign: 'center' }}>
        Monte Carlo · Poisson xG · {NSIMS.toLocaleString()} sims · All 104 games · June 11–July 19, 2026
      </div>
    </div>
  );
}
