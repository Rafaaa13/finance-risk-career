# -*- coding: utf-8 -*-
# 追加：Excel 岗位对比矩阵
def build_xlsx():
    wb = Workbook(); ws = wb.active; ws.title = '岗位矩阵'
    head = ['岗位组','组织类型','细分岗位','工作内容','工作节奏WLB','成长性','薪资范围','对口实习','岗位要求',
            '招聘流程与淘汰点','出口与下一跳','批次节点与HC','证书','城市','样本机构','题量','真题','高频','推断','来源']
    ws.append(head)
    G = {'buy':'买方资管','bank':'银行与央企金融','broker':'券商与股权投资','infra':'基础设施·交易所·协会·监管'}
    by = {};
    for q in IV: by.setdefault(q.get('role'), []).append(q)
    rows = 0
    for r in ROLES:
        qs = by.get(r['id'], [])
        w = r.get('wlb') or {}; g = r.get('growth') or {}; s = r.get('salary') or {}
        src = '；'.join(x.get('url','') for x in (r.get('src') or [])[:3])
        ws.append([
            G.get(r.get('group'), r.get('group')), r.get('org_type'), r.get('role'),
            fill(r.get('work','')), f"[{w.get('score','')}] {fill(w.get('text',''))}（{w.get('grade','')}）",
            f"[{g.get('score','')}] {fill(g.get('text',''))}",
            f"{fill(s.get('range',''))}（{s.get('grade','')}）",
            fill(r.get('intern_fit','')), fill(r.get('requirements','')), fill(r.get('process','')),
            fill(r.get('exit','')), fill(r.get('batches','')), fill(r.get('certs','')),
            '、'.join(r.get('cities') or []), '、'.join((r.get('sample_orgs') or [])[:6]),
            len(qs), sum(1 for q in qs if q.get('type')=='real'), sum(1 for q in qs if q.get('type')=='freq'),
            sum(1 for q in qs if q.get('type')=='infer'), src])
        rows += 1
    widths = [12,14,26,60,40,30,30,34,34,40,30,32,18,14,26,6,6,6,6,50]
    style_sheet(ws, widths, head)
    ws.freeze_panes = 'C2'
    ws.auto_filter.ref = ws.dimensions

    ws2 = wb.create_sheet('题目索引')
    h2 = ['编号','岗位组','细分岗位','类型','题目','标签','字数(a180)','来源链接']
    ws2.append(h2)
    role_by = {r['id']: r for r in ROLES}
    for q in IV:
        if not q.get('role'): continue
        r = role_by.get(q['role'], {})
        ws2.append([q['id'], G.get(q.get('g'), q.get('g')), r.get('role', q['role']), q.get('type'),
                    fill(q.get('q','')), '、'.join(q.get('tags') or []), len(q.get('a180','')),
                    '；'.join(x.get('url','') for x in (q.get('src') or [])[:2])])
    style_sheet(ws2, [10,12,26,8,60,18,9,50], h2)
    ws2.freeze_panes = 'A2'; ws2.auto_filter.ref = ws2.dimensions

    ws3 = wb.create_sheet('TMT公司')
    h3 = ['类别','市场','公司','代码','数据截至','业务定位','估值拆解','证伪条件数','追问数']
    ws3.append(h3)
    SEG = {'up_chip':'上游·AI芯片','up_fab':'上游·制造·存储·设备','up_net':'上游·光互联·服务器·数据中心·电信',
           'mid_cloud':'中游·云与算力服务','mid_model':'中游·大模型与平台','down_app':'下游·AI应用与软件',
           'down_dev':'下游·终端·入口·平台','fin_ai':'金融AI与金融科技'}
    for c in TMT:
        ws3.append([SEG.get(c.get('seg')), {'CN':'A股','HK':'港股','US':'美股','PV':'未上市'}.get(c.get('mkt')),
                    c.get('name'), c.get('ticker',''), c.get('asof',''), fill(c.get('position',''))[:200],
                    fill((c.get('valuation') or {}).get('text',''))[:200], len(c.get('kill') or []), len(c.get('asks') or [])])
    style_sheet(ws3, [26,8,14,12,12,60,60,10,8], h3)
    p = OUT / '岗位对比矩阵.xlsx'; wb.save(p); return p

def style_sheet(ws, widths, head):
    thin = Side(style='thin', color='D9E2E1')
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    for c in ws[1]:
        c.font = Font(name='微软雅黑', size=10, bold=True, color='FFFFFF')
        c.fill = PatternFill('solid', fgColor='1F5C66')
        c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.font = Font(name='微软雅黑', size=9)
            c.alignment = Alignment(vertical='top', wrap_text=True)
            c.border = Border(bottom=thin)
    ws.row_dimensions[1].height = 26
