#!/usr/bin/env python3
"""fundlab.py —— 公募基金岗位训练台的数据刷新脚本（只用标准库）。
抓取的是东方财富/天天基金的公开 JSON 接口（与工作台快照同源），用于一周后重做同一份分析。
用法示例：
  python3 fundlab.py nav 005827 --monthly          # 日净值，--monthly 只留月末
  python3 fundlab.py hold 005827                   # 前十大持仓(+行业、较上期变动)
  python3 fundlab.py index 1.000300                # 指数月K（secid：1.沪 0.深 100.HSI）
  python3 fundlab.py yields --pages 3              # 中美国债收益率（日度，最近 pages*500 条）
  python3 fundlab.py fin 600519.SH                 # 近10年年报主要财务指标
说明：接口为非官方公开接口，可能变更或限流；数据不是基金公告原件，引用前请核对。
"""
import csv, json, sys, time, urllib.parse, urllib.request

UA = {"User-Agent": "Mozilla/5.0 (fundlab training script)"}
MOB = "deviceid=a&plat=Android&product=EFund&version=6.5.5"


def get_json(url, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=20) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:  # 网络/限流：退避重试
            if i == tries - 1:
                raise
            time.sleep(1.5 * (i + 1))


def parse_nav(js):
    """FundMNHisNetList -> [(日期, 单位净值, 累计净值, 日涨跌幅%)]，保持接口的倒序"""
    out = []
    for d in js.get("Datas") or []:
        f = lambda k: float(d[k]) if d.get(k) not in (None, "", "--") else None
        out.append((d["FSRQ"], f("DWJZ"), f("LJJZ"), f("JZZZL")))
    return out


def fetch_nav(code, page_size=500):
    rows, page, total = [], 1, None
    while total is None or len(rows) < total:
        url = (f"https://fundmobapi.eastmoney.com/FundMNewApi/FundMNHisNetList?FCODE={code}"
               f"&pageIndex={page}&pageSize={page_size}&{MOB}&_=1")
        js = get_json(url)
        batch = parse_nav(js)
        if not batch:
            break
        total = js.get("TotalCount") or len(batch)
        rows += batch
        page += 1
    return rows


def month_end(rows):
    """每个自然月保留最后一个有净值的交易日（输入倒序，输出正序）"""
    best = {}
    for r in rows:
        m = r[0][:7]
        if m not in best or r[0] > best[m][0]:
            best[m] = r
    return [best[m] for m in sorted(best)]


def parse_hold(js):
    rows = [(s["GPDM"], s["GPJC"], float(s["JZBL"]), s.get("INDEXNAME"), s.get("PCTNVCHG"))
            for s in (js.get("Datas") or {}).get("fundStocks", [])]
    return js.get("Expansion"), rows


def parse_kline(js):
    return [tuple(k.split(",")[:2]) for k in (js.get("data") or {}).get("klines", [])]


YCOL = {"EMM00588704": "cn2", "EMM00166462": "cn5", "EMM00166466": "cn10", "EMM00166469": "cn30",
        "EMG00001306": "us2", "EMG00001310": "us10"}


def parse_yield(js):
    out = []
    for d in js["result"]["data"]:
        row = {"date": d["SOLAR_DATE"][:10]}
        row.update({v: d.get(k) for k, v in YCOL.items()})
        out.append(row)
    return out


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 1
    cmd, args = argv[1], argv[2:]
    w = csv.writer(sys.stdout)
    if cmd == "nav":
        rows = fetch_nav(args[0])
        if "--monthly" in args:
            rows = month_end(rows)
        w.writerow(["date", "dwjz", "ljjz", "pct"])
        w.writerows(rows)
    elif cmd == "hold":
        url = (f"https://fundmobapi.eastmoney.com/FundMNewApi/FundMNInverstPosition?FCODE={args[0]}"
               f"&{MOB}&Uid=&_=1")
        asof, rows = parse_hold(get_json(url))
        w.writerow(["asof", asof])
        w.writerow(["code", "name", "weight_pct", "industry", "chg_vs_prev"])
        w.writerows(rows)
    elif cmd == "index":
        url = ("https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=" + args[0] +
               "&fields1=f1,f2,f3&fields2=f51,f53&klt=103&fqt=0&beg=20210801&end=20991231")
        w.writerow(["date", "close"])
        w.writerows(parse_kline(get_json(url)))
    elif cmd == "yields":
        pages = int(args[args.index("--pages") + 1]) if "--pages" in args else 1
        w.writerow(["date"] + list(YCOL.values()))
        for p in range(1, pages + 1):  # 单页上限 500 条
            url = ("https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPTA_WEB_TREASURYYIELD"
                   f"&columns=ALL&pageNumber={p}&pageSize=500&sortColumns=SOLAR_DATE&sortTypes=-1")
            for r in parse_yield(get_json(url)):
                w.writerow([r["date"]] + [r[v] for v in YCOL.values()])
    elif cmd == "fin":
        flt = urllib.parse.quote(f'(SECUCODE="{args[0]}")(REPORT_TYPE="年报")')
        url = ("https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FINANCE_MAINFINADATA"
               f"&columns=ALL&filter={flt}&pageNumber=1&pageSize=10&sortTypes=-1&sortColumns=REPORT_DATE")
        data = get_json(url)["result"]["data"]
        keys = ["REPORT_DATE", "TOTALOPERATEREVE", "PARENTNETPROFIT", "ROEJQ", "XSMLL", "XSJLL", "ZCFZL", "MGJYXJJE"]
        w.writerow(keys)
        for d in data:
            w.writerow([d.get(k) for k in keys])
    else:
        print(__doc__)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
