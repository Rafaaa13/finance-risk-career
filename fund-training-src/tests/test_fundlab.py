"""fundlab.py 解析函数的离线单元测试：样本取自 2026-10-20 实际接口返回的片段（未联网）。
运行：python3 -m unittest tests/test_fundlab.py   （在 训练工作台源码 目录下）"""
import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'fund'))
import fundlab as F

NAV = {"Datas": [{"FSRQ": "2026-10-19", "DWJZ": "4.0240", "JZZZL": "0.36", "LJJZ": "5.8140"},
                 {"FSRQ": "2026-10-16", "DWJZ": "4.0094", "JZZZL": "0.6", "LJJZ": "5.7994"},
                 {"FSRQ": "2026-09-30", "DWJZ": "3.9000", "JZZZL": "--", "LJJZ": "5.6000"},
                 {"FSRQ": "2026-09-29", "DWJZ": "3.8000", "JZZZL": "0.1", "LJJZ": "5.5000"}], "TotalCount": 4418}
HOLD = {"Datas": {"fundStocks": [{"GPDM": "01179", "GPJC": "华住集团-S", "JZBL": "9.41", "INDEXNAME": "社会服务", "PCTNVCHG": "-0.43"}]}, "Expansion": "2026-06-30"}
KL = {"data": {"klines": ["2026-08-31,4625.09", "2026-09-30,4357.62"]}}
YLD = {"result": {"data": [{"SOLAR_DATE": "2026-10-19 00:00:00", "EMM00588704": 1.2522, "EMM00166462": 1.377, "EMM00166466": 1.6497, "EMM00166469": 2.061, "EMG00001306": 4.77, "EMG00001310": 5.15}]}}


class T(unittest.TestCase):
    def test_nav(self):
        r = F.parse_nav(NAV)
        self.assertEqual(r[0], ("2026-10-19", 4.024, 5.814, 0.36))
        self.assertIsNone(r[2][3])

    def test_month_end(self):
        r = F.month_end(F.parse_nav(NAV))
        self.assertEqual([x[0] for x in r], ["2026-09-30", "2026-10-19"])

    def test_hold(self):
        asof, rows = F.parse_hold(HOLD)
        self.assertEqual(asof, "2026-06-30")
        self.assertEqual(rows[0][:3], ("01179", "华住集团-S", 9.41))

    def test_kline(self):
        self.assertEqual(F.parse_kline(KL)[1], ("2026-09-30", "4357.62"))

    def test_yield(self):
        r = F.parse_yield(YLD)[0]
        self.assertEqual((r["date"], r["cn10"], r["us10"]), ("2026-10-19", 1.6497, 5.15))


if __name__ == "__main__":
    unittest.main()
