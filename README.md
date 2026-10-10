
<h1 align="center">WildProof</h1>

<p align="center">
  <strong>Go outside with a question. Come back with evidence.</strong><br />
  An offline-first, uncertainty-aware field observation app for meaningful time outdoors.
</p>

<p align="center">
  <a href="https://dev.to/challenges/hacktoberfest-week1-2026-10-05">
    <img src="https://img.shields.io/badge/Hacktoberfest-Touch%20Grass-f97316?style=for-the-badge" alt="Hacktoberfest Touch Grass" />
  </a>
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=111827" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Gemma-2B-4285f4?style=for-the-badge" alt="Gemma 2B" />
  <img src="https://img.shields.io/badge/Temporal-durable%20workflows-111827?style=for-the-badge" alt="Temporal" />
</p>

<p align="center">
  <a href="#-why-wildproof">Why WildProof</a> ·
  <a href="#-how-it-works">How It Works</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-challenge-evidence">Challenge Evidence</a>
</p>

---

## 🧠 TL;DR

WildProof turns a short walk into a small field investigation:

> Choose a mission → collect notes and photo evidence → save locally → generate a structured report → see what is observed, inferred, or still unknown.

The app is built for the **Hacktoberfest Open-Source AI Challenge: Week 1 - Touch Grass**. It uses local Gemma 2B inference through Ollama, IndexedDB for offline evidence capture, and Temporal for durable analysis.

<p align="center">
  <a href="https://github.com/JaniDhruv/wildproof">View the repository</a> ·
  <a href="https://dev.to/challenges/hacktoberfest-week1-2026-10-05">View the challenge</a>
</p>

> **MVP status:** working and honest about its boundaries. The current Gemma path analyzes written notes and photo metadata. It does not send image pixels to a vision model.

## 🌿 Why WildProof?

Most outdoor apps optimize for routes, reminders, or streaks. WildProof optimizes for **attention and evidence**.

It gives a walk a lightweight purpose without turning the experience into another feed:

1. Pick a mission such as **Habitat Comparison** or **Pattern Hunt**.
2. Leave the screen and observe the world.
3. Capture notes and photo evidence references.
4. Keep collecting when connectivity disappears.
5. Return to analysis when a backend is available.
6. Review a report that makes uncertainty visible.

The product rule is simple:

> **Never let a successful-looking report hide an unsuccessful analysis.**



## 🗺️ How It Works

```text
┌──────────────────┐
│ Choose a mission │
└────────┬─────────┘
         v
┌────────────────────────────┐
│ Capture notes + photo refs │
└────────────┬───────────────┘
             v
┌────────────────────────────┐
│ Persist locally in IndexedDB│
└────────────┬───────────────┘
             │
             ├── Offline: keep collecting
             v
┌────────────────────────────┐
│ FastAPI + Ollama + Gemma   │
└────────────┬───────────────┘
             v
┌────────────────────────────┐
│ Temporal durable workflow  │
└────────────┬───────────────┘
             v
┌────────────────────────────┐
│ Evidence-aware field report│
└────────────────────────────┘
```

### The report contract

WildProof asks the model for a strict JSON report instead of an open-ended paragraph:

```json
{
  "summary": "A concise expedition summary.",
  "observations": [
    {
      "claim": "A claim grounded in the submitted evidence.",
      "confidence": "observed",
      "supportingEvidenceIds": ["note-1"]
    }
  ],
  "missing_evidence": ["What would strengthen the conclusion."],
  "suggested_next_step": "One practical next action."
}
```

Every observation is classified as:

| Label | Meaning |
| --- | --- |
| `observed` | Directly supported by a note or evidence reference |
| `inferred` | A reasoned deduction from the available evidence |
| `unknown` | Not supported enough to make a reliable claim |

## ✨ Features

| Feature | What it does |
| --- | --- |
| **Mission-based fieldwork** | Gives an outdoor walk a concrete observation goal |
| **Offline-first capture** | Saves expeditions, notes, and photo references in IndexedDB |
| **Local open-weight AI** | Uses Gemma 2B through Ollama for structured analysis |
| **Uncertainty-aware reports** | Separates observed facts, inferences, and unknowns |
| **Durable analysis** | Uses Temporal activities for normalization, AI analysis, validation, scoring, and persistence |
| **Visible failure states** | Labels mock fallback output instead of presenting it as real model output |
| **Quality scoring** | Provides a transparent baseline score from evidence features |
| **Reproducible experiment** | Includes a baseline-versus-TabPFN experiment for small tabular data |
| **Optional observability** | Supports Sentry frontend and backend instrumentation |

## 🤖 Open AI at the Center

The analysis path runs locally rather than requiring a proprietary hosted AI API:

```text
React + IndexedDB
        │
        v
FastAPI /analyze
        │
        v
Ollama → Gemma 2B
        │
        v
Pydantic-validated FieldReport
```

The backend sends Gemma the mission type, written notes, and photo metadata. Photo pixels remain local and are not interpreted by the current text-only model path.

