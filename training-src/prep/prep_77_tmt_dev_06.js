/* prep_77_tmt_dev_06：下游·终端·入口——特斯拉 */
const _t_tsla={id:'tsla',seg:'down_dev',mkt:'US',name:'特斯拉',ticker:'TSLA',asof:'2026-10-31',tags:['电动车','FSD','Robotaxi','Optimus'],
position:'特斯拉是电动车公司，但市场给它的估值早已不是汽车估值。收入来自汽车销售、能源储能与服务，2025年营收{{L:TMT7-TSLA-FY25REV}}亿美元、同比-2.93%，净利润{{L:TMT7-TSLA-FY25NET}}亿美元、同比-46.5%；2026年三季度营收{{L:TMT7-TSLA-REVQ3}}亿美元、同比-0.17%，交付{{L:TMT7-TSLA-DELIV}}辆、同比+1%。汽车业务已经停止增长，估值靠三条期权线：FSD订阅、Robotaxi、Optimus人形机器人。',
landscape:'全球电动车是特斯拉、比亚迪与中国新势力的四方混战：2026年前三季比亚迪营收{{L:TMT7-BYD-REV}}亿元、几乎零增长，理想同比{{L:TMT7-LI-YOY}}、小鹏同比{{L:TMT7-XPENG-YOY}}，全行业从高增长进入价格战。特斯拉的差异化不在造车成本，而在软件：FSD北美新车选装率{{L:TMT7-TSLA-FSDATTACH}}、全球付费用户{{L:TMT7-TSLA-FSDU}}万，Robotaxi在{{L:TMT7-TSLA-ROBOCITY}}座城市运营。我的判断：汽车业务已是“现金牛+数据采集器”，胜负手是Robotaxi能否在2027年跑通单位经济。'};
_t_tsla.fin={head:['指标','数值','期间/口径'],rows:[
['Q3营收','{{L:TMT7-TSLA-REVQ3}} 亿美元','同比-0.17%，汽车端零增长'],
['Q3毛利率','{{L:TMT7-TSLA-GMQ3}}','同比+8.9pct，靠成本下降'],
['Q3净利润','{{L:TMT7-TSLA-NETQ3}} 亿美元','同比-42.7%，费用侵蚀'],
['Q3交付量','{{L:TMT7-TSLA-DELIV}} 辆','同比+1%，Model 3/Y占{{L:TMT7-TSLA-M3Y}}辆'],
['Q3储能部署','{{L:TMT7-TSLA-STORAGE}}','能源业务成为第二支柱'],
['前三季资本开支','{{L:TMT7-TSLA-CAPEX9M}} 亿美元','同比+{{L:TMT7-TSLA-CAPEXYOY}}，Q3单季{{L:TMT7-TSLA-CAPEXQ3}}'],
['前三季净利润','{{L:TMT7-TSLA-NET9M}} 亿美元','同比-19.5%，资本开支是净利的{{L:TMT7-TSLA-CAPEXNET}}'],
['FSD北美选装率','{{L:TMT7-TSLA-FSDATTACH}}','全球付费用户{{L:TMT7-TSLA-FSDU}}万']]};
_t_tsla.valuation={text:'特斯拉不能用PE估值——当前市值{{L:TMT7-TSLA-MCAP}}、TTM净利润{{L:TMT7-TSLA-TTMNET}}，PE约{{L:TMT7-TSLA-PE}}倍，是汽车同业的几十倍。我的做法是SOTP：汽车业务按交付停滞给15倍PE，对应几百亿美元；能源储能按成长股单列；剩下的一万多亿美元全是FSD、Robotaxi、Optimus的期权价值。换句话说，市场现在定价的不是“卖多少车”，而是“软件能否按里程收费、机器人能否量产”。这个框架下，估值对时间表极度敏感：Robotaxi每推迟一个季度，期权价值就折掉一层。支撑点是真实存在的——FSD选装率{{L:TMT7-TSLA-FSDATTACH}}、付费用户{{L:TMT7-TSLA-FSDU}}万、无监管里程{{L:TMT7-TSLA-ROBOMILES}}英里，这些是可跟踪的领先指标，不是PPT。反方：如果2027年Robotaxi仍不能贡献明显收入，491倍PE会向50倍回归，那是八成以上的下跌空间。',head:['指标','数值','口径'],rows:[
['总市值','{{L:TMT7-TSLA-MCAP}}','2026-10-31收盘，股价399.81美元'],
['PE(TTM)','{{L:TMT7-TSLA-PE}}','几乎全部是期权价值'],
['单车收入','{{L:TMT7-TSLA-REVPERVEH}}','含能源与服务，非纯汽车ASP'],
['资本开支/营收','{{L:TMT7-TSLA-CAPEXREV}}','9M26口径'],
['资本开支/净利润','{{L:TMT7-TSLA-CAPEXNET}}','重资产强度'],
['FSD付费用户','{{L:TMT7-TSLA-FSDU}} 万','同比+67%']]};
_t_tsla.scen=[
{n:'熊',p:'35%',v:'Robotaxi时间表再推迟、Optimus到2027年底仍未对外交付，汽车交付维持零增长，资本开支照旧。',why:'期权价值大幅折损，给80倍PE，市值约2600亿美元，较当前{{L:TMT7-TSLA-MCAP}}跌八成。'},
{n:'基准',p:'45%',v:'FSD选装率维持七成、Robotaxi在2027年二季度开始贡献收入，Optimus小批量交付，汽车端仍零增长。',why:'给200倍PE，市值约6400亿美元，仍较当前腰斩，说明现价已透支。'},
{n:'牛',p:'20%',v:'Robotaxi扩到数十城并跑通单位经济、Optimus进入工业客户，软件收入占比超过两成。',why:'给350倍PE并把利润上修，市值回到1.5万亿美元附近，与当前持平。'}];
_t_tsla.peers={head:['公司','收入规模','增速','毛利率','PE'],rows:[
['特斯拉','{{L:TMT7-TSLA-REVQ3}}（亿美元，单季）','{{L:TMT7-TSLA-REVQ3YOY}}','{{L:TMT7-TSLA-GMQ3}}','{{L:TMT7-TSLA-PE}}'],
['比亚迪','{{L:TMT7-BYD-REV}}（亿元，9M）','{{L:TMT7-BYD-YOY}}','{{L:TMT7-BYD-GM}}','{{L:TMT7-BYD-PE}}'],
['理想汽车','{{L:TMT7-LI-REV}}（亿元，H1）','{{L:TMT7-LI-YOY}}','{{L:TMT7-LI-GM}}','亏损'],
['小鹏汽车','{{L:TMT7-XPENG-REV}}（亿元，H1）','{{L:TMT7-XPENG-YOY}}','{{L:TMT7-XPENG-GM}}','亏损']]};
_t_tsla.insights=[
{t:'汽车业务已经“公用事业化”，估值是一篮子期权',b:'【事实】2026年三季度特斯拉营收{{L:TMT7-TSLA-REVQ3}}亿美元、同比{{L:TMT7-TSLA-REVQ3YOY}}，交付{{L:TMT7-TSLA-DELIV}}辆、同比仅+1%，其中Model 3/Y占{{L:TMT7-TSLA-M3Y}}辆；单车收入约{{L:TMT7-TSLA-REVPERVEH}}万美元；但PE高达{{L:TMT7-TSLA-PE}}倍。【判断】把汽车业务单独拎出来，它就是一家零增长、毛利率{{L:TMT7-TSLA-GMQ3}}的制造企业，按15倍PE只值几百亿美元。剩下的一万多亿美元市值，买的是FSD订阅、Robotaxi、Optimus三张期权。期权定价的特点是时间价值会衰减——Robotaxi每推迟一个季度，估值就该下一个台阶。所以我从不把特斯拉当汽车股看，而是当“看涨期权组合”看，仓位和止损都要按期权来管。'},
{t:'资本开支翻倍，是用资产负债表买时间表',b:'【事实】前三季资本开支{{L:TMT7-TSLA-CAPEX9M}}亿美元、同比+{{L:TMT7-TSLA-CAPEXYOY}}，是同期净利润{{L:TMT7-TSLA-NET9M}}亿美元的{{L:TMT7-TSLA-CAPEXNET}}；同期毛利率从低点回升到{{L:TMT7-TSLA-GMQ3}}，但净利润仍同比-42.7%。【判断】毛利率改善说明单车成本在降，利润却被研发与AI基础设施吞掉——这是在为Robotaxi与Optimus提前建产能。重资产投入本身不是问题，问题是回报周期：如果2027年Robotaxi不能贡献收入，这些折旧会变成利润表上的固定负担，届时“毛利率修复”会被“费用刚性”抵消。我的判断：2027年是特斯拉的分水岭，成则软件重估，败则估值回归制造业。'}];
_t_tsla.kill=['FSD北美新车选装率跌回60%以下，说明软件变现的渗透已经见顶。','Robotaxi无监管里程季度环比停止增长，或运营城市数量不再增加，说明扩张遇到监管或技术瓶颈。','2027年二季度自有车辆未按期加入Robotaxi车队，时间表再次跳票。','汽车毛利率跌破15%，说明成本优势被价格战吃掉，连现金牛都不成立。'];
_t_tsla.asks=[
{q:'特斯拉491倍PE，你到底怎么给它估值？',a:'结论：用SOTP加期权定价，不用PE，也不接受“汽车股”框架。数据：市值{{L:TMT7-TSLA-MCAP}}、TTM净利润{{L:TMT7-TSLA-TTMNET}}、PE约{{L:TMT7-TSLA-PE}}倍；Q3营收{{L:TMT7-TSLA-REVQ3}}、交付{{L:TMT7-TSLA-DELIV}}、毛利率{{L:TMT7-TSLA-GMQ3}}。推理：汽车业务按15倍PE只值几百亿美元；能源储能单列；FSD按付费用户{{L:TMT7-TSLA-FSDU}}万给订阅估值；Robotaxi与Optimus用概率加权的情景价值。加总后合理市值远低于当前，说明市场给的是最乐观情形的期权价。反方：如果Robotaxi在2027年跑通，按里程抽成的市场空间确实可以支撑万亿市值。落地：我会用“每推迟一个季度扣减多少期权价值”的方式做动态跟踪，而不是死守一个目标价。'},
{q:'FSD真的能变现吗？选装率75%意味着什么？',a:'结论：能变现，但变现曲线比市场想的慢。数据：北美新车选装率{{L:TMT7-TSLA-FSDATTACH}}、全球付费用户{{L:TMT7-TSLA-FSDU}}万、同比+67%，其中月度订阅约占一半；欧洲已在多国上线。推理：选装率从55%跳到75%说明FSD已经从“极客选配”变成“主流配置”，这是质变；但付费用户只有174万，相对特斯拉的保有量仍是小比例，说明存量车主的转化才是下一阶段的关键。反方：如果FSD长期停留在L2+，监管不允许脱手，它的定价上限就是高级辅助驾驶，不是自动驾驶。落地：我盯三个数——付费用户环比增量、月度订阅占比、以及欧洲/中国的获批进度；三者同步改善，才说明订阅模式成立。'},
{q:'Robotaxi和Optimus，哪个会先兑现？',a:'结论：Robotaxi先，Optimus晚，但两者都不该在2026年计入估值。数据：Robotaxi已在{{L:TMT7-TSLA-ROBOCITY}}座城市运营、无监管里程{{L:TMT7-TSLA-ROBOMILES}}英里；Optimus产线状态是“{{L:TMT7-TSLA-OPTIMUS}}”，预计2027年底前后才对外交付。推理：Robotaxi复用 existing 车队与FSD软件，边际成本低、可渐进扩张，是“软件+运营”的生意；Optimus要从零建供应链，手部与机电是硬瓶颈，量产难度高一个量级。反方：Robotaxi的监管风险被低估——每个城市都要单独批，扩张不是线性的。落地：我把Robotaxi按“城市数×单城收入”建模，Optimus在2027年之前按零收入处理，只作为免费期权。'}];
TMT.push(_t_tsla);
