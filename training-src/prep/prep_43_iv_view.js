/* ===== prep_43：面试对答视图 ===== */
const IV_PAGE={n:15};
function ivStats(){
 const p=pst(),ids=Object.keys(p.score).filter(id=>IV.some(i=>i.id===id));
 const dim={};IV_DIMS.forEach(([k])=>{const v=ids.map(id=>p.score[id].dims[k]).filter(Number.isFinite);dim[k]=v.length?v.reduce((a,b)=>a+b,0)/v.length:null});
 const weak=ids.map(id=>[id,p.score[id].avg]).sort((a,b)=>a[1]-b[1]).slice(0,5);
 return{n:ids.length,dim,weak};
}
function ivPick(){
 const p=pst(),L=ivList();if(!L.length)return null;
 const w=L.map(it=>{const s=p.score[it.id];return s?(s.avg<3.5?2:1):3}),tot=w.reduce((a,b)=>a+b,0);
 let r=Math.random()*tot;for(let i=0;i<L.length;i++){r-=w[i];if(r<=0)return L[i]}return L[L.length-1];
}
function ivMd(){
 const p=pst(),L=['# 面试对答 · 我的收藏、改写与自评','',`导出时间：${new Date().toLocaleString('zh-CN')}`,''];
 IV.filter(it=>p.fav[it.id]||p.rew[it.id]||p.score[it.id]).forEach(it=>{
  L.push(`## ${it.q}`,'',`- 类型：${IV_TYPE[it.type]||it.type}`);
  if(p.score[it.id])L.push(`- 自评：${p.score[it.id].avg.toFixed(1)}/5（${IV_DIMS.map(([k,n])=>n+p.score[it.id].dims[k]).join('，')}）`);
  if(p.rew[it.id])L.push('','我的改写：','',p.rew[it.id]);L.push('');
 });
 return L.join('\n');
}
function ivRoleGrid(){
 const cnt={};IV.forEach(q=>{if(q.role)cnt[q.role]=(cnt[q.role]||0)+1});
 return IV_GROUPS.filter(g=>['buy','bank','broker','infra'].includes(g.id)).map(g=>{
  const rs=ROLES.filter(r=>r.group===g.id);
  return `<div class="ans-sub">${ansEsc(g.name)}（${rs.length} 个岗位）</div><div class="iv-rolegrid">${rs.map(r=>`<button class="iv-rolechip ${ivUI.r===r.id?'on':''}" data-ivrole="${ansEsc(r.id)}" title="${ansEsc(r.org_type)} · ${ansEsc(r.role)}"><b>${ansEsc(r.role)}</b><span>${cnt[r.id]||0} 题</span></button>`).join('')}</div>`;
 }).join('');
}
function renderIv(){
 if(ivUI.timer){clearInterval(ivUI.timer);ivUI.timer=null}
 const root=$('#view-iv'),p=pst(),L=ivList(),st=ivStats(),drill=ivUI.mode==='drill';
 const used=new Set();IV.forEach(it=>{const t=ivTokens(it);t.L.forEach(x=>used.add(x))});
 const gsel=`<select data-ivf="g"><option value="all">全部岗位组</option>${IV_GROUPS.map(g=>`<option value="${g.id}" ${ivUI.g===g.id?'selected':''}>${g.name}（${IV.filter(i=>i.g===g.id).length}）</option>`).join('')}</select>`;
 const tsel=`<select data-ivf="type"><option value="all">全部类型</option>${Object.keys(IV_TYPE).map(k=>`<option value="${k}" ${ivUI.type===k?'selected':''}>${IV_TYPE[k]}</option>`).join('')}</select>`;
 const roleIds=[...new Set(IV.filter(i=>i.role&&(ivUI.g==='all'||i.g===ivUI.g)).map(i=>i.role))];
 const rsel=roleIds.length?`<select data-ivf="r"><option value="all">全部细分岗位</option>${roleIds.map(id=>{const r=roleById(id);return `<option value="${ansEsc(id)}" ${ivUI.r===id?'selected':''}>${ansEsc(r?r.org_type+' · '+r.role:id)}（${IV.filter(i=>i.role===id).length}）</option>`}).join('')}</select>`:'';
 const rcard=ivUI.r!=='all'?roleCardHtml(roleById(ivUI.r)):'';
 const cur=drill?(IV.find(i=>i.id===ivUI.cur)||null):null;
 const dstat=IV_DIMS.map(([k,n])=>`<div class="fd-kpi"><label>${n}</label><b>${st.dim[k]==null?'—':st.dim[k].toFixed(1)}</b></div>`).join('');
 root.innerHTML=`<div class="view-head"><div><h3>面试对答</h3><p>每道题三层：30 秒要点、2–3 分钟逐字稿、追问树。黄色【待补】来自“经历库”里你还没填的内容；带虚线下划线的数字来自“数据账本”，鼠标悬停可看出处与日期。题目类型分三档：真题（有出处）、高频题（多源印证）、推断题（依据岗位与 JD，不冒充真题）。</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ${drill?'':'teal'}" data-ivmode="browse">浏览</button><button class="btn ${drill?'teal':''}" data-ivmode="drill">抽题计时</button><button class="btn" data-ivexport="1">导出改写与自评</button></div></div>
 <div class="panel"><div class="iv-filters">${gsel}${rsel}${tsel}<input type="search" data-ivf="q" placeholder="搜索题目或标签" value="${ansEsc(ivUI.q)}"><label class="check"><input type="checkbox" data-ivf="fav" ${ivUI.fav?'checked':''}> 只看收藏</label><span class="small-copy">共 ${L.length} 题 · 用到 ${used.size} 个账本数字</span></div></div>
 ${rcard}
 ${st.n?`<div class="section-label">薄弱点统计（已自评 ${st.n} 题）</div><div class="fd-kpis">${dstat}</div>${st.weak.length?`<p class="small-copy">最需要重练：${st.weak.map(([id,a])=>`<a href="#" data-ivgo="${id}">${ansEsc((IV.find(i=>i.id===id)||{}).q||id)}（${a.toFixed(1)}）</a>`).join('；')}</p>`:''}`:''}
 ${drill?'':`<div class="section-label">按岗位进入 · 46 个细分岗位</div><div class="panel">${ivRoleGrid()}</div>`}
 ${drill?`<div class="section-label">抽题计时</div><div class="panel"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn teal" data-ivdraw="1">抽一题</button><button class="btn small ${ivUI.limit===90?'teal':''}" data-ivlim="90">90 秒</button><button class="btn small ${ivUI.limit===180?'teal':''}" data-ivlim="180">3 分钟</button><button class="btn small" data-ivtimer="1">开始 / 重置计时</button><b id="ivTimer" class="big-metric" style="font-size:22px">${String(Math.floor(ivUI.limit/60)).padStart(2,'0')}:${String(ivUI.limit%60).padStart(2,'0')}</b></div></div>${cur?ivCardHtml(cur,true):'<p class="fd-note">点“抽一题”开始。未自评和得分低的题被抽到的概率更高。</p>'}`
 :(L.length?L.slice(0,IV_PAGE.n).map(it=>ivCardHtml(it,false)).join('')+(L.length>IV_PAGE.n?`<button class="btn" data-ivmore="1">再显示 15 题（还有 ${L.length-IV_PAGE.n} 题）</button>`:''):'<div class="empty">当前筛选下没有题目。</div>')}`;
 const keep=()=>{const y=window.scrollY;renderIv();window.scrollTo({top:y})};
 root.onclick=e=>{const t=e.target;let b;
  if(b=t.closest('[data-ivrole]')){const id=b.dataset.ivrole;ivUI.r=ivUI.r===id?'all':id;ivUI.g='all';ivUI.q='';IV_PAGE.n=15;renderIv();window.scrollTo({top:0});return}
  if(b=t.closest('[data-ivmode]')){ivUI.mode=b.dataset.ivmode;renderIv();return}
  if(b=t.closest('[data-ivrev]')){const k=b.dataset.ivrev;ivUI.reveal[k]=!ivUI.reveal[k];keep();return}
  if(b=t.closest('[data-ivfav]')){const id=b.dataset.ivfav;p.fav[id]=!p.fav[id];keep();return}
  if(b=t.closest('[data-ivsave]')){const id=b.dataset.ivsave,dims={};IV_DIMS.forEach(([k])=>{const r=root.querySelector(`[data-ivscore="${id}.${k}"]`);dims[k]=+r.value});p.score[id]={dims,avg:Object.values(dims).reduce((a,c)=>a+c,0)/5,ts:Date.now()};toast('自评已保存');keep();return}
  if(b=t.closest('[data-ivdraw]')){const it=ivPick();ivUI.cur=it?it.id:null;ivUI.reveal={};renderIv();return}
  if(b=t.closest('[data-ivlim]')){ivUI.limit=+b.dataset.ivlim;renderIv();return}
  if(b=t.closest('[data-ivtimer]')){if(ivUI.timer)clearInterval(ivUI.timer);ivUI.t=ivUI.limit;const tick=()=>{const el=$('#ivTimer');if(!el){clearInterval(ivUI.timer);return}ivUI.t--;const s=Math.max(0,ivUI.t);el.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');if(ivUI.t<=0){clearInterval(ivUI.timer);el.style.color='var(--red)';toast('时间到')}};ivUI.timer=setInterval(tick,1000);return}
  if(b=t.closest('[data-ivmore]')){IV_PAGE.n+=15;keep();return}
  if(b=t.closest('[data-ivgo]')){e.preventDefault();ivUI.mode='drill';ivUI.cur=b.dataset.ivgo;ivUI.reveal={};renderIv();return}
  if(b=t.closest('[data-ivexport]')){download('面试对答-我的改写与自评.md',ivMd(),'text/plain;charset=utf-8');toast('已导出');return}
 };
 root.oninput=e=>{const t=e.target;
  if(t.dataset.ivrew){p.rew[t.dataset.ivrew]=t.value;return}
  if(t.dataset.ivscore){t.nextElementSibling.textContent=t.value;return}
  if(t.dataset.ivf==='q'){ivUI.q=t.value;IV_PAGE.n=15;const pos=t.selectionStart;renderIv();const n=root.querySelector('[data-ivf="q"]');n.focus();n.setSelectionRange(pos,pos)}
 };
 root.onchange=e=>{const t=e.target;if(t.dataset.ivf==='g'){ivUI.g=t.value;ivUI.r='all';IV_PAGE.n=15;renderIv()}else if(t.dataset.ivf==='r'||t.dataset.ivf==='type'){ivUI[t.dataset.ivf]=t.value;IV_PAGE.n=15;renderIv()}if(t.dataset.ivf==='fav'){ivUI.fav=t.checked;renderIv()}};
}
