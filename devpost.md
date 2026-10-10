*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05)*

## What I Built

Most “go outside” apps stop at reminders, routes, or motivational messages.

I built **WildProof**, an offline-first field observation app that turns a short walk into a structured outdoor mission.

It is designed for hikers, citizen scientists, students, and anyone who wants to spend less time scrolling and more time paying attention to the world around them.

A WildProof expedition looks like this:

1. Choose a mission, such as **Habitat Comparison** or **Pattern Hunt**.
2. Go outside and collect evidence.
3. Capture photos and write field notes.
4. Save everything locally, even without an internet connection.
5. Return to connectivity and generate an AI-assisted field report.
6. Review what was directly observed, what was inferred, and what is still unknown.

WildProof is intentionally not a “guess the species from this photo” app. It does not present uncertain AI guesses as facts.

Instead, every report separates:

- **Observed** — directly supported by the submitted evidence.
- **Inferred** — a reasonable deduction from the evidence.
- **Unknown** — something that needs more evidence before making a claim.

The goal is simple:

> Go outside with a question, come back with evidence.

## Demo

Live demo: **[ADD DEPLOYED DEMO URL]**

The main demo flow is:

- Start a Pattern Hunt mission.
- Add photos and field notes.
- Generate a report through the durable analysis workflow.
- Review the confidence labels and missing evidence.
- Inspect the quality score and suggested next step.

## Code

{% github JaniDhruv/wildproof %}

