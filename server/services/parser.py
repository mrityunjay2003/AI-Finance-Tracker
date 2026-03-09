import pandas as pd
import io
import uuid
from models import Transaction

def parse_csv(file_bytes: bytes) -> list[dict]:
    df = pd.read_csv(io.BytesIO(file_bytes))
    cols = [c.lower() for c in df.columns]
    
    # Normalize columns based on common formats
    if 'debit' in cols and 'credit' in cols:
        df['amount'] = df['credit'].fillna(0) - df['debit'].fillna(0)
    elif 'amount' in cols:
        df['amount'] = pd.to_numeric(df['Amount' if 'Amount' in df.columns else 'amount'], errors='coerce')
    else:
        raise ValueError("Could not detect amount columns. Need 'Amount' or 'Debit'/'Credit'.")

    desc_col = next((c for c in df.columns if c.lower() in ['description', 'name', 'payee', 'memo']), None)
    date_col = next((c for c in df.columns if c.lower() in ['date', 'transaction date', 'posted date']), None)

    if not desc_col or not date_col:
        raise ValueError("Could not detect Date or Description columns.")

    df['date'] = pd.to_datetime(df[date_col], format='mixed', dayfirst=False).dt.strftime('%Y-%m-%d')
    df = df.dropna(subset=['amount'])
    df = df.sort_values('date', ascending=True)

    transactions = []
    for _, row in df.iterrows():
        transactions.append({
            "id": str(uuid.uuid4()),
            "date": row['date'],
            "description": str(row[desc_col]),
            "amount": float(row['amount']),
            "category": "Uncategorized",
            "is_anomaly": False,
            "anomaly_reason": None
        })
    return transactions
