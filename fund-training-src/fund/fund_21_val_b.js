function fdValOut(s,cfg){
 const l=fdLast(s),ig=fdImplG(s,cfg.r,cfg.tg),cg3=fdCagrNp(s,3),cg5=fdCagrNp(s,5),pe=fdPeStatic(s);
 const gs=[0.08,0.09,0.10,0.11,0.12],ts=[0.015,0.025,0.035];
 const grid=fdTbl(['折现率＼终值增速',...ts.map(t=>fdPc(t*100,1))],gs.map(r=>[fdPc(r*100,0),...ts.map(t=>{const g=fdImplG(s,r,t);return Number.isFinite(g)?fdPc(g*100,1):'无解'})]));
 return fdKpis([['现价（元）',fdF(s.q.price,2)],['动态PE / 静态PE',`${fdF(s.q.pe,1)} / ${fdF(pe,1)}`],['PB',fdF(s.q.pb,2)],['总市值（亿元）',fdF(s.q.mcap_yi,0)]])+
 fdKpis([['隐含10年盈利增速',Number.isFinite(ig)?fdPc(ig*100,1):'无解',Number.isFinite(ig)&&Number.isFinite(cg5)&&ig>cg5?'neg':'pos'],['近3年净利CAGR',Number.isFinite(cg3)?fdPc(cg3*100,1):'—'],['近5年净利CAGR',Number.isFinite(cg5)?fdPc(cg5*100,1):'—'],[`${l.y}年分红率(估算)`,l.div_yi!=null&&l.np_yi>0?fdPc(l.div_yi/l.np_yi*100,0):'—']])+
 `<p class="fd-note">现价隐含增速 &gt; 公司历史 CAGR 时（红色），你需要证据证明未来比过去更好；反过来则是在押“平淡也够用”。这是把盈利全部当成可分配现金的简化模型，只用来练“价格里有什么”，不是目标价。</p>`+grid}
