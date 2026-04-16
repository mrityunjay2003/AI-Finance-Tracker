from pydantic import BaseModel
from typing import List, Dict, Optional

# In-memory session store
SESSION_STORE = {}

class Transaction(BaseModel):
    id: str
    date: str
    description: str
    amount: float
    category: Optional[str] = "Uncategorized"
    is_anomaly: bool = False
    anomaly_reason: Optional[str] = None

class AnalysisResult(BaseModel):
    session_id: str
    transactions: List[Transaction]
    category_totals: Dict[str, float]
    monthly_totals: Dict[str, float]
    insights: List[str]
    anomalies: List[Transaction]
    subscriptions: Optional[List[Dict]] = []

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    session_id: str
    messages: List[ChatMessage]

class UploadResponse(BaseModel):
    session_id: str
    transaction_count: int
    preview: List[Transaction]
    pii_redacted_count: int = 0