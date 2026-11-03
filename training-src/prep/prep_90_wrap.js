/* ===== prep_90_wrap：给基础视图追加“参考答案与解析” ===== */
(function(){
 const NOTE='<div class="ans-note"><b>先做，再看答案。</b>下面的数字都来自本工作台自带的 160 笔合成贷款（固定随机种子），由脚本重新计算并断言过。它们是训练数据上的结果，不是任何真实机构的业务数据；看过答案的练习，不要当作你独立完成的证据。</div>';
 function mount(viewId,html){const v=$('#'+viewId);if(!v||!html)return;const w=document.createElement('div');w.className='ans-wrap';w.innerHTML=html;v.appendChild(w)}
 const head=t=>`<div class="section-label">${t}</div>${NOTE}`;
 function roadmapAns(){const A=BASE_ANS.roadmap;if(!A)return '';
  return head('参考做法 · 每周怎么做才算合格')+roadmap.map(w=>A[w.id]?ansDet('rm.'+w.id,`${ansEsc(w.week)} · ${ansEsc(w.title)}`,ansNode(A[w.id],null,'rm.'+w.id)):'').join('')}
 function listAns(title,arr,pre){if(!arr||!arr.length)return '';return head(title)+ansNode(arr,null,pre)}
 function objAns(title,obj,pre){if(!obj)return '';return head(title)+`<div class="panel">${ansNode(obj,null,pre)}</div>`}
 function sqlAns(){const A=BASE_ANS.sql;if(!A||!A.length)return '';
  return head('参考答案 · 15 道 SQL 题（均已在本页引擎里跑通）')+A.map((t,i)=>ansDet('sql.'+i,`<span class="ans-lab">L${t.level}</span>${ansEsc(t.q)}`,
   `<div class="ans-sub">参考 SQL</div><pre class="ans-pre">${ansEsc(t.sql)}</pre><button class="btn small teal" data-ans-sql="${i}">载入到上方编辑器并运行</button>`
   +(t.rows&&t.rows.length?`<div class="ans-sub">结果（前 ${t.rows.length} 行，共 ${t.rowCount} 行）</div>${ansTable(t.rows)}`:'')
   +(t.why?`<div class="ans-sub">为什么这样写</div>${ansPara(t.why)}`:''))).join('')}
 function interviewAns(){const A=BASE_ANS.interview;if(!A)return '';const i=state.interview.question,it=A[i];if(!it)return '';
  return head(`第 ${i+1} 题 · 参考回答`)+`<div class="panel"><div class="ans-sub">30 秒要点</div>${ansPara(it.a30)}`
   +ansDet('iv.'+i+'.s','2–3 分钟逐字稿',`<div class="ans-script">${ansEsc(it.a180)}</div>`)
   +ansDet('iv.'+i+'.t','追问树 · 面试官接着会问什么',ansNode(it.tree,'tree','iv.'+i+'.t'))
   +ansDet('iv.'+i+'.n','数字与来源',ansNode(it.numbers,'numbers','iv.'+i+'.n'))+'</div>'}
 const _rm=renderRoadmap;renderRoadmap=function(){_rm.apply(this,arguments);mount('view-roadmap',roadmapAns())};
 const _rk=renderRisk;renderRisk=function(){_rk.apply(this,arguments);mount('view-risk',listAns('参考答案 · 风险实验室的 10 道练习',BASE_ANS.risk,'rk'))};
 const _qt=renderQuant;renderQuant=function(){_qt.apply(this,arguments);mount('view-quant',objAns('参考答案 · 金工计算台',BASE_ANS.quant,'qt'))};
 const _sq=renderSQL;renderSQL=function(){_sq.apply(this,arguments);mount('view-sql',sqlAns());
  $$('[data-ans-sql]').forEach(b=>b.onclick=()=>{const t=BASE_ANS.sql[+b.dataset.ansSql];state.sqlQuery=t.sql;state.sqlResult=null;renderSQL();window.scrollTo({top:0});toast('参考 SQL 已载入并运行')})};
 const _lc=renderLocal;renderLocal=function(){_lc.apply(this,arguments);mount('view-local',objAns('参考答案 · 本机练习五项',BASE_ANS.local,'lc'))};
 const _pj=renderProject;renderProject=function(){_pj.apply(this,arguments);mount('view-project',objAns('参考示范 · 项目证据包',BASE_ANS.project,'pj'))};
 const _iv=renderInterview;renderInterview=function(){_iv.apply(this,arguments);mount('view-interview',interviewAns())};
})();
