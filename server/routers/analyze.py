from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models import AnalysisResult, SESSION_STORE
from services.gpt_service import categorize_transactions, generate_insights, generate_budget_warnings
from services.anomaly import detect_anomalies
from typing import Dict
import pandas as pd
from services.subscription_service import detect_subscriptions
from services.rag_service import build_vector_index, semantic_search

router = APIRouter()

class AnalyzeRequest(BaseModel):
    session_id: str

class BudgetRequest(BaseModel):
    session_id: str
    budgets: Dict[str, float]

@router.post("/analyze", response_model=AnalysisResult)
async def analyze_data(req: AnalyzeRequest):
    if req.session_id not in SESSION_STORE:
        raise HTTPException(status_code=404, detail="Session not found.")			
            
    transactions = SESSION_STORE[req.session_id]
    
    transactions = await categorize_transactions(transactions)
    
    transactions = detect_anomalies(transactions)
    
    df = pd.DataFrame(transactions)
    
    expenses = df[df['amount'] < 0]
    category_totals = (
        expenses.groupby('category')['amount'].sum().abs().to_dict()
        if not expenses.empty else {}
    )
    
    # Safe date handling
    if not df.empty:
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df['month'] = df['date'].dt.strftime('%Y-%m')
        monthly_totals = df.groupby('month')['amount'].sum().to_dict()
    else:
        monthly_totals = {}
    
    subscriptions = detect_subscriptions(transactions)
    
    # Safer anomaly check
    anomalies = [t for t in transactions if t.get('is_anomaly') is True]
    
    summary_data = {
        "category_totals": category_totals,
        "monthly_net": monthly_totals,
        "anomaly_count": len(anomalies)
    }
    
    insights = await generate_insights(summary_data)
    vector_index = await build_vector_index(transactions)
    SESSION_STORE[f"{req.session_id}_rag"] = vector_index
    
    result = AnalysisResult(
        session_id=req.session_id,
        transactions=transactions,
        category_totals=category_totals,
        monthly_totals=monthly_totals,
        insights=insights,
        anomalies=anomalies,
        subscriptions=subscriptions
    )
    
    SESSION_STORE[req.session_id] = result.model_dump()
    return result

@router.post("/budget-insight")
async def get_budget_insight(req: BudgetRequest):
    if req.session_id not in SESSION_STORE:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    data = SESSION_STORE[req.session_id]
    category_totals = data.get("category_totals", {})
    
    budget_status = {}
    summary_lines = []
    
    for category, limit in req.budgets.items():
        if limit <= 0:
            continue
            
        spent = category_totals.get(category, 0.0)
        percent = (spent / limit) * 100 if limit > 0 else 0
        
        if percent >= 100:
            status = "danger"
        elif percent >= 80:
            status = "warning"
        else:
            status = "safe"
            
        budget_status[category] = {
            "budget": limit,
            "spent": spent,
            "percent": percent,
            "status": status
        }
        
        summary_lines.append(
            f"{category}: spent ₹{spent:.2f} of ₹{limit:.2f} budget ({percent:.1f}%)"
        )
        
    summary_str = "\n".join(summary_lines)
    
    warnings = []
    if summary_str:
        warnings = await generate_budget_warnings(summary_str)
        
    return {
        "budget_status": budget_status,
        "warnings": warnings
    }

class SearchRequest(BaseModel):
    session_id: str
    query: str

@router.post("/search")
async def search_transactions(req: SearchRequest):
    rag_key = f"{req.session_id}_rag"
    if rag_key not in SESSION_STORE:
        return {"results": []}
    results = await semantic_search(req.query, SESSION_STORE[rag_key])
    return {"results": results}