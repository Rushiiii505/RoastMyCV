"""
RoastMyCV Backend v3.0
Uses the official google-genai SDK (not deprecated google-generativeai).
No LangChain dependency for Gemini — direct, clean, and reliable.
"""

import os
import io
import json
import re
import logging
import traceback
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from dotenv import load_dotenv

# ── Load .env ────────────────────────────────────────────────
load_dotenv()                   # loads .env first
load_dotenv(".env.example")     # fallback to .env.example

# ── PDF extraction ───────────────────────────────────────────
import pdfplumber
import pypdf

# ── Logging ──────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger("roastmycv")

# ── FastAPI App ──────────────────────────────────────────────
app = FastAPI(title="RoastMyCV API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Response Schema ──────────────────────────────────────────
class ResumeAnalysis(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    agency_verdict: str
    design_critique: str
    impact_critique: str
    phrasing_critique: str
    extracted_skills: List[str]
    quick_fixes: List[str]


# ── PDF Text Extraction (pdfplumber → pypdf fallback) ────────
def extract_pdf_text(file_bytes: bytes) -> str:
    text = ""

    # Attempt 1: pdfplumber (best for structured PDFs)
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        logger.warning(f"pdfplumber extraction failed: {e}")

    # Attempt 2: pypdf fallback
    if not text.strip():
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        except Exception as e:
            logger.warning(f"pypdf extraction also failed: {e}")

    return text.strip()


# ── JSON Extraction from LLM Response ────────────────────────
def extract_json_from_response(raw: str) -> dict:
    """
    Robustly extracts a JSON object from an LLM response,
    handling markdown fences, preamble text, and trailing junk.
    """
    cleaned = raw.strip()

    # Strip markdown code fences: ```json ... ``` or ``` ... ```
    fence_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", cleaned, re.DOTALL)
    if fence_match:
        cleaned = fence_match.group(1).strip()

    # Find the outermost { ... } pair
    brace_start = cleaned.find("{")
    if brace_start == -1:
        raise ValueError(f"No JSON object found in response: {raw[:200]}")

    depth = 0
    brace_end = -1
    for i in range(brace_start, len(cleaned)):
        if cleaned[i] == "{":
            depth += 1
        elif cleaned[i] == "}":
            depth -= 1
            if depth == 0:
                brace_end = i
                break

    if brace_end == -1:
        raise ValueError(f"Unbalanced braces in response: {raw[:200]}")

    json_str = cleaned[brace_start : brace_end + 1]
    return json.loads(json_str)


# ── The Roast Prompt ─────────────────────────────────────────
SYSTEM_PROMPT = """You are a ruthless, world-class Creative Director and Lead Executive Recruiter at a top-tier creative agency.

You are grading a candidate's resume out of 100 with ZERO mercy. You are hilarious, razor-sharp, brutally direct, and deeply insightful. Think Simon Cowell reviewing resumes.

RULES FOR YOUR ROAST:
1. Be genuinely harsh but constructive. Don't just be mean — give specific, actionable, expert-level criticism.
2. Call out EVERY vague bullet point. "Helped the team with X" is unacceptable — demand hard numbers, percentages, revenue figures.
3. Roast generic buzzwords ruthlessly: "team player", "detail-oriented", "fast learner", "synergy" — tear them apart.
4. Evaluate the DESIGN/LAYOUT even from text: comment on probable formatting, length (1 page vs 3 pages), section ordering, and whitespace usage.
5. Extract 6-12 actual technical/professional skills you find (or note which common ones are MISSING).
6. Provide 3-5 very specific, immediately actionable fixes — not vague advice like "improve your resume", but concrete actions like "Replace 'Helped manage databases' with 'Optimized PostgreSQL queries reducing response time by 40%'".

YOUR RESPONSE MUST BE A SINGLE, VALID JSON OBJECT with exactly these keys:
{
  "overall_score": <integer 0-100>,
  "agency_verdict": "<1-2 sentence brutal punchline summary of this candidate>",
  "design_critique": "<detailed 3-5 sentence roast of layout, fonts, white space, page count, section order>",
  "impact_critique": "<detailed 3-5 sentence roast of vague statements, missing metrics, weak quantification>",
  "phrasing_critique": "<detailed 3-5 sentence roast of buzzwords, passive voice, clichés, corporate jargon>",
  "extracted_skills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5", "Skill6"],
  "quick_fixes": ["Specific fix 1", "Specific fix 2", "Specific fix 3"]
}

CRITICAL: Output ONLY the raw JSON object. No markdown fences, no extra text before or after.
"""

USER_PROMPT_TEMPLATE = """Here is the resume text to roast. Be brutal and thorough:

--- RESUME START ---
{resume_text}
--- RESUME END ---

Now output your JSON analysis:"""


# ── Gemini via google-genai SDK ──────────────────────────────
async def analyze_with_gemini(api_key: str, resume_text: str) -> ResumeAnalysis:
    """Use the official google-genai SDK (NOT the deprecated google.generativeai)."""
    import asyncio
    from google import genai

    client = genai.Client(api_key=api_key)

    # Models available on this API key, ordered by preference.
    # Each model has its own separate quota bucket, so trying multiple
    # maximizes our chances even under free-tier limits.
    models = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
    ]

    user_prompt = USER_PROMPT_TEMPLATE.format(resume_text=resume_text)
    last_error = None

    for model_name in models:
        # Retry each model up to 2 times with a short backoff for 429s
        for attempt in range(2):
            try:
                logger.info(f"Trying Gemini model: {model_name} (attempt {attempt + 1})")
                response = client.models.generate_content(
                    model=model_name,
                    contents=user_prompt,
                    config={
                        "system_instruction": SYSTEM_PROMPT,
                        "temperature": 0.7,
                        "max_output_tokens": 4096,
                    },
                )

                raw_text = response.text
                logger.info(f"✅ Gemini ({model_name}) returned {len(raw_text)} chars")

                data = extract_json_from_response(raw_text)
                return ResumeAnalysis(**data)

            except Exception as e:
                err_str = str(e)
                logger.warning(f"Gemini {model_name} attempt {attempt + 1} failed: {type(e).__name__}: {err_str[:200]}")
                last_error = e

                # If rate-limited (429), wait and retry once more on this model
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    if attempt == 0:
                        logger.info(f"Rate limited on {model_name}, waiting 5s before retry...")
                        await asyncio.sleep(5)
                        continue
                    else:
                        # Move to next model instead of waiting longer
                        break
                else:
                    # Non-rate-limit error, skip to next model immediately
                    break

    # If we get here, all models failed
    raise last_error or RuntimeError("All Gemini models failed")


# ── Health Check ─────────────────────────────────────────────
@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "version": "3.0.0",
        "keys": {
            "GOOGLE_API_KEY": bool(os.getenv("GOOGLE_API_KEY")),
        },
    }


