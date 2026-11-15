"""Download KRIC Rail Portal (data.kric.go.kr) file datasets by id.

usage: python -I -X utf8 kric_dl.py <outdir> <id> ...
Raw -> <outdir>/raw/KRIC-<id>/, UTF-8 CSV -> <outdir>/utf8/KRIC-<id>/; prints JSON lines.
"""
import html
import json
import os
import re
import sys
import time
import urllib.parse

import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from seoul_dl import safe, to_utf8, xlsx_to_csv  # noqa: E402

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"


def main():
    out = sys.argv[1]
    s = requests.Session()
    s.headers["User-Agent"] = UA
    for kid in sys.argv[2:]:
        url = f"https://data.kric.go.kr/rips/M_01_01/detail.do?id={kid}"
        page = s.get(url, timeout=60).text
        text = " ".join(re.sub(r"<[^>]+>", " ", html.unescape(page)).split())
        title = re.search(r"역사편의정보|역사정보|역구조", text)
        m = re.search(r"제공기관 : (\S+)", text)
        provider = m.group(1) if m else ""
        m = re.search(r"<title>([^<]*)</title>", page)
        ops = sorted(set(re.findall(r"download\.file\?type=filedata&id=%s&operation=(\d+)" % kid, page)))
        ent = {"id": kid, "url": url, "provider": provider, "files": []}
        m = re.search(r"제공기관 : \S+\s*확장자[^가-힣]*[^ ]*\s*다운로드 횟수 : [\d,]+건\s*(.*?)\s*(상세정보|$)", text)
        ent["desc"] = (m.group(1) if m else "")[:500]
        rawdir = os.path.join(out, "raw", f"KRIC-{kid}")
        u8dir = os.path.join(out, "utf8", f"KRIC-{kid}")
        os.makedirs(rawdir, exist_ok=True)
        os.makedirs(u8dir, exist_ok=True)
        for op in ops:
            time.sleep(0.5)
            r = s.get(f"https://data.kric.go.kr/rips/dataset/download.file?type=filedata&id={kid}&operation={op}",
                      headers={"Referer": url}, timeout=600)
            cd = r.headers.get("Content-Disposition", "")
            m = re.search(r"filename\*?=([^;]+)", cd)
            fname = urllib.parse.unquote(m.group(1).strip().strip('"')) if m else f"KRIC-{kid}-{op}.bin"
            p = os.path.join(rawdir, safe(fname))
            with open(p, "wb") as f:
                f.write(r.content)
            fe = {"file": fname, "bytes": len(r.content), "status": r.status_code}
            low = fname.lower()
            try:
                txt = None
                if low.endswith(".csv"):
                    txt = to_utf8(r.content)
                elif low.endswith(".xlsx"):
                    txt = xlsx_to_csv(p)
                if txt is not None:
                    with open(os.path.join(u8dir, safe(re.sub(r"\.xlsx$", ".csv", fname, flags=re.I))), "w",
                              encoding="utf-8", newline="") as f:
                        f.write(txt)
                    lines = txt.splitlines()
                    fe["rows"] = len(lines) - 1
                    fe["head"] = lines[:4]
            except Exception as e:  # noqa: BLE001
                fe["convert_error"] = repr(e)
            ent["files"].append(fe)
        print(json.dumps(ent, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
