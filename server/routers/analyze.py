from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models import AnalysisResult, SESSION_STORE
from services.gpt_service import categorize_transactions, generate_insights
from services.anomaly import detect_anomalies
import pandas as pd

router = APIRouter()

class AnalyzeRequest(BaseModel):
    session_id: str

@router.post("/analyze", response_model=AnalysisResult)
async def analyze_data(req: AnalyzeRequest):
    if req.session_id not in SESSION_STORE:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    transactions = SESSION_STORE[req.session_id]
    
    # 1. Categorize
    transactions = await categorize_transactions(transactions)
    
    # 2. Detect Anomalies
    transactions = detect_anomalies(transactions)
    
    # 3. Calculate Totals
    df = pd.DataFrame(transactions)
    
    # Category totals (expenses only)
    expenses = df[df['amount'] < 0]
    category_totals = expenses.groupby('category')['amount'].sum().abs().to_dict() if not expenses.empty else {}
    
    # Monthly totals (net)
    df['month'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m')
    monthly_totals = df.groupby('month')['amount'].sum().to_dict()
    
    anomalies = [t for t in transactions if t.get('is_anomaly')]
    
    summary_data = {
        "category_totals": category_totals,
        "monthly_net": monthly_totals,
        "anomaly_count": len(anomalies)
    }
    
    # 4. Generate Insights
    insights = await generate_insights(summary_data)
    
    result = AnalysisResult(
        session_id=req.session_id,
        transactions=transactions,
        category_totals=category_totals,
        monthly_totals=monthly_totals,
        insights=insights,
        anomalies=anomalies
    )
    
    # Update store with analyzed data
    SESSION_STORE[req.session_id] = result.model_dump()
    return result