Repository: [github.com/JaniDhruv/wildproof](https://github.com/JaniDhruv/wildproof)

The project is released under the MIT License.

## How I Built It

WildProof is built as a React and TypeScript progressive web app with a small FastAPI backend.

### Offline-first evidence capture

The frontend stores expeditions in IndexedDB using the `idb` package.

That means a user can:

- Start a mission without signing in.
- Capture evidence without a network connection.
- Refresh the page without losing the expedition.
- Return to analysis later when a backend is available.

The app currently stores photo evidence and written field notes locally. Photos are treated as evidence references, while the current text-only Gemma workflow analyzes the notes and photo metadata rather than claiming to visually identify image contents.

### Local open-weight AI

The core analysis uses **Gemma 2B through Ollama**.

The backend sends the mission type and collected field notes to Gemma and requests a strict JSON report containing:

```json
{
  "summary": "...",
  "observations": [
    {
      "claim": "...",
      "confidence": "observed",
      "supportingEvidenceIds": ["..."]
    }
  ],
  "missing_evidence": ["..."],
  "suggested_next_step": "..."
}
```

The response is validated before it reaches the frontend. If Gemma returns malformed JSON, the backend attempts one repair pass. If the local model is unavailable, WildProof shows a clearly labeled mock fallback rather than pretending that a real AI report was generated.

### Durable analysis with Temporal

AI inference can fail because of model timeouts, unavailable local services, or temporary infrastructure problems.

WildProof includes a Temporal workflow for the analysis path:

```text
Normalize evidence
        ↓
Run Gemma analysis
        ↓
Validate the report
        ↓
Calculate evidence quality
        ↓
Return the durable report
```

The frontend uses the Temporal-backed endpoint by default, with a switch available for the direct FastAPI path.

The important part is that a failed activity can be retried without losing the evidence collected during the walk or restarting the entire expedition.

### Evidence quality scoring

WildProof calculates a field-data quality score from structured evidence features such as:

- Number of photos.
- Number of notes.
- Total note length.
- Expedition duration.

The project includes a reproducible TabPFN experiment for small tabular datasets. The production path currently reports a baseline heuristic when the local TabPFN runtime is unavailable, and labels that result honestly in the UI.

This was an intentional design decision: a transparent baseline is better than silently claiming that a model is running when the environment cannot support it.

### Observability

The frontend and backend are instrumented with Sentry.

The project tracks:

- Request failures.
- Model analysis errors.
- Request and analysis timing.
- Frontend errors.
- Durable workflow failures.

This makes it possible to inspect not only whether an expedition completed, but also how long analysis took and where failures occurred.

## Why Does Open Innovation Matter?

WildProof depends on open innovation because the app is about trust, privacy, and control over personal observations.

Outdoor evidence can include:

- Photos from private locations.
- Precise movement patterns.
- Notes about a person's home or routine.
- Observations from places where connectivity is unreliable.

A closed, cloud-only API would make it difficult to build an experience that works offline or gives users meaningful control over where their data goes.

Using an open-weight model through local inference makes several things possible:

- The basic analysis can run without sending field notes to a proprietary service.
- The application can continue working in areas with poor connectivity.
- The model workflow can be inspected and changed.
- The output format can enforce explicit uncertainty.
- Developers can reproduce the project without depending on one closed provider.

Open innovation also makes failure easier to discuss honestly. Instead of hiding behind a polished API response, I can show where the model failed, how the report was validated, and when the application had to fall back to a simpler method.

For WildProof, open AI is not just a cheaper way to add a chatbot. It is what makes a privacy-aware, offline-first, uncertainty-aware field tool practical.

## What I Learned

The hardest part was not sending a prompt to a model.

The harder problems were:

- Designing an output schema that does not reward confident hallucinations.
- Preserving evidence when the network disappears.
- Making AI failures visible without losing the user's work.
- Making durable workflows useful instead of merely adding infrastructure.
- Being honest when a dependency such as TabPFN cannot run in the current environment.

The most important product rule became:

> Never let a successful-looking report hide an unsuccessful analysis.

That is why WildProof labels mock fallback reports, distinguishes baseline scoring from model scoring, and exposes uncertainty directly in the interface.

## My Agent Session

I used GitHub Copilot to review WildProof's implementation against the challenge requirements and tighten the product's technical claims before submission.

{% agent_session building-wildproof-for-hacktoberfest-touch-grass-gthham %}

The session captures the review that shaped the final MVP: identifying where the first implementation overstated its capabilities, separating photo metadata from image understanding, making fallback behavior visible, documenting TabPFN's runtime limitation, and aligning the prize-category claims with verifiable implementation evidence.

This is a focused engineering review rather than a complete raw chat export. It shows how the implementation was challenged, corrected, and made more honest before submission. The session is available on DEV at [Building WildProof for Hacktoberfest Touch Grass](https://dev.to/agent_sessions/building-wildproof-for-hacktoberfest-touch-grass-gthham).

## Prize Categories

I am entering the following categories:

### Overall Winner

WildProof directly addresses the Touch Grass theme by turning time outside into a meaningful evidence-gathering activity rather than another screen-based reminder.

### Best Use of Gemma

Gemma is the core model used to transform field notes and expedition metadata into structured, uncertainty-aware reports.

### Best Use of Temporal

Temporal coordinates the durable analysis workflow and allows model activities to retry without losing the expedition.

### Best Use of Sentry Agent Tracing

Sentry is used to observe model analysis failures, request timing, workflow failures, and frontend/backend errors.

### Best Use of Render

The deployed application and backend are intended to run on Render.

### Best Use of GitHub Copilot

GitHub Copilot was used throughout the project to explore the product direction, implement the frontend and backend, review runtime behavior, identify integration gaps, and improve the accuracy of the submission claims.

### Best Use of TabPFN

WildProof includes a reproducible TabPFN experiment for expedition-quality prediction. The deployed fallback is explicitly labeled as a baseline heuristic when TabPFN is unavailable in the runtime environment.

## What's Next

The next version of WildProof could add:

- Local vision-model support for image-aware analysis.
- Audio capture and local sound transcription.
- Opt-in geolocation.
- Historical comparisons between repeated observations.
- A larger human-labeled dataset for evidence-quality scoring.
- Better offline synchronization when connectivity returns.

For now, WildProof is intentionally small: choose a mission, go outside, collect evidence, and return with a report that is honest about what was actually observed.

Thanks for participating in Hacktoberfest!
