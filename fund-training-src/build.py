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

patch('</style>', css + '\n</style>')
patch('<button data-view="local"><span class="idx">08</span>本机练习</button>',
      '<button data-view="local"><span class="idx">08</span>本机练习</button>\n      <button data-view="fund"><span class="idx">09</span>公募基金岗位</button>')
patch('<section class="view" id="view-local"></section>',
      '<section class="view" id="view-local"></section>\n      <section class="view" id="view-fund"></section>')
patch("local:'本机练习'}[view]", "local:'本机练习',fund:'公募基金岗位训练'}[view]")
patch("if(state.view==='local')renderLocal();", "if(state.view==='local')renderLocal();\n    if(state.view==='fund')renderFund();")
patch("local:{completed:[],checks:{},lastRun:null}", "local:{completed:[],checks:{},lastRun:null},\n    fund:{tab:'home',q:{},memo:{},journal:[],cfg:{}}")
patch('  render();\n})();', js + '\n  render();\n})();')
OUT.write_text(html, encoding='utf-8')
print('built', OUT, len(html), 'bytes')
