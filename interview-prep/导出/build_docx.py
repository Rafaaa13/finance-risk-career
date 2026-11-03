# -*- coding: utf-8 -*-
# 追加：Word 手册
GROUP = {'buy':'买方资管','bank':'银行与央企金融','broker':'券商与股权投资'}
TYPE = {'real':'真题','freq':'高频题','infer':'推断题'}
SEG = {'up_chip':'上游·AI芯片','up_fab':'上游·制造·存储·设备','up_net':'上游·光互联·服务器·数据中心·电信',
       'mid_cloud':'中游·云与算力服务','mid_model':'中游·大模型与平台','down_app':'下游·AI应用与软件',
       'down_dev':'下游·终端·入口·平台','fin_ai':'金融AI与金融科技'}
MKT = {'CN':'A股','HK':'港股','US':'美股','PV':'未上市'}

def role_block(doc, r, qs):
    heading(doc, f"{r['role']}", 2)
    para(doc, f"{r.get('org_type','')} · 岗位组：{GROUP.get(r.get('group'), r.get('group'))}　｜　本题 {len(qs)} 道："
              f"真题 {sum(1 for q in qs if q.get('type')=='real')}、高频 {sum(1 for q in qs if q.get('type')=='freq')}、"
              f"推断 {sum(1 for q in qs if q.get('type')=='infer')}", size=9, color=(0x60,0x70,0x78))
    para(doc, '工作内容', bold=True, size=10.5)
    para(doc, fill(r.get('work','')), indent=0.4)
    if r.get('typical_day'):
        para(doc, '一天大概长什么样', bold=True, size=10.5)
        for x in r['typical_day']: para(doc, '· ' + fill(x), indent=0.4, size=10)
    for k, lab in [('wlb','工作节奏 WLB'), ('growth','成长性'), ('salary','薪资范围'),
                   ('intern_fit','对口实习'), ('requirements','岗位要求'), ('process','招聘流程与淘汰点'),
                   ('exit','出口与下一跳'), ('batches','批次、节点与 HC'), ('certs','证书')]:
        v = r.get(k)
        if not v: continue
        if isinstance(v, dict):
            txt = f"[{v.get('score','')}/5] {v.get('text','')}" + (f"（证据等级 {v.get('grade')}）" if v.get('grade') else '')
            if k == 'salary': txt = f"{v.get('range','')}　依据：{v.get('basis','')}（证据等级 {v.get('grade')}）"
            para(doc, lab, bold=True, size=10.5); para(doc, fill(txt), indent=0.4, size=10)
        else:
            para(doc, lab, bold=True, size=10.5); para(doc, fill(str(v)), indent=0.4, size=10)
    if r.get('sample_orgs'):
        para(doc, '样本机构：' + '、'.join(r['sample_orgs']) + ('　｜　城市：' + '、'.join(r.get('cities') or []) if r.get('cities') else ''), size=9, color=(0x60,0x70,0x78))
    if r.get('src'):
        para(doc, '来源：' + '；'.join(f"{s.get('t','')} {s.get('url','')}" for s in r['src'][:6]), size=8, color=(0x80,0x90,0x90))
    for q in qs:
        question_block(doc, q)

def question_block(doc, q):
    p = doc.add_paragraph(); p.paragraph_format.space_before = Pt(8); p.paragraph_format.space_after = Pt(2)
    r1 = p.add_run(f"[{q.get('id')}] [{TYPE.get(q.get('type'), q.get('type'))}] "); qn_font(r1, size=10, bold=True, color=(0x0f,0x4c,0x5c))
    r2 = p.add_run(fill(q.get('q',''))); qn_font(r2, size=10.5, bold=True)
    para(doc, '30 秒要点', bold=True, size=9.5, color=(0x0f,0x4c,0x5c), space_after=1)
    para(doc, fill(q.get('a30','')), indent=0.3, size=10)
    para(doc, '2–3 分钟逐字稿', bold=True, size=9.5, color=(0x0f,0x4c,0x5c), space_after=1)
    for seg in fill(q.get('a180','')).split('\n'):
        if seg.strip(): para(doc, seg.strip(), indent=0.3, size=10)
    tree = q.get('tree') or []
    if tree:
        para(doc, '追问树', bold=True, size=9.5, color=(0x0f,0x4c,0x5c), space_after=1)
        for n in tree:
            para(doc, '问：' + fill(n.get('ask','')), indent=0.3, size=9.5, bold=True)
            para(doc, '答：' + fill(n.get('ans','')), indent=0.6, size=9.5)
            for m in (n.get('next') or []):
                para(doc, '再问：' + fill(m.get('ask','')), indent=0.9, size=9.5, bold=True)
                para(doc, '再答：' + fill(m.get('ans','')), indent=1.2, size=9.5)
    if q.get('notes'):
        para(doc, '备考提示：' + fill(q['notes']), size=8.5, color=(0x60,0x70,0x78))
    src = q.get('src') or []
    if src:
        para(doc, '出处：' + '；'.join(f"{s.get('t','')}（{s.get('date','')}）{s.get('url','')}" for s in src[:3]), size=8, color=(0x80,0x90,0x90))

def notice(doc):
    para(doc, '使用说明', bold=True, size=11)
    para(doc, '每个岗位先给岗位卡（工作内容、节奏、成长、薪资、对口实习、要求、流程、出口、批次与 HC、证书、来源），再给 12 道面试题。'
              '每题分三层：30 秒要点、2–3 分钟逐字稿、追问树。', size=10)
    para(doc, '题目类型：真题＝公开帖子里实际出现过的题，出处在题末；高频＝多个独立来源反复出现；推断＝依据 JD 与业务推断的题，不是真题。', size=10)
    para(doc, '数字：文中数字来自公开数据（公司公告、监管、交易所、协会、权威媒体），每条都可追溯；薪资只给区间，二手传闻标注“二手传闻（E3）”；'
              '查不到的一律写“未公布/未核实”，不估算。面试前一天请用训练台的“数据账本”页核对会过期的数字。', size=10)
    para(doc, '个人经历：文中不替你编造实习细节。唯一引用的档案事实是光大证券 TMT 研究、滴滴经营分析、百度金融 AI 研究、安永即时零售尽调、工行对公信贷尽调中已记录的内容。'
              '被追问到具体口径时，按事实回答，答不出的部分不要硬编。', size=10)
    para(doc, '本文档仅供学习与面试准备，不构成投资建议或录用承诺。', size=9, color=(0x80,0x90,0x90))
