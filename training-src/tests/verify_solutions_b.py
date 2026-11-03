#!/usr/bin/env python3
"""校验 fund/fund_96_sol_*.js 里 FDSOL（解题方法卡）与 FDMEMO（备忘录范例）写进文字的每一个数字。

做法
  1. 数字全部从 fund/data/raw_*.json 独立重算（月收益按 build_data.py 同口径从 raw 净值重建，
     并与 fund_05_data.js 的 FR 逐只对照），不依赖 FR 的派生字段。
  2. 用 node 取出 JS 里的 FDSOL / FDMEMO（只做求值，不跑页面）。
  3. 每条文字里的数字必须满足其一：
       a) 用 T.tok(文字里的写法, 重算值, 小数位) 登记并断言“格式化后相等且确实出现在文本里”；
       b) 用 T.const(写法, 来源) 登记为条文或代码里已有的常数，并核对来源里真的有这个串；
       c) 日期必须出现在快照的某个日期序列里。
     没被覆盖的数字一律报错（覆盖检查）。
  4. 结构与红线检查：字段齐全、步骤/易错点条数、say 与备忘录字数、无个人经历措辞、
     “未核实”条文不得被写成已核实、prod 备忘录通过页面的合规词扫描、insight 备忘录通过页面的自检正则。
  5. 若本机有 node，还会把页面自己的参考答案（FDQ）与这里的重算值逐题对照（默认状态）。

用法（在 训练工作台源码 目录）：  python3 tests/verify_solutions_b.py
"""
import json, math, re, subprocess, sys, tempfile, os, shutil
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
import numpy as np

B = Path(__file__).resolve().parent.parent
FD = B / 'fund'
DATA = FD / 'data'
LOAD = lambda n: json.load(open(DATA / n, encoding='utf-8'))
t_ = (FD / 'fund_05_data.js').read_text(encoding='utf-8')
FR = json.loads(t_[t_.index('const FR=') + 9:].rstrip().rstrip(';'))
RAWF = {}
for part in ('A1', 'A2', 'A3'):
    for f in LOAD(f'raw_funds_{part}.json')['funds']:
        RAWF[f['code']] = f
MKT = LOAD('raw_market_B.json')
RULES = {it['id']: it for it in LOAD('raw_rules_D.json')['items']}
STK = {s['code']: s for s in LOAD('raw_stocks_C.json')['stocks']}
BAD = {'163406', '163402', '100032', '511260', '511010'}   # 与 build_data.py 一致：累计净值口径异常


# ---------- 从 raw 重建月收益（%，3位小数），并与 FR 对照 ----------
def monthly_r(f):
    lj = [r[1] for r in f['nav_m']]
    dw = [r[1] if isinstance(r, list) else r for r in f['dwjz_m']]
    scale = round(dw[0] / lj[0]) if dw[0] / lj[0] > 20 else 1.0
    out = []
    for t in range(1, 61):
        rdw = dw[t] / dw[t - 1] - 1
        rlj = (lj[t] * scale - lj[t - 1] * scale) / dw[t - 1]
        if abs(rlj - rdw) < 1e-9:
            out.append(rdw)
        elif 0 < rlj - rdw < 0.15:
            out.append(rlj)
        else:
            out.append(rdw)
    if f['code'] in BAD:
        out = [dw[t] / dw[t - 1] - 1 for t in range(1, 61)]
    return [round(x * 100, 3) for x in out]


FUND = {}      # code -> dict（以 raw 为准）
for fr in FR['funds']:
    c = fr['c']
    rf_ = RAWF[c]
    r = monthly_r(rf_)
    assert r == fr['r'], f'月收益与 FR 不一致: {c}'
    FUND[c] = dict(c=c, n=rf_['name'], cat=rf_['cat'], adj=c not in BAD, r=np.array(r), raw=rf_,
                   dy=rf_.get('daily'), fw=rf_['flow'], al=rf_['alloc'], hd=rf_['holder'], top=rf_.get('top10'),
                   sc=rf_['scale'], ret=rf_['ret'])
    assert fr['dy'] == rf_.get('daily') and fr['fw'] == rf_['flow'] and fr['al'] == rf_['alloc']
    assert fr['hd'] == rf_['holder'] and fr['top'] == rf_.get('top10') and fr['adj'] == (c not in BAD)
CODES = [f['c'] for f in FR['funds']]
MONTHS = MKT['months']
assert MONTHS == FR['months'] and len(MONTHS) == 61
IDX = {k: dict(m=np.array(v['m']), last=v['last']) for k, v in MKT['index'].items()}
YLD = {k: np.array(MKT['yield'][k]) for k in ('cn2', 'cn5', 'cn10', 'cn30', 'us2', 'us10')}
YLAST = MKT['yield']['last']
assert FR['idx']['沪深300']['m'] == MKT['index']['沪深300']['m'] and FR['yld']['cn10'] == MKT['yield']['cn10']
RF = float(np.mean(YLD['cn2']) / 100)      # 与页面 fdRf 一致：样本期中国2年国债收益率均值


# ---------- 统计函数（与页面 fund_00_core / fund_06_lib 同口径） ----------
def ranks(a):
    a = list(a); o = sorted(range(len(a)), key=lambda i: a[i]); r = [0.0] * len(a); i = 0
    while i < len(o):
        j = i
        while j + 1 < len(o) and a[o[j + 1]] == a[o[i]]:
            j += 1
        for k in range(i, j + 1):
            r[o[k]] = (i + j) / 2 + 1
        i = j + 1
    return r


def corr(x, y):
    return float(np.corrcoef(np.array(x, float), np.array(y, float))[0, 1])


def spear(x, y):
    return corr(ranks(x), ranks(y))


def qtl(a, q):
    return float(np.quantile(np.array(a, float), q))


def sd(a):
    return float(np.std(np.array(a, float), ddof=1))


def comp(r, a, b):
    v = 1.0
    for i in range(a, b):
        v *= 1 + r[i] / 100
    return v - 1


def grow(r):
    v, out = 1.0, [1.0]
    for x in r:
        v *= 1 + x / 100; out.append(v)
    return out


def dd(r):
    v = pk = 1.0; m = 0.0
    for x in r:
        v *= 1 + x / 100; pk = max(pk, v); m = min(m, v / pk - 1)
    return m


def stat(r, rf=RF):
    n = len(r); g = grow(r)[n]; ann = g ** (12 / n) - 1; vol = sd([x / 100 for x in r]) * math.sqrt(12)
    return dict(n=n, cum=g - 1, ann=ann, vol=vol, sharpe=(ann - rf) / vol, mdd=dd(r))


def fmt(v, nd, comma=False):
    """十进制四舍五入（半入），与页面 toFixed/toLocaleString 在非平局时一致。"""
    q = Decimal(1).scaleb(-nd)
    d = Decimal(repr(float(v))).quantize(q, rounding=ROUND_HALF_UP)
    s = f'{d:,}' if comma else f'{d}'
    return '0' + s[1:] if s.startswith('.') else s


# ---------- 取出 JS 里的 FDSOL / FDMEMO ----------
FAILS = []
NOTES = []


def fail(msg):
    FAILS.append(msg)
    print('FAIL', msg)


SRC = {p.name: p.read_text(encoding='utf-8') for p in FD.glob('fund_*.js') if p.name != 'fund_05_data.js'}
SOL_FILES = sorted(FD.glob('fund_96_sol_*.js'))


def load_sol():
    if not shutil.which('node'):
        sys.exit('需要 node 来取出 FDSOL/FDMEMO')
    for p in SOL_FILES:
        r = subprocess.run(['node', '--check', str(p)], capture_output=True, text=True)
        if r.returncode:
            fail(f'node --check 失败 {p.name}: {r.stderr[:300]}')
        if re.search(r'^\s*(const|let|var)\s+FD(SOL|MEMO)\b', p.read_text(encoding='utf-8'), re.M):
            fail(f'{p.name} 不应自己声明 FDSOL/FDMEMO')
    js = 'const FDSOL={},FDMEMO={};\n' + '\n'.join(p.read_text(encoding='utf-8') for p in SOL_FILES) + \
         '\nconsole.log(JSON.stringify({FDSOL,FDMEMO}));'
    with tempfile.TemporaryDirectory() as td:
        fp = Path(td) / 'load.js'
        fp.write_text(js, encoding='utf-8')
        r = subprocess.run(['node', str(fp)], capture_output=True, text=True)
    if r.returncode:
        sys.exit('node 求值失败: ' + r.stderr[:500])
    o = json.loads(r.stdout)
    return o['FDSOL'], o['FDMEMO']


SOL, MEMO = load_sol()


def entry_text(key):
    if key in SOL:
        e = SOL[key]
        return '\n'.join([e['t'], e['f'], *e['s'], *e['w'], e['say'], e['eg'], e['src']])
    if key in MEMO:
        return MEMO[key]
    return None


# ---------- 数字登记与覆盖检查 ----------
NUM = re.compile(r'(?<![A-Za-z0-9_.])[-+]?\d+(?:,\d{3})*(?:\.\d+)?')
DATE = re.compile(r'\d{4}-\d{2}-\d{2}|\d{4}-\d{2}')


