/* 研究员·财报估值：真实数据计算函数 */
const fdSt=c=>FR.stocks.find(s=>s.c===c);
const fdFin=s=>/银行|保险|证券/.test(s.ind);          // 金融类：毛利率、经营现金流口径不适用
const fdAy=(s,y)=>s.a.find(a=>a.y===y);
const fdLast=s=>s.a[s.a.length-1];
function fdCagrNp(s,n){const a=fdLast(s),b=fdAy(s,a.y-n);return a&&b&&a.np_yi>0&&b.np_yi>0?Math.pow(a.np_yi/b.np_yi,1/n)-1:NaN}
function fdConv(s,n){const xs=s.a.slice(-n).filter(a=>a.eps>0&&a.cfps!=null).map(a=>a.cfps/a.eps);return xs.length===n?fdMean(xs):NaN}
function fdDup(a){const em=1/(1-a.debt/100);return{nm:a.nm,toa:a.toa,em,est:a.toa!=null&&a.nm!=null?a.nm*a.toa*em:NaN,roe:a.roe}}
function fdPeStatic(s){const a=fdLast(s);return a.eps>0?s.q.price/a.eps:NaN}
// 反向估值：把每股盈利当作可分配现金流，10年增速g，之后永续增速tg，折现率r；解出使价值=现价的g
function fdImplG(s,r,tg,base){const e0=base??fdLast(s).eps;if(!(e0>0))return NaN;
 const val=g=>{let v=0,e=e0;for(let t=1;t<=10;t++){e*=1+g;v+=e/Math.pow(1+r,t)}return v+e*(1+tg)/(r-tg)/Math.pow(1+r,10)};
 let lo=-0.5,hi=0.8;if(val(lo)>s.q.price||val(hi)<s.q.price)return NaN;
 for(let i=0;i<80;i++){const m=(lo+hi)/2;val(m)<s.q.price?lo=m:hi=m}return(lo+hi)/2}
function fdFlags(s){const a=s.a,l=a[a.length-1],fl=[],fin=fdFin(s);
 if(!fin){const cv=fdConv(s,3);if(Number.isFinite(cv)&&cv<0.8)fl.push(['现金含量低',`近3年CFPS/EPS=${fdF(cv,2)}`])}
 if(a.length>=4&&a[a.length-1].roe<a[a.length-2].roe&&a[a.length-2].roe<a[a.length-3].roe&&a[a.length-3].roe<a[a.length-4].roe)fl.push(['ROE连续3年下降',`${fdF(a[a.length-4].roe,1)}→${fdF(l.roe,1)}%`]);
 if(!fin&&a.length>=6&&l.debt-a[a.length-6].debt>10)fl.push(['杠杆抬升>10pt',`${fdF(a[a.length-6].debt,1)}→${fdF(l.debt,1)}%`]);
 if(l.np_yi<0)fl.push(['最新年度亏损',`归母净利${fdF(l.np_yi,1)}亿`]);else if(l.np_yoy!=null&&l.np_yoy<-30)fl.push(['利润大幅下滑',`同比${fdF(l.np_yoy,1)}%`]);
 if(s.q.pe<=0)fl.push(['动态PE为负','亏损：PE不能用来比便宜']);
 return fl}
