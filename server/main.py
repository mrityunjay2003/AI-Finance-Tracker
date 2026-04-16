import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import upload, analyze, chat 
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Finance Analyzer API")
origins = [os.getenv("FRONTEND_URL")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(analyze.router) 
app.include_router(chat.router)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    port_env = os.getenv("PORT", 8000)
    uvicorn.run(app, host="0.0.0.0", port=int(port_env))