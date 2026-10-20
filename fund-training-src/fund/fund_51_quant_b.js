FDV.quant={render(){
 const cfg=fdCfg('quant',{sh:-0.4,dd:45,an:-10}),pc=fdCfg('qp',{F:12,H:12}),fo=fdCfg('qf',{codes:FD_FOF0.slice(),mode:'eq'}),U=fdEqU();
 const W=fdWins(pc.F,pc.H),ics=W.map(s=>fdIC(U,pc.F,pc.H,s)),m=fdMean(ics),sd=ics.length>1?fdSd(ics):NaN;
 const unadj=FR.funds.filter(f=>!f.adj);
 const T=fdSigTable(U,12,6);
 let hit=0,tot=0,bestT=0;[6,12,24].forEach(F=>[3,6,12].forEach(H=>{const t=fdSigTable(U,F,H);t.rows.forEach(r=>{tot++;if(Math.abs(r.t)>2)hit++;bestT=Math.max(bestT,Math.abs(r.t))})}));
 const S=fdScreen(U,cfg),sorted=S.L.slice().sort((a,b)=>b.st.sharpe-a.st.sharpe);
 const fofA=fdFof(fo.codes,'eq'),fofB=fdFof(fo.codes,'iv'),cur=fo.mode==='iv'?fofB:fofA;
 const cm=fo.codes.map(a=>fo.codes.map(b=>fdF(fdCorr(fdFund(a).r,fdFund(b).r),2)));
 const fsel=i=>`<select data-fdin="f${i}">${fdFundOpts(fo.codes[i],x=>x.adj)}</select>`;
 return `<div class="section-label">Step 1 · 数据质检（基金研究员的第一步）</div>
<div class="panel"><p class="fd-note">${FR.funds.length} 只基金中有 <b style="display:inline">${unadj.length} 只</b>累计净值口径异常，月度收益在派息月被低估：${unadj.map(x=>x.n+'('+x.c+')').join('、')}。下面的统计只用口径正常的 ${U.length} 只权益/指数基金。另一个更大的问题：这些都是<b style="display:inline">今天仍存续的老产品</b>——已清盘、合并的同类不在样本里（幸存者偏差），结论只能说“在幸存者里”。</p></div>
<div class="section-label">Step 2 · 业绩持续性：赢家还会继续赢吗</div>
<div class="panel"><div class="fd-ctrl" style="grid-template-columns:1fr 1fr 2fr"><div class="field"><label>形成期（月）</label><select data-fdin="F">${fdOpts([[6,'6'],[12,'12'],[24,'24']],pc.F)}</select></div><div class="field"><label>持有期（月）</label><select data-fdin="H">${fdOpts([[3,'3'],[6,'6'],[12,'12']],pc.H)}</select></div><div class="field"><label>说明</label><input readonly value="每个窗口：形成期收益排名 vs 持有期收益排名的 Spearman 相关"></div></div>
${fdTbl(['窗口(持有期起点)','形成期','持有期','IC'],W.map((s,i)=>[FR.months[s],`${FR.months[s-pc.F+1]}~${FR.months[s]}`,`${FR.months[s+1]}~${FR.months[s+pc.H]}`,fdF(ics[i],3)]))}
${fdKpis([['窗口数',W.length],['平均 IC',fdF(m,3),m>0?'pos':'neg'],['IC 标准差',fdF(sd,3)],['t 值',fdF(m/(sd/Math.sqrt(W.length)),2)]])}
<p class="fd-note">每个窗口只有 ${U.length} 只基金、窗口之间只有 ${W.length} 个独立样本；0.4 以上的 IC 在这里也可能是噪声。想证明“持续性存在”，需要更多基金（含已清盘）和更长历史。</p>${fdSrc('天天基金月末净值（口径正常的权益/指数基金）')}</div>
<div class="section-label">Step 3 · 信号实验室与多重检验</div>
<div class="panel"><p class="fd-note">形成期12个月、持有期6个月，8个简单选基信号，各自的 IC 序列（${T.W.length}个不重叠窗口）：</p>
${fdTbl(['信号','平均IC','IC标准差','t值','双侧p(t分布)','|t|>2'],T.rows.map(r=>[r.n,fdF(r.m,3),fdF(r.sd,3),fdF(r.t,2),fdF(r.p,3),Math.abs(r.t)>2?'<span class="tag amber">是</span>':'—']))}
<p class="fd-note">8 个信号里至少有 1 个“偶然”达到 5% 显著的概率是 1−0.95⁸=${fdF((1-Math.pow(0.95,8))*100,1)}%。如果再把形成期（6/12/24）、持有期（3/6/12）也试一遍，共 ${tot} 个组合里 |t|&gt;2 的有 <b style="display:inline">${hit}</b> 个（纯运气下约 ${fdF(tot*0.05,1)} 个，组合间高度相关，仅作量级参考），最大 |t|=${fdF(bestT,2)}。这就是“花园里的岔路”：试得越多，越容易挑出看上去显著的东西。</p></div>
<div class="fd-task"><b>任务 2</b>：写下你认为靠谱的一条选基逻辑（经济含义），再说明要用什么样本外检验来否定它。注意：不能用本页已经看过的数据来“验证”。</div>
<div class="section-label">Step 4 · 筛选器与样本外检验</div>
<div class="panel"><div class="fd-ctrl"><div class="field"><label>前36个月夏普≥ <span class="val">${cfg.sh}</span></label><input type="range" data-fdin="sh" min="-0.8" max="0.6" step="0.05" value="${cfg.sh}"></div><div class="field"><label>最大回撤不深于 −<span class="val">${cfg.dd}</span>%</label><input type="range" data-fdin="dd" min="20" max="65" step="1" value="${cfg.dd}"></div><div class="field"><label>年化收益≥ <span class="val">${cfg.an}</span>%</label><input type="range" data-fdin="an" min="-20" max="15" step="1" value="${cfg.an}"></div></div>
${fdKpis([['通过筛选',S.pass.length+' / '+U.length],['通过者后24个月平均年化',S.pass.length?fdPc(fdMean(S.pass.map(x=>x.fw.ann))*100,1):'—'],['全体后24个月平均年化',fdPc(fdMean(S.L.map(x=>x.fw.ann))*100,1)],['差值',S.pass.length?fdF((fdMean(S.pass.map(x=>x.fw.ann))-fdMean(S.L.map(x=>x.fw.ann)))*100,1)+' pct':'—']])}
${fdTbl(['基金','前36月夏普','前36月最大回撤','前36月年化','后24月年化','通过'],sorted.map(x=>[x.f.n,fdF(x.st.sharpe,2),fdPc(x.st.mdd*100,1),fdPc(x.st.ann*100,1),fdPc(x.fw.ann*100,1),S.pass.includes(x)?'✓':'—']))}</div>
<div class="section-label">Step 5 · FOF 组合：分散化有没有用</div>
<div class="panel"><div class="fd-ctrl" style="grid-template-columns:repeat(5,1fr)">${[0,1,2,3,4].map(i=>`<div class="field"><label>基金${i+1}</label>${fsel(i)}</div>`).join('')}</div>
<div class="field fd-sel" style="margin-top:8px"><label>权重</label><select data-fdin="mode">${fdOpts([['eq','等权'],['iv','逆波动率权重']],fo.mode)}</select></div>
${fdKpis([['年化',fdPc(cur.st.ann*100,1)],['年化波动',fdPc(cur.st.vol*100,1)],['最大回撤',fdPc(cur.st.mdd*100,1),'neg'],['夏普',fdF(cur.st.sharpe,2)]])}
${fdTbl(['权重'].concat(fo.codes),[['当前'].concat(cur.w.map(x=>fdPc(x*100,0)))])}
${fdTbl(['相关系数'].concat(fo.codes),fo.codes.map((c,i)=>[c].concat(cm[i])))}
<p class="fd-note">等权：年化 ${fdPc(fofA.st.ann*100,1)}、波动 ${fdPc(fofA.st.vol*100,1)}、最大回撤 ${fdPc(fofA.st.mdd*100,1)}；逆波动率：年化 ${fdPc(fofB.st.ann*100,1)}、波动 ${fdPc(fofB.st.vol*100,1)}、最大回撤 ${fdPc(fofB.st.mdd*100,1)}。逆波动率权重用的是同一段样本的波动，存在前视，实盘要用滚动估计。</p></div>
<div class="section-label">Step 6 · 客观验收</div>${fdQuantQuiz()}
<div class="section-label">Step 7 · 写研究结论</div>
<div class="panel"><div class="form-grid">
${fdMemoBox('q_find','我发现了什么（含样本、窗口、数字）','')}
${fdMemoBox('q_bias','这个发现可能被什么偏差污染','幸存者、前视、多重检验、窗口选择')}
${fdMemoBox('q_test','我会怎样做样本外检验','数据、时间、通过标准提前写好')}
</div><div style="margin-top:12px"><button class="btn teal small" data-fdact="dl">下载研究结论（Markdown）</button></div></div>`},
set(name,val,el,type){if(fdMemoSet(name,val))return;
 const cfg=fdCfg('quant'),pc=fdCfg('qp'),fo=fdCfg('qf');
 if(['sh','dd','an'].includes(name)){cfg[name]=parseFloat(val);const lab=el.parentElement.querySelector('.val');if(lab)lab.textContent=val;if(type==='change')renderFund();return}
 if(name==='F'||name==='H'){pc[name]=+val;renderFund();return}
 if(name==='mode'){fo.mode=val;renderFund();return}
 if(/^f\d$/.test(name)){fo.codes[+name[1]]=val;renderFund()}},
act(){const U=fdEqU(),T=fdSigTable(U,12,6),mm=fdState().memo,g=x=>mm[x]||'（待填）';
 fdDownload('基金研究结论.md',`# 基金研究结论（训练稿）\n\n样本：${U.length}只口径正常的存续权益/指数基金（幸存者样本），月度数据 ${FR.months[0]}~${FR.months[60]}\n\n信号IC表（形成12月/持有6月）：\n${T.rows.map(r=>`- ${r.n}: 平均IC ${fdF(r.m,3)}，t ${fdF(r.t,2)}`).join('\n')}\n\n## 我发现了什么\n${g('q_find')}\n\n## 可能的偏差\n${g('q_bias')}\n\n## 样本外检验计划\n${g('q_test')}\n\n> 数据：天天基金公开接口，快照 ${FR.snap}；训练用途，非投资建议。`)}};
