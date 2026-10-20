function fdRiskVarOut(cfg){const f=fdFund(cfg.c),v=fdVar(f,cfg.conf),r=f.dy.r;
 const bins=[];const mn=Math.floor(Math.min(...r)),mx=Math.ceil(Math.max(...r));for(let b=mn;b<mx;b+=0.5){bins.push([b,r.filter(x=>x>=b&&x<b+0.5).length])}
 const mxc=Math.max(...bins.map(b=>b[1]));
 const hist=`<div class="fd-chart"><div class="fd-legend">日收益分布（${f.dy.d[0]} ~ ${f.dy.d[f.dy.d.length-1]}，%）；虚线=${cfg.conf*100}% VaR 位置</div><svg viewBox="0 0 720 150" width="100%">${bins.map((b,i)=>{const w=700/bins.length,h=b[1]/mxc*110;const lose=b[0]+0.5<=-v.var;return `<rect x="${10+i*w}" y="${125-h}" width="${w-2}" height="${h}" fill="${lose?'#b4543f':'#1f8f8f'}" fill-opacity=".8"/><text x="${10+i*w+w/2}" y="142" font-size="8" text-anchor="middle" fill="#6b8187">${b[0]}</text>`}).join('')}</svg></div>`;
 return fdKpis([[`${cfg.conf*100}% 1日 历史VaR`,fdPc(v.var,2),'neg'],['预期损失 ES',fdPc(v.es,2),'neg'],['参数法 VaR (zσ)',fdPc(v.par,2)],['日波动σ',fdPc(v.sd,2)]])+
 fdKpis([['回测：期望例外',fdF(v.exp,1)+' 天'],['回测：实际例外',v.x+' 天',v.x>v.exp*1.8?'neg':''],['Kupiec LR / p',`${fdF(v.lr,2)} / ${fdF(v.pv,3)}`],['样本 / 估计窗',`${v.n} / ${Math.floor(v.n/2)} 天`]])+hist}
