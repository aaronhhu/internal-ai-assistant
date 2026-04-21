import os
from google import genai
from google.genai import types
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# In-memory chat history store: { session_id: [{"role": ..., "parts": [...]}, ...] }
session_histories: dict[str, list] = {}


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

    # Extract user context (chat history for this session)
    if session_id not in session_histories:
        session_histories[session_id] = []

    history = session_histories[session_id]

    # Append user message to history
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

    # Append assistant response to history
    history.append({"role": "model", "parts": [{"text": assistant_message}]})

    return {"response": assistant_message}


@app.delete("/app/{session_id}")
def clear_session(session_id: str):
    session_histories.pop(session_id, None)
    return {"message": f"Session {session_id} cleared."}
