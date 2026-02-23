"""
Ingestion script — one-time process to populate Azure SQL with embeddings.

Usage:
    python ingest.py

This will:
1. Load all legal JSON texts from the Data/ directory
2. Generate embeddings via Azure OpenAI
3. Create the LegalTexts table (if not exists)
4. Insert all chunks with their embeddings
"""
import time
from data_loader import load_legal_texts
from embedding_service import get_embeddings_batch
from vector_store import create_table, clear_table, insert_chunks_batch, get_table_count


def main():
    print("=" * 60)
    print("🏛️  INGESTION — Chatbot Juridique Marocain")
    print("=" * 60)

    # 1. Load legal texts
    print("\n📚 Loading legal texts...")
    chunks = load_legal_texts()

    if not chunks:
        print("❌ No legal texts found. Check your Data/ directory.")
        return

    # 2. Generate embeddings
    print(f"\n🔢 Generating embeddings for {len(chunks)} chunks...")
    texts_to_embed = [
        f"{chunk.domain} — {chunk.reference}: {chunk.content}"
        for chunk in chunks
    ]

    start_time = time.time()
    embeddings = get_embeddings_batch(texts_to_embed, batch_size=50)
    elapsed = time.time() - start_time
    print(f"  ⏱️  Embedding took {elapsed:.1f}s")

    # 3. Create table
    print("\n🗄️  Preparing Azure SQL table...")
    create_table()

    # 4. Clear existing data (fresh ingestion)
    existing = get_table_count()
    if existing > 0:
        print(f"  ⚠️  Found {existing} existing rows — clearing...")
        clear_table()

    # 5. Insert in batches
    print(f"\n📥 Inserting {len(chunks)} chunks into Azure SQL...")
    batch_size = 100
    for i in range(0, len(chunks), batch_size):
        batch_chunks = [
            {"domain": c.domain, "reference": c.reference, "content": c.content}
            for c in chunks[i : i + batch_size]
        ]
        batch_embeddings = embeddings[i : i + batch_size]
        insert_chunks_batch(batch_chunks, batch_embeddings)
        print(f"  💾 Inserted {min(i + batch_size, len(chunks))}/{len(chunks)}")

    # 6. Final summary
    final_count = get_table_count()
    print("\n" + "=" * 60)
    print(f"✅ INGESTION COMPLETE")
    print(f"   Total documents in database: {final_count}")
    print("=" * 60)


if __name__ == "__main__":
    main()
