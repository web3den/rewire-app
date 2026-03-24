# ForgeBeyond ↔ Agent System Integration

## Overview

ForgeBeyond AnalysisEngine is the CI failure intelligence layer that the BDD agent system (Router, Sentinel, MR Reviewer) uses to understand **why** CI failed and **what to do about it**.

```
GitHub Actions CI
       │ (failure)
       ▼
  CI Log Capture
       │
       ▼
  ForgeBeyond AnalysisEngine
       │ (JSON report)
       ▼
  ┌────┴────────────┐
  │  Agent System    │
  │  ┌─────────────┐ │
  │  │   Router    │──── Reads report, decides which agent handles it
  │  │  Sentinel   │──── Validates fix against original findings
  │  │ MR Reviewer │──── References findings in code review
  │  └─────────────┘ │
  └──────────────────┘
```

## Input Contract

**What ForgeBeyond expects:**

```
Input:  Plain text CI log (GitHub Actions format or raw text)
Method: File path argument or stdin pipe
Config: tools/forgebeyond/forgebeyond.config.yaml
```

### Invocation

```bash
# From file
node tools/forgebeyond/lib/analyzer.js <log-file> \
  --config tools/forgebeyond/forgebeyond.config.yaml \
  --repo-root . \
  --output reports/ci-analysis-output.json

# From stdin (pipe from gh CLI, for example)
gh run view <run-id> --log-failed | \
  node tools/forgebeyond/lib/analyzer.js - \
  --config tools/forgebeyond/forgebeyond.config.yaml \
  --repo-root .

# Via convenience script
./tools/forgebeyond/run-forgebeyond-analysis.sh <log-file>
./tools/forgebeyond/run-forgebeyond-analysis.sh --stdin < log.txt
```

## Output Contract (JSON Report Schema v1.0)

```jsonc
{
  "forgebeyond": {
    "version": "0.1.0",
    "engine": "rule-based",      // "rule-based" | "llm-assisted"
    "timestamp": "ISO-8601"
  },
  "project": {
    "name": "rewire-app",
    "repo": "forgebeyond/rewire",
    "platform": "expo-react-native"
  },
  "summary": {
    "status": "failures_detected",  // "clean" | "failures_detected"
    "total_findings": 3,
    "by_severity": { "critical": 1, "high": 1, "medium": 1 },
    "confidence": 0.75,             // 0.0–1.0 (rule match confidence)
    "llm_analysis_recommended": false
  },
  "findings": [
    {
      "rule_id": "BUILD002",
      "rule_name": "EAS build failure",
      "category": "build-errors",
      "severity": "critical",       // critical | high | medium | low | info
      "match_count": 1,
      "first_match": {
        "line": 42,
        "text": "Build failed with exit code 1",
        "context": "...surrounding lines..."
      },
      "suggestion": "Check EAS build logs...",
      "tags": ["eas", "build"]
    }
  ],
  "unmatched_errors": [
    {
      "lineNumber": 88,
      "context": "...surrounding lines...",
      "errorLine": "Some unknown error"
    }
  ],
  "agent_contract": {
    "schema_version": "1.0",
    "action_required": true,        // true if any critical/high findings
    "suggested_actions": [
      {
        "rule_id": "BUILD002",
        "severity": "critical",
        "action": "Check EAS build logs..."
      }
    ]
  }
}
```

## How Agents Use This

### Router
1. Receives CI failure notification (webhook or polling)
2. Calls ForgeBeyond to get structured analysis
3. Reads `agent_contract.action_required` — if true, routes to appropriate agent
4. Uses `findings[].category` to decide: test failure → Sentinel, build error → notify human, etc.

```javascript
// Router pseudo-code
const report = JSON.parse(fs.readFileSync('reports/ci-analysis-latest.json'));
if (report.agent_contract.action_required) {
  for (const action of report.agent_contract.suggested_actions) {
    if (action.severity === 'critical') {
      routeToSentinel(report);
    }
  }
}
```

### Sentinel
1. Receives report from Router
2. Uses `findings[]` to understand the failure
3. Attempts automated fix based on `suggestion` and `tags`
4. Re-runs analysis after fix to validate

```javascript
// Sentinel pseudo-code
const findings = report.findings.filter(f => f.severity !== 'info');
for (const finding of findings) {
  const fix = attemptAutoFix(finding);
  if (fix.applied) {
    const recheck = runForgeBeyond(newLogs);
    if (recheck.summary.status === 'clean') {
      openPR(fix);
    }
  }
}
```

### MR Reviewer
1. When reviewing a PR that was created to fix CI
2. Cross-references the original ForgeBeyond findings
3. Validates the PR actually addresses the identified issues

## Adding Custom Rules

Create a JSON file in `tools/forgebeyond/rules/`:

```json
{
  "category": "my-custom-rules",
  "rules": [
    {
      "id": "CUSTOM001",
      "name": "My custom pattern",
      "pattern": "regex-pattern-here",
      "severity": "high",
      "suggestion": "What to do about it",
      "tags": ["custom"]
    }
  ]
}
```

Then add the category to `forgebeyond.config.yaml`:

```yaml
rules:
  categories:
    - my-custom-rules  # Add this
```

## Future: LLM-Assisted Analysis

When `llm.enabled: true` in config:
1. Rule-based analysis runs first
2. If `confidence < llm.confidence_threshold`, LLM is invoked
3. LLM receives: rule findings + unmatched errors + log context
4. LLM provides: refined diagnosis, root cause analysis, fix suggestions
5. Report includes both rule-based and LLM findings

Set `FORGEBEYOND_LLM_API_KEY` in GitHub Actions secrets to enable.
