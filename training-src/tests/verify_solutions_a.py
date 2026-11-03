#!/usr/bin/env python3
"""独立复算：验证 fund_95_sol_*.js 里的解题方法卡（FDSOL）与备忘录范例（FDMEMO）。

做三件事：
 1. 从 fund/data/raw_*.json 重建数据（与 build_data.py 同口径），并与 fund_05_data.js 里的 FR 逐项比对；
 2. 用 numpy 独立重算文字里出现的每一个数字，按「标签+数字」的片段逐条断言；
    文字里未被任何片段覆盖、又不在白名单（年份、小整数、页面常量）里的数字一律报错；
 3. 用 node 执行页面真实函数（fdValQuiz / fdAttrQuiz / fdFiQuiz），核对页面答案、容差、题型键和 fdMemoBox 键。
用法（在 训练工作台源码 目录，需要 node 与 numpy）：python3 tests/verify_solutions_a.py
"""
import json, math, os, re, subprocess, sys, datetime
from pathlib import Path
import numpy as np

B = Path(__file__).resolve().parent.parent
FUND, D = B / 'fund', B / 'fund' / 'data'
NODE = os.environ.get('NODE', 'node')
FAILS, NPASS = [], [0]


def ok(cond, msg):
    if cond: NPASS[0] += 1
    else: FAILS.append(msg)


def n(x, d=2):
    """格式化：ASCII 负号，不出现 -0.00"""
    s = f'{x:.{d}f}'
    return s[1:] if re.fullmatch(r'-0\.0*', s) else s


def sg(x, d=2):
    return ('+' if x > 0 else '') + n(x, d)


L = lambda f: json.load(open(D / f, encoding='utf-8'))

# ---------------------------------------------------------------- 1. raw -> 数据
MK, ST = L('raw_market_B.json'), {s['code']: s for s in L('raw_stocks_C.json')['stocks']}
RULES = {it['id']: it for it in L('raw_rules_D.json')['items']}
BAD = {'163406', '163402', '100032', '511260', '511010'}  # 与 build_data.py 一致
RF, RAWFILE = {}, {}
for part in ('A1', 'A2', 'A3'):
    for f in L(f'raw_funds_{part}.json')['funds']:
        lj = [r[1] for r in f['nav_m']]
        dw = [r[1] if isinstance(r, list) else r for r in f['dwjz_m']]
        scale = round(dw[0] / lj[0]) if dw[0] / lj[0] > 20 else 1.0
        r = []
        for t in range(1, 61):
            rdw = dw[t] / dw[t - 1] - 1
            rlj = (lj[t] * scale - lj[t - 1] * scale) / dw[t - 1]
            if abs(rlj - rdw) < 1e-9: r.append(rdw)
            elif 0 < rlj - rdw < 0.15: r.append(rlj)
            else: r.append(rdw)
        if f['code'] in BAD: r = [dw[t] / dw[t - 1] - 1 for t in range(1, 61)]
        f['r'] = [round(x * 100, 3) for x in r]
        f['adj'] = f['code'] not in BAD
        RF[f['code']], RAWFILE[f['code']] = f, f'raw_funds_{part}.json'
MONTHS, Y = MK['months'], MK['yield']
IDX = lambda k: np.array([(MK['index'][k]['m'][i + 1] / MK['index'][k]['m'][i] - 1) * 100 for i in range(60)])


def ols(y, X):
    y = np.asarray(y, float); A = np.column_stack([np.ones(len(y))] + [np.asarray(c, float) for c in X])
    b = np.linalg.lstsq(A, y, rcond=None)[0]; res = y - A @ b; k = A.shape[1]
    se = np.sqrt(np.diag(res @ res / (len(y) - k) * np.linalg.inv(A.T @ A)))
    return dict(b=b, t=b / se, r2=1 - (res @ res) / ((y - y.mean()) ** 2).sum(), n=len(y))


grow = lambda r: float(np.prod(1 + np.asarray(r) / 100))
ann = lambda r: grow(r) ** (12 / len(r)) - 1
yr_ret = lambda r, y: float(np.prod([1 + r[i] / 100 for i in range(60) if MONTHS[i + 1].startswith(str(y))])) - 1

# ---------------------------------------------------------------- FR（页面实际使用的快照）与 raw 对账
t = (FUND / 'fund_05_data.js').read_text(encoding='utf-8')
FR = json.loads(t[t.index('const FR=') + 9:].rstrip().rstrip(';'))
ok(FR['snap'] == MK['snapshot'] == '2026-10-20', 'FR.snap 与 raw 快照日期不一致')
ok(FR['months'] == MONTHS, 'FR.months != raw months')
ok(len(FR['funds']) == len(RF) == 36, '基金数量不是 36')
for f in FR['funds']:
    ok(f['r'] == RF[f['c']]['r'], f'FR 基金 {f["c"]} 月度收益与 raw 重建不一致')
for k in MK['index']: ok(FR['idx'][k]['m'] == MK['index'][k]['m'], f'FR.idx {k} 与 raw 不一致')
for k in ('cn2', 'cn5', 'cn10', 'cn30', 'us2', 'us10'): ok(FR['yld'][k] == Y[k], f'FR.yld {k} 与 raw 不一致')
ok(FR['cn10d'] == MK['cn10_daily'] and FR['shock'] == MK['shock2022'], 'FR.cn10d/shock 与 raw 不一致')
for s in FR['stocks']:
    raw = ST[s['c']]; ok(s['q'] == raw['quote'], f'{s["c"]} 行情与 raw 不一致')
    for a in s['a']:
        ra = next(x for x in raw['annual'] if x['y'] == a['y'])
        ok(all(a[k] == ra.get(k) for k in a), f'{s["c"]} {a["y"]} 年报与 raw 不一致')

# ---------------------------------------------------------------- node 工具
PAGE_FILES = ['fund_00_core.js', 'fund_05_data.js', 'fund_06_lib.js', 'fund_20_val_a.js', 'fund_21_val_b.js',
              'fund_30_attr_a.js', 'fund_31_attr_b.js', 'fund_40_fi_a.js', 'fund_41_fi_b.js']
HARNESS = r"""
const fs=require('fs');const dir=process.env.FUND_DIR;const files=JSON.parse(process.env.PAGE_FILES);
let src=files.map(f=>fs.readFileSync(dir+'/'+f,'utf8')).join('\n');
src='(function(){var state={fund:{tab:"home",q:{},memo:{},journal:[],cfg:{}}};function esc(s){return String(s)}function toast(){};var $=()=>null,$$=()=>[];var window={};\n'+src+'\nreturn {ev:(c)=>eval(c)};})()';
process.stdout.write(JSON.stringify(eval(src).ev(process.argv[1])));
"""
LOADER = r"""
const fs=require('fs'),path=require('path');const dir=process.env.FUND_DIR;const FDSOL={},FDMEMO={};
for(const f of fs.readdirSync(dir).filter(f=>/^fund_95_sol_.*\.js$/.test(f)).sort())new Function('FDSOL','FDMEMO',fs.readFileSync(path.join(dir,f),'utf8'))(FDSOL,FDMEMO);
process.stdout.write(JSON.stringify({FDSOL,FDMEMO}));
"""


