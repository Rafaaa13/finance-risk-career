/* ===== prep_41：面试对答 · 核心（过滤、抽题计时、自评、追问树、改写与导出） ===== */
const IV=[];
const IV_GROUPS=[{id:'common',name:'通用题（所有岗位）'},{id:'buy',name:'买方资管'},{id:'bank',name:'银行与央企金融'},{id:'broker',name:'券商与股权投资'},{id:'infra',name:'基础设施与协会'},{id:'written',name:'笔试 · 群面'}];
const IV_TYPE={real:'真题（有出处）',freq:'高频题（多源印证）',infer:'推断题（依据岗位与 JD）'};
const IV_DIMS=[['struct','结构清晰'],['data','数据具体'],['link','连到岗位'],['bound','说清边界'],['voice','表达自然']];
const ivUI={g:'all',r:'all',type:'all',q:'',fav:false,mode:'browse',cur:null,t:0,limit:180,timer:null,reveal:{}};
function ledgerSpan(id){
 if(typeof LEDGER==='undefined'||!LEDGER[id])return `<mark class="fill todo">【账本缺 ${ansEsc(id)}】</mark>`;
 const e=LEDGER[id],v=typeof e[1]==='number'?(Number.isInteger(e[1])?e[1].toLocaleString('zh-CN'):String(e[1])):ansEsc(e[1]);
 return `<span class="ledger" title="${ansEsc(e[4])}｜截至 ${ansEsc(e[3])}｜证据 ${ansEsc(e[5]||'')}">${v}${ansEsc(e[2]||'')}</span>`;
}
function slotSpan(k){
 const val=(pst().exp[k]||'').trim(),lab=EXP_SLOT[k]?EXP_SLOT[k].label:k;
 return val?`<mark class="fill ok" title="来自经历库：${ansEsc(lab)}">${ansEsc(val)}</mark>`:`<mark class="fill todo">【待补：${ansEsc(lab)}】</mark>`;
}
function ivDiff(a,b){
 if(typeof LEDGER==='undefined'||!LEDGER[a]||!LEDGER[b]||typeof LEDGER[a][1]!=='number'||typeof LEDGER[b][1]!=='number')return `<mark class="fill todo">【账本缺 ${ansEsc(a)} 或 ${ansEsc(b)}】</mark>`;
 const d=(LEDGER[a][1]-LEDGER[b][1])*100;
 return `<span class="ledger" title="${ansEsc(LEDGER[a][0])} − ${ansEsc(LEDGER[b][0])}｜${ansEsc(LEDGER[a][3])} / ${ansEsc(LEDGER[b][3])}">${Math.round(d)}bp</span>`;
}
function ivFill(raw){return ansEsc(raw).replace(/\{\{D:([A-Za-z0-9_.\-]+)~([A-Za-z0-9_.\-]+)\}\}/g,(m,a,b)=>ivDiff(a,b)).replace(/\{\{L:([A-Za-z0-9_.\-]+)\}\}/g,(m,id)=>ledgerSpan(id)).replace(/\{\{([A-Za-z0-9_.]+)\}\}/g,(m,k)=>slotSpan(k))}
function ivTokens(it){const s=JSON.stringify(it),L=[],S=[];const add=id=>{if(!L.includes(id))L.push(id)};s.replace(/\{\{D:([A-Za-z0-9_.\-]+)~([A-Za-z0-9_.\-]+)\}\}/g,(m,a,b)=>{add(a);add(b)});s.replace(/\{\{L:([A-Za-z0-9_.\-]+)\}\}/g,(m,id)=>add(id));s.replace(/\{\{([A-Za-z0-9_.]+)\}\}/g,(m,k)=>{if(!S.includes(k))S.push(k)});return{L,S}}
function ivList(){
 const p=pst();return IV.filter(it=>(ivUI.g==='all'||it.g===ivUI.g)&&(ivUI.r==='all'||it.role===ivUI.r)&&(ivUI.type==='all'||it.type===ivUI.type)&&(!ivUI.fav||p.fav[it.id])&&(!ivUI.q||(it.q+JSON.stringify(it.tags||[])).includes(ivUI.q)));
}
function ivTreeHtml(id,nodes,path){
 return `<div class="ans-tree">${nodes.map((n,i)=>{const k=id+'.'+path+i,open=ivUI.reveal[k];
  return `<div class="iv-node"><button class="btn small ${open?'':'teal'}" data-ivrev="${k}">${open?'已展开':'面试官追问'}：${ivFill(n.ask)}</button>${open?`<div class="iv-ans">${ivFill(n.ans)}</div>${n.next&&n.next.length?ivTreeHtml(id,n.next,path+i+'.'):''}`:''}</div>`}).join('')}</div>`;
}
function ivCardHtml(it,drill){
 const p=pst(),sc=p.score[it.id],tk=ivTokens(it),todo=tk.S.filter(k=>!(pst().exp[k]||'').trim()).length;
 const head=`<div class="iv-head"><span class="tag ${it.type==='real'?'':'amber'}">${IV_TYPE[it.type]||it.type}</span>${(it.tags||[]).map(t=>`<span class="tag">${ansEsc(t)}</span>`).join('')}${sc?`<span class="tag teal">自评 ${sc.avg.toFixed(1)}/5</span>`:''}${todo?`<span class="tag amber">${todo} 处待补</span>`:''}<button class="btn small ghost" data-ivfav="${it.id}">${p.fav[it.id]?'★ 已收藏':'☆ 收藏'}</button></div><h4 class="iv-q">${ivFill(it.q)}</h4>`;
 const src=(it.src||[]).length?`<p class="fd-note">出处：${it.src.map(s=>`<a href="${ansEsc(s.url)}" target="_blank" rel="noopener noreferrer">${ansEsc(s.t)}</a>（${ansEsc(s.date||'')}）`).join('；')}</p>`:'';
 const showAns=!drill||ivUI.reveal[it.id+'.ans'];
 const body=showAns?`<div class="ans-sub">30 秒要点</div><div class="iv-ans">${ivFill(it.a30)}</div>${ansDet('iv.'+it.id+'.s','2–3 分钟逐字稿（读出声，计时）',`<div class="ans-script">${ivFill(it.a180)}</div>`)}${it.tree&&it.tree.length?`<div class="ans-sub">追问树：一层层点开，先自己答再看</div>${ivTreeHtml(it.id,it.tree,'')}`:''}${it.notes?`<div class="callout" style="margin-top:8px">${ivFill(it.notes)}</div>`:''}`:`<p class="fd-note">先开口答，再点“看参考答案”。</p><button class="btn small teal" data-ivrev="${it.id}.ans">看参考答案</button>`;
 const rew=showAns?`<div class="field full" style="margin-top:8px"><label>我的改写（用自己的话重写一遍，保存在本机进度里）</label><textarea data-ivrew="${it.id}" style="min-height:70px">${ansEsc(p.rew[it.id]||'')}</textarea></div>`:'';
 const rate=showAns?`<div class="rubric iv-rate">${IV_DIMS.map(([k,n])=>`<div class="rubric-row"><span>${n}</span><input type="range" min="1" max="5" step="1" value="${(sc&&sc.dims[k])||3}" data-ivscore="${it.id}.${k}"><b>${(sc&&sc.dims[k])||3}</b></div>`).join('')}<button class="btn small" data-ivsave="${it.id}">保存自评</button></div>`:'';
 return `<div class="panel iv-card">${head}${src}${body}${rew}${rate}</div>`;
}
