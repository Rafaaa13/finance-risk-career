"""独立复算：用 numpy 重新实现关键题目的答案，与前端（jsdom 跑出的参考答案）逐项对比。
用法（在 训练工作台源码 目录）：
  python3 build.py /tmp/out.html
  NODE_PATH=<jsdom> node tests/answers.js /tmp/out.html > /tmp/answers.json
  python3 tests/verify_answers.py /tmp/answers.json
"""
import json, math, re, sys
from pathlib import Path
import numpy as np

B = Path(__file__).resolve().parent.parent
t = (B / 'fund' / 'fund_05_data.js').read_text(encoding='utf-8')
FR = json.loads(t[t.index('const FR=') + 9:].rstrip().rstrip(';'))
ans = json.load(open(sys.argv[1], encoding='utf-8'))
num = lambda s: float(re.match(r'-?[\d,\.]+', s.replace(',', '')).group())
F = {f['c']: f for f in FR['funds']}
idxr = lambda n: np.array([(FR['idx'][n]['m'][i + 1] / FR['idx'][n]['m'][i] - 1) * 100 for i in range(60)])
ann = lambda r: np.prod(1 + np.array(r) / 100) ** (12 / len(r)) - 1
rf = np.mean(FR['yld']['cn2']) / 100
def ols(y, X):
    A = np.column_stack([np.ones(len(y))] + list(X)); b = np.linalg.lstsq(A, y, rcond=None)[0]; return b
def rank(a):
    o = np.argsort(a, kind='mergesort'); r = np.empty(len(a)); r[o] = np.arange(len(a));
    for v in set(a):  # 平均秩
        m = [i for i, x in enumerate(a) if x == v]
        if len(m) > 1: r[m] = np.mean(r[m])
    return r + 1
sp = lambda x, y: np.corrcoef(rank(list(x)), rank(list(y)))[0, 1]
res = []
def chk(key, mine, tol):
    got = ans[[k for k in ans if k.startswith(key)][0]]
    g = num(got) if isinstance(mine, float) else got
    ok = abs(g - mine) <= tol if isinstance(mine, float) else g == mine
    res.append((key, ok, g, mine))
# --- val：贵州茅台
S = {s['code']: s for s in json.load(open(B / 'fund/data/raw_stocks_C.json', encoding='utf-8'))['stocks']}
s = S['600519']; a = {x['y']: x for x in s['annual']}
chk('val.cagr', ((a[2025]['np_yi'] / a[2020]['np_yi']) ** (1 / 5) - 1) * 100, 0.01)
chk('val.conv', float(np.mean([a[y]['cfps'] / a[y]['eps'] for y in (2023, 2024, 2025)])), 0.001)
chk('val.pe', s['quote']['price'] / a[2025]['eps'], 0.01)
def val(g, r=0.09, tg=0.025, e0=a[2025]['eps']):
    v = 0; e = e0
    for k in range(1, 11): e *= 1 + g; v += e / (1 + r) ** k
    return v + e * (1 + tg) / (r - tg) / (1 + r) ** 10
lo, hi = -0.5, 0.8
for _ in range(100):
    m = (lo + hi) / 2; lo, hi = (m, hi) if val(m) < s['quote']['price'] else (lo, m)
chk('val.impl', (lo + hi) / 2 * 100, 0.01)
fin = lambda x: bool(re.search('银行|保险|证券', x['industry']))
cv = [(x['name'], x['annual'][0]['cfps'] / x['annual'][0]['eps']) for x in S.values() if not fin(x) and x['annual'][0]['eps'] > 0 and x['annual'][0]['cfps'] is not None]
cv.sort(key=lambda z: z[1]); chk('val.scr', cv[0][0], 0)
# --- attr：005827 / 沪深300 / 60m
f = F['005827']; r = np.array(f['r']); b = idxr('沪深300')
chk('attr.ann', ann(r) * 100, 0.001)
beta = ols(r, [b])[1]; chk('attr.beta', beta, 0.0005)
te = np.std(r - b, ddof=1) * math.sqrt(12) / 100
chk('attr.ir', (ann(r) - ann(b)) / te, 0.0005)
dn = b < 0; chk('attr.dn', r[dn].mean() / b[dn].mean(), 0.0005)
X = [idxr(n) for n in ['沪深300', '中证1000', '创业板指', '国债指数']]
chk('attr.sty', ols(r, X)[1], 0.0005)
chk('attr.cr', sum(x[2] for x in f['top']['rows']), 0.0005)
yr = lambda rr, y: np.prod([1 + rr[i] / 100 for i in range(60) if FR['months'][i + 1].startswith(str(y))]) - 1
chk('attr.yr', (yr(r, 2024) - yr(b, 2024)) * 100, 0.001)
# --- fi：003358
Y = FR['yld']; dy10 = np.diff(Y['cn10']) * 100
g = F['003358']; o = ols(np.array(g['r']), [dy10])
chk('fi.slope', (Y['cn10'][60] - Y['cn2'][60]) * 100, 0.01)
chk('fi.dur', -100 * o[1], 0.001); chk('fi.be', -o[0] / o[1], 0.01)
mp = dict(zip(FR['cn10d']['d'], FR['cn10d']['y'])); e = F['511260']['dy']
xs, ys, prev = [], [], None
for d_, rr in zip(e['d'], e['r']):
    if d_ not in mp: prev = None; continue
    if prev is not None: xs.append((mp[d_] - prev) * 100); ys.append(rr)
    prev = mp[d_]
