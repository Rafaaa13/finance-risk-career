/* 基金研究·持续性与FOF：计算 */
const fdEqU=()=>FR.funds.filter(f=>f.adj&&/权益|指数/.test(f.cat));
const fdCompound=(r,a,b)=>{let v=1;for(let i=a;i<b;i++)v*=1+r[i]/100;return v-1};
function fdWins(F,H){const w=[];for(let s=F;s+H<=60;s+=H)w.push(s);return w}
function fdIC(U,F,H,s){return fdSpearman(U.map(f=>fdCompound(f.r,s-F,s)),U.map(f=>fdCompound(f.r,s,s+H)))}
function fdSkew(a){const m=fdMean(a),s=fdSd(a),n=a.length;return s?fdSum(a.map(v=>((v-m)/s)**3))*n/((n-1)*(n-2)):0}
const FD_SIG=[['mom','过去收益',r=>fdCompound(r,0,r.length)],['lvol','低波动(−波动率)',r=>-fdSd(r)],['shp','过去夏普',r=>fdMean(r)/fdSd(r)],['mdd','浅回撤(最大回撤,越大越好)',r=>fdDD(r).mdd],['skew','收益偏度',r=>fdSkew(r)],['hit','上涨月份占比',r=>r.filter(x=>x>0).length/r.length],['rev3','近3个月收益',r=>fdCompound(r,r.length-3,r.length)],['best','最佳单月(彩票型)',r=>Math.max(...r)]];
function fdLg(z){const c=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5];let x=z,y=z,t=x+5.5;t-=(x+0.5)*Math.log(t);let s=1.000000000190015;for(let j=0;j<6;j++)s+=c[j]/++y;return -t+Math.log(2.5066282746310005*s/x)}
function fdTp(t,df){const pdf=x=>Math.exp(fdLg((df+1)/2)-fdLg(df/2))/Math.sqrt(df*Math.PI)*Math.pow(1+x*x/df,-(df+1)/2),n=2000,h=Math.abs(t)/n;let s=pdf(0)+pdf(Math.abs(t));for(let i=1;i<n;i++)s+=pdf(i*h)*(i%2?4:2);return Math.max(0,1-2*(s*h/3))}
function fdSigTable(U,F,H){const W=fdWins(F,H),rows=FD_SIG.map(([k,n,fn])=>{const ics=W.map(s=>fdSpearman(U.map(f=>fn(f.r.slice(s-F,s))),U.map(f=>fdCompound(f.r,s,s+H))));const m=fdMean(ics),sd=fdSd(ics),t=m/(sd/Math.sqrt(ics.length));return{k,n,m,sd,t,p:fdTp(t,ics.length-1),ics}});return{W,rows}}
function fdStatsAll(U,a,b){const rf=fdRf();return U.map(f=>{const r=f.r.slice(a,b);return{f,st:fdStat(r,rf)}})}
function fdFof(codes,mode){const fs=codes.map(fdFund),vols=fs.map(f=>fdSd(f.r)),w=mode==='iv'?vols.map(v=>1/v):vols.map(()=>1),sw=fdSum(w),ww=w.map(x=>x/sw);
 const r=fs[0].r.map((_,i)=>fdSum(fs.map((f,j)=>ww[j]*f.r[i])));return{r,w:ww,vols,st:fdStat(r,fdRf())}}
