FDV.insight={render(){
 const f=fdState(),bias=fdCfg('bias',{}),vs=fdCfg('vs',[0,0,0,0]),Y=FR.yld,L=Y.last,ix=n=>FR.months.indexOf(n);
 const dch=(k,n)=>(L[k]-Y[k][ix(n)])*100;
 const yrows=[['中国 2Y','cn2'],['中国 5Y','cn5'],['中国 10Y','cn10'],['中国 30Y','cn30'],['美国 2Y','us2'],['美国 10Y','us10']].map(([n,k])=>[n,fdF(L[k],3)+'%',fdF(dch(k,'2026-09'),1),fdF(dch(k,'2026-06'),1),fdF(dch(k,'2025-12'),1),fdF(dch(k,'2025-09'),1)]);
 const reb=['沪深300','中证500','创业板指','中证红利','国债指数'].map((n,i)=>{const m=FR.idx[n].m;return{name:n,y:m.map(v=>v/m[0]*100)}});
 const vc=['可证伪：写明了“什么情形下我认错”','可量化：有具体数字的预期差','有时间窗：知道何时能验证','有行动含义：会改变我的仓位或建议'].map((t,i)=>`<div class="field"><label>${t}</label><select data-fdin="vs:${i}">${[0,1,2].map(v=>`<option value="${v}" ${vs[i]==v?'selected':''}>${['没有','部分','充分'][v]}</option>`).join('')}</select></div>`).join('');
 const brows=FDBIAS.map((b,i)=>`<tr><td><label class="check"><input type="checkbox" data-fdin="bias:${i}" ${bias[i]?'checked':''}> <b>${b[0]}</b></label></td><td class="wrap">${b[1]}</td><td class="wrap">${b[2]}</td></tr>`).join('');
 return `<div class="section-label">Step 1 · 市场看板（真实快照 ${FR.snap}）</div>
<div class="panel">${fdTbl(['指数','最新','日期','较9月末','较6月末','较2025年末','较2025年9月末','距60个月高点'],fdDashRows())}
<p class="fd-note" style="margin-top:8px">最新价取 10 月月K最新一条，可能是盘中值，月末对比用月末收盘。</p>
${fdLine(reb,{labels:FR.months,fmt:v=>v.toFixed(0),title:'五个指数 2021-09=100'})}
${fdTbl(['利率',`最新（${L.date}）`,'较9月末(bp)','较6月末(bp)','较2025年末(bp)','较2025年9月末(bp)'],yrows)}${fdSrc('东方财富指数月K与国债收益率接口；收益率更新到 '+L.date)}</div>
<div class="fd-task"><b>任务 1（每周做一次）</b>：看完上面两张表，写三句话——① 过去一个月最大的变化是什么（带数字）？② 你认为原因是什么，凭什么？③ 什么数据出现，会让你推翻这个判断？写进下面“预测日志”，并给一个到期日和概率。</div>
<div class="panel"><div class="form-grid">${fdMemoBox('i_view','三句话市场观点','事实(数字) / 原因 / 证伪条件',110)}</div><div style="margin-top:8px"><button class="btn small" data-fdact="chk">自检：数字与证伪条件</button> <span id="fd-chk" class="fd-note"></span></div></div>
<div class="section-label">Step 2 · 预测日志：校准你的判断</div>
<div class="panel"><p class="fd-note">洞见不是“说得对”，而是“知道自己对的概率”。每条预测写下概率和期限，到期结算，用 Brier 分数和校准表检验自己。至少积累20条才有统计意义。</p>
<div class="form-grid"><div class="field full"><label>预测（可验证的事件）</label><input id="j-q" placeholder="例如：2026-12-31 中国10年国债收益率低于 1.65%"></div><div class="field"><label>我认为发生的概率（1–99）</label><input id="j-p" type="number" min="1" max="99" value="60"></div><div class="field"><label>到期日</label><input id="j-d" type="date"></div><div class="field full"><label>理由（一句话）与证伪条件</label><input id="j-r" placeholder="理由；若……则我认错"></div></div>
<div style="margin:10px 0"><button class="btn teal small" data-fdact="jadd">添加预测</button> <button class="btn small" data-fdact="jexp">导出日志 JSON</button></div><div id="fd-jr">${fdJournalHtml()}</div></div>
<div class="section-label">Step 3 · 变体认知自检</div>
<div class="panel"><p class="fd-note">一个好观点至少要满足：与共识不同、可证伪、能量化、有时间窗、能改变行动。给自己最近的一条观点打分。</p><div class="fd-ctrl">${vc}</div><p class="fd-note" id="fd-vs">${fdVsText(vs)}</p></div>
<div class="section-label">Step 4 · 事前验尸与认知偏误</div>
<div class="panel">${fdTbl(['偏误（勾选＝本次已检查）','自问','反制动作'],[]).replace('<tbody></tbody>','<tbody>'+brows+'</tbody>')}</div>
${fdCard('洞见提示','把“我觉得”换成“我押多大概率、凭什么、错了怎么办”。这条习惯，比任何一个公式都更能把一个人和普通从业者区分开。')}
<div class="section-label">Step 5 · 周复盘与经典读物</div>
<div class="panel"><div style="margin-bottom:10px"><button class="btn small" data-fdact="week">下载周复盘模板</button></div>${fdTbl(['书','作者','读它为了什么','对应模块'],FDBOOK)}<p class="fd-note">公开出版的经典读物清单，并非本工作台的数据来源。</p></div>`},
set(name,val,el){
 if(fdMemoSet(name,val))return;
 if(name.startsWith('bias:')){fdCfg('bias')[+name.slice(5)]=el.checked;return}
 if(name.startsWith('vs:')){const v=fdCfg('vs');v[+name.slice(3)]=+val;const n=$('#fd-vs');if(n)n.textContent=fdVsText(v)}},
act(a,arg){
 const f=fdState(),jr=()=>{const n=$('#fd-jr');if(n)n.innerHTML=fdJournalHtml()};
 if(a==='chk'){const t=(f.memo.i_view||''),nums=(t.match(/\d+(\.\d+)?/g)||[]).length,fal=/(若|如果|除非|一旦|低于|高于|跌破|突破|否则)/.test(t);$('#fd-chk').textContent=`数字 ${nums} 个${nums>=3?'✓':'（建议≥3个）'}；证伪条件${fal?'✓ 有条件句':'：没找到条件句，补一句“若……我就改判断”'}。自动自检只看形式，不判断对错。`;return}
 if(a==='jadd'){const q=$('#j-q').value.trim(),p=parseFloat($('#j-p').value);if(!q||!(p>=1&&p<=99)){toast('请写预测，并给出1–99的概率');return}f.journal.push({id:Date.now(),q,p,due:$('#j-d').value,why:$('#j-r').value.trim(),res:null});jr();$('#j-q').value='';toast('已添加预测');return}
 if(a==='jres'){const [id,r]=arg.split(':');const x=f.journal.find(y=>String(y.id)===id);if(x){x.res=+r;jr()}return}
 if(a==='jdel'){f.journal=f.journal.filter(y=>String(y.id)!==arg);jr();return}
 if(a==='jexp'){download('预测日志.json',JSON.stringify(f.journal,null,2),'application/json');toast('已导出');return}
 if(a==='week')fdDownload('周复盘模板.md','# 周复盘\n\n## 本周发生了什么（只写事实，带数字和日期）\n\n## 我的判断中，哪些对了/错了，为什么\n\n## 我最大的一个认知偏误\n\n## 下周要观察的3个指标与阈值\n\n## 要结算的预测\n')}};