def node(code, *args):
    env = dict(os.environ, FUND_DIR=str(FUND), PAGE_FILES=json.dumps(PAGE_FILES))
    p = subprocess.run([NODE, '-e', code, *args], capture_output=True, text=True, env=env)
    if p.returncode: raise SystemExit('node 执行失败：' + p.stderr[-600:])
    return json.loads(p.stdout)


def page(expr): return node(HARNESS, expr)


SOLFILES = sorted(FUND.glob('fund_95_sol_*.js'))
ok(len(SOLFILES) >= 3, '缺少 fund_95_sol_*.js')
for p in SOLFILES:
    ok(subprocess.run([NODE, '--check', str(p)], capture_output=True).returncode == 0, f'{p.name} 语法检查失败')
    src = p.read_text(encoding='utf-8')
    ok(not re.search(r'\b(const|let|var)\s+(FDSOL|FDMEMO)\b', src), f'{p.name} 自行声明了 FDSOL/FDMEMO')
    ok('Object.assign(FDSOL' in src and 'Object.assign(FDMEMO' in src, f'{p.name} 缺少 Object.assign 合并')
LOADED = node(LOADER)
SOL, MEMO = LOADED['FDSOL'], LOADED['FDMEMO']
# ---------------------------------------------------------------- 2. 题型键 / 备忘录键：源码 grep 与页面实跑双重核对
MODS = {'val': ('fund_20_val_a.js', 'fund_21_val_b.js', 'fdCfg\\(\'val\',\\{co:\'600519\''),
        'attr': ('fund_30_attr_a.js', 'fund_31_attr_b.js', 'fdCfg\\(\'attr\',\\{c:\'005827\',bm:\'沪深300\',win:60\\}'),
        'fi': ('fund_40_fi_a.js', 'fund_41_fi_b.js', 'fdCfg\\(\'fi\',\\{c:\'003358\',ym:60\\}')}
EXP_SOL, EXP_MEMO = set(), set()
PAGE = page(r"""(()=>{const err=[];
 for(const s of FR.stocks){try{fdValQuiz(s,'t'+s.c)}catch(e){err.push('val '+s.c+e)}}
 for(const f of FR.funds){try{fdAttrQuiz({c:f.c,bm:fdDefBm(f),win:60},'t'+f.c)}catch(e){err.push('attr '+f.c+e)}}
 for(const f of FR.funds.filter(x=>/债/.test(x.cat))){try{fdFiQuiz({c:f.c,ym:60},'t'+f.c)}catch(e){err.push('fi '+f.c+e)}}
 const g={val:new Set(),attr:new Set(),fi:new Set()};for(const key of Object.keys(FDQ)){const [m,k]=key.split('.');g[m].add(k)}
 for(const k of Object.keys(FDQ))delete FDQ[k];
 fdValQuiz(fdSt('600519'),'d');fdAttrQuiz({c:'005827',bm:'沪深300',win:60},'d');fdFiQuiz({c:'003358',ym:60},'d');
 const d={};for(const [k,v] of Object.entries(FDQ))d[k.replace(/\.d$/,'')]={a:v.a,tol:v.tol===undefined?null:v.tol,type:v.type||'num'};
 return {err,keys:{val:[...g.val],attr:[...g.attr],fi:[...g.fi]},nq:FD.nq,dflt:d}})()""")
ok(not PAGE['err'], f'页面函数执行报错：{PAGE["err"][:3]}')
for m, (qa, qb, dflt) in MODS.items():
    sa, sb = (FUND / qa).read_text(encoding='utf-8'), (FUND / qb).read_text(encoding='utf-8')
    ks, mks = set(re.findall(r"k:'(\w+)'", sa)), re.findall(r"fdMemoBox\('(\w+)'", sb)
    ok(re.search(dflt, sb), f'{m} 默认配置与本脚本假设不一致')
    ok(ks == set(PAGE['keys'][m]), f'{m} 源码 grep 的题型键 {sorted(ks)} 与页面实跑 {sorted(PAGE["keys"][m])} 不一致')
    ok(len(ks) == PAGE['nq'][m], f'{m} FD.nq={PAGE["nq"][m]} 与题型数 {len(ks)} 不一致')
    EXP_SOL |= {f'{m}.{k}' for k in ks}; EXP_MEMO |= {f'{m}.{k}' for k in mks}
ok(set(SOL) == EXP_SOL, f'FDSOL 键不全：缺 {sorted(EXP_SOL - set(SOL))}，多 {sorted(set(SOL) - EXP_SOL)}')
ok(set(MEMO) == EXP_MEMO, f'FDMEMO 键不全：缺 {sorted(EXP_MEMO - set(MEMO))}，多 {sorted(set(MEMO) - EXP_MEMO)}')
PQ = PAGE['dflt']  # 默认选中标的下页面的参考答案与容差

# ---------------------------------------------------------------- 3. 结构、长度、个人经历红线
NAME = {'val': '贵州茅台', 'attr': '易方达蓝筹精选混合', 'fi': '易方达中债7-10年期国开行债券指数A'}
CJK = lambda s: len(re.findall(r'[一-鿿]', s))
WORDLIKE = lambda s: CJK(s) + len(re.findall(r'[，。；：、？！（）「」『』《》…]', s)) + len(re.findall(r'[A-Za-z0-9][A-Za-z0-9.,%+\-−]*', s))
PERSONAL = re.compile(r'实习|我在|我曾|我做过|我负责|我参与|曾任|任职|上一份|之前的工作|工作经历|项目经历|我们团队|我之前|去年我')
for key, c in SOL.items():
    m = key.split('.')[0]
    ok(set(c) == {'t', 'f', 's', 'w', 'say', 'eg', 'src'}, f'{key} 字段不是 t/f/s/w/say/eg/src')
    ok(all(isinstance(c.get(k), str) and c[k].strip() for k in ('t', 'f', 'say', 'eg', 'src')), f'{key} 有空字段')
    ok(isinstance(c['s'], list) and 3 <= len(c['s']) <= 6 and all(isinstance(x, str) and x for x in c['s']), f'{key} 步骤数不在 3–6')
    ok(isinstance(c['w'], list) and 1 <= len(c['w']) <= 3 and all(isinstance(x, str) and x for x in c['w']), f'{key} 易错点数不在 1–3')
    ok(80 <= len(c['say']) <= 150 and CJK(c['say']) >= 80, f'{key} say 长度 {len(c["say"])}（汉字 {CJK(c["say"])}）不在 80–150')
    ok(not re.search(r'\d', c['say']), f'{key} say 含阿拉伯数字')
    need = {'fi.slope': '2026-09', 'fi.dd': '511260', 'val.scr': '候选池'}.get(key, NAME[m])
    ok(need in c['eg'], f'{key} eg 缺少默认标的/关键字 {need}')
    ok('2026-10-20' in c['src'], f'{key} src 没有写快照日期')
    ok(len(c['eg']) >= 120, f'{key} eg 太短，没有完整演算')
