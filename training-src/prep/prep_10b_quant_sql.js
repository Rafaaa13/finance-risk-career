/* prep_10b_quant_sql.js —— 基础视图参考答案：quant（金工计算台）+ sql（SQL 数据练习）
 * 数字来自 base.html 里的真实 bs() / monteCarlo() / runSQL() 与 160 笔合成贷款（种子 20261003），
 * 由 node 实跑并经 tests/verify_base_answers.js 重算、断言。合成数据，不是真实业务。
 * 本文件只负责 Object.assign(BASE_ANS, {...})，BASE_ANS 由外部声明。 */
Object.assign(BASE_ANS, {
quant: {
  formulas: [
    "d1 = [ln(S/K) + (r + σ²/2)·T] / (σ·√T)；d2 = d1 − σ·√T",
    "Call = S·N(d1) − K·e^(−rT)·N(d2)；Put = K·e^(−rT)·N(−d2) − S·N(−d1)",
    "Put-call parity：Call − Put = S − K·e^(−rT)（页面的 residual 就是这个等式左右两边之差）",
    "Delta(call) = N(d1)；Gamma = φ(d1) / (S·σ·√T)，φ 是标准正态密度",
    "Vega = S·φ(d1)·√T，页面显示的是 Vega ÷ 100，即波动率变动 1 个百分点的价格变化",
    "Theta(call) = −S·φ(d1)·σ / (2√T) − r·K·e^(−rT)·N(d2)，页面显示的是 Theta ÷ 365，即每日时间损耗",
    "Monte Carlo：S_T = S·exp[(r − σ²/2)·T + σ·√T·Z]，Z ~ N(0,1)；价格 = e^(−rT) × mean(max(S_T − K, 0))",
    "标准误 SE = e^(−rT) × sd(payoff) / √n；95% 置信区间 = 估计值 ± 1.96 × SE",
    "页面的随机数：LCG s ← (1664525·s + 1013904223) mod 2^32，U = s / 2^32；正态用 Box–Muller：Z = √(−2·ln U1)·cos(2π·U2)"
  ],
  defaultRun: {
    type: "call",
    inputs: { S: 100, K: 100, T: 1, r: 0.035, sigma: 0.22, paths: 50000, seed: 20261003 },
    analytic: 10.436405,
    mc: 10.419498,
    se: 0.070665,
    ciLow: 10.280995,
    ciHigh: 10.558001,
    parityResidual: 0,
    diff: -0.016907,
    zScore: -0.2393,
    analyticExactErf: 10.436418,
    d1: 0.269091,
    d2: 0.049091,
    put: { analytic: 6.996947, mc: 7.061934, se: 0.045384 },
    greeksShown: { delta: 0.606070, gamma: 0.017489, vega1pct: 0.384757, thetaDay: -0.016406 },
    shown: {
      analytic: "10.4364", mc: "10.4195", se: "0.0707",
      ci: "[10.2810, 10.5580]", diff: "-0.0169", parity: "0.0000000"
    },
    note: "页面显示 4 位小数；上面存 6 位。parityResidual 实测为 0，浮点意义上应理解为 |残差| < 1e-9。"
  },
  checks: [
    {
      q: "独立检查 1：Put-call parity residual 接近 0。请亲手算一遍，并说明这个检查到底检验了什么。",
      steps: [
        "取默认参数 S = K = 100，T = 1，r = 0.035，σ = 0.22。解析 Call = 10.436405，解析 Put = 6.996947。",
        "左边：Call − Put = 10.436405 − 6.996947 = 3.439458。",
        "右边：S − K·e^(−rT) = 100 − 100 × 0.965605 = 3.439458（e^(−0.035) = 0.9656054）。",
        "残差 = 左 − 右。页面显示 0.0000000，实测为 0，最多是 1e-15 量级的浮点误差；验收线可设为 |残差| < 1e-9。",
        "这个检验的边界：Call 和 Put 用的是同一组 N(d1)、N(d2)，而页面的 N(−x) 恰好等于 1 − N(x)，所以残差几乎必然为 0。它能发现公式抄错符号，发现不了 σ 或 r 输错，也发现不了 N(·) 近似偏了一点（页面的 erf 近似让价格偏小约 0.0000127，残差照样是 0）。",
        "更有力的独立检查：用同一种子算 MC Put（7.0619，SE 0.0454），MC 的 Call − Put = 10.4195 − 7.0619 = 3.3576，比 3.4395 低 0.0819。这个差恰好等于 e^(−rT) × (S_T 样本均值 103.4772 − S·e^(rT) 103.5620)，说明 MC 版 parity 的误差只来自 S_T 样本均值的抽样偏差。"
      ],
      answer: "通过。解析 parity 残差 = 0（|残差| < 1e-9）；MC 版残差 −0.0819 不是 0，但能用 S_T 样本均值的偏差精确解释。结论：parity 检查公式自洽，不检查价格水平；价格水平要靠基准案例和 MC 对照来检查。"
    },
    {
      q: "独立检查 2：把随机种子换成另一个值，MC 价格应改变，但通常仍落在解析价附近。请用至少 5 个种子验证并解释。",
      steps: [
        "固定其余参数（50,000 路径），只改种子。默认种子 20261003 得 10.4195。",
        "换 5 个种子，格式为 价格（SE，与解析价之差，z）：42 → 10.3467（0.0701，−0.0898，−1.28）；12345 → 10.4947（0.0705，+0.0583，+0.83）；20261004 → 10.3803（0.0703，−0.0561，−0.80）；99999 → 10.4890（0.0708，+0.0526，+0.74）；314159 → 10.4945（0.0708，+0.0580，+0.82）。",
        "判读：价格确实随种子改变，范围 10.3467 到 10.4947，极差约 0.148；6 个结果（含默认种子）都在解析价 10.4364 的 ±1.96 个 SE 以内，z 介于 −1.28 与 +0.83 之间。",
        "再做大样本版本：种子取 7919 × k（k = 1 到 200）。200 个种子里有 186 个 95% CI 覆盖了解析价，覆盖率 93.0%；期望是 190 个，二项波动约 ±3 个，所以 186 个在正常范围内。",
        "判读标准：不要要求每次都落在 CI 内（理论上约 5% 的情形会落在外面），要看 z 的分布。200 次的 z 均值 −0.027、标准差 1.007，接近标准正态的 0 和 1。"
      ],
      answer: "通过。换种子后价格在 10.3467 到 10.4947 之间变化，均在解析价 10.4364 附近、±1.96 个 SE 以内；200 个种子的 CI 覆盖率为 93.0%（期望 95%，在抽样波动内），z 的均值 −0.027、标准差 1.007。"
    },
    {
      q: "独立检查 3：把路径数提高后，标准误应大致下降。请验证 SE 是否按 1/√n 缩小，并解释 150,000 路径、默认种子下解析价略在 CI 之外的现象。",
      steps: [
        "固定默认种子 20261003，路径数依次取 10,000、50,000、150,000。",
        "结果：10,000 路径 MC = 10.4558，SE = 0.1584；50,000 路径 MC = 10.4195，SE = 0.0707；150,000 路径 MC = 10.3571，SE = 0.0404。",
        "SE 的缩小倍数：从 10,000 到 150,000 路径，0.1584 ÷ 0.0404 = 3.92 倍，理论值 √15 = 3.87；从 50,000 到 150,000 路径，缩小 1.75 倍，理论值 √3 = 1.73。",
        "SE 变小不等于价格更接近解析价：150,000 路径的价格 10.3571 比 50,000 路径的 10.4195 离解析价 10.4364 更远（差 −0.0793，z = −1.96），解析价略高于 CI 上限 10.4363。",
        "原因：同一种子下，10,000 条路径是 50,000 条的前缀，也是 150,000 条的前缀（同一条 LCG 序列），三组结果不是独立样本；单次落在 CI 外是约 5% 概率的事件。查法：换种子重复，看覆盖率（见检查 2）。"
      ],
      answer: "通过。SE 随路径数按约 1/√n 下降（10,000 到 150,000 路径缩小 3.92 倍，理论 3.87）。150,000 路径、默认种子下解析价略在 CI 之外，是单次随机事件：同种子的样本相互嵌套，不是独立重复，用多个种子复查覆盖率即可。"
    }
  ],
  pitfalls: [
    "页面的 N(·) 用 Abramowitz–Stegun 多项式近似 erf（浏览器没有 Math.erf），最大误差约 1.5e-7，解析 Call 比精确值 10.436418 小 0.0000127。Python 的 math.erf 是精确的，本机复算的解析价会在第 5 位小数上不同，比较阈值用 1e-4。",
    "Put 的第 4 位小数会受影响：页面 6.9969，精确值 6.9970（6.996947 与 6.996960 的四舍五入方向不同）。",
    "同一种子下，不同路径数的样本是嵌套的（共用前缀），不能当作独立重复去判断 SE 是否稳定。",
    "页面的「在约 2 个标准误以内」用 2 倍 SE，95% CI 用 1.96 倍 SE；差值在 1.96 到 2 倍 SE 之间时两者结论不一致。",
    "SE 只反映抽样误差，不含模型误差（σ 的取值、风险中性假设、随机数质量）。LCG 相邻输出有晶格结构、低位规律性强，Box–Muller 又只用了 cos 一支；这对教学足够，对生产定价不够。",
    "Vega 页面显示的是除以 100 的值，Theta 是除以 365 的每日值，与教材里的年化 Vega、Theta 分别差 100 倍和 365 倍。",
    "固定种子复现 ≠ 随机数独立：复现只说明脚本是确定性的。"
  ]
},
sql: [
  {
    level: 1,
    q: "每个客群有多少笔贷款、简单平均 PD 是多少？按平均 PD 从高到低排。",
    sql: "SELECT segment, COUNT(*) AS loans, AVG(pd) AS avg_pd FROM loans GROUP BY segment ORDER BY avg_pd DESC",
    rows: [
      {segment: "消费贷", loans: 40, avg_pd: 0.0678},
      {segment: "小微企业", loans: 40, avg_pd: 0.0622},
      {segment: "信用卡", loans: 40, avg_pd: 0.0612},
      {segment: "按揭", loans: 40, avg_pd: 0.034}
    ],
    rowCount: 4,
    why: "GROUP BY 把 160 笔分成 4 组，每组 40 笔；AVG(pd) 是简单平均，消费贷 6.78% 最高，按揭 3.40% 最低。简单平均不考虑金额：按 EAD 加权后，小微企业 6.78% 反超消费贷 6.63%。本引擎不支持 SUM(pd*ead) 这类表达式，加权要到本机 sqlite 里写 SUM(pd*ead)/SUM(ead)。"
  },
  {
    level: 1,
    q: "每个 vintage（放款年份）有多少笔、总 EAD 是多少？按年份升序排列。",
    sql: "SELECT vintage, COUNT(*) AS loans, SUM(ead) AS total_ead FROM loans GROUP BY vintage ORDER BY vintage ASC",
    rows: [
      {vintage: 2022, loans: 34, total_ead: 10538627},
      {vintage: 2023, loans: 26, total_ead: 6508421},
      {vintage: 2024, loans: 28, total_ead: 6362039},
      {vintage: 2025, loans: 33, total_ead: 9509175},
      {vintage: 2026, loans: 39, total_ead: 9225268}
    ],
    rowCount: 5,
    why: "5 个 vintage，笔数 26 到 39 不等；2022 年总 EAD 最大（10,538,627），2024 年最小（6,362,039）。这份合成数据的 vintage 是随机抽的，没有时间趋势，不要从总 EAD 的起伏里读出业务含义。"
  },
  {
    level: 1,
    q: "列出 PD 不低于 10% 的贷款，按 PD 从高到低，只看前 10 笔。",
    sql: "SELECT id, segment, grade, pd, lgd, ead FROM loans WHERE pd >= 0.1 ORDER BY pd DESC LIMIT 10",
    rows: [
      {id: "L126", segment: "小微企业", grade: "D", pd: 0.2027, lgd: 0.5551, ead: 301059},
      {id: "L050", segment: "小微企业", grade: "D", pd: 0.1984, lgd: 0.54, ead: 492768},
      {id: "L014", segment: "小微企业", grade: "D", pd: 0.197, lgd: 0.5608, ead: 381579},
      {id: "L038", segment: "小微企业", grade: "D", pd: 0.1963, lgd: 0.5574, ead: 324038},
      {id: "L016", segment: "信用卡", grade: "D", pd: 0.188, lgd: 0.5591, ead: 182076}
    ],
    rowCount: 10,
    why: "满足 pd >= 0.1 的共 24 笔（SELECT COUNT(*) AS n FROM loans WHERE pd >= 0.1 可查），全部是 D 级；LIMIT 10 只取最高的 10 笔，PD 最高的 L126 为 20.27%。LIMIT 之前必须有 ORDER BY，否则取到的只是表里靠前的 10 笔，不是最高的 10 笔。"
  },
  {
    level: 1,
    q: "不分组，给整张贷款表一个汇总行：笔数、总 EAD、平均 PD、平均 LGD、总 EL。",
    sql: "SELECT COUNT(*) AS loans, SUM(ead) AS total_ead, AVG(pd) AS avg_pd, AVG(lgd) AS avg_lgd, SUM(el) AS total_el FROM loans",
    rows: [
      {loans: 160, total_ead: 42143530, avg_pd: 0.0563, avg_lgd: 0.406, total_el: 1098675.5271}
    ],
    rowCount: 1,
    why: "没有 GROUP BY 但有聚合函数，整张表聚成一行。简单平均 PD 5.63%，EAD 加权 PD 为 5.31%，差异来自大额贷款的 PD 偏低；total_el 就是 Σ pd×lgd×ead，与风险实验室的基准 EL 1,098,676 一致。"
  },
  {
    level: 2,
    q: "查出每个 vintage 的总 EAD、平均 PD，并找出平均 PD 最高的年份。",
    sql: "SELECT vintage, SUM(ead) AS total_ead, AVG(pd) AS avg_pd FROM loans GROUP BY vintage ORDER BY avg_pd DESC",
    rows: [
      {vintage: 2023, total_ead: 6508421, avg_pd: 0.0814},
      {vintage: 2026, total_ead: 9225268, avg_pd: 0.059},
      {vintage: 2025, total_ead: 9509175, avg_pd: 0.0489},
      {vintage: 2022, total_ead: 10538627, avg_pd: 0.0483},
      {vintage: 2024, total_ead: 6362039, avg_pd: 0.0475}
    ],
    rowCount: 5,
    why: "ORDER BY avg_pd DESC 之后第一行就是答案：2023 年，平均 PD 8.14%，总 EAD 6,508,421。但 2023 年只有 26 笔，其中 8 笔是 D 级（30.8%，全组合是 16.9%），所以这是等级结构的结果，不是时间趋势。面试里先报答案，再主动说这个限定。"
  },
  {
    level: 2,
    q: "上一题只要答案那一行：直接返回平均 PD 最高的 vintage。",
    sql: "SELECT vintage, SUM(ead) AS total_ead, AVG(pd) AS avg_pd FROM loans GROUP BY vintage ORDER BY avg_pd DESC LIMIT 1",
    rows: [
      {vintage: 2023, total_ead: 6508421, avg_pd: 0.0814}
    ],
    rowCount: 1,
    why: "ORDER BY 加 LIMIT 1 取最大值所在行。引擎没有子查询和 HAVING，这是“找最大值那一组”的标准写法；在 sqlite 里同样可用。若出现并列，LIMIT 1 会悄悄丢掉其余并列项，所以要先看不加 LIMIT 的完整排序。"
  },
  {
    level: 2,
    q: "每个客群的总 EAD 和总 EL 是多少？谁的 EL 最高？",
    sql: "SELECT segment, COUNT(*) AS loans, SUM(ead) AS total_ead, SUM(el) AS total_el FROM loans GROUP BY segment ORDER BY total_el DESC",
    rows: [
      {segment: "小微企业", loans: 40, total_ead: 11634319, total_el: 382263.8943},
      {segment: "消费贷", loans: 40, total_ead: 10096293, total_el: 347627.609},
      {segment: "信用卡", loans: 40, total_ead: 8740149, total_el: 202705.0828},
      {segment: "按揭", loans: 40, total_ead: 11672769, total_el: 166078.9409}
    ],
    rowCount: 4,
    why: "el 是 loans 里的派生字段（pd×lgd×ead），所以 SUM(el) 可以直接用。小微企业 382,264 最高；按揭 EAD 最大（11,672,769）EL 却最小（166,079）。引擎不能做 SUM(el)/SUM(ead)，把两列拿出来手除，损失率为：小微企业 3.29%，消费贷 3.44%，信用卡 2.32%，按揭 1.42%。"
  },
  {
    level: 2,
    q: "按信用等级汇总：笔数、平均 PD、平均 LGD、总 EL，等级按 A 到 D 排列。",
    sql: "SELECT grade, COUNT(*) AS loans, AVG(pd) AS avg_pd, AVG(lgd) AS avg_lgd, SUM(el) AS total_el FROM loans GROUP BY grade ORDER BY grade ASC",
    rows: [
      {grade: "A", loans: 40, avg_pd: 0.0124, avg_lgd: 0.2755, total_el: 39141.8002},
      {grade: "B", loans: 51, avg_pd: 0.0297, avg_lgd: 0.351, total_el: 137587.7067},
      {grade: "C", loans: 42, avg_pd: 0.0681, avg_lgd: 0.4729, total_el: 332829.635},
      {grade: "D", loans: 27, avg_pd: 0.1531, avg_lgd: 0.5993, total_el: 589116.3852}
    ],
    rowCount: 4,
    why: "PD 与 LGD 都随等级单调上升（A 级 1.24% 和 27.55%，D 级 15.31% 和 59.93%），EL 被两者同时放大：D 级只有 27 笔，却占总 EL 的 53.6%。ORDER BY grade ASC 是字母序，A 到 D 恰好等于风险从低到高。"
  },
  {
    level: 2,
    q: "各客群逾期了几笔、逾期率是多少？",
    sql: "SELECT segment, COUNT(*) AS loans, SUM(overdue) AS overdue_cnt, AVG(overdue) AS overdue_rate FROM loans GROUP BY segment ORDER BY overdue_rate DESC",
    rows: [
      {segment: "小微企业", loans: 40, overdue_cnt: 3, overdue_rate: 0.075},
      {segment: "信用卡", loans: 40, overdue_cnt: 3, overdue_rate: 0.075},
      {segment: "消费贷", loans: 40, overdue_cnt: 2, overdue_rate: 0.05},
      {segment: "按揭", loans: 40, overdue_cnt: 0, overdue_rate: 0}
    ],
    rowCount: 4,
    why: "本引擎把 true 当 1 计算，所以 SUM(overdue) 是逾期笔数，AVG(overdue) 是逾期率。小微企业与信用卡并列 3 笔（7.5%），并列时保持分组首次出现的顺序。在 sqlite 里 overdue 是 TEXT，要写 SUM(overdue = 'true')，直接 SUM(overdue) 得 0。全组合只有 8 笔逾期，不能据此下客群结论。"
  },
  {
    level: 2,
    q: "EL 最大的 10 笔贷款是哪些？它们有什么共同点？",
    sql: "SELECT id, segment, grade, vintage, ead, el FROM loans ORDER BY el DESC LIMIT 10",
    rows: [
      {id: "L050", segment: "小微企业", grade: "D", vintage: 2025, ead: 492768, el: 52797.0338},
      {id: "L073", segment: "消费贷", grade: "D", vintage: 2023, ead: 471591, el: 50166.1844},
      {id: "L046", segment: "小微企业", grade: "D", vintage: 2026, ead: 492850, el: 42336.887},
      {id: "L014", segment: "小微企业", grade: "D", vintage: 2023, ead: 381579, el: 42154.8618},
      {id: "L038", segment: "小微企业", grade: "D", vintage: 2023, ead: 324038, el: 35461.4836}
    ],
    rowCount: 10,
    why: "ORDER BY 的列（el）必须出现在 SELECT 里，本引擎才会排序，否则不报错也不排。前 10 笔全是 D 级，合计占总 EL 的 33.9%，只占 EAD 的 8.7%，其中 6 笔属于小微企业、4 笔属于消费贷。"
  },
  {
    level: 3,
    q: "只看 DTI 高于 0.6 且 EAD 不低于 300,000 的大额高负债贷款，各客群有几笔、总 EAD 和平均 PD 是多少？",
    sql: "SELECT segment, COUNT(*) AS loans, SUM(ead) AS total_ead, AVG(pd) AS avg_pd FROM loans WHERE dti > 0.6 AND ead >= 300000 GROUP BY segment ORDER BY total_ead DESC",
    rows: [
      {segment: "按揭", loans: 10, total_ead: 3908870, avg_pd: 0.0242},
      {segment: "消费贷", loans: 7, total_ead: 2933216, avg_pd: 0.0782},
      {segment: "小微企业", loans: 7, total_ead: 2857040, avg_pd: 0.0913}
    ],
    rowCount: 3,
    why: "两个条件用 AND 连接，先过滤再分组。符合条件的共 24 笔：按揭 10 笔、消费贷 7 笔、小微企业 7 笔，信用卡没有，所以结果里没有这一组（空组不输出）。按揭金额最大但平均 PD 只有 2.42%，小微企业只有 7 笔、平均 PD 却是 9.13%：筛选条件会改变排序，要把条件写进结论。"
  },
  {
    level: 3,
    q: "小微企业里 D 级贷款中，EL 最大的 5 笔是哪些？",
    sql: "SELECT id, segment, vintage, pd, ead, el FROM loans WHERE segment = '小微企业' AND grade = 'D' ORDER BY el DESC LIMIT 5",
    rows: [
      {id: "L050", segment: "小微企业", vintage: 2025, pd: 0.1984, ead: 492768, el: 52797.0338},
      {id: "L046", segment: "小微企业", vintage: 2026, pd: 0.1582, ead: 492850, el: 42336.887},
      {id: "L014", segment: "小微企业", vintage: 2023, pd: 0.197, ead: 381579, el: 42154.8618},
      {id: "L038", segment: "小微企业", vintage: 2023, pd: 0.1963, ead: 324038, el: 35461.4836},
      {id: "L126", segment: "小微企业", vintage: 2025, pd: 0.2027, ead: 301059, el: 33885.4801}
    ],
    rowCount: 5,
    why: "字符串条件要加引号，等号比较不区分大小写。第二名 L046 的 PD 只有 15.82%，低于 L014、L038、L126，但 EAD 在这 5 笔里最大（492,850），所以 EL 仍排第二：EL 由 PD、LGD、EAD 三者共同决定，只看 PD 排序会漏掉大额贷款。"
  },
  {
    level: 3,
    q: "逾期的贷款按信用等级分布如何？逾期笔数、平均 PD、总 EAD 各是多少？",
    sql: "SELECT grade, COUNT(*) AS overdue_loans, AVG(pd) AS avg_pd, SUM(ead) AS total_ead FROM loans WHERE overdue = true GROUP BY grade ORDER BY overdue_loans DESC",
    rows: [
      {grade: "A", overdue_loans: 3, avg_pd: 0.0138, total_ead: 1083501},
      {grade: "D", overdue_loans: 2, avg_pd: 0.1741, total_ead: 803139},
      {grade: "C", overdue_loans: 2, avg_pd: 0.0672, total_ead: 182250},
      {grade: "B", overdue_loans: 1, avg_pd: 0.0332, total_ead: 135617}
    ],
    rowCount: 4,
    why: "WHERE overdue = true 可用（引擎按字符串 'true' 比较）；写成 overdue = 1 不会报错，却返回 0 行。8 笔逾期里 A 级反而有 3 笔、D 级只有 2 笔：overdue 标签是按 PD×0.85 的概率随机抽出来的，样本又太小，所以逾期并不集中在高风险等级。这恰恰说明 8 笔样本不能用来校准 PD。"
  },
  {
    level: 3,
    q: "D 级贷款按 vintage 分布：每个年份有几笔 D 级、EL 合计多少？它能解释哪一年的平均 PD 最高吗？",
    sql: "SELECT vintage, COUNT(*) AS d_loans, SUM(el) AS total_el FROM loans WHERE grade = 'D' GROUP BY vintage ORDER BY total_el DESC",
    rows: [
      {vintage: 2023, d_loans: 8, total_el: 210615.3389},
      {vintage: 2025, d_loans: 4, total_el: 125139.612},
      {vintage: 2026, d_loans: 7, total_el: 118825.1681},
      {vintage: 2022, d_loans: 5, total_el: 91400.4052},
      {vintage: 2024, d_loans: 3, total_el: 43135.861}
    ],
    rowCount: 5,
    why: "2023 年有 8 笔 D 级、EL 合计 210,615，占 D 级总 EL（589,116）的 35.8%。这解释了为什么 2023 年的平均 PD 最高（8.14%）：不是那一年放出的贷款整体变差，而是 D 级恰好集中在这一年。要证明这一点，下一步是在同一等级内比较各 vintage 的 PD。"
  },
  {
    level: 3,
    q: "只看 2025 年及以后放款的贷款，各客群的平均 DTI、平均利率、平均 PD 是多少？",
    sql: "SELECT segment, AVG(dti) AS avg_dti, AVG(rate) AS avg_rate, AVG(pd) AS avg_pd FROM loans WHERE vintage >= 2025 GROUP BY segment ORDER BY avg_pd DESC",
    rows: [
      {segment: "小微企业", avg_dti: 0.5968, avg_rate: 0.0592, avg_pd: 0.0665},
      {segment: "消费贷", avg_dti: 0.5301, avg_rate: 0.0637, avg_pd: 0.0655},
      {segment: "信用卡", avg_dti: 0.5344, avg_rate: 0.0608, avg_pd: 0.0602},
      {segment: "按揭", avg_dti: 0.5267, avg_rate: 0.0584, avg_pd: 0.0314}
    ],
    rowCount: 4,
    why: "WHERE vintage >= 2025 取最近两个年份的 72 笔。一条查询同时看偿付压力（DTI）、定价（rate）和风险（PD）：小微企业 DTI 59.7%、PD 6.65% 均最高，利率 5.92% 却低于消费贷的 6.37%。这只是练习怎样读表：rate 在生成时只依赖信用等级、不依赖客群，所以不能当作真实的定价结论。"
  }
]
});
