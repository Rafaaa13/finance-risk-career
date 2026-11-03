# bank1 并行分工补充简报（在 BRIEF_COMMON.md、BRIEF_ROLE.md 之上追加，冲突时以本文件为准）

任务：「银行总行」5 个细分岗位，每岗 1 张岗位卡 + 12 题。今天 2026-11-01。你只做自己那一块，不碰别人的文件。

## 1. 文件与编号（硬规则）
- 题库：`/Users/xiaziliang/Desktop/实习/训练工作台源码/prep/prep_64_iv_bank1_NN.js`，NN 两位数，id 为 `bank1-NN`，`g:'bank'`，每文件 1 题，≤7KB（单次 Write 参数 ≤7KB，超了就精简内容，不拆题）。首行写一行注释，之后 `IV.push({...});`。
- 账本：`/Users/xiaziliang/Desktop/实习/面试备战/事实账本/QBANK1_<NN>.json`，只用你的编号区间和 ID 前缀。每文件 ≤7KB。字段：id,label,value,unit,asof,source,url,quote(≤40字),grade,fetched('2026-11-01'),note。写前先 Grep 确认 ID 不重复（QBANK1_01–12 已有：工行 H1 详细数据、招行补充、六大行薪酬、中行/招行/农行校招）。
- 岗位卡：`/Users/xiaziliang/Desktop/实习/面试备战/岗位库/ROLE_bank1_<code>.json`（数组，只含你的 1 个对象，临时分件，协调者会合并成 ROLE_bank1.json 再删分件）。最后写；写之前先读账本里 `QBANK1-REC-*`、`QBANK1-SAL-*`、`QBANK1-WLB-*`（recruit 分工写在 QBANK1_13–19，可能已存在）用于流程、批次、薪资、WLB 段落，并核对。字段见 BRIEF_ROLE.md 与 ROLE_buy1.json，org_type 固定「银行总行」，group 固定 bank。
- 分工表：
  - recruit（只写账本 QBANK1_13–19，前缀 QBANK1-REC-/QBANK1-SAL-/QBANK1-WLB-，不写题和卡）
  - mt：bank.hq.mt，题 01–12，账本 QBANK1_20–29，前缀 QBANK1-MT-，卡 code=mt
  - fm：bank.hq.fm，题 13–24，账本 QBANK1_30–39，前缀 QBANK1-FM-，卡 code=fm
  - risk：bank.hq.risk，题 25–36，账本 QBANK1_40–49，前缀 QBANK1-RK-，卡 code=risk
  - corp：bank.hq.corp，题 37–48，账本 QBANK1_50–59，前缀 QBANK1-CP-，卡 code=corp
  - alm：bank.hq.alm，题 49–60，账本 QBANK1_60–69，前缀 QBANK1-AL-，卡 code=alm

## 2. 取数与搜索
- 先 Grep 现有账本（IND-/MAC-/MKT-/QBUY1-FR-/QBANK1- 等）复用 ID；缺的才取数，新数字读到后先入账再引用。不得凭记忆写 2025 年以后的数字。pre-2025 监管规则最好抓官方原文入账，抓不到写成“历史规则，面试前核对原文”。
- 银行 2026 半年报全文走东方财富公告库：`https://np-cnotice-stock.eastmoney.com/api/content/ann?art_code=<码>&client_source=web&page_index=<页>`。码：工行全文 AN202608281828626875，中行全文 AN202608281828626134，建行全文 AN202608281828643786，农行摘要 AN202608281828630101，交行摘要 AN202608281828638067，邮储摘要 AN202608281828623679，招行摘要 AN202608281828637735。其他银行全文自行找。
- WebSearch 你最多 4 次（质量差）。主力用 Bing：先用 bash 跑 `node -e "console.log(encodeURIComponent('关键词'))"`，再 web_fetch `https://cn.bing.com/search?q=<编码结果>`（必须编码，否则中文被截成一个字）。结果页很大，会存成文件，路径在报错信息里。用 Grep 取标题和链接，模式：`<h2><a[^>]{0,300}href="[^"]{1,220}"[^>]*>.{0,160}?</a>`，output_mode=content，-o=true。
- 牛客帖：web_fetch `https://www.nowcoder.com/discuss/<id>`，页面存成文件。先 Grep `<meta name="description" content=.{0,300}` 看标题和开头（很便宜）；确认相关后，用 Read 读包含 `nc-slate-editor-content` 的那一行（Grep -n 找行号，再 Read offset=行号 limit=1，该行约 15KB，每帖只读一次）。禁止整页读取，禁止读含 data:image 的长行。real/freq 必须读到过帖子正文，src 写帖子标题、URL、发帖日期。
- 其他可用站点：东方财富公告库、国家金融监督管理总局/央行/财政部/证监会/银行间交易商协会/中国货币网官网、各行年报与 IR、新华社、新浪财经转载。知乎常 403 只能用搜索摘要并标 E3。小红书/脉脉不要碰。
- 大文件用 Grep 定位，不要整个 Read。

## 3. 内容规则
- 个人经历红线沿用 BRIEF_COMMON.md。银行场景可一句话引用：工行公司银行部实习（制造业对公信贷尽调：收入质量、现金流、应收周期、第一还款来源）；百度规划管理部做金融行业 AI Agent 应用研究；光大证券 TMT 研究的方法迁移。不要写“我测过/我当时算过”。
- 题型：每岗 12 题，≥8 道业务深挖，1–2 道市场观点，1 道计算或案例，1 道行为或动机。每岗尽量找到 ≥3 道 real/freq；找不到如实标 infer，不冒充真题。
- a30 80–150 字；a180 目标 600–800 字（硬下限 420）；口语第一人称，结构“结论→数据→推理→反方与风险→落地”；每个数字用 `{{L:ID}}`；推荐类加“学习示例，不构成投资建议”。
- 追问树 ≥3 条，≥2 条带 `next`（第二层），追问像面试官会问的。notes 写口径风险、要更新的数字、真题出处说明。
- 银行口径提醒：净息差（报表称净利息收益率）是年化累计，监管口径单季与行报口径不同；不良率为 6 月末时点；工农中建交邮储与招行的数字尽量用同一口径对比并注明；2026 年工行、农行定增仅为预案（IND-CAP-ICBC、IND-CAP-ABC），不要写成已到账；特别国债注资用 MKT-BOND-EVENT-1（2026-09-07，新华社，3000亿元）。
- 末尾运行：`cd /sessions/eloquent-intelligent-noether/mnt/实习/训练工作台源码/tests && node validate_bank.js`，只修属于你的错误（如果 role 不在岗位库，说明你的卡还没写，先写卡）。
- 最终回复 ≤150 字：产出文件、real/freq/infer 数量、卡中仅 E3 的字段、不放心的数字。