If Gemma returns malformed JSON:

1. The API attempts one repair pass.
2. The repaired response is validated against the report schema.
3. A second failure becomes an explicit error instead of a fabricated success.

If Ollama is unavailable, the user's expedition remains available locally and the UI can show a clearly labeled fallback state.

## 🏗️ Architecture

### Frontend

- React 19 and TypeScript
- Vite
- IndexedDB through `idb`
- Tailwind CSS
- React Router
- PWA-ready tooling
- `@sentry/react`

### Backend and workflow layer

- FastAPI
- Pydantic 2
- Ollama with `gemma:2b`
- Temporal workflows and activities
- `sentry-sdk[fastapi]`
- Baseline evidence-quality scoring

### Evidence boundary

Photos are currently stored as local evidence references. The text-only Gemma path receives written notes and photo metadata, not image pixels. This keeps the current product claim narrow and reproducible while leaving a clear path for a future local vision model.

## 📊 What Is Implemented?

| Area | Status | Notes |
| --- | :---: | --- |
| Mission selection | ✅ | Habitat Comparison and Pattern Hunt flows |
| Notes and photo capture | ✅ | Evidence persists locally |
| Offline persistence | ✅ | IndexedDB-backed expedition storage |
| Gemma analysis | ✅ | Local Ollama path for notes and metadata |
| Structured validation | ✅ | Pydantic report schema |
| Temporal workflow | ✅ | Durable multi-activity analysis path |
| Runtime quality score | ✅ | Explicitly labeled baseline heuristic |
| TabPFN runtime | ⚠️ | Reproducible experiment; fallback used when runtime is unavailable |
| Image understanding | ⏳ | Planned local vision-model extension |
| Audio and geolocation | ⏳ | Planned future capabilities |

## 🏆 Challenge Evidence

WildProof targets categories through working evidence rather than feature-name dropping.

### Overall Winner

WildProof directly answers **Touch Grass** by turning time outdoors into purposeful evidence gathering rather than another screen-based reminder.

### Best Use of Gemma

Gemma is the core open-weight model that converts field notes and mission context into an uncertainty-aware JSON report.

### Best Use of Temporal

Temporal coordinates the analysis activities so model failures can retry without discarding evidence collected during the expedition.

### Best Use of Sentry

Sentry hooks cover frontend and FastAPI errors, request timing, and model/workflow failures when `SENTRY_DSN` is configured.

### Best Use of Render

Render deployment configuration is included for hosting the frontend and backend. A verified public URL should be added to the submission post after end-to-end deployment testing.

### Best Use of GitHub Copilot

GitHub Copilot supported product exploration, implementation, review, debugging, validation, and the final accuracy pass on the project's technical claims.

### Best Use of TabPFN

[`api/tabpfn_experiment.py`](api/tabpfn_experiment.py) contains a reproducible baseline-versus-TabPFN experiment for small tabular evidence-quality data. The production endpoint uses an explicitly labeled baseline when the installed TabPFN/Torch combination is unavailable.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- [Ollama](https://ollama.com/)
- Optional: Temporal CLI

Pull the local model:

```bash
ollama pull gemma:2b
```

### Install the frontend

```bash
npm install
```

### Create the Python environment

**Windows PowerShell**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r api/requirements.txt
```

**macOS/Linux**

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r api/requirements.txt
```

### Configure optional Sentry

Copy `.env.example` to `.env` and set `SENTRY_DSN` if you want error and performance events. The app works without Sentry.

### Start the frontend

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Start the FastAPI backend

From the repository root:

```bash
uvicorn api.main:app --reload --port 8000
```

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | API and quality-model status |
| `POST` | `/analyze` | Direct Gemma analysis |
| `POST` | `/analyze-durable` | Temporal-backed analysis |
| `POST` | `/predict-quality` | Baseline quality score |
| `GET` | `/sentry-debug` | Intentional test error |

### Start Temporal locally

In a separate terminal:

```bash
temporal server start-dev
python api/temporal_worker.py
```

The frontend uses the durable path by default and includes a switch for the direct FastAPI path.

## 🧪 Validation

```bash
npm run lint
npm run build
python -m compileall api
```

To run the TabPFN experiment, use an environment compatible with its pinned PyTorch dependency:

```bash
python api/tabpfn_experiment.py
```

## 🛣️ Roadmap

- Add an opt-in local vision-model path for image-aware analysis.
- Add audio capture and local sound transcription.
- Add opt-in geolocation with clear privacy controls.
- Compare repeated observations over time.
- Replace synthetic quality data with a human-labeled field dataset.
- Add background synchronization when connectivity returns.

## 🤝 Contributing

Issues and pull requests are welcome. When adding an AI capability, document:

1. What evidence the model actually receives.
2. Which outputs are observed, inferred, or unknown.
3. What happens when the model or network is unavailable.
4. How the change can be tested locally.

## 📄 License

MIT
