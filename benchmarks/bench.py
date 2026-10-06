"""Benchmark DocuMind's PDF ingest path (extract -> chunk), no embeddings/API calls.

Variants:
  baseline   - what backend/app/utils/document_loader.py does today:
               pymupdf4llm.to_markdown(whole file) then SentenceSplitter(1024, 200)
  parallel   - same per-page extraction, pages split across N worker processes
  (more variants are added one at a time and measured separately)

Usage: python bench.py <variant> <pdf> [--workers N]
Prints one JSON line: wall seconds, pages/sec, peak RSS (MB, parent+children), chars, chunks.
"""
import argparse, json, os, resource, sys, time
import fitz


def extract_baseline(path):
    import pymupdf4llm
    return pymupdf4llm.to_markdown(path)


def _extract_range(args):
    path, pages = args
    import pymupdf4llm
    return pymupdf4llm.to_markdown(path, pages=pages)


def extract_parallel(path, workers):
    from multiprocessing import Pool
    n = len(fitz.open(path))
    size = max(1, (n + workers * 4 - 1) // (workers * 4))
    ranges = [list(range(i, min(i + size, n))) for i in range(0, n, size)]
    with Pool(workers) as pool:
        parts = pool.map(_extract_range, [(path, r) for r in ranges])
    return "".join(parts)


def chunk(text):
    from llama_index.core import Document
    from llama_index.core.node_parser import SentenceSplitter
    sp = SentenceSplitter(chunk_size=1024, chunk_overlap=200)
    return sp.get_nodes_from_documents([Document(text=text)])


def peak_mb():
    s = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    c = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss
    return round((s + c) / 1024, 1), round(s / 1024, 1), round(c / 1024, 1)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("variant")
    ap.add_argument("pdf")
    ap.add_argument("--workers", type=int, default=os.cpu_count())
    ap.add_argument("--out")
    a = ap.parse_args()
    pages = len(fitz.open(a.pdf))
    t0 = time.perf_counter()
    text = extract_baseline(a.pdf) if a.variant == "baseline" else extract_parallel(a.pdf, a.workers)
    t1 = time.perf_counter()
    nodes = chunk(text)
    t2 = time.perf_counter()
    tot, own, kids = peak_mb()
    rec = ({
        "variant": a.variant, "pdf": os.path.basename(a.pdf), "pages": pages,
        "workers": a.workers if a.variant != "baseline" else 1,
        "extract_s": round(t1 - t0, 2), "chunk_s": round(t2 - t1, 2),
        "total_s": round(t2 - t0, 2), "pages_per_s": round(pages / (t2 - t0), 2),
        "peak_rss_mb_sum": tot, "peak_rss_mb_main": own, "peak_rss_mb_children_max": kids,
        "chars": len(text), "chunks": len(nodes),
    })
    print(json.dumps(rec))
    if a.out:
        with open(a.out, "a") as f:
            f.write(json.dumps(rec) + "\n")
