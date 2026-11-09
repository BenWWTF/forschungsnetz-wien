#!/usr/bin/env python3
"""Geocode build/institutions.json with Nominatim: once by address, once by name.
Writes build/coords.json {id: {lat, lon, by_name: {lat, lon, display} | null, delta_m}}.
The name lookup is only a cross-check of the hand-entered address."""
import json, math, pathlib, time, urllib.parse, urllib.request

HERE = pathlib.Path(__file__).parent
UA = {"User-Agent": "forschungsnetz-wien-build/1.0 (exhibition prototype)"}


def search(q):
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {"q": q, "format": "json", "limit": 1, "countrycodes": "at"})
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        hits = json.load(r)
    time.sleep(1.1)
    return hits[0] if hits else None


def metres(a, b):
    dy = (a[0] - b[0]) * 111_320
    dx = (a[1] - b[1]) * 111_320 * math.cos(math.radians(a[0]))
    return round(math.hypot(dx, dy))


out = {}
for key, inst in json.loads((HERE / "institutions.json").read_text()).items():
    addr = search(inst["addr"])
    name = search(inst["name"] + ", Wien") or search(inst["name"])
    rec = {"lat": None, "lon": None, "by_name": None, "delta_m": None}
    if addr:
        rec["lat"], rec["lon"] = float(addr["lat"]), float(addr["lon"])
    if name:
        rec["by_name"] = {"lat": float(name["lat"]), "lon": float(name["lon"]), "display": name["display_name"]}
    if addr and name:
        rec["delta_m"] = metres((rec["lat"], rec["lon"]), (rec["by_name"]["lat"], rec["by_name"]["lon"]))
    out[key] = rec
    print(f"{key:45s} addr={'ok' if addr else 'MISSING':8s} delta={rec['delta_m']}", flush=True)

(HERE / "coords.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
