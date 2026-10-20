/* ===== 公募基金岗位训练板块（注入自 训练工作台源码/fund） ===== */
const FD={tabs:[['home','总览与路径'],['val','研究员·财报估值'],['attr','PM助理·业绩与风格'],['fi','固收·利率与久期'],['quant','基金研究·持续性与FOF'],['risk','风控合规·VaR/限制/流动性'],['prod','产品·持有人行为'],['insight','洞见·市场看板与日志'],['data','数据·来源与质检']],nq:{val:6,attr:7,fi:6,quant:7,risk:11,prod:10}};
const FDV={},FDQ={};
function fdState(){const f=state.fund||(state.fund={});f.tab=f.tab||'home';f.q=f.q||{};f.memo=f.memo||{};f.journal=f.journal||[];f.cfg=f.cfg||{};return f}
function fdRng(seed){let s=seed>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296}}
function fdN(r){let u=0,v=0;while(!u)u=r();while(!v)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
const fdSum=a=>a.reduce((s,v)=>s+v,0),fdMean=a=>fdSum(a)/(a.length||1);
const fdSd=a=>{const m=fdMean(a);return Math.sqrt(fdSum(a.map(v=>(v-m)**2))/Math.max(1,a.length-1))};
function fdRanks(a){const idx=a.map((v,i)=>[v,i]).sort((x,y)=>x[0]-y[0]),r=new Array(a.length);let i=0;while(i<idx.length){let j=i;while(j+1<idx.length&&idx[j+1][0]===idx[i][0])j++;const av=(i+j)/2+1;for(let k=i;k<=j;k++)r[idx[k][1]]=av;i=j+1}return r}
function fdCorr(x,y){const mx=fdMean(x),my=fdMean(y);let sxy=0,sxx=0,syy=0;for(let i=0;i<x.length;i++){sxy+=(x[i]-mx)*(y[i]-my);sxx+=(x[i]-mx)**2;syy+=(y[i]-my)**2}return sxy/Math.sqrt(sxx*syy)}
const fdSpearman=(x,y)=>fdCorr(fdRanks(x),fdRanks(y));
function fdQtl(a,q){const x=[...a].sort((u,v)=>u-v),p=(x.length-1)*q,lo=Math.floor(p),hi=Math.ceil(p);return x[lo]+(x[hi]-x[lo])*(p-lo)}
function fdMdd(rets){let v=1,pk=1,m=0;for(const r of rets){v*=1+r;pk=Math.max(pk,v);m=Math.min(m,v/pk-1)}return m}
function fdAnn(rets){return Math.pow(rets.reduce((v,r)=>v*(1+r),1),12/rets.length)-1}
function fdIRR(cfs){let lo=-0.99,hi=1;const f=r=>cfs.reduce((s,c,t)=>s+c/Math.pow(1+r,t),0);if(f(lo)*f(hi)>0)return NaN;for(let i=0;i<200;i++){const m=(lo+hi)/2;f(lo)*f(m)<=0?hi=m:lo=m}return(lo+hi)/2}
const fdF=(v,d=2)=>Number.isFinite(v)?Number(v).toLocaleString('zh-CN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const fdP=(v,d=1)=>Number.isFinite(v)?(v*100).toFixed(d)+'%':'—';
function fdTbl(head,rows,cls=''){return `<div class="table-wrap"><table class="${cls}"><thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}
function fdKpis(a){return `<div class="fd-kpis">${a.map(([l,v,c])=>`<div class="fd-kpi"><label>${l}</label><b class="${c||''}">${v}</b></div>`).join('')}</div>`}
function fdBars(items,max){const m=max||Math.max(...items.map(i=>Math.abs(i[1])),1e-9);return `<div class="fd-bars">${items.map(([l,v,fmt])=>{const w=Math.abs(v)/m*50,left=v>=0?50:50-w;return `<div class="row"><span>${l}</span><div class="track"><i style="left:${left}%;width:${w}%;background:${v>=0?'var(--cyan)':'var(--red)'}"></i></div><strong>${fmt}</strong></div>`}).join('')}</div>`}
function fdCard(t,body,warn){return `<div class="fd-card ${warn?'warn':''}"><b>${t}</b>${body}</div>`}
function fdDone(mod){const q=fdState().q;const ks=new Set(Object.keys(q).filter(k=>k.startsWith(mod+'.')&&q[k].ok).map(k=>k.split('.')[1]));return FD.nq[mod]&&ks.size>=FD.nq[mod]}
function fdOk(mod){const q=fdState().q;return new Set(Object.keys(q).filter(k=>k.startsWith(mod+'.')&&q[k].ok).map(k=>k.split('.')[1])).size}
function fdQuiz(mod,items,tag=''){return items.map((it,i)=>{const key=mod+'.'+it.k+(tag?'.'+tag:'');FDQ[key]=it;const st=fdState().q[key]||{};
 const body=it.type==='choice'?it.opts.map(o=>`<label class="qz-opt"><input type="radio" name="${key}" value="${esc(o)}"> ${esc(o)}</label>`).join(''):`<input type="number" step="any" data-qin="${key}" placeholder="${esc(it.unit||'数值')}"><span class="small-copy">${esc(it.unit||'')}</span>`;
 return `<div class="qz"><p class="qz-q"><b>Q${i+1}.</b> ${it.q}</p><div class="qz-row">${body}<button class="btn small" data-qcheck="${key}">检查</button><span class="qz-state ${st.ok?'ok':''}">${st.ok?'✓ 已答对':(st.tries?'已尝试 '+st.tries+' 次':'')}</span></div><div class="qz-fb ${st.fb?'show '+(st.ok?'ok':'bad'):''}">${st.fb||''}</div></div>`}).join('')}
function fdCheck(key,root,btn){const it=FDQ[key];if(!it)return;const st=fdState().q[key]||(fdState().q[key]={});let ok=false,shown;
 if(it.type==='choice'){const r=root.querySelector(`input[name="${key}"]:checked`);if(!r){toast('先选择一个答案');return}ok=r.value===String(it.a);shown=it.a}
 else{const inp=root.querySelector(`[data-qin="${key}"]`);if(!inp||inp.value===''){toast('请输入数值');return}const v=parseFloat(inp.value);ok=Number.isFinite(v)&&Math.abs(v-it.a)<=(it.tol??0.01);shown=fdF(it.a,4)+(it.unit?' '+it.unit:'')}
 st.tries=(st.tries||0)+1;st.ok=st.ok||ok;
 st.fb=ok?'✓ 正确。'+(it.ex||''):st.tries>=2?'✗ 不对。参考答案：'+shown+'。'+(it.ex||''):'✗ 不对，再算一次。'+(it.hint?'提示：'+it.hint:'');
 const box=btn.closest('.qz'),fb=box.querySelector('.qz-fb'),stt=box.querySelector('.qz-state');fb.className='qz-fb show '+(st.ok?'ok':'bad');fb.innerHTML=st.fb;stt.className='qz-state '+(st.ok?'ok':'');stt.textContent=st.ok?'✓ 已答对':'已尝试 '+st.tries+' 次';fdDots()}
function fdDots(){$$('#view-fund [data-fdtab]').forEach(b=>{const k=b.dataset.fdtab,d=b.querySelector('.dot');if(fdDone(k)&&!d)b.insertAdjacentHTML('beforeend','<span class="dot"></span>')})}
