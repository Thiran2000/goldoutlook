#!/usr/bin/env python3
"""Build data/prices.csv (date, gold_usd, usdlkr) for the Gold Outlook LK dashboard.

Gold: daily USD per troy ounce from freegoldapi.com (free, no key).
USD to LKR: dated snapshots from the free currency-api (jsDelivr, with a pages.dev fallback).

The script is incremental. It keeps rows already in the CSV and only fetches
exchange rates for dates it has not seen, so each run is small. Standard library only.

Run:  python3 scripts/update_data.py            (writes data/prices.csv)
"""
import csv
import json
import os
import sys
import urllib.request
from datetime import date, timedelta

OUT = os.path.join(os.path.dirname(__file__), "..", "data", "prices.csv")
GOLD_URL = "https://freegoldapi.com/data/latest.json"
FX_URLS = [
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{d}/v1/currencies/usd.json",
    "https://{d}.currency-api.pages.dev/v1/currencies/usd.json",
]
KEEP_DAYS = 900          # history kept in the file
MAX_FX_PER_RUN = 150     # polite cap on new exchange-rate lookups per run


def http_json(url, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": "gold-outlook-updater/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def fetch_gold():
    """Return {iso_date: usd_per_oz}. Replace this function to use another gold source."""
    rows = http_json(GOLD_URL)
    cutoff = (date.today() - timedelta(days=KEEP_DAYS)).isoformat()
    out = {}
    for r in rows:
        d, p = str(r.get("date", ""))[:10], r.get("price")
        if d >= cutoff and isinstance(p, (int, float)) and p > 0:
            out[d] = float(p)
    return out


def fetch_fx(d):
    """USD to LKR on a given date, or None."""
    for tpl in FX_URLS:
        try:
            v = http_json(tpl.format(d=d)).get("usd", {}).get("lkr")
            if isinstance(v, (int, float)) and v > 0:
                return float(v)
        except Exception:
            continue
    return None


def load_existing(path):
    rows = {}
    if os.path.exists(path):
        with open(path, newline="") as f:
            for r in csv.DictReader(f):
                try:
                    rows[r["date"]] = (float(r["gold_usd"]), float(r["usdlkr"]) if r["usdlkr"] else None)
                except (KeyError, ValueError):
                    pass
    return rows


def merge(existing, gold, fx_lookup, max_fx=MAX_FX_PER_RUN):
    """Combine rows. Gold always takes the newest value. FX is fetched only when missing.
    Dates still missing a rate reuse the previous known rate so the file has no gaps."""
    merged, fetched = {}, 0
    for d in sorted(set(existing) | set(gold)):
        g = gold.get(d, existing.get(d, (None, None))[0])
        if g is None:
            continue
        fx = existing.get(d, (None, None))[1]
        if fx is None and fetched < max_fx:
            fx = fx_lookup(d)
            fetched += 1
        merged[d] = (g, fx)
    last = None
    for d in sorted(merged):  # carry the last known rate forward, then back-fill the start
        g, fx = merged[d]
        if fx is None:
            fx = last
        else:
            last = fx
        merged[d] = (g, fx)
    first = next((fx for _, fx in (merged[d] for d in sorted(merged)) if fx is not None), None)
    for d in sorted(merged):
        g, fx = merged[d]
        merged[d] = (g, fx if fx is not None else first)
    cutoff = (date.today() - timedelta(days=KEEP_DAYS)).isoformat()
    return {d: v for d, v in merged.items() if d >= cutoff and v[1] is not None}


def write(path, rows):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["date", "gold_usd", "usdlkr"])
        for d in sorted(rows):
            g, fx = rows[d]
            w.writerow([d, round(g, 2), round(fx, 4)])


LATEST = os.path.join(os.path.dirname(__file__), "..", "data", "latest.json")
SPOT_URL = "https://xaus.com/api/v1/spot"  # free, no key (per the provider's page; confirm it works for you)
DEALER = os.path.join(os.path.dirname(__file__), "..", "data", "dealer.json")  # optional: {"dealer_22k_sovereign_lkr": 330000}


def fetch_spot():
    """Return (usd_per_oz, source_name) or None. Replace this function to use another feed."""
    try:
        v = http_json(SPOT_URL).get("spot_usd_oz")
        if isinstance(v, (int, float)) and v > 0:
            return float(v), "xaus.com"
    except Exception:
        pass
    return None


def build_latest(spot, fx, now_iso, dealer=None):
    """Pure function: the small file the website reads every minute."""
    out = {"updated": now_iso, "gold_usd_oz": round(spot[0], 2), "usdlkr": round(fx[0], 4),
           "source_gold": spot[1], "source_fx": fx[1]}
    if dealer:
        out["dealer_22k_sovereign_lkr"] = dealer
    return out


def write_latest():
    """Runs every 5 minutes. Writes data/latest.json only when both a fresh gold price and rate are available."""
    from datetime import datetime, timezone
    spot = fetch_spot()
    fx = None
    for tpl in FX_URLS:
        try:
            v = http_json(tpl.format(d="latest")).get("usd", {}).get("lkr")
            if isinstance(v, (int, float)) and v > 0:
                fx = (float(v), "currency-api")
                break
        except Exception:
            continue
    if not spot or not fx:
        sys.exit("No fresh gold price or exchange rate; leaving data/latest.json as it was (the site shows its age).")
    dealer = None
    if os.path.exists(DEALER):
        try:
            dealer = float(json.load(open(DEALER)).get("dealer_22k_sovereign_lkr") or 0) or None
        except Exception:
            dealer = None
    os.makedirs(os.path.dirname(LATEST), exist_ok=True)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    json.dump(build_latest(spot, fx, now, dealer), open(LATEST, "w"), indent=1)
    print("latest:", spot, fx)


def main():
    if "--latest" in sys.argv:
        return write_latest()
    existing = load_existing(OUT)
    gold = fetch_gold()
    if len(gold) < 60:
        sys.exit("Gold feed returned %d usable rows; leaving the existing file untouched." % len(gold))
    rows = merge(existing, gold, fetch_fx)
    if len(rows) < 60:
        sys.exit("Only %d complete rows after merging; leaving the existing file untouched." % len(rows))
    write(OUT, rows)
    last = max(rows)
    print("Wrote %d rows, latest %s: gold %.2f USD/oz, USD/LKR %.2f" % (len(rows), last, rows[last][0], rows[last][1]))


if __name__ == "__main__":
    main()
