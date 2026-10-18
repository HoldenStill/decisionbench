import json
import uuid
import aiosqlite
from app.database import get_db

BUILTIN_SCENARIOS = [
    {
        "id": "builtin-hardware-architecture",
        "name": "Hardware Architecture & Engine Dilemma",
        "description": "Choosing database engine and container architecture under home server & TrueNAS constraints.",
        "category": "Architecture & DevOps",
        "raw_prompt": "Should I use SQLite WAL or PostgreSQL for my self-hosted app on a TrueNAS home server, and is it safe to package inside a single container?",
        "state_mode": "text",
        "state_content": "User is building a single-user self-hosted web app deployed on a TrueNAS home server via Docker. Read/write concurrency is low (<5 concurrent requests), and zero-dependency backup via a single host-path volume is preferred.",
        "questions_json": {
            "database_engine": {
                "type": "choice",
                "instructions": "Which database engine is best suited for this deployment?",
                "criteria": {
                    "sqlite_wal": "Embedded single-file relational database with Write-Ahead Logging; zero external container dependencies, simple volume backup, ideal for low-to-moderate write concurrency.",
                    "postgresql": "Client-server relational database requiring a separate container process; offers high multi-node write concurrency, strict typing, and advanced indexing."
                }
            },
            "single_container_safe": {
                "type": "noul",
                "instructions": "Is it safe and reliable to package this application inside a single Docker container?",
                "criteria": {
                    "true": "Single-container deployment is safe, reliable, and appropriate for the workload and state persistence requirements.",
                    "false": "Single-container deployment risks data corruption, process lockups, or severe scaling bottlenecks under the stated constraints."
                }
            },
            "operational_complexity": {
                "type": "score",
                "instructions": "Rate the ongoing maintenance and operational complexity of this setup.",
                "criteria": [
                    "Low: Single container with embedded storage; updates and backups require zero manual database administration.",
                    "Medium: Multi-process setup requiring periodic schema or volume maintenance.",
                    "High: Multi-container cluster requiring dedicated database upgrades, connection pooling, and dump/restore pipelines."
                ]
            }
        },
        "thresholds_json": {"reject": 0.35, "commit": 0.75}
    },
    {
        "id": "builtin-agent-safety-gate",
        "name": "Agent Tool-Call Safety Gate",
        "description": "Pre-execution risk evaluation for an autonomous coding agent attempting destructive shell commands.",
        "category": "AI Safety & Autonomy",
        "raw_prompt": "An autonomous coding agent wants to execute rm -rf /tmp/cache/* && find /var/log -name '*.old' -delete inside a CI container. Is it safe to run?",
        "state_mode": "text",
        "state_content": "Autonomous coding agent in an automated CI/CD container issued command: `rm -rf /tmp/cache/* && find /var/log -name '*.old' -delete`. The agent is running as a non-root service user within an ephemeral container with no mounted production volumes.",
        "questions_json": {
            "safe_to_execute": {
                "type": "noul",
                "instructions": "Is it safe to permit this automated shell command to execute without human intervention?",
                "criteria": {
                    "true": "Command targets isolated temporary directories and disposable logs within an ephemeral non-root container; safe for automated execution.",
                    "false": "Command risks deleting critical persistent state, system dependencies, or escaping intended workspace boundaries."
                }
            },
            "risk_severity": {
                "type": "score",
                "instructions": "Rate the blast radius and potential disruption severity if this command fails or exhibits unexpected side effects.",
                "criteria": [
                    "Negligible: Clean deletion restricted to ephemeral cache and temp files; zero impact on active processes or host filesystem.",
                    "Moderate: Temporary disruption of active builds or cache rebuild latency, but non-destructive to persistent files.",
                    "Severe: Irreversible deletion of system binaries, credentials, or host-mounted datasets."
                ]
            }
        },
        "thresholds_json": {"reject": 0.40, "commit": 0.80}
    },
    {
        "id": "builtin-customer-support-sla",
        "name": "Customer Support Triage & SLA Router",
        "description": "Triaging enterprise support escalation, refund eligibility, and SLA response urgency.",
        "category": "Operations & Support",
        "raw_prompt": "An enterprise customer reports a webhook outage during maintenance costing $12k in delayed transactions and asks for immediate credit. How should we route and prioritize?",
        "state_mode": "text",
        "state_content": "Enterprise Tier-2 customer reports: 'Our production webhook endpoint stopped receiving event deliveries 45 minutes ago during a planned maintenance window. We estimate $12,000 in delayed transaction processing. Please investigate immediately and process a credit for this downtime as covered by our enterprise SLA.'",
        "questions_json": {
            "routing_department": {
                "type": "choice",
                "instructions": "Which team should be assigned as the primary owner for this escalation ticket?",
                "criteria": {
                    "platform_engineering": "Infrastructure and webhook delivery reliability team capable of diagnosing message queue backlogs, gateway drops, and maintenance window telemetry.",
                    "billing_operations": "Finance and contracts team handling enterprise SLA credit calculations, billing adjustments, and invoice balance updates.",
                    "account_management": "Customer success leadership responsible for relationship preservation, executive stakeholder updates, and commercial negotiations."
                }
            },
            "immediate_refund_eligible": {
                "type": "noul",
                "instructions": "Does this incident meet the criteria for immediate financial credit before technical root-cause analysis is completed?",
                "criteria": {
                    "true": "Customer SLA terms guarantee automatic credit on reported outage without awaiting technical RCA.",
                    "false": "Standard enterprise terms require engineering RCA confirmation of unplanned downtime before SLA credits can be authorized."
                }
            },
            "urgency_rating": {
                "type": "score",
                "instructions": "Assess the operational urgency and response SLA tier for this ticket.",
                "criteria": [
                    "P3 - Standard: Minor feature impediment with active workaround available.",
                    "P2 - Elevated: Partial service degradation affecting non-critical integrations with SLA risk within 4 hours.",
                    "P1 - Critical: Active production outage impacting core revenue transactions with immediate executive SLA breach."
                ]
            }
        },
        "thresholds_json": {"reject": 0.35, "commit": 0.75}
    },
    {
        "id": "builtin-fraud-detection-json",
        "name": "Account Signup Fraud & Bot Triage",
        "description": "Evaluating structured user signup signals with a JSON state payload to detect bot farms and automated fraud.",
        "category": "Security & Fraud",
        "raw_prompt": "Evaluate this user registration with datacenter IP, 45 accounts/min on same ASN, headless Chrome, and low mouse entropy for fraud and recommend action.",
        "state_mode": "json",
        "state_content": json.dumps({
            "ip_reputation": "datacenter_proxy",
            "asn_velocity_per_min": 45,
            "email_domain": "temp-inbox-disposable.xyz",
            "mouse_entropy_score": 0.02,
            "browser_fingerprint": "HeadlessChrome/128.0.0.0",
            "time_to_form_submit_ms": 340
        }, indent=2),
        "questions_json": {
            "is_fraudulent_signup": {
                "type": "noul",
                "instructions": "Is this registration attempt an automated bot or fraudulent account creation?",
                "criteria": {
                    "true": "Registration exhibits classic automated bot telemetry: datacenter IP origin, near-zero pointer entropy, headless browser signature, and high ASN velocity.",
                    "false": "Registration telemetry is consistent with a legitimate human user utilizing a privacy VPN or corporate proxy."
                }
            },
            "recommended_action": {
                "type": "choice",
                "instructions": "What automated enforcement action should be applied to this signup request?",
                "criteria": {
                    "allow_instant": "Approve account registration without additional verification friction.",
                    "challenge_mfa_recaptcha": "Hold account in pending state and challenge with WebAuthn/SMS and enterprise proof-of-work CAPTCHA.",
                    "silent_quarantine": "Silently create shadow-banned account that isolates user in a sandbox without access to outbound transactional features.",
                    "immediate_block": "Drop connection immediately and blacklist IP and device fingerprint at edge firewall."
                }
            }
        },
        "thresholds_json": {"reject": 0.30, "commit": 0.70}
    }
]

async def seed_scenarios() -> None:
    """Seed the database with built-in scenarios if they don't already exist."""
    async with get_db() as db:
        for s in BUILTIN_SCENARIOS:
            await db.execute("""
                INSERT INTO scenarios (
                    id, name, description, category, raw_prompt,
                    state_mode, state_content, questions_json, thresholds_json, is_builtin
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    description = excluded.description,
                    category = excluded.category,
                    raw_prompt = excluded.raw_prompt,
                    state_mode = excluded.state_mode,
                    state_content = excluded.state_content,
                    questions_json = excluded.questions_json,
                    thresholds_json = excluded.thresholds_json,
                    is_builtin = 1;
            """, (
                s["id"],
                s["name"],
                s["description"],
                s["category"],
                s["raw_prompt"],
                s["state_mode"],
                s["state_content"],
                json.dumps(s["questions_json"]),
                json.dumps(s["thresholds_json"]),
            ))
        await db.commit()
