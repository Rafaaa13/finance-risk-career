# -*- coding: utf-8 -*-
# 岗位能力训练手册：投行/权益/固收/银行/PE/销售交易 18 题 + 解析 + 面试对照
import json
from pathlib import Path
BASE = Path(__file__).resolve().parent.parent
exec(open(str(Path(__file__).resolve().parent / 'build_docs.py'), encoding='utf-8').read())
LAB = json.loads((BASE / '导出' / 'lab.json').read_text(encoding='utf-8'))

def build_lab_doc():
    doc = new_doc('岗位能力训练手册 · 六类岗位的核心计算',
                  '投行估值、权益研究、固收、银行信贷、PE/VC、销售交易，共 18 道可动手的训练题；数字取自公开数据，答案由脚本独立复算。')
    para(doc, '使用说明', bold=True, size=11)
    para(doc, '每道题先看题、自己算一遍再对照解析。题目里的输入值来自真实公开数据，账本里的数字会随日期变化，训练台页面会实时重算；本手册是生成时的快照。', size=10)
    para(doc, '每题后面附该类别最接近的面试题（含 30 秒要点），做完计算去“面试对答”页把整段话讲一遍。仅供学习，不构成投资建议。', size=10)
    for fam in LAB['fams']:
        ts = [t for t in LAB['tasks'] if t['fam'] == fam['id']]
        heading(doc, f"{fam['name']}（{len(ts)} 题）", 1)
        para(doc, fam['desc'], size=10, color=(0x50, 0x60, 0x68))
        for i, t in enumerate(ts, 1):
            heading(doc, f"{i}. {t['title']}", 2)
            para(doc, t['q'], size=10.5)
            para(doc, '已知条件', bold=True, size=10)
            for inp in t['inputs']:
                para(doc, f"· {inp['label']}：{inp['def']}{inp.get('unit') or ''}" + (f"（来源：{inp['src']}）" if inp.get('src') else ''), indent=0.3, size=9.5)
            para(doc, '计算过程', bold=True, size=10)
            for j, s in enumerate(t['steps'], 1):
                para(doc, f"{j}) {s}", indent=0.3, size=9.5)
            para(doc, f"参考答案：{t['answer']:.2f} {t['unit']}", bold=True, size=10.5, color=(0x0f, 0x4c, 0x5c))
            if t.get('say'):
                para(doc, '面试里怎么讲：' + t['say'], size=9.5, color=(0x3f, 0x59, 0x60))
            if t.get('ivs'):
                para(doc, '对照面试题', bold=True, size=9.5)
                for q in t['ivs']:
                    para(doc, f"· [{q['id']}] {q['q']}", indent=0.3, size=9.5)
                    para(doc, f"  30 秒要点：{q['a30']}", indent=0.6, size=9)
    p = OUT / '06_岗位能力训练手册.docx'; doc.save(p); return p

if __name__ == '__main__':
    p = build_lab_doc(); print(p.name, round(p.stat().st_size / 1024), 'KB')
