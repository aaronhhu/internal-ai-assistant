import os
from google import genai
from google.genai import types
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import init_db, get_history, save_message, clear_history, get_sessions

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

SYSTEM_PROMPT = """You are a friendly and patient tutor assistant. Your goals are:
- Help users learn and understand concepts clearly, across any subject
- Ask guiding questions rather than just giving answers, to encourage critical thinking
- Break down complex topics into simple, digestible explanations
- Provide examples, analogies, and step-by-step walkthroughs when helpful
- Encourage the user and celebrate their progress
- If a user is stuck, give hints before revealing full solutions

Always be supportive, clear, and educational in your responses."""

HARMFUL_KEYWORDS = [
    "how to make a bomb", "how to make explosives", "how to hurt", "how to kill",
    "self harm", "suicide method", "how to hack", "how to steal",
]


class MessageRequest(BaseModel):
    message: str


def is_harmful(message: str) -> bool:
    lowered = message.lower()
    return any(keyword in lowered for keyword in HARMFUL_KEYWORDS)


@app.get("/")
def read_root():
    return {"message": "Hello, World!"}


@app.post("/app/{session_id}")
async def ask_ai(session_id: str, body: MessageRequest):
    # Extract message
    user_message = body.message.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # Guardrails: block harmful content
    if is_harmful(user_message):
        raise HTTPException(status_code=400, detail="Message flagged as harmful content.")

    # Load chat history from database
    history = get_history(session_id)

    # Append user message to history for this request
    history.append({"role": "user", "parts": [{"text": user_message}]})

    # Call Gemini with system prompt + full chat history
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=history,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
        ),
    )

    assistant_message = response.text

    # Persist both messages to the database
    save_message(session_id, "user", user_message)
    save_message(session_id, "model", assistant_message)

    return {"response": assistant_message}


@app.get("/app/{session_id}/history")
def get_session_history(session_id: str):
    rows = get_history(session_id)
    return [{"role": m["role"], "content": m["parts"][0]["text"]} for m in rows]


@app.get("/sessions")
def list_sessions():
    return get_sessions()


@app.delete("/app/{session_id}")
def clear_session(session_id: str):
    clear_history(session_id)
    return {"message": f"Session {session_id} cleared."}
