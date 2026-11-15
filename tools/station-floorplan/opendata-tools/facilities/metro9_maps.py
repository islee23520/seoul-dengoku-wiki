"""Download Line 9 (Seoul Metro9, phase 1) station-use / evacuation maps and their descriptive alt text.

usage: python -I -X utf8 metro9_maps.py <outdir>
"""
import html
import json
import os
import re
import sys
import time

import requests

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
BASE = "https://www.metro9.co.kr"


def main():
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    s = requests.Session()
    s.headers["User-Agent"] = UA
    view = BASE + "/prog/subwayInfo/kor/sub01_01/view.do"
    page = s.get(view, timeout=60).text
    nos = []
    for m in re.finditer(r'data-sbwy-no="(\d+)"[^>]*>(.*?)</li>', page, re.S):
        if m.group(1) not in [n for n, _ in nos]:
            nos.append((m.group(1), " ".join(re.sub(r"<[^>]+>", " ", m.group(2)).split())))
    if not nos:
        nos = [(n, "") for n in dict.fromkeys(re.findall(r'data-sbwy-no="(\d+)"', page))]
    index = []
    for no, label in nos:
        time.sleep(0.5)
        r = s.post(BASE + "/prog/subwayInfo/kor/sub01_01/infoAjax.do", data={"sbwyNo": no, "tabSe": "1"},
                   headers={"Referer": view}, timeout=60)
        h = r.text
        imgs = re.findall(r'<img src="(/thumbnail/subwayInfo/[^"]+)" alt="([^"]*)"', h)
        text = " ".join(re.sub(r"<[^>]+>", " ", html.unescape(h)).split())
        m = re.search(r"역사구조\s+(.{0,300}?)(?:주요시설|출구|$)", text)
        ent = {"sbwyNo": no, "label": label, "structure": m.group(1) if m else "", "images": []}
        for src, alt in imgs:
            fn = f"{no}_" + src.rsplit("/", 1)[-1]
            ir = s.get(BASE + src, headers={"Referer": view}, timeout=60)
            with open(os.path.join(out, fn), "wb") as f:
                f.write(ir.content)
            ent["images"].append({"file": fn, "src": src, "bytes": len(ir.content), "alt": html.unescape(alt)})
        index.append(ent)
        print(no, label, len(imgs), flush=True)
    with open(os.path.join(out, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
