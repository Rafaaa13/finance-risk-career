#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 面试备战/导出/data.json 生成 Excel 岗位对比矩阵 与 Word 面试手册。"""
import json, re, os
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter
from docx import Document
from docx.shared import Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn

BASE = Path(__file__).resolve().parent.parent
D = json.loads((BASE / '导出' / 'data.json').read_text(encoding='utf-8'))
ROLES, IV, TMT, LED = D['roles'], D['iv'], D['tmt'], D['ledger']
OUT = BASE / '导出'
OUT.mkdir(exist_ok=True)

TOK = re.compile(r'\{\{([^}]+)\}\}')

def fmt_num(v):
    if isinstance(v, float) and abs(v - round(v)) > 1e-9:
        return f'{v:,.2f}'.rstrip('0').rstrip('.')
    if isinstance(v, (int, float)):
        return f'{v:,}'
    return str(v)

def fill(s):
    if not isinstance(s, str):
        return '' if s is None else str(s)
    def one(m):
        t = m.group(1)
        if t.startswith('L:'):
            e = LED.get(t[2:])
            return (fmt_num(e[1]) + (e[2] or '')) if e else '【未核实】'
        if t.startswith('D:'):
            a, b = t[2:].split('~')
            ea, eb = LED.get(a), LED.get(b)
            if ea and eb and isinstance(ea[1], (int, float)) and isinstance(eb[1], (int, float)):
                return f'{round((ea[1]-eb[1])*100)}bp'
            return '【未核实】'
        return ''
    return TOK.sub(one, s)

def qn_font(run, name='微软雅黑', size=None, bold=None, color=None):
    run.font.name = name
    run._element.rPr.rFonts.set(qn('w:eastAsia'), name)
    if size: run.font.size = Pt(size)
    if bold is not None: run.font.bold = bold
    if color: run.font.color.rgb = RGBColor(*color)

def para(doc, text, size=10.5, bold=False, color=None, indent=0, space_after=4, align=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.25
    if indent: p.paragraph_format.left_indent = Cm(indent)
    if align: p.alignment = align
    r = p.add_run(text)
    qn_font(r, size=size, bold=bold, color=color)
    return p

def heading(doc, text, level=1):
    sizes = {1: 18, 2: 14, 3: 12}
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12 if level > 1 else 6)
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run(text)
    qn_font(r, size=sizes[level], bold=True, color=(0x1f, 0x3b, 0x45) if level == 1 else (0x0f, 0x4c, 0x5c))
    return p

def new_doc(title, subtitle):
    doc = Document()
    sec = doc.sections[0]
    sec.top_margin = Cm(2.0); sec.bottom_margin = Cm(2.0)
    sec.left_margin = Cm(2.2); sec.right_margin = Cm(2.0)
    st = doc.styles['Normal']
    st.font.name = '微软雅黑'; st.font.size = Pt(10.5)
    st.element.rPr.rFonts.set(qn('w:eastAsia'), '微软雅黑')
    heading(doc, title, 1)
    para(doc, subtitle, size=9, color=(0x60, 0x70, 0x78))
    return doc