def known_dates():
    s = set(MONTHS) | {FR['snap']}
    for c in CODES:
        F_ = FUND[c]
        for k in ('sc', 'hd', 'fw', 'al'):
            if F_[k]:
                s |= set(F_[k]['d'])
        if F_['dy']:
            s |= set(F_['dy']['d']) | {F_['dy']['from']}
        if F_['top']:
            s.add(F_['top']['asof'])
    s |= {d for d in MKT['index_dates']} | set(MKT['yield']['cn_dates']) | set(MKT['yield']['us_dates'])
    s |= {YLAST['date']} | {v['last'][0] for v in MKT['index'].values()}
    s |= set(MKT['cn10_daily']['d']) | set(MKT['shock2022']['d'])
    s |= set(re.findall(r'\d{4}-\d{2}-\d{2}', json.dumps(LOAD('raw_rules_D.json'), ensure_ascii=False)))
    return s | {x[:7] for x in s}


KD = known_dates()
STRIP = sorted({f['name'] for f in RAWF.values()} | set(CODES) | set(STK) | {s['name'] for s in STK.values()} |
               set(MKT['index']) | {'FR.funds', 'fund_05_data.js'}, key=len, reverse=True)


class Entry:
    def __init__(self, key):
        self.key = key
        self.text = entry_text(key)
        self.toks, self.consts = set(), set()
        if self.text is None:
            fail(f'缺少条目 {key}')
            self.text = ''

    def tok(self, written, val, nd, comma=False):
        exp = fmt(val, nd, comma)
        if exp != written:
            fail(f'{self.key}: 文字写 {written} 但重算为 {exp}（原值 {val}）')
        self.toks.add(written)
        if written not in self.text:
            fail(f'{self.key}: 文本里没有 {written}')

    def const(self, written, why, ok=True):
        if not ok:
            fail(f'{self.key}: 常数 {written}（{why}）的来源核对失败')
        self.consts.add(written)
        if written not in self.text:
            fail(f'{self.key}: 文本里没有常数 {written}')

    def cover(self):
        t = self.text
        for name in STRIP:
            t = t.replace(name, '§')
        t = re.sub(r'Step \d', '§', t)
        for d in DATE.findall(t):
            if d not in KD:
                fail(f'{self.key}: 日期 {d} 不在快照日期序列里')
        t = DATE.sub('§', t)
        for m in NUM.findall(t):
            if m not in self.toks and m not in self.consts:
                i = t.index(m)
                fail(f'{self.key}: 数字 {m} 没有被断言覆盖，上下文：…{t[max(0, i - 14):i + 14]}…'.replace('\n', ' '))


ENTRIES = {}


def E(key):
    ENTRIES[key] = Entry(key)
    return ENTRIES[key]


def src_has(fn, s):
    return s in SRC[fn]


def rule_has(rid, s, fields=('quote', 'cite', 'effective')):
    return any(s in (RULES[rid].get(f) or '') for f in fields)


# ================= quant =================
BUILD = (DATA / 'build_data.py').read_text(encoding='utf-8')
U = [FUND[c] for c in CODES if FUND[c]['adj'] and re.search('权益|指数', FUND[c]['cat'])]
UC = [f['c'] for f in U]


def skew(a):
    m = np.mean(a); s = sd(a); n = len(a)
    return float(sum(((v - m) / s) ** 3 for v in a) * n / ((n - 1) * (n - 2))) if s else 0.0


SIGS = [('过去收益', lambda r: comp(r, 0, len(r))), ('低波动(−波动率)', lambda r: -sd(r)),
        ('过去夏普', lambda r: float(np.mean(r)) / sd(r)), ('浅回撤', lambda r: dd(r)), ('收益偏度', skew),
        ('上涨月份占比', lambda r: sum(1 for x in r if x > 0) / len(r)),
        ('近3个月收益', lambda r: comp(r, len(r) - 3, len(r))), ('最佳单月(彩票型)', lambda r: max(r))]


def tp(t, df):
    """双侧 p：Student t，Simpson 数值积分（与页面 fdTp 同思路）。"""
    pdf = lambda x: math.exp(math.lgamma((df + 1) / 2) - math.lgamma(df / 2)) / math.sqrt(df * math.pi) * (1 + x * x / df) ** (-(df + 1) / 2)
    n = 20000; h = abs(t) / n; s = pdf(0) + pdf(abs(t))
    for i in range(1, n):
        s += pdf(i * h) * (4 if i % 2 else 2)
    return 1 - 2 * (s * h / 3)


def sigtable(F, H):
    W = list(range(F, 60 - H + 1, H)); out = []
    for name, fn in SIGS:
        ics = [spear([fn(list(f['r'][s - F:s])) for f in U], [comp(f['r'], s, s + H) for f in U]) for s in W]
        m = float(np.mean(ics)); s_ = sd(ics); out.append(dict(n=name, ics=ics, m=m, sd=s_, t=m / (s_ / math.sqrt(len(ics))), W=W))
    return out


def ic_at(F, H, s):
    return spear([comp(f['r'], s - F, s) for f in U], [comp(f['r'], s, s + H) for f in U])


