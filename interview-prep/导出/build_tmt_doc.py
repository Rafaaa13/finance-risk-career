# -*- coding: utf-8 -*-
# 追加：TMT 洞见手册 与 速记卡
def table(doc, head, rows):
    t = doc.add_table(rows=1, cols=len(head))
    t.style = 'Table Grid'
    for i, h in enumerate(head):
        c = t.rows[0].cells[i]; c.text = ''
        r = c.paragraphs[0].add_run(str(h)); qn_font(r, size=9, bold=True)
    for row in rows:
        cells = t.add_row().cells
        for i, v in enumerate(row):
            cells[i].text = ''
            r = cells[i].paragraphs[0].add_run(fill(str(v))); qn_font(r, size=9)
    return t

def tmt_block(doc, c):
    heading(doc, f"{c.get('name')}（{c.get('ticker','—')} · {MKT.get(c.get('mkt'), c.get('mkt'))}）", 2)
    para(doc, f"数据截至 {c.get('asof','')}　｜　标签：{'、'.join(c.get('tags') or [])}", size=9, color=(0x60,0x70,0x78))
    para(doc, '业务定位', bold=True); para(doc, fill(c.get('position','')), indent=0.3)
    f = c.get('fin') or {}
    if f.get('rows'):
        para(doc, '最新财务与经营数据', bold=True)
        table(doc, f.get('head') or ['指标','数值','期间'], f['rows'])
        para(doc, ' ', size=6)
    para(doc, '竞争格局', bold=True); para(doc, fill(c.get('landscape','')), indent=0.3)
    v = c.get('valuation') or {}
    para(doc, '估值拆解', bold=True); para(doc, fill(v.get('text','')), indent=0.3)
    if v.get('rows'):
        table(doc, v.get('head') or ['指标','数值','口径'], v['rows']); para(doc, ' ', size=6)
    if c.get('scen'):
        para(doc, '熊 / 基准 / 牛', bold=True)
        table(doc, ['情景','概率','关键假设','含义'], [[s.get('n'), s.get('p'), s.get('v'), s.get('why')] for s in c['scen']]); para(doc, ' ', size=6)
    p = c.get('peers') or {}
    if p.get('rows'):
        para(doc, '同行对比', bold=True); table(doc, p.get('head') or [], p['rows']); para(doc, ' ', size=6)
    para(doc, '可以在面试里讲的两条洞见', bold=True)
    for i, x in enumerate(c.get('insights') or [], 1):
        para(doc, f"{i}. {fill(x.get('t',''))}", bold=True, indent=0.3, size=10)
        para(doc, fill(x.get('b','')), indent=0.6, size=10)
    if c.get('kill'):
        para(doc, '证伪条件', bold=True)
        for k in c['kill']: para(doc, '· ' + fill(k), indent=0.3, size=10)
    if c.get('asks'):
        para(doc, '面试官可能追问', bold=True)
        for a in c['asks']:
            para(doc, '问：' + fill(a.get('q','')), indent=0.3, size=10, bold=True)
            para(doc, '答：' + fill(a.get('a','')), indent=0.6, size=10)

def build_tmt_doc():
    segs = list(SEG.items())
    doc = new_doc('TMT 行业洞见手册 · AI 产业链上中下游',
                  f'共 {len(TMT)} 家公司，八个类别每类不少于 5 家；数字截至文档生成时，来源逐条可追溯。仅供学习与面试准备，不构成投资建议。')
    notice(doc)
    for sid, sname in segs:
        cs = [c for c in TMT if c.get('seg') == sid]
        if not cs: continue
        heading(doc, f"{sname}（{len(cs)} 家）", 1)
        for c in cs: tmt_block(doc, c)
    p = OUT / '05_TMT洞见手册.docx'; doc.save(p); return p

def build_memo_cards():
    by = {}
    for q in IV: by.setdefault(q.get('role'), []).append(q)
    doc = new_doc('面试前一晚速记卡', '每个岗位一页：最该背的数字 + 三道题的 30 秒要点。睡前看一遍，第二天开场用。')
    for r in ROLES:
        qs = by.get(r['id'], [])
        heading(doc, r['role'], 2)
        # 岗位一句话
        w = r.get('wlb') or {}; s = r.get('salary') or {}
        para(doc, f"{r.get('org_type')}｜节奏 {w.get('score','-')}/5｜成长 {(r.get('growth') or {}).get('score','-')}/5｜薪资 {fill(s.get('range',''))}",
             size=9.5, color=(0x60,0x70,0x78))
        # 该岗位题目引用的最重要的数字（去重取前 12）
        ids = []
        for q in qs:
            for m in TOK.finditer(json.dumps(q, ensure_ascii=False)):
                t = m.group(1)
                if t.startswith('L:') and t[2:] not in ids: ids.append(t[2:])
        para(doc, '必须记住的数字', bold=True, size=10)
        for i in ids[:12]:
            e = LED.get(i)
            if e: para(doc, f"· {e[0]}：{fmt_num(e[1])}{e[2] or ''}（{e[3]}，{e[5] or ''}）", indent=0.3, size=9.5)
        para(doc, '三道题的 30 秒要点', bold=True, size=10)
        for q in qs[:3]:
            para(doc, f"Q：{fill(q.get('q',''))}", indent=0.3, size=9.5, bold=True)
            para(doc, fill(q.get('a30','')), indent=0.6, size=9.5)
    p = OUT / '03_面试前一晚速记卡.docx'; doc.save(p); return p