FDV.risk={render(){
 const cfg=fdCfg('rk',{c:'005827',conf:0.95,fc:'110011',R:20}),dl=fdDaily();
 const mt=fdTbl(['基金','类别','最差单月%','月度5%分位%','最大回撤%','年化波动%'],FR.funds.map(f=>{const dd=fdDD(f.r);return[f.n,f.cat,fdF(Math.min(...f.r),2),fdF(fdQtl(f.r,0.05),2),fdF(dd.mdd*100,1),fdF(fdSd(f.r)*Math.sqrt(12),1)]}));
 const hd=fdTbl(['基金','最大单只持仓','占净值%','距10%上限(pct)','说明'],FR.funds.filter(f=>f.top&&f.top.rows.length).map(f=>{const m=f.top.rows.slice().sort((a,b)=>b[2]-a[2])[0],idx=/指数/.test(f.cat)&&!/增强/.test(f.cat);return[f.n,m[1],fdF(m[2],2),fdF(10-m[2],2),idx?'被动指数基金可豁免(第三十二条第二款)':(10-m[2]<0?'<span class="tag red">披露值&gt;10%：需回原文核实</span>':(10-m[2]<1?'<span class="tag amber">逼近上限</span>':'—'))]}).sort((a,b)=>parseFloat(a[3])-parseFloat(b[3])));
 const ch=fdCoHold().slice(0,8),cho=fdTbl(['管理人(按基金名推断)','公司','合计市值(亿元)','占公司总市值%','涉及基金'],ch.map(o=>[o.co,o.st.n,fdF(o.v,2),fdF(o.pct,4),o.fs.join('；')]));
 const fc=fdFund(cfg.fc),rd=fdRedeem(fc),al=fc.al,i=al.d.length-1;
 const rtab=fdTbl(['基金','最近季','赎回/季初份额%','净赎回/季初份额%','机构持有%','现金占净值%','现金覆盖(倍)'],FR.funds.map(f=>{const x=fdRedeem(f);if(!x)return null;const h=f.hd;return[f.n,x.d,fdF(x.rr*100,1),fdF(x.nr*100,1),h.inst?fdF(h.inst[h.inst.length-1],1):'—',fdF(f.al.cash[f.al.cash.length-1],1),fdF(x.cover,1)]}).filter(Boolean).sort((a,b)=>parseFloat(b[2])-parseFloat(a[2])).slice(0,14));
 const need=Math.max(0,cfg.R-al.cash[i]);
 const rules=FR.rules.map(r=>[`<span class="tag ${r.status==='现行'?'':(r.status==='未核实'?'red':'amber')}">${r.status}</span>`,r.topic||r.id,esc(r.cite||'—'),esc(r.effective||'—'),r.url?`<a href="${esc(r.url)}" target="_blank" rel="noopener">官方来源</a>`:'—']);
 return `<div class="section-label">Step 1 · 风险度量：VaR / ES 与回测（真实日度净值）</div>
<div class="panel"><div class="fd-ctrl" style="grid-template-columns:2fr 1fr"><div class="field"><label>有日度数据的基金（近一年242个交易日）</label><select data-fdin="c">${fdOpts(dl.map(f=>[f.c,`${f.c} ${f.n}`]),cfg.c)}</select></div><div class="field"><label>置信度</label><select data-fdin="conf">${fdOpts([[0.95,'95%'],[0.99,'99%']],cfg.conf)}</select></div></div><div id="fd-out">${fdRiskVarOut(cfg)}</div>
<p class="fd-note">VaR 只回答“正常情况下一天最多亏多少”，不回答越线后多糟（看 ES）。一年的样本对 99% VaR 意味着只有约 2–3 个尾部点，估计极不稳定。${fdSrc('天天基金日涨跌幅（JZZZL），2025-10-20 至 2026-10-19')}</p></div>
<div class="fd-task"><b>任务 1</b>：对 511260（十年国债ETF）和 005827 各做一次 95% VaR，并回答：为什么债券基金的 VaR 数字小很多，却不能说它“更安全”？（提示：杠杆、流动性、久期、尾部形态。）</div>
<div class="panel"><div class="section-label" style="margin-top:0">全部基金的月度风险一览（60个月）</div>${mt}</div>
<div class="section-label">Step 2 · 投资限制监控（基于季报前十大，非实时）</div>
<div class="panel"><p class="fd-note">规则库：《运作办法》第三十二条(一)(二)、第三十五条（状态见 Step 5）。下面用样本基金<b style="display:inline">最近一期披露的前十大持仓</b>做练习，监控的是“披露口径”，不等于公司实时监控系统。</p>${hd}
<div style="margin-top:12px">${cho}</div><p class="fd-note">第二个表按基金名称前缀推断管理人，用公司<b style="display:inline">总市值</b>近似“该证券的发行量”，仅覆盖本工作台收录的 ${FR.stocks.length} 家A股，且只含样本内的基金，所以是下界。</p></div>
<div class="section-label">Step 3 · 流动性与赎回压力</div>
<div class="panel"><div class="fd-ctrl" style="grid-template-columns:2fr 1fr"><div class="field"><label>选择基金</label><select data-fdin="fc">${fdFundOpts(cfg.fc,f=>f.fw&&f.fw.d.length>1)}</select></div><div class="field"><label>假设未来一个季度赎回比例 <span class="val">${cfg.R}%</span></label><input type="range" data-fdin="R" min="5" max="50" step="1" value="${cfg.R}"></div></div>
${fdKpis([['最近季赎回/季初份额',rd?fdPc(rd.rr*100,1):'—'],['现金占净值',fdPc(al.cash[i],1)],['假设赎回所需额外变现',fdPc(need,1)+' 净值'],['机构持有比例',fc.hd.inst?fdPc(fc.hd.inst[fc.hd.inst.length-1],1):'—']])}
<p class="fd-note">压力情景：赎回 ${cfg.R}% 净值，现金 ${fdPc(al.cash[i],1)}，其余 ${fdPc(need,1)} 需要卖出其他资产。卖出的是否为前十大、成交量够不够、冲击成本多大、是否触发巨额赎回，这些在本数据里<b style="display:inline">没有</b>——风控要向交易台和中后台要日度持仓与成交量。${fdSrc('天天基金 pingzhongdata：申购赎回、资产配置、持有人结构（季度披露）')}</p>
${rtab}<p class="fd-note">表中按“最近季赎回/季初份额”排序（前14只）。“现金覆盖”只算现金科目，债券基金与ETF联接基金里高流动性的债券/ETF没有计入，横向比较要谨慎。</p></div>
<div class="section-label">Step 4 · 客观验收</div>${fdRiskQuiz()}
<div class="section-label">Step 5 · 规则库（引用官方原文；未核实的不装懂）</div>
<div class="panel">${fdCard('先看这条','证监会 2026-10-09 发布了《公开募集证券投资基金运作管理办法（征求意见稿）》（意见反馈至 2026-11-08），现行仍是证监会令第104号。双十、80%分类等是否调整，我们没有读到征求意见稿正文：<b style="display:inline">凡引用该办法的结论，定稿后以新文本为准</b>。',true)}
${fdTbl(['状态','主题','出处/文号','施行日期','链接'],rules)}
<p class="fd-note">未能核实的事项（需要你在浏览器打开原文核对）：</p><ul class="goal-list">${FR.unv.map(u=>`<li style="color:#76542d">${esc(u)}</li>`).join('')}</ul></div>
<div class="section-label">Step 6 · 写一页风险周报</div>
<div class="panel"><div class="form-grid">
${fdMemoBox('r_risk','本周风险事实（VaR/回撤/集中度/赎回，附数字与日期）','')}
${fdMemoBox('r_limit','限制与合规检查：哪些逼近上限、需要谁处理、期限','引用规则条号；未核实的写“待核实”')}
${fdMemoBox('r_liq','流动性判断：最坏情形下怎么满足赎回','现金、可变现资产、持有人结构')}
${fdMemoBox('r_act','建议动作与升级路径','')}
</div><div style="margin-top:12px"><button class="btn teal small" data-fdact="dl">下载风险周报（Markdown）</button></div></div>`},
set(name,val,el,type){if(fdMemoSet(name,val))return;const cfg=fdCfg('rk');
 if(name==='R'){cfg.R=+val;el.parentElement.querySelector('.val').textContent=val+'%';if(type==='change')renderFund();return}
 if(name==='c'||name==='conf'){cfg[name]=name==='conf'?+val:val;fdOut(fdRiskVarOut(cfg));return}
 cfg[name]=val;renderFund()},
act(){const cfg=fdCfg('rk'),f=fdFund(cfg.c),v=fdVar(f,cfg.conf),m=fdState().memo,g=x=>m[x]||'（待填）';
 fdDownload('风险周报_'+f.c+'.md',`# 风险周报（训练稿）\n\n对象：${f.n}（${f.c}）\n${cfg.conf*100}% 1日 VaR ${fdPc(v.var,2)}，ES ${fdPc(v.es,2)}（样本 ${v.n} 日，${f.dy.d[0]}~${f.dy.d[f.dy.d.length-1]}）；回测例外 ${v.x} 天（期望 ${fdF(v.exp,1)}）\n\n## 风险事实\n${g('r_risk')}\n\n## 限制与合规\n${g('r_limit')}\n\n## 流动性\n${g('r_liq')}\n\n## 建议动作\n${g('r_act')}\n\n> 数据：天天基金公开接口，快照 ${FR.snap}；规则引用见工作台规则库，未核实项已标注；训练用途。`)}};
