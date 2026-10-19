function viewOverview(){
 const rm=rankMap(),E1=CO.filter(c=>c.hc[1]==='E1').length,PAY=CO.filter(c=>payVal(c)).length;
 const top=CATS.map(k=>{const a=CO.filter(c=>c.cat===k.id).sort((x,y)=>idx(y)-idx(x));return a[0]?`<tr><td>${k.n}</td><td><b>${esc(a[0].n)}</b><br><span class="small">${esc(short(a[0].why,48))}</span></td><td>${idx(a[0]).toFixed(2)}</td><td>${comp(a[0]).toFixed(1)}/5</td><td><button class="btn small" data-co="${a[0].id}">查看</button></td></tr>`:''}).join('');
 $('#view-overview').innerHTML=`<div class="head"><div><h3>先看类别，再看公司，最后看岗位</h3><p>这份数据把“事实”和“判断”分开：HC、年报薪酬、学历英语实习要求只收录能指到官方页面的内容；稳定、节奏、成长、适配与排名是判断分，会明确标注。</p></div><button class="btn teal" data-jump="companies">打开公司与岗位</button></div>
<div class="grid2"><div class="panel dark"><div class="eyebrow">Coverage / 覆盖与可信度</div><h4 style="font-size:21px;margin-top:8px">${CO.length} 家有详细记录 · ${PENDING.length} 组待核实名录</h4>
<p>其中 ${E1} 家有官方一手披露的 HC；${PAY} 家有可复算的年报人均薪酬。其余为“未披露/未核实”，不会被估算填满。</p>
<div class="grid3" style="margin-top:16px"><div><div class="small">类别</div><div class="metric">${CATS.length}</div></div><div><div class="small">岗位族谱</div><div class="metric">${roles.length}</div></div><div><div class="small">具体岗位条目</div><div class="metric">${CO.reduce((a,c)=>a+c.pos.length,0)}</div></div></div></div>
<div class="panel"><div class="panel-head"><h4>三条使用规则</h4></div><ul class="goal"><li>HC 只在公告写明时才显示数字；逐岗相加的会标“计算值”。</li><li>年报“人均薪酬”只是公司层面均摊（口径不同不能跨类比），不是校招起薪。</li><li>WLB 没有权威公开统计，只给“工作节奏”判断分，并说明是判断。</li></ul></div></div>
<div class="section">每个类别的当前第一名（${ST.mode==='stable'?'稳健优先':'成长/薪酬优先'}）</div>
<div class="panel" style="padding:0"><div class="table"><table><thead><tr><th>类别</th><th>机构与理由</th><th>指数</th><th>证据</th><th></th></tr></thead><tbody>${top}</tbody></table></div></div>
<div class="section">三种薪酬口径，不要混比</div>
<div class="grid3"><div class="panel"><h4>现金流口径</h4><p>国有大行：支付给职工的现金÷年末员工数，是全年现金流出的近似，含福利社保，不等于工资。</p></div><div class="panel"><h4>费用口径</h4><p>招行、兴业、中信银行：员工费用或职工薪酬费用÷员工数，通常高于现金流口径。</p></div><div class="panel"><h4>应付职工薪酬口径</h4><p>券商、保险：本年增加额÷年末员工数；员工口径可能含经纪人、派遣或排除代理人，需看说明。</p></div></div>`;
 $$('[data-co]').forEach(b=>b.onclick=()=>{ST.sel=b.dataset.co;setView('detail')});
}
function viewRoles(){
 const g=ST.roleGroup,q=ST.roleQ.trim().toLowerCase();
 const rr=roles.filter(r=>(g==='全部'||r.group===g)&&(!q||(r.family+r.title+r.employers+r.work+r.skill).toLowerCase().includes(q)));
 const rows=rr.map(r=>{const o=ST.roleOpen===r.id;return `<tr><td><b>${esc(r.family)}</b><br><span class="small">${esc(r.title)}</span></td><td>${esc(r.group)}</td><td>${tag(r.tier,r.tier.startsWith('推荐')?'':'amber')}</td><td>${r.difficulty}/5</td><td>${tag(r.hcLevel,r.hcLevel==='L5'?'amber':'blue')}</td><td><button class="btn small" data-role="${r.id}">${o?'收起':'展开'}</button></td></tr>${o?`<tr><td colspan="6" class="detailrow"><dl class="kv"><dt>典型雇主</dt><dd>${esc(r.employers)}</dd><dt>工作内容</dt><dd>${esc(r.work)}</dd><dt>学历</dt><dd>${esc(r.degree)}</dd><dt>能力</dt><dd>${esc(r.skill)}</dd><dt>HC口径</dt><dd>${esc(r.hc)}（${esc(r.hcProof)}）</dd><dt>周期</dt><dd>${esc(r.cycle)}</dd><dt>判断分</dt><dd>稳定${r.stable} · 抗周期${r.cycleRisk} · 节奏${r.wlb} · 成长${r.growth} · 薪酬${r.pay}</dd></dl></td></tr>`:''}`}).join('');
 $('#view-roles').innerHTML=`<div class="head"><div><h3>岗位族谱（${roles.length} 类）</h3><p>从职业类型看全景；具体到机构与岗位请回到“公司与岗位”。此处 HC 等级 L1–L5 是相对规模，不是精确人数。</p></div></div>
<div class="panel"><div class="filters"><div class="field"><label>体系</label><select id="rg"><option>全部</option><option>金融机构</option><option>泛体制</option><option>科技与金融</option></select></div><div class="field"><label>关键词</label><input id="rq" value="${esc(ST.roleQ)}"></div></div></div>
<div class="section">${rr.length} 类</div><div class="panel" style="padding:0"><div class="table"><table><thead><tr><th>岗位族</th><th>体系</th><th>层级</th><th>难度</th><th>HC等级</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
 const sg=$('#rg');sg.value=g;sg.onchange=()=>{ST.roleGroup=sg.value;render()};
 const sq=$('#rq');sq.oninput=()=>{ST.roleQ=sq.value;const p=sq.selectionStart;render();const n=$('#rq');n.focus();n.setSelectionRange(p,p)};
 $$('[data-role]').forEach(b=>b.onclick=()=>{ST.roleOpen=ST.roleOpen===b.dataset.role?null:b.dataset.role;render()});
}
