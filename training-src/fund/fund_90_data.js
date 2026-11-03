const FD_PY=__FUND_PY__;
const FD_SETS=[
 ['基金池','36只存续公募基金：主动权益18、指数/指数增强6、利率债3、信用债2、中短债1、二级债基4、可转债2','月末净值×61（2021-09~2026-09）、前十大持仓(2026-06-30)、规模/持有人结构/申赎/资产配置(最近4–5个报告期)、5只日度(近一年)','天天基金 pingzhongdata + fundmobapi（FundMNHisNetList、FundMNInverstPosition）'],
 ['指数与基准','10个指数月末收盘×61 + 最新价','沪深300、中证500、中证1000、创业板指、中证红利、科创50、上证50、恒生指数、国债指数、中证转债','东方财富 push2his 月K接口'],
 ['国债收益率','中国2/5/10/30年、美国2/10年','月末×61；中国10Y近250个交易日；2022-10-31~12-30窗口','东方财富 RPTA_WEB_TREASURYYIELD'],
 ['上市公司','14家A股：十年年报 + 2026中报 + 2026-10-20 行情/估值','营收、归母净利、ROE、毛利率、净利率、负债率、EPS、BPS、每股经营现金流、分红','东方财富 RPT_F10_FINANCE_MAINFINADATA、RPT_SHAREBONUS_DET、行情快照'],
 ['监管规则','规则条目（每条标注核实状态：现行/已修订/征求意见/未核实）','《运作办法》《货币基金办法》《适当性办法》《销售机构办法》《推动公募基金高质量发展行动方案》等','证监会官网、国家法律法规库；由 AI 助手读取官方原文并摘录，未经法务复核，引用前请核对原文']];
const FD_PIT=[
 ['基金','兴全合润(163406)、兴全趋势(163402)、富国红利增强(100032)的累计净值与单位净值的关系异常；两只国债ETF的累计净值与单位净值差约100倍','这5只改用单位净值计算月收益，分红未复权，派息月的收益被低估；截面统计里已排除'],
 ['基金','三只沪深300/创业板联接基金的“前十大持仓”只是联接基金自身直接持有的少量股票，占净值0.01%–0.12%','联接基金的真实持仓在目标ETF里；不要用它们做持仓分析'],
 ['基金','接口给出的是现任基金经理及其总从业年限，不是每段业绩对应的经理，也不是在该基金的任职年限','不要据此评价某位经理的业绩'],
 ['基金','持有人结构、规模、申赎、资产配置只有最近4–5个披露期，不是月度；前十大持仓为季报，有披露滞后','规模/行为分析只能做季度粒度'],
 ['基金','大成高鑫股票A接口现名与原候选“大成高新技术产业”不同；嘉实超短债是C类份额','引用时以接口返回的名称为准'],
 ['债券/利率','国债收益率表含周末补班日；中国与美国的月末日期在5个月份不同；指数“最新价”是10月月K最新一条，可能为盘中值','月末比较用各自最后有数据日，混用时要标注'],
 ['债券/利率','部分债基(485111、217022早期)单位净值只有3位小数；511260有季末派息，月度单位净值变动比日度复利低约0.5–0.9个百分点','久期回归的噪声较大，优先用日度版'],
 ['财务','五粮液2025年数据与此前趋势断裂（营收同比约-55%、净利同比约-72%，每股分红5.16元高于EPS 2.31元），数据内部自洽但未与年报逐项核对','写结论前必须回到公告核实'],
 ['财务','隆基绿能、万科A：同比数字的符号含义反向（亏损收窄显示为正），PE为负代表亏损','不能把负PE当成“便宜”'],
 ['财务','招商银行、工商银行、中国平安的毛利率字段为空；宁德时代、迈瑞医疗2016–2017为上市前口径；分红总额按总股本估算，未扣回购股份','金融类不用毛利率；上市前后不直接比较'],
 ['规则','运作办法正在修订（2026-10-09 征求意见稿，现行仍为证监会令第104号）；流动性风险管理规定的50%/15%条文、R1–R5与C1–C5的官方出处、宣传推介材料管理细则、2023年1.2%/0.2%费率数值均未核实到原文','界面标“未核实”，不装懂；涉及时回原文核对']];