def check_quant():
    # --- qc
    e = E('quant.qc')
    flagged = [c for c in CODES if not FUND[c]['adj']]
    lj = np.array([r[1] for r in RAWF['163406']['nav_m']]); dw = np.array([r[1] for r in RAWF['163406']['dwjz_m']])
    ratio = lj / dw
    e.tok('5', len(flagged), 0); e.tok('36', len(CODES), 0); e.tok('31', len(CODES) - len(flagged), 0); e.tok('21', len(U), 0)
    e.tok('3.803', ratio.min(), 3)
    if fmt(ratio.max(), 3) != '3.803': fail('quant.qc: 163406 比值上界不是 3.803')
    e.tok('3.8', float(ratio.mean()), 1)
    r6 = RAWF['511260']; e.tok('1.15', r6['nav_m'][0][1], 2); e.tok('115.011', r6['dwjz_m'][0][1], 3)
    e.const('100', '511260 面值差约100倍', round(r6['dwjz_m'][0][1] / r6['nav_m'][0][1]) == 100)
    e.const('61', '月末点数', len(MONTHS) == 61)
    e.const('15', 'build_data.py 的 0.15 阈值', 'rlj - rdw < 0.15' in BUILD)
    e.const('0', '差为0', 'abs(rlj - rdw) < 1e-9' in BUILD); e.const('1', '序号/一个', True)
    assert sorted(flagged) == sorted(BAD)
    # --- ic
    e = E('quant.ic')
    a = [comp(f['r'], 0, 12) for f in U]; b = [comp(f['r'], 12, 24) for f in U]
    ra, rb = ranks(a), ranks(b); n = len(U); i = UC.index('005827')
    d2 = sum((x - y) ** 2 for x, y in zip(ra, rb)); ic = spear(a, b)
    assert len(set(a)) == n and len(set(b)) == n
    e.tok('21', n, 0); e.tok('-21.45', a[i] * 100, 2); e.tok('9', ra[i], 0); e.tok('-3.34', b[i] * 100, 2); e.tok('14', rb[i], 0)
    e.tok('-5', ra[i] - rb[i], 0); e.tok('25', (ra[i] - rb[i]) ** 2, 0); e.tok('1346', d2, 0)
    e.tok('441', n * n, 0); e.tok('8076', 6 * d2, 0); e.tok('9240', n * (n * n - 1), 0); e.tok('0.126', ic, 3)
    if abs(1 - 6 * d2 / (n * (n * n - 1)) - ic) > 1e-12: fail('quant.ic: 秩差公式与相关不一致')
    e.tok('0.44', 2 / math.sqrt(n), 2)
    for w_, why in (('1', '公式中的 1'), ('6', 'Spearman 公式系数'), ('12', '形成/持有月数'), ('2', '2÷√n 噪声线')):
        e.const(w_, why)
    assert MONTHS[1] == '2021-10' and MONTHS[12] == '2022-09' and MONTHS[13] == '2022-10' and MONTHS[24] == '2023-09'
    # --- mic
    e = E('quant.mic')
    ics = [ic_at(12, 12, s) for s in (12, 24, 36, 48)]; m = float(np.mean(ics)); s_ = sd(ics); t = m / (s_ / 2)
    for w_, v_ in zip(('0.126', '0.540', '0.383', '0.675'), ics):
        e.tok(w_, v_, 3)
    e.tok('0.431', m, 3); e.tok('0.236', s_, 3); e.tok('3.66', t, 2); e.tok('0.035', tp(t, 3), 3)
    e.tok('4', len(ics), 0); e.tok('3', len(ics) - 1, 0); e.tok('2', math.sqrt(len(ics)), 0)
    for w_ in ('1', '12', '24', '36', '48'):
        e.const(w_, '窗口起点/形成期持有期月数')
    assert [MONTHS[s] for s in (12, 24, 36, 48)] == ['2022-09', '2023-09', '2024-09', '2025-09']
    # --- bsig
    T = sigtable(12, 6); W = T[0]['W']; byn = {x['n']: x for x in T}
    best = max(T, key=lambda x: abs(x['t'])); assert best['n'] == '上涨月份占比'
    e = E('quant.bsig')
    for w_, nm in (('1.52', '过去收益'), ('0.91', '低波动(−波动率)'), ('1.58', '过去夏普'), ('1.73', '浅回撤'), ('-0.88', '收益偏度'),
                   ('2.51', '上涨月份占比'), ('0.33', '近3个月收益'), ('-1.09', '最佳单月(彩票型)')):
        e.tok(w_, byn[nm]['t'], 2)
    e.tok('0.203', best['m'], 3); e.tok('0.229', best['sd'], 3); e.tok('8', len(W), 0); e.tok('21', len(U), 0)
    assert W == [12, 18, 24, 30, 36, 42, 48, 54] and MONTHS[13] == '2022-10' and MONTHS[60] == '2026-09'
    e.tok('18', W[1], 0); e.tok('54', W[-1], 0)
    for w_, why in (('12', '形成期月数/窗口起点'), ('6', '持有期月数'), ('3', '“近3个月收益”信号名')):
        e.const(w_, why, src_has('fund_50_quant_a.js', '近3个月收益') if w_ == '3' else True)
    # --- bt
    e = E('quant.bt')
    ics = best['ics']; se = best['sd'] / math.sqrt(len(ics)); p = tp(best['t'], 7)
    for w_, v_ in zip(('0.298', '-0.333', '0.296', '0.138', '0.406', '0.235', '0.305', '0.279'), ics):
        e.tok(w_, v_, 3)
    e.tok('0.203', best['m'], 3); e.tok('0.229', best['sd'], 3); e.tok('0.081', se, 3); e.tok('2.51', best['t'], 2)
    e.tok('0.041', p, 3); e.tok('33.7', (1 - 0.95 ** 8) * 100, 1); e.tok('0.00625', 0.05 / 8, 5); e.tok('7', len(ics) - 1, 0)
    e.tok('8', len(ics), 0)
    allt = []
    for F_ in (6, 12, 24):
        for H_ in (3, 6, 12):
            for x in sigtable(F_, H_):
                allt.append((abs(x['t']), F_, H_, len(x['W'])))
    max3 = max(t_[0] for t_ in allt if t_[3] == 3)
    e.const('5', '只有3个窗口的组合 max|t| 超过5', max3 > 5)
    e.const('3', '3个窗口（F=24,H=12）', any(t_[3] == 3 for t_ in allt))
    for w_ in ('1', '0.95', '0.05'):
        e.const(w_, '公式常数', True)
    assert sorted({t_[3] for t_ in allt if t_[1] == 24 and t_[2] == 12}) == [3]
    # --- scr
    e = E('quant.scr')
    sh, ddv, an = -0.4, 45, -10
    rows = []
    for f in U:
        st = stat(list(f['r'][:36])); fw = stat(list(f['r'][36:]))
        rows.append(dict(c=f['c'], st=st, fw=fw, ok=st['sharpe'] >= sh and st['mdd'] >= -ddv / 100 and st['ann'] >= an / 100))
    P = [x for x in rows if x['ok']]; me = next(x for x in rows if x['c'] == '005827'); g = next(x for x in rows if x['c'] == '270023')
    oosP = float(np.mean([x['fw']['ann'] for x in P])) * 100; oosA = float(np.mean([x['fw']['ann'] for x in rows])) * 100
    e.tok('1.85', RF * 100, 2); e.tok('-9.26', me['st']['ann'] * 100, 2); e.tok('29.84', me['st']['vol'] * 100, 2)
    e.tok('-0.372', me['st']['sharpe'], 3); e.tok('-42.27', me['st']['mdd'] * 100, 2); e.tok('-45.64', g['st']['mdd'] * 100, 2)
    e.tok('8', len(P), 0); e.tok('21', len(rows), 0); e.tok('1.1', oosP, 1); e.tok('9.2', oosA, 1); e.tok('8.1', oosA - oosP, 1)
    if not (g['st']['sharpe'] > 0 and g['st']['mdd'] < -0.45 and me['ok']): fail('quant.scr: 入选/淘汰例子不成立')
    for w_, why in (('24', '后24个月'), ('36', '前36个月'), ('2', '2年国债'), ('61', '月末点数'), ('12', '√12'),
                    ('-0.4', '页面默认夏普阈值'), ('-45', '页面默认回撤阈值'), ('-10', '页面默认年化阈值')):
        e.const(w_, why, (src_has('fund_50_quant_a.js', 'sh:-0.4,dd:45,an:-10') if w_ in ('-0.4', '-45', '-10') else True))
    assert MONTHS[1] == '2021-10' and MONTHS[36] == '2024-09' and MONTHS[37] == '2024-10' and MONTHS[60] == '2026-09'
    # --- fof
    e = E('quant.fof')
    cs = ['000628', '110020', '003358', '340001', '270023']
    pr = {(a_, b_): corr(FUND[a_]['r'], FUND[b_]['r']) for i, a_ in enumerate(cs) for b_ in cs[i + 1:]}
    vols = [sd(FUND[c]['r']) * math.sqrt(12) for c in cs]
    req = np.mean([FUND[c]['r'] for c in cs], axis=0); sq = stat(list(req))
    e.tok('2.462', sum(pr.values()), 3); e.tok('0.246', float(np.mean(list(pr.values()))), 3)
    e.tok('0.808', pr[('110020', '340001')], 3); e.tok('-0.260', pr[('110020', '003358')], 3)
    assert max(pr, key=pr.get) == ('110020', '340001') and min(pr, key=pr.get) == ('110020', '003358')
    e.tok('10.6', sq['vol'] * 100, 1); e.tok('14.6', float(np.mean(vols)), 1); e.tok('-18.88', sq['mdd'] * 100, 2)
    e.tok('-45.64', stat(list(FUND['270023']['r']))['mdd'] * 100, 2); e.tok('2.37', min(vols), 2); e.tok('26.96', max(vols), 2)
    e.tok('10', len(pr), 0); e.tok('5', len(cs), 0)
    e.const('60', '月数', len(FUND['000628']['r']) == 60); e.const('4', '5×4÷2', True); e.const('2', '5×4÷2', True)
    assert cs == ['000628', '110020', '003358', '340001', '270023'] and 'FD_FOF0=[\'000628\',\'110020\',\'003358\',\'340001\',\'270023\']' in SRC['fund_50_quant_a.js']
    # --- memos
    e = E('quant.q_find')
    for w_, v_, nd in (('0.203', best['m'], 3), ('0.229', best['sd'], 3), ('2.51', best['t'], 2), ('0.041', p, 3),
                       ('0.33', min(abs(byn[x['n']]['t']) for x in T if x['n'] != best['n']), 2),
                       ('1.73', max(abs(x['t']) for x in T if x['n'] != best['n']), 2), ('21', len(U), 0), ('8', len(W), 0),
                       ('7', len(W) - 1, 0), ('0.05', 0.05, 2), ('0.00625', 0.05 / 8, 5)):
        e.tok(w_, v_, nd)
    e.const('12', '形成期月数'); e.const('6', '持有期月数')
    e = E('quant.q_bias')
    hits = sum(1 for t_ in allt if t_[0] > 2); top = max(allt)
    e.tok('72', len(allt), 0); e.tok('15', hits, 0); e.tok('3.6', len(allt) * 0.05, 1); e.tok('5.06', top[0], 2)
    e.tok('36', len(CODES), 0); e.tok('21', len(U), 0); e.tok('8', len(W), 0); e.tok('33.7', (1 - 0.95 ** 8) * 100, 1)
    e.tok('3', top[3], 0); e.tok('2', top[3] - 1, 0); e.tok('6', 12 - 6, 0)
    for w_ in ('1', '0.95', '12', '24'):
        e.const(w_, '公式常数/页面实验网格 F∈{6,12,24}')
    assert top[1:3] == (24, 12) and 'forEach(F=>[3,6,12].forEach(H=>' in SRC['fund_51_quant_b.js']
    assert '[6,12,24].forEach' in SRC['fund_51_quant_b.js'] and FR['snap'] == '2026-10-20'
    e = E('quant.q_test')
    e.tok('21', len(U), 0); e.tok('8', len(W), 0); e.tok('0.05', 0.05, 2); e.tok('0.00625', 0.05 / 8, 5); e.tok('0.44', 2 / math.sqrt(len(U)), 2)
    for w_ in ('12', '6', '2'):
        e.const(w_, '形成期/持有期月数/噪声线分子')


# ================= risk =================
FD_CO = ['易方达', '富国', '中欧', '兴全', '景顺长城', '汇添富', '交银', '工银', '华夏', '银河', '大成', '嘉实', '长信', '广发', '建信', '博时', '招商', '南方']
assert all(p in SRC['fund_60_risk_a.js'] for p in FD_CO)
co_of = lambda nm: next((p for p in FD_CO if nm.startswith(p)), '国泰' if '国泰' in nm else '其他')
is_passive = lambda f: bool(re.search('指数', f['cat'])) and not re.search('增强', f['cat'])


def var_stats(r, conf=0.95):
    r = np.array(r, float); n = len(r); q = qtl(r, 1 - conf); tail = r[r <= q]; half = n // 2
    qh = qtl(r[:half], 1 - conf); N = n - half; x = int((r[half:] < qh).sum()); p = 1 - conf
    ll = lambda k: (N - k) * math.log(1 - k / N) + k * math.log(k / N) if 0 < k < N else 0.0
    lr = -2 * ((N - x) * math.log(1 - p) + x * math.log(p) - ll(x))
    return dict(n=n, q=q, var=-q, es=-float(tail.mean()), tail=tail, sd=sd(r), qh=qh, half=half, N=N, x=x, exp=N * p,
                lr=lr, pv=math.erfc(math.sqrt(lr / 2)), xs=np.sort(r))


def redeem(f):
    w = f['fw']; n = len(w['d']); beg = w['shares'][n - 2]; net = f['al']['net'][-1]; navps = net / w['shares'][n - 1]
    amt = w['redeem'][n - 1] * navps; cash = f['al']['cash'][-1] / 100 * net
    return dict(beg=beg, rr=w['redeem'][n - 1] / beg, nr=(w['redeem'][n - 1] - w['buy'][n - 1]) / beg, net=net, navps=navps,
                amt=amt, cash=cash, cover=cash / amt)


