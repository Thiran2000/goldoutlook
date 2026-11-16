#!/usr/bin/env python3
"""Build data/retail.json: retail gold rates read from Sri Lankan jewellers' public pages.

Sources (add more in SOURCES, one small parse function each):
  - Devi Jewellers   https://devijewellers.lk/gold-rate/
  - Bullion Gold     https://bulliongold.lk/gold-price/
  - Ran Lanka        https://ranlanka.lk/

Every price is normalised to LKR per sovereign (8 g), the unit the site uses.

Safety rules (a bad scrape must never reach the page):
  1. A value must be within +/-35% of the world-price value (from data/latest.json), else it is rejected.
  2. If a source fails or is rejected, its LAST GOOD value is kept with its OLD timestamp.
     The website hides prices older than 24 h, so stale data fades out by itself.
  3. A source more than 10% away from the median of the others is shown but left out of the median.
  4. If nothing at all could be read, the file is left untouched (the site keeps its old data).

Standard library only.   Run:  python3 scripts/update_retail.py
Test parsers offline:       python3 scripts/test_update_retail.py
"""
import json
import os
import re
import sys
import time
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "data", "retail.json")
LATEST = os.path.join(ROOT, "data", "latest.json")
HISTORY = os.path.join(ROOT, "data", "retail_history.csv")

OZ_G = 31.1035
BAND = 0.35          # accept values within +/-35% of the world-price value
OUTLIER = 0.10       # leave out of the median if >10% from the median of the others
UA = "Mozilla/5.0 (compatible; GoldOutlookLK/1.0; +price comparison; contact via site)"


