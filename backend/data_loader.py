"""
Data loader — recursively reads JSON legal texts from the Data/ directory.

Each JSON file contains an array of objects:
    {"reference": "الفصل X", "contenu": "...النص القانوني"}
"""
import os
import json
from dataclasses import dataclass
from typing import List

from config import DATA_PATH


@dataclass
class LegalChunk:
    domain: str
    reference: str
    content: str


def load_legal_texts(data_path: str | None = None) -> List[LegalChunk]:
    """
    Walk the data directory and yield LegalChunk objects.
    The domain is derived from the immediate subfolder name.
    """
    base_path = data_path or DATA_PATH
    chunks: List[LegalChunk] = []

    if not os.path.isdir(base_path):
        raise FileNotFoundError(f"Data directory not found: {base_path}")

    for root, _dirs, files in os.walk(base_path):
        for filename in files:
            if not filename.endswith(".json"):
                continue

            filepath = os.path.join(root, filename)
            # Domain = first-level subfolder relative to base_path
            relative = os.path.relpath(root, base_path)
            domain = relative.split(os.sep)[0] if relative != "." else os.path.splitext(filename)[0]

            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except (json.JSONDecodeError, UnicodeDecodeError) as exc:
                print(f"⚠ Skipping {filepath}: {exc}")
                continue

            # Handle both array and single-object formats
            if isinstance(data, list):
                entries = data
            elif isinstance(data, dict):
                entries = [data]
            else:
                print(f"⚠ Unexpected structure in {filepath}")
                continue

            for entry in entries:
                reference = entry.get("reference", "").strip()
                contenu = entry.get("contenu", "").strip()
                if not contenu:
                    continue

                chunks.append(LegalChunk(
                    domain=domain,
                    reference=reference,
                    content=contenu,
                ))

    print(f"✅ Loaded {len(chunks)} legal text chunks from {base_path}")
    return chunks


if __name__ == "__main__":
    texts = load_legal_texts()
    # Show summary by domain
    from collections import Counter
    domain_counts = Counter(c.domain for c in texts)
    for domain, count in domain_counts.items():
        print(f"  📁 {domain}: {count} articles")