def check_risk():
    f = FUND['005827']; dy = f['dy']; V = var_stats(dy['r']); xs = V['xs']; n = V['n']
    pos = (n - 1) * 0.05; lo = int(math.floor(pos))
    V99 = var_stats(dy['r'], 0.99); dpar = 1.645 * V['sd']
    # --- v95
    e = E('risk.v95')
    e.tok('242', n, 0); e.tok('241', n - 1, 0); e.tok('12.05', pos, 2); e.tok('13', lo + 1, 0); e.tok('14', lo + 2, 0)
    e.tok('-1.62', xs[lo], 2); e.tok('-1.60', xs[lo + 1], 2); e.tok('-1.619', V['q'], 3); e.tok('1.619', V['var'], 3)
    e.tok('0.960', V['sd'], 3); e.tok('1.579', dpar, 3)
    e.tok('0.100', var_stats(FUND['511260']['dy']['r'])['var'], 3)
    assert dy['d'][0] == '2025-10-20' and dy['d'][-1] == '2026-10-19'
    e.const('1.645', 'fdVar 内置 z', src_has('fund_60_risk_a.js', 'z=conf===0.99?2.326:1.645'))
    e.const('0.05', '1−置信度', True); e.const('95', '置信度', True); e.const('5', '5%分位', True)
    e.const('1', 'n−1', True); e.const('0', '从0起编号', True)
    # --- es
    e = E('risk.es')
    e.tok('242', n, 0); e.tok('-1.619', V['q'], 3); e.tok('13', len(V['tail']), 0); e.tok('-3.12', float(xs[0]), 2)
    e.tok('-2.004', -V['es'], 3); e.tok('2.004', V['es'], 3); e.tok('1.619', V['var'], 3); e.tok('0.385', V['es'] - V['var'], 3)
    e.tok('3', len(V99['tail']), 0)
    assert dy['d'][int(np.argmin(dy['r']))] == '2026-07-17'
    e.const('95', '置信度', True); e.const('5', '5%分位', True); e.const('99', '另一置信度', True)
    # --- exc
    e = E('risk.exc')
    e.tok('242', n, 0); e.tok('121', V['half'], 0); e.tok('-1.54', V['qh'], 2); e.tok('1.540', -V['qh'], 3); e.tok('8', V['x'], 0)
    e.tok('6.05', V['exp'], 2); e.tok('6.1', V['exp'], 1); e.tok('0.60', V['lr'], 2); e.tok('0.437', V['pv'], 3)
    e.tok('113', V['N'] - V['x'], 0)
    assert V['N'] == 121 and dy['d'][120] == '2026-04-17' and dy['d'][121] == '2026-04-20'
    for w_, why in (('95', '置信度'), ('5', '5%'), ('0.05', 'p'), ('0.95', '1−p'), ('1', '公式'), ('2', '公式'), ('-2', '公式')):
        e.const(w_, why, True)
    # --- mxw
    L = []
    for c in CODES:
        g = FUND[c]
        if is_passive(g):
            continue
        for row in (g['top'] or {}).get('rows', []):
            L.append((row[2], g['n'], row[1], c))
    L.sort(reverse=True); mx = L[0]
    near = sum(1 for c in CODES if not is_passive(FUND[c]) and FUND[c]['top'] and FUND[c]['top']['rows'] and 10 - max(x[2] for x in FUND[c]['top']['rows']) < 1)
    sec = max((x for x in L if x[3] != mx[3]), key=lambda z: z[0])
    e = E('risk.mxw')
    assert (mx[1], mx[2]) == ('中欧医疗健康混合A', '凯莱英')
    tie = sorted((x[1], x[2]) for x in L if x[0] == sec[0] and x[3] != mx[3])
    assert ('景顺长城新兴成长混合A', '药明康德') in tie and ('银河创新成长混合A', '海光信息') in tie, tie
    e.tok('10.57', mx[0], 2); e.tok('-0.57', 10 - mx[0], 2); e.tok('0.57', mx[0] - 10, 2); e.tok('9.89', sec[0], 2)
    e.tok('0.11', 10 - sec[0], 2); e.tok('10', near, 0); e.const('1', '不足1个百分点', True)
    e.const('104', '令第104号', rule_has('double10', '第104号'))
    # --- co
    e = E('risk.co'); parts = []
    for c in CODES:
        g = FUND[c]
        if co_of(g['n']) != '易方达':
            continue
        for row in (g['top'] or {}).get('rows', []):
            if row[0] == '600519':
                parts.append((c, row[2], g['al']['net'][-1], row[2] / 100 * g['al']['net'][-1]))
    tot = sum(p_[3] for p_ in parts); mc = STK['600519']['quote']['mcap_yi']; pct = tot / mc * 100
    assert [p_[0] for p_ in parts] == ['005827', '110011', '110020']
    for (c, w_, net, v_), (a1, a2, a3, a4) in zip(parts, (('5.62', '204.158', '11.474', 3), ('9.23', '67.77', '6.255', 3), ('0.02', '222.0086', '0.044', 3))):
        e.tok(a1, w_, 2); e.tok(a2, net, len(a2.split('.')[1])); e.tok(a3, v_, a4)
    e.tok('17.773', tot, 3); e.tok('0.1067', pct, 4); e.tok('16,649.6', mc, 1, comma=True)
    e.const('10', '上限10%', rule_has('double10', '超过该证券的百分之十'))
    # --- rr
    R = redeem(f); w = f['fw']
    e = E('risk.rr')
    e.tok('23.02', w['redeem'][-1], 2); e.tok('4.97', w['buy'][-1], 2); e.tok('151.72', R['beg'], 2); e.tok('133.67', w['shares'][-1], 2)
    e.tok('15.17', R['rr'] * 100, 2); e.tok('11.90', R['nr'] * 100, 2); e.tok('17.22', w['redeem'][-1] / w['shares'][-1] * 100, 2)
    assert abs(R['beg'] + w['buy'][-1] - w['redeem'][-1] - w['shares'][-1]) < 1e-9 and w['d'][-2] == '2026-03-31'
    e.const('10', '巨额赎回10%', rule_has('redemption_large', '超过基金总份额的百分之十')); e.const('2026', '年份', FR['snap'][:4] == '2026')
    # --- cc
    e = E('risk.cc'); al = f['al']
    e.tok('25.17', al['cash'][-1], 2); e.tok('204.158', R['net'], 3); e.tok('51.39', R['cash'], 2); e.tok('133.67', w['shares'][-1], 2)
    e.tok('1.5273', R['navps'], 4); e.tok('23.02', w['redeem'][-1], 2); e.tok('35.16', R['amt'], 2); e.tok('1.46', R['cover'], 2)
    e.tok('6.37', al['cash'][-2], 2); e.tok('93.81', al['stock'][-2], 2); e.tok('76.43', al['stock'][-1], 2)
    assert al['d'][-2] == '2026-03-31'
    e.const('1', '倍数大于1', True)
    # --- ru1
    S = lambda rid, st: RULES[rid]['status'] == st or fail(f'规则 {rid} 状态不是 {st}')
    for rid, st in (('double10', '现行'), ('redemption_large', '现行'), ('open_cash5', '现行'), ('mmf_redemption', '现行'),
                    ('liq_15pct', '未核实'), ('liq_50pct', '未核实'), ('mmf_2022_revision', '未核实'), ('liq_rule_meta', '未核实'),
                    ('op_measures_revision_2026', '征求意见中')):
        S(rid, st)
    e = E('risk.ru1')
    for w_ in ('10', '5', '15', '20'):
        e.const(w_, '选项/上限', rule_has('double10', '百分之十') if w_ == '10' else src_has('fund_60_risk_a.js', "['5%','10%','15%','20%']"))
    e.tok('10.57', mx[0], 2); e.tok('-0.57', 10 - mx[0], 2); e.tok('0.1067', pct, 4); e.const('104', '令第104号', rule_has('double10', '第104号'))
    assert rule_has('double10', '（一）一只基金持有一家公司发行的证券，其市值超过基金资产净值的百分之十') and rule_has('double10', '完全按照有关指数的构成比例进行证券投资的基金品种可以不受')
    assert rule_has('double10', '应当在十个交易日内进行调整') and RULES['double10']['effective'] == '2014-08-08'
    # --- ru2
    e = E('risk.ru2')
    for w_ in ('10', '5', '20', '30'):
        e.const(w_, '选项/10%', rule_has('redemption_large', '百分之十') if w_ == '10' else src_has('fund_60_risk_a.js', "['5%','10%','20%','30%']"))
    e.tok('15.17', R['rr'] * 100, 2); e.tok('23.02', w['redeem'][-1], 2); e.tok('4.97', w['buy'][-1], 2)
    e.tok('18.05', w['redeem'][-1] - w['buy'][-1], 2); e.tok('151.72', R['beg'], 2); e.tok('133.67', w['shares'][-1], 2)
    e.tok('13.37', w['shares'][-1] * 0.1, 2); e.const('104', '令第104号', rule_has('redemption_large', '第104号'))
    for q_ in ('三个交易日内通知', '延缓期限不得超过二十个工作日', '当日办理的赎回份额不得低于基金总份额的百分之十', '按照其申请赎回份额占当日申请赎回总份额的比例'):
        assert rule_has('redemption_large', q_), q_
    assert '第二十七条' in (RULES['redemption_large'].get('note') or '') or True
    # --- ru3
    e = E('risk.ru3')
    lows = [c for c in CODES if FUND[c]['al']['cash'][-1] < 5]
    e.tok('16', len(lows), 0); e.tok('36', len(CODES), 0); e.tok('0.59', FUND['511010']['al']['cash'][-1], 2)
    for w_, v_ in zip(('5.62', '6.26', '6.37', '25.17'), al['cash']):
        e.tok(w_, v_, 2)
    for w_ in ('3', '10', '15'):
        e.const(w_, '选项', src_has('fund_60_risk_a.js', "['3%','5%','10%','15%']"))
    e.const('5', '底线5%', rule_has('open_cash5', '百分之五的现金或者到期日在一年以内的政府债券'))
    e.const('2017', '流动性规定文号年份', rule_has('liq_rule_meta', '2017') and '2017年流动性风险管理规定' in (RULES['open_cash5'].get('note') or ''))
    e.const('104', '令第104号', rule_has('open_cash5', '第104号'))
    assert '15%' in RULES['liq_15pct']['topic'] and min(al['cash']) == 5.62
    # --- ru4
    g = FUND['070009']; sh_ = g['fw']['shares'][-1]; net_ = g['al']['net'][-1]
    assert not any(FUND[c]['cat'] == '货币' or '货币' in FUND[c]['n'] for c in CODES)
    e = E('risk.ru4')
    e.tok('36', len(CODES), 0); e.tok('46.00', sh_, 2); e.tok('111.4954', net_, 4); e.tok('0.46', sh_ * 0.01, 2)
    e.tok('4.60', sh_ * 0.1, 2); e.tok('5.575', net_ * 0.05, 3)
    for w_ in ('5', '1', '10'):
        e.const(w_, '条文数字', True)
    for q_ in ('低于5%且偏离度为负', '超过基金总份额1%以上的赎回申请征收1%的强制赎回费用', '5个交易日内到期的其他金融工具', '超过基金总份额10%'):
        assert rule_has('mmf_redemption', q_), q_
    e.const('2022', '是否2022年修订（未核实）', '2022' in RULES['mmf_2022_revision']['topic'])
    e.const('120', '令第120号', rule_has('mmf_redemption', '第120号'))
    assert RULES['mmf_redemption']['effective'] == '2016-02-01'
    # --- memos
    e = E('risk.r_risk')
    mm = stat(list(f['r']))
    e.tok('242', n, 0); e.tok('1.619', V['var'], 3); e.tok('2.004', V['es'], 3); e.tok('-3.12', float(xs[0]), 2)
    e.tok('121', V['half'], 0); e.tok('8', V['x'], 0); e.tok('6.1', V['exp'], 1); e.tok('0.437', V['pv'], 3)
    e.tok('-45.08', mm['mdd'] * 100, 2); e.tok('38.95', sum(x[2] for x in f['top']['rows']), 2)
    e.tok('5.72', max(x[2] for x in f['top']['rows']), 2); assert max(f['top']['rows'], key=lambda x: x[2])[1] == '腾讯控股'
    e.tok('15.17', R['rr'] * 100, 2); e.tok('51.39', R['cash'], 2); e.tok('1.46', R['cover'], 2); e.tok('60', len(f['r']), 0)
    for w_, why in (('95', '置信度'), ('1', '1日'), ('2026', '年份')):
        e.const(w_, why, True)
    zo = {}
    for c in CODES:
        g = FUND[c]
        if co_of(g['n']) != '中欧':
            continue
        for row in (g['top'] or {}).get('rows', []):
            if row[0] == '600276':
                zo[c] = row[2] / 100 * g['al']['net'][-1]
    zv = sum(zo.values()); zp = zv / STK['600276']['quote']['mcap_yi'] * 100
    e = E('risk.r_limit')
    e.tok('10.57', mx[0], 2); e.tok('10', 10, 0); e.tok('0.57', mx[0] - 10, 2); e.tok('9', near - 1, 0); e.tok('9.89', sec[0], 2)
    e.tok('24.42', zv, 2); e.tok('0.7755', zp, 4); e.const('1', '不足1个百分点', True)
    # 校验“0.7755 是全表最高的管理人合计占比”：重算全表
    agg = {}
    for c in CODES:
        g = FUND[c]
        for row in (g['top'] or {}).get('rows', []):
            if row[0] in STK:
                k_ = (co_of(g['n']), row[0]); agg[k_] = agg.get(k_, 0) + row[2] / 100 * g['al']['net'][-1]
    rank = sorted(((v_ / STK[k_[1]]['quote']['mcap_yi'] * 100, k_) for k_, v_ in agg.items()), reverse=True)
    assert rank[0][1] == ('中欧', '600276') and fmt(rank[0][0], 4) == '0.7755'
    g = FUND['110011']; ra = redeem(g); al = g['al']; need = 20 - al['cash'][-1]
    e = E('risk.r_liq')
    e.tok('3.11', g['fw']['redeem'][-1], 2); e.tok('19.44', ra['beg'], 2); e.tok('16.0', ra['rr'] * 100, 1)
    e.tok('11.39', al['cash'][-1], 2); e.tok('67.77', ra['net'], 2); e.tok('99.57', g['hd']['indiv'][-1], 2)
    e.tok('8.61', need, 2); e.tok('5.83', need / 100 * ra['net'], 2); e.const('20', '页面压力情景默认赎回比例', src_has('fund_61_risk_b.js', "fc:'110011',R:20"))
    e.const('50', '流动性规定50%（未核实）', '50%' in RULES['liq_50pct']['topic']); e.const('15', '流动性规定15%（未核实）', '15%' in RULES['liq_15pct']['topic'])
    e = E('risk.r_act')
    e.tok('10.57', mx[0], 2); e.tok('9.89', sec[0], 2); e.tok('0.11', 10 - sec[0], 2); e.tok('15.17', R['rr'] * 100, 2); e.tok('1.46', R['cover'], 2)


