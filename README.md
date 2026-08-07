<div align="center">

# 🔥 ROAST MY CV - PITCH DECK EDITION 🚀

**The unapologetic AI creative director grading your resume with zero filter.**

![Visit](https://roast-my-cv-gamma.vercel.app)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20FastAPI%20%7C%20Gemini-CCFF00?style=for-the-badge&logo=next.js&labelColor=black&color=CCFF00)
![Status](https://img.shields.io/badge/Status-Roasting_Resumes-7000FF?style=for-the-badge)

</div>

---

## 💥 WHAT IS THIS?

**RoastMyCV** acts like a harsh, creative agency grading your resume. It analyzes a PDF resume, scores it out of 100, and provides brutal, actionable feedback on design, impact, and phrasing.

No fluff. No generic advice. Just hard truths wrapped in a stunning **Neo-Brutalist Pop-Art** interface.

### ✨ Features
*   **Zero-Filter AI Critiques:** Powered by Google Gemini to rip apart buzzwords, passive voice, and weak impact metrics.
*   **Bring Your Own Key (BYOK):** Users can easily plug in their own free Gemini API key to avoid shared rate limits!
*   **"Pitch Deck" Visuals:** Stark white backgrounds, hazard orange accents, electric blue borders, and solid block shadows.
*   **Interactive React Bits:** Features dynamic animations like the GSAP `<Shuffle />` component and glitchy terminal logs.

---

## 🛠️ TECH STACK

*   **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Shadcn UI, Skiper UI, React Bits (GSAP).
*   **Backend:** Python, FastAPI, Uvicorn, Google GenAI SDK.
*   **PDF Processing:** `pdfplumber` + `pypdf`.

---

## 🚀 RUNNING LOCALLY

Want to run your own roasting agency? Here's how to spin it up.

### 1. Start the FastAPI Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Copy the env file and add your Google Gemini API key if you want a server default
cp .env.example .env

# Run the backend (runs on http://localhost:8000)
uvicorn main:app --reload
```

### 2. Start the Next.js Frontend
```bash
cd frontend
npm install
# Run the frontend (runs on http://localhost:3000)
npm run dev
```

---

## 🔑 API KEY SETUP

RoastMyCV uses Google's Gemini models. The free tier is generous, but shared quotas can run out fast.
You can get a free key in 5 seconds from [Google AI Studio](https://aistudio.google.com/app/apikey).

1. Click the **🔑 ADD API KEY** button in the website's top navigation bar.
2. Paste your free key. (It saves securely in your browser's local storage!)
3. Roast away!

---

<div align="center">
  <b>Built with 💻 and ☕ by <a href="https://github.com/Rushiiii505">Rushiiii505</a></b>
</div>
