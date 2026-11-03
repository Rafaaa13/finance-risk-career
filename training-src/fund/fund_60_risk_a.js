/* 风控合规：计算 */
const FD_CO=['易方达','富国','中欧','兴全','景顺长城','汇添富','交银','工银','华夏','银河','大成','嘉实','长信','广发','建信','博时','招商','南方'];
const fdCo=f=>FD_CO.find(p=>f.n.startsWith(p))||(/国泰/.test(f.n)?'国泰':'其他');
const fdDaily=()=>FR.funds.filter(f=>f.dy);
function fdErfc(x){const t=1/(1+0.3275911*x),y=t*(0.254829592+t*(-0.284496736+t*(1.421413741+t*(-1.453152027+t*1.061405429))));return y*Math.exp(-x*x)}
function fdVar(f,conf){const r=f.dy.r,q=fdQtl(r,1-conf),z=conf===0.99?2.326:1.645,tail=r.filter(x=>x<=q),n=r.length,half=Math.floor(n/2),qh=fdQtl(r.slice(0,half),1-conf);
 const N=n-half,x=r.slice(half).filter(v=>v<qh).length,p=1-conf,ll=(k)=>k>0&&k<N?(N-k)*Math.log(1-k/N)+k*Math.log(k/N):0;
 const lr=-2*((N-x)*Math.log(1-p)+x*Math.log(p)-ll(x)),pv=fdErfc(Math.sqrt(Math.max(0,lr)/2));
 return{n,var:-q,es:-fdMean(tail),par:z*fdSd(r),qh:-qh,N,x,exp:N*p,lr,pv,sd:fdSd(r)}}
function fdMaxW(){let best=null;FR.funds.forEach(f=>{if(/指数/.test(f.cat)&&!/增强/.test(f.cat))return;(f.top&&f.top.rows||[]).forEach(r=>{if(!best||r[2]>best.w)best={f,w:r[2],name:r[1]}})});return best}
function fdCoHold(){const out={};FR.funds.forEach(f=>{const rows=f.top&&f.top.rows||[],net=f.al.net[f.al.net.length-1];rows.forEach(r=>{const st=FR.stocks.find(s=>s.c===r[0]);if(!st)return;const key=fdCo(f)+'|'+st.c,v=r[2]/100*net;out[key]=out[key]||{co:fdCo(f),st,v:0,fs:[]};out[key].v+=v;out[key].fs.push(f.n+' '+r[2]+'%')})});
 return Object.values(out).map(o=>({...o,pct:o.v/o.st.q.mcap_yi*100})).sort((a,b)=>b.pct-a.pct)}
function fdRedeem(f){const w=f.fw,n=w.d.length;if(n<2)return null;const beg=w.shares[n-2],rr=w.redeem[n-1]/beg,nr=(w.redeem[n-1]-w.buy[n-1])/beg,navps=f.al.net[f.al.net.length-1]/w.shares[n-1],amt=w.redeem[n-1]*navps,cash=f.al.cash[f.al.cash.length-1]/100*f.al.net[f.al.net.length-1];
 return{d:w.d[n-1],rr,nr,amt,cash,cover:cash/amt,navps,beg}}