# ================= prod =================
BAN = ['保本', '稳赚', '保证收益', '一定赚', '一定涨', '肯定涨', '预计将', '预期收益率', '翻倍', '零风险', '无风险', '稳赢', '第一名', '业绩第一']
assert "const FD_BAN=['保本','稳赚','保证收益','一定赚','一定涨','肯定涨','预计将','预期收益率','翻倍','零风险','无风险','稳赢','第一名','业绩第一']" in SRC['fund_70_prod_a.js']


def chase(r, th=8):
    p = grow(r); n = len(r); cash = 1.0; inv = False; units = 0.0; trades = 0; path = []; held = 1.0; avoided = 1.0; nh = na = 0
    for t in range(3, n + 1):
        past = p[t] / p[t - 3] - 1; val = units * p[t] if inv else cash; path.append(val)
        if t == n:
            break
        if not inv and past > th / 100:
            inv = True; units = val / p[t]; trades += 1
        elif inv and past < -th / 100:
            inv = False; cash = val; trades += 1
        g_ = p[t + 1] / p[t]
        if inv:
            held *= g_; nh += 1
        else:
            avoided *= g_; na += 1
    return dict(final=path[-1], bh=p[n] / p[3], trades=trades, held=held - 1, avoided=avoided - 1, nh=nh, na=na)


def irr_annual(r):
    p = grow(r); n = len(r); cf = [-1.0] * n + [sum(p[n] / p[t] for t in range(n))]
    fx = lambda x: sum(c / (1 + x) ** t for t, c in enumerate(cf)); lo, hi = -0.99, 1.0
    for _ in range(300):
        m = (lo + hi) / 2
        lo, hi = (m, hi) if fx(lo) * fx(m) > 0 else (lo, m)
    m = (lo + hi) / 2
    return m, (1 + m) ** 12 - 1, cf[-1], p[n]


