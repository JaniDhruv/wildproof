# WildProof 🌿

**WildProof** is an offline-first, uncertainty-aware field observation app designed to help researchers, hikers, and citizen scientists confidently log outdoor evidence. Built for the **Hacktoberfest DEV Challenge (Week 1: Touch Grass)**.

Unlike typical AI identification apps that confidently guess incorrect species, WildProof embraces uncertainty. It acts as an offline journal for your expedition (capturing photos, notes, and metadata via IndexedDB). When you return to civilization, a local AI (Gemma 2B) analyzes your evidence—currently processing the text notes and photographic metadata—generating a structured report that explicitly separates *observed facts* from *inferred deductions*.

## How it works

1. **Mission Selection**: Choose a mission type (e.g., Habitat Comparison, Pattern Hunt).
2. **Offline Evidence Capture**: Go outside! Log field notes and snap photos. Everything is saved locally via IndexedDB, meaning it works deep in the woods without cell service.
3. **Durable Analysis pipeline**: Back on Wi-Fi, the app submits your evidence to a local FastAPI backend. A Temporal workflow coordinates the AI analysis, ensuring no data is lost even if the AI model crashes or times out.
4. **Structured Report**: The local Gemma model structures the raw evidence into a rigid JSON schema, highlighting what was directly observed, what is missing, and suggesting your next actionable step in the field.

## Challenge Categories Targeted

We built WildProof to specifically target three prize categories:

### 1. Best Use of TabPFN
We integrated TabPFN directly into the API to predict "Expedition Quality" based on tabular features (number of photos, note length, mission duration). Because TabPFN is optimized for small tabular datasets, it perfectly captures the non-linear relationships in small field-data sets. It is fully wired up in the `/predict-quality` endpoint and displays the score dynamically in the UI. 
*See `api/tabpfn_experiment.py` for the reproducible baseline-vs-TabPFN experiment script!*

### 2. Best Use of Temporal
The AI analysis pipeline is notoriously flaky (GPU OOMs, local model timeouts). We wrapped the entire backend analysis in a **Temporal Workflow** (`api/temporal_workflow.py`). If the Gemma analysis step fails or times out, Temporal durably retries the specific activity without losing the user's hard-earned field data or restarting the entire expedition process.

### 3. Best Use of Sentry
We instrumented the entire stack for deep performance tracing and error tracking:
- **React Frontend**: `@sentry/react` captures browser interactions and session replays.
- **FastAPI Backend & Temporal Worker**: `sentry-sdk[fastapi]` tracks request latency and catches model timeouts. 
*(You can simulate a crash and generate a trace link using the `GET /sentry-debug` endpoint!)*

## Local Setup

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- Local [Ollama](https://ollama.com/) with `gemma:2b` pulled (`ollama run gemma:2b`)
- (Optional) Temporal CLI for running the durable workflow locally.

### 1. Frontend Setup
```bash
npm install
npm run dev
```
The React app will be available at `http://localhost:5173`.

### 2. Backend Setup
Create a `.env` file from `.env.example` and add your Sentry DSN if you wish to track errors.
```bash
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

pip install -r api/requirements.txt
```

### 3. Running the Backend
To start the standard FastAPI server:
```bash
cd api
uvicorn main:app --reload
```

*(Optional)* To run the Temporal worker (requires Temporal running locally `temporal server start-dev`):
```bash
cd api
python temporal_worker.py
```

## License
MIT