for key, v in MEMO.items():
    m = key.split('.')[0]
    head = f'以 {NAME[m]} 为例（示范，不是投资建议）：'
    ok(v.startswith(head), f'{key} 开头不是「{head}」')
    ok(150 <= len(v) <= 350 and WORDLIKE(v) >= 150, f'{key} 字数 len={len(v)} 汉字={CJK(v)} 计词={WORDLIKE(v)}，应在 150–350')
for key, text in [(k + ':' + f, x) for k, c in SOL.items() for f, x in c.items() if isinstance(x, str)] + \
        [(k + ':' + f + str(i), y) for k, c in SOL.items() for f, x in c.items() if isinstance(x, list) for i, y in enumerate(x)] + \
        [(k, v) for k, v in MEMO.items()]:
    ok(not PERSONAL.search(text), f'{key} 含个人经历类表述：{PERSONAL.search(text) and PERSONAL.search(text).group()}')
    ok(not re.search(r'[\U0001F300-\U0001FAFF]', text), f'{key} 含 emoji')
# ---------------------------------------------------------------- 4. 数字覆盖引擎
FRTXT = (FUND / 'fund_05_data.js').read_text(encoding='utf-8')
SRCTXT = {f: (FUND / f).read_text(encoding='utf-8') for f in PAGE_FILES}
PCONST = {'9': ('fund_20_val_a.js', r'fdImplG\(s,0\.09,0\.025\)'), '2.5': ('fund_20_val_a.js', r'fdImplG\(s,0\.09,0\.025\)'),
          '0.8': ('fund_20_val_a.js', r'cv<0\.8'), '0.3': ('fund_40_fi_a.js', r'm\.r2<0\.3')}  # 页面代码里写死的常量
for k_, (fn_, pat_) in PCONST.items(): ok(re.search(pat_, SRCTXT[fn_]), f'页面常量 {k_} 在 {fn_} 里找不到')
YEARS = {str(y) for y in range(2015, 2028)}
SMALL = {str(i) for i in range(0, 13)} | {'30', '60', '100', '-100'}  # 结构性小整数：月数、年数、步骤号、×100 换算
OKDATES = set(re.findall(r'\d{4}-\d{2}(?:-\d{2})?', FRTXT)) | {d[:7] for d in re.findall(r'\d{4}-\d{2}-\d{2}', FRTXT)}
CITES = [it['cite'] for it in RULES.values()]
NAMES = sorted({f['name'] for f in RF.values()} | {s['name'] for s in ST.values()} | set(MK['index']), key=len, reverse=True)  # 名称里带数字的先剔除
DATE_RE = r'\d{4}-\d{2}(?:-\d{2})?'


def numtok(text):
    x = text
    for c in CITES: x = x.replace(c, ' ')
    for nm in NAMES: x = x.replace(nm, ' ')
    x = re.sub(r'(?<!\d)\d{6}(?!\d)', ' ', x)           # 基金/股票代码
    dates = re.findall(DATE_RE, x); x = re.sub(DATE_RE, ' ', x)
    toks = [('-' if sg_ in ('-', '−') else '') + num.replace(',', '')
            for sg_, num in re.findall(r'(?<![A-Za-z0-9_.)）%])([+\-−]?)(\d[\d,]*(?:\.\d+)?)', x)]
    return toks, dates


def check(key, text, snips=(), allow=()):
    """snips：由复算数值格式化出来的「标签+数字」片段，必须原样出现在文字里；
    片段之外剩下的数字必须是年份、结构性小整数、页面常量或 allow 里声明的示范假设。"""
    rest = text
    for s_ in snips:
        ok(s_ in text, f'{key} 找不到由复算数字生成的片段：「{s_}」')
        rest = rest.replace(s_, '§')
    toks, dates = numtok(rest)
    for tk in toks:
        ok(tk in YEARS or tk in SMALL or tk in PCONST or tk in allow, f'{key} 出现未被复算覆盖的数字 {tk}（上下文：{text[max(0, text.find(tk) - 12):text.find(tk) + 14]}）')
    for d_ in dates: ok(d_ in OKDATES, f'{key} 出现快照里没有的日期 {d_}')
    if '证监' in text: ok(any(c in text for c in CITES), f'{key} 引用规则但不是 raw_rules_D 的原文 cite')


SP = {}


def sp(target, *snips, allow=()):
    ok(target not in SP, f'重复登记 {target}'); SP[target] = (snips, allow)


T = lambda k: str(PQ[k]['tol'])                                  # 页面容差
pg = lambda k, v: ok(abs(PQ[k]['a'] - v) <= 1e-6 * max(1, abs(v)), f'页面 {k} 答案 {PQ[k]["a"]} != python 复算 {v}')
raw = repr                                                         # 原始字段的最短写法（5.8、10.0383）

# ---------------------------------------------------------------- 5. val：贵州茅台（600519）
S5, LJ, ZH = ST['600519'], ST['601012'], ST['600036']
A = {x['y']: x for x in S5['annual']}; AL = {x['y']: x for x in LJ['annual']}; AZ = {x['y']: x for x in ZH['annual']}
Q, H1, P, snap = S5['quote'], S5['h1_2026'], S5['quote']['price'], MK['snapshot']
np20, np25 = A[2020]['np_yi'], A[2025]['np_yi']
ratio = np25 / np20; root = ratio ** 0.2; cagr5 = (root - 1) * 100
cagr3 = ((np25 / A[2022]['np_yi']) ** (1 / 3) - 1) * 100
yoy25 = A[2025]['np_yoy']
ok(abs(yoy25 - (np25 / A[2024]['np_yi'] - 1) * 100) < 0.01, '茅台 2025 净利同比字段与净利润重算不符')
ok(abs(A[2025]['rev_yoy'] - (A[2025]['rev_yi'] / A[2024]['rev_yi'] - 1) * 100) < 0.05, '茅台 2025 营收同比字段与重算不符')
pg('val.cagr', cagr5)
rr = {y: A[y]['cfps'] / A[y]['eps'] for y in (2023, 2024, 2025)}; avg3 = float(np.mean(list(rr.values())))
sumr = sum(A[y]['cfps'] for y in rr) / sum(A[y]['eps'] for y in rr)
pg('val.conv', avg3)
dupv = lambda x: (x['nm'], x['toa'], 1 / (1 - x['debt'] / 100))
d20, d25 = dupv(A[2020]), dupv(A[2025])
ln = [math.log(b_ / a_) * 100 for a_, b_ in zip(d20, d25)]
ok(PQ['val.dup']['a'] == '总资产周转率' and int(np.argmax(np.abs(ln))) == 1, 'val.dup 最大变动因子不是总资产周转率')
est = lambda d: d[0] * d[1] * d[2]
eps25, h1eps = A[2025]['eps'], H1['eps']
pe_s, pe_ann = P / eps25, P / (2 * h1eps)
pg('val.pe', pe_s)
ok(abs(pe_ann - Q['pe']) < 0.05, '中报年化 PE 与接口动态 PE 差距超过 0.05')
nmatch = sum(1 for s_ in ST.values() if s_['h1_2026']['eps'] and round(s_['quote']['price'] / (2 * s_['h1_2026']['eps']), 2) == s_['quote']['pe'])


