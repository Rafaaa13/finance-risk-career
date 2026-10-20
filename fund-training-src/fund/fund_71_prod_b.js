function fdProdOut(f){const r=f.r,rp12=fdRollPos(r,12),rp24=fdRollPos(r,24),rp36=fdRollPos(r,36),d=fdDca(r),c=fdChase(r),st=fdStat(r,0);
 const st3=a=>`${fdPc(a.filter(x=>x>0).length/a.length*100,0)} / ${fdPc(fdQtl(a,0.5)*100,1)} / ${fdPc(Math.min(...a)*100,1)}`;
 const p=fdGrow(r),dcaPath=(()=>{let u=0,cost=0;return p.slice(1).map((v,i)=>{u+=1/p[i];cost+=1;return (u*v/cost-1)*100})})();
 return fdKpis([['一次性持有 年化',fdPc(st.ann*100,1),st.ann>=0?'pos':'neg'],['每月定投 IRR 年化',fdPc(d.irr*100,1),d.irr>=0?'pos':'neg'],['追涨杀跌/一直持有终值',fdF(c.ratio,2)+' 倍',c.ratio>=1?'pos':'neg'],['追涨杀跌交易次数',c.trades+' 次']])+
 fdTbl(['持有期','窗口数','正收益占比 / 中位 / 最差'],[['12个月',rp12.length,st3(rp12)],['24个月',rp24.length,st3(rp24)],['36个月',rp36.length,st3(rp36)]])+
 fdLine([{name:'一次性持有（起点=1）',y:p},{name:'追涨杀跌者（第3月起）',y:[null,null,null].concat(c.path.map((v,i)=>v*p[3])),c:'#b4543f'}],{labels:FR.months.slice(0,61),title:'净值与行为路径'})+
 fdLine([{name:'定投累计收益% (相对累计投入)',y:dcaPath,c:'#6b5bb5'}],{labels:FR.months.slice(1),title:'定投累计收益'})}
