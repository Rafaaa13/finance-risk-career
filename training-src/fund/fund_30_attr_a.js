/* PM助理·业绩与风格：计算 */
function fdDefBm(f){const n=f.n,c=f.cat;
 if(/创业板/.test(n))return'创业板指';if(/红利/.test(n))return'中证红利';if(/中证500/.test(n))return'中证500';if(/沪深300/.test(n))return'沪深300';
 if(c==='可转债')return'中证转债';if(/债/.test(c))return'国债指数';return'沪深300'}
function fdYearRet(r,y){const ix=[];for(let t=1;t<=60;t++)if(FR.months[t].startsWith(String(y)))ix.push(t-1);if(!ix.length)return NaN;return ix.reduce((v,i)=>v*(1+r[i]/100),1)-1}
const FD_STYLE=['沪深300','中证1000','创业板指','国债指数'];
function fdAttrCalc(cfg){const f=fdFund(cfg.c),n=cfg.win,r=fdWin(f,n),b=fdIdxR(cfg.bm).slice(60-n),rf=fdRf();
 const st=fdStat(r,rf),vb=fdVsBench(r,b,rf),bs=fdStat(b,rf);
 const full=f.r,X=FD_STYLE.map(k=>fdIdxR(k)),sty=fdOls(full,X);
 return{f,r,b,rf,st,vb,bs,sty,X}}
function fdAttrQuiz(cfg,tag){const k=fdAttrCalc(cfg),f=k.f,n=cfg.win,qs=[];
 qs.push({k:'ann',q:`${f.n} 最近 ${n} 个月的年化收益（几何，%）？`,a:k.st.ann*100,tol:0.1,unit:'%',ex:`月收益复利得累计 ${fdPc(k.st.cum*100,2)}，年化=(1+累计)^(12/${n})−1=${fdPc(k.st.ann*100,2)}。`,hint:'先连乘 (1+月收益)，再开 12/n 次方'});
 qs.push({k:'beta',q:`以 ${cfg.bm} 为基准，最近 ${n} 个月的 Beta（月收益对基准回归的斜率）？`,a:k.vb.beta,tol:0.03,unit:'',ex:`OLS：基金月收益=α+β·基准月收益，β=${fdF(k.vb.beta,3)}，R²=${fdF(k.vb.r2,2)}。R² 低时 β 的解释力有限，说明该基准未必合适。`});
 qs.push({k:'ir',q:`信息比率 IR=（基金年化收益−基准年化收益）÷ 跟踪误差（年化），最近 ${n} 个月是多少？`,a:k.vb.ir,tol:0.03,unit:'',ex:`年化超额 ${fdPc(k.vb.exAnn*100,2)}，年化跟踪误差 ${fdPc(k.vb.te*100,2)}（月超额收益标准差×√12），IR=${fdF(k.vb.ir,2)}。注意：${n}个月样本里 IR 的标准误很大，不要过度解读。`,hint:'跟踪误差=月度超额收益标准差×√12'});
 qs.push({k:'dn',q:`下行捕获率 = 基准下跌月份里基金平均收益 ÷ 基准平均收益，最近 ${n} 个月是多少？`,a:k.vb.dn,tol:0.03,unit:'',ex:`下行捕获 ${fdF(k.vb.dn,2)}、上行捕获 ${fdF(k.vb.up,2)}。上行>1 且下行<1 才是“涨多跌少”；两者都>1 只是高 Beta。`});
 const cs=k.sty.b[1];
 qs.push({k:'sty',q:`风格回归（全部60个月，自变量：沪深300、中证1000、创业板指、国债指数）：基金对沪深300的回归系数是多少？`,a:cs,tol:0.03,unit:'',ex:`系数：沪深300 ${fdF(k.sty.b[1],2)}，中证1000 ${fdF(k.sty.b[2],2)}，创业板指 ${fdF(k.sty.b[3],2)}，国债指数 ${fdF(k.sty.b[4],2)}；R²=${fdF(k.sty.r2,2)}。自变量彼此相关，系数会互相“抢”解释力，只用来判断风格方向。`,hint:'4个自变量的多元OLS，不含约束'});
 if(f.top&&f.top.rows&&f.top.rows.length)qs.push({k:'cr',q:`前十大重仓股占基金净值比例合计（${f.top.asof} 报告期，%）？`,a:fdSum(f.top.rows.map(x=>x[2])),tol:0.05,unit:'%',ex:`合计 ${fdPc(fdSum(f.top.rows.map(x=>x[2])),2)}。仅前十大，不含其余持仓；季报披露有滞后，不等于今天的持仓。`});
 else{const a=f.al,i=a.stock.length-1;qs.push({k:'cr',q:`${a.d[i]} 报告期股票占基金净值的比例（%）？`,a:a.stock[i],tol:0.05,unit:'%',ex:`该基金无前十大股票明细（债券/指数联接基金常见），改看资产配置：股票占净值 ${fdPc(a.stock[i],2)}。`})}
 const fy=fdYearRet(f.r,2024),by=fdYearRet(fdIdxR(cfg.bm),2024);
 qs.push({k:'yr',q:`2024 自然年，基金相对 ${cfg.bm} 的超额收益（基金当年收益−基准当年收益，百分点）？`,a:(fy-by)*100,tol:0.1,unit:'pct',ex:`基金 ${fdPc(fy*100,2)}，基准 ${fdPc(by*100,2)}，差 ${fdF((fy-by)*100,2)} 个百分点。单一年份的超额大多受风格影响，要结合风格回归看是 β 还是 α。`});
 return fdQuiz('attr',qs,tag)}
function fdAttrOut(cfg){const k=fdAttrCalc(cfg),f=k.f,v=k.vb,s=k.st,col=x=>x>=0?'pos':'neg';
 const lb=FR.months.slice(60-cfg.win);
 const gf=fdGrow(k.r),gb=fdGrow(k.b);
 return fdKpis([['年化收益',fdPc(s.ann*100,1),col(s.ann)],['年化波动',fdPc(s.vol*100,1)],['夏普（无风险'+fdPc(k.rf*100,2)+'）',fdF(s.sharpe,2),col(s.sharpe)],['最大回撤',fdPc(s.mdd*100,1),'neg']])+
 fdKpis([['Beta / R²',`${fdF(v.beta,2)} / ${fdF(v.r2,2)}`],['年化 Alpha',fdPc(v.alphaA*100,1),col(v.alphaA)],['跟踪误差 / IR',`${fdPc(v.te*100,1)} / ${fdF(v.ir,2)}`,col(v.ir)],['上行 / 下行捕获',`${fdF(v.up,2)} / ${fdF(v.dn,2)}`]])+
 fdLine([{name:f.n.slice(0,10),y:gf},{name:cfg.bm,y:gb,c:'#c78a2c'}],{labels:lb,title:'净值路径(起点=1)'})+
 fdLine([{name:'基金回撤%',y:s.dd.ddp.map(x=>x*100),c:'#b4543f'},{name:cfg.bm+'回撤%',y:fdDD(k.b).ddp.map(x=>x*100),c:'#7b8794'}],{labels:lb,title:'回撤'})}
