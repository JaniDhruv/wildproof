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

# ---------------------------------------------------------
# ACTIVITIES
# ---------------------------------------------------------

@activity.defn
async def normalize_evidence(evidence: EvidenceData) -> EvidenceData:
    # Simulates preparing/cleaning local evidence payload for AI
    activity.logger.info("Normalizing evidence payload...")
    # Add dummy location normalization logic or size reduction
    return evidence

# A mock counter to simulate a transient failure for demonstration purposes
gemma_failures = 0

@activity.defn
async def run_gemma_analysis(evidence: EvidenceData) -> ReportData:
    global gemma_failures
    activity.logger.info(f"Running Gemma Analysis for {evidence.mission_type}...")
    
    # DEMONSTRATION OF TEMPORAL'S DURABLE RETRY
    # We force the activity to fail the first time to show how Temporal resumes it
    # without restarting the entire expedition process.
    if gemma_failures < 1:
        gemma_failures += 1
        activity.logger.error("Simulated GPU OOM or API Timeout error in Gemma.")
        raise RuntimeError("Gemma model failed to respond (Simulated Timeout)")
    
    # If we get here, it succeeded (on the retry)
    return ReportData(
        summary="A durable field report generated after a simulated failure recovery.",
        observations=[
            {"claim": "Evidence recovered seamlessly.", "confidence": "observed", "supportingEvidenceIds": []}
        ],
        missing_evidence=[],
        suggested_next_step="Review the Sentry tracing logs."
    )

@activity.defn
async def validate_report(report: ReportData) -> ReportData:
    activity.logger.info("Validating AI JSON Schema...")
    # Simulates Pydantic validation
    return report

@activity.defn
async def run_tabpfn_quality_prediction(report: ReportData) -> int:
    activity.logger.info("Running TabPFN tabular prediction on expedition quality...")
    return 95 # Dummy high quality score

@activity.defn
async def persist_report(report: ReportData) -> str:
    activity.logger.info("Persisting durable report to Database...")
    return "Report fully processed and saved!"

# ---------------------------------------------------------
# WORKFLOW
# ---------------------------------------------------------

@workflow.defn
class ExpeditionAnalysisWorkflow:
    @workflow.run
    async def analyze_expedition(self, evidence: EvidenceData) -> str:
        # Step 1: Normalize
        normalized = await workflow.execute_activity(
            normalize_evidence,
            evidence,
            start_to_close_timeout=timedelta(seconds=10),
        )

        # Step 2: Run Gemma Analysis
        # This activity is prone to "failure", but Temporal will automatically retry it
        # based on the default retry policy, ensuring the walk data isn't lost.
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
        quality_score = await workflow.execute_activity(
            run_tabpfn_quality_prediction,
            validated_report,
            start_to_close_timeout=timedelta(seconds=30),
        )

        # Step 5: Persist
        result = await workflow.execute_activity(
            persist_report,
            validated_report,
            start_to_close_timeout=timedelta(seconds=10),
        )

        return f"{result} (Quality Score: {quality_score})"
