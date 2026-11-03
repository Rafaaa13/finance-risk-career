/* prep_10c_local_project.js —— 基础视图参考答案：local（本机练习）+ project（项目证据包）
 * 本机练习的命令与预期输出已在沙箱里用 python3 + sqlite3 真实跑过（沙箱版本见 python.expect），
 * 页面侧数字来自 base.html 的真实逻辑（160 笔合成贷款，种子 20261003），并由
 * tests/verify_base_answers.js 重算、断言。这是合成数据训练项目，不是真实业务。
 * 本文件只负责 Object.assign(BASE_ANS, {...})，BASE_ANS 由外部声明。 */
Object.assign(BASE_ANS, {
local: {
  checks: {
    python: {
      cmd: `python3 --version
python3 -c "import sqlite3, csv; print(sqlite3.sqlite_version)"`,
      expect: `第一行形如 Python 3.x.y（3.8 及以上均可）；第二行是 SQLite 版本号，形如 3.x.y。
沙箱里实测：Python 3.10.12，SQLite 3.37.2。你的机器上版本会不同，这是正常的。`,
      pass: "两条命令都无报错并打印版本号，把版本号抄进 NOTES.md。如果提示 command not found，改用 python 或先安装 Python，不要跳过这一项。能说出为什么风险岗位常用 Python：数据处理、可复现的模型验证、批量压力测试。"
    },
    sqlite: {
      cmd: `# 1) 在工作台「本机练习」点「下载 starter 文件」，把 loans_training.csv 与 risk_training_starter.py 放进同一个新目录并 cd 进去
wc -l loans_training.csv
python3 risk_training_starter.py
python3 -c "import sqlite3; c=sqlite3.connect('loans.db'); print(c.execute('SELECT COUNT(*), SUM(ead) FROM loans').fetchone())"`,
      expect: `wc -l 打印：160 loans_training.csv
（下载的 CSV 末尾没有换行符，wc -l 只数换行，所以是 160；表头加 160 笔数据共 161 行文本。）
starter 脚本按 total_ead 降序打印 4 行：
{'segment': '按揭', 'loans': 40, 'total_ead': 11672769.0, 'avg_pd': 0.03400408270642021}
{'segment': '小微企业', 'loans': 40, 'total_ead': 11634319.0, 'avg_pd': 0.06216945961007499}
{'segment': '消费贷', 'loans': 40, 'total_ead': 10096293.0, 'avg_pd': 0.06776356580462445}
{'segment': '信用卡', 'loans': 40, 'total_ead': 8740149.0, 'avg_pd': 0.061175187772102936}
最后一条命令打印：(160, 42143530.0)`,
      pass: "4 行的顺序与上面一致，每组 loans = 40；total_ead 与页面 SQL 练习里同一条查询的结果逐位相同（total_ead 在 sqlite 里是 REAL，所以带 .0）；avg_pd 与页面显示的 4 位小数一致（15 位以后的差异来自不同 SQLite 版本的求和方式，可忽略）；loans.db 里 COUNT(*) = 160。"
    },
    query: {
      cmd: `python3 -c "import sqlite3; c=sqlite3.connect('loans.db'); [print(r) for r in c.execute('SELECT vintage, COUNT(*) AS loans, SUM(ead) AS total_ead, AVG(pd) AS avg_pd FROM loans GROUP BY vintage ORDER BY avg_pd DESC')]"`,
      expect: `(2023, 26, 6508421.0, 0.08141508685638249)
(2026, 39, 9225268.0, 0.05903014295720902)
(2025, 33, 9509175.0, 0.04891279455313855)
(2022, 34, 10538627.0, 0.04827634729930425)
(2024, 28, 6362039.0, 0.04750021334649611)`,
      pass: "第一行 vintage = 2023，平均 PD ≈ 0.0814，总 EAD = 6,508,421，且与工作台 SQL 页同一条语句的结果一致。再用一句话解释它：2023 年只有 26 笔，其中 8 笔 D 级（30.8%，全组合 16.9%），平均 PD 高是等级结构造成的。只会贴结果、解释不出这一句，不算过关。"
    },
    test: {
      cmd: `# 把下面 mcSeedCheck.code 存成 mc_seed_check.py
python3 mc_seed_check.py`,
      expect: `analytic(python, exact erf) = 10.436418
seed=20261003  mc=10.419498  se=0.070665  diff=-0.016920  z=-0.24  inCI=True
seed=20261004  mc=10.380309  se=0.070332  diff=-0.056109  z=-0.80  inCI=True
seed=42  mc=10.346654  se=0.070074  diff=-0.089764  z=-1.28  inCI=True`,
      pass: "种子 20261003 的 mc 与页面的 10.4195 一致（差小于 1e-4），说明 Python 版与页面是同一套算法；其他种子价格不同但 |z| < 1.96；Python 的解析价 10.436418 与页面 10.4364 只在第 5 位小数不同（页面用近似 erf）。再把脚本里的 50000 改成 150000 重跑：种子 20261003 应得 mc=10.357130、se=0.040408、z=-1.96、inCI=False，这是单次随机事件，换种子即恢复。要记录的是你看到的差异和解释，不是“都通过”。"
    },
    evidence: {
      cmd: `mkdir -p risk_practice/outputs && cd risk_practice
# 把 loans_training.csv、risk_training_starter.py、my_vintage.sql、mc_seed_check.py 放进来，然后把每条命令的终端输出存成文件
python3 --version > outputs/01_python_version.txt
python3 risk_training_starter.py > outputs/02_starter_output.txt
python3 -c "import sqlite3; c=sqlite3.connect('loans.db'); [print(r) for r in c.execute(open('my_vintage.sql').read())]" > outputs/03_vintage_query.txt
python3 mc_seed_check.py > outputs/04_mc_seed_check.txt
ls -R`,
      expect: `risk_practice 目录里应有：
README.md（一屏：项目是什么、3 条复现命令、数据是合成的）
loans_training.csv
risk_training_starter.py（运行后会生成 loans.db）
my_vintage.sql（你自己写的独立 SQL）
mc_seed_check.py
outputs/（01_python_version.txt、02_starter_output.txt、03_vintage_query.txt、04_mc_seed_check.txt）
NOTES.md（真实遇到的错误与修复、局限性）
outputs/02、03、04 三个文件的内容应分别等于上面 sqlite（starter 打印的 4 行）、query、test 三项的预期输出（01 的版本号因机器而异）。`,
      pass: "换一个人（或一周后的你）只按 README 的 3 条命令，5 分钟内复现 outputs 里全部数字。NOTES.md 至少有 1 条你真实遇到的报错及修复过程，以及 1 段局限性：合成数据、没有真实违约标签、8 笔逾期样本太小、页面 erf 为近似、LCG 随机数质量有限。错误修复必须是你真遇到的，不要为了好看编一条。"
    }
  },
  vintageSql: {
    sql: "SELECT vintage, COUNT(*) AS loans, SUM(ead) AS total_ead, AVG(pd) AS avg_pd FROM loans GROUP BY vintage ORDER BY avg_pd DESC",
    sqlPretty: `SELECT vintage,
       COUNT(*)  AS loans,
       SUM(ead)  AS total_ead,
       AVG(pd)   AS avg_pd
FROM loans
GROUP BY vintage
ORDER BY avg_pd DESC;`,
    topRow: { vintage: 2023, loans: 26, total_ead: 6508421, avg_pd: 0.0814 },
    rows: [
      {vintage: 2023, loans: 26, total_ead: 6508421, avg_pd: 0.0814},
      {vintage: 2026, loans: 39, total_ead: 9225268, avg_pd: 0.059},
      {vintage: 2025, loans: 33, total_ead: 9509175, avg_pd: 0.0489},
      {vintage: 2022, loans: 34, total_ead: 10538627, avg_pd: 0.0483},
      {vintage: 2024, loans: 28, total_ead: 6362039, avg_pd: 0.0475}
    ],
    note: "同一条语句既能在工作台 SQL 页运行，也能在 sqlite 里运行，两边结果一致。答案：平均 PD 最高的年份是 2023（8.14%），但它只有 26 笔且 8 笔是 D 级，要先按等级分层再比较年份。"
  },
  mcSeedCheck: {
    file: "mc_seed_check.py",
    code: `import math

def lcg(seed):
    s = seed & 0xFFFFFFFF
    while True:
        s = (1664525 * s + 1013904223) & 0xFFFFFFFF
        yield s / 4294967296

def normal(u):
    a = b = 0.0
    while not a: a = next(u)
    while not b: b = next(u)
    return math.sqrt(-2 * math.log(a)) * math.cos(2 * math.pi * b)

def mc_call(S, K, T, r, sigma, paths, seed):
    u = lcg(seed); s = s2 = 0.0
    for _ in range(paths):
        ST = S * math.exp((r - 0.5 * sigma ** 2) * T + sigma * math.sqrt(T) * normal(u))
        p = max(ST - K, 0.0); s += p; s2 += p * p
    m = s / paths
    var = max(0.0, (s2 - paths * m * m) / (paths - 1))
    d = math.exp(-r * T)
    return d * m, d * math.sqrt(var / paths)

def bs_call(S, K, T, r, sigma):
    d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    N = lambda x: 0.5 * (1 + math.erf(x / math.sqrt(2)))
    return S * N(d1) - K * math.exp(-r * T) * N(d2)

A = bs_call(100, 100, 1, 0.035, 0.22)
print("analytic(python, exact erf) = %.6f" % A)
for seed in (20261003, 20261004, 42):
    p, se = mc_call(100, 100, 1, 0.035, 0.22, 50000, seed)
    print("seed=%d  mc=%.6f  se=%.6f  diff=%+.6f  z=%+.2f  inCI=%s" % (seed, p, se, p - A, (p - A) / se, abs(p - A) <= 1.96 * se))
`,
    run: "python3 mc_seed_check.py",
    analyticPython: 10.436418,
    expect: [
      {seed: 20261003, mc: 10.419498, se: 0.070665, diff: -0.01692, z: -0.24, inCI: true},
      {seed: 20261004, mc: 10.380309, se: 0.070332, diff: -0.056109, z: -0.8, inCI: true},
      {seed: 42, mc: 10.346654, se: 0.070074, diff: -0.089764, z: -1.28, inCI: true}
    ],
    paths150000: {seed: 20261003, mc: 10.35713, se: 0.040408, diff: -0.079289, z: -1.96, inCI: false},
    explain: "脚本用与页面完全相同的 LCG（乘数 1664525，增量 1013904223，模 2^32）和 Box–Muller，因此种子 20261003 能复现页面的 MC 价；解析价用 Python 精确的 math.erf，所以比页面的 10.4364 多出第 5 位小数的差别。diff 与 z 都相对 Python 的解析价计算。把路径数改成 150000 后，种子 20261003 得到的就是「解析价略在 CI 之外」的那个单次事件。"
  },
},
project: {
  findings: "基于 160 笔合成贷款：基线 EL 1,098,676（占 EAD 2.61%）；PD×1.35、LGD×1.2 下压力 EL 1,779,854，增 62.0%。小微企业贡献最高（压力 EL 619,268，占 34.8%），但统一乘数不改变排名，基线下它已最高；消费贷平均 PD 最高（6.78%）却排第二；D 级 27 笔占 EL 的 53.6%。仅限合成数据，需真实标签与时间切分验证。",
  sample90s: "我做的是一个用合成数据完成的风险分析训练项目，不是工作经历。数据是我用固定种子生成的 160 笔零售贷款，四个客群各 40 笔。问题是：PD 乘 1.35、LGD 乘 1.2 的压力下，哪个客群贡献的预期损失最大。我用 SQL 分群，再逐笔计算 PD 乘 LGD 乘 EAD：基线预期损失 1,098,676，压力后 1,779,854，增加 62.0%，恰好等于 1.35 乘 1.2 再减 1，因为没有贷款触到 0.99 封顶。小微企业贡献最高，占 34.8%，但基线下它就是最高，所以我不把它当作压力测试的发现；消费贷平均 PD 更高，是小微企业 EAD 更大让它反超。我还用 Black–Scholes 与 Monte Carlo 对照了一个期权，解析价 10.4364，蒙特卡洛 10.4195，标准误 0.0707。局限是数据合成、逾期标签由 PD 生成，下一步要用真实违约标签和时间切分回测。",
  bullets: [
    "• 训练项目（合成数据）：自建 160 笔零售贷款数据集（4 个客群 × 40 笔，固定种子可复现），用 SQL 分群并逐笔计算 PD×LGD×EAD，得到基线预期损失 1,098,676（占 EAD 的 2.61%）；非真实机构数据。",
    "• 训练项目（合成数据）：设置 PD×1.35、LGD×1.2 压力情景，压力 EL 升至 1,779,854（+62.0%），识别小微企业为最高贡献客群（34.8%），并说明统一乘数下占比不变、只有出现封顶时各客群增幅才会拉开。",
    "• 个人练习：以 Black–Scholes 解析价 10.4364 为基准，用 50,000 路径 Monte Carlo 复核得 10.4195（SE 0.0707），并用 200 个种子检验置信区间覆盖率（93.0%）及路径数对标准误的影响；不是生产模型。",
    "• Training project on synthetic data (not real institution data): built a 160-loan retail portfolio and computed expected loss of 1,098,676 (2.61% of EAD); under a PD ×1.35 / LGD ×1.2 stress, EL rose 62.0% to 1,779,854, with small-business loans the largest contributor (34.8%)."
  ],
  note: "bullets 是模板：只有你亲手完成了对应练习，才能写进简历，做过多少写多少。所有数字都来自合成数据，不代表任何真实机构，也不要写成「上线」或「服务了业务」。"
}
});
