# 🧬 Nutribot | AI Nutrition Assistant

![Project Screenshot](image_placeholder.png)
*(Replace this with a screenshot of your new Profile Form)*

> **"Precision Nutrition, Grounded in Data."**
> A context-aware dietary assistant that customizes advice based on your biological profile (TDEE, Macros, Goals). Powered by **Google Gemini** and **Next.js**.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.95-009688?style=flat-square&logo=fastapi)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=flat-square&logo=tailwind-css)
![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?style=flat-square&logo=google)

## 📖 About The Project

**DietQA** is an evolution of standard recipe chatbots. Instead of generic cooking advice, DietQA acts as a **Nutritionist** that strictly adheres to user-specific biological constraints.

Unlike standard LLM interactions, DietQA enforces a **Mandatory Onboarding Flow**. The user *cannot* access the chat without defining their Age, Weight, Height, Activity Level, and Goals (Cut/Bulk/Maintain). This data is invisibly injected into every AI context window, ensuring that every answer—whether it's a recipe or a scientific explanation—is mathematically tailored to the user's specific caloric needs.

### ✨ Key Features

* **🔒 Biometric Gatekeeper:** A modal-first UI that captures user metrics (Age, Gender, Weight, Goal) before the session begins.
* **🧠 Context-Injection Engine:** The backend invisibly appends the user's profile to the prompt, allowing the AI to calculate TDEE and macros dynamically without the user repeating themselves.
* **🎓 Academic & Structured Tone:** Responses follow a strict format: **Direct Answer** → **Nutritional Science** → **Recommendation** → **Safety Note**.
* **🥗 Macro-Friendly Recipe Generation:** Ask "What can I cook with eggs and spinach?" and get a recipe that specifically aligns with your "Weight Loss" or "Muscle Gain" goal.
* **⚠️ Safety Guardrails:** Programmed to refuse extreme caloric deficits and provide responsible health disclaimers.

---

## 🛠️ Tech Stack

### Frontend
* **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **State Management:** React Hooks for Profile/Chat Context
* **Authentication:** [Clerk](https://clerk.com/)

### Backend
* **Server:** [FastAPI](https://fastapi.tiangolo.com/)
* **AI Model:** [Google Gemini 1.5 Pro](https://ai.google.dev/) (Prioritized for reasoning capabilities)
* **Language:** Python 3.9+

---

## 🚀 Setup Guide

Follow these instructions to get the application running locally.

### 1. Prerequisites
* Node.js (v18+)
* Python (v3.9+)
* A Google Cloud API Key (for Gemini)
* A Clerk Account (for Authentication)

### 2. Backend Setup (The Brain)

Navigate to the root directory where `main.py` is located.

```bash
# Create a virtual environment
python -m venv venv

# Activate the environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
Create a .env file in the same directory:

Code snippet
GOOGLE_API_KEY=your_google_gemini_api_key_here
Start the Backend Server:

Bash
python main.py
# Output: 🇵🇭 Chef Noypi (Strict Diskarte Mode) is Ready!
# (Note: Console log might still say Chef Noypi, but the Brain is now DietQA)
3. Frontend Setup (The Interface)
Open a new terminal.

Bash
# Install Node modules
npm install
Create a .env.local file in the root of your project:

Code snippet
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_API_URL=http://localhost:8000
Start the Frontend:

Bash
npm run dev
Open http://localhost:3000 in your browser.

📂 Project Structure
Bash
DietQA/
├── app/
│   ├── layout.tsx       # Root layout with Clerk Provider & Font config
│   ├── page.tsx         # Logic: Profile Form -> Chat State -> API Call
│   └── globals.css      # Tailwind & Custom Semantic Variables
├── main.py              # FastAPI Server & "DietQA" System Instruction
├── requirements.txt     # Python Dependencies
├── tailwind.config.ts   # Tailwind Configuration
└── ...
🧠 System Logic
The core logic resides in the interaction between page.tsx and main.py.

The Handshake: The frontend collects user data (UserProfile interface).

The Injection: When the first message is sent, the frontend constructs a hidden system prompt:

Plaintext
[SYSTEM CONTEXT - USER PROFILE DATA]
Name: Jeroen
Age: 25
Goal: Muscle Gain
...
The Processing: main.py uses the DietQA System Instruction to enforce structure:

Rule 1: Always reference the profile.

Rule 2: No marketing fluff; use academic English.

Rule 3: Prioritize protein/satiety explanation.

🤝 Contributing
Got a better way to calculate TDEE? Or a better way to code this? Contributions are welcome!

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

📄 License
Distributed under the MIT License.

<div align="center">
<p>Powered by Google Gemini 1.5</p>
</div>