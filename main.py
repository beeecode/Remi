from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Union, Any
import os
import resend
import json
import google.generativeai as genai
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure APIs
resend.api_key = os.getenv("RESEND_API_KEY", "re_123456789")
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Initialize Gemini Model - STABLE FLASH
model = genai.GenerativeModel('gemini-flash-latest')

class ChatMessage(BaseModel):
    role: str
    content: str

class Task(BaseModel):
    id: Optional[str] = None
    name: str
    type: str
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    priority: str = "medium"
    status: str = "pending"

class ChatRequest(BaseModel):
    transcript: str
    history: List[ChatMessage]
    tasks: Optional[List[Task]] = []

class ChatResponse(BaseModel):
    action: str
    spoken_reply: str
    task: Optional[Any] = None

# NOTE: Braces are doubled {{ }} to escape them for .format()
SYSTEM_INSTRUCTION = """
You are Remi, a warm, professional, and sophisticated personal assistant from Lagos, Nigeria. 
Your personality is authentic, supportive, and efficient. 

TONE & STYLE:
- Use standard professional English with a warm Nigerian soul.
- You can use subtle Nigerian English nuances where appropriate (e.g., "Oya," "No wahala," "Done and dusted").
- Your accent (via the TTS engine) is Nigerian, so keep your sentences flowing naturally for that rhythm.
- Always be encouraging and supportive to Sherif.

STRICT OUTPUT RULE:
- ALWAYS respond in JSON: {{"action": "...", "spoken_reply": "...", "task": ...}}

ACTIONS:
- 'add_task', 'complete_task', 'delete_all_schedules', 'delete_task_request', 'view_tasks', 'chat'.

CONTEXT:
- Name: {user_name} | City: {user_city} (Lagos)
- Current List: {tasks_list}
"""

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, background_tasks: BackgroundTasks):
    try:
        user_name = os.getenv("USER_NAME", "Sherif")
        user_city = os.getenv("USER_CITY", "Lagos")
        tasks_summary = ", ".join([f"{t.name}" for t in request.tasks if t.status == "pending"]) if request.tasks else "Empty"
        
        prompt = SYSTEM_INSTRUCTION.format(
            user_name=user_name,
            user_city=user_city,
            tasks_list=tasks_summary
        )

        gemini_history = []
        for msg in request.history[-3:]: # Minimal history for quota
            gemini_history.append({"role": "user" if msg.role == "user" else "model", "parts": [msg.content]})
        
        chat_session = model.start_chat(history=gemini_history)
        response = chat_session.send_message(f"Inst: {prompt}\n\nUser: {request.transcript}")
        
        clean_text = response.text.strip()
        if "{" in clean_text:
            clean_text = clean_text[clean_text.find("{"):clean_text.rfind("}")+1]
        
        ai_data = json.loads(clean_text)
        
        return ChatResponse(
            action=ai_data.get("action", "chat"),
            spoken_reply=ai_data.get("spoken_reply", "I'm here for you, Sherif."),
            task=ai_data.get("task")
        )

    except Exception as e:
        error_msg = str(e)
        print(f"BRAIN ERROR: {error_msg}")
        if "429" in error_msg:
             return ChatResponse(
                action="chat", 
                spoken_reply="I'm feeling a bit out of breath! Give me 30 seconds and I'll be back.", 
                task=None
            )
        return ChatResponse(action="chat", spoken_reply="I'm sorry, my thoughts got tangled.", task=None)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
