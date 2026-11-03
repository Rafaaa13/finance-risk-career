/* ===== prep_44：TMT 洞见视图（深度版公司卡） ===== */
const TMT_UI={seg:'all',mkt:'all',q:''};
function tmtTbl(t){
 if(!t||!t.rows||!t.rows.length)return '';
 return `<div class="table-wrap"><table class="ans-tbl"><thead><tr>${(t.head||[]).map(h=>`<th>${ansEsc(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r=>`<tr>${r.map(c=>`<td>${ivFill(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function tmtCardHtml(c){
 const f=ivFill,li=a=>(a||[]).map(x=>`<li>${f(x)}</li>`).join('');
 const sub=(t,b)=>b?`<div class="ans-sub">${t}</div>${b}`:'';
 return sub('业务定位',`<p>${f(c.position)}</p>`)
  +sub('最新财务与经营数据（数字来自数据账本，悬停看出处）',tmtTbl(c.fin))
  +sub('竞争格局',`<p>${f(c.landscape)}</p>`)
  +sub('估值拆解',`${c.valuation&&c.valuation.text?`<p>${f(c.valuation.text)}</p>`:''}${tmtTbl(c.valuation)}`)
  +sub('熊 / 基准 / 牛 三种情景（概率是判断，不是统计结果）',c.scen&&c.scen.length?`<table class="ans-tbl"><thead><tr><th>情景</th><th>概率</th><th>关键假设</th><th>对公司/估值的含义</th></tr></thead><tbody>${c.scen.map(s=>`<tr><td><b>${ansEsc(s.n)}</b></td><td>${ansEsc(s.p)}</td><td>${f(s.v)}</td><td>${f(s.why)}</td></tr>`).join('')}</tbody></table>`:'')
  +sub('同行对比',tmtTbl(c.peers))
  +sub('两条可以在面试里讲的洞见',(c.insights||[]).map((x,i)=>ansDet(`tmt.${c.id}.i${i}`,f(x.t),`<p>${f(x.b)}</p>`)).join(''))
  +sub('证伪条件：出现什么就说明我错了',`<ul>${li(c.kill)}</ul>`)
  +sub('面试官可能追问',(c.asks||[]).map((a,i)=>ansDet(`tmt.${c.id}.a${i}`,'追问：'+f(a.q),`<p>${f(a.a)}</p>`)).join(''));
}
function renderTmt(){
 const root=$('#view-tmt');
 const q=TMT_UI.q.trim(),L=TMT.filter(c=>(TMT_UI.seg==='all'||c.seg===TMT_UI.seg)&&(TMT_UI.mkt==='all'||c.mkt===TMT_UI.mkt)&&(!q||(c.name+c.ticker+(c.tags||[]).join('')).includes(q)));
 const cnt=TMT_SEGS.map(s=>`<div class="fd-kpi"><label>${ansEsc(s.name)}</label><b class="${TMT.filter(c=>c.seg===s.id).length>=5?'':'red'}">${TMT.filter(c=>c.seg===s.id).length}</b></div>`).join('');
 root.innerHTML=`<div class="view-head"><div><h3>TMT 行业洞见 · AI 产业链上中下游</h3><p>每家公司一张深度卡：业务定位、最新财务、竞争格局、估值拆解、熊/基准/牛情景、同行对比、两条可讲的洞见、证伪条件和追问。数字来自“数据账本”，悬停可看出处与日期；判断与事实在文字里分开写。</p></div></div>
 <div class="ans-note"><b>怎么用：</b>面试被问“谈谈你熟悉的行业/公司”时，先说它在产业链的位置，再讲两条洞见，最后主动说出证伪条件。红色数字表示该类别不足 5 家。仅供学习，不构成投资建议。</div>
 <div class="fd-kpis" style="grid-template-columns:repeat(4,1fr)">${cnt}</div>
 <div class="panel"><div class="iv-filters"><select data-tf="seg"><option value="all">全部类别</option>${TMT_SEGS.map(s=>`<option value="${s.id}" ${TMT_UI.seg===s.id?'selected':''}>${ansEsc(s.name)}</option>`).join('')}</select><select data-tf="mkt"><option value="all">全部市场</option>${Object.keys(TMT_MKT).map(k=>`<option value="${k}" ${TMT_UI.mkt===k?'selected':''}>${TMT_MKT[k]}</option>`).join('')}</select><input type="search" data-tf="q" placeholder="搜索公司或代码" value="${ansEsc(TMT_UI.q)}"><span class="small-copy">共 ${L.length} 家 / 总 ${TMT.length} 家</span></div></div>
 ${L.length?TMT_SEGS.filter(s=>L.some(c=>c.seg===s.id)).map(s=>`<div class="section-label">${ansEsc(s.name)}</div>${L.filter(c=>c.seg===s.id).map(c=>ansDet('tmt.'+c.id,`${ansEsc(c.name)} <span class="small-copy">${ansEsc(c.ticker||'')}</span> <span class="tag">${TMT_MKT[c.mkt]||ansEsc(c.mkt)}</span> <span class="small-copy">数据截至 ${ansEsc(c.asof||'')}</span>`,tmtCardHtml(c))).join('')}`).join(''):'<div class="empty">这一轮的 TMT 公司卡还没有载入。</div>'}`;
 root.oninput=e=>{const t=e.target;if(t.dataset.tf==='q'){TMT_UI.q=t.value;const p=t.selectionStart;renderTmt();const n=root.querySelector('[data-tf="q"]');n.focus();n.setSelectionRange(p,p)}};
 root.onchange=e=>{const t=e.target;if(t.dataset.tf==='seg'||t.dataset.tf==='mkt'){TMT_UI[t.dataset.tf]=t.value;renderTmt()}};
}