def dcf(e0, g, r=.09, tg=.025):
    v, e = 0.0, e0
    for k_ in range(1, 11): e *= 1 + g; v += e / (1 + r) ** k_
    return v + e * (1 + tg) / (r - tg) / (1 + r) ** 10


def impl(price, e0, r=.09, tg=.025):
    lo, hi = -.5, .8
    for _ in range(200):
        m_ = (lo + hi) / 2; lo, hi = (m_, hi) if dcf(e0, m_, r, tg) < price else (lo, m_)
    return (lo + hi) / 2


g0, g8, g10 = (impl(P, eps25, r_) * 100 for r_ in (.09, .08, .10))
pg('val.impl', g0)
ok(abs(dcf(eps25, g0 / 100) - P) < 0.005, '隐含增速代回模型后不等于现价')
V0, Vb = dcf(eps25, 0.0), dcf(eps25, 0.1201); EV = .3 * V0 + .5 * P + .2 * Vb
fin_ = lambda s_: bool(re.search('银行|保险|证券', s_['industry']))
by_year = lambda s_: {x['y']: x for x in s_['annual']}
pool = sorted((by_year(s_)[2025]['cfps'] / by_year(s_)[2025]['eps'], s_['name']) for s_ in ST.values()
              if not fin_(s_) and by_year(s_)[2025]['eps'] > 0)
nfin = sum(fin_(s_) for s_ in ST.values()); nloss = sum(1 for s_ in ST.values() if not fin_(s_) and by_year(s_)[2025]['eps'] <= 0)
ok(pool[0][1] == '山西汾酒' == PQ['val.scr']['a'] and pool[1][1] == '贵州茅台', 'val.scr 排序与页面答案不符')
AF = {x['y']: x for x in ST['600809']['annual']}
ALT = page(r"""(()=>{const o={};const g=(c,k)=>{for(const x of Object.keys(FDQ))delete FDQ[x];fdValQuiz(fdSt(c),'z');return FDQ['val.'+k+'.z']};
 o.cagr=g('601012','cagr').a;o.conv=g('600036','conv').a;o.dup=g('601012','dup').a;o.pe=g('601012','pe').a;o.impl=g('601012','impl').a;
 for(const x of Object.keys(FDQ))delete FDQ[x];fdAttrQuiz({c:'003358',bm:'国债指数',win:60},'z');o.cr=FDQ['attr.cr.z'].a;
 o.flags=fdFlags(fdSt('600519')).length;return o})()""")
bps_c = ((AZ[2025]['bps'] / AZ[2020]['bps']) ** .2 - 1) * 100
roe_d = AL[2025]['roe'] - AL[2020]['roe']
ok(abs(ALT['cagr'] - roe_d) < 1e-9 and abs(ALT['conv'] - bps_c) < 1e-9 and ALT['cr'] == 0 and ALT['flags'] == 0, '备用题型答案与页面不一致')
ok(ALT['dup'] == '先确认数据口径与亏损原因，再拆' and ALT['impl'] == '不能，需换成收入或现金流路径等其他方法', '备用题型选项与页面不一致')
ok(ALT['pe'] == '亏损，PE不能用来比便宜，应改看收入/资产/现金流', 'val.pe 备用题选项与页面不一致')
# ---- val：片段登记（左边是文字里的标签，右边的数字全部来自上面的复算）
AM = by_year(ST['000333'])
ok(pool[2][1] == '美的集团' and round(cagr5, 2) == 12.01, 'val.scr 第三名或 12.01 取整与假设不符')
ok(A[2025]['roe'] < A[2024]['roe'] and A[2024]['roe'] > A[2023]['roe'], '茅台 ROE 连降年数与备忘录不符')
sp('val.cagr:eg', f"2020 年归母净利 {n(np20)} 亿元，2025 年 {n(np25)} 亿元", f"{n(np25)}÷{n(np20)}={n(ratio, 4)} 倍",
   f"{n(ratio, 4)} 开 5 次方={n(root, 4)}", f"{n(root, 4)}−1={n(cagr5)}%", f"页面答案 {n(cagr5)}%，容差 ±{T('val.cagr')}",
   f"2025 年为 {n(yoy25)}%", f"2025 年归母净利为 {n(AL[2025]['np_yi'])} 亿元",
   f"2025 年 {n(AL[2025]['roe'])}%，2020 年 {n(AL[2020]['roe'])}%，相差 {n(roe_d)} 个百分点")
sp('val.conv:eg', *[f"{y} 年 {raw(A[y]['cfps'])}÷{raw(A[y]['eps'])}={n(rr[y], 4)}" for y in (2023, 2024, 2025)],
   f"三者平均=({n(rr[2023], 4)}+{n(rr[2024], 4)}+{n(rr[2025], 4)})÷3={n(avg3, 4)}，即 {n(avg3)} 倍（页面容差 ±{T('val.conv')}）",
   f"2025 年单年 {n(rr[2025])} 低于 0.8",
   f"2020 年 {raw(AZ[2020]['bps'])} 元，2025 年 {raw(AZ[2025]['bps'])} 元，({raw(AZ[2025]['bps'])}÷{raw(AZ[2020]['bps'])})^(1/5)−1={n(bps_c)}%")
sp('val.conv:w', f"本例两种算法分别得 {n(avg3, 4)} 和 {n(sumr, 4)}")
sp('val.dup:eg', f"2020 年净利率 {n(d20[0])}%、周转率 {n(d20[1], 3)}、负债率 {n(A[2020]['debt'])}%，权益乘数=1÷(1−{n(A[2020]['debt'] / 100, 4)})={n(d20[2], 4)}",
   f"2025 年净利率 {n(d25[0])}%、周转率 {n(d25[1], 3)}、负债率 {n(A[2025]['debt'])}%，权益乘数={n(d25[2], 4)}",
   f"净利率 {n(ln[0], 1)}%，周转率 {sg(ln[1], 1)}%，权益乘数 {n(ln[2], 1)}%", f"总资产周转率（{sg(ln[1], 1)}%）",
   f"2020 年 {n(est(d20))}、2025 年 {n(est(d25))}，报告加权ROE 为 {n(A[2020]['roe'])}、{n(A[2025]['roe'])}",
   f"2025 年净利率 {n(AL[2025]['nm'])}%（2020 年 {n(AL[2020]['nm'])}%）", f"「{ALT['dup']}」")
sp('val.pe:eg', f"现价 {n(P)} 元，2025 年基本EPS {n(eps25)} 元，静态PE={n(P)}÷{n(eps25)}={n(pe_s)} 倍（页面容差 ±{T('val.pe')}）",
   f"接口动态PE 为 {n(Q['pe'])}", f"{n(P)}÷({n(h1eps)}×2)={n(pe_ann)}", f"{len(ST)} 家里有 {nmatch} 家",
   f"2025 年基本EPS {n(AL[2025]['eps'])} 元，现价 {n(LJ['quote']['price'])} 元，动态PE {n(LJ['quote']['pe'])}", f"「{ALT['pe']}」")
