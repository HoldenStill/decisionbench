# Granular Engineering Tasks: DecisionBench

## Phase 1: Project Foundations & Core Artifacts
- [x] Initialize git repository and directory structure
- [x] Create implementation plan artifact
- [x] Initialize `TASKS.md` with granular engineering checklist
- [x] Create `PROJECT_STATE.md` with milestone tracker, ADRs, and verification log
- [x] Create `ARCHITECTURE.md` with system design, SQLite schema, and pipeline flow
- [x] Create `.gitignore` for Python, Node, Vite, SQLite, and sensitive files
- [x] Create `README.md` with product overview, architecture summary, and quickstart guide
- [x] Create `TRUENAS_SETUP.md` with TrueNAS SCALE Custom App guide, dataset permissions, and Docker Compose

## Phase 2: Backend Architecture & Core Engine
- [x] Set up Python environment dependencies in `backend/requirements.txt`
- [x] Implement `backend/app/config.py` (paths, data dir, environment variables)
- [x] Implement `backend/app/crypto.py` (Fernet encryption at rest, key generation, key masking `sk-or-...xxxx`)
- [x] Implement `backend/app/database.py` (aiosqlite manager, WAL mode, foreign keys, schema creation)
- [x] Define Pydantic models in `backend/app/models/`:
  - [x] `settings.py` (API key, default models, pinned models, threshold defaults)
  - [x] `scenarios.py` (Saved scenario templates, categories, state modes)
  - [x] `decisions.py` (Noul, Choice, Score primitives, OpenRouter request/response shapes, derived telemetry)
  - [x] `runs.py` (Historical execution ledger, filters, exports)
- [x] Implement `backend/app/services/scenario_seeder.py` with 4 rich built-in scenarios:
  - [x] Hardware Architecture Dilemma (`choice` + `noul`)
  - [x] Agent Tool-Call Safety Gate (`noul` + `score`)
  - [x] Customer Support Triage & SLA Router (`choice` + `noul` + `score`)
  - [x] Account Signup Fraud & Bot Triage (JSON state + `noul`)
- [x] Implement `backend/app/services/compiler.py` (Stage 1 chat completions with strict JSON Schema and Neutrality Guardrail)
- [x] Implement `backend/app/services/decision_engine.py` (Stage 2 `/api/alpha/decisions`, math metrics: Shannon entropy, normalized certainty, Top-2 margin, scale costs, deltas, 3x consistency sweep, side-by-side comparison)
- [x] Implement FastAPI routers in `backend/app/routers/`:
  - [x] `health.py` (`GET /api/health`)
  - [x] `settings.py` (`GET /api/settings`, `POST /api/settings`, `POST /api/settings/test-connection`)
  - [x] `models.py` (`GET /api/models`)
  - [x] `decisions.py` (`POST /api/decisions/compile`, `POST /api/decisions/execute`)
  - [x] `scenarios.py` (CRUD: `GET`, `POST`, `PUT`, `DELETE /api/scenarios`)
  - [x] `runs.py` (History ledger: `GET`, `GET /:id`, `DELETE /:id`, export)
- [x] Implement `backend/app/main.py` (FastAPI app, lifespan startup/seeding, static SPA mount)
- [x] Write backend test suite in `backend/tests/`:
  - [x] `test_crypto.py` (Fernet encryption/decryption, masking, permission handling)
  - [x] `test_database.py` (WAL mode, schema creation, settings, scenario seeding)
  - [x] `test_compiler.py` (Stage 1 prompt parsing, neutral criteria synthesis, schema validation)
  - [x] `test_decisions.py` (Stage 2 execution for Noul, Choice, Score, entropy math, direct re-run deltas, 3x sweep, comparison)
  - [x] `test_scenarios_and_runs.py` (Scenario CRUD, runs logging, pagination, export)
- [x] Execute `pytest` suite and verify 100% passing tests

## Phase 3: Frontend Architecture & UI/UX ("Precision Telemetry Instrument")
- [x] Scaffold Vite + React + TypeScript app in `frontend/`
- [x] Configure Tailwind CSS with dark telemetry palette (Zinc 950 `#09090b`, `#111114`, `#18181c`, `#27272a`, Amber `#f59e0b`, Emerald `#10b981`, Cyan `#06b6d4`, Rose `#f43f5e`, tabular-nums JetBrains Mono)
- [x] Define comprehensive TypeScript types in `frontend/src/types/index.ts`
- [x] Implement API client in `frontend/src/api/client.ts`
- [x] Implement utility functions:
  - [x] `frontend/src/utils/math.ts` (Shannon entropy, normalized certainty, Top-2 margin, scale cost calculations)
  - [x] `frontend/src/utils/codeGen.ts` (Python httpx, TypeScript fetch, cURL generator with threshold logic)
  - [x] `frontend/src/utils/formatters.ts` (Latency, micro-dollar, percentage formatters)
