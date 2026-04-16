"""
pdf_service.py
==============
Converts a Navi UPI PDF bank statement into a normalised CSV (bytes).

The CSV produced always has exactly three columns:
    Date        – YYYY-MM-DD
    Description – "Paid to X" / "Received from X"
    Amount      – signed float  (positive = credit, negative = debit)

Usage
-----
    from pdf_service import pdf_to_csv_bytes

    csv_bytes = pdf_to_csv_bytes(open("statement.pdf", "rb").read())
    # hand csv_bytes straight to parser.py → parse_csv(csv_bytes)
"""

import io
import re
from datetime import datetime

import pandas as pd


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def pdf_to_csv_bytes(file_bytes: bytes) -> bytes:
    """
    Extract transactions from a Navi UPI PDF and return them as UTF-8 CSV bytes.

    Parameters
    ----------
    file_bytes : raw bytes of the PDF file

    Returns
    -------
    bytes  – UTF-8 encoded CSV with columns: Date, Description, Amount
    """
    text = _extract_text(file_bytes)
    rows = _parse_navi_text(text)

    if not rows:
        raise ValueError(
            "No transactions found in the PDF. "
            "Ensure the file is a Navi UPI statement."
        )

    df = pd.DataFrame(rows, columns=["Date", "Description", "Amount"])
    return df.to_csv(index=False).encode("utf-8")


# ---------------------------------------------------------------------------
# Text extraction  (pdfplumber preferred, PyMuPDF as fallback)
# ---------------------------------------------------------------------------

def _extract_text(file_bytes: bytes) -> str:
    try:
        import pdfplumber
        return _extract_pdfplumber(file_bytes)
    except ImportError:
        pass

    try:
        import fitz  # PyMuPDF
        return _extract_pymupdf(file_bytes)
    except ImportError:
        pass

    raise ImportError(
        "PDF text extraction requires 'pdfplumber' or 'pymupdf'.\n"
        "  pip install pdfplumber   OR   pip install pymupdf"
    )


def _extract_pdfplumber(file_bytes: bytes) -> str:
    import pdfplumber

    pages = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            t = page.extract_text(x_tolerance=3, y_tolerance=3)
            if t:
                pages.append(t)
    return "\n".join(pages)


def _extract_pymupdf(file_bytes: bytes) -> str:
    import fitz

    doc = fitz.open(stream=file_bytes, filetype="pdf")
    return "\n".join(page.get_text() for page in doc)


# ---------------------------------------------------------------------------
# Parsing logic
# ---------------------------------------------------------------------------

# pdfplumber collapses each table row onto one line:
#   "8 Mar 2026 Received from AJAY KUMAR MISHRA ₹1,100"
#   "7 Mar 2026 Paid to SWEET NATION ₹40"
_TXN_LINE_RE = re.compile(
    r"^(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})"
    r"\s+"
    r"((?:Paid to|Received from)\s+.+?)"
    r"\s+₹([\d,]+(?:\.\d+)?)\s*$",
    re.IGNORECASE,
)

_CREDIT_RE = re.compile(r"\breceived\s+from\b", re.IGNORECASE)


def _parse_navi_text(text: str) -> list[tuple]:
    """
    Scan extracted PDF text line-by-line and return a list of
    (date_str, description, signed_amount) tuples.
    """
    rows = []
    for line in text.splitlines():
        line = line.strip()
        m = _TXN_LINE_RE.match(line)
        if not m:
            continue

        date_str   = m.group(1).strip()
        description = m.group(2).strip()
        amount_str  = m.group(3)

        try:
            date = datetime.strptime(date_str, "%d %b %Y").strftime("%Y-%m-%d")
        except ValueError:
            continue

        raw = float(amount_str.replace(",", ""))
        amount = raw if _CREDIT_RE.search(description) else -raw

        rows.append((date, description, amount))

    return rows