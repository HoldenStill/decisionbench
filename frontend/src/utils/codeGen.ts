import { QuestionDefinition } from '../types';

export function generateCurlSnippet(
  model: string,
  state: any,
  questions: Record<string, QuestionDefinition>
): string {
  const payload = {
    model,
    state,
    questions,
  };

  return `curl -X POST https://openrouter.ai/api/alpha/decisions \\
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "HTTP-Referer: https://my-app.example.com" \\
  -H "X-Title: DecisionBench" \\
  -d '${JSON.stringify(payload, null, 2)}'`;
}

export function generatePythonSnippet(
  model: string,
  state: any,
  questions: Record<string, QuestionDefinition>,
  thresholds?: { reject: number; commit: number } | null
): string {
  const rej = thresholds?.reject ?? 0.35;
  const com = thresholds?.commit ?? 0.75;

  const payloadStr = JSON.stringify(
    {
      model,
      state,
      questions,
    },
    null,
    4
  );

  return `import os
import httpx

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")

headers = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://my-app.example.com",
    "X-Title": "DecisionBench",
}

payload = ${payloadStr}

with httpx.Client(timeout=30.0) as client:
    response = client.post(
        "https://openrouter.ai/api/alpha/decisions",
        headers=headers,
        json=payload
    )
    result = response.json()

# Process answers and evaluate threshold gate logic
answers = result.get("answers", {})
for q_name, ans in answers.items():
    q_type = ans.get("type")
    if q_type == "noul":
        p_yes = ans.get("noul", 0.0)
        if p_yes >= ${com}:
            verdict = "COMMIT"
        elif p_yes <= ${rej}:
            verdict = "REJECT"
        else:
            verdict = "REVIEW"
        print(f"[{q_name}] Noul P(yes)={p_yes:.4f} -> {verdict}")

    elif q_type == "choice":
        winner = ans.get("choice")
        confidence = ans.get("confidence", 0.0)
        print(f"[{q_name}] Choice winner: {winner} (Confidence: {confidence:.1%})")

    elif q_type == "score":
        score = ans.get("score", 0.0)
        print(f"[{q_name}] Expected score: {score:.2f}")
`;
}

export function generateTypeScriptSnippet(
  model: string,
  state: any,
  questions: Record<string, QuestionDefinition>,
  thresholds?: { reject: number; commit: number } | null
): string {
  const rej = thresholds?.reject ?? 0.35;
  const com = thresholds?.commit ?? 0.75;

  const payloadStr = JSON.stringify(
    {
      model,
      state,
      questions,
    },
    null,
    2
  );

  return `const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const payload = ${payloadStr};

async function executeDecision() {
  const res = await fetch("https://openrouter.ai/api/alpha/decisions", {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${OPENROUTER_API_KEY}\`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://my-app.example.com",
      "X-Title": "DecisionBench",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  const answers = data.answers || {};

  // Evaluate threshold gate logic
  for (const [qName, ans] of Object.entries(answers)) {
    if (ans.type === "noul") {
      const p = ans.noul;
      const verdict = p >= ${com} ? "COMMIT" : p <= ${rej} ? "REJECT" : "REVIEW";
      console.log(\`[\${qName}] P(yes)=\${p.toFixed(4)} -> \${verdict}\`);
    } else if (ans.type === "choice") {
      console.log(\`[\${qName}] Winning: \${ans.choice} (Confidence: \${(ans.confidence * 100).toFixed(1)}%)\`);
    } else if (ans.type === "score") {
      console.log(\`[\${qName}] Score: \${ans.score.toFixed(2)}\`);
    }
  }
}

executeDecision();
`;
}