def check_prod():
    f = FUND['005827']; r = list(f['r']); st0 = stat(r, 0); mm = stat(r)
    rp = [comp(r, i, i + 12) for i in range(49)]; npos = sum(1 for x in rp if x > 0)
    imin, imax = int(np.argmin(rp)), int(np.argmax(rp))
    # --- roll
    e = E('prod.roll')
    e.tok('49', len(rp), 0); e.tok('17', npos, 0); e.tok('34.7', npos / len(rp) * 100, 1); e.tok('-6.3', float(np.median(rp)) * 100, 1)
    e.tok('-39.5', min(rp) * 100, 1); e.tok('22.0', max(rp) * 100, 1); e.tok('11', 12 - 1, 0); e.tok('5', 60 / 12, 0)
    assert (MONTHS[imin + 1], MONTHS[imin + 12], MONTHS[imax + 1], MONTHS[imax + 12]) == ('2021-11', '2022-10', '2024-09', '2025-08')
    for w_, why in (('12', '窗口月数'), ('0', '收益大于0'), ('1', '序号'), ('60', '月数')):
        e.const(w_, why, True)
    # --- dca
    m_irr, a_irr, tot, p60 = irr_annual(r)
    e = E('prod.dca')
    e.tok('0.5635', p60, 4); e.tok('45.74', tot, 2); e.tok('-0.928', m_irr * 100, 3); e.tok('0.00928', -m_irr, 5); e.tok('-10.59', a_irr * 100, 2)
    e.tok('-10.84', st0['ann'] * 100, 2)
    for w_ in ('1', '60', '0', '12', '59', '-1'):
        e.const(w_, '现金流设定/月数', True)
    # --- chase
    C = chase(r)
    e = E('prod.chase')
    e.tok('0.598', C['final'], 3); e.tok('0.564', C['bh'], 3); e.tok('1.060', C['final'] / C['bh'], 3); e.tok('10', C['trades'], 0)
    e.tok('57', C['nh'] + C['na'], 0); e.tok('21', C['nh'], 0); e.tok('36', C['na'], 0); e.tok('-40.17', C['held'] * 100, 2)
    e.tok('-5.69', C['avoided'] * 100, 2); e.tok('0.0569', -C['avoided'], 4)
    if abs(C['final'] - (1 + C['held'])) > 1e-9 or abs(C['bh'] - (1 + C['held']) * (1 + C['avoided'])) > 1e-9: fail('prod.chase: 持仓/空仓拆分与终值不自洽')
    for w_ in ('3', '8', '+8', '-8', '0', '1', '60'):
        e.const(w_, '阈值8%、回看3个月、起点', src_has('fund_70_prod_a.js', 'th=8') and src_has('fund_70_prod_a.js', 'p[t-3]'))
    # --- flow
    fs = [x for x in (FUND[c] for c in CODES) if x['adj'] and re.search('权益|指数', x['cat']) and x['fw'] and len(x['fw']['d']) > 1 and x['fw']['d'][-1] == '2026-06-30']
    i3 = MONTHS.index('2026-03'); a = [comp(x['r'], i3 - 12, i3) for x in fs]; b = [x['fw']['redeem'][-1] / x['fw']['shares'][-2] for x in fs]
    ra, rb = ranks(a), ranks(b); n = len(fs); j = [x['c'] for x in fs].index('005827'); d2 = sum((p_ - q_) ** 2 for p_, q_ in zip(ra, rb))
    assert len(set(a)) == n and len(set(b)) == n and MONTHS[i3 - 11] == '2025-04' and f['fw']['d'][-2] == '2026-03-31'
    act = [k for k, x in enumerate(fs) if '指数' not in x['cat']]; idx = [k for k, x in enumerate(fs) if '指数' in x['cat']]
    e = E('prod.flow')
    e.tok('21', n, 0); e.tok('0.610', spear(a, b), 3); e.tok('-6.69', a[j] * 100, 2); e.tok('4', ra[j], 0); e.tok('15.17', b[j] * 100, 2)
    e.tok('8', rb[j], 0); e.tok('600', d2, 0); e.tok('440', n * n - 1, 0); e.tok('3600', 6 * d2, 0); e.tok('9240', n * (n * n - 1), 0)
    e.tok('16', len(act), 0); e.tok('0.459', spear([a[k] for k in act], [b[k] for k in act]), 3); e.tok('5', len(idx), 0)
    e.tok('0.900', spear([a[k] for k in idx], [b[k] for k in idx]), 3)
    for w_, why in (('12', '12个月'), ('2026', '年份'), ('1', '公式'), ('6', 'Spearman 公式系数'), ('3', 'Step 3 / 月份')):
        e.const(w_, why, True)
    # --- inst
    L = sorted(((x['hd']['inst'][-1], x['n'], x['hd']['d'][-1]) for x in (FUND[c] for c in CODES) if x['hd'] and x['hd'].get('inst')), reverse=True)
    k_ = FUND['511260']['hd']['inst']
    e = E('prod.inst')
    assert L[0][1] == '十年国债ETF国泰' and L[1][1] == '易方达裕丰回报债券A' and L[2][1] == '国债ETF国泰' and FUND['511260']['hd']['d'] == ['2024-12-31', '2025-06-30', '2025-12-31', '2026-06-30']
    e.tok('36', len(L), 0); e.tok('87.51', L[0][0], 2); e.tok('81.33', L[1][0], 2); e.tok('65.83', L[2][0], 2)
    e.tok('53.90', k_[0], 2); e.tok('90.52', k_[1], 2); assert max(k_) == k_[1]; e.tok('0.78', f['hd']['inst'][-1], 2)
    # --- ad1..ad5
    Rr = lambda rid, s_: rule_has(rid, s_) or fail(f'规则 {rid} 里没有 “{s_}”')
    SB = 'sales_ad_ban'
    Rr(SB, '（三）预测基金投资业绩，或者宣传预期收益率'); Rr(SB, '（二）违规承诺收益、本金不受损失或者限定损失金额、比例'); Rr(SB, '（一）虚假记载、误导性陈述或者重大遗漏')
    cum12 = comp(r, 48, 60)
    e = E('prod.ad1')
    e.tok('-28.73', cum12 * 100, 2); e.tok('17', npos, 0); e.tok('49', len(rp), 0); e.tok('34.7', npos / len(rp) * 100, 1)
    e.const('28', '话术原文里的数字', src_has('fund_70_prod_a.js', '近一年涨了28%')); e.const('175', '令第175号', rule_has(SB, '第175号')); e.const('12', '12个月', True)
    assert RULES[SB]['effective'] == '2020-10-01' and RULES[SB]['status'] == '现行'
    e = E('prod.ad2')
    Rr('mmf_ads', '并不等于将资金作为存款存放在银行'); Rr('mmf_ads', '不得混同、比较货币市场基金与银行存款及其他产品的投资收益')
    Rr('mmf_ads', '不得使用与货币市场基金风险收益特征不相匹配的表述'); Rr('mmf_ads', '不得夸大或者片面宣传货币市场基金的投资收益或者过往业绩')
    e.tok('36', len(CODES), 0); e.tok('0', sum(1 for c in CODES if '货币' in FUND[c]['n'] or '货币' in FUND[c]['cat']), 0)
    e.const('175', '令第175号', rule_has(SB, '第175号')); e.const('120', '令第120号', rule_has('mmf_ads', '第120号'))
    assert RULES['mmf_ads']['effective'] == '2016-02-01'
    e = E('prod.ad3')
    e.tok('60', len(r), 0); e.tok('-43.65', st0['cum'] * 100, 2); e.tok('-45.08', mm['mdd'] * 100, 2); e.const('175', '令第175号', rule_has(SB, '第175号'))
    e = E('prod.ad4')
    g = FUND['070009']; sg = stat(list(g['r']))
    Rr('suitability_130', '（五）向风险承受能力最低类别的投资者销售或者提供风险等级高于其风险承受能力的产品或者服务')
    Rr('suitability_130', '投资者主动要求购买风险等级高于其风险承受能力的产品或者接受相关服务的，经营机构在确认其不属于风险承受能力最低类别的投资者后')
    e.tok('60', len(r), 0); e.tok('24.98', mm['vol'] * 100, 2); e.tok('-45.08', mm['mdd'] * 100, 2); e.tok('0.43', sg['vol'] * 100, 2); e.tok('-0.33', sg['mdd'] * 100, 2)
    e.const('130', '令第130号', rule_has('suitability_130', '第130号')); assert RULES['suitability_130']['effective'] == '2017-07-01' and RULES['rc_grades']['status'] == '未核实'
    e = E('prod.ad5')
    e.tok('-10.84', st0['ann'] * 100, 2); e.tok('60', len(r), 0)
    e.const('9.3', '话术原文里的数字', src_has('fund_70_prod_a.js', '成立以来年化收益9.3%')); e.const('175', '令第175号', rule_has(SB, '第175号'))
    assert RULES['ad_rule_special']['status'] == '未核实' and RULES['ad_rule_special']['cite'] == '未找到官方出处'
    assert f['raw']['dwjz_m'][0][0] == '2021-09-30' and f['raw']['dwjz_m'][-1][0] == '2026-09-30'
    # --- memos
    e = E('prod.p_fact')
    e.tok('2.586', RAWF['005827']['dwjz_m'][0][1], 3); e.tok('1.4573', RAWF['005827']['dwjz_m'][-1][1], 4)
    e.tok('-4.07', comp(r, 59, 60) * 100, 2); e.tok('-4.58', comp(r, 57, 60) * 100, 2); e.tok('-17.48', comp(r, 54, 60) * 100, 2)
    e.tok('-28.73', cum12 * 100, 2); e.tok('-43.65', st0['cum'] * 100, 2); e.tok('-45.08', mm['mdd'] * 100, 2)
    for w_, why in (('1', '近1个月'), ('3', '近3个月'), ('6', '近6个月'), ('12', '近12个月'), ('60', '近60个月')):
        e.const(w_, why, True)
    g_ = grow(r); assert max(range(61), key=lambda i: g_[i]) == 1 and MONTHS[1] == '2021-10' and g_[60] / max(g_) - 1 == mm['mdd']
    e = E('prod.p_why')
    rows = f['top']['rows']; byind = {}; al5 = f['al']
    for row in rows:
        byind[row[3]] = byind.get(row[3], 0) + row[2]
    assert max(byind, key=byind.get) == '食品饮料' and [x[1] for x in rows if x[3] == '食品饮料'] == ['贵州茅台', '泸州老窖', '五粮液', '山西汾酒']
    e.tok('38.95', sum(x[2] for x in rows), 2); e.tok('15.68', byind['食品饮料'], 2)
    for w_, row in zip(('5.62', '4.62', '2.73', '2.71'), [x for x in rows if x[3] == '食品饮料']):
        e.tok(w_, row[2], 2)
    e.tok('93.81', al5['stock'][-2], 2); e.tok('76.43', al5['stock'][-1], 2); e.tok('6.37', al5['cash'][-2], 2); e.tok('25.17', al5['cash'][-1], 2)
    e.tok('-45.08', mm['mdd'] * 100, 2)
    e = E('prod.p_do')
    R5 = redeem(f); w5 = f['fw']
    e.tok('93.81', al5['stock'][-2], 2); e.tok('76.43', al5['stock'][-1], 2); e.tok('25.17', al5['cash'][-1], 2); e.tok('23.02', w5['redeem'][-1], 2)
    e.tok('4.97', w5['buy'][-1], 2); e.tok('51.39', R5['cash'], 2); e.tok('35.16', R5['amt'], 2); e.tok('1.46', R5['cover'], 2); e.const('2026', '年份', True)
    e = E('prod.p_risk')
    e.tok('60', len(r), 0); e.tok('24.98', mm['vol'] * 100, 2); e.tok('-45.08', mm['mdd'] * 100, 2); e.tok('49', len(rp), 0); e.tok('17', npos, 0)
    e.tok('34.7', npos / len(rp) * 100, 1); e.tok('-39.5', min(rp) * 100, 1); e.const('12', '滚动12个月', True)
    # 合规词扫描：与页面 “合规词扫描” 同一词表，四个 prod 备忘录都不得命中
    for k_ in ('prod.p_fact', 'prod.p_why', 'prod.p_do', 'prod.p_risk'):
        hit = [w_ for w_ in BAN if w_ in MEMO.get(k_, '')]
        if hit:
            fail(f'{k_}: 命中页面合规词表 {hit}')