sp('val.impl:eg', f"EPS₀={n(eps25)} 元，现价 {n(P)} 元", f"解出 g={n(g0, 4)}%",
   f"合计 {n(dcf(eps25, g0 / 100))} 元，与现价一致，故隐含增速 {n(g0)}%（页面容差 ±{T('val.impl')}）",
   f"近 5 年净利 CAGR {n(cagr5)}%，隐含值低 {n(cagr5 - g0)} 个百分点", f"r 取 10% 时隐含增速为 {n(g10)}%，取 8% 时为 {n(g8)}%",
   f"EPS 为 {n(AL[2025]['eps'])} 元", f"「{ALT['impl']}」")
sp('val.impl:w', f"隐含增速从 {n(g0)}% 升到 {n(g10)}%")
sp('val.scr:eg', f"候选池 {len(pool)} 家（{len(ST)} 家里剔除 {nfin} 家金融和 {nloss} 家亏损）",
   f"山西汾酒 {raw(AF[2025]['cfps'])}÷{raw(AF[2025]['eps'])}={n(pool[0][0])}", f"贵州茅台 {raw(A[2025]['cfps'])}÷{raw(A[2025]['eps'])}={n(pool[1][0])}",
   f"美的集团 {raw(AM[2025]['cfps'])}÷{raw(AM[2025]['eps'])}={n(pool[2][0])}", f"只差 {n(pool[1][0] - pool[0][0])}")
sp('val.scr:w', f"池子是 {len(pool)} 家，不是 {len(ST)} 家")
sp('memo:val.thesis', f"2025 年归母净利 {n(np25)} 亿元，同比 {n(yoy25)}%", f"2026 年上半年 {n(H1['np_yi'])} 亿元，同比 {n(H1['np_yoy'])}%",
   f"收窄 {n(H1['np_yoy'] - yoy25)} 个百分点", f"营收同比 {sg(H1['rev_yoy'], 1)}%")
sp('memo:val.consensus', f"现价 {n(P)} 元（{snap}），静态PE {n(pe_s)} 倍，动态PE {n(Q['pe'])} 倍", f"盈利年增速 {n(g0)}%",
   f"折现率取 8% 时为 {n(g8)}%，取 10% 时为 {n(g10)}%", f"近 3 年净利 CAGR 为 {n(cagr3)}%，近 5 年为 {n(cagr5)}%",
   f"近 5 年 CAGR 的 {n(g0 / cagr5 * 100, 1)}%")
sp('memo:val.variant', f"只要求约 {n(g0)}% 的盈利增速",
   f"毛利率 {n(A[2025]['gm'])}%（2024 年 {n(A[2024]['gm'])}%）、净利率 {n(A[2025]['nm'])}%（2024 年 {n(A[2024]['nm'])}%），"
   f"分别只下降 {n(A[2024]['gm'] - A[2025]['gm'])} 和 {n(A[2024]['nm'] - A[2025]['nm'])} 个百分点",
   f"营收同比 {n(A[2025]['rev_yoy'], 1)}%，净利同比 {n(yoy25)}%", f"不低于 2025 年的 {n(A[2025]['roe'])}%")
sp('memo:val.evidence', f"归母净利 2020 年 {n(np20)} 亿元，2025 年 {n(np25)} 亿元，5 年 CAGR 为 {n(cagr5)}%",
   f"分别为 {n(rr[2023])}、{n(rr[2024])}、{n(rr[2025])}，三年均值 {n(avg3)}",
   f"2025 年毛利率 {n(A[2025]['gm'])}%，加权ROE {n(A[2025]['roe'])}%，资产负债率 {n(A[2025]['debt'])}%")
sp('memo:val.scen', f"EPS {n(eps25)} 元", f"熊 30%：盈利 10 年零增长，模型价值 {n(V0)} 元，较现价 {n(V0 / P * 100 - 100, 1)}%",
   f"基准 50%：增速取价格隐含的 {n(g0)}%，价值等于现价 {n(P)} 元",
   f"牛 20%：增速取近 5 年 CAGR {n(cagr5)}%，价值 {n(Vb)} 元，较现价 {sg(Vb / P * 100 - 100, 1)}%",
   f"概率加权 {n(EV)} 元，较现价 {sg(EV / P * 100 - 100, 1)}%")
sp('memo:val.risk', f"（2025 年 {n(yoy25)}%，2026 年上半年 {n(H1['np_yoy'])}%）", f"（现为 {n(avg3)}，2025 年单年已是 {n(rr[2025])}）",
   f"2023 年 {n(A[2023]['roe'])}%，2024 年 {n(A[2024]['roe'])}%，2025 年 {n(A[2025]['roe'])}%，目前只下降 1 年")
sp('val.scr:src', f"FR.stocks {len(ST)} 家公司")

# ---------------------------------------------------------------- 6a. attr：易方达蓝筹精选混合（005827），基准沪深300，60 个月
f5 = RF['005827']; r5 = np.array(f5['r']); b5 = IDX('沪深300')
cum5, ann5, bcum, bann = grow(r5) - 1, ann(r5), grow(b5) - 1, ann(b5)
ob = ols(r5, [b5]); beta, alpha_m, r2b = ob['b'][1], ob['b'][0], ob['r2']; alpha_a = alpha_m * 12
te = float(np.std(r5 - b5, ddof=1)) * math.sqrt(12) / 100; ex_ann = ann5 - bann; ir = ex_ann / te
dnm, upm = b5 < 0, b5 > 0
n_dn, n_up = int(dnm.sum()), int(upm.sum())
fd_dn, bd_dn, fd_up, bd_up = r5[dnm].mean(), b5[dnm].mean(), r5[upm].mean(), b5[upm].mean()
cap_dn, cap_up = fd_dn / bd_dn, fd_up / bd_up
X5 = [IDX(k) for k in ('沪深300', '中证1000', '创业板指', '国债指数')]
st5 = ols(r5, X5); corr_hc = float(np.corrcoef(X5[0], X5[2])[0, 1])
top = f5['top10']['rows']; cr = sum(x[2] for x in top); al5 = f5['alloc']
ind = {}
for x in top: ind[x[3]] = ind.get(x[3], 0) + x[2]
hk = [x for x in top if len(x[0]) == 5]
rf = float(np.mean(Y['cn2'])) / 100; vol = float(np.std(r5 / 100, ddof=1)) * math.sqrt(12); sharpe = (ann5 - rf) / vol
v_, pk_, pki, mdd, tr_ = 1.0, 1.0, 0, 0.0, 0
for i_, x in enumerate(r5):
    v_ *= 1 + x / 100
    if v_ > pk_: pk_, pki = v_, i_ + 1
    if v_ / pk_ - 1 < mdd: mdd, tr_, pk_i = v_ / pk_ - 1, i_ + 1, pki