# ── Main Analyze Endpoint ───────────────────────────────────
@app.post("/api/analyze", response_model=ResumeAnalysis)
async def analyze_resume(
    file: UploadFile = File(...),
    custom_api_key: Optional[str] = Form(None)
):
    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files (.pdf) are accepted.")

    # Read file
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

    # Extract text
    text = extract_pdf_text(contents)
    if not text:
        raise HTTPException(
            status_code=400,
            detail="Could not extract readable text from the PDF. Make sure it contains selectable text (not a scanned image).",
        )

    logger.info(f"Extracted {len(text)} chars from '{file.filename}'")

    # Use user-provided API key if supplied, otherwise fallback to server .env
    api_key = custom_api_key.strip() if custom_api_key and custom_api_key.strip() else os.getenv("GOOGLE_API_KEY", "").strip()
    if not api_key or api_key.startswith("your_") or "ADD YOUR KEY" in api_key:
        raise HTTPException(
            status_code=400,
            detail="🔑 No Gemini API Key provided! Please click '🔑 ADD API KEY' in the top right corner of the page to enter your free key (or set GOOGLE_API_KEY in backend/.env).",
        )

    # Run analysis
    try:
        result = await analyze_with_gemini(api_key, text)
        logger.info(f"Analysis complete. Score: {result.overall_score}/100")
        return result
    except Exception as e:
        logger.error(f"Analysis failed: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {type(e).__name__}: {str(e)}",
        )


# ── Run directly ─────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
