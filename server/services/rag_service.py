import os
import numpy as np
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def build_vector_index(transactions: list[dict]) -> dict:
    if not transactions:
        return {"embeddings": np.array([]), "texts": []}

    texts = [f"{t['date']} | {t['description']} | {t['category']} | ₹{t['amount']}" for t in transactions]
    
    # Generate embeddings in one batch
    response = await client.embeddings.create(
        input=texts,
        model="text-embedding-3-small"
    )
    
    embeddings = [item.embedding for item in response.data]
    return {
        "embeddings": np.array(embeddings),
        "texts": texts,
        "transactions": transactions
    }

async def semantic_search(query: str, index: dict, top_k: int = 5) -> list[dict]:
    if len(index.get("texts", [])) == 0:
        return []

    # Embed the user query
    response = await client.embeddings.create(
        input=query,
        model="text-embedding-3-small"
    )
    query_embedding = np.array(response.data[0].embedding)

    # Compute cosine similarity (dot product since OpenAI embeddings are normalized)
    similarities = np.dot(index["embeddings"], query_embedding)
    
    # Get top K indices
    top_indices = np.argsort(similarities)[::-1][:top_k]
    
    results = []
    for idx in top_indices:
        results.append(index["transactions"][idx])
        
    return results