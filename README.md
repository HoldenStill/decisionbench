# DecisionBench

**System One Decision Workbench & NL-to-Decision Studio**

DecisionBench is a self-hosted web application for interacting with, visualizing, and benchmarking **System One (structured decision) AI models** via OpenRouter's Decisions API (`POST https://openrouter.ai/api/alpha/decisions`), with first-class support for TypeSafe's **Jev** family (`typesafe/jev-latest`, `typesafe/jev-1.14`, `typesafe/jev-1.13`) alongside models like `openai/gpt-6-luna-decisions`, `inception/mercury-decide:free`, and `microsoft/microsoft-decision-1`.

---

## Key Features

1. **Natural-Language Prompt-to-Decision Studio**:
   - Speak your dilemma in plain conversational English.
   - Ultra-fast / free Stage-1 parser LLM (`openrouter/free`, `inclusionai/ling-3.0-flash`, `openai/gpt-6-luna`) compiles messy prompts into typed decision schemas (`noul`, `choice`, `score`).
   - **Criteria Neutrality Guardrail**: Automatically expands bare option names into balanced, symmetrical criteria descriptions so the parser never injects bias into the probability calculation.
2. **Live Tweak & Re-Run Loop**:
   - Inspect extracted criteria directly inside the Decision Result Card.
   - Edit criteria, inject new options on the fly, or change primitive types.
   - Click **"Re-Run Decision Model"** to bypass Stage 1 entirely and re-evaluate via Jev in ~200ms with real-time probability shift deltas (`+14.2%` / `-8.5%`).
3. **Direct Schema Workbench**:
   - Precision builder for crafting multi-question decision payloads from scratch.
   - State editor supporting raw Markdown text and structured JSON key-value objects.
   - Interactive tri-state threshold slider for `noul` decisions (`Reject < 0.35`, `Review 0.35–0.75`, `Commit >= 0.75`).
   - Bulk-paste option generator for `choice` (up to 255 options).
   - Ordered rubric builder for `score` (2 to 10 levels).
4. **Precision Telemetry Instrument UI**:
   - Dark Linear/Raycast/Grafana-inspired telemetry aesthetic.
   - Tabular numbers for pixel-perfect vertical alignment of probabilities and micro-dollar costs.
   - Continuous scale needles and discrete probability distribution bar charts.
   - Shannon entropy, normalized certainty, and Top-2 margin ($\Delta P$).
   - Split telemetry ribbon showing Stage 1 vs Stage 2 latency, tokens, cost, and scale projections ($/1k and $/1M decisions).
5. **Drop-In Code Generator**:
   - 1-click export of production-ready code in Python (`httpx`), TypeScript (`fetch`), and cURL, incorporating your configured threshold gating logic.
6. **Self-Hosted Security & TrueNAS Native**:
   - OpenRouter API key is encrypted at rest using Fernet encryption (`cryptography.fernet.Fernet`).
   - SQLite Write-Ahead Logging (`WAL`) concurrency with single-folder backup.
   - Native TrueNAS SCALE support with `PUID`/`PGID` permission handling.

---

## Quickstart (Local Development)

### Prerequisites
- Python 3.12+ (or 3.13+)
- Node.js 20+ and npm
- An OpenRouter API key

### 1. Backend Setup
```bash
# In decisionbench/
python -m venv .venv
# On Linux/macOS: source .venv/bin/activate
# On Windows: .venv\Scripts\activate

cd backend
pip install -r requirements.txt

# Run backend development server on port 8000
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend dev server starts at `http://localhost:5173` with an automatic proxy forwarding `/api` calls to `http://localhost:8000`.

---

## Docker Deployment

Run with Docker Compose:
```bash
docker compose up -d
```
Visit `http://<your-server-ip>:8000`.

Configure your OpenRouter API key in the top-right Settings modal or pass `OPENROUTER_API_KEY` in the environment.

---

## TrueNAS SCALE Deployment
See [TRUENAS_SETUP.md](TRUENAS_SETUP.md) for full instructions on setting up DecisionBench as a Custom App with host-path storage and `1000:1000` dataset permissions.