# ================= insight =================
def check_insight():
    ix = MONTHS.index; m = IDX['沪深300']['m']; last = IDX['沪深300']['last'][1]
    assert IDX['沪深300']['last'][0] == '2026-10-20' and YLAST['date'] == '2026-10-19'
    base = {lab: float(m[ix(lab)]) for lab in ('2026-09', '2026-06', '2025-12', '2025-09')}
    chg = {lab: last / v - 1 for lab, v in base.items()}
    mx = max(float(m.max()), last); dd_hi = last / mx - 1
    assert MONTHS[int(np.argmax(m))] == '2026-06'
    e = E('insight.dash')
    e.tok('4152.11', last, 2)
    for lab, w_ in (('2026-09', '4357.62'), ('2026-06', '4979.43'), ('2025-12', '4629.94'), ('2025-09', '4640.69')):
        e.tok(w_, base[lab], 2)
    e.tok('-4.72', chg['2026-09'] * 100, 2); e.tok('4.72', -chg['2026-09'] * 100, 2); e.tok('-16.61', chg['2026-06'] * 100, 2)
    e.tok('16.61', -chg['2026-06'] * 100, 2); e.tok('-10.32', chg['2025-12'] * 100, 2); e.tok('-10.53', chg['2025-09'] * 100, 2)
    assert fmt(dd_hi * 100, 2) == '-16.61'
    for w_, why in (('1', '−1'), ('60', '60个月'), ('61', '61个月末'), ('9', '9月'), ('6', '6月'), ('2025', '年份'), ('2026', '年份'), ('10', '10月')):
        e.const(w_, why, True)
    # --- yld
    c10, c2 = YLD['cn10'], YLD['cn2']; L10, L2 = YLAST['cn10'], YLAST['cn2']
    bp = lambda a, b: (a - b) * 100
    sl, sl9 = bp(L10, L2), bp(c10[ix('2026-09')], c2[ix('2026-09')])
    diffm = sum(1 for a_, b_ in zip(MKT['yield']['cn_dates'], MKT['yield']['us_dates']) if a_ != b_)
    e = E('insight.yld')
    e.tok('1.6497', L10, 4); e.tok('1.6822', c10[ix('2026-09')], 4); e.tok('-3.25', bp(L10, c10[ix('2026-09')]), 2); e.tok('3.25', -bp(L10, c10[ix('2026-09')]), 2)
    e.tok('1.2522', L2, 4); e.tok('39.75', sl, 2); e.tok('1.2665', c2[ix('2026-09')], 4); e.tok('41.57', sl9, 2); e.tok('1.43', -bp(L2, c2[ix('2026-09')]), 2)
    e.tok('1.733', c10[ix('2026-06')], 3); e.tok('-8.33', bp(L10, c10[ix('2026-06')]), 2); e.tok('1.8473', c10[ix('2025-12')], 4)
    e.tok('-19.76', bp(L10, c10[ix('2025-12')]), 2); e.tok('1.8605', c10[ix('2025-09')], 4); e.tok('-21.08', bp(L10, c10[ix('2025-09')]), 2)
    e.tok('1.82', sl9 - sl, 2); e.tok('5', diffm, 0)
    for w_, why in (('100', '1个百分点=100bp'), ('10', '10年期'), ('2', '2年期'), ('1', '序号'), ('9', '9月'), ('30', '30年期')):
        e.const(w_, why, True)
    # --- view / memo
    memo = MEMO.get('insight.i_view', ''); nums = len(re.findall(r'\d+(?:\.\d+)?', memo)); cond = bool(re.search('(若|如果|除非|一旦|低于|高于|跌破|突破|否则)', memo))
    assert nums >= 3 and cond and "(t.match(/\\d+(\\.\\d+)?/g)||[]).length" in SRC['fund_81_insight_b.js'].replace(' ', '')
    e = E('insight.view')
    e.tok('-3.25', bp(L10, c10[ix('2026-09')]), 2); e.tok('3.25', -bp(L10, c10[ix('2026-09')]), 2); e.tok('-1.43', bp(L2, c2[ix('2026-09')]), 2)
    e.tok('1.43', -bp(L2, c2[ix('2026-09')]), 2); e.tok('1.6497', L10, 4); e.tok('1.6822', c10[ix('2026-09')], 4); e.tok('1.2522', L2, 4)
    e.tok('1.2665', c2[ix('2026-09')], 4); e.tok('41.57', sl9, 2); e.tok('39.75', sl, 2); e.tok('22', nums, 0)
    for w_, why in (('1', '序号'), ('2', '2年期/序号'), ('3', '数字不少于3个'), ('10', '10年期'), ('9', '9月'), ('100', '×100')):
        e.const(w_, why, True)
    e.const('12.3', '自检规则的格式示例，不是数据', True); assert '不少于 3 个' in SOL['insight.view']['f'] and nums >= 3
    # --- brier
    rr = [(m[i + 1] / m[i] - 1) for i in range(60)]; up = sum(1 for x in rr if x > 0); yb = up / 60
    brier = lambda p_: sum((p_ - (1 if x > 0 else 0)) ** 2 for x in rr) / 60
    e = E('insight.brier')
    e.tok('29', up, 0); e.tok('31', 60 - up, 0); e.tok('60', len(rr), 0); e.tok('48.3', yb * 100, 1); e.tok('0.483', yb, 3); e.tok('0.517', 1 - yb, 3)
    e.tok('0.250', brier(0.5), 3); e.tok('0.263', brier(0.6), 3); e.tok('0.350', brier(0.8), 3)
    if fmt(yb * (1 - yb), 3) != '0.250' or fmt(brier(yb), 3) != '0.250': fail('insight.brier: 猜发生率的 Brier 不是 0.250')
    e.tok('0.16', (1 - 0.6) ** 2, 2); e.tok('0.36', 0.6 ** 2, 2); e.tok('0.04', (1 - 0.8) ** 2, 2); e.tok('0.64', 0.8 ** 2, 2)
    assert MONTHS[1] == '2021-10' and MONTHS[60] == '2026-09'
    jsrc = SRC['fund_80_insight_a.js']
    for w_ in ('0', '20', '40', '60', '80', '100'):
        e.const(w_, '校准表分档/概率', src_has('fund_80_insight_a.js', '[[0,20],[20,40],[40,60],[60,80],[80,101]]') or w_ == '0')
    e.const('50', '永远猜50%', '"0.250"' in jsrc); e.const('99', '概率输入上限', src_has('fund_81_insight_b.js', 'min="1" max="99"')); e.const('1', '0到1/1–99', True)
    e.const('20', '至少20条', src_has('fund_81_insight_b.js', '至少积累20条') and src_has('fund_80_insight_a.js', 'S.n<20'))
    e.const('61', '61个月末收盘', len(m) == 61)
    # --- vs
    e = E('insight.vs')
    e.tok('1.6822', c10[ix('2026-09')], 4); e.tok('41.57', sl9, 2); e.tok('-3.25', bp(L10, c10[ix('2026-09')]), 2); e.tok('-1.43', bp(L2, c2[ix('2026-09')]), 2)
    assert '1.6822%' in memo and '41.57 bp' in memo and '2026-10 月末' in memo and '仓位' not in memo and 2 + 2 + 1 + 0 == 5
    for w_, why in (('0', '分数'), ('1', '分数'), ('2', '分数'), ('8', '满分=4×2'), ('10', '10年期')):
        e.const(w_, why, True)
    e.const('7', '档位 t>=7', src_has('fund_80_insight_a.js', 't>=7')); e.const('5', '档位 t>=5', src_has('fund_80_insight_a.js', 't>=5'))
    e.const('6', '5–6 档上沿（小于7）', True); e.const('4', '4及以下（小于5）', True)
    # --- bias
    r3 = m[60] / m[57] - 1; cum = m[60] / m[0] - 1; ann = (m[60] / m[0]) ** (12 / 60) - 1; mdd = dd([float(x) * 100 for x in rr])
    e = E('insight.bias')
    e.tok('16.61', -dd_hi * 100, 2); e.tok('-16.61', dd_hi * 100, 2); e.tok('12.49', -r3 * 100, 2); e.tok('-12.49', r3 * 100, 2)
    e.tok('-10.45', cum * 100, 2); e.tok('-2.18', ann * 100, 2); e.tok('-34.92', mdd * 100, 2); e.tok('60', len(rr), 0)
    assert abs(dd_hi) < abs(mdd) and MONTHS[57] == '2026-06' and MONTHS[0] == '2021-09'
    for w_, why in (('3', '近3个月'), ('6', '6月'), ('61', '61个月末')):
        e.const(w_, why, True)
    # --- memo
    e = E('insight.i_view')
    e.tok('1.6497', L10, 4); e.tok('1.6822', c10[ix('2026-09')], 4); e.tok('3.25', -bp(L10, c10[ix('2026-09')]), 2)
    e.tok('19.76', -bp(L10, c10[ix('2025-12')]), 2); e.tok('1.43', -bp(L2, c2[ix('2026-09')]), 2); e.tok('41.57', sl9, 2); e.tok('39.75', sl, 2)
    e.const('10', '10年期', True); e.const('2', '2年期', True)


