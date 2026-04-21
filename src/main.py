import os
from google import genai
from fastapi import FastAPI
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

class MessageRequest(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

@app.post("/app/{session_id}")
async def ask_ai(session_id: str, body: MessageRequest):
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=body.message,
    )
    return {"response": response.text}
