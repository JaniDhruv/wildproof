import asyncio
import logging
from temporalio.client import Client
from temporalio.worker import Worker

# Import our workflow and activities
from temporal_workflow import (
    ExpeditionAnalysisWorkflow,
    normalize_evidence,
    run_gemma_analysis,
    validate_report,
    run_tabpfn_quality_prediction,
    persist_report,
)

async def main():
    logging.basicConfig(level=logging.INFO)
    
    # Connect to local Temporal server (requires Temporal CLI or Docker running locally)
    # E.g., `temporal server start-dev`
    try:
        client = await Client.connect("localhost:7233")
    except Exception as e:
        logging.error("Failed to connect to Temporal Server. Make sure it is running on localhost:7233.")
        return

    # Run the worker
    worker = Worker(
        client,
        task_queue="fieldproof-analysis-queue",
        workflows=[ExpeditionAnalysisWorkflow],
        activities=[
            normalize_evidence,
            run_gemma_analysis,
            validate_report,
            run_tabpfn_quality_prediction,
            persist_report,
        ],
    )
    
    logging.info("Starting Temporal Worker for FieldProof Analysis...")
    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())
