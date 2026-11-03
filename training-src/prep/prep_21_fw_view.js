/* ===== prep_21：分析框架视图 ===== */
function fwDecomp(items){
 const Q0=items.reduce((s,i)=>s+i.q0,0),Q1=items.reduce((s,i)=>s+i.q1,0);
 const R0=items.reduce((s,i)=>s+i.q0*i.p0,0),R1=items.reduce((s,i)=>s+i.q1*i.p1,0);
 const Pbar0=Q0>0?R0/Q0:0;
 const vol=(Q1-Q0)*Pbar0;
 const mix=items.reduce((s,i)=>s+((Q1>0?i.q1/Q1:0)-(Q0>0?i.q0/Q0:0))*Q1*i.p0,0);
 const price=items.reduce((s,i)=>s+(i.p1-i.p0)*i.q1,0);
 return{R0,R1,dR:R1-R0,vol,mix,price,sum:vol+mix+price,gap:(R1-R0)-(vol+mix+price)};
}
function fwStepHtml(s){
 const li=a=>a.map(x=>`<li>${ansEsc(x)}</li>`).join('');
 const ftab=s.formulas&&s.formulas.length?`<div class="ans-sub">公式与方法</div><table class="ans-tbl"><thead><tr><th>名称</th><th>公式</th><th>说明</th></tr></thead><tbody>${s.formulas.map(f=>`<tr><td>${ansEsc(f.n)}</td><td>${ansEsc(f.f)}</td><td>${ansEsc(f.note)}</td></tr>`).join('')}</tbody></table>`:'';
 const tiers=s.tiers?`<div class="ans-sub">三层指标（示范清单）</div><table class="ans-tbl"><tbody>${s.tiers.map(t=>`<tr><td><b>${ansEsc(t.l)}</b></td><td>${t.items.map(ansEsc).join('；')}</td></tr>`).join('')}</tbody></table><p class="fd-note">${ansEsc(s.tierNote)}</p>`:'';
 const from=s.from&&s.from.length?`<div class="ans-sub">对应你档案里已记录的真实做法（只列已记录的事实）</div><ul>${s.from.map(f=>`<li><b>${ansEsc(f.org)}</b>：${ansEsc(f.what)}</li>`).join('')}</ul>`:'';
 const asks=(s.asks||[]).map((a,i)=>ansDet(`fw.${s.n}.a${i}`,'追问：'+ansEsc(a.q),`<p>${ansEsc(a.a)}</p>`)).join('');
 return `<div class="ans-sub">核心问题</div><p><b>${ansEsc(s.q)}</b></p><div class="ans-sub">思考过程</div><ol>${li(s.think)}</ol><div class="ans-sub">判断流程</div><ul>${li(s.judge)}</ul>${ftab}${tiers}${from}<div class="callout teal" style="margin-top:8px"><b>面试一句话：</b>${ansEsc(s.say)}</div>${asks}`;
}
function fwVariantHtml(v){
 const li=a=>a.map(x=>`<li>${ansEsc(x)}</li>`).join('');
 return `<div class="ans-sub">重点指标</div><ul>${li(v.focus)}</ul><div class="ans-sub">公式</div><table class="ans-tbl"><tbody>${v.formulas.map(f=>`<tr><td>${ansEsc(f.n)}</td><td>${ansEsc(f.f)}</td><td>${ansEsc(f.note)}</td></tr>`).join('')}</tbody></table><div class="ans-sub">判断位置的信号</div><ul>${li(v.signals)}</ul>${(v.asks||[]).map((a,i)=>`<p><b>追问：</b>${ansEsc(a.q)}<br>${ansEsc(a.a)}</p>`).join('')}`;
}
const FW_DEF=[['A','100','10','120','10.5'],['B','50','20','40','22'],['C','10','50','25','48']];
function fwCalcRead(root){
 const items=[];root.querySelectorAll('tr[data-fwr]').forEach(tr=>{const v=[...tr.querySelectorAll('input')].map(i=>parseFloat(i.value));if(v.every(Number.isFinite))items.push({q0:v[0],p0:v[1],q1:v[2],p1:v[3]})});
 return items;
}
function fwCalcOut(root){
 const out=root.querySelector('#fwOut'),items=fwCalcRead(root);if(!out)return;
 if(!items.length){out.innerHTML='<p class="fd-note">请填入数字。</p>';return}
 const r=fwDecomp(items),f=x=>x.toLocaleString('zh-CN',{maximumFractionDigits:2});
 out.innerHTML=`<table class="ans-tbl"><tbody><tr><td>基期收入 R0</td><td>${f(r.R0)}</td><td>报告期收入 R1</td><td>${f(r.R1)}</td><td>变化 ΔR</td><td><b>${f(r.dR)}</b></td></tr><tr><td>总量效应</td><td>${f(r.vol)}</td><td>结构效应</td><td>${f(r.mix)}</td><td>价格效应</td><td>${f(r.price)}</td></tr></tbody></table><p class="fd-note">三项之和 ${f(r.sum)}；与 ΔR 的差 ${f(Math.abs(r.gap)<1e-9?0:r.gap)}（应为 0，不为 0 说明输入有误）。示例数字是虚构的，仅用来演示公式。</p>`;
}
function renderFw(){
 const root=$('#view-fw');
 root.innerHTML=`<div class="view-head"><div><h3>我的分析框架 · ${ansEsc(FW.name)}</h3><p>${ansEsc(FW.tagline)}。每一步写明：思考过程、判断流程、公式方法、对应你档案里已记录的真实做法，以及面试官会怎么追问。</p></div></div>
 <div class="ans-note"><b>怎么用：</b>面试被问“你怎么分析一家公司/一个行业”时，按这七步讲；被追问到具体步骤，展开对应一节。方法来源标注为“你档案里已记录的真实做法”，没有记录的细节不要靠这张表补出来。经验阈值只是起点，按行业校准。</div>
 <div class="section-label">一页纸速记</div><div class="panel"><ol>${FW.onepager.map(x=>`<li>${ansEsc(x)}</li>`).join('')}</ol></div>
 <div class="section-label">七步详解</div>${FW.steps.map(s=>ansDet('fw.'+s.n,`<span class="ans-lab">第 ${s.n} 步</span>${ansEsc(s.name)}`,fwStepHtml(s))).join('')}
 <div class="section-label">行业变体</div>${FW.variants.map((v,i)=>ansDet('fwv.'+i,ansEsc(v.ind),fwVariantHtml(v))).join('')}
 <div class="section-label">公式演算器 · 价量结构三效应分解</div>
 <div class="panel"><table class="ans-tbl" id="fwCalc"><thead><tr><th>产品</th><th>基期销量</th><th>基期价格</th><th>报告期销量</th><th>报告期价格</th></tr></thead><tbody>${FW_DEF.map(r=>`<tr data-fwr><td>${r[0]}</td>${r.slice(1).map(v=>`<td><input type="number" step="any" value="${v}" style="width:84px"></td>`).join('')}</tr>`).join('')}</tbody></table><div id="fwOut"></div></div>`;
 fwCalcOut(root);
 root.querySelector('#fwCalc').addEventListener('input',()=>fwCalcOut(root));
}