ex_y = {y: (yr_ret(r5, y) - yr_ret(b5, y)) * 100 for y in (2022, 2023, 2024, 2025, 2026)}
nmon = {y: sum(1 for m_ in MONTHS[1:] if m_.startswith(str(y))) for y in (2021, 2024, 2026)}
c36f, c36b = grow(r5[-36:]) - 1, grow(b5[-36:]) - 1
for k_, v2 in (('attr.ann', ann5 * 100), ('attr.beta', beta), ('attr.ir', ir), ('attr.dn', cap_dn), ('attr.sty', st5['b'][1]),
               ('attr.cr', cr), ('attr.yr', ex_y[2024])): pg(k_, v2)
ok(nmon == {2021: 3, 2024: 12, 2026: 9}, f'各年月份数 {nmon}')
ok(all(ex_y[y] < 0 for y in (2023, 2024, 2025, 2026)) and ex_y[2022] > 0, '分年度超额符号与文字不符')
ok((tr_, pk_i) == (60, 1) and MONTHS[tr_] == '2026-09' and MONTHS[pk_i] == '2021-10', '最大回撤峰谷位置与备忘录不符')
ok({x[1] for x in top if x[3] == '食品饮料'} == {'贵州茅台', '泸州老窖', '五粮液', '山西汾酒'}, '食品饮料持仓名单与文字不符')
ok([x[1] for x in hk] == ['腾讯控股', '百胜中国', '中国海洋石油', '中芯国际', '阿里巴巴-W'], '港股持仓名单与文字不符')
ndown, days = sum(1 for x in top if x[4] < 0), (datetime.date(2026, 10, 20) - datetime.date(2026, 6, 30)).days
ok(f5['top10']['asof'] == al5['d'][3] == '2026-06-30' and al5['d'][2] == '2026-03-31', '报告期日期与文字不符')
ok('三年以上产品业绩低于业绩比较基准超过10个百分点' in RULES['manager_pay']['quote'], 'manager_pay 条文原文与引用不符')
ok(RAWFILE['005827'] == 'raw_funds_A1.json' and RAWFILE['003358'] == RAWFILE['511260'] == 'raw_funds_A3.json', 'src 里写的 raw 文件名与基金所在文件不符')
ok([m['name'] for m in f5['mgr']] == ['张坤', '杨思亮', '何一铖'], '现任经理名单与文字不符')
# ---- attr 片段
sp('attr.ann:eg', f"累计 {n(cum5 * 100)}%，即期末净值是期初的 {n(1 + cum5, 4)} 倍", f"年化={n(1 + cum5, 4)}^(12/60)−1={n(ann5 * 100)}%（页面容差 ±{T('attr.ann')}）",
   f"累计 {n(bcum * 100)}%，年化 {n(bann * 100)}%")
sp('attr.beta:eg', f"β={n(beta, 3)}（页面容差 ±{T('attr.beta')}），月度 α={n(alpha_m, 3)}%，R²={n(r2b)}", f"年化 Alpha=月度 α×12={n(alpha_a)}%", f"放大 {n(beta)} 倍")
sp('attr.ir:eg', f"基金年化 {n(ann5 * 100)}%，基准年化 {n(bann * 100)}%，年化超额 {n(ex_ann * 100)}%", f"得跟踪误差 {n(te * 100)}%",
   f"IR={n(ex_ann * 100)}÷{n(te * 100)}={n(ir)}（页面容差 ±{T('attr.ir')}）", f"对应约 {n(abs(ir))} 个单位的负超额")
sp('attr.dn:eg', f"基准下跌 {n_dn} 个月，基金平均 {n(fd_dn)}%，基准平均 {n(bd_dn)}%，下行捕获=({n(fd_dn)})÷({n(bd_dn)})={n(cap_dn)}（页面容差 ±{T('attr.dn')}）",
   f"基准上涨 {n_up} 个月，基金平均 {n(fd_up)}%，基准平均 {n(bd_up)}%，上行捕获 {n(cap_up)}", f"跌时放大 {n(cap_dn)} 倍、涨时只跟上 {n(cap_up)}")
sp('attr.dn:w', f"只有 {n_dn} 个")
sp('attr.sty:eg', f"沪深300 {n(st5['b'][1])}（页面容差 ±{T('attr.sty')}，t={n(st5['t'][1])}）",
   f"中证1000 {n(st5['b'][2])}、创业板指 {n(st5['b'][3])}、国债指数 {n(st5['b'][4])}，截距 {n(st5['b'][0], 3)}%/月，R²={n(st5['r2'])}",
   f"一元回归的 β={n(beta, 3)}", f"沪深300 的系数升到 {n(st5['b'][1])}", f"相关系数高达 {n(corr_hc)}", f"所以 {n(st5['b'][1])} 不能读成 {n(st5['b'][1] * 100, 0)}% 的仓位")
sp('attr.cr:eg', "10 行占净值%：" + '、'.join(f'{x[2]:.2f}' for x in top) + f"，合计 {n(cr)}%（页面容差 ±{T('attr.cr')}）", f"食品饮料 {n(ind['食品饮料'])}%",
   f"股票占净值 {n(al5['stock'][3])}%，前十大占股票仓位 {n(cr)}÷{n(al5['stock'][3])}={n(cr / al5['stock'][3] * 100, 1)}%", f"答案是 {n(ALT['cr'], 1)}%")
sp('attr.yr:eg', f"基金 {sg(yr_ret(r5, 2024) * 100)}%，基准 {sg(yr_ret(b5, 2024) * 100)}%，两者未舍入值相减得超额 {n(ex_y[2024])} 个百分点（页面容差 ±{T('attr.yr')}）",
   f"2022 年 {sg(ex_y[2022])}，2023 年 {sg(ex_y[2023])}，2025 年 {sg(ex_y[2025])}，2026 年（至 9 月，仅 9 个月）{sg(ex_y[2026])}")
sp('memo:attr.a_src', f"年化 {n(ann5 * 100)}%，同期沪深300 年化 {n(bann * 100)}%", f"Beta 为 {n(beta)}，R² 为 {n(r2b)}，年化 Alpha 为 {n(alpha_a)}%",
   f"风格回归 R² 为 {n(st5['r2'])}：沪深300 系数 {n(st5['b'][1])}、创业板指 {n(st5['b'][3])}、国债指数 {n(st5['b'][4])}",
   f"2022 年 {sg(ex_y[2022])}，2023 年 {sg(ex_y[2023])}，2024 年 {sg(ex_y[2024])}，2025 年 {sg(ex_y[2025])} 个百分点")
sp('memo:attr.a_risk', f"最大回撤 {n(mdd * 100)}%，峰值在 {MONTHS[pk_i]}，谷底在 {MONTHS[tr_]}",
   f"年化波动 {n(vol * 100)}%，夏普 {n(sharpe)}（无风险利率取样本期 2 年国债均值 {n(rf * 100)}%），下行捕获 {n(cap_dn)}",
   f"近 36 个月累计 {n(c36f * 100)}%，接口给出的近 1 年涨幅 {n(f5['ret']['y1'])}%")
