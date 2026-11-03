FDV.fi={render(){
 const cfg=fdCfg('fi',{c:'003358',ym:60});if(!fdFund(cfg.c)||!/债/.test(fdFund(cfg.c).cat))cfg.c='003358';
 const f=fdFund(cfg.c),y=FR.yld,m=fdDurM(f),dd=fdDurD(f),c=fdCurve(cfg.ym),tag=cfg.c,mo=FR.months;
 const sct=fdScatter(fdYd('cn10').map((x,i)=>[x,f.r[i],mo[i+1]]),{xl:'中国10Y国债月变动(bp)',yl:'基金月收益(%)',fit:true,title:'月收益对利率变动'});
 const all=fdTbl(['基金','类别','估算久期(年)','R²','截距(月%)','口径'],fdBond().map(b=>{const x=fdDurM(b);return[`${b.n}`,b.cat,fdF(x.D,2),fdF(x.r2,2),fdF(x.a,3),b.adj?'—':'<span class="tag red">分红未复权</span>']}));
 const q4rows=fdBond().filter(b=>b.q4).map(b=>{const q=fdQ4(b);return[b.n,b.cat,fdPc(q.dd,2),q.date,fdPc(b.al.bond[b.al.bond.length-1],0)]});
 const sh=fdShock(),qset=fdBond().filter(b=>b.q4).slice(0,6);
 const eqrows=fdBond().filter(b=>/二级|转债/.test(b.cat)).map(b=>{const e=fdEq(b);return[b.n,b.cat,fdF(e.eq,2),fdF(e.bond,2),fdF(e.r2,2),fdPc(b.al.stock[b.al.stock.length-1],1)]});
 return `<div class="section-label">Step 1 · 收益率曲线与中美利差（真实：东方财富债券收益率）</div>
<div class="panel"><div class="field fd-sel"><label>选择月末（拖动）</label><input type="range" data-fdin="ym" min="0" max="60" step="1" value="${cfg.ym}"></div>
<div id="fd-out">${fdFiCurve(cfg.ym)}</div>
${fdLine([{name:'中国10Y',y:y.cn10},{name:'中国2Y',y:y.cn2,c:'#c78a2c'},{name:'美国10Y',y:y.us10,c:'#6b5bb5'}],{labels:mo,fmt:v=>v.toFixed(1),title:'利率走势'})}
${fdSrc('东方财富 RPTA_WEB_TREASURYYIELD，月末取值（中美月末日期在5个月份不同，已分别取各自最后有数据日）')}</div>
<div class="fd-task"><b>任务 1</b>：拖动月份，找到中国10Y最低和最高的两个月，各写一句当时的宏观背景猜测，再去查资料验证。猜错也要写：这是校准你的宏观直觉。</div>
<div class="section-label">Step 2 · 用基金净值反推久期（回归法）</div>
<div class="panel"><div class="field fd-sel"><label>债券类基金</label><select data-fdin="c">${fdFundOpts(cfg.c,x=>/债/.test(x.cat))}</select></div>
<p class="fd-note">${f.n} · ${f.cat} · 经理 ${esc(f.mgr)} ${fdAdjNote(f)}</p>
${fdKpis([['估算久期(月度回归)',fdF(m.D,2)+' 年'],['R²',fdF(m.r2,2)],['截距(月 carry%)',fdF(m.a,3)],['日度久期(若有)',dd?fdF(dd.D,2)+' 年':'无日度数据']])}${sct}
<p class="fd-note">斜率为负代表利率上行时基金下跌。<b style="display:inline">R² 很低</b>（如二级债基）说明收益主要来自信用、权益或转债，不是利率。回归久期是“事后有效久期”，会随持仓变化漂移。</p>
${all}</div>
<div class="fd-task"><b>任务 2</b>：对 3 只不同类别的债基（利率债、信用债、二级债）比较 R² 与久期，写出你的解释；为什么信用债基金的估算久期可能高于它披露的组合久期？（提示：利差与利率同向变动。）</div>
<div class="section-label">Step 3 · 2022 年末债市冲击复盘</div>
<div class="panel">${fdKpis([['10Y 起点→最高点',`${fdF(sh.start,3)}% → ${fdF(sh.peak,3)}%`],['最大上行',fdF(sh.up,1)+' bp'],['最高点日期',sh.date],['窗口末 10Y',fdF(sh.end,3)+'%']])}
${fdLine(qset.map(b=>{const q=fdQ4(b);return{name:b.n.slice(0,8),y:q.path}}),{labels:fdQ4(qset[0]).dates.map(x=>x.slice(5)),fmt:v=>v.toFixed(1),title:'2022Q4净值相对10-31(%)'})}
${fdTbl(['基金','类别','窗口最大回撤','出现日期','期末债券仓位%'],q4rows)}${fdSrc('天天基金单位净值（9个观察日）；东方财富国债收益率')}
<p class="fd-note">业内对这段行情的常见解释是：理财和债基的赎回与净值下跌互相强化（负反馈）。你要回答：久期、杠杆、信用、持有人结构，哪一个对回撤的解释力最大？这里只有净值，没有杠杆和持有人逐日数据，所以只能做到“描述现象 + 提出下一步要什么数据”。</p></div>
<div class="section-label">Step 4 · 二级债基/转债的权益敏感度</div>
<div class="panel">${fdTbl(['基金','类别','沪深300系数','国债指数系数','R²','最新股票仓位%'],eqrows)}<p class="fd-note">用基金月收益对 国债指数、沪深300 做回归，看“有效权益暴露”，再和披露的股票仓位对比。两者差很多时，常见原因：转债被当作权益、仓位季度中变化、采样错位。</p></div>
<div class="section-label">Step 5 · 客观验收</div>${fdFiQuiz(cfg,tag)}
<div class="section-label">Step 6 · 写一页固收策略周报</div>
<div class="panel"><div class="form-grid">
${fdMemoBox('f_view','利率观点（方向、幅度、期限，用数字）','例如：未来3个月10Y在x%–y%，理由……')}
${fdMemoBox('f_pos','对应的久期/仓位建议及盈亏平衡','用回归久期和盈亏平衡 bp 说明保护垫够不够')}
${fdMemoBox('f_risk','风险：利率、信用、流动性、赎回','参考 2022Q4 的传导链')}
${fdMemoBox('f_trig','证伪条件（什么数据出现我会改观点）','')}
</div><div style="margin-top:12px"><button class="btn teal small" data-fdact="dl">下载固收周报（Markdown）</button></div></div>`},
set(name,val){if(fdMemoSet(name,val))return;const cfg=fdCfg('fi');if(name==='ym'){cfg.ym=+val;fdOut(fdFiCurve(cfg.ym));return}cfg[name]=val;renderFund()},
act(){const cfg=fdCfg('fi'),f=fdFund(cfg.c),m=fdDurM(f),mm=fdState().memo,g=x=>mm[x]||'（待填）';
 fdDownload('固收周报_'+f.c+'.md',`# 固收策略周报（训练稿）\n\n参考基金：${f.n}（${f.c}），回归久期≈${fdF(m.D,2)}年，R² ${fdF(m.r2,2)}\n\n## 利率观点\n${g('f_view')}\n\n## 久期/仓位建议及盈亏平衡\n${g('f_pos')}\n\n## 风险\n${g('f_risk')}\n\n## 证伪条件\n${g('f_trig')}\n\n> 数据：东方财富债券收益率与天天基金净值，快照 ${FR.snap}；训练用途，非投资建议。`)}};
