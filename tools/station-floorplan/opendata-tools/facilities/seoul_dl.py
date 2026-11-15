"""Download all files of a data.seoul.go.kr file dataset.

usage: python -I seoul_dl.py <outdir> OA-xxxxx[/F] ...
Saves raw files to <outdir>/raw/<OA>/ and UTF-8 copies to <outdir>/utf8/<OA>/,
prints a JSON summary (title, update date, files).
"""
import html
import json
import os
import re
import sys
import time

import requests

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
DL = "https://datafile.seoul.go.kr/bigfile/iot/inf/nio_download.do?&useCache=false"


def to_utf8(data: bytes) -> str:
    for enc in ("utf-8-sig", "cp949"):
        try:
            return data.decode(enc)
        except UnicodeDecodeError:
            pass
    return data.decode("cp949", errors="replace")


def xlsx_to_csv(path: str) -> str:
    import csv
    import io
    import openpyxl

    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    buf = io.StringIO()
    w = csv.writer(buf)
    for ws in wb.worksheets:
        if len(wb.worksheets) > 1:
            w.writerow([f"## sheet: {ws.title}"])
        for row in ws.iter_rows(values_only=True):
            w.writerow(["" if v is None else v for v in row])
    return buf.getvalue()


def safe(name: str) -> str:
    return re.sub(r'[\\/:*?"<>|]', "_", name)


def main():
    out = sys.argv[1]
    s = requests.Session()
    s.headers["User-Agent"] = UA
    summary = []
    for arg in sys.argv[2:]:
        oa, _, kind = arg.partition("/")
        kind = kind or "F"
        url = f"https://data.seoul.go.kr/dataList/{oa}/{kind}/1/datasetView.do"
        page = s.get(url, timeout=60).text
        title = re.search(r'<meta name="title" content="([^"]*)"', page)
        title = html.unescape(title.group(1)).strip() if title else ""
        m = re.search(r'name="frmFile".*?name="infSeq" value="([^"]*)"', page, re.S)
        infseq = m.group(1) if m else "1"
        files = []
        seen = set()
        for m in re.finditer(r"title=\"([^\"]+)\" onclick=\"javascript:downloadFile\('(\d+)'\)", page):
            fname, seq = html.unescape(m.group(1)), m.group(2)
            if seq in seen:
                continue
            seen.add(seq)
            files.append((seq, fname))
        upd = re.findall(r"데이터 갱신일</th>\s*<td><span class=\"en\">([^<]*)<", page)
        rawdir = os.path.join(out, "raw", oa)
        u8dir = os.path.join(out, "utf8", oa)
        os.makedirs(rawdir, exist_ok=True)
        os.makedirs(u8dir, exist_ok=True)
        with open(os.path.join(rawdir, "_page.html"), "w", encoding="utf-8") as f:
            f.write(page)
        got = []
        if kind == "S":
            m = re.search(r'name="infNm" value="([^"]*)"', page)
            nm = html.unescape(m.group(1)) if m else oa
            r = s.post(
                "https://datafile.seoul.go.kr/bigfile/iot/sheet/csv/download.do",
                data={"srvType": "S", "infId": oa, "serviceKind": "1", "pageNo": "1", "gridTotalCnt": "",
                      "ssUserId": "SAMPLE_VIEW", "strWhere": "", "strOrderby": "",
                      "filterCol": "필터선택", "txtFilter": ""},
                headers={"Referer": url}, timeout=600)
            files.insert(0, ("sheet", nm + ".csv", r))
        for item in files:
            time.sleep(1)
            seq, fname = item[0], item[1]
            r = item[2] if len(item) > 2 else s.post(
                DL,
                data={"infId": oa, "seqNo": "", "seq": seq, "infSeq": infseq},
                headers={"Referer": url},
                timeout=300,
            )
            p = os.path.join(rawdir, safe(fname))
            with open(p, "wb") as f:
                f.write(r.content)
            ent = {"seq": seq, "file": fname, "bytes": len(r.content), "status": r.status_code}
            low = fname.lower()
            try:
                if low.endswith(".csv") or low.endswith(".txt"):
                    txt = to_utf8(r.content)
                elif low.endswith(".xlsx"):
                    txt = xlsx_to_csv(p)
                else:
                    txt = None
                if txt is not None:
                    up = os.path.join(u8dir, safe(re.sub(r"\.(xlsx|txt)$", ".csv", fname)))
                    with open(up, "w", encoding="utf-8", newline="") as f:
                        f.write(txt)
                    lines = txt.splitlines()
                    ent["rows"] = max(0, len(lines) - 1)
                    ent["head"] = lines[:4]
            except Exception as e:  # noqa: BLE001
                ent["convert_error"] = repr(e)
            got.append(ent)
        summary.append({"oa": oa, "url": url, "title": title, "dates": upd[:1], "files": got})
    print(json.dumps(summary, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