FDV.data={render(){
 const bad=[];FR.funds.forEach(f=>{f.r.forEach((x,i)=>{if(Math.abs(x)>=20)bad.push([f.n,FR.months[i+1],fdF(x,1)+'%'])})});
 const ru=FR.rules,ok=ru.filter(r=>r.status==='现行').length,un=ru.filter(r=>r.status==='未核实').length;
 const chk=[['每只基金61个月末净值/60个月收益',FR.funds.every(f=>f.r.length===60)],['月份标签无重复且按时间升序',new Set(FR.months).size===61&&FR.months.every((m,i)=>!i||m>FR.months[i-1])],['指数月末序列长度=61',Object.values(FR.idx).every(o=>o.m.length===61)],['国债收益率序列长度=61',['cn2','cn5','cn10','cn30','us2','us10'].every(k=>FR.yld[k].length===61)],['日度基金收益天数>200',FR.funds.filter(f=>f.dy).every(f=>f.dy.r.length>200)],['累计净值口径异常基金已标记',FR.funds.filter(f=>!f.adj).length]].map(([n,v])=>[n,v===true?'<span class="tag">通过</span>':(v===false?'<span class="tag red">未通过</span>':String(v)+' 只')]);
 return `<div class="section-label">数据集清单</div>
<div class="panel">${fdTbl(['数据集','内容','覆盖','来源'],FD_SETS)}<p class="fd-note">快照日期 ${FR.snap}。所有数据来自公开接口的原始返回，未做估算或补全；取不到的字段保持为空并在下表说明。规则条目：现行（已核实原文）${ok} 条，未核实 ${un} 条，其余为已修订/征求意见等状态。</p></div>
<div class="section-label">自动质检</div>
<div class="panel">${fdTbl(['检查项','结果'],chk)}<p class="fd-note">单月绝对收益≥20%的观测（需要先判断是真实行情、分红还是数据错误）：</p>${bad.length?fdTbl(['基金','月份','当月收益'],bad):'<p class="fd-note">无</p>'}</div>
<div class="section-label">已知口径与数据坑（做结论前先读）</div>
<div class="panel">${fdTbl(['类别','问题','处理'],FD_PIT)}</div>
<div class="section-label">刷新数据：fundlab.py</div>
<div class="panel"><p class="fd-note">只用 Python 标准库，抓取同一批公开接口。建议一周后重新运行，把同一份分析再做一遍，看结论有没有变。<b style="display:inline">说明：脚本的解析函数用接口返回样本做了离线单元测试；脚本没有在联网环境中完整运行验证过，接口为非官方公开接口，可能变更或限流。</b></p>
<pre class="fd-pre">python3 fundlab.py nav 005827 --monthly &gt; nav.csv
python3 fundlab.py hold 005827
python3 fundlab.py index 1.000300
python3 fundlab.py yields --pages 3
python3 fundlab.py fin 600519.SH</pre>
<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn teal small" data-fdact="py">下载 fundlab.py</button></div></div>
<div class="section-label">复现任务（真正把能力练出来）</div>
<div class="panel"><ul class="goal-list"><li>任选一只不在样本里的基金，用 fundlab.py 抓月末净值，复现“业绩与风格”标签里的指标，并和天天基金网页显示的阶段涨幅对一下，差多少、为什么。</li><li>挑一家你关心的上市公司，用 fin 命令取十年财务，重做“财报估值”里的杜邦与红旗扫描。</li><li>一周后重新抓取 10Y 国债收益率，检查你上周写在预测日志里的利率判断，计算 Brier 分数。</li><li>把你发现的任何数据问题，写进上表（口径与数据坑）。能发现并说明数据问题，本身就是基金研究员的核心能力。</li></ul></div>`},
act(a){if(a==='py'){download('fundlab.py',FD_PY['fundlab.py'],'text/plain;charset=utf-8');toast('已下载 fundlab.py')}}};
