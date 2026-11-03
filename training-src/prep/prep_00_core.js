/* ===== prep_00_core：通用答案渲染器与 BASE_ANS 声明 ===== */
const BASE_ANS={};
const ANS_OPEN=new Set();
const ANS_LABEL={q:'问题',steps:'步骤',result:'结果',say:'面试里怎么说',a30:'30 秒要点',a180:'2–3 分钟逐字稿',tree:'追问树',ask:'面试官追问',ans:'回答',next:'接着追问',numbers:'数字与来源',sql:'参考 SQL',rows:'结果（前几行）',rowCount:'结果总行数',why:'为什么这样写',formulas:'公式',checks:'验证',answer:'答案',defaultRun:'默认参数的计算结果',pitfalls:'易错点',selfcheck:'验收问题',deliver:'交付物',cmd:'命令',expect:'预期输出',pass:'怎样算通过',findings:'发现（示范）',sample90s:'90 秒口述（示范）',bullets:'简历 bullet（按真实完成情况修改）',note:'说明',level:'难度',vintageSql:'按放款年份汇总',mcSeedCheck:'换种子复核 MC',code:'代码',run:'运行方式',explain:'解释'};
function ansEsc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function ansPara(s){return String(s).split(/\n{2,}/).map(p=>`<p>${ansEsc(p).replace(/\n/g,'<br>')}</p>`).join('')}
function ansTable(rows){const ks=Object.keys(rows[0]);return `<table class="ans-tbl"><thead><tr>${ks.map(k=>`<th>${ansEsc(k)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${ks.map(k=>`<td>${ansEsc(typeof r[k]==='number'?(Number.isInteger(r[k])?r[k].toLocaleString('zh-CN'):+r[k].toFixed(6)):r[k])}</td>`).join('')}</tr>`).join('')}</tbody></table>`}
function ansDet(id,title,bodyHtml,open){const o=open||ANS_OPEN.has(id);return `<details class="ans-det" data-ansk="${ansEsc(id)}" ${o?'open':''}><summary>${title}</summary><div class="ans-body">${bodyHtml}</div></details>`}
/* 递归渲染：字符串→段落；字符串数组→列表；对象数组→折叠项；对象→带标签的小节 */
function ansNode(v,key,path){
 if(v==null)return '';
 if(typeof v==='number'||typeof v==='boolean')return `<p>${ansEsc(v)}</p>`;
 if(typeof v==='string'){
  if(key==='sql'||key==='code'||key==='cmd'||key==='run')return `<pre class="ans-pre">${ansEsc(v)}</pre>`;
  if(key==='a180')return `<div class="ans-script">${ansEsc(v)}</div>`;
  return ansPara(v);
 }
 if(Array.isArray(v)){
  if(!v.length)return '';
  if(typeof v[0]==='string'||typeof v[0]==='number'){const tag=key==='steps'?'ol':'ul';return `<${tag}>${v.map(x=>`<li>${ansEsc(x)}</li>`).join('')}</${tag}>`}
  if(key==='rows'&&v.every(r=>r&&typeof r==='object'&&!Array.isArray(r)))return ansTable(v);
  if(key==='tree'||key==='next')return `<div class="ans-tree">${v.map((n,i)=>ansDet(path+'.'+i,'追问：'+ansEsc(n.ask),`${n.ans?ansNode(n.ans,'ans',path):''}${n.next?ansNode(n.next,'next',path+'.'+i):''}`)).join('')}</div>`;
  return v.map((it,i)=>{const t=it.q||it.ask||it.title||('第 '+(i+1)+' 项');return ansDet(path+'.'+i,(it.level?`<span class="ans-lab">L${it.level}</span>`:'')+ansEsc(t),ansNode(it,null,path+'.'+i))}).join('');
 }
 return Object.keys(v).filter(k=>k!=='q'&&k!=='level'&&!(k==='ask'&&key==null)).map(k=>{
  const c=v[k];if(c==null||(Array.isArray(c)&&!c.length))return '';
  const lab=ANS_LABEL[k]||k,inline=typeof c==='string'&&c.length<90&&!/\n/.test(c)&&!['sql','code','cmd','run','a180'].includes(k);
  return inline?`<p><span class="ans-lab">${ansEsc(lab)}</span>${ansEsc(c)}</p>`:`<div class="ans-sub">${ansEsc(lab)}</div>${ansNode(c,k,path+'.'+k)}`;
 }).join('');
}
document.addEventListener('toggle',e=>{const d=e.target;if(d&&d.dataset&&d.dataset.ansk){d.open?ANS_OPEN.add(d.dataset.ansk):ANS_OPEN.delete(d.dataset.ansk)}},true);
