/* ===== 内联 SVG 图表：折线、散点（无外部依赖） ===== */
const FDC=['#1f8f8f','#c78a2c','#b4543f','#2f6fb0','#6b5bb5','#2f7a4c','#7b8794'];
function fdLine(series,o={}){
 const W=o.w||720,H=o.h||210,p={l:46,r:12,t:12,b:26},n=Math.max(...series.map(s=>s.y.length));
 const all=series.flatMap(s=>s.y.filter(Number.isFinite));let mn=o.min??Math.min(...all),mx=o.max??Math.max(...all);if(mn===mx){mn-=1;mx+=1}
 const pad=(mx-mn)*0.06;if(o.min===undefined)mn-=pad;if(o.max===undefined)mx+=pad;
 const X=i=>p.l+(W-p.l-p.r)*(n<2?0:i/(n-1)),Y=v=>p.t+(H-p.t-p.b)*(1-(v-mn)/(mx-mn));
 const fm=o.fmt||(v=>Math.abs(v)>=100?v.toFixed(0):v.toFixed(2));let g='';
 for(let k=0;k<=4;k++){const v=mn+(mx-mn)*k/4,y=Y(v);g+=`<line x1="${p.l}" x2="${W-p.r}" y1="${y}" y2="${y}" stroke="#dfe9e7"/><text x="${p.l-6}" y="${y+3}" font-size="9" text-anchor="end" fill="#6b8187">${fm(v)}</text>`}
 if(o.zero!==false&&mn<0&&mx>0)g+=`<line x1="${p.l}" x2="${W-p.r}" y1="${Y(0)}" y2="${Y(0)}" stroke="#9fb3b0" stroke-dasharray="3 3"/>`;
 const lb=o.labels||[],step=Math.max(1,Math.ceil(n/7));
 for(let i=0;i<n;i+=step)if(lb[i])g+=`<text x="${X(i)}" y="${H-8}" font-size="9" text-anchor="middle" fill="#6b8187">${esc(lb[i])}</text>`;
 series.forEach((s,k)=>{const pts=s.y.map((v,i)=>Number.isFinite(v)?`${X(i).toFixed(1)},${Y(v).toFixed(1)}`:null).filter(Boolean).join(' ');g+=`<polyline fill="none" stroke="${s.c||FDC[k%FDC.length]}" stroke-width="${s.w||1.6}" points="${pts}"/>`});
 const lg=series.map((s,k)=>`<span style="margin-right:12px"><i style="display:inline-block;width:10px;height:3px;background:${s.c||FDC[k%FDC.length]};margin-right:4px;vertical-align:middle"></i>${esc(s.name)}</span>`).join('');
 return `<div class="fd-chart"><div class="fd-legend">${lg}</div><svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(o.title||'折线图')}">${g}</svg></div>`}
function fdScatter(pts,o={}){
 const W=o.w||520,H=o.h||260,p={l:46,r:12,t:12,b:34},xs=pts.map(q=>q[0]),ys=pts.map(q=>q[1]);
 const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
 const X=v=>p.l+(W-p.l-p.r)*(v-x0)/((x1-x0)||1),Y=v=>p.t+(H-p.t-p.b)*(1-(v-y0)/((y1-y0)||1));let g='';
 for(let k=0;k<=4;k++){const v=y0+(y1-y0)*k/4;g+=`<line x1="${p.l}" x2="${W-p.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="#dfe9e7"/><text x="${p.l-6}" y="${Y(v)+3}" font-size="9" text-anchor="end" fill="#6b8187">${v.toFixed(1)}</text>`;
  const u=x0+(x1-x0)*k/4;g+=`<text x="${X(u)}" y="${H-18}" font-size="9" text-anchor="middle" fill="#6b8187">${u.toFixed(1)}</text>`}
 if(o.fit){const m=fdMean(xs),my=fdMean(ys);let sxy=0,sxx=0;pts.forEach(q=>{sxy+=(q[0]-m)*(q[1]-my);sxx+=(q[0]-m)**2});const b=sxy/sxx,a=my-b*m;g+=`<line x1="${X(x0)}" y1="${Y(a+b*x0)}" x2="${X(x1)}" y2="${Y(a+b*x1)}" stroke="#c78a2c" stroke-dasharray="4 3"/>`}
 pts.forEach(q=>{g+=`<circle cx="${X(q[0])}" cy="${Y(q[1])}" r="4" fill="${q[3]||'#1f8f8f'}" fill-opacity=".75"><title>${esc(q[2]||'')}</title></circle>`});
 g+=`<text x="${(W+p.l)/2}" y="${H-3}" font-size="10" text-anchor="middle" fill="#4e656b">${esc(o.xl||'')}</text><text x="10" y="${H/2}" font-size="10" transform="rotate(-90 10 ${H/2})" text-anchor="middle" fill="#4e656b">${esc(o.yl||'')}</text>`;
 return `<div class="fd-chart"><svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(o.title||'散点图')}">${g}</svg></div>`}
