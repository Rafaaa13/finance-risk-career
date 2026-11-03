/* ===== prep_51：数据账本视图（更新清单 + 全账本 + 未核实清单） ===== */
const LED_UI={q:'',n:60};
function ledAge(asof){const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(asof||'');if(!m)return null;const d=new Date(+m[1],+m[2]-1,+m[3]);return Math.floor((Date.now()-d.getTime())/86400000)}
function ledUsed(){const u={};IV.forEach(it=>{ivTokens(it).L.forEach(id=>{u[id]=(u[id]||0)+1})});return u}
function ledRow(id,e,cnt){
 const age=ledAge(e[3]),cls=age==null?'':age>45?'red':age>14?'amber':'teal';
 const v=typeof e[1]==='number'?e[1].toLocaleString('zh-CN'):ansEsc(e[1]);
 return `<tr><td class="mono">${ansEsc(id)}</td><td>${ansEsc(e[0])}</td><td class="num">${v}${ansEsc(e[2]||'')}</td><td>${ansEsc(e[3])}</td><td><span class="tag ${cls}">${age==null?'—':age+' 天'}</span></td><td>${e[6]?`<a href="${ansEsc(e[6])}" target="_blank" rel="noopener noreferrer">${ansEsc(e[4])}</a>`:ansEsc(e[4])}</td><td>${ansEsc(e[5]||'')}</td>${cnt!=null?`<td class="num">${cnt}</td>`:''}</tr>`;
}
function ledMd(){
 const u=ledUsed(),ids=Object.keys(u).filter(id=>LEDGER[id]).sort((a,b)=>(ledAge(LEDGER[b][3])||0)-(ledAge(LEDGER[a][3])||0));
 return ['# 面试前一天 5 分钟更新清单','',`生成时间：${new Date().toLocaleString('zh-CN')}`,'','| 账本ID | 指标 | 当前值 | 截至 | 距今 | 去哪里更新 |','|---|---|---|---|---|---|',...ids.map(id=>{const e=LEDGER[id],a=ledAge(e[3]);return `| ${id} | ${e[0]} | ${e[1]}${e[2]||''} | ${e[3]} | ${a==null?'—':a+' 天'} | ${e[6]||e[4]} |`})].join('\n');
}
function renderLed(){
 const root=$('#view-led'),u=ledUsed(),all=Object.keys(LEDGER),ids=Object.keys(u).filter(id=>LEDGER[id]).sort((a,b)=>(ledAge(LEDGER[b][3])||0)-(ledAge(LEDGER[a][3])||0));
 const q=LED_UI.q.trim(),hit=all.filter(id=>!q||(id+LEDGER[id][0]).includes(q));
 const head=(extra)=>`<thead><tr><th>账本ID</th><th>指标</th><th>当前值</th><th>截至</th><th>距今</th><th>来源</th><th>证据</th>${extra?`<th>${extra}</th>`:''}</tr></thead>`;
 root.innerHTML=`<div class="view-head"><div><h3>数据账本</h3><p>对答里所有带虚线下划线的数字都来自这里。每条记录有日期、出处和证据等级：E1 官方一手（央行、统计局、监管、交易所、公司公告）、E2 权威媒体或官方转载、E3 第三方或检索摘要。数字会过期：面试前一天按下面的更新清单逐条核对。</p></div><button class="btn teal" id="ledExport">导出更新清单</button></div>
 <div class="ans-note"><b>快照日期 2026-10-28。</b>账本共 ${all.length} 条已读到的数字，另有 ${typeof LEDGER_MISS!=='undefined'?LEDGER_MISS.length:0} 条没有核实到（见页尾）。部分来源是 PDF 或图片，读不到原文，已降级为 E3 或标为未核实，不得当作官方口径引用。</div>
 <div class="section-label">面试前一天更新清单（对答中用到的 ${ids.length} 个数字，按“最旧”排序）</div>
 <div class="table-wrap"><table>${head('用到次数')}<tbody>${ids.map(id=>ledRow(id,LEDGER[id],u[id])).join('')||'<tr><td colspan="8">还没有对答用到账本数字。</td></tr>'}</tbody></table></div>
 <div class="section-label">全账本检索</div><div class="panel"><input type="search" id="ledQ" placeholder="按 ID 或指标名搜索" value="${ansEsc(LED_UI.q)}" style="width:320px"> <span class="small-copy">匹配 ${hit.length} 条，显示前 ${Math.min(LED_UI.n,hit.length)} 条</span></div>
 <div class="table-wrap"><table>${head()}<tbody>${hit.slice(0,LED_UI.n).map(id=>ledRow(id,LEDGER[id],null)).join('')}</tbody></table></div>${hit.length>LED_UI.n?'<button class="btn" id="ledMore">再显示 60 条</button>':''}
 <div class="section-label">没有核实到的条目</div><div class="panel"><ul>${(typeof LEDGER_MISS!=='undefined'?LEDGER_MISS:[]).slice(0,80).map(m=>`<li><span class="mono">${ansEsc(m[0])}</span> ${ansEsc(m[1])}<span class="fd-note"> ${ansEsc(m[2])}</span></li>`).join('')}</ul></div>`;
 $('#ledExport').onclick=()=>{download('更新清单.md',ledMd(),'text/plain;charset=utf-8');toast('已导出更新清单')};
 $('#ledQ').oninput=e=>{LED_UI.q=e.target.value;LED_UI.n=60;const p=e.target.selectionStart;renderLed();const n=$('#ledQ');n.focus();n.setSelectionRange(p,p)};
 const more=$('#ledMore');if(more)more.onclick=()=>{LED_UI.n+=60;renderLed()};
}
