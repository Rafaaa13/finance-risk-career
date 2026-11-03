/* ===== prep_31：经历库视图（回忆还原工作单） ===== */
function pst(){const p=state.prep||(state.prep={});['exp','cand','fact','fav','rew','score','stat'].forEach(k=>{p[k]=p[k]||{}});p.hist=p.hist||[];return p}
function expCounts(){const p=pst();let n=0,f=0;Object.keys(EXP_SLOT).forEach(k=>{n++;if((p.exp[k]||'').trim())f++});return{n,f}}
function expMarkdown(){
 const p=pst(),L=['# 经历核对表（由训练台导出）','',`导出时间：${new Date().toLocaleString('zh-CN')}`,'','说明：已确认事实来自我的档案；填空是我自己补充的真实信息；未填项请提示我继续回忆。',''];
 EXP.forEach(e=>{
  L.push(`## ${e.org} · ${e.dept}（${e.period}）`,'','### 事实确认');
  e.facts.forEach((t,i)=>L.push(`- [${p.fact[e.id+'.'+i]?'x':' '}] ${t}`));
  L.push('','### 我补充的信息');
  (e.slots||[]).forEach(s=>L.push(`- ${s.label}：${(p.exp[s.k]||'').trim()||'【未填】'}`));
  const cs=(e.candidates||[]).map((c,i)=>p.cand[e.id+'.'+i]?c:null).filter(Boolean);
  if(e.candidates&&e.candidates.length)L.push('','### 我真实做过的工作（勾选）',...(cs.length?cs.map(c=>`- ${c}`):['- 【未勾选】']));
  L.push('');
 });
 return L.join('\n');
}
function expCardHtml(e){
 const p=pst(),facts=e.facts.map((t,i)=>`<li><label class="check"><input type="checkbox" data-expfact="${e.id}.${i}" ${p.fact[e.id+'.'+i]?'checked':''}> ${ansEsc(t)}</label></li>`).join('');
 const slots=(e.slots||[]).map(s=>`<div class="field full"><label>${ansEsc(s.label)}</label><textarea data-expslot="${s.k}" placeholder="${ansEsc(s.ph||'')}" style="min-height:62px">${ansEsc(p.exp[s.k]||'')}</textarea><div class="fd-note">${ansEsc(s.hint)}</div></div>`).join('');
 const cands=(e.candidates||[]).length?`<div class="ans-sub">典型工作候选（只勾你真实做过的；候选不等于你做过）</div><div>${e.candidates.map((c,i)=>`<label class="check" style="display:inline-block;margin:2px 14px 2px 0"><input type="checkbox" data-expcand="${e.id}.${i}" ${p.cand[e.id+'.'+i]?'checked':''}> ${ansEsc(c)}</label>`).join('')}</div>`:'';
 const recall=(e.recall||[]).length?`<div class="ans-sub">回忆线索：去哪里找</div><ul>${e.recall.map(x=>`<li>${ansEsc(x)}</li>`).join('')}</ul>`:'';
 const caution=(e.caution||[]).length?`<div class="callout red" style="margin-top:8px"><b>口径提醒：</b><ul style="margin:4px 0 0 18px">${e.caution.map(x=>`<li>${ansEsc(x)}</li>`).join('')}</ul></div>`:'';
 const title=`<span class="ans-lab">${ansEsc(e.kind)}</span>${ansEsc(e.org)} · ${ansEsc(e.dept)}　<span class="small-copy">${ansEsc(e.period)}</span>`;
 return ansDet('exp.'+e.id,title,`<div class="ans-sub">已记录的事实（逐条核对后打勾）</div><ul class="exp-facts">${facts}</ul>${caution}<div class="ans-sub">需要你补充的信息（答案里的【待补】会用这里的内容替换）</div><div class="form-grid">${slots}</div>${cands}${recall}`);
}
function expProgressHtml(){const c=expCounts();return `已填 <b>${c.f}</b> / ${c.n} 项　<span class="meter" style="display:inline-block;width:160px;vertical-align:middle"><i style="width:${c.n?c.f/c.n*100:0}%"></i></span>`}
function renderExp(){
 const root=$('#view-exp');
 root.innerHTML=`<div class="view-head"><div><h3>经历库 · 回忆还原工作单</h3><p>这里只放你档案里已经写明的事实。实习细节记不清是常见的：我没法替你回忆当时做了什么，但能给你线索、候选和口径提醒；你把真实的内容填进来，所有面试答案里的【待补】就会自动替换成你的话。</p></div><button class="btn teal" id="expExport">导出经历核对表（Markdown）</button></div>
 <div class="ans-note"><b>为什么必须你来填：</b>客户名、数字、分工和结论是面试官最先追问、也最容易被核实的部分。由我编出来的细节，会在追问或背调时变成你的风险。填不出来的就留空：答案会写成不依赖这个细节的版本。<br><span id="expProg">${expProgressHtml()}</span></div>
 ${EXP.map(expCardHtml).join('')}`;
 root.oninput=e=>{const t=e.target.closest('[data-expslot]');if(t){pst().exp[t.dataset.expslot]=t.value;$('#expProg').innerHTML=expProgressHtml()}};
 root.onchange=e=>{const a=e.target.closest('[data-expfact]'),b=e.target.closest('[data-expcand]');if(a)pst().fact[a.dataset.expfact]=a.checked;if(b)pst().cand[b.dataset.expcand]=b.checked};
 $('#expExport').onclick=()=>{download('经历核对表.md',expMarkdown(),'text/plain;charset=utf-8');toast('已导出经历核对表')};
}
