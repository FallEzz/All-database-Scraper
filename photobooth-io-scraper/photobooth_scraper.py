"""
Photobooth-io Scraper (Python)
Author: FallEzz (FallZx Infinity)
Source: https://photobooth-io.cc
"""

import os
import re
import json
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "https://photobooth-io.cc"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def fetch_text(endpoint: str) -> str:
    url = endpoint if endpoint.startswith("http") else urllib.parse.urljoin(BASE_URL, endpoint)
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode("utf-8", errors="ignore")

def download_file(endpoint: str, dest_path: str):
    url = endpoint if endpoint.startswith("http") else urllib.parse.urljoin(BASE_URL, endpoint)
    req = urllib.request.Request(url, headers=HEADERS)
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    with urllib.request.urlopen(req, timeout=15) as resp, open(dest_path, "wb") as f:
        f.write(resp.read())

def scrape_metadata():
    index_html = fetch_text("/index.html")
    about_html = fetch_text("/about.html")

    title_match = re.search(r"<title>(.*?)</title>", index_html, re.I)
    title = title_match.group(1).strip() if title_match else ""

    desc_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', index_html, re.I)
    description = desc_match.group(1).strip() if desc_match else ""

    faq_matches = re.findall(r'<h[34][^>]*>(.*?)</h[34]>\s*<p[^>]*>(.*?)</p>', about_html, re.DOTALL)
    faqs = []
    for q, a in faq_matches:
        q_c = re.sub(r'<[^>]+>', '', q).strip()
        a_c = re.sub(r'<[^>]+>', '', a).strip()
        if len(q_c) > 5 and len(a_c) > 5:
            faqs.append({"question": q_c, "answer": a_c})

    return {"title": title, "description": description, "faqs": faqs}

def scrape_layout_catalog():
    js_raw = fetch_text("/js/layout-catalog.js")
    matches = re.findall(r'key:\s*["\']([^"\']+)["\'],\s*name:\s*["\']([^"\']+)["\'],\s*thumbnail:\s*["\']([^"\']+)["\'],\s*capturePage:\s*["\']([^"\']+)["\'],\s*customizePage:\s*["\']([^"\']+)["\'],\s*photoCount:\s*(\d+)', js_raw)
    catalog = []
    for key, name, thumb, cap, cust, count in matches:
        catalog.append({
            "key": key,
            "name": name,
            "thumbnail": thumb,
            "thumbnailUrl": urllib.parse.urljoin(BASE_URL, thumb),
            "capturePage": cap,
            "customizePage": cust,
            "photoCount": int(count)
        })
    return catalog

def scrape_stickers_list():
    html = fetch_text("/customize.html")
    stickers = set(re.findall(r'assets/drag-drop-stickers/([a-zA-Z0-9_\-\.]+\.png)', html))
    return sorted(list(stickers))

def main():
    print("[*] Mengambil data photobooth-io...")
    metadata = scrape_metadata()
    catalog = scrape_layout_catalog()
    stickers = scrape_stickers_list()

    output_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(output_dir, exist_ok=True)

    with open(os.path.join(output_dir, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    with open(os.path.join(output_dir, "layout_catalog.json"), "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)
    with open(os.path.join(output_dir, "stickers_list.json"), "w", encoding="utf-8") as f:
        json.dump(stickers, f, indent=2, ensure_ascii=False)

    print(f"[+] Berhasil! Tersimpan: {len(catalog)} template dan {len(stickers)} stiker ke folder 'data'.")

if __name__ == "__main__":
    main()
