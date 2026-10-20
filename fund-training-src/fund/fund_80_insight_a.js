/* 洞见：市场看板（真实）+ 预测日志 */
const FDBIAS=[['确认偏误','我是否只收集了支持结论的证据？','主动写出三条反方证据，并找一位持相反观点的人'],['锚定','目标价是否被买入价、历史高点锚住？','从自由现金流和可比公司重新推一次估值，不看现价'],['叙事偏误','故事很动听，但可验证的数字有几个？','把叙事拆成3个可观测指标'],['幸存者偏差','我看的样本是否只剩成功者？','把已退市/已清盘/业绩垫底的同类也找出来（本工作台的基金池就有这个问题）'],['近因偏误','我是不是把最近3个月外推成了趋势？','拉长到一个完整周期，看均值回归的历史'],['过度自信','我的置信区间是不是太窄？','把概率向50%拉一点，再用日志检验']];
const FDBOOK=[['《聪明的投资者》','本杰明·格雷厄姆','安全边际与市场先生，建立估值纪律','财报估值'],['《投资最重要的事》','霍华德·马克斯','第二层思维、周期与风险，练“与共识不同”','洞见'],['《预期投资》','迈克尔·莫布森、阿尔弗雷德·拉帕波特','从价格反推预期，正对应反向估值','财报估值'],['《主动投资组合管理》','Grinold & Kahn','信息比率、基本定律、主动风险预算','业绩与风格'],['《Investment Valuation》','Aswath Damodaran','DCF、相对估值的系统方法与边界','财报估值'],['《债券市场：分析与策略》','Frank Fabozzi','久期、凸性、信用与利率策略','固收']];
function fdJournalStats(){
 const j=fdState().journal.filter(x=>x.res!==null),n=j.length;if(!n)return null;
 const brier=fdMean(j.map(x=>(x.p/100-x.res)**2));
 const bk=[[0,20],[20,40],[40,60],[60,80],[80,101]].map(([a,b])=>{const s=j.filter(x=>x.p>=a&&x.p<b);return{r:`${a}–${Math.min(b,100)}%`,n:s.length,pred:s.length?fdMean(s.map(x=>x.p)):0,hit:s.length?fdMean(s.map(x=>x.res))*100:0}});
 return{n,brier,bk}}
function fdJournalHtml(){
 const f=fdState(),S=fdJournalStats(),rows=f.journal.slice().reverse().map(x=>`<tr><td class="wrap">${esc(x.q)}<br><span class="small-copy">${esc(x.why||'')}</span></td><td>${x.p}%</td><td>${esc(x.due||'—')}</td><td>${x.res===null?`<button class="btn small" data-fdact="jres" data-arg="${x.id}:1">发生</button> <button class="btn small" data-fdact="jres" data-arg="${x.id}:0">未发生</button>`:(x.res?'发生':'未发生')}</td><td><button class="btn small" data-fdact="jdel" data-arg="${x.id}">删</button></td></tr>`).join('');
 return `${S?fdKpis([['已结算',S.n+' 条'],['Brier 分数（越低越好）',fdF(S.brier,3),S.brier<0.25?'pos':'neg'],['对照：永远猜50%',"0.250"],['样本提示',S.n<20?'样本少，别下结论':'样本尚可']])+fdTbl(['置信区间','条数','平均预测','实际发生率'],S.bk.map(b=>[b.r,b.n,b.n?fdF(b.pred,0)+'%':'—',b.n?fdF(b.hit,0)+'%':'—'])):'<p class="fd-note">结算至少一条预测后，这里会显示 Brier 分数和校准表。</p>'}
<div style="margin-top:12px">${rows?fdTbl(['预测','概率','到期','结果',''],[]).replace('<tbody></tbody>','<tbody>'+rows+'</tbody>'):'<p class="fd-note">还没有预测。写下你的第一条：可验证、有期限、有概率。</p>'}</div>`}
function fdVsText(v){const t=fdSum(v);return `当前得分 ${t}/8：${t>=7?'观点相当扎实，去找一个反方来攻击它。':t>=5?'有雏形，补上缺的那一项再写进备忘录。':'还只是“看法”，不是“观点”。先把证伪条件和数字写出来。'}`}
function fdDash(){const ix=FR.months.indexOf.bind(FR.months),ytd=ix('2025-12'),m12=ix('2025-09'),m3=ix('2026-06');
 return Object.entries(FR.idx).map(([n,o])=>{const m=o.m,last=o.last[1],mx=Math.max(...m,last);return{n,date:o.last[0],last,mtd:last/m[60]-1,m3:last/m[m3]-1,ytd:last/m[ytd]-1,y1:last/m[m12]-1,dd:last/mx-1}})}
function fdDashRows(){return fdDash().map(x=>[x.n,fdF(x.last,2),x.date,fdPc(x.mtd*100,1),fdPc(x.m3*100,1),fdPc(x.ytd*100,1),fdPc(x.y1*100,1),fdPc(x.dd*100,1)])}
