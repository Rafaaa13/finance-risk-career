#!/usr/bin/env python3
"""把公募基金岗位训练板块注入基础训练台，输出单文件 HTML。
用法：python3 build.py [输出路径]
"""
import json, sys
from pathlib import Path
B = Path(__file__).resolve().parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else B.parent / '金融风险能力训练工作台.html'
html = (B / 'base.html').read_text(encoding='utf-8')

def patch(old, new, count=1):
    global html
    assert html.count(old) == count, (old[:60], html.count(old))
    html = html.replace(old, new)

css = (B / 'fund' / 'fund.css').read_text(encoding='utf-8')
js_parts = sorted((B / 'fund').glob('fund_*.js'))
py_file = B / 'fund' / 'fundlab.py'
py_parts = {'fundlab.py': py_file.read_text(encoding='utf-8') if py_file.exists() else '# fundlab.py 尚未生成'}
js = '\n'.join(p.read_text(encoding='utf-8').replace('</', '<\\/') if p.name == 'fund_05_data.js' else p.read_text(encoding='utf-8') for p in js_parts)
js = js.replace('__FUND_PY__', json.dumps(py_parts, ensure_ascii=False).replace('</', '<\\/'))

# 参考答案与新板块（prep/）：先 CSS，再按文件名顺序拼 JS；prep_00 声明通用渲染器，prep_90 包装基础视图
prep_dir = B / 'prep'

# 事实账本 → prep_05_ledger.js（每次构建重新生成；值为 [标签,值,单位,截至,来源,证据等级,链接]）
led_dir = B.parent / 'interview-prep' / '事实账本'
ledger, miss = {}, []
for f in sorted(led_dir.glob('*.json')) if led_dir.exists() else []:
    for e in json.loads(f.read_text(encoding='utf-8')):
        if e.get('value') is None or e.get('status') == 'unverified':
            miss.append([e.get('id', ''), e.get('label', ''), (e.get('note') or '')[:90]])
        else:
            ledger[e['id']] = [e.get('label', ''), e['value'], e.get('unit') or '', e.get('asof') or '',
                               e.get('source') or '', e.get('grade') or '', e.get('url') or '']
(prep_dir / 'prep_05_ledger.js').write_text(
    '/* 自动生成：事实账本 ' + str(len(ledger)) + ' 条已核实，' + str(len(miss)) + ' 条未核实（勿手改，改 面试备战/事实账本/*.json 后重新构建） */\n'
    'const LEDGER=' + json.dumps(ledger, ensure_ascii=False, separators=(',', ':')) + ';\n'
    'const LEDGER_MISS=' + json.dumps(miss, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')

# 岗位库 → prep_07_roles.js（面试备战/岗位库/ROLE_*.json，每个文件一个数组）
role_dir = B.parent / 'interview-prep' / '岗位库'
roles = []
for f in sorted(role_dir.glob('ROLE_*.json')) if role_dir.exists() else []:
    roles.extend(json.loads(f.read_text(encoding='utf-8')))
(prep_dir / 'prep_07_roles.js').write_text(
    '/* 自动生成：岗位库 ' + str(len(roles)) + ' 个细分岗位（改 面试备战/岗位库/ROLE_*.json 后重新构建） */\n'
    'ROLES.push(...' + json.dumps(roles, ensure_ascii=False, separators=(',', ':')) + ');\n', encoding='utf-8')

prep_css = (prep_dir / 'prep.css').read_text(encoding='utf-8') if (prep_dir / 'prep.css').exists() else ''
prep_js = '\n'.join(p.read_text(encoding='utf-8') for p in sorted(prep_dir.glob('prep_*.js')))
assert '</script' not in prep_js.lower(), 'prep JS 里不能出现 </script'
js = js + '\n' + prep_js
css = css + '\n' + prep_css

# 新增视图（按顺序从 10 号开始）
NEW_VIEWS = [('tmt', 'TMT 洞见', 'renderTmt'), ('fw', '分析框架', 'renderFw'), ('lab', '岗位能力训练', 'renderLab'), ('exp', '经历库', 'renderExp'), ('iv', '面试对答', 'renderIv'), ('led', '数据账本', 'renderLed')]
nav_extra = ''.join('\n      <button data-view="%s"><span class="idx">%d</span>%s</button>' % (k, 10 + i, n) for i, (k, n, _) in enumerate(NEW_VIEWS))
sec_extra = ''.join('\n      <section class="view" id="view-%s"></section>' % k for k, _, _ in NEW_VIEWS)
title_extra = ''.join(",%s:'%s'" % (k, n) for k, n, _ in NEW_VIEWS)
disp_extra = ''.join("\n    if(state.view==='%s')%s();" % (k, fn) for k, _, fn in NEW_VIEWS)

patch('</style>', css + '\n</style>')
patch('<button data-view="local"><span class="idx">08</span>本机练习</button>',
      '<button data-view="local"><span class="idx">08</span>本机练习</button>\n      <button data-view="fund"><span class="idx">09</span>公募基金岗位</button>' + nav_extra)
patch('<section class="view" id="view-local"></section>',
      '<section class="view" id="view-local"></section>\n      <section class="view" id="view-fund"></section>' + sec_extra)
patch("local:'本机练习'}[view]", "local:'本机练习',fund:'公募基金岗位训练'" + title_extra + "}[view]")
patch("if(state.view==='local')renderLocal();", "if(state.view==='local')renderLocal();\n    if(state.view==='fund')renderFund();" + disp_extra)
patch("local:{completed:[],checks:{},lastRun:null}", "local:{completed:[],checks:{},lastRun:null},\n    fund:{tab:'home',q:{},memo:{},journal:[],cfg:{}},\n    prep:{}")
patch('  render();\n})();', js + '\n  render();\n})();')
OUT.write_text(html, encoding='utf-8')
print('built', OUT, len(html), 'bytes; ledger', len(ledger), 'missing', len(miss))
