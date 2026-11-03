# -*- coding: utf-8 -*-
# 主入口：生成分册、总册、速记卡、TMT 手册、Excel
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent))
from build_docs import *
exec(open(str(__import__('pathlib').Path(__file__).resolve().parent / 'build_xlsx.py'), encoding='utf-8').read())
exec(open(str(__import__('pathlib').Path(__file__).resolve().parent / 'build_docx.py'), encoding='utf-8').read())
exec(open(str(__import__('pathlib').Path(__file__).resolve().parent / 'build_tmt_doc.py'), encoding='utf-8').read())
exec(open(str(__import__('pathlib').Path(__file__).resolve().parent / 'build_lab_doc.py'), encoding='utf-8').read())

by = {}
for q in IV: by.setdefault(q.get('role'), []).append(q)

def build_group(g, title, fname):
    rs = [r for r in ROLES if r.get('group') == g]
    total = sum(len(by.get(r['id'], [])) for r in rs)
    doc = new_doc(f'{title} · 面试手册', f'{len(rs)} 个细分岗位，{total} 道面试题。岗位卡 + 30 秒要点 + 2–3 分钟逐字稿 + 追问树。')
    notice(doc)
    heading(doc, '本册岗位', 1)
    for i, r in enumerate(rs, 1):
        qs = by.get(r['id'], [])
        para(doc, f"{i}. {r['role']}（{r.get('org_type')}）—— {len(qs)} 题，真题 {sum(1 for q in qs if q.get('type')=='real')}、高频 {sum(1 for q in qs if q.get('type')=='freq')}、推断 {sum(1 for q in qs if q.get('type')=='infer')}", size=10)
    for r in rs:
        heading(doc, f"{GROUP.get(r.get('group'),'')} / {r['role']}", 1)
        role_block(doc, r, by.get(r['id'], []))
    p = OUT / fname; doc.save(p); return p

def build_master(paths):
    doc = new_doc('金融实习与校招 · 面试总册', '买方资管、银行与央企金融、券商与股权投资、基础设施与协会四大岗位组，46 个细分岗位、570 道题。分册见同目录 01–04，TMT 见 05。')
    notice(doc)
    heading(doc, '怎么用这套材料', 1)
    for t in ['先按目标机构所在岗位组，读对应分册的岗位卡，确认工作内容和要求，再读题目。',
              '每道题先自己开口答 90 秒，再对照 30 秒要点与逐字稿；逐字稿不要背，改成自己的语气。',
              '追问树是面试官连续深挖的路径，至少练到第二层能接住。',
              '面试前一天看《03_面试前一晚速记卡》；数字会过期，打开训练台“数据账本”页按更新清单核对。',
              'TMT 行业问题看《04_TMT洞见手册》：先讲产业链位置，再讲两条洞见，最后主动说证伪条件。']:
        para(doc, '· ' + t, size=10)
    heading(doc, '岗位总览', 1)
    table(doc, ['岗位组','细分岗位','题量','真题','高频','推断','薪资区间'],
          [[GROUP.get(r.get('group')), r['role'], len(by.get(r['id'], [])),
            sum(1 for q in by.get(r['id'], []) if q.get('type')=='real'),
            sum(1 for q in by.get(r['id'], []) if q.get('type')=='freq'),
            sum(1 for q in by.get(r['id'], []) if q.get('type')=='infer'),
            fill((r.get('salary') or {}).get('range',''))] for r in ROLES])
    # 附录：通用题（所有岗位共用），来自 common.json
    cj = OUT / 'common.json'
    if cj.exists():
        cm = json.loads(cj.read_text(encoding='utf-8'))
        heading(doc, '附录：通用题（所有岗位共用）', 1)
        para(doc, f'共 {len(cm)} 题：自我介绍、动机、实习深挖、市场观点、优缺点、行为面、职业规划、压力面、反问、英文、群面与笔试。每题同样分 30 秒要点、逐字稿与追问树。', size=10)
        for q in cm: question_block(doc, q)
    p = OUT / '00_面试总册.docx'; doc.save(p); return p

if __name__ == '__main__':
    made = []
    made.append(build_group('buy', '买方资管', '01_买方资管_面试手册.docx'))
    made.append(build_group('bank', '银行与央企金融', '02_银行与央企金融_面试手册.docx'))
    made.append(build_group('broker', '券商与股权投资', '03_券商与股权投资_面试手册.docx'))
    made.append(build_group('infra', '基础设施·交易所·协会·监管', '04_基础设施与协会_面试手册.docx'))
    made.append(build_master(made))
    made.append(build_memo_cards())
    made.append(build_tmt_doc())
    made.append(build_lab_doc())
    made.append(build_xlsx())
    for p in made: print(p.name, round(p.stat().st_size / 1024), 'KB')