function fdLowConv(){const L=FR.stocks.filter(s=>!fdFin(s)).map(s=>{const a=fdLast(s);return a.eps>0&&a.cfps!=null?[s,a.cfps/a.eps]:null}).filter(Boolean).sort((x,y)=>x[1]-y[1]);return L[0]}
function fdValQuiz(s,tag){
 const l=fdLast(s),a5=fdAy(s,l.y-5),cg=fdCagrNp(s,5),cv=fdConv(s,3),pe=fdPeStatic(s),ig=fdImplG(s,0.09,0.025),fin=fdFin(s);
 const dp=[fdDup(a5),fdDup(l)],ln=(x,y)=>Math.log(y/x),qs=[];
 qs.push(Number.isFinite(cg)?{k:'cagr',q:`${s.n} 归母净利润 ${a5.y}→${l.y} 的5年复合增速（CAGR，%）？`,a:cg*100,tol:0.15,unit:'%',ex:`(${fdF(l.np_yi,2)}÷${fdF(a5.np_yi,2)})^(1/5)−1=${fdPc(cg*100,2)}。CAGR 用首尾两点，会掩盖中间的波动，要同时看逐年同比。`,hint:'CAGR=(期末/期初)^(1/年数)−1'}
  :{k:'cagr',q:`${s.n} ${l.y}年 ROE 比 ${a5.y}年 变化了多少个百分点？`,a:l.roe-a5.roe,tol:0.1,unit:'pct',ex:`${fdF(l.roe,2)}−${fdF(a5.roe,2)}。利润为负时 CAGR 无意义，这里改看 ROE 的变化。`});
 qs.push(!fin&&Number.isFinite(cv)?{k:'conv',q:`${s.n} 近3年（${l.y-2}–${l.y}）平均「每股经营现金流÷基本EPS」是多少？`,a:cv,tol:0.02,unit:'倍',ex:`逐年比值取平均=${fdF(cv,2)}。长期明显低于1，要追问应收、存货与资本开支；高于1常见于折旧大、预收款多的公司，也要问是否可持续。`,hint:'先算每年 cfps/eps，再取三年平均'}
  :{k:'conv',q:`${s.n} 每股净资产（BPS）${a5.y}→${l.y} 的5年复合增速（%）？`,a:(Math.pow(l.bps/a5.bps,1/5)-1)*100,tol:0.15,unit:'%',ex:`金融类或亏损公司“经营现金流÷EPS”不适用，改看 BPS 增速：${fdF(a5.bps,2)}→${fdF(l.bps,2)}。`});
 const ok=dp.every(d=>Number.isFinite(d.est)&&d.nm>0);
 if(ok){const ct=[['净利率',ln(dp[0].nm,dp[1].nm)],['总资产周转率',ln(dp[0].toa,dp[1].toa)],['权益乘数',ln(dp[0].em,dp[1].em)]].sort((x,y)=>Math.abs(y[1])-Math.abs(x[1]));
  qs.push({k:'dup',type:'choice',q:`把 ROE 近似拆成 净利率×总资产周转率×权益乘数（权益乘数=1/(1−资产负债率)）。${a5.y}→${l.y}，哪个因子的变动幅度最大（取 ln 变化的绝对值）？`,opts:['净利率','总资产周转率','权益乘数'],a:ct[0][0],ex:`ln变化：${ct.map(x=>x[0]+' '+(x[1]>=0?'+':'')+fdF(x[1]*100,1)+'%').join('；')}。高质量的 ROE 来自净利率或周转，而不是杠杆。`})}
 else qs.push({k:'dup',type:'choice',q:`${s.n} 在 ${a5.y} 或 ${l.y} 年净利率/周转数据不完整或为负，杜邦拆解的第一步应该是？`,opts:['先确认数据口径与亏损原因，再拆','直接取绝对值继续拆','用行业平均补齐'],a:'先确认数据口径与亏损原因，再拆',ex:'亏损年份的比率没有经济意义；不要用平均值补数。'});
 qs.push(Number.isFinite(pe)?{k:'pe',q:`静态市盈率 = 现价 ÷ ${l.y}年基本EPS，${s.n} 是多少倍？`,a:pe,tol:0.1,unit:'倍',ex:`${fdF(s.q.price,2)}÷${fdF(l.eps,2)}=${fdF(pe,2)}。接口给出的动态PE是 ${fdF(s.q.pe,2)}（用最近四个季度盈利），两者不同是口径不同，不是谁算错。`}
  :{k:'pe',type:'choice',q:`${s.n} 的基本EPS ≤ 0，动态PE=${fdF(s.q.pe,2)}。怎么理解？`,opts:['PE为负说明便宜','亏损，PE不能用来比便宜，应改看收入/资产/现金流','PE为负就是0'],a:'亏损，PE不能用来比便宜，应改看收入/资产/现金流',ex:'负PE没有估值含义。'});
 qs.push(Number.isFinite(ig)?{k:'impl',q:`取折现率 9%、10年后永续增速 2.5%，把每股盈利当作可分配现金流：现价隐含的未来10年盈利年增速是多少（%）？`,a:ig*100,tol:0.3,unit:'%',ex:`解 现价=Σ EPS(1+g)^t/(1+9%)^t + 终值现值，得 g≈${fdPc(ig*100,2)}。对比公司近5年实际 CAGR ${Number.isFinite(cg)?fdPc(cg*100,1):'（不适用）'}：差值就是你需要用证据回答的“预期差”。`,hint:'二分法/拖动下方滑块，直到“隐含增速”面板与现价吻合；这里已固定 r=9%、tg=2.5%'}
  :{k:'impl',type:'choice',q:`${s.n} 的EPS≤0，还能做“盈利折现”的反向估值吗？`,opts:['能','不能，需换成收入或现金流路径等其他方法'],a:'不能，需换成收入或现金流路径等其他方法',ex:'盈利基数为负时，增速没有意义。'});
 const lc=fdLowConv(),names=FR.stocks.filter(x=>!fdFin(x)&&fdLast(x).eps>0).map(x=>x.n);
 qs.push({k:'scr',type:'choice',q:`横向比较：在 ${names.length} 家“非金融且EPS>0”的公司里，${fdLast(s).y}年「每股经营现金流÷EPS」最低的是谁？`,opts:names,a:lc[0].n,ex:`${lc[0].n} 比值 ${fdF(lc[1],2)}。比值低不等于有问题（可能在扩产或重资产），但它是该先去翻现金流量表的地方。`});
 return fdQuiz('val',qs,tag)}