# ---------------------------------------------------------------- helpers
class _Text(HTMLParser):
    """HTML to plain text, skipping scripts and styles."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.skip = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript"):
            self.skip += 1
        elif tag in ("tr", "p", "div", "li", "br", "h1", "h2", "h3", "h4", "td", "th"):
            self.parts.append(" ")

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript") and self.skip:
            self.skip -= 1

    def handle_data(self, data):
        if not self.skip:
            self.parts.append(data)


def html_to_text(html):
    p = _Text()
    p.feed(html)
    return re.sub(r"\s+", " ", " ".join(p.parts)).replace("\xa0", " ").strip()


def num(s):
    return float(str(s).replace(",", ""))


def per_sovereign(v):
    """Pages quote either per gram or per sovereign (8 g). Devi labels its values '/g' but they are per 8 g.
    Anything under 100,000 is read as per gram."""
    v = float(v)
    return v * 8 if v < 100000 else v


N = r"(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d{4,}(?:\.\d+)?)"


BROWSER_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
              "Chrome/124.0 Safari/537.36")


def fetch_text(url, timeout=30, tries=3):
    """Some sites drop requests that do not look like a normal page visit, so send ordinary browser headers
    and retry a few times (a dropped connection is sometimes just a hiccup)."""
    headers = {"User-Agent": BROWSER_UA,
               "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
               "Accept-Language": "en-US,en;q=0.9",
               "Accept-Encoding": "identity",
               "Cache-Control": "no-cache",
               "Connection": "close"}
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return html_to_text(r.read().decode("utf-8", "replace"))
        except Exception as e:
            last = e
            print("  attempt %d for %s failed: %s" % (i + 1, url, e))
            time.sleep(3 * (i + 1))
    raise last


# ---------------------------------------------------------------- one parser per site (text in, dict out)
def parse_devi(text):
    """Header widget: 'Gold (22KT): 329,400.00 LKR /g'. Fallback: first row of the weekly table (newest first)."""
    out = {}
    m22 = re.search(r"Gold\s*\(\s*22\s*KT\s*\)\D{0,15}" + N, text, re.I)
    m24 = re.search(r"Gold\s*\(\s*24\s*KT\s*\)\D{0,15}" + N, text, re.I)
    if m22:
        out["sell_22k"] = per_sovereign(num(m22.group(1)))
    if m24:
        out["sell_24k"] = per_sovereign(num(m24.group(1)))
    if "sell_22k" not in out:  # date | 24K | change% | 22K | change%
        m = re.search(r"[A-Z][a-z]{2} \d{1,2}, \d{4}\D{0,10}" + N + r"\s*\D{0,3}\s*\d{1,3}(?:\.\d+)?\s*%\s*" + N, text)
        if m:
            out["sell_24k"] = per_sovereign(num(m.group(1)))
            out["sell_22k"] = per_sovereign(num(m.group(2)))
    return out


def parse_bullion(text):
    """Rows like '22 KT (Per 8g) LKR 365,000'."""
    out = {}
    for k in ("18", "21", "22", "24"):
        m = re.search(k + r"\s*KT\s*\(\s*Per\s*8\s*g\s*\)\D{0,25}" + N, text, re.I)
        if m:
            out["sell_%sk" % k] = per_sovereign(num(m.group(1)))
    return out


def parse_ranlanka(text):
    """Table: KARAT | PURITY | BUYING PRICE | SELLING PRICE, per pawn (8 g).
    The shop BUYS from you at 'Buying' and SELLS to you at 'Selling'."""
    out = {}
    for k, purity in (("24", r"100"), ("22", r"91\.6"), ("21", r"87\.5"), ("18", r"75(?:\.0)?")):
        m = re.search(k + r"\s*KT\D{0,12}" + purity + r"\s*%\D{0,12}" + N + r"\D{0,12}" + N, text, re.I)
        if m:
            out["sell_%sk" % k] = per_sovereign(num(m.group(2)))
            if k == "22":
                out["buy_22k"] = per_sovereign(num(m.group(1)))
    return out


DISABLED = {"bullion"}   # Bullion Gold only changes its price once a day, so it is not read
PRIMARY = "ranlanka"     # Ran Lanka's rate is the Sri Lanka market price
SOURCES = [
    {"id": "devi", "name": "Devi Jewellers", "url": "https://devijewellers.lk/gold-rate/", "parse": parse_devi},
    {"id": "bullion", "name": "Bullion Gold", "url": "https://bulliongold.lk/gold-price/", "parse": parse_bullion},
    {"id": "ranlanka", "name": "Ran Lanka", "url": "https://ranlanka.lk/", "parse": parse_ranlanka},
]


# ---------------------------------------------------------------- logic (pure, testable)
def fair_sovereign(spot_usd_oz, usdlkr):
    """22K sovereign value at the world price (same formula the page uses)."""
    return spot_usd_oz / OZ_G * usdlkr * (22 / 24) * 8


KARATS = (24, 22, 21, 18)


def validate(parsed, fair):
    """Return a cleaned dict if the 22K price is plausible, else None.
    Other karats are kept only if they are also near the world-price value for that karat."""
    s = parsed.get("sell_22k")
    if not s:
        return None
    if fair and not (fair * (1 - BAND) <= s <= fair * (1 + BAND)):
        return None
    clean = {"sell_22k": round(s)}
    if parsed.get("buy_22k") and (not fair or fair * (1 - BAND) <= parsed["buy_22k"] <= fair * (1 + BAND)):
        clean["buy_22k"] = round(parsed["buy_22k"])
    for k in (24, 21, 18):
        v = parsed.get("sell_%dk" % k)
        want = fair * k / 22 if fair else None
        if v and (not want or want * (1 - BAND) <= v <= want * (1 + BAND)):
            clean["sell_%dk" % k] = round(v)
    return clean


def median(a):
    s = sorted(a)
    n = len(s)
    return None if not n else (s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2)


def mark_outliers(rows):
    """Set in_median on each row. With fewer than 3 rows everything counts."""
    for r in rows:
        r["in_median"] = True
    if len(rows) < 3:
        return rows
    for r in rows:
        others = median([o["sell_22k_sovereign"] for o in rows if o is not r])
        if others and abs(r["sell_22k_sovereign"] / others - 1) > OUTLIER:
            r["in_median"] = False
    return rows


def build(results, previous, now_iso):
    """results: {id: cleaned dict or None}. previous: old retail.json dict (or None). Returns new dict."""
    old = {s["id"]: s for s in (previous or {}).get("sources", [])}
    rows = []
    for src in SOURCES:
        got = results.get(src["id"])
        if got:
            row = {"sell_22k_sovereign": got["sell_22k"], "at": now_iso}
            if got.get("buy_22k"):
                row["buy_22k_sovereign"] = got["buy_22k"]
            for k in (24, 21, 18):
                if got.get("sell_%dk" % k):
                    row["sell_%dk_sovereign" % k] = got["sell_%dk" % k]
        elif src["id"] in old and src["id"] not in DISABLED:  # keep last good value with its old timestamp
            row = {k: v for k, v in old[src["id"]].items() if k not in ("id", "name", "url", "city", "in_median", "primary")}
        else:
            continue
        row.update({"id": src["id"], "name": src["name"], "url": src["url"], "city": "Online"})
        if src["id"] == PRIMARY:
            row["primary"] = True
        rows.append(row)
    mark_outliers(rows)
    med = median([r["sell_22k_sovereign"] for r in rows if r["in_median"]])
    market = {}
    for k in KARATS:
        vals = [r["sell_%dk_sovereign" % k] for r in rows if r["in_median"] and r.get("sell_%dk_sovereign" % k)]
        if vals:
            market[str(k)] = round(median(vals))
    return {"updated": now_iso, "unit": "LKR per sovereign (8 g) of the stated karat", "sources": rows,
            "median_22k_sovereign": round(med) if med else None, "market": market}


HISTORY_HEADER = "time,median_22k,world_value_22k,premium_pct,sources\n"


def log_history(path, data, fair, now_iso, min_gap_hours=3):
    """Append one line to data/retail_history.csv when the median changed or 3 h have passed.
    This builds the record of how far Sri Lankan shops sit above the world price, which the forecast can learn from."""
    med = data.get("median_22k_sovereign")
    if not med:
        return False
    last = None
    if os.path.exists(path):
        try:
            with open(path) as f:
                rows = [l.strip().split(",") for l in f.read().strip().split("\n")[1:] if l.strip()]
            last = rows[-1] if rows else None
        except Exception:
            last = None
    if last:
        try:
            age_h = (datetime.strptime(now_iso, "%Y-%m-%dT%H:%M:%SZ") - datetime.strptime(last[0], "%Y-%m-%dT%H:%M:%SZ")).total_seconds() / 3600
            if float(last[1]) == med and age_h < min_gap_hours:
                return False
        except Exception:
            pass
    prem = "%.2f" % ((med / fair - 1) * 100) if fair else ""
    new = not os.path.exists(path)
    with open(path, "a") as f:
        if new:
            f.write(HISTORY_HEADER)
        f.write("%s,%d,%s,%s,%d\n" % (now_iso, med, round(fair) if fair else "", prem, len(data["sources"])))
    return True


def load_json(path):
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return None


def main():
    latest = load_json(LATEST) or {}
    fair = None
    try:
        fair = fair_sovereign(float(latest["gold_usd_oz"]), float(latest["usdlkr"]))
    except Exception:
        print("warning: no world price in data/latest.json, plausibility check skipped")
    results = {}
    for src in SOURCES:
        if src["id"] in DISABLED:
            continue
        try:
            parsed = src["parse"](fetch_text(src["url"]))
            ok = validate(parsed, fair)
            if ok:
                print("%-9s ok       22K sovereign %s" % (src["id"], f"{ok['sell_22k']:,}"))
            else:
                print("%-9s REJECTED parsed=%s fair=%s" % (src["id"], parsed, fair and round(fair)))
            results[src["id"]] = ok
        except Exception as e:
            print("%-9s FAILED   %s" % (src["id"], e))
            results[src["id"]] = None
    if not any(results.values()):
        sys.exit("No source could be read; leaving data/retail.json as it was.")
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    data = build(results, load_json(OUT), now)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(data, f, indent=1)
    print("wrote", OUT, "median", data["median_22k_sovereign"], "market", data["market"])
    if log_history(HISTORY, data, fair, now):
        print("logged", HISTORY)


if __name__ == "__main__":
    main()
