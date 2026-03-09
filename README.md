# AI-Powered Personal Finance Analyzer

An intelligent, full-stack web application that uses GPT-4 to analyze, categorize, and chat with your personal bank statements. 



## Features
- **Smart CSV Parsing**: Handles multiple common bank statement formats automatically.
- **AI Categorization**: Uses OpenAI's GPT-4 in JSON mode to accurately tag transactions.
- **Anomaly Detection**: Statistical Z-score analysis and duplicate detection to catch unusual spending.
- **Interactive Dashboard**: Visualizes your financial health using Recharts (Pie & Bar charts).
- **AI Insights**: Generates actionable, bulleted insights based on your spending habits.
- **Conversational AI**: A floating chat panel to ask questions about your data in real-time using SSE (Server-Sent Events) streaming.

## Architecture
This application utilizes a modern decouple architecture. The frontend is built with React, Vite, and Tailwind CSS, providing a fast, responsive, dark-themed UI. The backend is a FastAPI Python server that handles data ingestion, processing, and acts as a secure proxy to the OpenAI API.

Data is stored in an in-memory session dictionary, negating the need for a complex database setup and ensuring user data is transient and isolated per browser session. The chat interface utilizes Server-Sent Events (SSE) to stream GPT-4 responses token-by-token directly to the UI, providing a low-latency, conversational experience.

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- An OpenAI API Key

### Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Create a `.env` file based on the example and add your key: