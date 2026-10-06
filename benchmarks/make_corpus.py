"""Build synthetic benchmark PDFs by repeating a few public arXiv papers.

Usage: python make_corpus.py 1000 10000
Downloads the source papers once into ./corpus/src and writes
./corpus/pages_<N>.pdf. Nothing from the corpus is committed to git.
"""
import sys, pathlib, urllib.request
import fitz

SOURCES = ["1706.03762", "2005.11401", "1810.04805", "2005.14165"]
root = pathlib.Path(__file__).parent / "corpus"
(root / "src").mkdir(parents=True, exist_ok=True)

srcs = []
for sid in SOURCES:
    p = root / "src" / f"{sid}.pdf"
    if not p.exists():
        urllib.request.urlretrieve(f"https://arxiv.org/pdf/{sid}", p)
    srcs.append(fitz.open(p))

for n in map(int, sys.argv[1:]):
    out = fitz.open()
    i = 0
    while len(out) < n:
        s = srcs[i % len(srcs)]
        take = min(len(s), n - len(out))
        out.insert_pdf(s, from_page=0, to_page=take - 1)
        i += 1
    path = root / f"pages_{n}.pdf"
    out.save(path, garbage=3, deflate=True)
    print(path, len(out), "pages", path.stat().st_size // 1024, "KB")
