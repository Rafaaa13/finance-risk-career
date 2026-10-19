function chipsFor(ids){return ids.map(id=>{const c=coBy(id);return c?`<button class="chipb" data-co="${id}">${esc(c.n)}</button>`:''}).join('')}
function viewPaths(){
 $('#view-paths').innerHTML=`<div class="head"><div><h3>职业走廊</h3><p>每条走廊列出：从哪里进、能横向去哪、需要什么能力、哪里有门槛，并链接到真实的公司与岗位记录。点击机构名查看详情。</p></div></div>
${PATHS.map(p=>`<div class="panel" style="margin-bottom:16px"><div class="panel-head"><div><h4 style="font-size:20px">${p.t}</h4><p style="margin:4px 0 0">${p.one}</p></div></div>
<div class="callout teal"><b>适合谁：</b>${p.who}</div>
<div class="steps">${p.steps.map((s,i)=>`<div class="stepc"><div class="stephead"><b>${i+1}　${s.h}</b></div><p>${s.how}</p><div class="chips">${chipsFor(s.co)}</div><dl class="kv"><dt>要补的能力</dt><dd>${s.skill}</dd><dt>门槛与限制</dt><dd>${s.gate}</dd></dl></div>`).join('')}</div>
<dl class="kv" style="margin-top:12px"><dt>对口实习</dt><dd>${p.intern}</dd><dt>未来8周</dt><dd>${p.now}</dd></dl></div>`).join('')}
<div class="section">单向门与序列差异</div><div class="panel"><dl class="kv">${GATES.map(g=>`<dt>${g[0]}</dt><dd>${g[1]}</dd>`).join('')}</dl></div>`;
 $$('[data-co]').forEach(b=>b.onclick=()=>{ST.sel=b.dataset.co;setView('detail')});
}
function viewTimeline(){
 const now=new Date();now.setHours(0,0,0,0);
 const rows=DEADLINES.map(d=>{const dt=new Date(d[0]+'T00:00:00'),diff=Math.round((dt-now)/864e5),st=diff<0?tag('已过','red'):diff<=7?tag('剩'+diff+'天','amber'):tag('剩'+diff+'天','blue');
  return `<tr><td>${d[0]}</td><td>${st}</td><td class="wrap"><b>${esc(d[1])}</b><br><span class="small">${esc(d[3])}</span></td><td>${badge(d[4])}</td><td>${coBy(d[2])?`<button class="btn small" data-co="${d[2]}">查看</button>`:''}</td></tr>`}).join('');
 $('#view-timeline').innerHTML=`<div class="head"><div><h3>时间线</h3><p>上半部是已核实的招聘节点（按今天自动标注已过/剩余天数）；下半部是硕士第一年/第二年秋招的倒排。已过的截止日说明：同一机构的下一届公告大多在次年同期出现，可作参照而不是承诺。</p></div></div>
<div class="panel" style="padding:0"><div class="table"><table><thead><tr><th>日期</th><th>状态</th><th>事项</th><th>证据</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>
<div class="section">倒排计划</div><div class="grid2">
<div class="panel"><div class="panel-head"><h4>方案 A：硕士第一年秋招</h4>${tag('2027秋招','blue')}</div><p>现在—2027.06：一段4–8个月金融核心实习（风险/数据/基础设施/ALM）。<br>2027.03–06：必要时补短而硬的数据或模型项目。<br>2027.07–08：材料冻结。<br>2027.09–10：全面秋招；国考报名同步。</p></div>
<div class="panel"><div class="panel-head"><h4>方案 B：硕士第二年秋招</h4>${tag('2028秋招','amber')}</div><p>现在—2027.06：长期锚点实习。<br>2027.08–2028.06：结合课程补实习与项目。<br>2028.06–08：高质量暑期实习（含正式headcount）。<br>2028.08–10：集中秋招。</p></div></div>
<div class="section">能力闸门</div><div class="grid3"><div class="panel"><h4>现在</h4><p>Python/SQL、PD/LGD/EAD、数据字典、一个可复现项目。</p></div><div class="panel"><h4>硕士前</h4><p>一个风险或金工作品、一次独立复算、一段说得清个人贡献的实习。</p></div><div class="panel"><h4>秋招前</h4><p>90秒讲清项目；回答方法、结果、局限追问。</p></div></div>`;
 $$('[data-co]').forEach(b=>b.onclick=()=>{ST.sel=b.dataset.co;setView('detail')});
}
function viewSources(){
 const seen=new Set(),rows=[];
 CO.forEach(c=>c.src.forEach(s=>{if(seen.has(s[1]))return;seen.add(s[1]);rows.push([c.n,s[0],s[1]])}));
 $('#view-sources').innerHTML=`<div class="head"><div><h3>证据与口径</h3><p>共 ${rows.length} 条去重来源。证据等级写在每条数据旁边：E1 官方一手，E2 权威转载或媒体，E3 高校/第三方转载，ND 未公开或未核实。</p></div></div>
<div class="callout red"><b>重要：</b>招聘页会下线，薪资/WLB/裁员判断不构成保证。官方页面打不开或需 JS 渲染时，本工作台不会替你补数字。</div>
<div class="section">来源账本</div><div class="panel" style="padding:0"><div class="table"><table><thead><tr><th>机构</th><th>来源</th><th>链接</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td class="wrap">${esc(r[1])}</td><td><a href="${esc(r[2])}" target="_blank" rel="noreferrer">打开</a></td></tr>`).join('')}</tbody></table></div></div>
<div class="section">全部未核实项</div><div class="panel"><ul class="goal">${CO.filter(c=>c.gap.length).map(c=>`<li><b>${esc(c.n)}：</b>${esc(c.gap.join('；'))}</li>`).join('')}</ul></div>`;
}
