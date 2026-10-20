function renderFund(){
 const f=fdState(),root=$('#view-fund'),v=FDV[f.tab]||FDV.home;
 const tabs=FD.tabs.map(([k,n])=>`<button data-fdtab="${k}" class="${f.tab===k?'active':''}">${n}${fdDone(k)?'<span class="dot"></span>':''}</button>`).join('');
 root.innerHTML=`<div class="view-head"><div><h3>公募基金岗位训练</h3><p>面向研究员、基金经理助理、固收、基金研究/FOF、风控合规与产品岗位。每个模块都是“读真实数据 → 动手算 → 客观验收 → 写出自己的判断”。数据是 ${FR.snap} 抓取的真实公开快照（${FR.funds.length} 只基金、${FR.stocks.length} 家A股、指数与国债收益率），口径与已知问题都写在“数据·来源与质检”。</p></div></div><div class="fd-tabs">${tabs}</div><div id="fd-body">${v.render()}</div>`;
 root.onclick=e=>{
  const t=e.target.closest('[data-fdtab]');if(t){f.tab=t.dataset.fdtab;renderFund();window.scrollTo({top:0});return}
  const q=e.target.closest('[data-qcheck]');if(q){fdCheck(q.dataset.qcheck,root,q);return}
  const a=e.target.closest('[data-fdact]');if(a&&v.act){e.preventDefault();v.act(a.dataset.fdact,a.dataset.arg,a)}
 };
 root.oninput=e=>{const t=e.target.closest('[data-fdin]');if(t&&v.set)v.set(t.dataset.fdin,t.value,t,'input')};
 root.onchange=e=>{const t=e.target.closest('[data-fdin]');if(t&&v.set)v.set(t.dataset.fdin,t.value,t,'change')};
 if(v.bind)v.bind(root);
}
function fdOut(html){const n=$('#fd-out');if(n)n.innerHTML=html}
function fdMemoBox(key,label,ph,rows){const f=fdState();return `<div class="field full fd-memo"><label>${label}</label><textarea data-fdin="memo:${key}" placeholder="${esc(ph||'')}" ${rows?`style="min-height:${rows}px"`:''}>${esc(f.memo[key]||'')}</textarea></div>`}
function fdMemoSet(name,val){const f=fdState();if(name.startsWith('memo:')){f.memo[name.slice(5)]=val;return true}return false}
function fdDownload(name,text){download(name,text,'text/plain;charset=utf-8');toast('已下载 '+name)}