FDV.val={render(){
 const cfg=fdCfg('val',{co:'600519',r:.09,tg:.025}),s=fdSt(cfg.co),l=fdLast(s);
 const sel=FR.stocks.map(x=>[x.c,`${x.n} · ${x.ind}`]);
 const ys=s.a.map(a=>String(a.y));
 const f1=(k,d=1)=>s.a.map(a=>a[k]==null?'—':fdF(a[k],d));
 const fin=fdTbl(['指标',...ys],[['营收（亿元）',...f1('rev_yi',1)],['归母净利（亿元）',...f1('np_yi',1)],['净利同比%',...f1('np_yoy',1)],['加权ROE%',...f1('roe',1)],['毛利率%',...f1('gm',1)],['净利率%',...f1('nm',1)],['资产负债率%',...f1('debt',1)],['基本EPS（元）',...f1('eps',2)],['每股经营现金流（元）',...f1('cfps',2)],['每股净资产（元）',...f1('bps',2)],['每股分红（元）',...f1('dps',2)]]);
 const dup=fdTbl(['年份','净利率%','总资产周转率','权益乘数','三者相乘≈ROE','报告加权ROE','差异'],s.a.slice(-6).map(a=>{const d=fdDup(a);return [a.y,fdF(d.nm,1),d.toa==null?'—':fdF(d.toa,3),fdF(d.em,2),Number.isFinite(d.est)?fdF(d.est,1):'—',fdF(a.roe,1),Number.isFinite(d.est)?fdF(d.est-a.roe,1):'—']}));
 const warn={'000858':'五粮液 2025 年报数据与此前趋势断裂（营收同比约-55%、净利同比约-72%，每股分红5.16元高于EPS 2.31元）。接口口径未逐项核实：这正是“数据异常→先回公告核实再下结论”的练习，写备忘录前请对照年报。','601012':'隆基绿能亏损：动态PE为负不是“便宜”，净利润“同比+25%”是亏损收窄；盈利折现模型对它无解。','000002':'万科A 连续亏损：同比变化的基期接近盈亏平衡时可达几百个百分点，符号与大小都不能照字面读；EPS为负时 PE 无意义。','300750':'宁德时代 2016–2017 年为上市前（招股书）口径，ROE 不宜与上市后直接比较。','300760':'迈瑞医疗 2016–2017 年为上市前口径，不宜与上市后直接比较。'}[s.c];
 const flagRows=FR.stocks.map(x=>{const fl=fdFlags(x);return [`<a href="#" data-fdact="pick" data-arg="${x.c}">${x.n}</a>`,fdFin(x)?'金融':'非金融',fdF(x.q.pe,1),fdPc(fdLast(x).roe,1),fl.length?fl.map(f=>`<span class="tag red" title="${esc(f[1])}">${f[0]}</span> ${esc(f[1])}`).join('<br>'):'<span class="tag">未触发</span>']});
 return `<div class="section-label">Step 1 · 读数据（真实：东方财富数据中心，十年年报）</div>
<div class="panel"><div class="field fd-sel"><label>选择公司（来自样本基金的重仓行业）</label><select data-fdin="co">${fdOpts(sel,cfg.co)}</select></div>${warn?fdCard('这家公司的数据有个坑',warn,true):''}
<div style="margin-top:8px">${fin}</div>${fdLine([{name:'加权ROE%',y:s.a.map(a=>a.roe)},{name:'净利率%',y:s.a.map(a=>a.nm)}],{labels:ys,fmt:v=>v.toFixed(0),title:'ROE与净利率'})}
${fdLine([{name:'基本EPS',y:s.a.map(a=>a.eps)},{name:'每股经营现金流',y:s.a.map(a=>a.cfps)}],{labels:ys,title:'EPS与每股经营现金流'})}
${fdSrc('东方财富数据中心 RPT_F10_FINANCE_MAINFINADATA（年报）、行情快照接口；分红来自 RPT_SHAREBONUS_DET，按年度汇总')}</div>
<div class="fd-task"><b>任务 1</b>：先不看下面的拆解，用上表写两句话——这家公司过去五年的利润是怎么增长的？利润有没有变成现金？写进“备忘录·关键证据”。</div>
<div class="section-label">Step 2 · ROE 杜邦拆解</div>
<div class="panel">${dup}<p class="fd-note">ROE≈净利率×总资产周转率×权益乘数。这里的三个因子来自接口的比率字段，与“加权ROE”口径不同（加权ROE用平均权益），差异列用来提醒你：<b style="display:inline">拆出来的数不等于报表的数</b>，只用于判断变化方向。银行、保险的周转率没有可比含义。</p></div>
<div class="section-label">Step 3 · 价格里包含了什么（反向估值）</div>
<div class="panel"><div class="fd-ctrl"><div class="field"><label>折现率 <span class="val">${fdPc(cfg.r*100,1)}</span></label><input type="range" data-fdin="r" min="6" max="14" step="0.5" value="${cfg.r*100}"></div><div class="field"><label>终值增速 <span class="val">${fdPc(cfg.tg*100,1)}</span></label><input type="range" data-fdin="tg" min="0" max="4" step="0.5" value="${cfg.tg*100}"></div></div><div id="fd-out">${fdValOut(s,cfg)}</div></div>
<div class="section-label">Step 4 · 红旗扫描（14家横向，点公司名切换）</div>
<div class="panel">${fdTbl(['公司','类型','动态PE','ROE%','触发的红旗'],flagRows)}<p class="fd-note">红旗只是“该去翻哪张表”的提示，不是结论。规则：非金融公司近3年现金含量&lt;0.8、ROE连续3年下降、杠杆5年抬升&gt;10pt、最新亏损或净利降&gt;30%、PE为负。</p></div>
<div class="section-label">Step 5 · 客观验收（${s.n}）</div>${fdValQuiz(s,s.c)}
<div class="section-label">Step 6 · 写一份投资备忘录</div>
<div class="panel"><div class="form-grid">
${fdMemoBox('thesis','一句话投资逻辑（含时间窗）','例如：未来12个月，……将让市场上调盈利预期')}
${fdMemoBox('consensus','价格隐含的共识','把 Step 3 的“隐含增速”和历史CAGR写进来')}
${fdMemoBox('variant','我的差异化观点（必须能被数据检验）','与共识不同的地方，以及我凭什么')}
${fdMemoBox('evidence','关键证据（3条以内，附数字和来源年份）','点击下方按钮可插入当前数字')}
${fdMemoBox('scen','熊/基准/牛三种情景与概率','熊市30%：……；基准50%：……；牛20%：……')}
${fdMemoBox('risk','风险与证伪条件（什么情形下我认错）','写成可观测事件，如“连续两个季度CFPS/EPS<0.8”')}
</div><div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn small" data-fdact="ins">插入当前数字到“关键证据”</button><button class="btn teal small" data-fdact="dl">下载投资备忘录（Markdown）</button></div></div>`},
set(name,val,el){
 if(fdMemoSet(name,val))return;
 const cfg=fdCfg('val');
 if(name==='co'){cfg.co=val;renderFund();return}
 cfg[name]=parseFloat(val)/100;el.parentElement.querySelector('.val').textContent=parseFloat(val).toFixed(1)+'%';fdOut(fdValOut(fdSt(cfg.co),cfg))},
act(a,arg){
 const cfg=fdCfg('val'),s=fdSt(cfg.co),l=fdLast(s),f=fdState();
 if(a==='pick'){cfg.co=arg;renderFund();return}
 const ig=fdImplG(s,cfg.r,cfg.tg),num=`${s.n}（${s.c}，${s.ind}）：${l.y}年 营收${fdF(l.rev_yi,0)}亿、归母净利${fdF(l.np_yi,1)}亿、ROE ${fdF(l.roe,1)}%、净利率${fdF(l.nm,1)}%、资产负债率${fdF(l.debt,1)}%；现价${fdF(s.q.price,2)}元（${s.q.date}），动态PE ${fdF(s.q.pe,1)}、PB ${fdF(s.q.pb,2)}；折现率${fdPc(cfg.r*100,1)}、终值增速${fdPc(cfg.tg*100,1)}下隐含10年盈利增速 ${Number.isFinite(ig)?fdPc(ig*100,1):'无解'}，近5年净利CAGR ${Number.isFinite(fdCagrNp(s,5))?fdPc(fdCagrNp(s,5)*100,1):'—'}`;
 if(a==='ins'){f.memo.evidence=(f.memo.evidence?f.memo.evidence+'\n':'')+num;renderFund();return}
 const g=k=>f.memo[k]||'（待填）';
 fdDownload('投资备忘录_'+s.n+'.md',`# 投资备忘录：${s.n}（${s.c}）\n\n## 一句话逻辑\n${g('thesis')}\n\n## 价格隐含的共识\n${g('consensus')}\n\n## 我的差异化观点\n${g('variant')}\n\n## 关键证据\n${g('evidence')}\n\n## 情景与概率\n${g('scen')}\n\n## 风险与证伪条件\n${g('risk')}\n\n> 数据：东方财富数据中心/行情公开接口，快照 ${FR.snap}；训练用途，不构成投资建议，引用前请核对公司公告。`)}};
