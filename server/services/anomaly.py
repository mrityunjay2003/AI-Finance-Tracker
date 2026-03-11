import pandas as pd
from datetime import datetime

def detect_anomalies(transactions: list[dict]) -> list[dict]:
    df = pd.DataFrame(transactions)
    if df.empty:
        return transactions

    df['date_obj'] = pd.to_datetime(df['date'])
    
    for index, row in df.iterrows():
        if abs(row['amount']) > 1000 and row['category'] != 'Income':
            df.at[index, 'is_anomaly'] = True
            df.at[index, 'anomaly_reason'] = "Unusually high transaction amount over ₹1,000."

    categories = df['category'].unique()
    for cat in categories:
        cat_df = df[(df['category'] == cat) & (df['amount'] < 0)]
        if len(cat_df) > 3:
            mean = cat_df['amount'].mean()
            std = cat_df['amount'].std()
            if std > 0:
                for index, row in cat_df.iterrows():
                    # amount<mean - 2*std 
                    if row['amount'] < mean - (2 * std):
                        df.at[index, 'is_anomaly'] = True
                        df.at[index, 'anomaly_reason'] = f"Spend is significantly higher than your average for {cat}."

    df = df.sort_values(by=['description', 'date_obj'])
    df['prev_date'] = df.groupby(['description', 'amount'])['date_obj'].shift(1)
    df['days_diff'] = (df['date_obj'] - df['prev_date']).dt.days

    for index, row in df.iterrows():
        if pd.notna(row['days_diff']) and row['days_diff'] <= 3:
            df.at[index, 'is_anomaly'] = True
            df.at[index, 'anomaly_reason'] = "Possible duplicate: similar transaction found within 3 days."

    # Cleanup and update
    for t in transactions:
        row = df[df['id'] == t['id']].iloc[0]
        t['is_anomaly'] = bool(row['is_anomaly'])
        t['anomaly_reason'] = str(row['anomaly_reason']) if pd.notna(row['anomaly_reason']) else None

    return transactions
