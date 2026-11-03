/* prep_77_tmt_dev_02：下游·终端·入口——小米集团 */
const _t_xiaomi={id:'xiaomi',seg:'down_dev',mkt:'HK',name:'小米集团',ticker:'1810.HK',asof:'2026-10-31',tags:['手机','AIoT','汽车','人车家全生态'],
position:'小米是“手机×AIoT×汽车”三线并行的硬件生态公司：手机与IoT负责规模与入口，互联网服务负责利润，汽车负责第二增长曲线。2025年营收{{L:TMT7-XIAOMI-FY25REV}}亿元、净利{{L:TMT7-XIAOMI-FY25NET}}亿元，是历史最好的一年；但2026年上半年营收{{L:TMT7-XIAOMI-REVH1}}亿元、同比{{L:TMT7-XIAOMI-REVH1YOY}}，净利同比{{L:TMT7-XIAOMI-NETYOY}}，增长故事第一次出现裂缝。它的商业模式本质是“用硬件铺量、用互联网服务变现”，汽车把这条曲线延长，也把资产负债表压重。',
landscape:'手机端是全球前三的份额战：2026年二季度全球出货同比{{L:TMT7-XIAOMI-MKTSHIP}}，小米份额降到{{L:TMT7-XIAOMI-SHARE}}，对手是三星、苹果和回归后的华为；小米选择主动砍低端机型，用ASP换毛利，结果ASP创纪录但手机毛利率跌到{{L:TMT7-XIAOMI-PHONEGM}}。汽车端对手是比亚迪、特斯拉和理想、小鹏，2026年上半年价格战把单车ASP压到{{L:TMT7-XIAOMI-EVASP}}万元、同比{{L:TMT7-XIAOMI-EVASPYOY}}。我的判断：小米的壁垒是“人车家”生态与渠道效率，不是单项技术；它最容易赢的是20万元级市场，最难赢的是品牌溢价。'};
_t_xiaomi.fin={head:['指标','数值','期间/口径'],rows:[
['上半年营收','{{L:TMT7-XIAOMI-REVH1}} 亿元','2026H1，同比{{L:TMT7-XIAOMI-REVH1YOY}}'],
['上半年净利润','{{L:TMT7-XIAOMI-NETH1}} 亿元','同比{{L:TMT7-XIAOMI-NETYOY}}'],
['上半年毛利率','{{L:TMT7-XIAOMI-GMH1}}','Q2单季已降至{{L:TMT7-XIAOMI-Q2GM}}'],
['Q2手机出货量','{{L:TMT7-XIAOMI-SHIP}} 万台','同比{{L:TMT7-XIAOMI-SHIPYOY}}'],
['Q2手机ASP','{{L:TMT7-XIAOMI-ASP}} 元','同比{{L:TMT7-XIAOMI-ASPYOY}}，手机毛利率{{L:TMT7-XIAOMI-PHONEGM}}'],
['Q2汽车交付','{{L:TMT7-XIAOMI-EVDELIV}} 辆','同比+28.2%，单车ASP {{L:TMT7-XIAOMI-EVASP}} 万元'],
['Q2汽车分部','{{L:TMT7-XIAOMI-EVSEG}} 亿元','毛利率{{L:TMT7-XIAOMI-EVGM}}，经营亏损{{L:TMT7-XIAOMI-EVLOSS}} 亿元'],
['互联网服务','{{L:TMT7-XIAOMI-NETREV}} 亿元','毛利率{{L:TMT7-XIAOMI-NETGM}}，全球MAU {{L:TMT7-XIAOMI-MAU}} 亿']]};
_t_xiaomi.valuation={text:'小米必须用分部估值，因为三块业务增速、毛利与资本强度完全不同。手机×AIoT是成熟硬件，给10–12倍PE；互联网服务毛利率{{L:TMT7-XIAOMI-NETGM}}，给20–25倍；汽车给1–1.5倍PS更合适，因为分部毛利率{{L:TMT7-XIAOMI-EVGM}}、仍在亏损{{L:TMT7-XIAOMI-EVLOSS}}亿元。当前市值{{L:TMT7-XIAOMI-MCAP}}、PE约{{L:TMT7-XIAOMI-PE}}倍，表面不贵，但分母是2025年的高基数利润——2026上半年净利已经同比{{L:TMT7-XIAOMI-NETYOY}}，TTM利润在下修。我的判断：18倍PE买的是“汽车能盈利+手机毛利修复”的双重假设，任何一条落空都会把估值打回12–14倍的硬件区间；反过来，如果汽车季度扭亏，SOTP会重估到25倍以上。',head:['指标','数值','口径'],rows:[
['总市值','{{L:TMT7-XIAOMI-MCAP}}','2026-10-31收盘，股价26.48港元'],
['PE(TTM)','{{L:TMT7-XIAOMI-PE}}','东方财富港股F10'],
['PB','2.20 倍','2026-10-31'],
['2025年营收','{{L:TMT7-XIAOMI-FY25REV}} 亿元','同比+24.97%'],
['2025年净利润','{{L:TMT7-XIAOMI-FY25NET}} 亿元','同比+76.0%，为利润高基数'],
['2026H1净利润增速','{{L:TMT7-XIAOMI-NETYOY}}','分母端已在下修']]};
_t_xiaomi.scen=[
{n:'熊',p:'30%',v:'汽车价格战延续、全年交付停在{{L:TMT7-XIAOMI-EVH1}}对应的进度，手机毛利率维持在{{L:TMT7-XIAOMI-PHONEGM}}，2026全年净利同比再降三成。',why:'给12倍PE，市值回到5500亿港元附近，较当前{{L:TMT7-XIAOMI-MCAP}}下行约两成。'},
{n:'基准',p:'50%',v:'Q4汽车单季接近盈亏平衡，手机毛利修复到10%左右，全年净利同比降两成但营收重回正增长。',why:'给18–20倍PE，市值与当前持平到小幅上行，股价靠汽车扭亏的确定性而不是手机。'},
{n:'牛',p:'20%',v:'汽车全年交付达标且单季扭亏，AIoT海外放量抵消国补退坡，2027年净利恢复增长。',why:'给25倍PE，市值看向8500亿港元以上，对应约25%的上行空间。'}];
_t_xiaomi.peers={head:['公司','收入规模','增速','毛利率','PE'],rows:[
['小米','{{L:TMT7-XIAOMI-REVH1}}（亿元，H1）','{{L:TMT7-XIAOMI-REVH1YOY}}','{{L:TMT7-XIAOMI-GMH1}}','{{L:TMT7-XIAOMI-PE}}'],
['苹果','{{L:TMT7-AAPL-REV9M}}（十亿美元，9M）','{{L:TMT7-AAPL-REVYOY}}','{{L:TMT7-AAPL-GMQ3}}','{{L:TMT7-AAPL-PE}}'],
['比亚迪','{{L:TMT7-BYD-REV}}（亿元，9M）','{{L:TMT7-BYD-YOY}}','{{L:TMT7-BYD-GM}}','{{L:TMT7-BYD-PE}}'],
['理想汽车','{{L:TMT7-LI-REV}}（亿元，H1）','{{L:TMT7-LI-YOY}}','{{L:TMT7-LI-GM}}','亏损'],
['小鹏汽车','{{L:TMT7-XPENG-REV}}（亿元，H1）','{{L:TMT7-XPENG-YOY}}','{{L:TMT7-XPENG-GM}}','亏损']]};
_t_xiaomi.insights=[
{t:'手机是“被动高端化”，不是主动升级',b:'【事实】2026年二季度小米手机出货{{L:TMT7-XIAOMI-SHIP}}万台、同比{{L:TMT7-XIAOMI-SHIPYOY}}，ASP却创纪录到{{L:TMT7-XIAOMI-ASP}}元、同比{{L:TMT7-XIAOMI-ASPYOY}}，手机收入只跌{{L:TMT7-XIAOMI-PHONEYOY}}；但手机毛利率从11.5%掉到{{L:TMT7-XIAOMI-PHONEGM}}。【判断】如果高端化是主动的、有定价权的，ASP涨25.9%应该带来毛利率扩张，而不是收缩3个百分点。真实情况是存储等元器件涨价推着整机涨价，小米同时砍掉低端机型保毛利，两个动作叠加成“量跌价升”。这说明AI手机叙事没有带来额外溢价，只是让涨价变得可解释。对供应链是坏消息：终端厂在用涨价转嫁成本，需求端并没有被AI激活。'},
{t:'汽车的第二曲线正在变成第二次重资产化',b:'【事实】小米二季度汽车交付{{L:TMT7-XIAOMI-EVDELIV}}辆、同比+28.2%，但单车ASP降到{{L:TMT7-XIAOMI-EVASP}}万元、同比{{L:TMT7-XIAOMI-EVASPYOY}}，分部毛利率{{L:TMT7-XIAOMI-EVGM}}、经营亏损{{L:TMT7-XIAOMI-EVLOSS}}亿元；上半年累计交付{{L:TMT7-XIAOMI-EVH1}}万辆，距离全年目标还有大半程。【判断】交付增长28%却伴随单价下滑9.6%，说明增量主要来自低价车型，规模效应还没跑赢价格战。汽车业务现在的角色不是利润引擎，而是“用亏损换产能与渠道”，和小米当年做手机的打法一样。区别在于手机可以轻资产代工，汽车必须自己扛产能与折旧，这会长期压制集团整体的ROE与自由现金流。'}];
_t_xiaomi.kill=['Q3手机毛利率回到12%以上、同时ASP不回落，说明高端化真的带来定价权，我的“被动高端化”判断错。','Q4汽车分部经营利润单季转正，说明规模效应提前跑赢价格战，重资产判断错。','全年汽车交付达到55万辆（即下半年再交付37万辆以上），说明需求端没有我担心的那么弱。','2027年手机出货量同比转正且全球份额回到14%，说明砍低端只是阶段性战术。'];
_t_xiaomi.asks=[
{q:'小米手机出货跌了26.5%，收入只跌7.5%，这是好事还是坏事？',a:'结论：短期是财务上的好事，长期是份额上的坏事。数据：二季度出货{{L:TMT7-XIAOMI-SHIP}}万台、同比{{L:TMT7-XIAOMI-SHIPYOY}}，ASP {{L:TMT7-XIAOMI-ASP}}元、同比{{L:TMT7-XIAOMI-ASPYOY}}，收入只跌{{L:TMT7-XIAOMI-PHONEYOY}}；但手机毛利率只有{{L:TMT7-XIAOMI-PHONEGM}}。推理：收入守住了，是因为单价涨了25.9%抵掉了四分之一还多的量；但毛利率同时下滑，说明涨价只是把存储成本转嫁给消费者，小米自己没多赚。份额从{{L:TMT7-XIAOMI-SHARE}}继续下滑，会削弱互联网服务的长期变现基数。反方：如果这是主动砍低端、保盈利，那份额下滑是可接受的战略代价。落地：我会看两个季度后的“手机毛利率×出货量”乘积，只要这个乘积不再下滑，就说明结构调整成功。'},
{q:'小米汽车什么时候能盈利？你怎么估？',a:'结论：按现在的单车经济，单季扭亏要靠交付规模再上一个台阶，2026年内难度很大。数据：二季度交付{{L:TMT7-XIAOMI-EVDELIV}}辆、分部收入{{L:TMT7-XIAOMI-EVSEG}}亿元、毛利率{{L:TMT7-XIAOMI-EVGM}}、经营亏损{{L:TMT7-XIAOMI-EVLOSS}}亿元；单车ASP {{L:TMT7-XIAOMI-EVASP}}万元、同比{{L:TMT7-XIAOMI-EVASPYOY}}。推理：亏损26亿对应10.4万辆，单车亏损约{{L:TMT7-XIAOMI-EVLOSSCAR}}；毛利率19.2%意味着单车毛利约{{L:TMT7-XIAOMI-EVGPSCAR}}，费用摊掉后仍亏，说明固定费用（研发、渠道、产能折旧）还没被摊薄。反方：如果Q4交付冲到15万辆以上、且高价车型占比回升，单季扭亏不是不可能。落地：我盯三个数——季度交付、单车ASP、分部毛利率，三者同时改善才是真拐点，只看交付量会被低价车型误导。'},
{q:'18倍PE的小米，贵不贵？',a:'结论：静态不贵，动态偏贵。数据：市值{{L:TMT7-XIAOMI-MCAP}}、PE约{{L:TMT7-XIAOMI-PE}}倍、PB约2.2倍；但2026上半年净利同比{{L:TMT7-XIAOMI-NETYOY}}，分母正在快速下修。推理：18倍的分母是2025年{{L:TMT7-XIAOMI-FY25NET}}亿元的历史高利润，如果2026全年净利降四成，实际前瞻PE会抬到30倍附近，那就不是便宜而是贵。反方：市场买的是汽车2027年扭亏后的利润弹性，用当期PE看会低估。落地：我用SOTP——手机×AIoT给10–12倍、互联网服务给20–25倍、汽车给1–1.5倍PS，加总后再和市值比；只要汽车分部估值占比超过三成，我就认为市场已经把最乐观的情形定价进去了。'}];
TMT.push(_t_xiaomi);