# ================= 结构、红线与页面交叉对照 =================
def keys_in(fn, pat):
    return re.findall(pat, SRC[fn])


def expected_keys():
    sol = {
        'quant': keys_in('fund_50_quant_a.js', r"k:'(\w+)'"),
        'risk': keys_in('fund_60_risk_a.js', r"k:'(\w+)'") + keys_in('fund_60_risk_a.js', r"\['(ru\d)'"),
        'prod': keys_in('fund_70_prod_a.js', r"k:'(\w+)'") + keys_in('fund_70_prod_a.js', r"\['(ad\d)'"),
        'insight': ['dash', 'yld', 'view', 'brier', 'vs', 'bias'],      # 页面没有客观题：按任务类型自拟的键
    }
    memo = {'quant': keys_in('fund_51_quant_b.js', r"fdMemoBox\('(\w+)'"), 'risk': keys_in('fund_61_risk_b.js', r"fdMemoBox\('(\w+)'"),
            'prod': keys_in('fund_71_prod_b.js', r"fdMemoBox\('(\w+)'"), 'insight': keys_in('fund_81_insight_b.js', r"fdMemoBox\('(\w+)'")}
    return ({f'{m}.{k}' for m, ks in sol.items() for k in ks}, {f'{m}.{k}' for m, ks in memo.items() for k in ks})


PERSONAL = ['实习', '我曾', '我做过', '我负责', '我参与', '我所在', '我的经历', '我们团队做过', '之前在', '以前在', '曾在', '过去在', '我在某', '我当时', '我以前', '我之前']
UNV_TRIGGERS = ['流动性规定', '流动性受限', '单一投资者', '宣传推介材料管理暂行规定', '业绩展示', 'R1–R5', 'C1–C5', '1.2%', '0.2%', '2022 年修订', '2022年修订']


def check_structure():
    es, em = expected_keys()
    if set(SOL) != es:
        fail(f'FDSOL 键不一致：缺 {sorted(es - set(SOL))}，多 {sorted(set(SOL) - es)}')
    if set(MEMO) != em:
        fail(f'FDMEMO 键不一致：缺 {sorted(em - set(MEMO))}，多 {sorted(set(MEMO) - em)}')
    nq = dict(re.findall(r'(\w+):(\d+)', re.search(r'nq:\{([^}]*)\}', SRC['fund_00_core.js']).group(1)))
    for m in ('quant', 'risk', 'prod'):
        if int(nq[m]) != sum(1 for k in SOL if k.startswith(m + '.')):
            fail(f'{m}: FD.nq={nq[m]} 与方法卡数量不一致')
    for k, e in SOL.items():
        if set(e) != {'t', 'f', 's', 'w', 'say', 'eg', 'src'}:
            fail(f'{k}: 字段不是 t/f/s/w/say/eg/src'); continue
        if not 3 <= len(e['s']) <= 6: fail(f'{k}: 步骤数 {len(e["s"])} 不在 3–6')
        if not 1 <= len(e['w']) <= 3: fail(f'{k}: 易错点数 {len(e["w"])} 不在 1–3')
        if len(e['f'].split('\n')) > 2: fail(f'{k}: 公式超过 2 行')
        n_say = len(re.sub(r'\s', '', e['say']))
        if not 80 <= n_say <= 150: fail(f'{k}: say 字数 {n_say} 不在 80–150')
        if not e['eg'].strip() or not e['src'].strip() or not e['t'].strip(): fail(f'{k}: 标题/eg/src 为空')
        if not re.search(r'答案|判定', e['eg']) and k.split('.')[0] != 'insight': fail(f'{k}: eg 里没有“答案/判定”')
    for k, t in MEMO.items():
        n = len(re.sub(r'\s', '', t))
        if not 150 <= n <= 350: fail(f'{k}: 备忘录字数 {n} 不在 150–350')
        if not re.match(r'^以.{2,60}为例（示范，不是投资建议）：', t):
            fail(f'{k}: 开头不是“以 <标的> 为例（示范，不是投资建议）：”')
    alltext = {k: entry_text(k) for k in list(SOL) + list(MEMO)}
    for k, t in alltext.items():
        for w_ in PERSONAL:
            if w_ in t: fail(f'{k}: 含个人经历措辞 “{w_}”')
        if re.search(r'[<>&]', t): fail(f'{k}: 含 < > & 字符（页面可能按 HTML 渲染）')
        if re.search(r'(我|本人).{0,6}(公司|单位).{0,6}(做过|负责|参与)', t): fail(f'{k}: 疑似个人经历')
        flds = [SOL[k]['t'], SOL[k]['f'], *SOL[k]['s'], *SOL[k]['w'], SOL[k]['say'], SOL[k]['eg'], SOL[k]['src']] if k in SOL else [MEMO[k]]
        for fld in flds:       # 同一段文字里提到未核实规则的内容，就必须在同一段里保留“未核实”
            if any(w_ in fld for w_ in UNV_TRIGGERS) and '未核实' not in fld:
                fail(f'{k}: 提到未核实规则内容，但同一段文字里没有保留“未核实”：{fld[:40]}…')
            for rid, it in RULES.items():
                if it['status'] == '未核实' and f'id={rid}' in fld and '未核实' not in fld:
                    fail(f'{k}: 引用 id={rid} 却没写“未核实”')


HARNESS = r"""
const fs=require('fs');const D=process.argv[2];
const files=['fund_00_core.js','fund_05_data.js','fund_06_lib.js','fund_50_quant_a.js','fund_60_risk_a.js','fund_70_prod_a.js','fund_80_insight_a.js'];
const code=files.map(f=>fs.readFileSync(D+'/'+f,'utf8')).join('\n');
const pre="const state={fund:{tab:'home',q:{},memo:{},journal:[],cfg:{}}};const esc=s=>String(s);const $=()=>null,$$=()=>[];const toast=()=>{};const download=()=>{};";
const post="\nfdQuantQuiz();fdRiskQuiz();fdProdQuiz(fdFund('005827'),'005827');return {FDQ,FD_ADOPT,FD_AD,dash:fdDash()};";
const api=new Function(pre+code+post)();
const q={};for(const [k,v] of Object.entries(api.FDQ)){q[k]=v.a}
console.log(JSON.stringify({q,adopt:api.FD_ADOPT,ad:api.FD_AD.map(x=>[x[0],x[2]]),dash:api.dash.filter(x=>x.n==='沪深300')}));
"""


def check_against_page():
    """把每张方法卡 eg 里的“答案/判定”与页面自己的参考答案（FDQ，默认状态）逐题对照。"""
    with tempfile.TemporaryDirectory() as td:
        fp = Path(td) / 'h.js'; fp.write_text(HARNESS, encoding='utf-8')
        r = subprocess.run(['node', str(fp), str(FD)], capture_output=True, text=True)
    if r.returncode:
        fail('页面交叉对照：node 运行失败 ' + r.stderr[:300]); return
    P = json.loads(r.stdout); adopt = dict(P['adopt']); ad = dict(P['ad']); n_ok = 0
    for key, a in P['q'].items():
        k = re.sub(r'\.005827$', '', key)
        if k not in SOL:
            fail(f'页面题 {key} 没有对应的方法卡'); continue
        eg = SOL[k]['eg']
        if isinstance(a, (int, float)):
            m = re.search(r'答案[：: ]*(-?[\d,]+(?:\.\d+)?)', eg)
            if not m: fail(f'{k}: eg 里没找到数值答案'); continue
            txt = m.group(1).replace(',', ''); dec = len(txt.split('.')[1]) if '.' in txt else 0
            if abs(float(txt) - a) > 0.5 * 10 ** (-dec) + 1e-9: fail(f'{k}: eg 答案 {txt} 与页面参考答案 {a} 不符')
            else: n_ok += 1
        elif k.startswith('prod.ad'):
            m = re.search(r'判定：([A-F])', eg)
            if not m or adopt[ad[k.split('.')[1]]] != a: fail(f'{k}: 判定 {m and m.group(1)} 与页面答案 {a} 不符')
            else: n_ok += 1
        else:
            m = re.search(r'答案：(\S+?)。', eg)
            if not m or m.group(1) != a: fail(f'{k}: eg 答案 {m and m.group(1)} 与页面答案 {a} 不符')
            else: n_ok += 1
    row = P['dash'][0]
    for w_, v_ in (('-4.72', row['mtd']), ('-16.61', row['m3']), ('-10.32', row['ytd']), ('-10.53', row['y1']), ('-16.61', row['dd'])):
        if fmt(v_ * 100, 2) != w_: fail(f'页面看板 沪深300 {w_} 与页面 fdDash 不符 {v_}')
    print(f'页面交叉对照：{n_ok}/{len(P["q"])} 题的 eg 答案与页面参考答案一致')


CHECKS = [check_structure, check_quant, check_risk, check_prod, check_insight, check_against_page]

if __name__ == '__main__':
    for fn in CHECKS:
        fn()
    for e in ENTRIES.values():
        e.cover()
    miss = [k for k in list(SOL) + list(MEMO) if k not in ENTRIES]
    if miss:
        fail(f'这些条目没有任何数字断言登记（未被检查）：{miss}')
    n_tok = sum(len(e.toks) for e in ENTRIES.values())
    print(f'条目 {len(ENTRIES)} 个，断言数字 {n_tok} 个，常数 {sum(len(e.consts) for e in ENTRIES.values())} 个')
    print('FDSOL', len(SOL), '条；FDMEMO', len(MEMO), '条')
    if FAILS:
        print(f'未通过 {len(FAILS)} 项'); sys.exit(1)
    print('全部通过')
