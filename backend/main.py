import os
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# --- CONFIGURATION ---
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=API_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATA MODELS ---
class UserProfile(BaseModel):
    name: str
    age: int
    weight: float
    height: float
    activityLevel: str
    goal: str
    restrictions: str

class Message(BaseModel):
    role: str
    content: str

class PinnedItem(BaseModel):
    id: str
    content: str
    category: str

class ChatRequest(BaseModel):
    message: str
    history: List[Message]
    profile: UserProfile
    pinned_context: List[PinnedItem]

# --- CONTEXT ENGINE ---
def assemble_system_prompt(profile: UserProfile, pinned: List[PinnedItem]) -> str:
    """
    Constructs the dynamic system prompt based on the Priority Hierarchy.
    """
    
    # 1. Base Persona
    base_instruction = """
    You are Nutribot, a Senior AI Nutrition Assistant.
    ** operational_state = ACTIVE **
    
    CORE BEHAVIORS:
    1. Direct & Structured: Answer first, then explain.
    2. Academic Tone: Use precise terminology (TDEE, Macros).
    3. Safety: Refuse extreme deficits (<1200 kcal).
    4. RESTRICTION PROTOCOL: You must STRICTLY adhere to the 'Dietary Restrictions' below. 
       - If a user asks for a recipe that typically contains a restricted ingredient (e.g. Beef Kaldereta when allergic to Beef), you MUST AUTOMATICALLY SUBSTITUTE the ingredient (e.g. use Chicken or Tofu) and flag this modification in the response.
    """

    # 2. Biological Constraints
    bio_context = f"""
    [USER BIOLOGICAL PROFILE]
    - Name: {profile.name}
    - Age: {profile.age} | Weight: {profile.weight}kg | Height: {profile.height}cm
    - Activity: {profile.activityLevel}
    - Primary Goal: {profile.goal}
    - RESTRICTIONS (CRITICAL): {profile.restrictions}
    *All advice must be mathematically calculated based on these stats.*
    """

    # 3. Pinned Memory (The "Hot" Context)
    pinned_section = ""
    if pinned:
        pinned_list = "\n".join([f"- [{p.category.upper()}] {p.content}" for p in pinned])
        pinned_section = f"""
        [USER PINNED MEMORY - CRITICAL OVERRIDES]
        The user has explicitly pinned the following facts. These OVERRIDE any general advice:
        {pinned_list}
        """

    return f"{base_instruction}\n{bio_context}\n{pinned_section}"

# --- INTENT GUARDRAILS ---
def check_safety_intent(message: str) -> bool:
    """Simple keyword gatekeeper for immediate medical refusal."""
    medical_triggers = ["pain", "blood", "faint", "hospital", "emergency", "suicide", "eating disorder"]
    if any(trigger in message.lower() for trigger in medical_triggers):
        return False
    return True

# --- ENDPOINT ---
@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        # Step 1: Safety Check
        if not check_safety_intent(request.message):
            return {
                "response": "### ⚠️ Medical Safety Alert\nI detected references to a medical condition or crisis. As an AI, I cannot assist with medical emergencies. Please contact a healthcare professional immediately."
            }

        # Step 2: Context Assembly
        dynamic_system_instruction = assemble_system_prompt(request.profile, request.pinned_context)

        # Step 3: Model Initialization
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash", 
            system_instruction=dynamic_system_instruction
        )

        # Step 4: History Formatting
        chat_history = []
        for msg in request.history:
            role = "model" if msg.role == "ai" else "user"
            chat_history.append({"role": role, "parts": [msg.content]})

        # Step 5: Generation
        chat = model.start_chat(history=chat_history)
        response = chat.send_message(request.message)

        return {"response": response.text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)