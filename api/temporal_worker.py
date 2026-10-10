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
import sentry_sdk
import os
from dotenv import load_dotenv

load_dotenv()

sentry_dsn = os.environ.get("SENTRY_DSN")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
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
        task_queue="wildproof-analysis-queue",
        workflows=[ExpeditionAnalysisWorkflow],
        activities=[
            normalize_evidence,
            run_gemma_analysis,
            validate_report,
            run_tabpfn_quality_prediction,
            persist_report,
        ],
    )
    
    logging.info("Starting Temporal Worker for WildProof Analysis...")
    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())
