function viewDetail(){
 const c=coBy(ST.sel);if(!c){ST.view='companies';return render()}
 const rm=rankMap(),n=CO.filter(x=>x.cat===c.cat).length,my=myOf(c.id),inC=ST.cmp.includes(c.id);
 const bars=SK.map(([k,nm])=>`<div class="score"><span>${nm}</span><div class="bar ${k==='pa'?'red':k==='wl'?'blue':k==='gr'?'amber':''}"><i style="width:${c.s[k]/5*100}%"></i></div><strong>${c.s[k]}</strong></div>`).join('');
 const ev=(t,v,b)=>`<div class="panel"><div class="panel-head"><h4>${t}</h4>${badge(b)}</div><p>${esc(v)}</p></div>`;
 const rq=c.req;
 const pos=c.pos.length?c.pos.map(p=>`<div class="panel pos"><h4>${esc(p.n)}</h4><p>${esc(p.w)}</p><dl class="kv"><dt>学历</dt><dd>${esc(p.deg)}</dd><dt>实习要求</dt><dd>${esc(p.int)}</dd><dt>HC</dt><dd>${esc(p.hc)}</dd></dl></div>`).join(''):'<div class="callout red">本次未取得该机构的岗位正文，不展示推测性职责。请从下方官方入口核实。</div>';
 const stOpt=['','关注','准备中','已投递','已放弃'].map(s=>`<option value="${s}" ${my.s===s?'selected':''}>${s||'未标记'}</option>`).join('');
 $('#view-detail').innerHTML=`<div class="head"><div><button class="btn" id="back">← 返回列表</button><h3 style="margin-top:14px">${esc(c.n)}</h3><p>${catOf(c.cat).n} · 类内第 ${rm[c.id]} / ${n}（${ST.mode==='stable'?'稳健优先':'成长/薪酬优先'}）</p></div><button class="btn ${inC?'teal':''}" id="dcmp">${inC?'已加入对比':'加入对比'}</button></div>
<div class="grid2"><div class="panel dark"><div class="eyebrow">排名理由（判断）</div><h4 style="font-size:20px;margin-top:8px">综合指数 ${idx(c).toFixed(2)} / 5</h4><p>${esc(c.why)}</p><div class="pillrow">${tag('证据完整度 '+comp(c).toFixed(1)+'/5','dark')}${tag('指数基于判断分，不是统计','dark')}</div></div>
<div class="panel"><div class="panel-head"><h4>六个维度（1–5，判断分）</h4>${tag('进入容易度：5=相对容易','blue')}</div>${bars}</div></div>
<div class="section">事实核验 / 证据卡</div>
<div class="grid2">${ev('招聘规模 HC',c.hc[0],c.hc[1])}${ev('年报薪酬',c.pay[0],c.pay[1])}
<div class="panel"><div class="panel-head"><h4>申请条件</h4>${badge(unk(rq.deg)?'ND':reqB(c))}</div><dl class="kv"><dt>学历</dt><dd>${esc(rq.deg)}</dd><dt>英语</dt><dd>${esc(rq.eng)}</dd><dt>对口实习</dt><dd>${esc(rq.int)}</dd><dt>专业</dt><dd>${esc(rq.maj)}</dd></dl></div>
<div class="panel"><div class="panel-head"><h4>时间节点</h4>${badge(unk(c.time)?'ND':reqB(c))}</div><p>${esc(c.time)}</p><div class="callout">WLB 与官方工时数据：本次研究未找到任何机构的权威公开口径，故只给“工作节奏”判断分，不当作事实。</div></div></div>
<div class="section">具体岗位与工作内容</div><div class="grid2">${pos}</div>
<div class="section">未核实项</div><div class="panel"><ul class="goal">${(c.gap.length?c.gap:['无额外缺口']).map(g=>`<li>${esc(g)}</li>`).join('')}</ul></div>
<div class="section">官方来源</div><div class="panel">${c.src.map(s=>`<p class="src"><a href="${esc(s[1])}" target="_blank" rel="noreferrer">${esc(s[0])}</a></p>`).join('')||'—'}</div>
<div class="section">我的跟进（保存在本机浏览器）</div><div class="panel"><div class="filters"><div class="field"><label>状态</label><select id="mys">${stOpt}</select></div><div class="field" style="grid-column:span 3"><label>备注（面试官、笔试时间、内推人…）</label><input id="myn" value="${esc(my.n)}"></div></div></div>
<div class="section">投递前5步核验</div><div class="grid3"><div class="panel"><h4>1 公告</h4><p>重新打开官方链接，确认届别、截止日与岗位未下线。</p></div><div class="panel"><h4>2 主体</h4><p>确认合同主体、编制/企业属性，区分自招与外包。</p></div><div class="panel"><h4>3 条件</h4><p>学历、毕业时间、英语成绩、专业类别逐条对照。</p></div><div class="panel"><h4>4 实习</h4><p>问清是否有转正通道、实习期长度与项目产出。</p></div><div class="panel"><h4>5 序列</h4><p>总行/分行、前台/中后台，投递时就选对。</p></div></div>`;
 $('#back').onclick=()=>setView('companies');$('#dcmp').onclick=()=>toggleCmp(c.id);
 $('#mys').onchange=e=>{myOf(c.id).s=e.target.value;save();toast('已保存状态')};$('#myn').oninput=e=>{myOf(c.id).n=e.target.value;save()};
}
function viewCompare(){
 const rr=ST.cmp.map(coBy).filter(Boolean);
 const rows=[['综合指数',c=>idx(c).toFixed(2)],['证据完整度',c=>comp(c).toFixed(1)+'/5'],['稳定性',c=>c.s.st],['工作节奏（判断）',c=>c.s.wl],['成长性',c=>c.s.gr],['薪酬上限',c=>c.s.pa],['进入容易度',c=>c.s.en],['HC',c=>c.hc[0]],['年报薪酬',c=>c.pay[0]],['学历',c=>c.req.deg],['英语',c=>c.req.eng],['对口实习',c=>c.req.int],['时间节点',c=>c.time],['岗位数',c=>c.pos.length+' 个已读岗位'],['未核实',c=>c.gap.join('；')||'—']];
 const t=rr.length?`<div class="panel" style="padding:0"><div class="table"><table class="wide"><thead><tr><th>维度</th>${rr.map(c=>`<th>${esc(c.n)}<br><span class="small">${catOf(c.cat).n}</span></th>`).join('')}</tr></thead><tbody>${rows.map(([n,f])=>`<tr><td><b>${n}</b></td>${rr.map(c=>`<td class="wrap">${esc(f(c))}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`:'<div class="panel"><div class="empty">在“公司与岗位”里点“对比”，最多放入4家。</div></div>';
 $('#view-compare').innerHTML=`<div class="head"><div><h3>对比</h3><p>薪酬行的口径不同时（现金流口径 vs 费用口径 vs 应付职工薪酬）不能直接比大小。</p></div><button class="btn" id="cclr">清空</button></div>${t}`;
 $('#cclr').onclick=()=>{ST.cmp=[];save();render()};
}
