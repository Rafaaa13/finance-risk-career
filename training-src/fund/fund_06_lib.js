/* ===== 真实数据工具库：基金/指数/利率序列、风险指标、回归 ===== */
function fdCfg(k,d){const c=fdState().cfg;if(c[k]===undefined)c[k]=(d!==undefined?d:{});return c[k]}
const fdPc=(v,d=1)=>Number.isFinite(v)?v.toFixed(d)+'%':'—';          // v 已是百分数
const fdFund=c=>FR.funds.find(f=>f.c===c);
const fdIdxR=n=>{const m=FR.idx[n].m;return m.slice(1).map((v,i)=>(v/m[i]-1)*100)};   // 月收益%，60个
const fdYd=k=>{const y=FR.yld[k];return y.slice(1).map((v,i)=>(v-y[i])*100)};         // 月变动bp，60个
const fdRf=()=>fdMean(FR.yld.cn2)/100;                                                // 无风险：样本期中国2年国债均值
const fdYM=i=>FR.months[i];                                                           // 第i个月末标签
function fdGrow(r){let v=1;return [1].concat(r.map(x=>(v*=1+x/100)))}               // 净值路径(起点=1)
function fdDD(r){let v=1,pk=1,pki=0,m=0,mi=0,mp=0;const ddp=[0];r.forEach((x,i)=>{v*=1+x/100;if(v>pk){pk=v;pki=i+1}const d=v/pk-1;ddp.push(d);if(d<m){m=d;mi=i+1;mp=pki}});return{mdd:m,trough:mi,peak:mp,ddp}}
function fdStat(r,rf){const n=r.length,g=fdGrow(r)[n],ann=Math.pow(g,12/n)-1,vol=fdSd(r.map(x=>x/100))*Math.sqrt(12),dd=fdDD(r);
 return{n,cum:g-1,ann,vol,sharpe:(ann-rf)/vol,mdd:dd.mdd,calmar:ann/Math.max(1e-9,Math.abs(dd.mdd)),dd}}
function fdInv(M){const n=M.length,A=M.map((r,i)=>r.concat(Array.from({length:n},(_,j)=>i===j?1:0)));
 for(let i=0;i<n;i++){let p=i;for(let r=i+1;r<n;r++)if(Math.abs(A[r][i])>Math.abs(A[p][i]))p=r;[A[i],A[p]]=[A[p],A[i]];const d=A[i][i];for(let j=0;j<2*n;j++)A[i][j]/=d;
  for(let r=0;r<n;r++)if(r!==i){const f=A[r][i];for(let j=0;j<2*n;j++)A[r][j]-=f*A[i][j]}}return A.map(r=>r.slice(n))}
function fdOls(y,X){const n=y.length,k=X.length+1,row=i=>[1].concat(X.map(c=>c[i])),A=Array.from({length:k},()=>Array(k).fill(0)),B=Array(k).fill(0);
 for(let i=0;i<n;i++){const r=row(i);for(let a=0;a<k;a++){B[a]+=r[a]*y[i];for(let b=0;b<k;b++)A[a][b]+=r[a]*r[b]}}
 const inv=fdInv(A),b=inv.map(rw=>rw.reduce((s,v,j)=>s+v*B[j],0)),ym=fdMean(y);let sse=0,sst=0;
 for(let i=0;i<n;i++){const f=row(i).reduce((s,v,j)=>s+v*b[j],0);sse+=(y[i]-f)**2;sst+=(y[i]-ym)**2}
 const s2=sse/Math.max(1,n-k),se=inv.map((rw,j)=>Math.sqrt(Math.max(0,s2*rw[j])));
 return{b,se,t:b.map((v,j)=>v/se[j]),r2:1-sse/sst,n}}
function fdVsBench(r,b,rf){const o=fdOls(r,[b]),n=r.length,ex=r.map((x,i)=>x-b[i]),te=fdSd(ex)*Math.sqrt(12)/100;
 const up=b.map((v,i)=>v>0?i:-1).filter(i=>i>=0),dn=b.map((v,i)=>v<0?i:-1).filter(i=>i>=0);
 const cap=ix=>ix.length?fdMean(ix.map(i=>r[i]))/fdMean(ix.map(i=>b[i])):NaN;
 const fa=fdStat(r,rf).ann,ba=fdStat(b,rf).ann;
 return{beta:o.b[1],alphaM:o.b[0],alphaA:o.b[0]*12/100,r2:o.r2,te,ir:(fa-ba)/te,up:cap(up),dn:cap(dn),win:r.filter((x,i)=>x>b[i]).length/n,exAnn:fa-ba}}
function fdWin(f,n){const r=f.r;return n>=r.length?r:r.slice(r.length-n)}               // 取最近n个月收益
function fdWinIdx(n){const m=FR.idx['沪深300'].m;return fdIdxR('沪深300').slice(60-n)}
function fdRollPos(r,w){const x=[];for(let i=0;i+w<=r.length;i++){let v=1;for(let j=i;j<i+w;j++)v*=1+r[j]/100;x.push(v-1)}return x}
function fdFundDef(){return FR.funds.map(f=>f.c)}
function fdOpts(list,sel){return list.map(([v,t])=>`<option value="${esc(v)}" ${String(v)===String(sel)?'selected':''}>${esc(t)}</option>`).join('')}
function fdFundOpts(sel,filter){return fdOpts(FR.funds.filter(filter||(()=>true)).map(f=>[f.c,`${f.c} ${f.n}（${f.cat}）`]),sel)}
function fdAdjNote(f){return f.adj?'':`<span class="tag red">累计净值口径异常：用单位净值，分红未复权</span>`}
function fdSrc(t){return `<p class="fd-note" style="margin-top:8px">数据：${t}。快照日期 ${FR.snap}（东方财富/天天基金公开接口，非官方披露原件；用于训练，引用前请回到基金公告核对）。</p>`}
