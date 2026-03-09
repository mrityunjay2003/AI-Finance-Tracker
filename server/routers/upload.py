import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from models import UploadResponse, SESSION_STORE
from services.parser import parse_csv

router = APIRouter()

@router.post("/upload", response_model=UploadResponse)
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
    
    content = await file.read()
    try:
        transactions = parse_csv(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")
        
    session_id = str(uuid.uuid4())
    SESSION_STORE[session_id] = transactions
    
    return UploadResponse(
        session_id=session_id,
        transaction_count=len(transactions),
        preview=transactions[:5]
    )
