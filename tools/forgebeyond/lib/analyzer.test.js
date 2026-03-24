/**
 * ForgeBeyond AnalysisEngine - Unit Tests
 * 
 * Tests the core analysis logic: rule loading, pattern matching,
 * report generation, and integration contract output.
 */

const fs = require('fs');
const path = require('path');

// We'll test by running the analyzer as a subprocess
const { execSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '../../..');
const ANALYZER = path.join(__dirname, 'analyzer.js');
const CONFIG = path.join(__dirname, '..', 'forgebeyond.config.yaml');

function runAnalyzer(logContent, extraArgs = '') {
  const tmpLog = path.join(REPO_ROOT, 'reports', 'ci-logs', '_test-input.log');
  fs.mkdirSync(path.dirname(tmpLog), { recursive: true });
  fs.writeFileSync(tmpLog, logContent);

  try {
    const result = execSync(
      `node "${ANALYZER}" "${tmpLog}" --config "${CONFIG}" --repo-root "${REPO_ROOT}" ${extraArgs}`,
      { encoding: 'utf8', cwd: REPO_ROOT, timeout: 10000 }
    );
    return JSON.parse(result);
  } finally {
    if (fs.existsSync(tmpLog)) fs.unlinkSync(tmpLog);
  }
}

describe('ForgeBeyond AnalysisEngine', () => {
  test('produces valid report structure for clean log', () => {
    const report = runAnalyzer('Everything is fine\nBuild succeeded\nAll good');

    expect(report).toHaveProperty('forgebeyond');
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('findings');
    expect(report).toHaveProperty('agent_contract');
    expect(report.forgebeyond.version).toBe('0.1.0');
    expect(report.summary.status).toBe('clean');
    expect(report.summary.total_findings).toBe(0);
    expect(report.agent_contract.action_required).toBe(false);
  });

  test('detects Jest test failures', () => {
    const log = `
FAIL src/utils/helpers.test.ts
  ● Math utilities › should add numbers correctly
    expect(received).toBe(expected)
    Expected: 4
    Received: 5
Tests:  1 failed, 3 passed, 4 total
    `;
    const report = runAnalyzer(log);

    expect(report.summary.status).toBe('failures_detected');
    expect(report.findings.length).toBeGreaterThan(0);
    
    const testFinding = report.findings.find(f => f.category === 'test-failures');
    expect(testFinding).toBeDefined();
    expect(testFinding.severity).toBe('high');
  });

  test('detects npm install failures', () => {
    const log = `
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! peer dep conflict: react@19.1.0
    `;
    const report = runAnalyzer(log);

    expect(report.summary.status).toBe('failures_detected');
    const buildFinding = report.findings.find(f => f.rule_id === 'BUILD003');
    expect(buildFinding).toBeDefined();
  });

  test('detects EAS build failures', () => {
    const log = `
Building iOS app...
Error: Build failed with exit code 1
Check EAS dashboard for details
    `;
    const report = runAnalyzer(log);

    expect(report.summary.status).toBe('failures_detected');
    const finding = report.findings.find(f => f.rule_id === 'BUILD002');
    expect(finding).toBeDefined();
    expect(finding.severity).toBe('critical');
  });

  test('detects TypeScript errors', () => {
    const log = `
src/hooks/useAuth.ts(42,5): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
src/components/Card.tsx(15,3): error TS2339: Property 'onPress' does not exist on type 'CardProps'.
    `;
    const report = runAnalyzer(log);

    expect(report.summary.status).toBe('failures_detected');
    const tsFinding = report.findings.find(f => f.category === 'typescript-errors');
    expect(tsFinding).toBeDefined();
  });

  test('detects Expo credential issues', () => {
    const log = `
Authenticating with Expo...
Error: EXPO_TOKEN is invalid or expired. credentials check failed
Unauthorized access to expo
    `;
    const report = runAnalyzer(log);

    const finding = report.findings.find(f => f.rule_id === 'EXPO002');
    expect(finding).toBeDefined();
    expect(finding.severity).toBe('critical');
  });

  test('agent_contract marks action_required for critical findings', () => {
    const log = `Build failed with exit code 1`;
    const report = runAnalyzer(log);

    expect(report.agent_contract.action_required).toBe(true);
    expect(report.agent_contract.suggested_actions.length).toBeGreaterThan(0);
  });

  test('handles multiple concurrent issues', () => {
    const log = `
npm ERR! ERESOLVE unable to resolve dependency tree
FAIL src/test.ts
Tests: 1 failed
error TS2345: type mismatch
    `;
    const report = runAnalyzer(log);

    // Should detect findings from multiple categories
    const categories = [...new Set(report.findings.map(f => f.category))];
    expect(categories.length).toBeGreaterThanOrEqual(2);
  });

  test('report includes confidence score', () => {
    const log = `FAIL test.ts\nTests: 1 failed`;
    const report = runAnalyzer(log);

    expect(report.summary.confidence).toBeGreaterThan(0);
    expect(report.summary.confidence).toBeLessThanOrEqual(1);
  });

  test('schema_version is 1.0 for agent compatibility', () => {
    const report = runAnalyzer('Build failed');
    expect(report.agent_contract.schema_version).toBe('1.0');
  });
});
