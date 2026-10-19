#!/usr/bin/env python3
"""Assemble the single-file workbench from src/. Usage: python3 build.py"""
from pathlib import Path
B = Path(__file__).resolve().parent
S = B / 'src'
def cat(d, pattern):
    return '\n'.join(p.read_text(encoding='utf-8') for p in sorted((S / d).glob(pattern)))
css = (S / 'style.css').read_text(encoding='utf-8') + '\n' + (S / 'style2.css').read_text(encoding='utf-8')
data = cat('data', '*.js')
app = cat('app', '*.js')
html = (S / 'shell.html').read_text(encoding='utf-8')
html = html.replace('{{CSS}}', css).replace('{{DATA}}', data).replace('{{APP}}', app)
out = B / 'index.html'
out.write_text(html, encoding='utf-8')
print('built', out, len(html), 'bytes')
