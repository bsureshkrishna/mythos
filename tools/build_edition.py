"""Build the selected edition offline. Missing or invalid content fails the build."""
import argparse
import copy
import json
import unicodedata
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'
UMBRELLAS = {'indian', 'celtic', 'slavic', 'polynesian', 'west-african', 'north-american'}


def load(path):
    return json.loads(path.read_text(encoding='utf-8'))


def require(condition, message):
    if not condition:
        raise ValueError(message)


def fold(text):
    return ''.join(c for c in unicodedata.normalize('NFD', text) if not unicodedata.combining(c)).lower()


def valid_url(url):
    parsed = urlparse(url)
    return parsed.scheme == 'https' and bool(parsed.netloc)


def build():
    edition = load(DATA / 'edition.json')
    outline = {c['id']: c for c in load(DATA / 'outline.json')}
    all_cultures = load(DATA / 'cultures.json')
    culture_ids = {c['id'] for c in all_cultures}
    motifs = load(DATA / 'motifs.json')
    source_links = load(DATA / 'sources.json')
    drafts = {}
    for path in sorted((DATA / 'content').glob('*.json')):
        for draft in load(path)['concepts']:
            require(draft['id'] not in drafts, f"Duplicate draft: {draft['id']}")
            drafts[draft['id']] = draft
    for link in source_links:
        require(valid_url(link['url']), f'Invalid reading link: {link}')
    concepts, seen = [], set()
    for number, selection in enumerate(edition['concepts'], 1):
        cid = selection['id']
        require(cid not in seen, f'Duplicate selection: {cid}')
        seen.add(cid)
        require(cid in outline and cid in drafts, f'Missing concept: {cid}')
        draft = drafts[cid]
        indexes = selection.get('versions', list(range(len(draft['versions']))))
        require(len(set(indexes)) == len(indexes), f'Duplicate version selection: {cid}')
        require(2 <= len(indexes) <= 8, f'{cid}: expected 2–8 tellings')
        versions = []
        for index in indexes:
            require(isinstance(index, int) and 0 <= index < len(draft['versions']), f'{cid}: invalid version {index}')
            version = copy.deepcopy(draft['versions'][index])
            where = f"{cid}/{version.get('culture')}/{index}"
            require(version.get('culture') in culture_ids, f'{where}: unknown culture')
            for key in ('title', 'teaser', 'text'):
                require(isinstance(version.get(key), str) and version[key].strip(), f'{where}: missing {key}')
            require(60 <= len(version['text'].split()) <= 210, f'{where}: retelling outside 60–210 words')
            require(isinstance(version.get('sources'), list) and version['sources'], f'{where}: missing sources')
            require(all(isinstance(s, str) and s.strip() for s in version['sources']), f'{where}: invalid citation')
            require(version['culture'] not in UMBRELLAS or version.get('people'), f'{where}: name the specific tradition')
            version.pop('image', None)
            version['names'] = version.get('names', [])
            reading = []
            for citation in version['sources']:
                for link in source_links:
                    if any(fold(term) in fold(citation) for term in link['match']):
                        if not any(x['url'] == link['url'] for x in reading):
                            reading.append({k: link[k] for k in ('title', 'url')})
                        break
            require(reading, f'{where}: needs an online reading source')
            version['reading'] = reading[:2]
            versions.append(version)
        references = []
        for key in selection['motifs']:
            require(key in motifs, f'{cid}: missing motif reference {key}')
            require(valid_url(motifs[key]['url']), f'{cid}: invalid motif URL')
            references.append(motifs[key])
        require(references, f'{cid}: missing motif references')
        require(20 <= len(selection['summary'].split()) <= 100, f'{cid}: summary length')
        concepts.append({**outline[cid], 'n': number, 'summary': selection['summary'], 'motifs': references, 'versions': versions})
    require(len(concepts) == 51, 'First edition must contain Flood + 50 more ideas')
    require(concepts[0]['id'] == 'great-flood', 'Flood must be first')
    used = {v['culture'] for c in concepts for v in c['versions']}
    return {
        'title': 'Mythos', 'subtitle': edition['description'], 'edition': edition['title'],
        'catalogueNote': 'Motif references are comparison pointers. A code may apply to only some tellings, and does not establish a shared origin.',
        'cultures': [c for c in all_cultures if c['id'] in used], 'concepts': concepts,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    data = build()
    serialized = json.dumps(data, ensure_ascii=False, indent=2) + '\n'
    outputs = {ROOT / 'myths.json': serialized, ROOT / 'myths.js': 'window.MYTHOS = ' + serialized.rstrip() + ';\n'}
    for path, content in outputs.items():
        if args.check:
            require(path.exists() and path.read_text(encoding='utf-8') == content, f'Stale generated file: {path.name}; run tools/build.py')
        else:
            path.write_text(content, encoding='utf-8', newline='\n')
    count = sum(len(c['versions']) for c in data['concepts'])
    print(f"{'Validated' if args.check else 'Built'} {len(data['concepts'])} ideas, {count} tellings, {len(data['cultures'])} culture collections; Flood is No. 1.")


if __name__ == '__main__':
    main()
