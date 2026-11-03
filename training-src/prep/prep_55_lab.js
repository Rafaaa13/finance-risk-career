/* ===== prep_55：岗位能力训练（投行/权益/固收/银行/PE/销售交易） ===== */
const LAB_FAMS=[
 {id:'ib',name:'投行 · 估值建模',desc:'投行笔试和面试最常见的三件事：把利润年化、算隐含估值、给目标价并说清假设。练习用兆易创新 2026 年三季报的真实数据。'},
 {id:'eq',name:'权益研究 · 财报与周期',desc:'研究员的日常：从存货、合同负债、毛利率判断周期位置和改善质量。用兆易创新 2026 年逐季财务数据。'},
 {id:'fi',name:'固收 · 久期与信用',desc:'固收面试必考：久期、利差、骑乘。用 2026-10-30 中债国债与 AAA 中票曲线。'},
 {id:'bank',name:'银行 · 信贷与资产质量',desc:'信贷岗和风险岗的基础：不良率、拨备覆盖率、风险成本。用工商银行 2026 年中报数据。'},
 {id:'pe',name:'PE/VC · 估值与条款',desc:'一级市场面试：杠杆收购回报、清算优先权、反稀释。用真实结构参数练习。'},
 {id:'sales',name:'销售交易 · 报价与损益',desc:'债券销售与交易岗：DV01、买卖价差、代销费。用真实久期和报价参数。'}];
const LAB=[];
function labL(id){const e=(typeof LEDGER!=='undefined')&&LEDGER[id];return e&&typeof e[1]==='number'?e[1]:null}
function labIv(id){const q=IV.find(x=>x.id===id);return q?q.q:'（题号 '+id+' 不在题库）'}
function labF(x,d=2){return Number.isFinite(x)?Number(x).toLocaleString('zh-CN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—'}
const LAB_ST={fam:'ib',ans:{},shown:{}};
function labCheck(t){
 const d={};t.inputs.forEach(i=>{const v=parseFloat(LAB_ST.ans['in.'+t.id+'.'+i.k]);d[i.k]=Number.isFinite(v)?v:i.def});
 const r=t.calc(d);const raw=LAB_ST.ans['ans.'+t.id];const v=parseFloat(raw);
 const ok=Number.isFinite(v)&&Math.abs(v-r.answer)<=r.tol;
 LAB_ST.shown[t.id]=true;return {ok,r,entered:v};
}
function labCard(t){
 const d=LAB_ST.ans;
 const inputs=t.inputs.map(i=>{const val=d['in.'+t.id+'.'+i.k]??i.def;
  return `<label class="lab-in"><span>${ansEsc(i.label)}</span><input type="number" step="any" data-lab="in.${t.id}.${i.k}" value="${val}"><em>${ansEsc(i.unit||'')}</em>${i.src?`<a class="fd-note" href="#" data-labsrc="${i.src}" title="账本：${ansEsc(i.src)}">来源</a>`:''}</label>`}).join('');
 const shown=LAB_ST.shown[t.id];
 const chk=shown?(()=>{const r=t.calc(Object.fromEntries(t.inputs.map(i=>[i.k,parseFloat(d['in.'+t.id+'.'+i.k])||i.def])));return `<div class="lab-sol"><div class="ans-sub">解析</div><ol>${r.steps.map(s=>`<li>${s}</li>`).join('')}</ol><p><b>参考答案：</b>${labF(r.answer,r.dp??2)} ${ansEsc(r.unit||'')}</p></div>`})():'';
 return `<div class="panel lab-card"><h4>${ansEsc(t.title)}</h4><p>${t.q}</p><div class="lab-inputs">${inputs}</div>
 <div class="lab-ask"><label>你的答案<input type="number" step="any" data-lab="ans.${t.id}" value="${d['ans.'+t.id]??''}" placeholder="填数字"></label><button class="btn small teal" data-labcheck="${t.id}">检查</button><button class="btn small ghost" data-labshow="${t.id}">看解析</button><span id="labfb-${t.id}" class="small-copy"></span></div>${shown?chk:''}
 ${t.say?`<div class="callout teal" style="margin-top:8px"><b>面试里怎么讲：</b>${t.say}</div>`:''}</div>`;
}
function renderLab(){
 const root=$('#view-lab');
 const fam=LAB_FAMS.find(f=>f.id===LAB_ST.fam)||LAB_FAMS[0];
 const tabs=LAB_FAMS.map(f=>`<button data-labfam="${f.id}" class="${LAB_ST.fam===f.id?'active':''}">${f.name}</button>`).join('');
 const tasks=LAB.filter(t=>t.fam===fam.id);
 const qs=IV.filter(q=>fam.roles&&fam.roles.includes(q.role)).slice(0,4);
 const ivs=qs.map(q=>`<li><a href="#" data-labgo="${q.id}">${ansEsc(q.q)}</a>（${q.id}）</li>`).join('');
 root.innerHTML=`<div class="view-head"><div><h3>岗位能力训练</h3><p>除风险金工与公募基金之外，把投行、权益研究、固收、银行信贷、PE/VC、销售交易六类岗位的核心计算做成可动手的练习：改输入、算答案、看解析。数字来自“数据账本”的真实公开数据，算式在页面实时计算。</p></div></div>
 <div class="ans-note"><b>怎么练：</b>先自己按输入算一遍填答案，再点检查；答错不要紧，点“看解析”看步骤。每道题下面有对应的面试题号，答完去“面试对答”页把那道题也讲一遍。</div>
 <div class="fd-tabs">${tabs}</div>
 <div class="panel"><p>${fam.desc}</p></div>
 ${tasks.map(labCard).join('')}
 <div class="section-label">这一类的面试题（去“面试对答”页练习）</div><div class="panel"><ul>${ivs||'<li class="small-copy">这一类暂时没有关联题目。</li>'}</ul></div>`;
 root.querySelectorAll('[data-labfam]').forEach(b=>b.onclick=()=>{LAB_ST.fam=b.dataset.labfam;renderLab();window.scrollTo({top:0})});
 root.querySelectorAll('[data-lab]').forEach(i=>i.oninput=()=>{LAB_ST.ans[i.dataset.lab]=i.value});
 root.querySelectorAll('[data-labcheck]').forEach(b=>b.onclick=()=>{const t=LAB.find(x=>x.id===b.dataset.labcheck);const {ok,r}=labCheck(t);renderLab();const fb=$('#labfb-'+t.id);if(fb){fb.textContent=ok?'✓ 正确':'✗ 不对，看解析';fb.style.color=ok?'var(--green)':'var(--red)'}});
 root.querySelectorAll('[data-labshow]').forEach(b=>b.onclick=()=>{LAB_ST.shown[b.dataset.labshow]=true;renderLab()});
 root.querySelectorAll('[data-labgo]').forEach(a=>a.onclick=e=>{e.preventDefault();const q=IV.find(x=>x.id===a.dataset.labgo);if(!q)return;ivUI.g='all';ivUI.r=q.role||'all';ivUI.q='';ivUI.mode='browse';setView('iv')});
}
