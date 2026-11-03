/* 07_rolelib：细分岗位库（来自 面试备战/岗位库，构建时生成 data/20_rolelib.js） */
const RG={buy:'买方资管',bank:'银行与央企金融',broker:'券商与股权投资',infra:'基础设施·交易所·协会·监管'};
const RL={g:'all',q:'',city:'all',sort:'idx',open:null};
function rlScore(r){const w=(r.wlb||{}).score||3,gr=(r.growth||{}).score||3;return w+gr}
function rlSalary(r){const s=(r.salary||{}).range||'';const m=s.match(/(\d+)\s*[–\-~到至]\s*(\d+)/);return m?(+m[1]+ +m[2])/2:m?(+m[1]):0}
function rlList(){
 const q=RL.q.trim().toLowerCase();
 return ROLES.filter(r=>(RL.g==='all'||r.group===RL.g)&&(RL.city==='all'||(r.cities||[]).includes(RL.city))&&(!q||(r.role+r.org_type+JSON.stringify(r.sample_orgs||[])+r.work).toLowerCase().includes(q)))
  .sort((a,b)=>RL.sort==='sal'?rlSalary(b)-rlSalary(a):RL.sort==='q'?qCount2(b.id)-qCount2(a.id):rlScore(b)-rlScore(a));
}
function qCount2(id){const r=ROLES.find(x=>x.id===id);return r&&r.qn||0}
function rlCard(r){
 const w=r.wlb||{},g=r.growth||{},s=r.salary||{};
 const row=(k,v)=>`<tr><td><b>${k}</b></td><td>${v||'—'}</td></tr>`;
 const days=(r.typical_day||[]).map(x=>`<li>${esc(x)}</li>`).join('');
 const srcs=(r.src||[]).map(x=>`<a href="${esc(x.url)}" target="_blank" rel="noreferrer">${esc(x.t||x.url)}</a>`).join('；');
 return `<div class="panel" style="margin:10px 0"><div class="table"><table><tbody>${row('工作内容',esc(r.work))}${row('一天',days?`<ul style="margin:4px 0 0 18px">${days}</ul>`:'')}${row('WLB',`[${w.score||'-'}/5] ${esc(w.text||'')} <span class="ev">${esc(w.grade||'')}</span>`)}${row('成长',`[${g.score||'-'}/5] ${esc(g.text||'')}`)}${row('薪资',`${esc(s.range||'')}　<span class="small">${esc(s.basis||'')}</span> <span class="ev">${esc(s.grade||'')}</span>`)}${row('对口实习',esc(r.intern_fit))}${row('要求',esc(r.requirements))}${row('流程与淘汰点',esc(r.process))}${row('出口',esc(r.exit))}${row('批次与HC',esc(r.batches))}${row('证书',esc(r.certs))}${row('城市',esc((r.cities||[]).join('、')))}${row('样本机构',esc((r.sample_orgs||[]).join('、')))}${row('来源',srcs)}</tbody></table></div></div>`;
}
function viewRoleLib(){
 const rows=rlList();
 const chips=[{id:'all',n:'全部'}].concat(Object.keys(RG).map(k=>({id:k,n:RG[k]})))
  .map(k=>`<button class="chipb ${RL.g===k.id?'on':''}" data-rg="${k.id}">${k.n}<i>${k.id==='all'?ROLES.length:ROLES.filter(r=>r.group===k.id).length}</i></button>`).join('');
 const cities=[...new Set(ROLES.flatMap(r=>r.cities||[]))];
 const body=rows.map(r=>{
  const w=r.wlb||{},g=r.growth||{},s=r.salary||{};
  return `<tr><td><span class="small">${esc(r.org_type)}</span><br><b>${esc(r.role)}</b></td>
<td class="wrap">${esc(short(r.work,80))}</td>
<td>${w.score||'-'}/5</td><td>${g.score||'-'}/5</td>
<td class="wrap">${esc(short(s.range||'未核实',30))} <span class="ev">${esc(s.grade||'')}</span></td>
<td>${qCount2(r.id)||'—'}</td>
<td><button class="btn small ${RL.open===r.id?'teal':''}" data-ro="${esc(r.id)}">${RL.open===r.id?'收起':'详情'}</button></td></tr>`
   +(RL.open===r.id?`<tr><td colspan="7" style="padding:0">${rlCard(r)}</td></tr>`:'')
 }).join('');
 $('#view-rolelib').innerHTML=`<div class="head"><div><h3>细分岗位库</h3><p>46 个细分岗位的岗位卡：工作内容、节奏、成长、薪资区间（带证据等级）、对口实习、要求、招聘流程与淘汰点、出口、批次与 HC、证书与城市。与训练台的「面试对答」共用同一套岗位 id，可按岗位看对应的 12 道题。</p></div></div>
 <div class="callout teal"><b>读法：</b>薪资只给区间并标证据等级——E1/E2 来自公告、年报或权威报道，E3 是二手传闻；没查到的写“未核实”，不估算。右边“题量”是该岗位在训练台里的面试题数。</div>
 <div class="chips">${chips}</div>
 <div class="panel" style="margin-top:12px"><div class="filters">
  <div class="field"><label>关键词（岗位/机构/职责）</label><input id="rq" value="${esc(RL.q)}" placeholder="固收、投行、清算、风控…"></div>
  <div class="field"><label>城市</label><select id="rc"><option value="all">全部</option>${cities.map(c=>`<option value="${esc(c)}" ${RL.city===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div>
  <div class="field"><label>排序</label><select id="rs"><option value="idx" ${RL.sort==='idx'?'selected':''}>节奏×成长</option><option value="sal" ${RL.sort==='sal'?'selected':''}>薪资区间中枢</option><option value="q" ${RL.sort==='q'?'selected':''}>题量</option></select></div>
 </div></div>
 <div class="section">共 ${rows.length} 个岗位 · 全部为判断分或区间，证据列已标注</div>
 <div class="panel" style="padding:0"><div class="table"><table class="wide mid"><thead><tr><th>岗位</th><th>工作内容</th><th>节奏</th><th>成长</th><th>薪资</th><th>题量</th><th></th></tr></thead><tbody>${body||'<tr><td colspan="7" class="empty">没有匹配的岗位。</td></tr>'}</tbody></table></div></div>`;
 $$('[data-rg]').forEach(b=>b.onclick=()=>{RL.g=b.dataset.rg;render()});
 $$('[data-ro]').forEach(b=>b.onclick=()=>{RL.open=RL.open===b.dataset.ro?null:b.dataset.ro;render()});
 const q=$('#rq');q.oninput=()=>{RL.q=q.value;const p=q.selectionStart;render();const n=$('#rq');n.focus();n.setSelectionRange(p,p)};
 $('#rc').onchange=e=>{RL.city=e.target.value;render()};
 $('#rs').onchange=e=>{RL.sort=e.target.value;render()};
}