sp('memo:attr.a_hold', f"前十大合计 {n(cr)}%", f"食品饮料 {n(ind['食品饮料'])}%", f"港股 {len(hk)} 只合计 {n(sum(x[2] for x in hk))}%",
   f"股票仓位 {n(al5['stock'][3])}%，比 2026-03-31 的 {n(al5['stock'][2])}% 下降 {n(al5['stock'][2] - al5['stock'][3])} 个百分点，现金升至 {n(al5['cash'][3])}%",
   f"前十大中 {ndown} 只的占比下降", f"已过 {days} 天")
sp('memo:attr.a_dur', f"60 个月 IR 为 {n(ir)}", f"近 36 个月累计 {n(c36f * 100)}%，同期沪深300 累计 {sg(c36b * 100)}%，相差 {n(abs(c36f - c36b) * 100)} 个百分点",
   "「三年以上产品业绩低于业绩比较基准超过10个百分点」", f"现任经理 {len(f5['mgr'])} 人（{'、'.join(m['name'] for m in f5['mgr'])}）")
# ---------------------------------------------------------------- 6b. fi：易方达中债7-10年期国开行债券指数A（003358），月末 2026-09
f3 = RF['003358']; r3 = np.array(f3['r']); cn10 = np.array(Y['cn10']); cn2 = np.array(Y['cn2']); dy10 = np.diff(cn10) * 100
o3 = ols(r3, [dy10]); a3, b3 = o3['b']; D3, r2_3 = -100 * b3, o3['r2']; be3 = -a3 / b3
c2, c10, c30 = Y['cn2'][60], Y['cn10'][60], Y['cn30'][60]; s102, s3010 = (c10 - c2) * 100, (c30 - c10) * 100
s_all = (cn10 - cn2) * 100; smin, smax = float(s_all.min()), float(s_all.max()); imin, imax = int(s_all.argmin()), int(s_all.argmax())
rank10 = int((cn10 < cn10[60]).sum()) + 1; BAND = 15
mp10 = dict(zip(MK['cn10_daily']['d'], MK['cn10_daily']['y'])); e511 = RF['511260']['daily']; xs, ys, prev = [], [], None
for d_, rr_ in zip(e511['d'], e511['r']):
    if d_ not in mp10: prev = None; continue
    if prev is not None: xs.append((mp10[d_] - prev) * 100); ys.append(rr_)
    prev = mp10[d_]
od = ols(ys, [xs]); ad, bd, Dd, r2d, nd = od['b'][0], od['b'][1], -100 * od['b'][1], od['r2'], od['n']
D511m = -100 * ols(RF['511260']['r'], [dy10])['b'][1]
q = [x[1] for x in f3['nav_2022q4']]; qd = [x[0] for x in f3['nav_2022q4']]; ddv = [v / q[0] - 1 for v in q]
dd = min(ddv) * 100; imn = int(np.argmin(ddv)); dmin = qd[imn]
sh = MK['shock2022']; shc = sh['cn10']; up = max(v - shc[0] for v in shc) * 100; dpk = sh['d'][int(np.argmax(shc))]
up_at_min = (dict(zip(sh['d'], shc))[dmin] - shc[0]) * 100; est_q = D3 * up_at_min / 100
eq3 = ols(r3, [IDX('国债指数'), IDX('沪深300')]); al3 = f3['alloc']; hd3 = f3['holder']
dur_x, r2_x, be_x, eq_x = {}, {}, {}, {}
for c_, f_ in RF.items():
    if '债' in f_['cat']:
        o_ = ols(f_['r'], [dy10]); dur_x[c_], r2_x[c_], be_x[c_] = -100 * o_['b'][1], o_['r2'], -o_['b'][0] / o_['b'][1]
        eq_x[c_] = ols(f_['r'], [IDX('国债指数'), IDX('沪深300')])['b'][2]
for k_, v2 in (('fi.slope', s102), ('fi.dur', D3), ('fi.be', be3), ('fi.dd', Dd), ('fi.q4', dd), ('fi.eq', eq3['b'][2])): pg(k_, v2)
ok(Y['cn_dates'][60] == '2026-09-30' and MONTHS[60] == '2026-09', '中国 2026-09 月末日期与文字不符')
ok(sum(1 for f_ in RF.values() if '债' in f_['cat']) == sum(1 for f_ in RF.values() if '债' in f_['cat'] and f_['nav_2022q4']) == 12, '债类基金不是 12 只或并非都有 2022Q4 数据')
ok((e511['d'][0], e511['d'][-1]) == ('2025-10-20', '2026-10-19') and not RF['511260']['adj'], '511260 区间或口径与文字不符')
ok((qd[0], dmin, dpk) == ('2022-10-31', '2022-12-09', '2022-12-06') and abs(dd - PQ['fi.q4']['a']) < 1e-9, '2022Q4 日期与文字不符')
ok(rank10 == 6, '10Y 在样本中的排位与备忘录不符')
ok(abs(eq3['b'][2]) < PQ['fi.eq']['tol'], 'fi.eq 答案绝对值应小于容差（文字里这么说）')
ok(hd3['d'][-1] == al3['d'][-1] == '2026-06-30' and al3['d'][2] == '2026-03-31', 'fi 持仓日期与文字不符')
bt = f3['bond_top']; bsum = sum(x[2] for x in bt)
ok(len(bt) == 5 and all('国开' in x[1] for x in bt), '前五大债券不全是国开债')
stk3 = al3['stock'][-1]; stk_x = {c_: RF[c_]['alloc']['stock'][-1] for c_ in ('110027', '519977')}
# ---- fi 片段
sp('fi.slope:eg', f"10Y {n(c10, 4)}%，2Y {n(c2, 4)}%", f"差={n(c10, 4)}−{n(c2, 4)}={n(c10 - c2, 4)} 个百分点={n(s102)}bp，页面答案 {n(s102, 1)}bp（容差 ±{T('fi.slope')}）",
   f"30Y 为 {n(c30, 4)}%，30Y 减 10Y={n(s3010)}bp", f"{len(cn10)} 个月末样本里，10Y 减 2Y 最窄 {n(smin)}bp（{MONTHS[imin]}），最宽 {n(smax)}bp（{MONTHS[imax]}）")
sp('fi.slope:w', f"{n(c10 - c2, 4)} 个百分点才是 {n(s102)}bp")
sp('fi.dur:eg', f"a={n(a3, 3)}%/月，b={n(b3, 4)} %/bp，R²={n(r2_3)}", f"D=-100×({n(b3, 4)})={n(D3)} 年（页面容差 ±{T('fi.dur')}）",
   f"净值约下跌 {n(-b3, 4)}%；上行 10bp 约下跌 {n(-b3 * 10)}%", f"博时信用债纯债债券A D={n(dur_x['050027'])} 年，R²={n(r2_x['050027'])}",
   f"南方宝元债券A（二级债基）R² 只有 {n(r2_x['202101'])}")
sp('fi.dur:w', f"南方宝元债券A（二级债基）D={n(dur_x['202101'])} 年，R²={n(r2_x['202101'])}")
sp('fi.be:eg', f"a={n(a3, 5)}%/月，b={n(b3, 5)} %/bp，Δy*={n(-a3, 5)}÷({n(b3, 5)})={n(be3)}bp，页面答案 {n(be3, 1)}bp（容差 ±{T('fi.be')}）",
   f"10Y {n(c10, 4)}%÷12={n(c10 / 12, 4)}%/月，再除以 {n(-b3, 5)}，得 {n(c10 / 12 / -b3)}bp")
