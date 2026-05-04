import os
from google import genai
from google.genai import types
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from src.database import init_db, get_history, save_message, clear_history, get_sessions
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

SYSTEM_PROMPT = """..."""
class MessageRequest(BaseModel):
    message: str

@app.post("/chat/{session_id}")
async def ask_ai(session_id: str, body: MessageRequest):
    user_message = body.message.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    
    history = get_history(session_id)
    history.append({"role": "user", "parts": [{"text": user_message}]})

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=history,
        config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
    )

    assistant_message = response.text

    save_message(session_id, "user", user_message)
    save_message(session_id, "model", assistant_message)
    return {"response": response.text}

@app.get("/chat/{session_id}/history")
def get_session_history(session_id: str):
    rows = get_history(session_id)
    return [{"role": m["role"], "content": m["parts"][0]["text"]} for m in rows]


@app.get("/sessions")
def list_sessions():
    return get_sessions()

@app.delete("/chat/{session_id}")
def clear_session(session_id: str):
    clear_history(session_id)
    return {"message": f"Session {session_id} cleared."}

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}