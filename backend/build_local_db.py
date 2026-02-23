import json
import time
import os
from data_loader import load_legal_texts
from embedding_service import get_embeddings_batch

def main():
    db_path = os.path.join(os.path.dirname(__file__), "local_db.json")
    if os.path.exists(db_path):
        print(f"✅ local_db.json already exists with size {os.path.getsize(db_path)} bytes.")
        return

    print("📚 Loading legal texts...")
    chunks = load_legal_texts()
    
    # Process in smaller chunks to avoid rate limit
    batch_size = 50
    all_data = []

    print(f"🔢 Generating embeddings for {len(chunks)} chunks...")
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        texts_to_embed = [f"{c.domain} — {c.reference}: {c.content}" for c in batch]
        
        try:
            embeddings = get_embeddings_batch(texts_to_embed, batch_size=batch_size)
            for j, chunk in enumerate(batch):
                all_data.append({
                    "id": i + j + 1,
                    "domain": chunk.domain,
                    "reference": chunk.reference,
                    "content": chunk.content,
                    "embedding": embeddings[j]
                })
            time.sleep(1) # Sleep to avoid rate limit
        except Exception as e:
            print(f"Error on batch {i}: {e}")
            break

    # Save to JSON
    with open(db_path, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False)
        
    print(f"✅ Saved {len(all_data)} records to local_db.json")

if __name__ == "__main__":
    main()
