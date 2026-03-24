#!/usr/bin/env node
/**
 * ForgeBeyond AnalysisEngine
 * 
 * Ingests CI logs (GitHub Actions format or raw text),
 * applies rule-based pattern matching, and outputs structured
 * JSON findings for the agent system (Router/Sentinel/MR Reviewer).
 * 
 * Usage:
 *   node analyzer.js <log-file-or-stdin> [--config path/to/config.yaml]
 * 
 * Input:  CI log text (file path or stdin)
 * Output: JSON findings to stdout (and optionally to report file)
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ─── Config Loading ─────────────────────────────────────────────────────────

function loadConfig(configPath) {
  const defaultConfig = {
    project: { name: 'unknown', repo: '', platform: '' },
    input: { formats: ['raw-text'] },
    output: { report_dir: 'reports', report_prefix: 'ci-analysis', format: 'json' },
    rules: { enabled: true, rule_dir: 'tools/forgebeyond/rules', categories: [] },
    llm: { enabled: false },
    analysis: { max_log_lines: 5000, smart_extract: true, context_lines: 5, min_severity: 'low' },
    hooks: { exit_code: 'always-zero' },
  };

  if (!configPath || !fs.existsSync(configPath)) return defaultConfig;

  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = yaml.load(raw);
    return { ...defaultConfig, ...parsed };
  } catch (e) {
    console.error(`[ForgeBeyond] Warning: Could not parse config: ${e.message}`);
    return defaultConfig;
  }
}

// ─── Rule Loading ───────────────────────────────────────────────────────────

function loadRules(config, repoRoot) {
  const rules = [];
  if (!config.rules.enabled) return rules;

  const ruleDir = path.resolve(repoRoot, config.rules.rule_dir);
  if (!fs.existsSync(ruleDir)) {
    console.error(`[ForgeBeyond] Rule directory not found: ${ruleDir}`);
    return rules;
  }

  const categories = config.rules.categories;
  const files = fs.readdirSync(ruleDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const category = path.basename(file, '.json');
    if (categories.length > 0 && !categories.includes(category)) continue;

    try {
      const data = JSON.parse(fs.readFileSync(path.join(ruleDir, file), 'utf8'));
      if (data.rules && Array.isArray(data.rules)) {
        for (const rule of data.rules) {
          rules.push({ ...rule, category: data.category || category });
        }
      }
    } catch (e) {
      console.error(`[ForgeBeyond] Warning: Could not load rule file ${file}: ${e.message}`);
    }
  }

  return rules;
}

// ─── Log Parsing ────────────────────────────────────────────────────────────

function parseGitHubActionsLog(rawLog) {
  // GitHub Actions logs have timestamps and group markers
  // Strip ANSI codes and timestamp prefixes
  return rawLog
    .replace(/\x1b\[[0-9;]*m/g, '')  // Strip ANSI
    .replace(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z\s*/gm, '')  // Strip ISO timestamps
    .split('\n');
}

function extractFailureSections(lines, contextLines = 5) {
  const errorPatterns = [
    /error/i, /fail/i, /FAIL/, /ERR!/, /fatal/i, /exception/i,
    /TypeError/, /ReferenceError/, /SyntaxError/,
    /✕|✗|×/,  // Test failure markers
    /Expected.*Received/,
  ];

  const sections = [];
  const seen = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (errorPatterns.some(p => p.test(line))) {
      const start = Math.max(0, i - contextLines);
      const end = Math.min(lines.length, i + contextLines + 1);
      
      // Avoid duplicate overlapping sections
      const key = `${start}-${end}`;
      if (seen.has(key)) continue;
      seen.add(key);

      sections.push({
        lineNumber: i + 1,
        context: lines.slice(start, end).join('\n'),
        errorLine: line.trim(),
      });
    }
  }

  return sections;
}

// ─── Analysis Engine ────────────────────────────────────────────────────────

const SEVERITY_ORDER = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };

function analyzeLog(logText, rules, config) {
  const lines = parseGitHubActionsLog(logText);
  const truncatedLines = lines.slice(0, config.analysis.max_log_lines);
  
  const findings = [];
  const matchedRules = new Set();

  // Apply each rule against the full log
  for (const rule of rules) {
    try {
      const regex = new RegExp(rule.pattern, 'gm');
      const fullText = truncatedLines.join('\n');
      let match;
      const ruleMatches = [];

      while ((match = regex.exec(fullText)) !== null) {
        ruleMatches.push({
          matched_text: match[0].substring(0, 200),
          position: match.index,
        });
        // Limit matches per rule
        if (ruleMatches.length >= 10) break;
      }

      if (ruleMatches.length > 0) {
        matchedRules.add(rule.id);

        // Find line numbers for first match
        const firstMatchPos = ruleMatches[0].position;
        const linesBeforeMatch = fullText.substring(0, firstMatchPos).split('\n');
        const lineNumber = linesBeforeMatch.length;
        const contextStart = Math.max(0, lineNumber - config.analysis.context_lines - 1);
        const contextEnd = Math.min(truncatedLines.length, lineNumber + config.analysis.context_lines);

        findings.push({
          rule_id: rule.id,
          rule_name: rule.name,
          category: rule.category,
          severity: rule.severity,
          match_count: ruleMatches.length,
          first_match: {
            line: lineNumber,
            text: ruleMatches[0].matched_text,
            context: truncatedLines.slice(contextStart, contextEnd).join('\n'),
          },
          suggestion: rule.suggestion,
          tags: rule.tags || [],
        });
      }
    } catch (e) {
      console.error(`[ForgeBeyond] Rule ${rule.id} regex error: ${e.message}`);
    }
  }

  // Sort by severity (critical first)
  findings.sort((a, b) => (SEVERITY_ORDER[b.severity] || 0) - (SEVERITY_ORDER[a.severity] || 0));

  // Extract general failure sections not caught by rules
  const errorSections = config.analysis.smart_extract
    ? extractFailureSections(truncatedLines, config.analysis.context_lines)
    : [];

  // Unmatched error sections (errors not explained by any rule)
  const unmatchedErrors = errorSections.filter(section => {
    return !findings.some(f => {
      try {
        return new RegExp(rules.find(r => r.id === f.rule_id)?.pattern || '').test(section.errorLine);
      } catch { return false; }
    });
  }).slice(0, 20);  // Cap unmatched errors

  return {
    findings,
    unmatched_errors: unmatchedErrors,
    stats: {
      total_lines: lines.length,
      analyzed_lines: truncatedLines.length,
      rules_checked: rules.length,
      rules_matched: matchedRules.size,
      findings_count: findings.length,
      unmatched_error_sections: unmatchedErrors.length,
    },
  };
}

