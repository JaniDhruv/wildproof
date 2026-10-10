from datetime import timedelta
import asyncio
from temporalio import activity, workflow
from typing import List, Dict, Any

# Define data classes used in the workflow
from dataclasses import dataclass

@dataclass
class EvidenceData:
    mission_type: str
    evidence_items: List[Dict[str, Any]]

@dataclass
class ReportData:
    summary: str
    observations: List[Dict[str, Any]]
    missing_evidence: List[str]
    suggested_next_step: str

@dataclass
class QualityInput:
    evidence: EvidenceData
    report: ReportData

# ---------------------------------------------------------
# ACTIVITIES
# ---------------------------------------------------------

@activity.defn
async def normalize_evidence(evidence: EvidenceData) -> EvidenceData:
    # Simulates preparing/cleaning local evidence payload for AI
    activity.logger.info("Normalizing evidence payload...")
    # Add dummy location normalization logic or size reduction
    return evidence

import json
import httpx

@activity.defn
async def run_gemma_analysis(evidence: EvidenceData) -> ReportData:
    activity.logger.info(f"Running REAL Gemma Analysis for {evidence.mission_type}...")
    
    prompt = f"Mission: {evidence.mission_type}. Analyze this field evidence:\n"
    for e in evidence.evidence_items:
        if e.get("kind") == "note":
            prompt += f"- Note: {e.get('text')}\n"
        elif e.get("kind") == "photo":
            prompt += "- Photo: [Image metadata omitted for text-only model]\n"

    prompt += "\nOutput JSON with summary, observations (with claim, confidence), missing_evidence, and suggested_next_step."

    # This will fail (and therefore trigger Temporal's durable retries) if Ollama is not running!
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "http://localhost:11434/api/generate",
            json={"model": "gemma:2b", "prompt": prompt, "stream": False, "format": "json"}
        )
        response.raise_for_status()
        result = response.json()
        
        try:
            data = json.loads(result["response"])
            return ReportData(
                summary=data.get("summary", "Fallback summary"),
                observations=data.get("observations", []),
                missing_evidence=data.get("missing_evidence", []),
                suggested_next_step=data.get("suggested_next_step", "")
            )
        except Exception:
            raise RuntimeError("Failed to parse Gemma output into valid JSON")

@activity.defn
async def validate_report(report: ReportData) -> ReportData:
    activity.logger.info("Validating AI JSON Schema...")
    # Simulates Pydantic validation
    return report

@activity.defn
async def run_tabpfn_quality_prediction(inputs: QualityInput) -> Dict[str, Any]:
    activity.logger.info("Running TabPFN tabular prediction on expedition quality...")
    
    num_photos = sum(1 for e in inputs.evidence.evidence_items if e.get("kind") == "photo")
    num_notes = sum(1 for e in inputs.evidence.evidence_items if e.get("kind") == "note")
    total_note_length = sum(len(e.get("text", "")) for e in inputs.evidence.evidence_items if e.get("kind") == "note")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # We call our own API to use the exact same TabPFN/fallback logic
            response = await client.post(
                "http://localhost:8000/predict-quality",
                json={
                    "num_photos": num_photos, 
                    "num_notes": num_notes, 
                    "total_note_length": total_note_length, 
                    "duration_seconds": 600
                }
            )
            response.raise_for_status()
            data = response.json()
            return {"score": data.get("score"), "model": data.get("model")}
        except Exception as e:
            activity.logger.error(f"Quality endpoint failed: {e}")
            # Raise an error to allow Temporal to retry, or fallback honestly.
            return {"score": None, "model": "unavailable", "reason": "quality endpoint unavailable"}

@activity.defn
async def persist_report(report: ReportData) -> ReportData:
    activity.logger.info("Persisting durable report to Database...")
    return report

# ---------------------------------------------------------
# WORKFLOW
# ---------------------------------------------------------

@workflow.defn
class ExpeditionAnalysisWorkflow:
    @workflow.run
    async def analyze_expedition(self, evidence: EvidenceData) -> Dict[str, Any]:
        # Step 1: Normalize
        normalized = await workflow.execute_activity(
            normalize_evidence,
            evidence,
            start_to_close_timeout=timedelta(seconds=10),
        )

        # Step 2: Run Gemma Analysis
        raw_report = await workflow.execute_activity(
            run_gemma_analysis,
            normalized,
            start_to_close_timeout=timedelta(seconds=60),
        )

        # Step 3: Validate
        validated_report = await workflow.execute_activity(
            validate_report,
            raw_report,
            start_to_close_timeout=timedelta(seconds=10),
        )

        # Step 4: Quality Prediction
        quality_score_data = await workflow.execute_activity(
            run_tabpfn_quality_prediction,
            QualityInput(evidence=normalized, report=validated_report),
            start_to_close_timeout=timedelta(seconds=30),
        )

        # Step 5: Persist
        final_report = await workflow.execute_activity(
            persist_report,
            validated_report,
            start_to_close_timeout=timedelta(seconds=10),
        )

        # Return as a dictionary that matches the frontend FieldReport schema
        return {
            "summary": final_report.summary,
            "observations": final_report.observations,
            "missing_evidence": final_report.missing_evidence,
            "suggested_next_step": final_report.suggested_next_step,
            "quality_score": quality_score_data.get("score") if quality_score_data else None
        }