- [x] Implement layout components:
  - [x] `Header.tsx` (Logo, API key status pill, settings button, mode indicators)
  - [x] `Sidebar.tsx` (Saved scenarios, starter presets, recent runs ledger with search & reload)
  - [x] `SettingsModal.tsx` (Encrypted API key input, connection tester, default model selectors, custom model slugs)
- [x] Implement Mode 1: Omni-Prompt & Intake:
  - [x] `OmniComposer.tsx` (Multi-line prompt input, Cmd+Enter shortcut, model selectors, 3x sweep toggle, compare toggle, stage indicator)
  - [x] `ModelSelector.tsx` (Dropdown selector with tags: Free, Flash, Precision, Default, and pricing)
- [x] Implement Result Cards & Probability Visualizers:
  - [x] `DecisionCard.tsx` (Master container for question visualizers, extracted state inspector, action toolbar)
  - [x] `NoulVisualizer.tsx` (0.000-1.000 gauge, 0.50 tick, threshold bands, distance-from-50% certainty, verdict badge)
  - [x] `ChoiceVisualizer.tsx` (Ranked horizontal bars, winning badge, Top-2 margin $\Delta P$, Shannon entropy, criteria description expander)
  - [x] `ScoreVisualizer.tsx` (Continuous expected value needle gauge, discrete level bars, rubric labels)
  - [x] `SplitTelemetryRibbon.tsx` (Stage 1 vs Stage 2 latency, tokens, micro-cost, scale cost per 1k / 1M decisions)
  - [x] `ExtractedStateInspector.tsx` (Inline editable state & criteria descriptions, +/- option controls, primitive switcher)
  - [x] Real-time "Re-Run Decision Model (Bypass Parser)" loop with delta calculation (`+14.2%` / `-8.5%`)
- [x] Implement Mode 2: Direct Schema Workbench:
  - [x] `DirectWorkbench.tsx` (State composer + dynamic questions stack + execute toolbar)
  - [x] `StateEditor.tsx` (Toggle between Raw Text/Markdown and Structured JSON Key-Value Builder)
  - [x] `QuestionStack.tsx` (Add, duplicate, reorder, delete questions)
  - [x] `NoulEditor.tsx` (Instructions, true/false criteria, interactive tri-state threshold slider)
  - [x] `ChoiceEditor.tsx` (2-255 options, auto-slugify, bulk paste modal, criteria descriptions)
  - [x] `ScoreEditor.tsx` (2-10 levels, ordered 0..N-1, rubric descriptions)
- [x] Implement Drop-in Code & Telemetry Drawer:
  - [x] `CodeDrawer.tsx` (Compiled request JSON, raw response JSON, Python httpx snippet, TypeScript fetch snippet, cURL snippet)
- [x] Implement Tutorial & Guide Modal:
  - [x] `TutorialModal.tsx` (5-tab interactive walkthrough: Quickstart, Auto-Compile, Primitives, Direct Workbench, Anti-Bias Tuning)
  - [x] Header question mark button trigger (`<HelpCircle />`)
- [x] Implement Comparison & Consistency Views:
  - [x] `ComparisonCard.tsx` (Side-by-side comparison for 2 models evaluated on identical schema)
  - [x] Consistency Sweep display (Mean, standard deviation, stability index across 3x runs)
- [x] Verify clean TypeScript build (`tsc`) and Vite production bundle

## Phase 4: Containerization & TrueNAS SCALE Packaging
- [x] Create multi-stage `Dockerfile` (Node 20 build -> Python 3.12/3.13 slim with gosu and curl)
- [x] Create `entrypoint.sh` with `PUID`/`PGID` permission fixes and gosu privilege drop
- [x] Create `docker-compose.yml` with healthcheck, `./data` volume, env vars
- [x] Validate container build and startup instructions in `TRUENAS_SETUP.md`

## Phase 5: Verification & End-to-End Walkthrough
- [x] Run full backend test suite (`pytest`) and capture logs
- [x] Run frontend build test (`npm run build`)
- [x] Update `PROJECT_STATE.md` with final verification log and milestone status
- [x] Create final walkthrough artifact