// ─── Report Generation ──────────────────────────────────────────────────────

function generateReport(analysis, config, logSource) {
  const timestamp = new Date().toISOString();
  const report = {
    forgebeyond: {
      version: '0.1.0',
      engine: 'rule-based',
      timestamp,
    },
    project: config.project,
    source: {
      log: logSource,
      analyzed_at: timestamp,
    },
    summary: {
      status: analysis.findings.length > 0 ? 'failures_detected' : 'clean',
      total_findings: analysis.findings.length,
      by_severity: {},
      confidence: analysis.findings.length > 0
        ? Math.min(1, analysis.stats.rules_matched / Math.max(1, analysis.stats.rules_matched + analysis.unmatched_errors.length))
        : 1.0,
      llm_analysis_recommended: false,
    },
    findings: analysis.findings,
    unmatched_errors: analysis.unmatched_errors,
    stats: analysis.stats,
    // Integration contract fields for Router/Sentinel
    agent_contract: {
      schema_version: '1.0',
      action_required: analysis.findings.some(f => f.severity === 'critical' || f.severity === 'high'),
      suggested_actions: analysis.findings.map(f => ({
        rule_id: f.rule_id,
        severity: f.severity,
        action: f.suggestion,
      })),
    },
  };

  // Count by severity
  for (const f of analysis.findings) {
    report.summary.by_severity[f.severity] = (report.summary.by_severity[f.severity] || 0) + 1;
  }

  // Recommend LLM analysis if confidence is low
  if (report.summary.confidence < (config.llm?.confidence_threshold || 0.6)) {
    report.summary.llm_analysis_recommended = true;
  }

  return report;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  
  // Parse args
  let logFile = null;
  let configPath = null;
  let repoRoot = null;
  let outputFile = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' && args[i + 1]) {
      configPath = args[++i];
    } else if (args[i] === '--repo-root' && args[i + 1]) {
      repoRoot = args[++i];
    } else if (args[i] === '--output' && args[i + 1]) {
      outputFile = args[++i];
    } else if (!args[i].startsWith('-')) {
      logFile = args[i];
    }
  }

  // Determine repo root
  if (!repoRoot) {
    repoRoot = process.cwd();
  }

  // Determine config path
  if (!configPath) {
    configPath = path.join(repoRoot, 'tools/forgebeyond/forgebeyond.config.yaml');
  }

  // Load config and rules
  const config = loadConfig(configPath);
  const rules = loadRules(config, repoRoot);

  if (rules.length === 0) {
    console.error('[ForgeBeyond] Warning: No rules loaded. Check config and rule directory.');
  }

  // Read log input
  let logText;
  let logSource;

  if (logFile && logFile !== '-') {
    if (!fs.existsSync(logFile)) {
      console.error(`[ForgeBeyond] Error: Log file not found: ${logFile}`);
      process.exit(1);
    }
    logText = fs.readFileSync(logFile, 'utf8');
    logSource = logFile;
  } else {
    // Read from stdin
    logText = fs.readFileSync('/dev/stdin', 'utf8');
    logSource = 'stdin';
  }

  if (!logText || logText.trim().length === 0) {
    console.error('[ForgeBeyond] Error: Empty log input');
    process.exit(1);
  }

  // Run analysis
  const analysis = analyzeLog(logText, rules, config);
  const report = generateReport(analysis, config, logSource);

  // Write report to file if output specified or auto-generate
  if (outputFile) {
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
    console.error(`[ForgeBeyond] Report written to: ${outputFile}`);
  } else if (config.output.report_dir) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').substring(0, 19);
    const autoOutput = path.join(repoRoot, config.output.report_dir, `${config.output.report_prefix}-${ts}.json`);
    const outputDir = path.dirname(autoOutput);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(autoOutput, JSON.stringify(report, null, 2));
    console.error(`[ForgeBeyond] Report written to: ${autoOutput}`);
  }

  // Always output JSON to stdout for piping
  console.log(JSON.stringify(report, null, 2));

  // Exit code
  if (config.hooks.exit_code === 'match-severity' && report.summary.by_severity.critical) {
    process.exit(2);
  }
}

main().catch(err => {
  console.error(`[ForgeBeyond] Fatal error: ${err.message}`);
  process.exit(1);
});