function fdRiskQuiz(){const f=fdFund('005827'),v=fdVar(f,0.95),mw=fdMaxW(),ch=fdCoHold().find(x=>x.co==='易方达'&&x.st.c==='600519'),rd=fdRedeem(f),qs=[];
 qs.push({k:'v95',q:`${f.n} 近一年 ${v.n} 个交易日，1日 95% 历史模拟 VaR（取日收益率经验分位数，线性插值，%，输出正数）？`,a:v.var,tol:0.03,unit:'%',ex:`日收益从小到大排序，5%分位=${fdF(-v.var,3)}%，VaR=${fdF(v.var,3)}%。参数法（1.645σ）=${fdF(v.par,3)}%。两者差异本身就是“分布有没有肥尾”的信号。`,hint:'分位数位置=(n−1)×0.05，相邻两点线性插值'});
 qs.push({k:'es',q:`同样样本，95% 预期损失 ES（日收益 ≤ 5%分位数 的那些交易日的平均值，输出正数，%）？`,a:v.es,tol:0.03,unit:'%',ex:`ES=${fdF(v.es,3)}% ≥ VaR ${fdF(v.var,3)}%。VaR 只告诉你“门槛”，ES 告诉你“越线以后平均多糟”，对尾部风险更诚实。`});
 qs.push({k:'exc',q:`回测：用前 ${Math.floor(v.n/2)} 天估计 95% VaR，后 ${v.N} 天里实际亏损超过该 VaR 的“例外天数”是多少？（亏损严格大于VaR才算）`,a:v.x,tol:0.01,unit:'天',ex:`估计的VaR=${fdF(v.qh,3)}%，期望例外 ${fdF(v.exp,1)} 天，实际 ${v.x} 天，Kupiec POF 检验 LR=${fdF(v.lr,2)}，p≈${fdF(v.pv,3)}${v.pv<0.05?'（拒绝“VaR 校准良好”）':'（不拒绝）'}。前半段平静、后半段波动抬升时，例外会偏多——VaR 是滞后的。`});
 qs.push({k:'mxw',q:`投资限制：在本样本基金（不含被动指数）的前十大持仓里，单只股票占净值最高的是 ${mw.f.n} 的 ${mw.name}。它与“一只基金持有一家公司发行证券≤基金资产净值10%”的上限相差多少个百分点？（上限 − 披露占比；负数表示披露数据高于10%）`,a:10-mw.w,tol:0.03,unit:'pct',ex:`${mw.name} 占净值 ${fdF(mw.w,2)}%（${mw.f.top.asof} 报告期），上限−占比=${fdF(10-mw.w,2)} 个百分点。${mw.w>10?'披露数据高于10%：可能是市场上涨造成的被动超标（第三十五条：因市场波动等非管理人原因超标的，应在十个交易日内调整），也可能是口径差异（同一发行人证券合并计算、净值基数）或数据问题。不能凭这张表认定违规，要回到定期报告原文、交易与估值记录核实。':'距上限尚有缓冲；市场上涨会被动推高占比，依据第三十五条，因市场波动等非管理人原因超标的，应在十个交易日内调整。'}注意：同一发行人的 A股、H股、债券要合并计算，这里只看了单只股票。`});
 qs.push({k:'co',q:`同一管理人合计持股：${ch.co}旗下样本基金（${ch.fs.join('；')}）合计持有 ${ch.st.n} 的市值，占其总市值的百分比（净资产取最近一期）？`,a:ch.pct,tol:0.005,unit:'%',ex:`合计市值≈${fdF(ch.v,2)}亿元 ÷ ${ch.st.n}总市值 ${fdF(ch.st.q.mcap_yi,0)}亿元 = ${fdF(ch.pct,4)}%。大盘蓝筹远低于第三十二条(二)的 10% 上限（该条按“证券”的发行量而非市值计算，这里用总市值近似）；它在小盘股和流动性差的品种上才会真正约束。`});
 qs.push({k:'rr',q:`${f.n} ${rd.d} 当季赎回份额 ÷ 季初份额（%）？（季初份额=上一报告期末总份额）`,a:rd.rr*100,tol:0.1,unit:'%',ex:`${fdF(f.fw.redeem[f.fw.d.length-1],2)}亿份 ÷ ${fdF(rd.beg,2)}亿份 = ${fdPc(rd.rr*100,2)}。这是整季合计，不是单日；“巨额赎回”看的是单个开放日净赎回占总份额是否超过10%（《运作办法》第二十三条）。`});
 qs.push({k:'cc',q:`现金覆盖：期末现金（现金占净值%×净资产）÷ 当季赎回金额（赎回份额×净资产/期末份额）是多少倍？`,a:rd.cover,tol:0.03,unit:'倍',ex:`现金≈${fdF(rd.cash,2)}亿，赎回金额≈${fdF(rd.amt,2)}亿（用净资产÷期末份额近似单位净值 ${fdF(rd.navps,3)}），覆盖 ${fdF(rd.cover,2)} 倍。这个季度现金能覆盖；但现金高也可能是“已经为赎回卖出了股票”的结果。`});
 const R=id=>FR.rules.find(r=>r.id===id);
 const rq=[['ru1','double10','《公开募集证券投资基金运作管理办法》第三十二条(一)：一只基金持有一家公司发行的证券，市值不得超过基金资产净值的多少？','10%',['5%','10%','15%','20%']],
  ['ru2','redemption_large','第二十三条：开放式基金单个开放日净赎回申请超过基金总份额的多少，为巨额赎回？','10%',['5%','10%','20%','30%']],
  ['ru3','open_cash5','第二十八条：开放式基金应保持不低于基金资产净值多少的现金或到期日在一年以内的政府债券（特殊品种除外）？','5%',['3%','5%','10%','15%']],
  ['ru4','mmf_redemption','《货币市场基金监督管理办法》第十七条：现金、国债、央票、政策性金融债券及5个交易日内到期的其他金融工具合计低于基金资产净值的多少，且偏离度为负时，须对大额赎回征收强制赎回费？','5%',['3%','5%','10%','20%']]];
 rq.forEach(([k,id,q,a,opts])=>qs.push({k,type:'choice',q:q+`（规则库：${id}，状态 ${R(id).status}）`,opts,a,ex:`原文：${R(id).quote.slice(0,260)}…（${R(id).cite}）`}));
 return fdQuiz('risk',qs)}
