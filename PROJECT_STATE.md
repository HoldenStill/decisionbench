# Project State: DecisionBench

**System One Decision Workbench & NL-to-Decision Studio**

---

## 1. Current Goal & Milestone Status

- **Active Goal**: Implement DecisionBench end-to-end (backend, frontend, container packaging, TrueNAS setup, and documentation).
- **Current Milestone**: Complete — Verified and Packaged for Deployment.

| Milestone | Status | Details |
|---|---|---|
| **Phase 1: Project Foundations** | **Completed** | Repository initialized, `TASKS.md`, `PROJECT_STATE.md`, `ARCHITECTURE.md`, `README.md`, `TRUENAS_SETUP.md` created. |
| **Phase 2: Backend & Decision Engine** | **Completed** | FastAPI app, SQLite WAL, Fernet crypto, OpenRouter compiler and decisions services, seed scenarios, 14 passing unit tests. |
| **Phase 3: Frontend & Telemetry UI** | **Completed** | React 18 + TS + Tailwind SPA, OmniComposer, Result cards, Live tweak loop, Direct Schema Workbench, Code drawer. |
| **Phase 4: Packaging & TrueNAS Setup** | **Completed** | Multi-stage Dockerfile, `entrypoint.sh` (PUID/PGID), `docker-compose.yml`, tested container run. |
| **Phase 5: Verification & Walkthrough** | **Completed** | Pytest suite (14/14 passed), Vite production build, container healthcheck verified, walkthrough artifact created. |

---

## 2. Architecture Decision Records (ADR)

### ADR-001: Two-Stage Natural Language to Decision Compilation
- **Context**: OpenRouter's System One models (`typesafe/jev-latest`, `typesafe/jev-1.14`, etc.) operate exclusively on `POST https://openrouter.ai/api/alpha/decisions`. They do not accept conversational text or chat completions. They evaluate structured `state` and typed `questions` (`noul`, `choice`, `score`) with explicit `criteria`.
- **Decision**: Implement a two-stage compilation pipeline:
  1. **Stage 1 (Compiler)**: Calls OpenRouter's chat completions (`/api/v1/chat/completions`) using free or ultra-low-cost fast models (`openrouter/free`, `inclusionai/ling-3.0-flash`, `openai/gpt-6-luna`) with strict JSON Schema structured outputs to convert conversational prompts into structured `state` + `questions`.
  2. **Stage 2 (System One Engine)**: Takes the compiled schema and sends it directly to `/api/alpha/decisions` to evaluate probabilities.
- **Consequence**: Users get conversational ease with mathematical precision. Direct runs and card tweaks can bypass Stage 1 entirely to run in ~200ms.

### ADR-002: Criteria Neutrality Guardrail for Stage-1 Criteria Synthesis
- **Context**: System One decision models **never inspect option keys** (such as `"sqlite"` or `"postgres"`). They compute probabilities based entirely on the text provided in the `criteria` descriptions. If the Stage-1 parser writes an unbalanced, flattering description for one option and a weak description for another, it biases Stage 2's probability evaluation.
- **Decision**: The Stage-1 system prompt enforces strict criteria symmetry:
  - Both or all options must receive descriptions of equal depth, factual weight, and neutral tone.
  - No comparative adjectives or subjective endorsements are allowed.
  - The UI exposes an inline criteria editor so users can inspect and modify synthesized criteria before or after running Stage 2.
- **Consequence**: Protects against compiler-induced bias and empowers the user to fine-tune the decision model's exact input parameters.

### ADR-003: Credential Encryption at Rest with Fernet
- **Context**: Self-hosted home server users require secure credential storage for OpenRouter API keys. Storing plaintext API keys in a database or exposing raw keys to browser storage poses significant security risks.
- **Decision**:
  - The OpenRouter API key is encrypted using `cryptography.fernet.Fernet` before storage in the SQLite `settings` table.
  - The encryption key is sourced from `DECISIONBENCH_SECRET_KEY` environment variable, or auto-generated at `/app/data/.secret_key` with strict `0600` file permissions.
  - API keys are masked (`sk-or-...xxxx`) when returned to the frontend.
  - Raw API keys are never stored in browser `localStorage`.
  - Fallback to `OPENROUTER_API_KEY` environment variable is supported when no key is configured in the database.
- **Consequence**: High security posture suitable for self-hosted instances on home servers and VPSs.

### ADR-004: SQLite WAL Concurrency and Schema Design
- **Context**: DecisionBench is designed for single-node and home server deployments (TrueNAS, Unraid, Docker) where zero external database dependencies (like external PostgreSQL containers) streamline backups and maintenance.
- **Decision**: Use SQLite via `aiosqlite` located at `/app/data/decisionbench.db`. Enable `PRAGMA journal_mode=WAL;` and `PRAGMA foreign_keys=ON;` on every connection.
- **Consequence**: Concurrent reads and writes execute without lock contention while keeping backups as simple as copying the `./data` folder.

### ADR-005: TrueNAS SCALE User Permissions (`PUID`/`PGID`)
- **Context**: TrueNAS SCALE host-path datasets frequently cause permission conflicts when containers run as root or mismatched user IDs.
- **Decision**: Provide an `entrypoint.sh` script that respects `PUID` and `PGID` environment variables (defaulting to `1000:1000`), recursively adjusts `/app/data` ownership on startup, and drops root privileges using `gosu` before starting FastAPI.
- **Consequence**: Out-of-the-box compatibility with TrueNAS SCALE Custom Apps and standard Docker hosts without file permission errors.

---

## 3. Verification Log

| Date | Scope | Command | Result | Notes |
|---|---|---|---|---|
| 2026-10-15 | Backend tests | `pytest -v backend` | **14 / 14 Passed** (100%) | Verified WAL mode, Fernet encryption roundtrip, masking, Stage 1 compilation, Stage 2 decision execution, delta calculation, and scenario CRUD. |
| 2026-10-15 | Frontend build | `npm run build` (tsc & vite) | **Passed** (0 errors) | TypeScript strict typecheck passed, production bundle emitted to `frontend/dist/`. |
| 2026-10-15 | Container build & healthcheck | `docker build` & `docker run` | **Passed** (HTTP 200) | Multi-stage Docker build, PUID/PGID gosu privilege dropping, `/api/health` returning `status: healthy, journal_mode: wal`, and SPA `index.html` static serving verified. |
| 2026-10-22 | Frontend build (Tutorial Modal) | `npm run build` (tsc & vite) | **Passed** (0 errors) | Implemented interactive Tutorial & Guide modal with top Header question mark trigger and multi-tab guidance. |
| 2026-10-22 | Backend & Model Resilience | `pytest -v backend` & `npm run build` | **15 / 15 Passed** (100%) | Added alias resolution for `typesafe/jev-latest` -> `typesafe/jev-router`, `max_tokens: 4096`, OpenRouter response-healing plugin, and resilient JSON repair. |