chk('fi.dd', -100 * ols(np.array(ys), [np.array(xs)])[1], 0.001)
q = [x[1] for x in g['q4']]; chk('fi.q4', min(v / q[0] - 1 for v in q) * 100, 0.001)
chk('fi.eq', ols(np.array(g['r']), [idxr('国债指数'), idxr('沪深300')])[2], 0.0005)
# --- quant
U = [f for f in FR['funds'] if f['adj'] and re.search('权益|指数', f['cat'])]
cp = lambda r, a_, b_: np.prod([1 + x / 100 for x in r[a_:b_]]) - 1
chk('quant.qc', float(sum(1 for f in FR['funds'] if not f['adj'])), 0.01)
chk('quant.ic', sp([cp(f['r'], 0, 12) for f in U], [cp(f['r'], 12, 24) for f in U]), 0.0005)
chk('quant.mic', float(np.mean([sp([cp(f['r'], s_ - 12, s_) for f in U], [cp(f['r'], s_, s_ + 12) for f in U]) for s_ in (12, 24, 36, 48)])), 0.0005)
codes = ['000628', '110020', '003358', '340001', '270023']
cm = np.corrcoef([F[c]['r'] for c in codes]); chk('quant.fof', float(cm[np.triu_indices(5, 1)].mean()), 0.0005)
def st(r):
    r = np.array(r); a_ = ann(r); v = r.std(ddof=1) / 100 * math.sqrt(12)
    path = np.cumprod(1 + r / 100); dd = (path / np.maximum.accumulate(np.concatenate([[1], path]))[1:] - 1).min()
    return a_, (a_ - rf) / v, min(dd, 0)
passed = [f for f in U if (lambda x: x[1] >= -0.4 and x[2] >= -0.45 and x[0] >= -0.10)(st(f['r'][:36]))]
chk('quant.scr', float(len(passed)), 0.01)
# --- risk：005827 日度
dr = np.array(F['005827']['dy']['r']); q5 = np.quantile(dr, 0.05)
chk('risk.v95', -q5, 0.0005); chk('risk.es', -dr[dr <= q5].mean(), 0.0005)
qh = np.quantile(dr[:121], 0.05); chk('risk.exc', float((dr[121:] < qh).sum()), 0.01)
best = max(((x[2], f['n']) for f in FR['funds'] if not (f['cat'] == '指数') for x in (f['top'] or {}).get('rows', [])), key=lambda z: z[0])
chk('risk.mxw', 10 - best[0], 0.0005)
co = 0
for c in F:
    if F[c]['n'].startswith('易方达'):
        for x in (F[c]['top'] or {}).get('rows', []):
            if x[0] == '600519': co += x[2] / 100 * F[c]['al']['net'][-1]
chk('risk.co', co / S['600519']['quote']['mcap_yi'] * 100, 0.0005)
w = F['005827']['fw']; chk('risk.rr', w['redeem'][-1] / w['shares'][-2] * 100, 0.0005)
al = F['005827']['al']; navps = al['net'][-1] / w['shares'][-1]
chk('risk.cc', al['cash'][-1] / 100 * al['net'][-1] / (w['redeem'][-1] * navps), 0.0005)
# --- prod
r = np.array(F['005827']['r']); pos = [np.prod(1 + r[i:i + 12] / 100) - 1 for i in range(49)]
chk('prod.roll', float(np.mean(np.array(pos) > 0) * 100), 0.001)
p = np.concatenate([[1], np.cumprod(1 + r / 100)])
cf = [-1] * 60 + [sum(p[60] / p[t] for t in range(60))]
f_ = lambda x: sum(c / (1 + x) ** t_ for t_, c in enumerate(cf)); lo, hi = -0.5, 0.5
for _ in range(200):
    m = (lo + hi) / 2; lo, hi = (m, hi) if f_(lo) * f_(m) > 0 else (lo, m)
chk('prod.dca', ((1 + (lo + hi) / 2) ** 12 - 1) * 100, 0.001)
cash, inv, units, path = 1.0, False, 0, []
for t_ in range(3, 61):
    pastr = p[t_] / p[t_ - 3] - 1; val_ = units * p[t_] if inv else cash; path.append(val_)
    if t_ == 60: break
    if not inv and pastr > 0.08: inv, units = True, val_ / p[t_]
    elif inv and pastr < -0.08: inv, cash = False, val_
chk('prod.chase', path[-1] / (p[60] / p[3]), 0.0005)
fs = [f for f in FR['funds'] if f['adj'] and re.search('权益|指数', f['cat']) and f['fw'] and len(f['fw']['d']) > 1 and f['fw']['d'][-1] == '2026-06-30']
i3 = FR['months'].index('2026-03')
chk('prod.flow', sp([cp(f['r'], i3 - 12, i3) for f in fs], [f['fw']['redeem'][-1] / f['fw']['shares'][-2] for f in fs]), 0.0005)
inst = max(((f['hd']['inst'][-1], f['n']) for f in FR['funds'] if f['hd'] and f['hd'].get('inst')), key=lambda z: z[0]); chk('prod.inst', inst[1], 0)
bad = [x for x in res if not x[1]]
for k, ok, g, m in res: print(('OK  ' if ok else 'FAIL'), k, g, m)
print('通过', len(res) - len(bad), '/', len(res)); sys.exit(1 if bad else 0)
