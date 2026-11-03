#!/usr/bin/env python3
"""Assemble the single-file workbench from src/. Usage: python3 build.py"""
from pathlib import Path
B = Path(__file__).resolve().parent
S = B / 'src'
def cat(d, pattern):
    return '\n'.join(p.read_text(encoding='utf-8') for p in sorted((S / d).glob(pattern)))

# 生成细分岗位库数据：面试备战/岗位库/ROLE_*.json → src/data/20_rolelib.js（含每个岗位的题量）
import json, re
from pathlib import Path as _P
_rd = B.parent / 'interview-prep' / '岗位库'
_roles = []
for f in sorted(_rd.glob('ROLE_*.json')) if _rd.exists() else []:
    _roles.extend(json.loads(f.read_text(encoding='utf-8')))
_prep = B.parent / 'training-src' / 'prep'
_counts = {}
for f in sorted(_prep.glob('prep_6*_iv_*.js')) if _prep.exists() else []:
    for m in re.finditer(r"role:'([^']+)'", f.read_text(encoding='utf-8')):
        _counts[m.group(1)] = _counts.get(m.group(1), 0) + 1
for r in _roles:
    r['qn'] = _counts.get(r.get('id', ''), 0)
(S / 'data' / '20_rolelib.js').write_text(
    '/* 自动生成：细分岗位库 ' + str(len(_roles)) + ' 个（改 面试备战/岗位库/*.json 后重新构建） */\n'
    'const ROLES=' + json.dumps(_roles, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')

css = (S / 'style.css').read_text(encoding='utf-8') + '\n' + (S / 'style2.css').read_text(encoding='utf-8')
data = cat('data', '*.js')
app = cat('app', '*.js')
html = (S / 'shell.html').read_text(encoding='utf-8')
html = html.replace('{{CSS}}', css).replace('{{DATA}}', data).replace('{{APP}}', app)
out = B / 'index.html'
out.write_text(html, encoding='utf-8')
print('built', out, len(html), 'bytes')
