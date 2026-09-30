"""Check the edition's public reading URLs; write a report for editorial review."""
import concurrent.futures
import json
import re
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT / 'myths.json').read_text(encoding='utf-8'))
urls = {s['url'].split('#')[0] for c in data['concepts'] for v in c['versions'] for s in v['reading']}
urls.update(m['url'].split('#')[0] for c in data['concepts'] for m in c['motifs'])


def check(url):
    try:
        request = urllib.request.Request(url, headers={'User-Agent': 'MythosNotebook/1.0 (reading-link check)'})
        with urllib.request.urlopen(request, timeout=20) as response:
            body = response.read(200000).decode('utf-8', errors='replace')
            title = re.search(r'<title[^>]*>(.*?)</title>', body, re.I | re.S)
            return {'url': url, 'status': response.status, 'final': response.url, 'title': re.sub(r'\s+', ' ', title[1]).strip() if title else ''}
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        return {'url': url, 'status': getattr(error, 'code', None), 'error': str(error)}


with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    results = list(pool.map(check, sorted(urls)))
(ROOT / 'tools/link-report.json').write_text(json.dumps(results, indent=2) + '\n', encoding='utf-8')
failures = [r for r in results if r['status'] != 200]
print(f'{len(results) - len(failures)}/{len(results)} links returned HTTP 200; {len(failures)} need review.')
for result in failures:
    print(result['status'], result['url'])