sp('fi.be:w', f"{len(cn10)} 个月末的 10Y 均值 {n(cn10.mean())}%，高于 2026-09 的 {n(c10, 4)}%", f"本例 a×12={n(a3 * 12)}%/年", f"南方宝元债券A 算出来是 {n(be_x['202101'])}bp")
sp('fi.dd:eg', f"共 {len(e511['d'])} 个交易日，配对 {nd} 个点", f"a={n(ad, 4)}%/日，b={n(bd, 4)} %/bp，R²={n(r2d)}", f"D=-100×({n(bd, 4)})={n(Dd)} 年（页面容差 ±{T('fi.dd')}）",
   f"月度回归给出 {n(D511m)} 年", f"003358 的 {n(D3)} 年")
sp('fi.dd:w', f"本例 {len(e511['d'])} 个交易日，得到 {nd} 个配对点")
sp('fi.q4:eg', f"2022-10-31 净值 {n(q[0], 4)}，最低 {n(q[imn], 4)}（{dmin}）", f"{n(q[imn], 4)}÷{n(q[0], 4)}−1={n(dd)}%（页面答案 {n(dd)}，容差 ±{T('fi.q4')}）",
   f"从 {n(shc[0], 4)}% 升到最高 {n(max(shc), 4)}%（{dpk}），最大上行 {n(up)}bp；到 {dmin} 上行 {n(up_at_min)}bp",
   f"按回归久期 {n(D3)} 年估算：{n(D3)}×{n(up_at_min)}bp≈{n(est_q)}%，实际回撤 {n(-dd)}%，差 {n(est_q + dd)} 个百分点")
sp('fi.q4:w', "本快照 12 只债类基金都有这组数据")
sp('fi.q4:src', f"{len(sh['d'])} 个交易日")
sp('fi.eq:eg', f"国债指数 {n(eq3['b'][1])}，沪深300 {n(eq3['b'][2], 3)}，R² {n(eq3['r2'])}", f"股票仓位 {n(stk3, 1)}%",
   f"易方达安心回报债券A（二级债基）沪深300 系数 {n(eq_x['110027'], 3)}，股票仓位 {n(stk_x['110027'])}%",
   f"长信可转债债券A 系数 {n(eq_x['519977'], 3)}，仓位 {n(stk_x['519977'])}%")
sp('fi.eq:w', f"本题容差 ±{T('fi.eq')} 大于答案的绝对值 {n(abs(eq3['b'][2]), 3)}")
sp('memo:fi.f_view', f"10Y 为 {n(c10, 4)}%，2Y 为 {n(c2, 4)}%，10Y 减 2Y 为 {n(s102)}bp，30Y 减 10Y 为 {n(s3010)}bp",
   f"{len(cn10)} 个月末样本里排第 {rank10} 低（最低 {n(cn10.min(), 4)}%，{MONTHS[int(cn10.argmin())]}；最高 {n(cn10.max(), 4)}%，{MONTHS[int(cn10.argmax())]}）",
   f"在 {n(c10 - BAND / 100)}% 至 {n(c10 + BAND / 100)}% 之间波动，即现价上下 {BAND}bp", f"样本区间 {n(smin)}bp 至 {n(smax)}bp 的中部", allow=('15',))
sp('memo:fi.f_pos', f"回归久期 {n(D3)} 年（R² 为 {n(r2_3)}），十年国债ETF 日度版 {n(Dd)} 年", f"10Y 上行 {BAND}bp，估计净值下跌 {n(D3)}×{BAND}bp={n(D3 * BAND / 100)}%",
   f"回归截距 {n(a3, 4)}%×3 估为 {n(a3 * 3)}%，按前瞻口径 {n(c10, 4)}%÷12×3 估为 {n(c10 / 12 * 3)}%", f"月度盈亏平衡 {n(be3)}bp（前瞻口径约 {n(c10 / 12 / -b3)}bp）",
   f"若要求 {BAND}bp 上行的损失不超过 3 个月票息类收入，久期上限约 {n(a3 * 3 / (BAND / 100), 1)} 年（前瞻口径 {n(c10 / 12 * 3 / (BAND / 100), 1)} 年），低于现在的 {n(D3)} 年")
sp('memo:fi.f_risk', f"久期 {n(D3)} 年，10Y 每上行 1bp 约损失 {n(-b3, 3)}%", f"10Y 由 {n(shc[0], 4)}% 升到 {n(max(shc), 4)}%（上行 {n(up)}bp）", f"最大回撤 {n(dd)}%",
   f"债券仓位 {n(al3['bond'][3])}%", f"净资产 {n(al3['net'][3])} 亿元，比 2026-03-31 的 {n(al3['net'][2])} 亿元增加 {n((al3['net'][3] / al3['net'][2] - 1) * 100, 1)}%",
   f"机构持有 {n(hd3['inst'][-1])}%", f"合计 {n(bsum)}%")
sp('memo:fi.f_trig', f"突破 {n(c10 + BAND / 100)}%（现价上行 {BAND}bp）", f"超过 {n(smax)}bp 或低于 {n(smin)}bp（样本极值）", f"R² 从 {n(r2_3)} 降到 0.5 以下",
   f"盈亏平衡 {n(be3)}bp", allow=('15', '0.5'))

# ---------------------------------------------------------------- 7. 逐条执行
def texts():
    for key, c in SOL.items():
        for f_ in ('t', 'f', 'say', 'eg', 'src'): yield f'{key}:{f_}', c[f_]
        for f_ in ('s', 'w'): yield f'{key}:{f_}', '\n'.join(c[f_])
    for key, v in MEMO.items(): yield f'memo:{key}', v


seen = set()
for tgt, text in texts():
    seen.add(tgt); snips, allow = SP.get(tgt, ((), ()))
    check(tgt, text, snips, allow)
ok(set(SP) <= seen, f'登记了但不存在的目标：{sorted(set(SP) - seen)}')
for tgt in ('eg', 'w'):  # 每张卡的演算和易错点里出现的数字，应当都登记过片段（没有数字的除外）
    for key, c in SOL.items():
        body = c[tgt] if tgt == 'eg' else '\n'.join(c[tgt])
        has_num = any(tk not in YEARS and tk not in SMALL and tk not in PCONST for tk in numtok(body)[0])
        ok(not has_num or f'{key}:{tgt}' in SP, f'{key}:{tgt} 含数字但没有登记片段')
nsn = sum(len(v[0]) for v in SP.values())
print(f'FDSOL {len(SOL)} 条，FDMEMO {len(MEMO)} 条；登记片段 {nsn} 个；断言通过 {NPASS[0]} 项，失败 {len(FAILS)} 项')
for k_, v in MEMO.items(): print(f'  {k_:<16} 字数 len={len(v)} 汉字={CJK(v)} 计词={WORDLIKE(v)}')
for f_ in FAILS: print('FAIL', f_)
sys.exit(1 if FAILS else 0)
