from fastapi import APIRouter, UploadFile, File, HTTPException
from services.pdf_service import pdf_to_csv_bytes # NEW IMPORT
from services.parser import parse_csv
from services.redaction_service import redact_transactions
import uuid
from models import UploadResponse, SESSION_STORE

router = APIRouter()

@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename.lower()
    content = await file.read()
    
    # 1. Handle PDF to CSV conversion if necessary
    if filename.endswith('.pdf'):
        try:
            content = pdf_to_csv_bytes(content)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to process PDF: {str(e)}")
    elif not filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV or PDF files are allowed.")
    
    # 2. Existing parsing logic
    try:
        raw_transactions = parse_csv(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Parsing error: {str(e)}")
        
    # 3. Privacy & Redaction Layer
    clean_transactions, pii_count = redact_transactions(raw_transactions)
        
    session_id = str(uuid.uuid4())
    SESSION_STORE[session_id] = clean_transactions
    
    return UploadResponse(
        session_id=session_id,
        transaction_count=len(clean_transactions),
        preview=clean_transactions[:5],
        pii_redacted_count=pii_count
    )