"""Fetch a data.seoul.go.kr Sheet dataset through the grid JSON endpoint (dataView.do).

Used when the sheet CSV download endpoint refuses (returns '잘못된 접근').
usage: python -I -X utf8 seoul_sheet.py <outdir> OA-xxxxx ...
Writes <outdir>/raw/<OA>/sheet_grid.json (raw response pages) and <outdir>/utf8/<OA>/<name>.csv
"""
import csv
import json
import os
import re
import sys

import requests

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"


def parse_js_obj(txt: str):
    # keys are unquoted identifiers; quote them and parse as JSON
    fixed = re.sub(r'([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:', r'\1"\2":', txt)
    fixed = re.sub(r",\s*([\]}])", r"\1", fixed)
    return json.loads(fixed)


def main():
    out = sys.argv[1]
    s = requests.Session()
    s.headers["User-Agent"] = UA
    for oa in sys.argv[2:]:
        ref = f"https://data.seoul.go.kr/dataList/{oa}/S/1/datasetView.do"
        page = s.get(ref, timeout=60).text
        m = re.search(r'<meta name="title" content="([^"]*)"', page)
        name = m.group(1) if m else oa
        sv = s.get(f"https://data.seoul.go.kr/dataList/sheetView.do?infId={oa}&srvType=S",
                   headers={"Referer": ref}, timeout=60).text
        cols = re.findall(r'\{key:"([^"]+)", label:"([^"]*)"', sv)
        order = re.search(r'name="strOrderby" id="strOrderby" value="([^"]*)"', sv)
        rows, raws, pageno = [], [], 1
        while True:
            q = (f"https://data.seoul.go.kr/dataList/dataView.do?onepagerow=1000&srvType=S&infId={oa}"
                 f"&serviceKind=0&pageNo={pageno}&gridTotalCnt=&ssUserId=SAMPLE_VIEW&strWhere="
                 f"&strOrderby={order.group(1) if order else ''}&filterCol=&txtFilter=")
            r = s.post(q, data={"browser1": "chrome", "version": "130"}, headers={"Referer": ref}, timeout=300)
            raws.append(r.text)
            if not r.text.strip():
                break
            d = parse_js_obj(r.text.strip())
            rows.extend(d["list"])
            pg = d["page"]
            if not rows:
                break
            # pageNo counts in units of 100 rows; a 1000-row window starts at (pageNo-1)*100+1
            if len(rows) >= int(pg["totalCount"]) or not d["list"]:
                break
            pageno += 10
        os.makedirs(os.path.join(out, "raw", oa), exist_ok=True)
        os.makedirs(os.path.join(out, "utf8", oa), exist_ok=True)
        with open(os.path.join(out, "raw", oa, "sheet_grid.json"), "w", encoding="utf-8") as f:
            f.write("\n".join(raws))
        keys = [k for k, _ in cols] or sorted({k for r in rows for k in r})
        labels = [l for _, l in cols] or keys
        p = os.path.join(out, "utf8", oa, re.sub(r'[\\/:*?"<>|]', "_", name) + ".csv")
        with open(p, "w", encoding="utf-8", newline="") as f:
            w = csv.writer(f)
            w.writerow(labels)
            for r in rows:
                w.writerow([r.get(k, "") for k in keys])
        print(json.dumps({"oa": oa, "name": name, "rows": len(rows), "cols": labels,
                          "sample": [[r.get(k, "") for k in keys] for r in rows[:3]]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