function fdAvgCorr(codes){const fs=codes.map(fdFund);let s=0,n=0;for(let i=0;i<fs.length;i++)for(let j=i+1;j<fs.length;j++){s+=fdCorr(fs[i].r,fs[j].r);n++}return s/n}
const FD_FOF0=['000628','110020','003358','340001','270023'];
function fdScreen(U,thr){const rf=fdRf(),L=U.map(f=>({f,st:fdStat(f.r.slice(0,36),rf),fw:fdStat(f.r.slice(36),rf)}));const pass=L.filter(x=>x.st.sharpe>=thr.sh&&x.st.mdd>=-thr.dd/100&&x.st.ann>=thr.an/100);return{L,pass}}
function fdQuantQuiz(){const U=fdEqU(),qs=[],unadj=FR.funds.filter(f=>!f.adj).length;
 const ic0=fdIC(U,12,12,12),W=fdWins(12,12),ics=W.map(s=>fdIC(U,12,12,s)),T=fdSigTable(U,12,6),best=T.rows.slice().sort((a,b)=>Math.abs(b.t)-Math.abs(a.t))[0];
 qs.push({k:'qc',q:`数据质检：${FR.funds.length}只基金里，有多少只因“累计净值口径异常/分红未复权”被标记，不能直接用于精确的收益比较？`,a:unadj,tol:0.01,unit:'只',ex:`被标记：${FR.funds.filter(f=>!f.adj).map(f=>f.n).join('、')}。拿到数据第一件事是质检：这些基金的月度收益在派息月被低估。后面的截面统计只用口径正常的 ${U.length} 只权益/指数基金。`});
 qs.push({k:'ic',q:`用 ${U.length} 只口径正常的权益/指数基金：形成期=${FR.months[1]}至${FR.months[12]}共12个月，持有期=其后12个月（${FR.months[13]}至${FR.months[24]}）。两段收益的秩相关（Spearman IC）？`,a:ic0,tol:0.03,unit:'',ex:`IC=${fdF(ic0,3)}。正=过去赢家继续赢，负=反转。单个窗口的 IC 噪声极大，样本只有${U.length}只，|IC|<${fdF(2/Math.sqrt(U.length),2)} 基本分不清和零的区别。`,hint:'分别对两段收益排名，再算排名的皮尔逊相关'});
 qs.push({k:'mic',q:`同样“12个月形成 / 12个月持有”，不重叠地滑动 ${W.length} 个窗口（${W.map(s=>FR.months[s]).join('、')} 月末起算持有期），平均IC？`,a:fdMean(ics),tol:0.03,unit:'',ex:`各窗口 IC：${ics.map(x=>fdF(x,2)).join(' / ')}，均值 ${fdF(fdMean(ics),3)}。只有 ${W.length} 个独立窗口，t=${fdF(fdMean(ics)/(fdSd(ics)/Math.sqrt(ics.length)),2)}，别把它写成“规律”。`});
 qs.push({k:'bsig',type:'choice',q:`信号实验：8个选基信号，形成期12个月、持有期6个月、不重叠滑动（${T.W.length}个窗口）。哪个信号的平均IC的 |t| 最大？`,opts:FD_SIG.map(x=>x[1]),a:best.n,ex:`各信号 t：${T.rows.map(r=>r.n+' '+fdF(r.t,2)).join('；')}。`});
 qs.push({k:'bt',q:`该最佳信号（${best.n}）的 t 值（平均IC÷(IC标准差÷√窗口数)）？`,a:best.t,tol:0.1,unit:'',ex:`t=${fdF(best.t,2)}，自由度 ${T.W.length-1}，双侧 p=${fdF(best.p,3)}。你试了 8 个信号，至少一个偶然 |t|>阈值的概率远大于 5%：1−0.95^8=${fdF((1-Math.pow(0.95,8))*100,1)}%；Bonferroni 门槛是 p<0.05/8=0.00625。${best.p<0.00625?'它通过了 Bonferroni 门槛，但样本仍只有'+T.W.length+'个窗口。':'它没有通过 Bonferroni 门槛，应当视为“可能是运气”。'}`});
 const cfg=fdCfg('quant',{sh:-0.4,dd:45,an:-10}),S=fdScreen(U,cfg);
 qs.push({k:'scr',q:`筛选器（形成期=前36个月）：夏普≥${cfg.sh}、最大回撤不深于−${cfg.dd}%、年化≥${cfg.an}% 的基金有几只？（口径正常的权益/指数基金共${U.length}只）`,a:S.pass.length,tol:0.01,unit:'只',ex:`通过：${S.pass.map(x=>x.f.n).join('、')||'无'}。再看样本外：通过者后24个月平均年化 ${S.pass.length?fdPc(fdMean(S.pass.map(x=>x.fw.ann))*100,1):'—'}，全体 ${fdPc(fdMean(S.L.map(x=>x.fw.ann))*100,1)}。`});
 const ac=fdAvgCorr(FD_FOF0);
 qs.push({k:'fof',q:`FOF练习：等权组合的5只基金（${FD_FOF0.map(c=>fdFund(c).n.slice(0,6)).join('、')}），60个月收益两两相关系数的平均值？`,a:ac,tol:0.02,unit:'',ex:`平均相关 ${fdF(ac,3)}。相关越低，分散化收益越大；但相关在危机时会上升，历史相关不是未来相关。`});
 return fdQuiz('quant',qs)}
