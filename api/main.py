from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError, Field
from typing import List, Optional, Literal
import httpx
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FieldProof API")

# Allow frontend to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_API_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "gemma:2b" # Or "gemma", "llama3.2-vision", depending on what is installed locally

class EvidencePayload(BaseModel):
    id: str
    kind: str
    text: Optional[str] = None
    capturedAt: str
    localUrl: Optional[str] = None # Base64 representation if sent

class AnalyzeRequest(BaseModel):
    missionType: str
    evidence: List[EvidencePayload]

class Observation(BaseModel):
    claim: str
    confidence: Literal["observed", "inferred", "unknown"]
    supportingEvidenceIds: List[str]

class FieldReport(BaseModel):
    summary: str
    observations: List[Observation]
    missingEvidence: List[str] = Field(alias="missing_evidence")
    suggestedNextStep: str = Field(alias="suggested_next_step")

    class Config:
        populate_by_name = True

@app.get("/health")
def health_check():
    return {"status": "ok"}

async def generate_from_ollama(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                OLLAMA_API_URL,
                json={
                    "model": MODEL_NAME,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                }
            )
            response.raise_for_status()
            return response.json().get("response", "")
        except Exception as e:
            logger.error(f"Failed to communicate with Ollama: {e}")
            raise HTTPException(status_code=503, detail="Local AI model is unavailable.")

@app.post("/analyze", response_model=FieldReport)
async def analyze_expedition(request: AnalyzeRequest):
    logger.info(f"Analyzing expedition: {request.missionType} with {len(request.evidence)} items.")
    
    # Formulate prompt from evidence
    text_evidence = []
    for ev in request.evidence:
        if ev.kind == "note" and ev.text:
            text_evidence.append(f"Note ID {ev.id}: {ev.text}")
        elif ev.kind == "photo":
            text_evidence.append(f"Photo Evidence ID {ev.id} captured.")

    evidence_str = "\n".join(text_evidence)
    
    prompt = f"""
You are an expert field researcher analyzing data from an outdoor expedition.
Mission Type: {request.missionType}

Here is the collected evidence:
{evidence_str}

Analyze this evidence and provide a structured JSON response. Do NOT output markdown, ONLY valid JSON.
Your JSON must match this structure exactly:
{{
  "summary": "A 1-2 sentence overall summary of the expedition.",
  "observations": [
    {{
      "claim": "Specific observation here.",
      "confidence": "observed" | "inferred" | "unknown",
      "supportingEvidenceIds": ["id1", "id2"]
    }}
  ],
  "missing_evidence": ["What evidence is missing to make a stronger conclusion?"],
  "suggested_next_step": "A single actionable next step."
}}

Rule for confidence:
- "observed": Only if directly stated in a note or directly visible in a photo (if provided).
- "inferred": A logical deduction based on the evidence.
- "unknown": Something guessed or speculative.

Ensure the "supportingEvidenceIds" match the Note IDs or Photo IDs provided above.
"""
    
    raw_response = await generate_from_ollama(prompt)
    
    try:
        data = json.loads(raw_response)
        report = FieldReport(**data)
        return report
    except (json.JSONDecodeError, ValidationError) as e:
        logger.warning(f"First parse attempt failed: {e}. Attempting repair.")
        
        repair_prompt = f"""
You previously returned invalid JSON. Fix the following JSON string so it matches the expected schema perfectly.
Schema:
{{
  "summary": "...",
  "observations": [
    {{
      "claim": "...",
      "confidence": "observed" | "inferred" | "unknown",
      "supportingEvidenceIds": ["id1"]
    }}
  ],
  "missing_evidence": ["..."],
  "suggested_next_step": "..."
}}

Invalid JSON:
{raw_response}
"""
        repair_response = await generate_from_ollama(repair_prompt)
        
        try:
            data = json.loads(repair_response)
            report = FieldReport(**data)
            return report
        except Exception as e:
            logger.error(f"Repair attempt failed: {e}")
            raise HTTPException(status_code=500, detail="AI returned malformed data. Please try again.")

@app.post("/predict-quality")
def predict_quality():
    # Placeholder for Phase 5 (TabPFN)
    return {"status": "TabPFN quality prediction coming soon"}
