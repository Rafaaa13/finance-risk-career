/* ===== prep_56：岗位能力训练题目（数字取自账本，页面实时计算） ===== */
(function(){
const L=(id,fb)=>labL(id)??fb;
const NP9=L('QPE1-USD-ZYCX-NP-9M',110.66), MCAP=L('TMT2-GD-MCAP',1814.84), REV9=L('QPE1-USD-ZYCX-REV-9M',202.97);
const GM0=L('QPE1-USD-ZYCX-GM-Q1',57.08)/100, GM1=L('QPE1-USD-ZYCX-GM-Q3D',70.32)/100;
const INVQ3=L('TMT2-GD-INV-Q3',62.92), INVH1=L('TMT2-GD-INV-H1',41.84), CLQ3=L('TMT2-GD-CL-Q3',12.36);
const CGB5=L('MAC-CGB5Y',1.34)/100, CGB3=L('MKT-CGB-3Y-YIELD',1.2642)/100, AAA3=L('MKT-AAA-MTN-3Y-YIELD',1.5979)/100;
const RE_NPL=L('QBANK1-RK-D-RE-NPL-YI',538.51), RE_LOAN=L('QBANK1-RK-RE-LOAN-YI',8585.46);
const NPL=L('QBANK1-RK-D-NPL-YI',4118.18), PROV=L('QBANK1-RK-ECL-TOTAL-YI',8955.53);

function bondDur(y,n,c){let p=0,d=0;for(let t=1;t<=n;t++){const cf=(t===n?100:0)+c*100,pv=cf/Math.pow(1+y,t);p+=pv;d+=t*pv}return{price:p,mac:d/p,mod:d/p/(1+y)}}

LAB.push(
{id:'ib1',fam:'ib',title:'年化利润与动态市盈率',q:'用三季报利润年化，算出现在市场给的动态市盈率是多少倍。',
 inputs:[{k:'np',label:'前三季度归母净利润',def:NP9,unit:'亿元',src:'QPE1-USD-ZYCX-NP-9M'},{k:'mc',label:'总市值',def:MCAP,unit:'亿元',src:'TMT2-GD-MCAP'}],
 calc:d=>{const np=d.np*4/3,pe=d.mc/np;return{answer:pe,tol:0.05,unit:'倍',dp:2,steps:[`年化净利 = ${labF(d.np)} × 4 ÷ 3 = <b>${labF(np)} 亿元</b>。三季报简单年化只是粗估，同比 ${labF(L('QPE1-USD-ZYCX-NP-YOY',921.55))}% 说明这个年化本身可能还会被上调。`,`动态市盈率 = 市值 ${labF(d.mc)} ÷ 年化净利 ${labF(np)} = <b>${labF(pe)} 倍</b>。`,`对照账本里接口给的 PE(TTM) ${labF(L('TMT2-GD-PE-TTM',15.6),1)} 倍：TTM 用过去四个季度，年化用前三季度，口径不同，说的时候要讲清楚。`]}},
 say:'先说口径再说数字：三季报年化净利约 147.6 亿，对应市值 1814.8 亿，动态 PE 12.3 倍；而 TTM 口径是 15.6 倍。两个数都对，差别在分母的时间窗口，面试官最想听的是你知道这个差别。'},
{id:'ib2',fam:'ib',title:'给一个目标倍数，算目标价与空间',q:'假设给 20 倍年化利润，目标市值是多少？较现价有多大空间（%）？',
 inputs:[{k:'np',label:'前三季度归母净利润',def:NP9,unit:'亿元'},{k:'mc',label:'现总市值',def:MCAP,unit:'亿元'},{k:'pe',label:'目标市盈率',def:20,unit:'倍'}],
 calc:d=>{const np=d.np*4/3,tv=d.pe*np;return{answer:(tv/d.mc-1)*100,tol:0.2,unit:'%',dp:1,steps:[`年化净利 ${labF(np)} 亿元 × 目标 ${d.pe} 倍 = 目标市值 <b>${labF(tv)} 亿元</b>。`,`空间 = ${labF(tv)} ÷ ${labF(d.mc)} − 1 = <b>${labF((tv/d.mc-1)*100,1)}%</b>。`,`关键是交代为什么给这个倍数：可比公司中枢、历史分位、盈利增速与确定性。只说倍数不说理由，等于没答。`]}},
 say:'我会先给年化利润和一个有依据的倍数，再算空间，最后补一句“如果倍数给到多少，空间就没了”，把敏感性也交代出来。'},
{id:'ib3',fam:'ib',title:'三情景概率加权估值',q:'熊市 10 倍、基准 15 倍、牛市 25 倍，概率 30%/50%/20%，按年化利润算概率加权后的预期涨幅（%）。',
 inputs:[{k:'np',label:'前三季度归母净利润',def:NP9,unit:'亿元'},{k:'mc',label:'现总市值',def:MCAP,unit:'亿元'},{k:'p1',label:'概率：10 倍',def:0.3,unit:'0–1'},{k:'p2',label:'概率：15 倍',def:0.5,unit:'0–1'}],
 calc:d=>{const np=d.np*4/3,p3=Math.max(0,1-d.p1-d.p2),ev=(10*d.p1+15*d.p2+25*p3)*np;return{answer:(ev/d.mc-1)*100,tol:0.3,unit:'%',dp:1,steps:[`三个情景的市值：10×${labF(np)}=${labF(10*np)}；15×${labF(np)}=${labF(15*np)}；25×${labF(np)}=${labF(25*np)} 亿元。`,`概率加权 = ${d.p1}×${labF(10*np)} + ${d.p2}×${labF(15*np)} + ${labF(p3)}×${labF(25*np)} = <b>${labF(ev)} 亿元</b>。`,`预期涨幅 = ${labF(ev)} ÷ ${labF(d.mc)} − 1 = <b>${labF((ev/d.mc-1)*100,1)}%</b>。概率是判断不是统计结果，要说清依据。`]}},
 say:'三情景加概率，是投资类面试里最能体现思维的方式：不是给一个目标价，而是给一个分布，并说明每个情景的触发条件。'},
{id:'eq1',fam:'eq',title:'存货占营收比与备货判断',q:'用三季末存货除以前三季度营收，得到存货占营收比（%）；再判断这是主动备货还是被动积压。',
 inputs:[{k:'inv',label:'Q3 末存货',def:INVQ3,unit:'亿元',src:'TMT2-GD-INV-Q3'},{k:'rev',label:'前三季度营收',def:REV9,unit:'亿元'}],
 calc:d=>{const r=d.inv/d.rev*100,g=L('TMT2-GD-INV-YOY-Q3',145.11),rv=L('QPE1-USD-ZYCX-REV-YOY',197.11);return{answer:r,tol:0.05,unit:'%',dp:1,steps:[`存货占营收比 = ${labF(d.inv)} ÷ ${labF(d.rev)} = <b>${labF(r,1)}%</b>。`,`存货同比 ${labF(g,1)}%、营收同比 ${labF(rv,1)}%：营收增速快于存货增速，说明存货增长被收入消化，偏主动备货。`,`再用合同负债 ${labF(CLQ3)} 亿元（同比 ${labF(L('TMT2-GD-CL-YOY-Q3',463.77),1)}%）验证订单能见度；如果存货涨、营收不涨、合同负债还降，才是被动积压。`]}},
 say:'我不看单一存货数字，而是三件事一起看：存货增速对营收增速、合同负债方向、存货周转天数。三个都指向同一结论，才敢说是主动备货。'},
{id:'eq2',fam:'eq',title:'毛利率跃升需要多少涨价来解释',q:'毛利率从一季度的 X% 升到三季度的 Y%。假设单位成本不变，需要价格上涨多少（%）才能解释这个提升？',
 inputs:[{k:'g0',label:'一季度毛利率',def:GM0*100,unit:'%'},{k:'g1',label:'三季度毛利率',def:GM1*100,unit:'%'}],
 calc:d=>{const a=1-d.g0/100,b=1-d.g1/100,x=(a/b-1)*100;return{answer:x,tol:0.2,unit:'%',dp:1,steps:[`毛利率 = 1 − 成本/价格。成本不变时，价格上涨 x 后：1 − (1−GM0)/(1+x) = GM1。`,`解出 1 + x = (1−GM0) ÷ (1−GM1) = ${labF(a,4)} ÷ ${labF(b,4)} = ${labF(a/b,4)}。`,`所以需要的涨价幅度 x = <b>${labF(x,1)}%</b>。`]}},
 say:'这个算法的意义：如果价格上涨 45% 才能完全解释毛利率的跃升，而实际价格涨幅明显小于这个数，就说明还有产品结构和成本改善在起作用——这就是周期和结构的区分点。'},
{id:'eq3',fam:'eq',title:'合同负债与订单能见度',q:'合同负债占前三季度营收的比例是多少（%）？同比变化说明什么？',
 inputs:[{k:'cl',label:'Q3 末合同负债',def:CLQ3,unit:'亿元'},{k:'rev',label:'前三季度营收',def:REV9,unit:'亿元'}],
 calc:d=>{const r=d.cl/d.rev*100;return{answer:r,tol:0.05,unit:'%',dp:2,steps:[`合同负债占营收比 = ${labF(d.cl)} ÷ ${labF(d.rev)} = <b>${labF(r,2)}%</b>。`,`同比 ${labF(L('TMT2-GD-CL-YOY-Q3',463.77),1)}%：客户预付大幅增加，通常意味着订单能见度提高、供不应求。`,`风险点：合同负债也可能来自预收款政策变化，要和经销商库存、发货节奏一起看，不能单看一个数。`]}},
 say:'合同负债是我判断订单能见度的第一指标，因为它是客户用钱投票。但我会补一句：还要排除预收政策变化，避免把会计处理当成需求。'},
{id:'fi1',fam:'fi',title:'手算修正久期',q:'一只 5 年期、票面 2%、年付息、按 100 元面值平价以外的价格交易，当前收益率 Y%。算修正久期（年）。',
 inputs:[{k:'y',label:'到期收益率',def:CGB5*100,unit:'%',src:'MAC-CGB5Y'},{k:'c',label:'票面利率',def:2,unit:'%'},{k:'n',label:'年数',def:5,unit:'年'}],
 calc:d=>{const r=bondDur(d.y/100,d.n,d.c/100);return{answer:r.mod,tol:0.02,unit:'年',dp:3,steps:[`逐笔折现：每期现金流 2 元、末期 102 元，按 ${labF(d.y)}% 折现，价格 = <b>${labF(r.price,4)} 元</b>。`,`麦考利久期 = Σ(t×PV)/价格 = <b>${labF(r.mac,4)} 年</b>。`,`修正久期 = 麦考利 ÷ (1+y) = ${labF(r.mac,4)} ÷ ${labF(1+d.y/100,4)} = <b>${labF(r.mod,4)} 年</b>。收益率很低时，久期非常接近期限。`]}},
 say:'久期我不背结论，现场用三笔现金流手算给面试官看，再说一句：低利率环境下久期接近期限，这就是为什么 30 年国债对 10bp 的波动这么敏感。'},
{id:'fi2',fam:'fi',title:'信用利差',q:'用 3 年期 AAA 中票收益率减 3 年期国债收益率，算信用利差（bp）。',
 inputs:[{k:'a',label:'AAA 中票 3 年',def:AAA3*100,unit:'%',src:'MKT-AAA-MTN-3Y-YIELD'},{k:'g',label:'国债 3 年',def:CGB3*100,unit:'%',src:'MKT-CGB-3Y-YIELD'}],
 calc:d=>{const s=(d.a-d.g)*100;return{answer:s,tol:0.5,unit:'bp',dp:1,steps:[`利差 = (${labF(d.a)}% − ${labF(d.g)}%) × 100 = <b>${labF(s,1)} bp</b>。`,`账本另有一条央行口径：3 年期 AAA 中票与国债利差 35bp（9 月末），和这里 33bp 的差异来自取数日期与曲线版本，说的时候要报日期。`,`判断：利差在 30bp 出头属于低位，信用下沉的补偿有限，仓位要更看重流动性。`]}},
 say:'报利差必须带日期和口径：同样叫 3 年 AAA 利差，不同日期、不同曲线能差几个 bp。说完数字，我给一句判断——现在的补偿够不够承担久期和信用风险。'},
{id:'fi3',fam:'fi',title:'DV01 与收益率冲击',q:'面值 1000 万元、修正久期 D 年的债券，收益率上行 10bp，价格损益约多少万元？（填负数表示亏损）',
 inputs:[{k:'f',label:'面值',def:1000,unit:'万元'},{k:'d',label:'修正久期',def:4.2,unit:'年'}],
 calc:d=>{const pnl=-d.f*d.d*0.001;return{answer:pnl,tol:0.02,unit:'万元',dp:2,steps:[`近似式：ΔP/P ≈ −修正久期 × Δy。Δy = 10bp = 0.001。`,`损益 = −${labF(d.f)} 万 × ${d.d} × 0.001 = <b>${labF(pnl)} 万元</b>。`,`精确计算还要加凸性项 ½×C×(Δy)²，方向为正，能少亏一点；大冲击时这项不能省。`]}},
 say:'我习惯把久期翻译成钱：1000 万、久期 4.2，10bp 就是 4.2 万。这样和交易员、和领导沟通都不用再换算。'},
{id:'bank1',fam:'bank',title:'按最新贷款余额重算房地产不良率',q:'用 2026 年 6 月末房地产业贷款余额与不良余额，重算房地产业不良率（%）。',
 inputs:[{k:'npl',label:'房地产业不良贷款',def:RE_NPL,unit:'亿元',src:'QBANK1-RK-D-RE-NPL-YI'},{k:'loan',label:'房地产业贷款余额',def:RE_LOAN,unit:'亿元',src:'QBANK1-RK-RE-LOAN-YI'}],
 calc:d=>{const r=d.npl/d.loan*100;return{answer:r,tol:0.05,unit:'%',dp:2,steps:[`不良率 = ${labF(d.npl)} ÷ ${labF(d.loan)} = <b>${labF(r,2)}%</b>。`,`对比 2025 年末的 5.39%：分子不良余额在涨、分母贷款余额在收缩（银行主动压降），所以不良率上升有一部分是“分母效应”。`,`对比制造业不良率 1.55%：房地产是制造业的 4 倍左右，风险集中度很高。`]}},
 say:'看不良率我永远拆成分子和分母：是坏账在增加，还是贷款在收缩。工行房地产这块是两边都有，所以我会说“真实资产质量压力比 5.39% 更值得警惕”。'},
{id:'bank2',fam:'bank',title:'不良增加 10% 后的拨备覆盖率',q:'不良贷款增加 10%、拨备不变，拨备覆盖率会降到多少（%）？',
 inputs:[{k:'npl',label:'不良贷款余额',def:NPL,unit:'亿元',src:'QBANK1-RK-D-NPL-YI'},{k:'prov',label:'贷款减值准备合计',def:PROV,unit:'亿元',src:'QBANK1-RK-ECL-TOTAL-YI'}],
 calc:d=>{const base=d.prov/d.npl*100,after=d.prov/(d.npl*1.1)*100;return{answer:after,tol:0.3,unit:'%',dp:1,steps:[`现在覆盖率 = ${labF(d.prov)} ÷ ${labF(d.npl)} = <b>${labF(base,1)}%</b>。`,`不良 ×1.1 后 = ${labF(d.npl*1.1)} 亿元，覆盖率 = ${labF(d.prov)} ÷ ${labF(d.npl*1.1)} = <b>${labF(after,1)}%</b>。`,`监管底线 150%：距离还有 ${labF(after-150,1)} 个百分点，安全垫厚；这也是大行敢做逆周期投放的原因之一。`]}},
 say:'拨备覆盖率是利润的缓冲垫：不良涨 10%，覆盖率从 217% 掉到 198%，离 150% 的底线还很远，所以短期不需要大幅计提，利润的稳定性来自这里。'},
{id:'bank3',fam:'bank',title:'风险成本与预期损失',q:'假设房地产贷款的违约损失率（LGD）为 60%，按最新不良率算预期损失率（%）和对应的损失金额（亿元）。',
 inputs:[{k:'npl',label:'房地产业不良贷款',def:RE_NPL,unit:'亿元'},{k:'loan',label:'房地产业贷款余额',def:RE_LOAN,unit:'亿元'},{k:'lgd',label:'违约损失率 LGD',def:60,unit:'%'}],
 calc:d=>{const rate=d.npl/d.loan*100,el=rate*d.lgd/100;return{answer:el,tol:0.05,unit:'%',dp:2,steps:[`不良率 = ${labF(rate,2)}%，LGD = ${labF(d.lgd)}%。`,`预期损失率 = 不良率 × LGD = <b>${labF(el,2)}%</b>，对应敞口 ${labF(d.loan)} 亿元 × ${labF(el,2)}% = ${labF(d.loan*el/100)} 亿元。`,`注意：预期损失（EL）用的是 PD 而不是已发生的不良率；用不良率替代 PD 是上界估计，适合压力情景，不适合日常定价。`]}},
 say:'EL 等于 PD 乘 LGD 乘 EAD，这是做信用分析的基本公式。银行已经用不良率把 PD 部分兑现了，所以这里用不良率算出来的是“已暴露的上界”，讲的时候要说明这是保守口径。'},
{id:'pe1',fam:'pe',title:'杠杆收购的回报：MOIC 与 IRR',q:'按年化净利 12.3 倍买入，杠杆 50%，5 年后按 15 倍退出，持有期净利年增 15%，债务不偿还。算 MOIC 和 IRR（%）。',
 inputs:[{k:'np',label:'年化净利',def:NP9*4/3,unit:'亿元'},{k:'pein',label:'买入倍数',def:12.3,unit:'倍'},{k:'peout',label:'退出倍数',def:15,unit:'倍'},{k:'g',label:'净利年增速',def:15,unit:'%'},{k:'lev',label:'杠杆率',def:50,unit:'%'}],
 calc:d=>{const ev=d.pein*d.np,eq=ev*(1-d.lev/100),debt=ev*d.lev/100,exitEv=d.peout*d.np*Math.pow(1+d.g/100,5),eqOut=exitEv-debt,moic=eqOut/eq,irr=(Math.pow(moic,1/5)-1)*100;return{answer:irr,tol:0.3,unit:'%',dp:1,steps:[`买入企业价值 = ${d.pein} × ${labF(d.np)} = ${labF(ev)} 亿元；股权出资 = ${labF(eq)} 亿元，债务 ${labF(debt)} 亿元。`,`5 年后净利 = ${labF(d.np)} × 1.15^5 = ${labF(d.np*Math.pow(1.15,5))} 亿元；退出 EV = 15 × 该净利 = ${labF(exitEv)} 亿元。`,`股权回收 = ${labF(exitEv)} − ${labF(debt)} = ${labF(eqOut)} 亿元，MOIC = <b>${labF(moic)} 倍</b>。`,`IRR = MOIC^(1/5) − 1 = <b>${labF(irr,1)}%</b>。杠杆放大回报，也放大亏损：如果按 10 倍退出，股权会被腰斩以下。`]}},
 say:'一级市场的回报就两个数：MOIC 和 IRR。我会先说假设——买入倍数、退出倍数、增长、杠杆，再说结果，最后说哪一个假设最脆弱：通常是退出倍数。'},
{id:'pe2',fam:'pe',title:'清算优先权：参与分配 vs 不参与',q:'投资 5 亿元占股 30%，1 倍参与分配优先权。公司以 20 亿元退出，投资人分到多少亿元？',
 inputs:[{k:'inv',label:'投资金额',def:5,unit:'亿元'},{k:'pct',label:'持股比例',def:30,unit:'%'},{k:'exit',label:'退出金额',def:20,unit:'亿元'}],
 calc:d=>{const pref=d.inv,rest=(d.exit-d.inv)*d.pct/100,total=pref+rest;return{answer:total,tol:0.05,unit:'亿元',dp:2,steps:[`先拿回优先额 ${labF(d.inv)} 亿元；剩余 ${labF(d.exit-d.inv)} 亿元按 ${labF(d.pct)}% 分 = ${labF(rest)} 亿元。`,`合计 <b>${labF(total)} 亿元</b>（MOIC ${labF(total/d.inv)} 倍）。`,`若不参与分配，只能二选一：拿 5 亿，或按 30% 分 6 亿，取高者 6 亿。参与分配在低退出时保护本金，在高退出时对创始人不利，是谈判焦点。`]}},
 say:'条款谈判里优先权是核心：同样 20 亿退出，参与分配能多拿 3.5 亿。面试问条款，本质是问你知不知道钱怎么分。'},
{id:'pe3',fam:'pe',title:'加权平均反稀释：新转换价',q:'上轮 1000 万股、10 元；本轮新发 500 万股、6 元。按加权平均反稀释，老股东的新转换价是多少元？',
 inputs:[{k:'s0',label:'老股数',def:1000,unit:'万股'},{k:'p0',label:'老转换价',def:10,unit:'元'},{k:'s1',label:'新股数',def:500,unit:'万股'},{k:'p1',label:'新股价格',def:6,unit:'元'}],
 calc:d=>{const np=(d.s0*d.p0+d.s1*d.p1)/(d.s0+d.s1);return{answer:np,tol:0.02,unit:'元',dp:2,steps:[`加权平均价 = (${d.s0}×${d.p0} + ${d.s1}×${d.p1}) ÷ (${d.s0+d.s1}) = <b>${labF(np)} 元</b>。`,`完全棘轮则直接把老股转换价调到 6 元，对创始人极不利；加权平均是更常见的折中方案。`,`反稀释保护的实质是把稀释损失从老股东转给新投资人，谈判时要和期权池、优先权一起看整体影响。`]}},
 say:'反稀释有两档：完全棘轮和加权平均，后者更常见也更温和。面试里我会先问是哪种，再算价格，最后说它对创始人和新投资人的分配影响。'},
{id:'sa1',fam:'sales',title:'DV01：一笔头寸的 1bp 风险',q:'面值 5000 万元、修正久期 6.5 的持仓，收益率上行 1bp，损益是多少元？（填负数）',
 inputs:[{k:'f',label:'面值',def:5000,unit:'万元'},{k:'d',label:'修正久期',def:6.5,unit:'年'}],
 calc:d=>{const pnl=-d.f*d.d*0.0001*10000;return{answer:pnl,tol:1,unit:'元',dp:0,steps:[`DV01 = 面值 × 修正久期 × 0.0001 = ${labF(d.f)} 万 × ${d.d} × 0.0001 = <b>${Math.abs(pnl).toLocaleString('zh-CN')} 元</b>。`,`收益率上行 1bp 就是这笔亏损；10bp 就是 ${Math.abs(pnl*10).toLocaleString('zh-CN')} 元。`,`交易台每天用 DV01 管理风险限额：不是看持仓多少，而是看 1bp 波动亏多少钱。`]}},
 say:'销售交易岗最基础的一句话是：我的 DV01 是多少。把久期换算成钱，才能和交易台、风控说同一种语言。'},
{id:'sa2',fam:'sales',title:'买卖价差收入',q:'客户卖出 5000 万元面值，报价 99.80/99.90（百元净价），你按买价接货，价差收入是多少万元？',
 inputs:[{k:'f',label:'面值',def:5000,unit:'万元'},{k:'bid',label:'买价',def:99.80,unit:'元/百元'},{k:'ask',label:'卖价',def:99.90,unit:'元/百元'}],
 calc:d=>{const sp=d.ask-d.bid,inc=d.f/100*sp;return{answer:inc,tol:0.02,unit:'万元',dp:2,steps:[`价差 = ${labF(d.ask)} − ${labF(d.bid)} = ${labF(sp)} 元/百元。`,`收入 = ${labF(d.f)} 万 ÷ 100 × ${labF(sp)} = <b>${labF(inc)} 万元</b>。`,`这笔钱不是无风险：接货后要等对手盘，期间承担久期风险；如果价格上行，价差会被价格波动吃掉。`]}},
 say:'做市赚的是价差，但真正的风险是库存：接货之后如果不马上下家，价格波动可能把 5 万的价差全部吃掉。所以我讲报价时会讲库存风险，不只讲价差。'},
{id:'sa3',fam:'sales',title:'代销费收入',q:'代销一只基金 10 亿元，尾随费率 0.30%，一年代销费收入是多少万元？',
 inputs:[{k:'a',label:'代销规模',def:10,unit:'亿元'},{k:'fee',label:'年费率',def:0.30,unit:'%'}],
 calc:d=>{const inc=d.a*10000*d.fee/100;return{answer:inc,tol:0.5,unit:'万元',dp:1,steps:[`年费 = ${labF(d.a)} 亿元 × ${labF(d.fee,2)}% = <b>${labF(inc,1)} 万元</b>。`,`规模是存量的函数：客户赎回、净值下跌都会让规模缩水，所以渠道销售的核心是保有量而不是首发销量。`,`费率改革后主动权益费率下行，同样的保有量带来的收入变少，这就是渠道转向 ETF 和固收+的原因。`]}},
 say:'渠道销售看的是保有量乘费率：首发卖 10 亿不是终点，一年后还剩多少才是收入。费率改革之后，这个公式里的费率在降，所以只能靠保有量和产品结构补回来。'}
);
LAB_FAMS.forEach(f=>{
 f.roles={ib:['brk.ib.ecm'],eq:['buy.pub.eq_research'],fi:['buy.pub.fi_research'],bank:['bank.hq.risk'],pe:['pe.rmb'],sales:['brk.fic.sales']}[f.id]||[];
});
})();
