import pandas as pd

def detect_subscriptions(transactions: list[dict]) -> list[dict]:
    df = pd.DataFrame(transactions)
    if df.empty:
        return []

    # Filter only expenses
    expenses = df[df['amount'] < 0].copy()
    expenses['amount_abs'] = expenses['amount'].abs()
    expenses['date'] = pd.to_datetime(expenses['date'])
    
    subscriptions = []
    
    # Group by description and check for frequency
    grouped = expenses.groupby('description')
    for desc, group in grouped:
        if len(group) >= 2:
            # Check if amounts are very similar (within 5% variation)
            std_dev = group['amount_abs'].std()
            mean_amt = group['amount_abs'].mean()
            
            # If standard deviation is small relative to mean, it's a fixed cost
            if pd.isna(std_dev) or (std_dev / mean_amt) < 0.05:
                
                # Check dates - are they roughly a month apart? (25 to 35 days)
                group = group.sort_values('date')
                date_diffs = group['date'].diff().dt.days.dropna()
                
                if not date_diffs.empty:
                    avg_days = date_diffs.mean()
                    if 25 <= avg_days <= 35:
                        subscriptions.append({
                            "description": desc,
                            "amount": mean_amt,
                            "frequency": "Monthly",
                            "last_charged": group['date'].iloc[-1].strftime('%Y-%m-%d')
                        })
                        
    return sorted(subscriptions, key=lambda x: x['amount'], reverse=True)
