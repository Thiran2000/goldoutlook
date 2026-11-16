#!/usr/bin/env python3
"""Offline tests for update_retail.py. Fixtures copy how each page's rates read (from the live pages, 16 Nov 2026).
Run: python3 scripts/test_update_retail.py"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import update_retail as u

DEVI = """<html><body><script>var x=1;</script>
<div class="hdr"><span>Gold (22KT)</span><b>329,400.00 LKR /g</b><img src="up-arrow.svg">
<span>Gold (24KT)</span><b>358,000.00 LKR /g</b></div>
<div id="rate22">Loading...</div>
<table><tr><td>Nov 16, 2026</td><td>358,000.00</td><td><img src="up-arrow.svg">0.00%</td><td>329,400.00</td><td><img>0.00%</td></tr>
<tr><td>Nov 14, 2026</td><td>358,000.00</td><td>0.56%</td><td>329,400.00</td><td>0.54%</td></tr></table></body></html>"""

DEVI_NO_HEADER = """<table><tr><td>Nov 16, 2026</td><td>358,000.00</td><td><img>0.00%</td><td>329,400.00</td><td>0.00%</td></tr></table>"""

BULLION = """<h2>Real Time Updated Gold Prices</h2><div><h3>18 KT (Per 8g)</h3><p>LKR 298,500</p></div>
<div><h3>21 KT (Per 8g)</h3><p>LKR 348,000</p></div><div><h3>22 KT (Per 8g)</h3><p>LKR 365,000</p></div>
<div><h3>24 KT (Per 8g)</h3><p>LKR 398,000</p></div><span>Updated on:</span>"""

RAN = """<h2>Gold Buying and Selling Price in Sri Lanka</h2><table>
<tr><th>Karat</th><th>Purity</th><th>Buying Price</th><th>Selling Price</th></tr>
<tr><td>24KT</td><td>100%</td><td>LKR 350,000</td><td>LKR 358,000</td></tr>
<tr><td>22KT</td><td>91.6%</td><td>LKR 320,600</td><td>LKR 327,928</td></tr>
<tr><td>21KT</td><td>87.5%</td><td>LKR 306,250</td><td>LKR 313,250</td></tr></table>"""

FAIR = u.fair_sovereign(3859.95, 332.671)  # about 302,700


class T(unittest.TestCase):
    def test_devi(self):
        r = u.parse_devi(u.html_to_text(DEVI))
        self.assertEqual((r["sell_22k"], r["sell_24k"]), (329400, 358000))

    def test_devi_fallback_table(self):
        r = u.parse_devi(u.html_to_text(DEVI_NO_HEADER))
        self.assertEqual((r["sell_22k"], r["sell_24k"]), (329400, 358000))

    def test_per_gram_is_converted(self):
        self.assertEqual(u.per_sovereign(41175), 329400)
        self.assertEqual(u.per_sovereign(329400), 329400)

    def test_bullion(self):
        r = u.parse_bullion(u.html_to_text(BULLION))
        self.assertEqual((r["sell_22k"], r["sell_24k"]), (365000, 398000))

    def test_ranlanka(self):
        r = u.parse_ranlanka(u.html_to_text(RAN))
        self.assertEqual((r["buy_22k"], r["sell_22k"], r["sell_24k"]), (320600, 327928, 358000))

    def test_validate_rejects_junk(self):
        self.assertIsNone(u.validate({"sell_22k": 1200}, FAIR))
        self.assertIsNone(u.validate({"sell_22k": 900000}, FAIR))
        self.assertIsNone(u.validate({}, FAIR))
        self.assertEqual(u.validate({"sell_22k": 329400}, FAIR)["sell_22k"], 329400)

    def test_outlier_excluded_from_median(self):
        res = {"devi": {"sell_22k": 329400}, "bullion": {"sell_22k": 365000}, "ranlanka": {"sell_22k": 327928, "buy_22k": 320600}}
        d = u.build(res, None, "2026-11-16T06:00:00Z")
        by = {s["id"]: s for s in d["sources"]}
        self.assertFalse(by["bullion"]["in_median"])
        self.assertTrue(by["devi"]["in_median"])
        self.assertEqual(d["median_22k_sovereign"], round((329400 + 327928) / 2))

    def test_failed_source_keeps_old_value_and_old_time(self):
        first = u.build({"devi": {"sell_22k": 329400}, "bullion": None, "ranlanka": None}, None, "2026-11-16T06:00:00Z")
        second = u.build({"devi": None, "bullion": None, "ranlanka": {"sell_22k": 327928}}, first, "2026-11-16T07:00:00Z")
        by = {s["id"]: s for s in second["sources"]}
        self.assertEqual(by["devi"]["sell_22k_sovereign"], 329400)
        self.assertEqual(by["devi"]["at"], "2026-11-16T06:00:00Z")  # not refreshed
        self.assertEqual(by["ranlanka"]["at"], "2026-11-16T07:00:00Z")


if __name__ == "__main__":
    unittest.main()
