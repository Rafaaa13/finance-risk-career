/* 固收·利率与久期：计算 */
const fdBond=()=>FR.funds.filter(f=>/债/.test(f.cat));
function fdCurve(i){const y=FR.yld,g=k=>y[k][i];return{cn2:g('cn2'),cn5:g('cn5'),cn10:g('cn10'),cn30:g('cn30'),us2:g('us2'),us10:g('us10'),s102:(g('cn10')-g('cn2'))*100,s3010:(g('cn30')-g('cn10'))*100,sp:(g('cn10')-g('us10'))*100}}
function fdFiCurve(i){const c=fdCurve(i);return `<p class="fd-note"><b>${FR.months[i]}</b> 月末</p>`+fdKpis([['中国 2Y / 5Y',`${fdF(c.cn2,3)} / ${fdF(c.cn5,3)}%`],['中国 10Y / 30Y',`${fdF(c.cn10,3)} / ${fdF(c.cn30,3)}%`],['10Y−2Y / 30Y−10Y',`${fdF(c.s102,0)} / ${fdF(c.s3010,0)} bp`],['中国10Y−美国10Y',`${fdF(c.sp,0)} bp`]])}
function fdDurM(f){const x=fdYd('cn10'),o=fdOls(f.r,[x]);return{a:o.b[0],b:o.b[1],D:-100*o.b[1],r2:o.r2,t:o.t[1],n:o.n,be:-o.b[0]/o.b[1]}}
function fdDurD(f){if(!f.dy)return null;const mp={};FR.cn10d.d.forEach((d,i)=>mp[d]=FR.cn10d.y[i]);
 const dates=f.dy.d,xs=[],ys=[];let prev=null;
 dates.forEach((d,i)=>{if(mp[d]===undefined){prev=null;return}if(prev!==null){xs.push((mp[d]-prev)*100);ys.push(f.dy.r[i])}prev=mp[d]});
 const o=fdOls(ys,[xs]);return{a:o.b[0],b:o.b[1],D:-100*o.b[1],r2:o.r2,n:o.n}}
function fdQ4(f){if(!f.q4)return null;const v=f.q4.map(x=>x[1]),b=v[0];let m=0,mi=0;v.forEach((x,i)=>{const d=x/b-1;if(d<m){m=d;mi=i}});return{dd:m*100,date:f.q4[mi][0],path:v.map(x=>(x/b-1)*100),dates:f.q4.map(x=>x[0])}}
function fdShock(){const s=FR.shock,y=s.cn10;let mx=0,mi=0;y.forEach((v,i)=>{if(v-y[0]>mx){mx=v-y[0];mi=i}});return{up:mx*100,date:s.d[mi],start:y[0],peak:y[mi],end:y[y.length-1]}}
function fdEq(f){const eq=fdOls(f.r,[fdIdxR('国债指数'),fdIdxR('沪深300')]);return{bond:eq.b[1],eq:eq.b[2],r2:eq.r2}}
function fdFiQuiz(cfg,tag){const f=fdFund(cfg.c),m=fdDurM(f),d=fdDurD(fdFund('511260')),q=fdQ4(f),c=fdCurve(60),sh=fdShock(),e=fdEq(f),qs=[];
 qs.push({k:'slope',q:`${FR.months[60]} 月末，中国国债 10年−2年 期限利差（bp）？`,a:c.s102,tol:0.6,unit:'bp',ex:`10Y ${fdF(c.cn10,3)}% − 2Y ${fdF(c.cn2,3)}% = ${fdF(c.s102,1)}bp。利差走阔通常对应曲线陡峭化，对长久期资产不利/对短端更友好要结合原因判断。`,hint:'(10年收益率−2年收益率)×100'});
 qs.push({k:'dur',q:`${f.n}：用 60 个月收益对中国10年国债收益率月变动（bp）回归，估算有效久期（= −100×斜率，年）？`,a:m.D,tol:0.08,unit:'年',ex:`回归 r=${fdF(m.a,3)}+${fdF(m.b,4)}·Δy，R²=${fdF(m.r2,2)}，D≈${fdF(m.D,2)}年。${f.adj?'':'注意：该基金累计净值口径异常，月度收益在派息月被低估，估算偏差较大，应改看日度版。'}${m.r2<0.3?' R²低：该基金收益主要不来自利率，久期只是个数字。':''}`,hint:'斜率单位是“%/bp”，乘 −100 得到久期'});
 qs.push({k:'be',q:`按上述回归，使该基金单月收益刚好为 0 的 10年国债收益率月度上行幅度（= −截距÷斜率，bp）？`,a:m.be,tol:0.6,unit:'bp',ex:`截距 ${fdF(m.a,3)}%（月 carry 及其他）÷ 斜率 ${fdF(m.b,4)}：约 ${fdF(m.be,1)}bp。这是“票息保护垫”的经验估计，不是承诺。`});
 qs.push({k:'dd',q:`日度回归：十年国债ETF国泰（511260）近一年（${d.n}个交易日）日收益对 10Y 收益率日变动（bp）回归，有效久期（年）？`,a:d.D,tol:0.15,unit:'年',ex:`D≈${fdF(d.D,2)}年，R²=${fdF(d.r2,2)}。日度回归避免了月度分红和采样错位，数值通常比月度版更可信。`,hint:'只取两边都有数据的交易日；Δy 用相邻两个基金交易日的收益率差'});
 qs.push(q?{k:'q4',q:`2022-10-31 至 2022-12-30（9个观察日）${f.n}相对 10-31 净值的最大回撤（%，负数）？`,a:q.dd,tol:0.05,unit:'%',ex:`最低点出现在 ${q.date}，为 ${fdPc(q.dd,2)}。同期中国10Y 自 ${fdF(sh.start,3)}% 升至最高 ${fdF(sh.peak,3)}%（${sh.date}），上行 ${fdF(sh.up,1)}bp。只有9个观察日，真实日内回撤可能更深。`}
  :{k:'q4',q:`中国10年国债收益率在 2022-10-31 至 2022-12-30 窗口内相对起点的最大上行（bp）？`,a:sh.up,tol:0.6,unit:'bp',ex:`起点 ${fdF(sh.start,3)}% → 最高 ${fdF(sh.peak,3)}%（${sh.date}）。所选基金没有2022Q4数据，改答利率冲击本身。`});
 qs.push({k:'eq',q:`${f.n} 月收益同时对国债指数、沪深300回归（60个月）：沪深300的系数（权益敏感度）？`,a:e.eq,tol:0.02,unit:'',ex:`国债指数系数 ${fdF(e.bond,2)}，沪深300系数 ${fdF(e.eq,3)}，R² ${fdF(e.r2,2)}。对照最近报告期股票占净值：${fdPc(f.al.stock[f.al.stock.length-1],1)}。回归系数是事后的“有效权益暴露”。`});
 return fdQuiz('fi',qs,tag)}
