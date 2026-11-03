# TMT 深度洞见卡 简报（TMT 代理必读，另读 BRIEF_COMMON.md）

用户要在面试中展示对 TMT/AI 产业链的行业洞察与投研能力。每家公司一张**深度版**卡（约 2 页），按产业链位置分类，每个类别 ≥5 家龙头。

## 产出
- 卡片文件：`/Users/xiaziliang/Desktop/实习/训练工作台源码/prep/prep_7N_tmt_<标签>.js`（N 与标签由任务指定；每个文件 ≤7KB，每文件 1 家公司，或拆成 `…_a.js/_b.js`）。每家一个 `TMT.push({...})`：
```
TMT.push({id:'nvda',seg:'up_chip',mkt:'US',name:'英伟达',ticker:'NVDA',asof:'2026-10-27',tags:['GPU','CUDA'],
 position:'业务定位 120–200 字：做什么、在产业链哪一环、靠什么赚钱、客户是谁',
 fin:{head:['指标','数值','期间/口径'],rows:[['营收','{{L:TMT1-NVDA-REV}}','FY2027Q2'],…至少 6 行,覆盖 营收/增速/毛利率/营业利润/现金流或资本开支/核心业务指标]},
 landscape:'竞争格局 150–250 字：份额、对手、壁垒、替代威胁；事实与判断分开写',
 valuation:{text:'估值拆解 ≥200 字：用什么方法（PE/PS/EV-EBITDA/分部）、当前隐含了什么增速或利润率、与历史/同行比',head:['指标','数值','口径'],rows:[['市值','{{L:…}}','…'],['PE(TTM)','{{L:…}}','…'],…]},
 scen:[{n:'熊',p:'30%',v:'关键假设（带数字）',why:'对收入/利润/估值的含义'},{n:'基准',p:'50%',…},{n:'牛',p:'20%',…}],  // 三个，概率合计 100%
 peers:{head:['公司','收入规模','增速','毛利率','PE'],rows:[[…],[…],[…],[…]]},   // ≥4 家同行,数字用 {{L:…}}
 insights:[{t:'洞见标题',b:'150–300 字：【事实】…【判断】…，能在面试里讲 2 分钟'},{t:'…',b:'…'}],
 kill:['证伪条件：可观测事件+阈值+时点',…≥3],
 asks:[{q:'面试官追问',a:'200 字以上的完整回答'},…≥3]});
```
- `seg`：up_chip 上游·AI 芯片 / up_fab 上游·制造·存储·设备 / up_net 上游·光互联·服务器·数据中心硬件·电信 / mid_cloud 中游·云与算力服务 / mid_model 中游·大模型与平台 / down_app 下游·AI 应用与软件 / down_dev 下游·终端·入口·平台 / fin_ai 金融 AI 与金融科技。
- `mkt`：CN A 股 / HK 港股 / US 美股 / PV 未上市。未上市公司（如 OpenAI、Anthropic、DeepSeek、月之暗面）：数字只用公司官宣或权威媒体报道，grade 标 E2/E3，卡片里写明“未上市，数字为媒体/官宣口径”。
- 所有数字（`fin`、`valuation`、`peers`、`scen`、洞见里出现的数字）一律 `{{L:账本ID}}`；事实用事实口吻，判断加“我的判断”。禁止引用没入账的数字。

## 取数提示（可能随时变化，失败就换）
- A 股财务：`https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FINANCE_MAINFINADATA&columns=ALL&filter=(SECUCODE%3D%22688256.SH%22)&pageNumber=1&pageSize=8&sortTypes=-1&sortColumns=REPORT_DATE&source=HSF10&client=PC`；行情/市值/PE：`https://push2.eastmoney.com/api/qt/stock/get?secid=1.688256&fields=f43,f57,f58,f116,f117,f162,f167,f170`（沪 1.、深 0.、港 116.、美 105./106./107.）。
- 美股/港股：公司 IR 新闻稿 HTML、SEC EDGAR 8-K 正文（用少量 WebSearch 定位链接）；东方财富港股/美股 F10 接口。
- 数据按“最近一期已披露”口径：A 股/港股用 2026 年中报（H1）；美股用最近季度（多数是 2026 年 7–9 月披露的季度）。写明期间与币种。

## 质量标准
- 每家公司要有**两条真正有判断力的洞见**，例如“HBM 供给瓶颈如何改变存储厂商议价权”“云厂商资本开支/收入比说明什么”，而不是复述新闻。
- 熊/基准/牛三情景的假设必须量化，并与估值拆解自洽。
- `asks` 的回答要像面试者在现场的回答：先结论，后数据，最后风险与证伪。
- 校验：`node validate_bank.js`（见通用简报）。TMT 卡会检查财务表 ≥4 行、三情景、同行 ≥3 行、洞见 ≥2、证伪 ≥2、追问 ≥2、账本 ID 存在。
