import urllib.parse, urllib.request, json, time
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
def get(url, data=None, timeout=60):
    req = urllib.request.Request(url, data=data, headers={"User-Agent": UA, "Referer": "https://smap.seoul.go.kr/"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()
def proxy(path, timeout=90):
    return get("https://smap.seoul.go.kr/imageProxy.do?svc=2D&param=" + urllib.parse.quote(path, safe=""), timeout=timeout)
def wfs(typename, bbox=None, maxf=None, cql=None, ver="1.0.0"):
    p = f"/geoserver/wfs?service=WFS&version={ver}&request=GetFeature&outputFormat=application/json&typeName={typename}"
    if maxf: p += f"&maxFeatures={maxf}"
    f = cql
    if bbox and not f:
        f = None
    if cql: p += "&CQL_FILTER=" + cql
    elif bbox: p += "&BBOX=" + ",".join(map(str, bbox)) + ",EPSG:5186"
    return json.loads(proxy(p))
def describe(typename):
    return proxy(f"/geoserver/wfs?service=WFS&version=1.0.0&request=DescribeFeatureType&typeName={typename}").decode("utf-8", "replace")
def naver_local(q):
    return json.loads(get("https://smap.seoul.go.kr/search/searchLocal.do?searchKeyword=" + urllib.parse.quote(q) + "&startIndex=1"))
def juso(q, n=5):
    d = urllib.parse.urlencode({"currentPage": 1, "countPerPage": n, "resultType": "json", "keyword": urllib.parse.quote(q)}).encode()
    return json.loads(get("https://smap.seoul.go.kr/search/getAddrApi.do", d))
def juso_coord(j):
    d = urllib.parse.urlencode({k: j[k] for k in ("admCd", "rnMgtSn", "udrtYn", "buldMnnm", "buldSlno")} | {"resultType": "json"}).encode()
    return json.loads(get("https://smap.seoul.go.kr/search/getAddrCoordApi.do", d))