FDV.prod={render(){
 const cfg=fdCfg('pd',{c:'005827',s:'005827'}),f=fdFund(cfg.c),sf=fdFund(cfg.s);
 const A=sf.al,F=sf.fw,H=sf.hd,Sc=sf.sc;
 const scT=fdTbl(['报告期','规模(亿元)'],Sc.d.map((d,i)=>[d,fdF(Sc.yi[i],2)]));
 const flT=fdTbl(['报告期','申购(亿份)','赎回(亿份)','净申赎(亿份)','期末总份额(亿份)','赎回/季初份额%'],F.d.map((d,i)=>[d,fdF(F.buy[i],2),fdF(F.redeem[i],2),fdF(F.buy[i]-F.redeem[i],2),fdF(F.shares[i],2),i>0?fdF(F.redeem[i]/F.shares[i-1]*100,1):'—']));
 const hdT=fdTbl(['报告期','机构%','个人%','内部%'],H.d.map((d,i)=>[d,fdF(H.inst[i],2),fdF(H.indiv[i],2),fdF(H.internal[i],3)]));
 const fi=fdFlowIC(),pts=fi.U.map(x=>[fdRet12To(x,'2026-03')*100,fdRedeem(x).rr*100,x.n,x.cat.includes('指数')?'#c78a2c':'#1f8f8f']);
 return `<div class="section-label">Step 1 · 持有体验：基金赚钱，持有人赚钱吗</div>
<div class="panel"><div class="field fd-sel"><label>选择基金（净值路径为真实月度数据）</label><select data-fdin="c">${fdFundOpts(cfg.c,x=>x.adj)}</select></div><div id="fd-out">${fdProdOut(f)}</div>
<p class="fd-note">定投与追涨杀跌都是<b style="display:inline">模拟</b>：用真实净值路径，叠加我们假设的交易规则（无费用、无税、月频）。它回答“同一条净值路径，不同的持有行为会得到多不同的结果”，不是对真实持有人的统计。${fdSrc('天天基金月末累计净值/单位净值，由月度收益复利得到')}</p></div>
<div class="fd-task"><b>任务 1</b>：对三只不同风格的基金（高波动成长、低波动债基、宽基指数）各看一遍“滚动12个月正收益占比”。写一句给客户的话：持有多久，赚钱的可能性在历史上有多大？注意不得预测未来业绩，只能陈述历史并提示风险。</div>
<div class="section-label">Step 2 · 规模、申赎与持有人结构（真实季度披露）</div>
<div class="panel"><div class="field fd-sel"><label>选择基金</label><select data-fdin="s">${fdFundOpts(cfg.s)}</select></div><div class="fd-two"><div>${scT}${hdT}</div><div>${flT}</div></div>
${fdLine([{name:'规模(亿元)',y:Sc.yi}],{labels:Sc.d,title:'规模变化'})}<p class="fd-note">${sf.n}：规模 ${fdF(Sc.yi[0],1)}→${fdF(Sc.yi[Sc.yi.length-1],1)} 亿元。规模下降由“净申赎”和“净值涨跌”共同造成，两者要拆开：用申赎份额看持有人行为，用净值看业绩。持有人结构每半年披露一次，个人投资者占比高意味着赎回更分散，但情绪传染更快。</p></div>
<div class="section-label">Step 3 · 赎回行为证据：亏了就跑，还是赚了就赎</div>
<div class="panel">${fdScatter(pts,{xl:'截至2026-03的近12个月收益(%)',yl:'2026Q2赎回份额/季初份额(%)',fit:true,title:'前期收益 vs 后续赎回'})}
<p class="fd-note">每个点是一只基金（${fi.U.length}只口径正常的权益/指数基金；橙色=指数类）。秩相关 ${fdF(fi.ic,3)}。样本小、只有一个季度、没有拆开机构/个人，且收益周期与申赎周期并不严格对应：它是“值得继续研究的线索”，不是定论。</p></div>
<div class="section-label">Step 4 · 客观验收与话术合规审查</div>${fdProdQuiz(f,cfg.c)}
<div class="fd-card warn"><b>合规提醒</b>话术题的依据是已核实的条文原文；《宣传推介材料管理暂行规定》等细则本库未能核实，ad5 题故意设为“无法判定”——真正的合规审查必须查原文。</div>
<div class="section-label">Step 5 · 写一页给客户的回撤说明（并自检）</div>
<div class="panel"><div class="form-grid">
${fdMemoBox('p_fact','事实：这段期间净值/回撤是多少（附日期和来源）','只写已披露事实')}
${fdMemoBox('p_why','原因：市场与持仓层面的解释','不预测、不承诺')}
${fdMemoBox('p_do','我们做了什么 / 会怎么做','')}
${fdMemoBox('p_risk','风险提示与适当性','过往业绩不代表未来；风险等级与投资者匹配')}
</div><div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn small" data-fdact="scan">合规词扫描</button><button class="btn teal small" data-fdact="dl">下载客户说明（Markdown）</button></div><div id="fd-scan" class="fd-note" style="margin-top:8px"></div></div>`},
set(name,val){if(fdMemoSet(name,val))return;const cfg=fdCfg('pd');cfg[name]=val;renderFund()},
act(a){const m=fdState().memo,g=x=>m[x]||'（待填）',cfg=fdCfg('pd'),f=fdFund(cfg.c);
 if(a==='scan'){const txt=['p_fact','p_why','p_do','p_risk'].map(k=>m[k]||'').join('\n'),hit=FD_BAN.filter(w=>txt.includes(w));$('#fd-scan').innerHTML=hit.length?`发现可疑措辞：<b>${hit.join('、')}</b>。逐条改成可核对的事实或删除；词表只是粗筛，通过扫描不等于合规。`:'未发现词表中的高风险措辞（词表只是粗筛，通过扫描不等于合规）。';return}
 fdDownload('客户回撤说明_'+f.c+'.md',`# 客户沟通：${f.n}（训练稿）\n\n## 事实\n${g('p_fact')}\n\n## 原因\n${g('p_why')}\n\n## 我们做了什么\n${g('p_do')}\n\n## 风险提示\n${g('p_risk')}\n\n> 数据：天天基金公开接口，快照 ${FR.snap}。训练稿，对外使用须经合规审核。`)}};
