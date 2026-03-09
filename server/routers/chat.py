from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from models import ChatRequest, SESSION_STORE
from services.gpt_service import stream_chat
import json

router = APIRouter()

@router.post("/chat")
async def chat_endpoint(req: ChatRequest):
    if req.session_id not in SESSION_STORE:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    data = SESSION_STORE[req.session_id]
    
    # Build a concise context to save tokens
    if isinstance(data, dict) and "category_totals" in data:
        context = {
            "top_categories": data["category_totals"],
            "monthly_trends": data["monthly_totals"],
            "anomaly_count": len(data["anomalies"])
        }
    else:
        # Just raw transactions if not analyzed yet
        context = {"transaction_count": len(data)}
        
    context_str = json.dumps(context)
    
    return StreamingResponse(
        stream_chat(req.messages, context_str), 
        media_type="text/event-stream"
    )
