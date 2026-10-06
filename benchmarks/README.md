# Ingest benchmark: PDF extract + chunk

Measures the PDF ingest path used by `backend/app/utils/document_loader.py` and `backend/app/services/rag_service.py`: `pymupdf4llm.to_markdown` then `SentenceSplitter(chunk_size=1024, chunk_overlap=200)`. No embedding or API calls are timed.

## Setup
- Corpus: 4 public arXiv papers repeated into one 1,000-page PDF (`make_corpus.py`; PDFs are not committed).
- Machine: 2 vCPU, about 2 GB RAM cloud sandbox, Python 3.10, PyMuPDF 1.24.14, pymupdf4llm 0.0.17, llama-index-core 0.11.23.
- Each variant run twice, one run at a time. `bench.py` appends raw results to `results_1000.jsonl`.

## Results (1,000 pages)

| Variant | Run | Total s | Pages/s | Peak RSS MB* | Chars | Chunks |
|---|---|---|---|---|---|---|
| baseline (current code) | 1 | 179.2 | 5.58 | 587 | 3,376,544 | 1,176 |
| baseline | 2 | 177.9 | 5.62 | 585 | 3,376,544 | 1,176 |
| parallel, 2 workers | 1 | 102.4 | 9.77 | 687 | 3,376,544 | 1,176 |
| parallel, 2 workers | 2 | 107.9 | 9.27 | 687 | 3,376,544 | 1,176 |

*Parent process peak plus the largest worker peak, from `resource.getrusage`. A rough figure, not a profiler.

Parallel extraction is about 1.7x faster than baseline (5.6 vs 9.3-9.8 pages/s) and produces identical text length and chunk count.

## What this does not show
- Only 1,000 pages were run. The 10,000-page run was not done on this machine.
- Only a 2-core box was tested, so the speedup says nothing about more cores.
- Accuracy was checked only as "same output length and chunk count as baseline", not against hand-labeled ground truth.
- Embedding and vector-store time are not included.
- The papers are born-digital PDFs; scanned documents would behave very differently.

## Reproduce
```
pip install pymupdf4llm==0.0.17 PyMuPDF==1.24.14 llama-index-core==0.11.23
python make_corpus.py 1000
python bench.py baseline corpus/pages_1000.pdf --out results_1000.jsonl
python bench.py parallel corpus/pages_1000.pdf --workers 2 --out results_1000.jsonl
```
