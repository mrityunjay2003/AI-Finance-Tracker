import os
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

CATEGORIES = ["Food & Dining", "Shopping", "Transport", "Bills & Utilities", "Entertainment", "Health & Fitness", "Travel", "Income", "Transfer", "Other"]

async def categorize_transactions(transactions: list[dict]) -> list[dict]:
    batch_size = 50
    for i in range(0, len(transactions), batch_size):
        batch = transactions[i:i+batch_size]
        simplified_batch = [{"id": t["id"], "desc": t["description"], "amt": t["amount"]} for t in batch]
        
        prompt = f"""You are a financial analyst. Categorize the following transactions into exactly one of these categories: {', '.join(CATEGORIES)}.
        Respond strictly in JSON format with a single key "categories" mapped to an array of objects containing "id" and "category".
        Transactions: {json.dumps(simplified_batch)}"""

        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        category_map = {item["id"]: item["category"] for item in result.get("categories", [])}
        
        for t in batch:
            t["category"] = category_map.get(t["id"], "Other")
            
    return transactions

async def generate_insights(analysis_data: dict) -> list[str]:
    prompt = f"""You are an expert AI financial advisor. Review the user's financial summary and provide 4 to 6 specific, actionable, bullet-point insights. 
    Use the exact numbers provided.
    Data: {json.dumps(analysis_data)}
    Respond strictly in JSON format with a single key "insights" containing an array of strings."""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": prompt}],
        response_format={"type": "json_object"}
    )
    result = json.loads(response.choices[0].message.content)
    return result.get("insights", ["Keep track of your spending to improve your financial health."])

async def stream_chat(messages: list, transaction_context: str):
    system_prompt = f"""You are a helpful, expert AI financial advisor. You have access to the user's current transaction data context.
    Keep answers concise, friendly, and analytical. Format with clean spacing.
    Context Data: {transaction_context}"""
    
    api_messages = [{"role": "system", "content": system_prompt}]
    api_messages.extend([{"role": m.role, "content": m.content} for m in messages])

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=api_messages,
        stream=True
    )
    
    async for chunk in response:
        if chunk.choices[0].delta.content:
            yield f"data: {chunk.choices[0].delta.content}\n\n"
