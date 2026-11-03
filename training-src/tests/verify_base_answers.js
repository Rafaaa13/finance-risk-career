#!/usr/bin/env node
/* tests/verify_base_answers.js —— 重算并断言 prep/*.js 里写进答案的每个数字
 * 用法：node tests/verify_base_answers.js      （只依赖 node；python3 可选，用于 sqlite / Python 交叉验证）
 * 做了什么：
 *  1) 从 base.html 抽出真实的 loans 生成器、portfolioMetrics、bs、monteCarlo、runSQL、questions；
 *  2) 重算答案里的数字并逐项断言（结构化字段直接比较，正文数字做“对账”）；
 *  3) 独立实现交叉验证：自写 LCG+Box–Muller、泰勒级数 erf、普通循环聚合、python3+sqlite；
 *  4) 红线检查：不得声明 BASE_ANS、必须明说合成数据、不得出现“我在某某公司做过”式句子。
 * 不修改任何文件。正文对账是启发式的：它能抓住抄错的数字，抓不住“数字对、解释错”。 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process'), os = require('os');
const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.BASE_HTML || path.join(ROOT, 'base.html');
const PREP_DIR = process.env.PREP_DIR || path.join(ROOT, 'prep');   // 自测变异用：指向被篡改的拷贝
const PREP_FILES =['prep_10a_roadmap_risk.js', 'prep_10b_quant_sql.js', 'prep_10c_local_project.js', 'prep_10d_interview.js'];
const FILE_KEYS = { 'prep_10a_roadmap_risk.js': ['roadmap', 'risk'], 'prep_10b_quant_sql.js': ['quant', 'sql'], 'prep_10c_local_project.js': ['local', 'project'], 'prep_10d_interview.js': ['interview'] };
let pass = 0, fail = 0, skip = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL ' + m); } };
const near = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, `${m}：得到 ${a}，期望 ${b}（容差 ${tol}）`);
const skipped = (m) => { skip++; console.log('  SKIP ' + m); };
const section = (t) => console.log('\n== ' + t);
const len = (s) => Array.from(String(s)).length;
const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);

// ---------- 1. 从 base.html 抽取真实逻辑 ----------
const html = fs.readFileSync(BASE, 'utf8');
function between(a, b) {
  const i = html.indexOf(a); if (i < 0) throw new Error('base.html 中找不到起点：' + a);
  const j = html.indexOf(b, i); if (j < 0) throw new Error('base.html 中找不到终点：' + b);
  return html.slice(i, j);
}
const pieces = [between('const esc = ', 'const uid'), between('const roadmap = [', '];\n') + '];', between('function LCG(', 'const state={'),
  between('function formatCell(', 'function renderSQL('), between('const questions=[', '];\n') + '];'];
const L = new Function('"use strict";' + pieces.join('\n') +
  ';return {roadmap,segments,grades,loans,marketReturns,prices,mean,sd,quantile,riskStats,bs,monteCarlo,portfolioMetrics,runSQL,questions,LCG,normalFrom};')();
const loans = L.loans;
console.log(`base.html 抽取成功：loans=${loans.length}，roadmap=${L.roadmap.length}，questions=${L.questions.length}`);

// ---------- 2. 加载 prep 文件（BASE_ANS 由本脚本声明，模拟外部环境） ----------
section('加载 prep 文件与红线');
const ANS = {}, SRC = {};
for (const f of PREP_FILES) {
  const p = path.join(PREP_DIR, f);
  if (!fs.existsSync(p)) { ok(false, `${f} 不存在`); continue; }
  const s = SRC[f] = fs.readFileSync(p, 'utf8');
  ok(!/\b(const|let|var)\s+BASE_ANS\b/.test(s), `${f} 不得自己声明 BASE_ANS`);
  ok(/Object\.assign\(BASE_ANS,\s*\{[\s\S]*\}\);\s*$/.test(s), `${f} 末尾必须是 Object.assign(BASE_ANS, {...});`);
  ok(!s.includes('@@NEXT@@'), `${f} 残留分块占位符`);
  ok(!s.includes('</'), `${f} 含有 "</"，内联进 <script> 会被截断`);
  const box = { BASE_ANS: {} };
  try { vm.runInNewContext(s, box, { filename: f }); } catch (e) { ok(false, `${f} 执行失败：${e.message}`); }
  ok(Object.keys(box.BASE_ANS).join() === FILE_KEYS[f].join(), `${f} 的键应为 ${FILE_KEYS[f].join()}，实际 ${Object.keys(box.BASE_ANS).join()}`);
  Object.assign(ANS, box.BASE_ANS);
}
// ---------- 3. 重算事实（普通循环独立聚合，再与 portfolioMetrics 对照） ----------
section('重算信用风险事实');
const F = [], FI = new Set(), FR = [];     // 全部事实 / 整数事实 / 比例类事实(|x|<=20，用于 % 对账)
const fact = (...xs) => xs.forEach(x => { if (typeof x === 'number' && isFinite(x)) { x = Math.abs(x); F.push(x); if (Number.isInteger(x)) FI.add(x); if (x <= 20) FR.push(x); } });
const cap = (v) => Math.min(.99, Math.max(0, v));
const T = { n: loans.length, ead: sum(loans, x => x.ead), el: sum(loans, x => x.pd * x.lgd * x.ead) };
T.rate = T.el / T.ead; T.pdW = sum(loans, x => x.pd * x.ead) / T.ead; T.lgdW = sum(loans, x => x.lgd * x.ead) / T.ead;
T.avgPd = sum(loans, x => x.pd) / T.n; T.avgLgd = sum(loans, x => x.lgd) / T.n; T.overdue = loans.filter(x => x.overdue).length;
T.naive = T.pdW * T.lgdW * T.ead; T.naiveGap = 1 - T.naive / T.el; T.expOverdue = .85 * sum(loans, x => x.pd);
const scen = (pm, lm) => {
  let st = 0, lgdCapped = 0, pdCapped = 0, maxP = 0, maxL = 0;
  loans.forEach(x => { const p = cap(x.pd * pm), l = cap(x.lgd * lm); st += p * l * x.ead; if (x.lgd * lm > .99) lgdCapped++; if (x.pd * pm > .99) pdCapped++; maxP = Math.max(maxP, p); maxL = Math.max(maxL, l); });
  return { st, lgdCapped, pdCapped, maxP, maxL, uplift: st / T.el - 1, delta: st - T.el, rate: st / T.ead };
};
const S1 = scen(1.35, 1.2), S2 = scen(2.5, 2.2), S3 = scen(1.5, 1.3);
function grp(keyFn) {
  const m = new Map(); loans.forEach(x => { const k = keyFn(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); });
  const out = {};
  for (const [k, a] of m) {
    const ead = sum(a, x => x.ead), el = sum(a, x => x.pd * x.lgd * x.ead);
    const g = out[k] = { n: a.length, ead, el, avgPd: sum(a, x => x.pd) / a.length, avgLgd: sum(a, x => x.lgd) / a.length, pdW: sum(a, x => x.pd * x.ead) / ead,
      share: el / T.el, eadShare: ead / T.ead, rate: el / ead, overdue: a.filter(x => x.overdue).length, d: a.filter(x => x.grade === 'D').length };
    g.dShare = g.d / a.length;
    [['s1', 1.35, 1.2, S1], ['s2', 2.5, 2.2, S2]].forEach(([nm, pm, lm, S]) => {
      g[nm] = sum(a, x => cap(x.pd * pm) * cap(x.lgd * lm) * x.ead); g[nm + 'Up'] = g[nm] / el - 1; g[nm + 'Share'] = g[nm] / S.st; g[nm + 'Delta'] = g[nm] - el;
    });
    g.lgdCapped2 = a.filter(x => x.lgd * 2.2 > .99).length;
  }
  return out;
}
const SEG = grp(x => x.segment), GRD = grp(x => x.grade), VIN = grp(x => x.vintage);
// 与页面 portfolioMetrics 对照（校验抽取逻辑与独立聚合一致）
const PM = (a, b, s = '全部') => L.portfolioMetrics(a, b, s);
const P0 = PM(1, 1), P1 = PM(1.35, 1.2), P2 = PM(2.5, 2.2), P3 = PM(1.5, 1.3);
near(P0.el, T.el, 1e-6, 'portfolioMetrics 基线 EL 与独立求和'); near(P0.ead, T.ead, 0, 'EAD 合计');
near(P1.stressEl, S1.st, 1e-6, '默认压力 EL'); near(P2.stressEl, S2.st, 1e-6, '极端压力 EL'); near(P3.stressEl, S3.st, 1e-6, '1.5/1.3 压力 EL');
near(P0.pdW, T.pdW, 1e-12, '加权 PD'); near(P0.lgdW, T.lgdW, 1e-12, '加权 LGD'); near(P0.overdue, T.overdue / T.n, 1e-12, '逾期占比');
P1.bySeg.forEach(b => near(b.el, SEG[b.segment].s1, 1e-6, `默认压力 ${b.segment} EL`));
P2.bySeg.forEach(b => near(b.el, SEG[b.segment].s2, 1e-6, `极端压力 ${b.segment} EL`));
// 源码里的设定常量必须与 base.html 一致
ok(html.includes("{A:.012,B:.028,C:.065,D:.14}") && html.includes("{'消费贷':1.08,'小微企业':1.24,'按揭':.68,'信用卡':1.18}"), '等级基准 PD / 客群系数应与 base.html 源码一致');
ok(html.includes('overdue=rng() < pd*.85'), 'overdue 生成规则应为 rng() < pd*.85');
ok(Object.keys(loans[0]).length === 11 && html.includes('id,segment,grade,pd,lgd,ead,rate,dti,vintage,overdue'), 'loans 11 个字段、CSV 10 列');
const top = [...loans].sort((a, b) => b.el - a.el).slice(0, 10);
const TOP = { ids: top.map(x => x.id), el: sum(top, x => x.el) / T.el, ead: sum(top, x => x.ead) / T.ead, pct: 10 / T.n, allD: top.every(x => x.grade === 'D'), micro: top.filter(x => x.segment === '小微企业').length, consumer: top.filter(x => x.segment === '消费贷').length };
const pdMax = Math.max(...loans.map(x => x.pd)), lgdMax = Math.max(...loans.map(x => x.lgd));
const ONE = loans.slice(0, 3).map(x => ({ id: x.id, pd: x.pd, lgd: x.lgd, ead: x.ead, el: x.pd * x.lgd * x.ead, spd: cap(x.pd * 1.35), slgd: cap(x.lgd * 1.2), sel: cap(x.pd * 1.35) * cap(x.lgd * 1.2) * x.ead, pl: x.pd * x.lgd, el_loss: x.ead * x.lgd }));
const nonD = loans.filter(x => x.grade !== 'D'), nonD23 = nonD.filter(x => x.vintage === 2023);
const X = { nonD: sum(nonD, x => x.pd) / nonD.length, nonD23: sum(nonD23, x => x.pd) / nonD23.length, pdGe: loans.filter(x => x.pd >= .1).length, since25: loans.filter(x => x.vintage >= 2025).length,
  pdWmicro: SEG['小微企业'].pdW, pdWcons: SEG['消费贷'].pdW, microEadVsCons: SEG['小微企业'].ead / SEG['消费贷'].ead - 1, dEl23share: VIN[2023].d ? sum(loans.filter(x => x.grade === 'D' && x.vintage === 2023), x => x.el) / GRD.D.el : 0 };
fact(T.n, T.ead, T.el, T.rate, T.pdW, T.lgdW, T.avgPd, T.avgLgd, T.overdue, T.overdue / T.n, T.naive, T.naiveGap, T.expOverdue, T.el + 0, T.rate * 100);
[S1, S2, S3].forEach(S => fact(S.st, S.lgdCapped, S.pdCapped, S.maxP, S.maxL, S.uplift, S.delta, S.rate, 1 + S.uplift));
[SEG, GRD, VIN].forEach(G => Object.values(G).forEach(g => fact(...Object.values(g))));
fact(...Object.keys(VIN).map(Number), TOP.el, TOP.ead, TOP.pct, TOP.micro, TOP.consumer, pdMax, lgdMax, .99 / lgdMax, .99 / pdMax, 1.35 * 1.2 - 1, 1.35 * 1.2, 2.5 * 2.2 - 1, 2.5 * 2.2, 1.5 * 1.3 - 1, 1.5 * 1.3);
ONE.forEach(o => fact(...Object.values(o).filter(v => typeof v === 'number'), o.pl * 100, o.spd * 100, o.slgd * 100));
fact(...Object.values(X), 11, 10, .012, .028, .065, .14, 1.08, 1.24, .68, 1.18, .85, .99, 160, 40, 8, 1.35, 1.2, 2.5, 2.2, 1.5, 1.3);
fact(ONE.reduce((s, o) => s + o.sel, 0), ONE.reduce((s, o) => s + o.el, 0), ONE.reduce((s, o) => s + o.sel, 0) / ONE.reduce((s, o) => s + o.el, 0));
// ---------- 4. 市场指标与期权事实 ----------
section('重算市场与期权事实');
const R = L.marketReturns, PX = L.prices, sorted = [...R].sort((a, b) => a - b);
const pos = (R.length - 1) * .05, lo = Math.floor(pos), q05 = sorted[lo] + (sorted[lo + 1] - sorted[lo]) * (pos - lo);
const tail = R.filter(r => r <= q05), mu = sum(R, r => r) / R.length;
const sdPop = Math.sqrt(sum(R, r => (r - mu) ** 2) / R.length), sdSmp = Math.sqrt(sum(R, r => (r - mu) ** 2) / (R.length - 1));
let peak = PX[0], pkIdx = 0, mdd = 0, trIdx = 0, pkAt = 0;
PX.forEach((p, i) => { if (p > peak) { peak = p; pkIdx = i; } const d = p / peak - 1; if (d < mdd) { mdd = d; trIdx = i; pkAt = pkIdx; } });
const M = { var95: -q05, es: -sum(tail, r => r) / tail.length, vol: sdPop * Math.sqrt(252), mdd, cum: PX[PX.length - 1] / PX[0] - 1, pos, lo: sorted[lo], hi: sorted[lo + 1], tailN: tail.length,
  var10: -q05 * Math.sqrt(10), sdPop, sdSmp, sdSmpVol: sdSmp * Math.sqrt(252), px0: PX[0], peakPx: PX[pkAt], troughPx: PX[trIdx], peakDay: pkAt + 1, sqrt252: Math.sqrt(252), n: R.length };
const rs = L.riskStats();
near(rs.var95, M.var95, 1e-12, 'riskStats.var95'); near(rs.es, M.es, 1e-12, 'riskStats.es'); near(rs.vol, M.vol, 1e-12, 'riskStats.vol');
near(rs.mdd, M.mdd, 1e-12, 'riskStats.mdd'); near(rs.cum, M.cum, 1e-12, 'riskStats.cum');
fact(...Object.values(M), 252, 251, .05, 12, 13, 1e-9);
// 独立的 erf（泰勒级数）、BS、MC（BigInt LCG），用来交叉验证页面里的 bs()/monteCarlo()
const erfT = (x) => { let s = 0, t = x, n = 0; while (Math.abs(t) > 1e-18 && n < 300) { s += t / (2 * n + 1); n++; t = -t * x * x / n; } return 2 / Math.sqrt(Math.PI) * s; };
const Nt = (x) => .5 * (1 + erfT(x / Math.SQRT2));
const bsT = (S, K, T0, r, v) => { const d1 = (Math.log(S / K) + (r + .5 * v * v) * T0) / (v * Math.sqrt(T0)), d2 = d1 - v * Math.sqrt(T0), disc = Math.exp(-r * T0);
  return { d1, d2, disc, Nd1: Nt(d1), Nd2: Nt(d2), call: S * Nt(d1) - K * disc * Nt(d2), put: K * disc * Nt(-d2) - S * Nt(-d1) }; };
function mcT(S, K, T0, r, v, type, n, seed) {
  let s = BigInt(seed >>> 0); const U = () => { s = (1664525n * s + 1013904223n) % 4294967296n; return Number(s) / 4294967296; };
  let a = 0, b = 0; const pay = [];
  for (let i = 0; i < n; i++) { let u = 0, w = 0; while (!u) u = U(); while (!w) w = U();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * w), ST = S * Math.exp((r - .5 * v * v) * T0 + v * Math.sqrt(T0) * z);
    const p = type === 'call' ? Math.max(ST - K, 0) : Math.max(K - ST, 0); a += p; b += p * p; }
  const m = a / n, disc = Math.exp(-r * T0), se = disc * Math.sqrt(Math.max(0, (b - n * m * m) / (n - 1)) / n);
  return { price: disc * m, se, ciLow: disc * m - 1.96 * se, ciHigh: disc * m + 1.96 * se };
}
const A = L.bs(100, 100, 1, .035, .22, 'call'), Ap = L.bs(100, 100, 1, .035, .22, 'put'), AC = bsT(100, 100, 1, .035, .22);
const MC = (n, seed, type = 'call') => L.monteCarlo(100, 100, 1, .035, .22, type, n, seed);
const mc = MC(50000, 20261003), mcP = MC(50000, 20261003, 'put');
const zOf = (m) => (m.price - A.price) / m.se, inCI = (m) => m.ciLow <= A.price && A.price <= m.ciHigh;
const SEEDS = [42, 12345, 20261004, 99999, 314159].map(sd => ({ sd, ...MC(50000, sd) }));
const PATHS = [10000, 50000, 150000].map(n => ({ n, ...MC(n, 20261003) }));
const zs = [], cover = []; for (let k = 1; k <= 200; k++) { const m = MC(50000, 7919 * k); zs.push(zOf(m)); cover.push(inCI(m)); }
const zMean = sum(zs, z => z) / zs.length, zSd = Math.sqrt(sum(zs, z => (z - zMean) ** 2) / zs.length), covN = cover.filter(Boolean).length;
const meanST = (() => { const g = L.LCG(20261003); let s = 0; for (let i = 0; i < 50000; i++) s += 100 * Math.exp((.035 - .5 * .22 * .22) + .22 * L.normalFrom(g)); return s / 50000; })();
const fwd = 100 * Math.exp(.035), disc = Math.exp(-.035);
const O = { call: A.price, put: Ap.price, callAcc: AC.call, putAcc: AC.put, d1: A.d1, d2: A.d2, Nd1: AC.Nd1, Nd2: AC.Nd2, disc, kdisc: 100 * disc, parityRhs: 100 - 100 * disc, gap: A.price - AC.call,
  mc: mc.price, se: mc.se, ciLow: mc.ciLow, ciHigh: mc.ciHigh, diff: mc.price - A.price, z: zOf(mc), putMc: mcP.price, putSe: mcP.se, putDiff: mcP.price - Ap.price, mcParity: mc.price - mcP.price, mcParityResid: mc.price - mcP.price - (100 - 100 * disc),
  meanST, fwd, undisc: 1 / disc - 1, zMean, zSd, covN, covRate: covN / 200, delta: A.delta, gamma: A.gamma, vega1: A.vega / 100, theta1: A.theta / 365, seRatio: PATHS[0].se / PATHS[2].se, seRatio2: PATHS[1].se / PATHS[2].se,
  sqrt15: Math.sqrt(15), sqrt3: Math.sqrt(3), zExtreme: zOf(PATHS[2]), sig0: L.bs(100, 100, 1, .035, .0001, 'call').price, k50: L.bs(100, 50, 1, .035, .22, 'call').price, k50Intr: 100 - 50 * disc,
  s10: L.bs(100, 100, 1, .035, .1, 'call').price, s40: L.bs(100, 100, 1, .035, .4, 'call').price, putExact6: AC.put, minSeed: Math.min(mc.price, ...SEEDS.map(s => s.price)), maxSeed: Math.max(mc.price, ...SEEDS.map(s => s.price)) };
fact(...Object.values(O), ...SEEDS.flatMap(s => [s.price, s.se, s.price - A.price, zOf(s)]), ...PATHS.flatMap(p => [p.price, p.se, p.ciLow, p.ciHigh, p.price - A.price, zOf(p)]), O.maxSeed - O.minSeed);
fact(100, 50000, 10000, 150000, 20261003, 20261004, 7919, 200, 186, .035, .22, 1.96, .95, 2, 1e-4, 1e-5, 252, 365, 0.0001, 3.5, 22);
// ---------- 5. 结构与数值断言（所期望的字符串都由上面重算出的数生成，而不是手抄） ----------
const isStr = (s) => typeof s === 'string' && s.trim().length > 0;
const strs = (a, lo, hi, m) => ok(Array.isArray(a) && a.length >= lo && a.length <= hi && a.every(isStr), m);
const R4 = (v) => typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 1e4) / 1e4 : v;
const f = (x, d) => Number(x).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const pc = (x, d = 1) => (x * 100).toFixed(d) + '%';
const sg = (x, d) => (x < 0 ? '−' : '+') + Math.abs(x).toFixed(d);
const has = (label, obj, ...needles) => { const t = typeof obj === 'string' ? obj : JSON.stringify(obj); needles.forEach(n => ok(t.includes(n), `${label} 缺少重算值「${n}」`)); };

section('roadmap（八周路线）');
const RM = ANS.roadmap || {};
ok(Object.keys(RM).join() === L.roadmap.map(w => w.id).join(), 'roadmap 键应覆盖 w1..w8 且顺序与页面一致');
L.roadmap.forEach(w => { const r = RM[w.id] || {}; strs(r.steps, 3, 6, `${w.id}.steps 应为 3–6 步`); ok(isStr(r.deliver), `${w.id}.deliver`); strs(r.selfcheck, 1, 9, `${w.id}.selfcheck`); strs(r.pitfalls, 1, 9, `${w.id}.pitfalls`); });
const SM = SEG['小微企业'], CO = SEG['消费贷'], CC = SEG['信用卡'], MG = SEG['按揭'];
has('w2', RM.w2, pc(CO.avgPd, 2), pc(VIN[2023].avgPd, 2), f(GRD.D.el, 0), pc(VIN[2023].dShare, 1), pc(GRD.D.n / T.n, 1), pc(X.nonD23, 2), pc(X.nonD, 2), `${X.pdGe} 笔`, `${X.since25} 笔`);
has('w3', RM.w3, f(ONE[0].el, 2), f(ONE[1].el, 2), f(ONE[2].el, 2), f(T.el, 0), f(T.ead, 0), pc(T.rate, 2), pc(T.pdW, 2), pc(T.lgdW, 2), f(SM.el, 0), pc(SM.share, 1), f(T.naive, 0), pc(T.naiveGap, 1), pc(CO.rate, 2));
has('w4', RM.w4, f(S1.st, 0), f(S1.delta, 0), '+' + pc(S1.uplift, 1), pc(S1.rate, 2), pc(S1.maxP, 1), pc(S1.maxL, 1), f(S2.st, 0), '+' + pc(S2.uplift, 1), `${S2.lgdCapped} 笔`, '+' + pc(CC.s2Up, 1), '+' + pc(SM.s2Up, 1), '+' + pc(MG.s2Up, 1), '+' + pc(CO.s2Up, 1), `${CO.lgdCapped2} 笔`, (.99 / lgdMax).toFixed(2), pc(lgdMax, 2));
has('w5', RM.w5, f(O.call, 4), f(O.put, 4), f(O.d1, 4), f(O.d2, 4), f(O.Nd1, 4), f(O.Nd2, 4), f(O.kdisc, 4), f(A.delta, 4), f(A.gamma, 5), f(O.vega1, 4), sg(O.theta1, 4).slice(1).replace(/^/, '−'), f(mc.price, 4), f(mc.se, 4), f(mc.ciLow, 4), f(mc.ciHigh, 4), f(PATHS[0].se, 4), f(PATHS[2].se, 4), f(Math.abs(O.gap), 7), O.call.toFixed(6), O.callAcc.toFixed(6), pc(O.Nd2, 1));
has('w6', RM.w6, f(O.sig0, 4), f(O.k50, 4), f(O.k50Intr, 4), f(O.s10, 4), f(O.s40, 4), f(O.mcParity, 4), f(Math.abs(O.mcParityResid), 4), f(O.meanST, 4), f(O.fwd, 4), f(PATHS[2].price, 4), f(Math.abs(PATHS[2].price - A.price), 4));
has('w7', RM.w7, f(T.el, 0), pc(T.rate, 2), f(S1.st, 0), pc(S1.rate, 2), pc(SM.share, 1), pc(TOP.el, 1), pc(TOP.ead, 1), `${TOP.micro} 笔`);
has('w8', RM.w8, f(T.el, 0), f(S1.st, 0), pc(S1.uplift, 1), pc(SM.share, 1));

section('risk（风险实验室）');
const RK = ANS.risk || [];
ok(Array.isArray(RK) && RK.length >= 6, `risk 至少 6 题，实际 ${RK.length}`);
RK.forEach((r, i) => { const t = `risk[${i + 1}]`; ok(isStr(r.q) && isStr(r.result), `${t} q/result`); strs(r.steps, 3, 8, `${t}.steps`); ok(isStr(r.say) && len(r.say) <= 120, `${t}.say 应 ≤120 字，实际 ${len(r.say || '')}`); });
const rk = (i, ...n) => has(`risk[${i + 1}]`, RK[i] || {}, ...n);
rk(0, f(ONE[0].el, 2), f(ONE[0].ead, 0), f(T.el, 0), f(T.ead, 0), pc(T.rate, 2), f(ONE[0].el_loss, 0), ONE[0].pl.toFixed(7), pc(ONE[0].pl, 4));
rk(1, f(SM.el, 0), f(CO.el, 0), f(CC.el, 0), f(MG.el, 0), pc(SM.share, 1), pc(CO.share, 1), pc(CC.share, 1), pc(MG.share, 1), pc(CO.avgPd, 2), pc(SM.avgPd, 2), pc(CC.avgPd, 2), pc(MG.avgPd, 2), pc(CO.rate, 2), pc(SM.rate, 2), pc(MG.eadShare, 1), pc(X.microEadVsCons, 1));
rk(2, f(S1.st, 0), f(T.el, 0), f(S1.delta, 0), '+' + pc(S1.uplift, 1), pc(S1.rate, 2), pc(ONE[0].spd, 4), pc(ONE[0].slgd, 3), f(ONE[0].sel, 2), pc(S1.maxP, 1), pc(S1.maxL, 1));
rk(3, f(SM.s1, 0), f(CO.s1, 0), f(CC.s1, 0), f(MG.s1, 0), f(SM.s1Delta, 0), f(CO.s1Delta, 0), f(CC.s1Delta, 0), f(MG.s1Delta, 0), '+' + pc(CC.s2Up, 1), '+' + pc(SM.s2Up, 1), '+' + pc(MG.s2Up, 1), '+' + pc(CO.s2Up, 1), `${CO.lgdCapped2} 笔`);
rk(4, pc(lgdMax, 2), (.99 / lgdMax).toFixed(2), pc(pdMax, 2), (.99 / pdMax).toFixed(2), `${S2.lgdCapped} 笔`, f(S2.st, 0), '+' + pc(S2.uplift, 1), pc(2.5 * 2.2 - 1, 0));
rk(5, f(M.pos, 2), pc(M.lo, 4).replace('-', '−'), pc(M.hi, 4).replace('-', '−'), pc(M.var95, 2), pc(M.es, 2), String(M.tailN), pc(M.var10, 2));
rk(6, pc(M.sdPop, 4), pc(M.sdSmp, 4), pc(M.vol, 2), M.sqrt252.toFixed(4), f(M.px0, 2), f(M.peakPx, 2), f(M.troughPx, 2), String(M.peakDay), pc(M.mdd, 2).replace('-', '−'), pc(M.cum, 2).replace('-', '−'));
rk(7, f(ONE[0].sel, 2), f(ONE[1].sel, 2), f(ONE[2].sel, 2), f(ONE[0].sel + ONE[1].sel + ONE[2].sel, 2), f(ONE[0].el + ONE[1].el + ONE[2].el, 2), f(S1.st, 0), f(T.ead, 0));
rk(8, ...TOP.ids, pc(TOP.el, 1), pc(TOP.ead, 1), pc(TOP.pct, 2), `小微企业 ${TOP.micro} 笔`, `消费贷 ${TOP.consumer} 笔`, f(GRD.D.el, 0), pc(GRD.D.share, 1), pc(GRD.D.eadShare, 1), f(GRD.A.el, 0), pc(GRD.A.share, 1), pc(GRD.D.n / T.n, 1));
rk(9, pc(T.overdue / T.n, 1), pc(T.pdW, 2), pc(T.avgPd, 2), T.expOverdue.toFixed(2), `${T.overdue} 笔`);
ok(TOP.allD && TOP.micro === 6 && TOP.consumer === 4, 'EL 最大 10 笔应全为 D 级，小微企业 6 笔、消费贷 4 笔');
ok(S1.lgdCapped === 0 && S1.pdCapped === 0, '默认压力情景不应有任何封顶'); near(S1.uplift, 1.35 * 1.2 - 1, 1e-9, '默认压力增幅 = 1.35×1.2−1');
near(S3.uplift, 1.5 * 1.3 - 1, 1e-9, '1.5/1.3 增幅'); ok(S3.lgdCapped === 0, '1.5/1.3 无封顶'); has('interview[5] 现场推演', JSON.stringify(ANS.interview || ''), f(S3.st, 0), pc(S3.uplift, 1));
section('quant（金工计算台）');
const Q = ANS.quant || {}, D = Q.defaultRun || {};
const nz = (x, d) => Number(x).toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d });
ok(Array.isArray(Q.formulas) && Q.formulas.length >= 6 && Q.formulas.every(isStr), 'quant.formulas 至少 6 条');
ok(Array.isArray(Q.pitfalls) && Q.pitfalls.length >= 4 && Q.pitfalls.every(isStr), 'quant.pitfalls 至少 4 条');
ok(html.includes("quant:{S:100,K:100,T:1,r:.035,sigma:.22,type:'call',paths:50000,seed:20261003}"), '页面默认参数应为 S=100,K=100,T=1,r=0.035,σ=0.22,paths=50000,seed=20261003');
ok(JSON.stringify(D.inputs) === JSON.stringify({ S: 100, K: 100, T: 1, r: .035, sigma: .22, paths: 50000, seed: 20261003 }), 'defaultRun.inputs 应与页面默认参数一致');
[['analytic', A.price], ['mc', mc.price], ['se', mc.se], ['ciLow', mc.ciLow], ['ciHigh', mc.ciHigh], ['diff', O.diff], ['analyticExactErf', AC.call], ['d1', A.d1], ['d2', A.d2]].forEach(([k, v]) => near(D[k], v, 5e-7, `defaultRun.${k}`));
near(D.zScore, O.z, 5e-5, 'defaultRun.zScore');
ok(Math.abs(D.parityResidual) <= 1e-9 && Math.abs(A.parity) <= 1e-9 && Math.abs(Ap.parity) <= 1e-9, `parity 残差应 ≈0（页面实际 ${A.parity}）`);
near(D.put.analytic, Ap.price, 5e-7, 'defaultRun.put.analytic'); near(D.put.mc, mcP.price, 5e-7, 'defaultRun.put.mc'); near(D.put.se, mcP.se, 5e-7, 'defaultRun.put.se');
[['delta', A.delta], ['gamma', A.gamma], ['vega1pct', A.vega / 100], ['thetaDay', A.theta / 365]].forEach(([k, v]) => near(D.greeksShown[k], v, 5e-7, `greeksShown.${k}`));
const sh = D.shown || {};
ok(sh.analytic === nz(A.price, 4) && sh.mc === nz(mc.price, 4) && sh.se === nz(mc.se, 4) && sh.diff === nz(O.diff, 4) && sh.ci === `[${nz(mc.ciLow, 4)}, ${nz(mc.ciHigh, 4)}]` && sh.parity === nz(A.parity, 7), `defaultRun.shown 应等于页面的显示格式（实际页面：${nz(A.price, 4)} / ${nz(mc.price, 4)} / ${nz(mc.se, 4)} / ${nz(O.diff, 4)} / ${nz(A.parity, 7)}）`);
// 独立实现交叉验证（泰勒 erf + BigInt LCG），与页面函数对照
near(A.price, AC.call, 2e-5, '页面解析 Call 与泰勒 erf 独立实现'); near(Ap.price, AC.put, 2e-5, '页面解析 Put 与泰勒 erf 独立实现');
near(A.price - AC.call, -1.267e-5, 5e-8, '页面 erf 近似造成的偏差（答案里写 0.0000127）');
ok(nz(Ap.price, 4) !== nz(AC.put, 4) && nz(A.price, 4) === nz(AC.call, 4), 'Put 四位小数页面与精确值不同(6.9969/6.9970)，Call 相同');
[[50000, mc, 'call'], [150000, PATHS[2], 'call'], [50000, mcP, 'put']].forEach(([n, ref, ty]) => { const m = mcT(100, 100, 1, .035, .22, ty, n, 20261003); ['price', 'se', 'ciLow', 'ciHigh'].forEach(k => near(m[k], ref[k], 1e-9, `独立 MC(${ty},${n}).${k}`)); });
const fd = (S) => bsT(S, 100, 1, .035, .22).call; near(A.delta, (fd(100.01) - fd(99.99)) / .02, 1e-6, 'Delta 有限差分'); near(A.gamma, (fd(100.01) - 2 * fd(100) + fd(99.99)) / 1e-4, 1e-6, 'Gamma 有限差分');
ok(Array.isArray(Q.checks) && Q.checks.length === 3 && Q.checks.every(c => isStr(c.q) && isStr(c.answer)) && Q.checks.every(c => c.steps.length >= 3), 'quant.checks 应为 3 项，各有 q/steps/answer');
const c = Q.checks || [];
has('check1', c[0] || {}, f(O.call, 6), f(O.put, 6), f(O.call - O.put, 6), O.disc.toFixed(7), f(mcP.price, 4), f(mcP.se, 4), f(O.mcParity, 4), f(Math.abs(O.mcParityResid), 4), f(O.meanST, 4), f(O.fwd, 4));
has('check2', c[1] || {}, f(mc.price, 4), ...SEEDS.map(s => `${s.sd} → ${f(s.price, 4)}（${f(s.se, 4)}，${sg(s.price - A.price, 4)}，${sg(zOf(s), 2)}）`), `${O.covN} 个`, pc(O.covRate, 1), sg(O.zMean, 3), f(O.zSd, 3), (O.maxSeed - O.minSeed).toFixed(3), f(O.minSeed, 4), f(O.maxSeed, 4));
has('check3', c[2] || {}, ...PATHS.map(p => f(p.price, 4)), ...PATHS.map(p => f(p.se, 4)), O.seRatio.toFixed(2), O.sqrt15.toFixed(2), O.seRatio2.toFixed(2), O.sqrt3.toFixed(2), sg(PATHS[2].price - A.price, 4), sg(O.zExtreme, 2), f(PATHS[2].ciHigh, 4));
ok(!inCI(PATHS[2]) && A.price > PATHS[2].ciHigh && SEEDS.every(inCI) && inCI(mc) && PATHS[0] && inCI(PATHS[0]) && inCI(PATHS[1]), '150,000 路径默认种子下解析价应略在 CI 之外，其余都在 CI 内');
has('quant.pitfalls', Q.pitfalls || [], f(AC.call, 6), f(Math.abs(O.gap), 7), f(Ap.price, 4), f(AC.put, 4), f(AC.put, 6), f(Ap.price, 6));

section('sql（SQL 数据练习）');
const G = (rows, key) => { const m = new Map(); rows.forEach(r => { const k = r[key]; if (!m.has(k)) m.set(k, []); m.get(k).push(r); }); return [...m.entries()]; };
const avg = (a, k) => sum(a, x => x[k]) / a.length, nOv = (a) => a.filter(x => x.overdue).length;
const dsc = (arr, k) => arr.sort((p, q) => q[k] - p[k]), asc = (arr, k) => arr.sort((p, q) => p[k] > q[k] ? 1 : p[k] < q[k] ? -1 : 0), S = (a) => sum(a, x => x.ead), E = (a) => sum(a, x => x.pd * x.lgd * x.ead);
const IND = [null,
  () => dsc(G(loans, 'segment').map(([k, a]) => ({ segment: k, loans: a.length, avg_pd: avg(a, 'pd') })), 'avg_pd'),
  () => asc(G(loans, 'vintage').map(([k, a]) => ({ vintage: k, loans: a.length, total_ead: S(a) })), 'vintage'),
  () => loans.filter(x => x.pd >= .1).sort((p, q) => q.pd - p.pd).slice(0, 10).map(x => ({ id: x.id, segment: x.segment, grade: x.grade, pd: x.pd, lgd: x.lgd, ead: x.ead })),
  () => [{ loans: T.n, total_ead: T.ead, avg_pd: T.avgPd, avg_lgd: T.avgLgd, total_el: T.el }],
  () => dsc(G(loans, 'vintage').map(([k, a]) => ({ vintage: k, total_ead: S(a), avg_pd: avg(a, 'pd') })), 'avg_pd'),
  () => IND[5]().slice(0, 1),
  () => dsc(G(loans, 'segment').map(([k, a]) => ({ segment: k, loans: a.length, total_ead: S(a), total_el: E(a) })), 'total_el'),
  () => asc(G(loans, 'grade').map(([k, a]) => ({ grade: k, loans: a.length, avg_pd: avg(a, 'pd'), avg_lgd: avg(a, 'lgd'), total_el: E(a) })), 'grade'),
  () => dsc(G(loans, 'segment').map(([k, a]) => ({ segment: k, loans: a.length, overdue_cnt: nOv(a), overdue_rate: nOv(a) / a.length })), 'overdue_rate'),
  () => [...loans].sort((p, q) => q.pd * q.lgd * q.ead - p.pd * p.lgd * p.ead).slice(0, 10).map(x => ({ id: x.id, segment: x.segment, grade: x.grade, vintage: x.vintage, ead: x.ead, el: x.pd * x.lgd * x.ead })),
  () => dsc(G(loans.filter(x => x.dti > .6 && x.ead >= 300000), 'segment').map(([k, a]) => ({ segment: k, loans: a.length, total_ead: S(a), avg_pd: avg(a, 'pd') })), 'total_ead'),
  () => loans.filter(x => x.segment === '小微企业' && x.grade === 'D').sort((p, q) => q.el - p.el).slice(0, 5).map(x => ({ id: x.id, segment: x.segment, vintage: x.vintage, pd: x.pd, ead: x.ead, el: x.pd * x.lgd * x.ead })),
  () => dsc(G(loans.filter(x => x.overdue), 'grade').map(([k, a]) => ({ grade: k, overdue_loans: a.length, avg_pd: avg(a, 'pd'), total_ead: S(a) })), 'overdue_loans'),
  () => dsc(G(loans.filter(x => x.grade === 'D'), 'vintage').map(([k, a]) => ({ vintage: k, d_loans: a.length, total_el: E(a) })), 'total_el'),
  () => dsc(G(loans.filter(x => x.vintage >= 2025), 'segment').map(([k, a]) => ({ segment: k, avg_dti: avg(a, 'dti'), avg_rate: avg(a, 'rate'), avg_pd: avg(a, 'pd') })), 'avg_pd')];
function sameRows(tag, got, want) {
  ok(got.length === want.length, `${tag} 行数 ${got.length} ≠ ${want.length}`);
  got.forEach((g, j) => { const w = want[j]; if (!w) return; ok(JSON.stringify(Object.keys(g)) === JSON.stringify(Object.keys(w)), `${tag} 行${j + 1} 列名/顺序`);
    Object.keys(g).forEach(k => typeof g[k] === 'number' ? near(g[k], w[k], 1e-9 * Math.max(1, Math.abs(w[k])), `${tag} 行${j + 1}.${k}`) : ok(g[k] === w[k], `${tag} 行${j + 1}.${k}：${g[k]} ≠ ${w[k]}`)); });
}
const SQ = ANS.sql || [];
ok(Array.isArray(SQ) && SQ.length >= 10, `sql 至少 10 题，实际 ${SQ.length}`);
SQ.forEach((e, i) => {
  const tag = `sql[${i + 1}]`; ok([1, 2, 3].includes(e.level) && isStr(e.q) && isStr(e.sql) && isStr(e.why) && Array.isArray(e.rows), `${tag} 结构`);
  let res; try { res = L.runSQL(e.sql); } catch (err) { ok(false, `${tag} runSQL 执行失败：${err.message}`); return; }
  ok(res.length > 0 && e.rowCount === res.length && e.rows.length === Math.min(5, res.length), `${tag} rowCount/rows 条数（引擎返回 ${res.length} 行）`);
  e.rows.forEach((row, j) => { const w = res[j] || {}; ok(JSON.stringify(Object.keys(row)) === JSON.stringify(Object.keys(w)), `${tag} rows[${j}] 列名/顺序`);
    Object.keys(w).forEach(k => typeof w[k] === 'number' ? near(row[k], R4(w[k]), 1e-12, `${tag} rows[${j}].${k}（页面显示 4 位小数）`) : ok(row[k] === w[k], `${tag} rows[${j}].${k}`)); });
  if (IND[i + 1]) sameRows(`${tag} 与普通循环独立聚合`, res, IND[i + 1]()); else ok(false, `${tag} 没有对应的独立聚合`);
  res.forEach(r => Object.values(r).forEach(v => typeof v === 'number' && fact(v, R4(v))));
});
const vq = SQ.find(e => /GROUP BY vintage/i.test(e.sql) && /AVG\(pd\)/i.test(e.sql) && /SUM\(ead\)/i.test(e.sql) && /ORDER BY avg_pd DESC/i.test(e.sql));
ok(!!vq, '必须包含“每个 vintage 的总 EAD、平均 PD，并找出平均 PD 最高的年份”这一题');
if (vq) ok(L.runSQL(vq.sql)[0].vintage === +Object.entries(VIN).sort((a, b) => b[1].avgPd - a[1].avgPd)[0][0] && vq.rows[0].vintage === 2023, '平均 PD 最高的 vintage 应为 2023');
section('local（本机练习）：python3 + sqlite 交叉验证');
const LC = ANS.local || {}, CK = LC.checks || {}, VS = LC.vintageSql || {}, MS = LC.mcSeedCheck || {};
['python', 'sqlite', 'query', 'test', 'evidence'].forEach(k => { ok(html.includes(`['${k}','`), `页面 checklist 应有 ${k}`); ok(CK[k] && isStr(CK[k].cmd) && isStr(CK[k].expect) && isStr(CK[k].pass), `local.checks.${k} 需有 cmd/expect/pass`); });
ok(isStr(VS.sql) && L.runSQL(VS.sql)[0].vintage === (vq || { rows: [{}] }).rows[0].vintage && /COUNT\(\*\)/.test(VS.sql) && /AVG\(pd\)/.test(VS.sql) && /SUM\(ead\)/.test(VS.sql), 'vintageSql.sql 应含笔数/总EAD/平均PD，且首行年份与题库里的 vintage 题一致');
sameRows('vintageSql.rows', VS.rows || [], L.runSQL(VS.sql || 'x').slice(0, 5).map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, R4(v)]))));
ok(JSON.stringify(VS.topRow) === JSON.stringify(VS.rows && VS.rows[0]), 'vintageSql.topRow 应等于 rows[0]');
const csv = ['id,segment,grade,pd,lgd,ead,rate,dti,vintage,overdue', ...loans.map(x => [x.id, x.segment, x.grade, x.pd, x.lgd, x.ead, x.rate, x.dti, x.vintage, x.overdue].join(','))].join('\n');
ok((csv.match(/\n/g) || []).length === 160 && CK.sqlite && CK.sqlite.expect.includes('160 loans_training.csv'), 'wc -l 应为 160（CSV 末尾无换行）');
const pyOk = (() => { const r = cp.spawnSync('python3', ['-I', '-c', 'import sqlite3,sys;print(sys.version_info[0])'], { encoding: 'utf8' }); return r.status === 0 && r.stdout.trim() === '3'; })();
const lines = (t) => t.split('\n').map(s => s.trim()).filter(Boolean);
const toJ = (s) => JSON.parse(s.replace(/'/g, '"').replace(/^\(/, '[').replace(/\)$/, ']'));
if (!pyOk) skipped('未找到 python3：跳过 starter 脚本、sqlite、Python MC 的交叉验证');
else {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vba-'));
  const run = (args, input) => { const r = cp.spawnSync('python3', ['-I', ...args], { cwd: dir, encoding: 'utf8', input, timeout: 120000 }); if (r.status !== 0) ok(false, `python3 ${args[0]} 失败：${(r.stderr || '').slice(0, 200)}`); return r.stdout || ''; };
  const starter = html.slice(html.indexOf('const py=`') + 10, html.indexOf('`;', html.indexOf('const py=`')));
  fs.writeFileSync(path.join(dir, 'loans_training.csv'), csv); fs.writeFileSync(path.join(dir, 'risk_training_starter.py'), starter);
  const out1 = lines(run(['risk_training_starter.py'])), exp1 = lines(CK.sqlite.expect).filter(s => s.startsWith("{'segment'"));
  ok(out1.length === 4 && exp1.length === 4, `starter 应打印 4 行（实际 ${out1.length}），预期输出应有 4 行（实际 ${exp1.length}）`);
  out1.forEach((s, i) => { const a = toJ(s), b = toJ(exp1[i] || '{}'); ok(a.segment === b.segment && a.loans === b.loans, `starter 第${i + 1}行 客群/笔数`); near(a.total_ead, b.total_ead, 0, `starter 第${i + 1}行 total_ead`); near(a.avg_pd, b.avg_pd, 1e-12, `starter 第${i + 1}行 avg_pd`);
    const pg = SEG[a.segment]; near(a.avg_pd, pg.avgPd, 1e-12, `sqlite 与页面独立聚合 ${a.segment} avg_pd`); near(a.total_ead, pg.ead, 0, `sqlite 与页面 ${a.segment} total_ead`); });
  ok(run(['-c', "import sqlite3; c=sqlite3.connect('loans.db'); print(c.execute('SELECT COUNT(*), SUM(ead) FROM loans').fetchone())"]).trim() === '(160, 42143530.0)' && CK.sqlite.expect.includes('(160, 42143530.0)'), 'loans.db 计数与 EAD 合计');
  const o2 = lines(run(['-c', `import sqlite3; c=sqlite3.connect('loans.db'); [print(r) for r in c.execute(${JSON.stringify(VS.sql)})]`])), e2 = lines(CK.query.expect);
  ok(o2.length === 5 && e2.length === 5, 'vintage 查询应 5 行'); o2.forEach((s, i) => { const a = toJ(s), b = toJ(e2[i] || '[]'); ok(a[0] === b[0] && a[1] === b[1], `query 第${i + 1}行 年份/笔数`); near(a[2], b[2], 0, `query 第${i + 1}行 total_ead`); near(a[3], b[3], 1e-12, `query 第${i + 1}行 avg_pd`); near(a[3], VIN[a[0]].avgPd, 1e-12, `sqlite 与页面独立聚合 ${a[0]}`); });
  // Python 版 MC 脚本：与答案里的数字、页面 MC 都对上
  const py1 = lines(((code) => { fs.writeFileSync(path.join(dir, 'mc_seed_check.py'), code); return run(['mc_seed_check.py']); })(MS.code || ''));
  const mm = (l) => Object.fromEntries([...l.matchAll(/(\w+)=([-+\w.]+)/g)].map(m => [m[1], m[2]]));
  near(parseFloat(py1[0].split('=')[1]), MS.analyticPython, 5e-7, 'Python 解析价'); near(MS.analyticPython, AC.call, 5e-7, 'Python 解析价应等于精确 erf 的 BS');
  MS.expect.forEach((e, i) => { const a = mm(py1[i + 1] || ''); ok(+a.seed === e.seed, `mcSeedCheck 第${i + 1}行种子`); ['mc', 'se', 'diff'].forEach(k => near(+a[k], e[k], 5e-7, `Python MC seed=${e.seed}.${k}`)); near(+a.z, e.z, 5e-3, `Python MC seed=${e.seed}.z`); ok((a.inCI === 'True') === e.inCI, `Python MC seed=${e.seed}.inCI`);
    const jsr = MC(50000, e.seed); near(e.mc, jsr.price, 5e-7, `Python MC 与页面 monteCarlo 一致 seed=${e.seed}`); near(e.se, jsr.se, 5e-7, `SE 一致 seed=${e.seed}`); });
  const exp = lines(CK.test.expect); ok(py1.length === 4 && exp.length === 4 && exp.every((s, i) => s === py1[i]), 'local.checks.test.expect 应与脚本实际输出逐行一致');
  fs.writeFileSync(path.join(dir, 'mc150.py'), (MS.code || '').replace('50000', '150000'));
  const a150 = mm(lines(run(['mc150.py']))[1] || ''), P150 = MS.paths150000 || {}; near(+a150.mc, P150.mc, 5e-7, '150000 路径 Python mc'); near(+a150.se, P150.se, 5e-7, '150000 路径 Python se'); near(+a150.z, P150.z, 5e-3, '150000 路径 Python z'); ok((a150.inCI === 'True') === P150.inCI && P150.inCI === false, '150000 路径 Python inCI 应为 False');
  // 题库里全部 SQL 在 sqlite 里复算（overdue 为 TEXT、无 el 列，需翻译；并列时顺序可能不同，故按整行排序后比较）
  const tr = (s) => s.replace(/SUM\(overdue\)/g, "SUM(overdue='true')").replace(/AVG\(overdue\)/g, "AVG(overdue='true')").replace(/overdue = true/g, "overdue = 'true'").replace(/SUM\(el\)/g, 'SUM(pd*lgd*ead)').replace(/, el FROM/g, ', pd*lgd*ead AS el FROM');
  const got = JSON.parse(run(['-c', "import sqlite3,json,sys; c=sqlite3.connect('loans.db'); q=json.load(sys.stdin); print(json.dumps([[list(r) for r in c.execute(s).fetchall()] for s in q]))"], JSON.stringify(SQ.map(e => tr(e.sql)))) || '[]');
  SQ.forEach((e, i) => { const mine = L.runSQL(e.sql).map(r => Object.values(r)), theirs = got[i] || []; const key = (r) => JSON.stringify(r.map(v => typeof v === 'number' ? +v.toPrecision(10) : v));
    ok(mine.length === theirs.length && JSON.stringify(mine.map(key).sort()) === JSON.stringify(theirs.map(key).sort()), `sql[${i + 1}] 在 sqlite 里的结果应与页面引擎一致`); });
  fs.rmSync(dir, { recursive: true, force: true }); console.log('  (python3 交叉验证完成，临时目录已清理)');
}
section('project / interview / 红线');
const PJ = ANS.project || {}, IV = ANS.interview || [];
ok(isStr(PJ.findings) && len(PJ.findings) <= 200, `project.findings 应 ≤200 字，实际 ${len(PJ.findings || '')}`);
ok(isStr(PJ.sample90s) && len(PJ.sample90s) >= 330 && len(PJ.sample90s) <= 450 && PJ.sample90s.includes('合成数据'), `project.sample90s 应 330–450 字（约 90 秒）且明说合成数据，实际 ${len(PJ.sample90s || '')}`);
ok(Array.isArray(PJ.bullets) && PJ.bullets.length >= 3 && PJ.bullets.every(isStr), 'project.bullets 至少 3 条');
(PJ.bullets || []).forEach((b, i) => { ok(/合成|个人练习|synthetic/i.test(b), `project.bullets[${i}] 须带“合成/个人练习”限定词`); ok(!/上线|落地|投产|服务了/.test(b), `project.bullets[${i}] 不得写成上线/落地/服务了业务`); });
has('project.findings', PJ.findings || '', f(T.el, 0), f(S1.st, 0), pc(S1.uplift, 1), f(SM.s1, 0), pc(SM.share, 1), pc(CO.avgPd, 2), String(GRD.D.n), pc(GRD.D.share, 1), '合成');
has('project.sample90s', PJ.sample90s || '', f(T.el, 0), f(S1.st, 0), pc(S1.uplift, 1), pc(SM.share, 1), f(O.call, 4), f(mc.price, 4), f(mc.se, 4), '160', '40');
has('project.bullets', PJ.bullets || [], f(T.el, 0), pc(T.rate, 2), f(S1.st, 0), pc(S1.uplift, 1), pc(SM.share, 1), f(O.call, 4), f(mc.price, 4), f(mc.se, 4), pc(O.covRate, 1));
ok(IV.length === L.questions.length, `interview 应对应页面全部 ${L.questions.length} 题，实际 ${IV.length}`);
IV.forEach((e, i) => {
  const t = `interview[${i + 1}]`;
  ok(e.q === (L.questions[i] || {}).q, `${t}.q 应与页面 questions[${i}].q 完全一致`);
  ok(isStr(e.a30) && len(e.a30) <= 160, `${t}.a30 应非空且 ≤160 字，实际 ${len(e.a30 || '')}`);
  ok(isStr(e.a180) && len(e.a180) >= 500 && len(e.a180) <= 800, `${t}.a180 应 500–800 字，实际 ${len(e.a180 || '')}`);
  ok((e.a180 || '').includes('用合成数据做的训练项目'), `${t}.a180 必须明说“这是用合成数据做的训练项目”`);
  ok(Array.isArray(e.tree) && e.tree.length >= 3 && e.tree.every(n => isStr(n.ask) && isStr(n.ans)), `${t}.tree 至少 3 个追问`);
  ok((e.tree || []).filter(n => Array.isArray(n.next) && n.next.length >= 1 && n.next.every(m => isStr(m.ask) && isStr(m.ans))).length >= 2, `${t}.tree 至少 2 个追问带第二层 next`);
  ok(Array.isArray(e.numbers) && e.numbers.length >= 3 && e.numbers.every(isStr), `${t}.numbers 至少 3 条`);
  ok(!/上线|落地|投产/.test(JSON.stringify([e.a30, e.a180, e.tree])), `${t} 不得出现上线/落地/投产等生产经验措辞`);
});
has('interview[1]', IV[0] || {}, f(T.el, 0), f(T.ead, 0), pc(T.rate, 2), f(S1.st, 0), f(S1.delta, 0), pc(S1.uplift, 1), f(SM.s1, 0), pc(SM.share, 1), pc(CO.avgPd, 2), f(SM.ead, 0), f(CO.ead, 0), `${S2.lgdCapped} 笔`, '+' + pc(S2.uplift, 1), f(ONE[0].el, 2));
has('interview[2]', IV[1] || {}, f(SM.el, 0), f(CO.el, 0), f(MG.el, 0), pc(SM.share, 1), pc(CO.avgPd, 2), pc(MG.avgPd, 2), pc(X.microEadVsCons, 1), f(MG.ead, 0), f(T.naive, 0), pc(T.naiveGap, 1), pc(T.pdW, 2), pc(T.lgdW, 2));
has('interview[3]', IV[2] || {}, f(SM.el, 0), f(SM.s1, 0), pc(SM.share, 1), pc(TOP.el, 1), pc(TOP.ead, 1), '+' + pc(CC.s2Up, 1), '+' + pc(SM.s2Up, 1), '+' + pc(CO.s2Up, 1), pc(SM.s2Share, 1), pc(GRD.D.share, 1), pc(GRD.A.share, 1));
has('interview[4]', IV[3] || {}, `${T.overdue} 笔`, pc(T.overdue / T.n, 1), T.expOverdue.toFixed(2), f(Math.abs(O.gap), 7), f(mc.price, 4), f(A.price, 4), f(PATHS[0].se / PATHS[2].se, 2), pc(O.covRate, 1), O.sqrt15.toFixed(2));
has('interview[6]', IV[5] || {}, f(A.price, 4), f(mc.price, 4), f(mc.se, 4), sg(O.diff, 4), f(Math.abs(O.z), 2), f(PATHS[2].price, 4), f(Math.abs(PATHS[2].price - A.price), 4), String(O.covN), f(O.mcParity, 4), f(O.parityRhs, 4), f(Math.abs(O.mcParityResid), 4), f(O.meanST, 4), f(O.fwd, 4), pc(O.undisc, 1), sg(O.zMean, 3), f(O.zSd, 3), f(Math.abs(O.gap), 7));
// 红线：任何字符串里都不得出现“我在某某公司做过”式句子
const ALLSTR = []; (function walk(o, p) { if (typeof o === 'string') ALLSTR.push([p, o]); else if (Array.isArray(o)) o.forEach((v, i) => walk(v, `${p}[${i}]`)); else if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => walk(v, p ? `${p}.${k}` : k)); })(ANS, '');
const BAN = [/我在[^，。；,\n]{0,12}(公司|银行|基金|券商|机构|百度|腾讯|阿里|字节)[^，。；,\n]{0,8}(做过|工作过|负责过|上线|落地)/, /某某公司/, /我(曾)?(任职|就职)于/];
ALLSTR.forEach(([p, s]) => BAN.forEach(re => ok(!re.test(s), `红线：${p} 出现“我在某某公司做过”式句子`)));
console.log(`  (已扫描 ${ALLSTR.length} 个字符串)`);
// 嵌套前缀：同一种子下 10,000 / 50,000 / 150,000 路径的价格，等于同一条随机序列在对应位置的累计均值（答案里“样本相互嵌套”的依据）
{ const g = L.LCG(20261003); let s = 0; const at = {};
  for (let i = 1; i <= 150000; i++) { s += Math.max(100 * Math.exp(.035 - .5 * .22 * .22 + .22 * L.normalFrom(g)) - 100, 0); if (i === 10000 || i === 50000 || i === 150000) at[i] = Math.exp(-.035) * s / i; }
  PATHS.forEach(p => near(at[p.n], p.price, 1e-12, `同种子嵌套前缀 ${p.n} 路径`)); }
// 上下文绑定：不只要求数字出现，还要求它出现在“对的那句话”里（防止某处抄错、恰好撞上另一个事实）
section('上下文绑定（数字必须挂在正确的描述后面）');
const sum3 = ONE.reduce((s, o) => s + o.sel, 0), base3 = ONE.reduce((s, o) => s + o.el, 0), negPc = (x, d) => '−' + pc(Math.abs(x), d);
const ctx = (label, obj, ...needles) => has(label, obj, ...needles);
ctx('interview[1].a180', IV[0].a180, `基线是 ${f(T.el, 0)} 元，占总暴露 ${f(T.ead, 0)} 元的 ${pc(T.rate, 2)}`, `压力后是 ${f(S1.st, 0)} 元，增加 ${f(S1.delta, 0)} 元，增幅 ${pc(S1.uplift, 1)}`, `压力 EL 为 ${f(SM.s1, 0)} 元，占 ${pc(SM.share, 1)}`, `平均 PD 更高，${pc(CO.avgPd, 2)}`);
ctx('interview[2].a180', IV[1].a180, `消费贷最高，${pc(CO.avgPd, 2)}`, `小微企业最高，${f(SM.el, 0)} 元，占 ${pc(SM.share, 1)}，消费贷是 ${f(CO.el, 0)} 元`, `${f(SM.ead, 0)} 元对 ${f(CO.ead, 0)} 元，多 ${pc(X.microEadVsCons, 1)}`, `暴露 ${f(MG.ead, 0)} 元是四个客群里最大的，预期损失却最小，${f(MG.el, 0)} 元，因为它的平均 PD 只有 ${pc(MG.avgPd, 2)}`, `加权 PD ${pc(T.pdW, 2)} 乘加权 LGD ${pc(T.lgdW, 2)} 再乘总暴露 ${f(T.ead, 0)} 元，只得到 ${f(T.naive, 0)} 元，而逐笔相乘再求和是 ${f(T.el, 0)} 元，低估了 ${pc(T.naiveGap, 1)}`);
ctx('interview[3].a180', IV[2].a180, `基线下小微企业 EL 是 ${f(SM.el, 0)}，占 ${pc(SM.share, 1)}；压力后是 ${f(SM.s1, 0)}，仍然占 ${pc(SM.s1Share, 1)}`, `占总 EL 的 ${pc(TOP.el, 1)}，却只占暴露的 ${pc(TOP.ead, 1)}`, `信用卡最高，${pc(CC.s2Up, 1)}，小微企业 ${pc(SM.s2Up, 1)}，消费贷最低，${pc(CO.s2Up, 1)}`, `160 笔，总暴露 ${f(T.ead, 0)} 元`);
ctx('interview[4].a180', IV[3].a180, `一共只有 ${T.overdue} 笔，占 ${pc(T.overdue / T.n, 1)}，按这个规则期望是 ${T.expOverdue.toFixed(2)} 笔`, `各客群增幅都是 ${pc(S1.uplift, 1)}`, `解析价比精确值小约 ${f(Math.abs(O.gap), 7)}`);
ctx('interview[5].a180', IV[4].a180, `基线预期损失 ${f(T.el, 0)}，压力后 ${f(S1.st, 0)}，增幅 ${pc(S1.uplift, 1)}`);
ctx('interview[6].a180', IV[5].a180, `Monte Carlo 是 ${f(mc.price, 4)}，标准误 ${f(mc.se, 4)}，解析价 ${f(A.price, 4)}，差 ${sg(O.diff, 4)}，只有 ${f(Math.abs(O.z), 2)} 个标准误`, `MC 是 ${f(PATHS[2].price, 4)}，差 ${sg(PATHS[2].price - A.price, 4)}，正好 ${f(Math.abs(O.zExtreme), 2)} 个标准误`, `有 ${O.covN} 个区间覆盖了解析价`, `漏了会系统性偏高约 ${pc(O.undisc, 1)}`);
ctx('risk[1].result', RK[0].result, `PD × LGD × EAD = ${f(ONE[0].el, 2)} 元（占 EAD 的 ${pc(ONE[0].pl, 4)}）`, `EL = ${f(T.el, 0)} 元，占总 EAD ${f(T.ead, 0)} 的 ${pc(T.rate, 2)}`);
ctx('risk[2].result', RK[1].result, `小微企业，${f(SM.el, 0)} 元（${pc(SM.share, 1)}）`, `消费贷（${pc(CO.avgPd, 2)}）`);
ctx('risk[3].result', RK[2].result, `压力 EL = ${f(S1.st, 0)} 元；基线 ${f(T.el, 0)} 元；增加 ${f(S1.delta, 0)} 元，增幅 +${pc(S1.uplift, 1)}`);
ctx('risk[4].result', RK[3].result, `压力 EL ${f(SM.s1, 0)}，占 ${pc(SM.share, 1)}`, `（+${f(SM.s1Delta, 0)}）`, `信用卡（+${pc(CC.s2Up, 1)}）`);
ctx('risk[5].result', RK[4].result, `LGD 乘数约 ${(.99 / lgdMax).toFixed(2)}，PD 乘数约 ${(.99 / pdMax).toFixed(2)}`, `有 ${S2.lgdCapped} 笔封顶，增幅 +${pc(S2.uplift, 1)}`);
ctx('risk[6].result', RK[5].result, `VaR95（1 日，历史模拟）= ${pc(M.var95, 2)}；ES95 = ${pc(M.es, 2)}`, `分位位置 ${f(M.pos, 2)}`);
ctx('risk[7].result', RK[6].result, `年化波动率 ${pc(M.vol, 2)}；最大回撤 ${pc(-M.mdd, 2)}（${f(M.peakPx, 2)} 到 ${f(M.troughPx, 2)}）；区间累计收益 ${negPc(M.cum, 2)}`);
ctx('risk[8].result', RK[7].result, `L001 为 ${f(ONE[0].sel, 2)}；L002 为 ${f(ONE[1].sel, 2)}；L003 为 ${f(ONE[2].sel, 2)}；三笔合计 ${f(sum3, 2)}（基线 ${f(base3, 2)} 的 ${f(1 + S1.uplift, 2)} 倍）`);
ctx('risk[9].result', RK[8].result, `占 EL 的 ${pc(TOP.el, 1)}（只占 EAD 的 ${pc(TOP.ead, 1)}）`, `D 级 ${GRD.D.n} 笔占 EL 的 ${pc(GRD.D.share, 1)}，A 级 ${GRD.A.n} 笔占 ${pc(GRD.A.share, 1)}`);
ctx('risk[10].result', RK[9].result, `逾期 ${T.overdue} 笔 / ${T.n} 笔 = ${pc(T.overdue / T.n, 1)}，期望 ${T.expOverdue.toFixed(2)} 笔`);
ctx('project.findings', PJ.findings, `基线 EL ${f(T.el, 0)}（占 EAD ${pc(T.rate, 2)}）`, `压力 EL ${f(S1.st, 0)}，增 ${pc(S1.uplift, 1)}`, `压力 EL ${f(SM.s1, 0)}，占 ${pc(SM.share, 1)}`, `消费贷平均 PD 最高（${pc(CO.avgPd, 2)}）`, `D 级 ${GRD.D.n} 笔占 EL 的 ${pc(GRD.D.share, 1)}`);
ctx('project.sample90s', PJ.sample90s, `基线预期损失 ${f(T.el, 0)}，压力后 ${f(S1.st, 0)}，增加 ${pc(S1.uplift, 1)}`, `小微企业贡献最高，占 ${pc(SM.share, 1)}`, `解析价 ${f(A.price, 4)}，蒙特卡洛 ${f(mc.price, 4)}，标准误 ${f(mc.se, 4)}`);
ctx('project.bullets', PJ.bullets, `基线预期损失 ${f(T.el, 0)}（占 EAD 的 ${pc(T.rate, 2)}）`, `压力 EL 升至 ${f(S1.st, 0)}（+${pc(S1.uplift, 1)}）`, `最高贡献客群（${pc(SM.share, 1)}）`, `解析价 ${f(A.price, 4)}`, `得 ${f(mc.price, 4)}（SE ${f(mc.se, 4)}）`, `覆盖率（${pc(O.covRate, 1)}）`);
// ---------- 6. 正文数字对账（启发式） ----------
// 规则：正文里每个“带小数点 / 百分号 / 千分位 / 大于等于 10 的整数”都必须能对上上面重算出的某个事实（按其小数位四舍五入），
// 或是已声明的常量（题面参数、字数、秒数等）。个位整数不检查。它抓得住抄错的数字，抓不住“数字对、解释错”。
section('正文数字对账（启发式）');
// 答案里出现、但上面尚未登记的“手算值 / 题面常量”，全部是可复算的数：
fact(100 * 0.6061 - 96.5605 * 0.5196, Math.abs(100 * 0.6061 - 96.5605 * 0.5196 - A.price), pos - lo, GRD.D.n / T.n, 200 * .95, .1, .6, 50, 300000, 42, ...SEEDS.map(s => s.sd));
const INTC = new Set([10, 12, 13, 15, 20, 24, 25, 30, 32, 40, 60, 90, 100, 120, 150, 160, 180, 200, 250, 252, 350, 365, 500, 800, 1000, 1664525, 1013904223, 20261003, 20261004, 7919, 10000, 50000, 150000]);
const TOK = /(?<![A-Za-z_\d.])((?:\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?)(%?)/g;
const SKIPPATH = [/^local\.mcSeedCheck\.code$/, /^local\.checks\.\w+\.(cmd|expect)$/, /\.sql$/, /^local\.vintageSql\.sqlPretty$/];
function tokOk(raw, pct) {
  const num = parseFloat(raw.replace(/,/g, '')), dec = (raw.split('.')[1] || '').length, tol = 0.5 * Math.pow(10, -dec) + 1e-9;
  if (pct) return FR.some(x => Math.abs(num - x * 100) <= tol);
  if (dec === 0) { if (num < 10 && !raw.includes(',')) return true; return INTC.has(num) || FI.has(num) || ((num >= 1000 || raw.includes(',')) && F.some(x => Math.abs(num - x) <= 0.5)); }
  return F.some(x => Math.abs(num - x) <= tol);
}
let nTok = 0;
ALLSTR.filter(([p]) => !SKIPPATH.some(re => re.test(p))).forEach(([p, s]) => {
  const clean = s.replace(/\d+(?:\.\d+)?e-?\d+/gi, ' ').replace(/\d+\.\d+\.\d+/g, ' ');
  for (const m of clean.matchAll(TOK)) {
    if (m[3] === '' && m[2] === undefined && +m[1].replace(/,/g, '') < 10 && !m[1].includes(',')) continue;
    nTok++; ok(tokOk(m[1] + (m[2] || ''), m[3] === '%'), `数字对不上任何重算值：${p} 「…${clean.slice(Math.max(0, m.index - 14), m.index + m[0].length + 6)}…」中的 ${m[0]}`);
  }
});
console.log(`  (对账了 ${nTok} 个数字；事实池 ${F.length} 个值)`);
section('汇总');
console.log(`断言通过 ${pass}，失败 ${fail}，跳过 ${skip}`);
process.exit(fail ? 1 : 0);
