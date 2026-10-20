FDV.attr={render(){
 const cfg=fdCfg('attr',{c:'005827',bm:'沪深300',win:60});
 if(!fdFund(cfg.c)){cfg.c='005827'}
 const f=fdFund(cfg.c),k=fdAttrCalc(cfg),tag=`${cfg.c}|${cfg.bm}|${cfg.win}`;
 const bms=Object.keys(FR.idx);
 const fac=FD_STYLE,sty=k.sty,coefRows=['截距(月%)',...fac].map((n,i)=>[n,fdF(sty.b[i],3),fdF(sty.t[i],2),Math.abs(sty.t[i])>=2?'<span class="tag">显著(|t|≥2)</span>':'<span class="tag amber">不显著</span>']);
 const top=f.top&&f.top.rows&&f.top.rows.length?f.top:null;
 let hold='';
 if(top){const ind={};top.rows.forEach(x=>{ind[x[3]||'未分类']=(ind[x[3]||'未分类']||0)+x[2]});const il=Object.entries(ind).sort((a,b)=>b[1]-a[1]);
  hold=fdTbl(['代码','名称','占净值%','行业','较上期变动(pct)'],top.rows.map(x=>[x[0],x[1],fdF(x[2],2),x[3]||'—',x[4]==null?'—':fdF(x[4],2)]))+
  `<p class="fd-note">报告期 ${top.asof}。前十大合计 ${fdPc(fdSum(top.rows.map(x=>x[2])),1)}；行业合计：${il.map(x=>x[0]+' '+fdF(x[1],1)+'%').join('、')}。季报披露有滞后，且只披露前十大：<b style="display:inline">这不是今天的持仓</b>。</p>`}
 else hold=`<p class="fd-note">该基金没有前十大股票明细（债券基金、联接基金常见；联接基金真实持仓在目标ETF里）。${f.bt?'前五大债券：'+f.bt.map(x=>x.join(' ')).join('；'):''}</p>`;
 const a=f.al,alloc=fdTbl(['报告期','股票%','债券%','现金%','净资产(亿)'],a.d.map((d,i)=>[d,fdF(a.stock[i],1),fdF(a.bond[i],1),fdF(a.cash[i],1),fdF(a.net[i],1)]));
 const yrs=[2022,2023,2024,2025,2026],bm=fdIdxR(cfg.bm);
 const exm=(()=>{const rr=f.r,idx=rr.map((_,i)=>i),row=i=>[FR.months[i+1],fdF(rr[i],1),fdF(bm[i],1),fdF(rr[i]-bm[i],1)],hd=t=>[t,'基金%','基准%','超额(pct)'];return `<div class="fd-two"><div>${fdTbl(hd('最好的5个月'),idx.slice().sort((a,b)=>rr[b]-rr[a]).slice(0,5).map(row))}</div><div>${fdTbl(hd('最差的5个月'),idx.slice().sort((a,b)=>rr[a]-rr[b]).slice(0,5).map(row))}</div></div>`})();
 const yt=fdTbl(['自然年','基金%','基准%','超额(pct)'],yrs.map(y=>{const a1=fdYearRet(f.r,y),b1=fdYearRet(bm,y);return[y+(y===2026?'(至9月)':''),fdF(a1*100,1),fdF(b1*100,1),fdF((a1-b1)*100,1)]}));
 return `<div class="section-label">Step 1 · 选基金与基准</div>
<div class="panel"><div class="fd-ctrl" style="grid-template-columns:2fr 1fr 1fr"><div class="field"><label>基金（${FR.funds.length}只，真实存续产品）</label><select data-fdin="c">${fdFundOpts(cfg.c)}</select></div><div class="field"><label>比较基准（默认按基金类型）</label><select data-fdin="bm">${fdOpts(bms.map(x=>[x,x]),cfg.bm)}</select></div><div class="field"><label>统计窗口</label><select data-fdin="win">${fdOpts([[12,'最近12个月'],[24,'最近24个月'],[36,'最近36个月'],[60,'最近60个月']],cfg.win)}</select></div></div>
<p class="fd-note">${f.n}（${f.c}）· ${f.cat} · 现任基金经理：${esc(f.mgr)} · 来源报告的阶段涨幅：近1月 ${fdPc(f.ret.m1,2)} / 近3月 ${fdPc(f.ret.m3,2)} / 近6月 ${fdPc(f.ret.m6,2)} / 近1年 ${fdPc(f.ret.y1,2)} ${fdAdjNote(f)}</p>
${fdCard('经理与业绩的“时间错配”','接口给出的是<b style="display:inline">现任</b>基金经理名单，不是每一段业绩对应的经理。评价经理能力要用其在任期内的业绩；基金业绩的历史段可能属于前任或不同的团队。这里的统计是“产品”而不是“某人”。',true)}
${fdAttrOut(cfg)}${fdSrc('天天基金净值接口（月末累计净值/单位净值）、东方财富指数月K、中国2年国债收益率均值作无风险利率')}</div>
<div class="fd-task"><b>任务 1</b>：先看净值路径和回撤，再看上面的指标。写一句话：这只基金的收益主要来自“承担了市场/风格风险”还是“相对基准的超额”？你的证据是 Beta、R²、Alpha 中的哪一个？</div>
<div class="section-label">Step 2 · 风格回归：它到底像什么</div>
<div class="panel"><p class="fd-note">用 60 个月收益对 沪深300、中证1000、创业板指、国债指数 做多元回归。R²=${fdF(sty.r2,2)}（样本 ${sty.n} 个月）。回归是“事后画像”，自变量互相相关时系数不稳，只看方向，不当作持仓。</p>${fdTbl(['因子','系数','t值','判断'],coefRows)}</div>
<div class="section-label">Step 3 · 持仓与资产配置体检</div>
<div class="panel">${hold}<div style="margin-top:10px">${alloc}</div></div>
<div class="section-label">Step 4 · 分年度超额（自然年）</div>
<div class="panel">${yt}<p class="fd-note">每个自然年的超额是否稳定？如果只有某一年很大，往往是风格的运气而不是可复制的能力。</p>${exm}<p class="fd-note">极端月份最能暴露基金的真实暴露：基准大涨/大跌的月份，基金是跟得上、跑得赢，还是严重落后？再对照风格回归，判断这是 Beta 还是择时/选股。</p></div>
<div class="section-label">Step 5 · 客观验收</div>${fdAttrQuiz(cfg,tag)}
<div class="section-label">Step 6 · 写一页基金体检结论</div>
<div class="panel"><div class="form-grid">
${fdMemoBox('a_src','收益来源（Beta / 风格 / Alpha）','用 Beta、风格回归系数、分年度超额作证据')}
${fdMemoBox('a_risk','风险与回撤体验','最大回撤发生在什么时候？持有人拿得住吗？')}
${fdMemoBox('a_hold','持仓与集中度的含义','前十大/行业集中的收益与风险；季报滞后的影响')}
${fdMemoBox('a_dur','能否复制、能否持续','需要什么额外证据？（更长样本、同类比较、经理任期）')}
</div><div style="margin-top:12px"><button class="btn teal small" data-fdact="dl">下载基金体检结论（Markdown）</button></div></div>`},
set(name,val){if(fdMemoSet(name,val))return;const cfg=fdCfg('attr');if(name==='c'){cfg.c=val;cfg.bm=fdDefBm(fdFund(val))}else if(name==='win')cfg.win=+val;else cfg[name]=val;renderFund()},
act(a){const cfg=fdCfg('attr'),f=fdFund(cfg.c),k=fdAttrCalc(cfg),m=fdState().memo,g=x=>m[x]||'（待填）';
 fdDownload('基金体检_'+f.c+'.md',`# 基金体检：${f.n}（${f.c}）\n\n窗口：最近${cfg.win}个月；基准：${cfg.bm}\n\n关键数字：年化${fdPc(k.st.ann*100,2)}，波动${fdPc(k.st.vol*100,2)}，最大回撤${fdPc(k.st.mdd*100,1)}，Beta ${fdF(k.vb.beta,2)}，年化Alpha ${fdPc(k.vb.alphaA*100,2)}，IR ${fdF(k.vb.ir,2)}，上/下行捕获 ${fdF(k.vb.up,2)}/${fdF(k.vb.dn,2)}\n\n## 收益来源\n${g('a_src')}\n\n## 风险与回撤体验\n${g('a_risk')}\n\n## 持仓与集中度\n${g('a_hold')}\n\n## 能否复制、能否持续\n${g('a_dur')}\n\n> 数据：天天基金/东方财富公开接口，快照 ${FR.snap}；训练用途，非投资建议。`)}};
