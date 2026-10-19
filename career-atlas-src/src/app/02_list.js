function viewCompanies(){
 const rm=rankMap(),rows=list(),cats=[{id:'all',n:'全部'},...CATS];
 const chips=cats.map(k=>{const n=k.id==='all'?CO.length:CO.filter(c=>c.cat===k.id).length;return `<button class="chipb ${ST.cat===k.id?'on':''}" data-cat="${k.id}">${k.n}<i>${n}</i></button>`}).join('');
 const note=ST.cat==='all'?'':`<div class="callout teal" style="margin-top:12px"><b>${catOf(ST.cat).n}：</b>${catOf(ST.cat).d}</div>`;
 const body=rows.map(c=>{const pv=payVal(c),inC=ST.cmp.includes(c.id);
  return `<tr><td class="num"><b>${rm[c.id]}</b><br><span class="small">${catOf(c.cat).n}</span></td>
<td><b>${esc(c.n)}</b><br><span class="small">${esc(short(c.why,44))}</span></td>
<td><b>${idx(c).toFixed(2)}</b><div class="bar mini"><i style="width:${idx(c)/5*100}%"></i></div></td>
<td>${comp(c).toFixed(1)}/5<div class="bar mini amber"><i style="width:${comp(c)/5*100}%"></i></div></td>
<td class="wrap">${badge(c.hc[1])} ${esc(short(c.hc[0],62))}</td>
<td>${pv?`≈${pv}万 ${badge(c.pay[1])}`:'<span class="small">未披露/未核实</span>'}</td>
<td class="wrap">${esc(short(c.req.deg,34))}<br><span class="small">实习：${esc(short(c.req.int,28))}</span><br><span class="small">${esc(short(c.time,40))}</span></td>
<td><button class="btn small" data-co="${c.id}">查看</button> <button class="btn small ${inC?'teal':''}" data-cmp="${c.id}">${inC?'已对比':'对比'}</button></td></tr>`}).join('');
 const pend=PENDING.filter(p=>ST.cat==='all'||p[0]===ST.cat).map(p=>`<tr><td>${esc(catOf(p[0]).n)}</td><td><b>${esc(p[1])}</b></td><td class="wrap">${esc(p[2])}</td><td>${p[3]?`<a href="${esc(p[3])}" target="_blank" rel="noreferrer">官方入口</a>`:'—'}</td></tr>`).join('');
 $('#view-companies').innerHTML=`<div class="head"><div><h3>公司排名与具体岗位</h3><p>先选类别，再看类内排名。排名分来自对“稳定、节奏、成长、薪酬、适配、进入难度”的判断；右侧证据完整度告诉你有多少字段被官方来源核实。</p></div>
<div class="pillrow"><button class="btn ${ST.mode==='stable'?'teal':''}" data-mode="stable">稳健优先</button><button class="btn ${ST.mode==='growth'?'teal':''}" data-mode="growth">成长/薪酬优先</button></div></div>
<div class="chips">${chips}</div>${note}
<div class="panel" style="margin-top:14px"><div class="filters"><div class="field"><label>关键词（机构/岗位/职责）</label><input id="fq" value="${esc(ST.q)}" placeholder="风险、金融科技、清算、研究…"></div>
<div class="field"><label>排序</label><select id="fs"><option value="idx">综合指数</option><option value="comp">证据完整度</option><option value="en">进入容易度</option><option value="st">稳定性</option><option value="pa">薪酬上限</option></select></div>
<div class="field"><label>筛选</label><label class="check"><input id="fhc" type="checkbox" ${ST.onlyHC?'checked':''}> 仅看官方已披露HC</label></div>
<div class="field"><label>导出</label><button class="btn" id="fcsv">导出当前列表 CSV</button></div></div></div>
<div class="section">共 ${rows.length} 家 · 指数为判断分，证据列为事实核验</div>
<div class="panel" style="padding:0"><div class="table"><table class="wide mid"><thead><tr><th>类内排名</th><th>机构与一句话理由</th><th>综合指数</th><th>证据完整度</th><th>HC（含口径）</th><th>年报人均薪酬</th><th>学历 / 实习 / 时间</th><th></th></tr></thead><tbody>${body||'<tr><td colspan="8" class="empty">没有结果，放宽筛选。</td></tr>'}</tbody></table></div></div>
<div class="section">待核实名录（官方入口已列出，具体数据本次未核实）</div>
<div class="panel" style="padding:0"><div class="table"><table><thead><tr><th>类别</th><th>机构</th><th>已知信息 / 缺口</th><th>入口</th></tr></thead><tbody>${pend||'<tr><td colspan="4" class="empty">该类别暂无待核实项。</td></tr>'}</tbody></table></div></div>`;
 $$('[data-cat]').forEach(b=>b.onclick=()=>{ST.cat=b.dataset.cat;render()});
 const q=$('#fq');q.oninput=()=>{ST.q=q.value;const p=q.selectionStart;render();const n=$('#fq');n.focus();n.setSelectionRange(p,p)};
 const s=$('#fs');s.value=ST.sort;s.onchange=()=>{ST.sort=s.value;render()};
 $('#fhc').onchange=e=>{ST.onlyHC=e.target.checked;render()};$('#fcsv').onclick=exportCSV;
 $$('[data-mode]').forEach(b=>b.onclick=()=>{ST.mode=b.dataset.mode;save();render()});
 $$('[data-co]').forEach(b=>b.onclick=()=>{ST.sel=b.dataset.co;setView('detail')});
 $$('[data-cmp]').forEach(b=>b.onclick=()=>toggleCmp(b.dataset.cmp));
}
function toggleCmp(id){const i=ST.cmp.indexOf(id);if(i>=0)ST.cmp.splice(i,1);else if(ST.cmp.length<4)ST.cmp.push(id);else{toast('最多同时对比 4 家');return}save();render()}
