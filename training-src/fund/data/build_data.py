#!/usr/bin/env python3
"""把 raw_*.json（2026-10-20 真实快照）压缩成前端用的 fund/fund_05_data.js。
月度收益口径：优先用「累计净值增量/上月单位净值」（分红按现金加回，不再投资）；
若累计净值异常（如 163402、ETF 面值100倍），回退到单位净值比并打 raw 标记。"""
import json
from pathlib import Path
D = Path(__file__).resolve().parent
OUT = D.parent / 'fund_05_data.js'
L = lambda n: json.load(open(D / n, encoding='utf-8'))
BAD = {'163406', '163402', '100032', '511260', '511010'}
funds, flags_report = [], []
for part in ('A1', 'A2', 'A3'):
    for f in L(f'raw_funds_{part}.json')['funds']:
        lj = [r[1] for r in f['nav_m']]
        dw = [r[1] if isinstance(r, list) else r for r in f['dwjz_m']]
        dates = [r[0] for r in f['nav_m']]
        assert len(lj) == len(dw) == 61 and all(x is not None for x in lj + dw), f['code']
        scale = 1.0
        if dw[0] / lj[0] > 20:
            scale = round(dw[0] / lj[0])
        r, fl = [], []
        for t in range(1, 61):
            rdw = dw[t] / dw[t - 1] - 1
            rlj = (lj[t] * scale - lj[t - 1] * scale) / dw[t - 1]
            if abs(rlj - rdw) < 1e-9:
                r.append(rdw)
            elif 0 < rlj - rdw < 0.15:
                r.append(rlj); fl.append([t, 'div'])
            else:
                r.append(rdw); fl.append([t, 'raw'])
        raw_n = sum(1 for x in fl if x[1] == 'raw')
        adj = f['code'] not in BAD
        if not adj:  # 累计净值口径异常：改用单位净值比（分红未复权，月度收益在派息月被低估）
            r = [dw[t] / dw[t - 1] - 1 for t in range(1, 61)]
            fl = [[0, 'unadj']]
        flags_report.append((f['code'], f['name'], scale, len(fl) - raw_n, raw_n))
        o = {'c': f['code'], 'n': f['name'], 'cat': f['cat'],
             'mgr': ' / '.join(m['name'] for m in f['mgr']), 'ret': f['ret'],
             'r': [round(x * 100, 3) for x in r],
             'nav0': dw[0], 'nav1': dw[-1],
             'adj': adj, 'fl': fl, 'sc': f['scale'], 'hd': f['holder'], 'fw': f['flow'], 'al': f['alloc'],
             'top': f.get('top10'), 'bt': f.get('bond_top'), 'dy': f.get('daily'), 'q4': f.get('nav_2022q4')}
        funds.append(o)
B = L('raw_market_B.json')
C = L('raw_stocks_C.json')
Rr = L('raw_rules_D.json')
KEEP = ('y', 'rev_yi', 'np_yi', 'kf_np_yi', 'rev_yoy', 'np_yoy', 'roe', 'gm', 'nm', 'debt', 'cfps', 'eps', 'bps', 'toa', 'dps', 'div_yi')
stocks = []
for s in C['stocks']:
    an = sorted(s['annual'], key=lambda a: a['y'])
    stocks.append({'c': s['code'], 'n': s['name'], 'ind': s['industry'], 'q': s['quote'],
                   'a': [{k: a.get(k) for k in KEEP} for a in an], 'h1': s['h1_2026']})
rules = [{k: it.get(k) for k in ('id', 'topic', 'quote', 'cite', 'effective', 'status', 'url', 'note')} for it in Rr['items']]
FR = {'snap': '2026-10-20', 'months': B['months'], 'funds': funds,
      'idx': {k: {'m': v['m'], 'last': v['last']} for k, v in B['index'].items()},
      'yld': B['yield'], 'cn10d': B['cn10_daily'], 'shock': B['shock2022'],
      'stocks': stocks, 'rules': rules, 'unv': Rr['unverified'], 'ind': Rr['industry']}
txt = '/* 自动生成：build_data.py ← raw_*.json；快照 2026-10-20；来源见各 raw 文件 */\nconst FR=' + json.dumps(FR, ensure_ascii=False, separators=(',', ':')) + ';\n'
OUT.write_text(txt, encoding='utf-8')
print('written', OUT, len(txt), 'bytes')
for x in flags_report:
    print(x)
