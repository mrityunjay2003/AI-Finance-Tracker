import re

# Standard regex patterns for common PII
PII_PATTERNS = {
    "EMAIL": r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
    "PHONE": r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b",
    "CREDIT_CARD": r"\b(?:\d[ -]*?){13,16}\b",
    "SSN": r"\b\d{3}[-.]?\d{2}[-.]?\d{4}\b"
}

def redact_text(text: str) -> tuple[str, int]:
    """
    Scans a string for PII and replaces it with a [REDACTED] tag.
    Returns the scrubbed string and the number of redactions made.
    """
    if not isinstance(text, str):
        return text, 0

    scrubbed_text = text
    total_redactions = 0

    for pii_type, pattern in PII_PATTERNS.items():
        matches = re.findall(pattern, scrubbed_text)
        if matches:
            # re.subn returns a tuple: (new_string, number_of_subs_made)
            scrubbed_text, count = re.subn(pattern, f"[REDACTED_{pii_type}]", scrubbed_text)
            total_redactions += count

    return scrubbed_text, total_redactions

def redact_transactions(transactions: list[dict]) -> tuple[list[dict], int]:
    """
    Iterates through all transactions and scrubs the descriptions.
    """
    total_pii_found = 0
    for t in transactions:
        clean_desc, count = redact_text(t['description'])
        t['description'] = clean_desc
        total_pii_found += count
        
    return transactions, total_pii_found
