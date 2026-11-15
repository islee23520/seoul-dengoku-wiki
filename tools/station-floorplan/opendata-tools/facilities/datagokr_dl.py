"""Download the current file of data.go.kr fileData datasets.

usage: python -I -X utf8 datagokr_dl.py <outdir> <publicDataPk> ...
Saves raw to <outdir>/raw/DG-<pk>/ and UTF-8 CSV to <outdir>/utf8/DG-<pk>/, prints JSON summary.
"""
import json
import os
import re
import sys
import time

import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from seoul_dl import safe, to_utf8, xlsx_to_csv  # noqa: E402

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"


def main():
    out = sys.argv[1]
    s = requests.Session()
    s.headers["User-Agent"] = UA
    res = []
    for pk in sys.argv[2:]:
        url = f"https://www.data.go.kr/data/{pk}/fileData.do"
        page = s.get(url, timeout=60).text
        calls = re.findall(r"fn_fileDataDown\('(\d+)',\s*'([^']+)',\s*'([^']*)',\s*'(\d+)'", page)
        seen, ent = set(), {"pk": pk, "url": url, "files": []}
        rawdir = os.path.join(out, "raw", f"DG-{pk}")
        u8dir = os.path.join(out, "utf8", f"DG-{pk}")
        os.makedirs(rawdir, exist_ok=True)
        os.makedirs(u8dir, exist_ok=True)
        for _pk, uddi, _x, sn in calls:
            if (uddi, sn) in seen:
                continue
            seen.add((uddi, sn))
            meta = s.get(
                "https://www.data.go.kr/tcs/dss/selectFileDataDownload.do",
                params={"recommendDataYn": "Y", "publicDataPk": pk, "publicDataDetailPk": uddi, "fileDetailSn": sn},
                headers={"Referer": url}, timeout=60).json()
            info = meta.get("dataSetFileDetailInfo") or {}
            reg = meta.get("fileDataRegistVO") or {}
            ent.update({"title": info.get("publicDataSj"), "dataNm": info.get("dataNm"), "updtDt": info.get("updtDt"),
                        "stdrDe": info.get("stdrDe"), "insttNm": info.get("insttNm"),
                        "desc": re.sub(r"<br/?>", " ", info.get("publicDataDc") or "")[:600]})
            fid = meta.get("atchFileId") or reg.get("atchFileId")
            fname = reg.get("orginlFileNm") or f"{pk}_{sn}"
            if not fid:
                ent["files"].append({"file": fname, "error": "no atchFileId (API-only or login-limited)"})
                continue
            time.sleep(1)
            r = s.get("https://www.data.go.kr/cmm/cmm/fileDownload.do",
                      params={"atchFileId": fid, "fileDetailSn": meta.get("fileDetailSn", sn), "dataNm": info.get("dataNm", "")},
                      headers={"Referer": url}, timeout=600)
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
                    with open(os.path.join(u8dir, safe(re.sub(r"\.xlsx$", ".csv", fname))), "w", encoding="utf-8", newline="") as f:
                        f.write(txt)
                    lines = txt.splitlines()
                    fe["rows"] = len(lines) - 1
                    fe["head"] = lines[:4]
            except Exception as e:  # noqa: BLE001
                fe["convert_error"] = repr(e)
            ent["files"].append(fe)
        if not calls:
            ent["error"] = "no fn_fileDataDown on page"
        res.append(ent)
    print(json.dumps(res, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
