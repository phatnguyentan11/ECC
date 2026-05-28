#!/usr/bin/env node
/**
 * blocked-rules-scan.js
 * Reads the blocked-scan block from rules/common/blocked-rules.md
 * Scans project files for violations using regex patterns
 * Exits 1 if violations found (CI-compatible)
 *
 * Usage: node scripts/ci/blocked-rules-scan.js [--dry-run] [--dir <path>]
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const dirIndex = args.indexOf('--dir');
const ROOT = dirIndex !== -1 ? path.resolve(args[dirIndex + 1]) : path.resolve(__dirname, '..', '..');
const BLOCKED_RULES_FILE = path.join(ROOT, 'rules', 'common', 'blocked-rules.md');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse the ```blocked-scan block from blocked-rules.md */
function parseScanRules(mdContent) {
  // Normalize CRLF → LF
  const normalized = mdContent.replace(/\r\n/g, '\n');
  const match = normalized.match(/```blocked-scan\n([\s\S]*?)```/);
  if (!match) return [];

  return match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => {
      // Tab-delimited: ID<TAB>globs<TAB>regex<TAB>message
      const parts = line.split('\t');
      if (parts.length < 4) return null;
      const [id, globsRaw, regexStr, message] = parts;
      const globs = globsRaw
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean);
      let regex;
      try {
        // Strip leading (?i) and use 'i' flag
        const cleaned = regexStr.replace(/^\(\?i\)/, '');
        regex = new RegExp(cleaned, 'i');
      } catch {
        console.warn(`[WARN] Invalid regex for rule ${id}: ${regexStr}`);
        return null;
      }
      return { id, globs, regex, message };
    })
    .filter(Boolean);
}

/** Convert a glob pattern to a simple suffix/name check */
function matchesGlob(filePath, glob) {
  if (glob === '*') return true;
  // Support *.ext and **/*.ext patterns
  const ext = glob.replace(/^\*+/, '');
  return filePath.endsWith(ext);
}

/** Recursively collect files under dir, skip node_modules/.git/dist */
function collectFiles(dir, files = []) {
  const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.yarn', 'build', '.next', 'coverage']);
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, files);
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

/** Check if a file path is covered by exception scope patterns */
function isException(filePath, exceptions) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  return exceptions.some((ex) => {
    // Path-like exceptions (contain '/') use startsWith to avoid partial matches
    if (ex.includes('/')) return rel.startsWith(ex);
    // Filename-only exceptions use includes (e.g. 'ecc_dashboard.py')
    return rel.includes(ex);
  });
}

/** Scan a single file with all matching rules */
function scanFile(filePath, rules, exceptions) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }

  const violations = [];
  const lines = content.split('\n');

  for (const rule of rules) {
    if (!rule.globs.some((g) => matchesGlob(filePath, g))) continue;
    if (isException(filePath, exceptions)) continue;

    lines.forEach((line, idx) => {
      if (rule.regex.test(line)) {
        violations.push({
          ruleId: rule.id,
          file: rel,
          line: idx + 1,
          content: line.trim().slice(0, 120),
          message: rule.message,
        });
      }
    });
  }

  return violations;
}

// ── Exception scope patterns (from EX-* table) ───────────────────────────────
// Files listed as approved exceptions — skip scanning these paths
const EXCEPTION_SCOPES = [
  'hooks/hooks.json',
  'ecc_dashboard.py',
  // scripts/ci itself should not self-trigger
  'scripts/ci/blocked-rules-scan.js',
  // rules/plan files contain example patterns — not real secrets
  'rules/common/blocked-rules.md',
  'rules/csharp/security.md',
  'rules/typescript/security.md',
  'plan/',
  // security guides contain intentional examples
  'the-security-guide.md',
  // skills teaching about security contain intentional bad examples
  'skills/security-review/',
  'agents/code-reviewer.md',
  // tests contain intentional fixture secrets for testing detection
  'tests/',
  // PRAGMA is not SQL injection — it's a safe SQLite control statement
  'scripts/lib/state-store/',
  // 'Key Patterns Discovered' is a UI label, not a secret key
  'scripts/skill-create-output.js',
];

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(BLOCKED_RULES_FILE)) {
    console.error(`[ERROR] blocked-rules.md not found at: ${BLOCKED_RULES_FILE}`);
    process.exit(1);
  }

  const mdContent = fs.readFileSync(BLOCKED_RULES_FILE, 'utf8');
  const rules = parseScanRules(mdContent);

  if (rules.length === 0) {
    console.log('[INFO] No scan rules found in blocked-rules.md. Nothing to scan.');
    process.exit(0);
  }

  console.log(`[INFO] Loaded ${rules.length} scan rules from blocked-rules.md`);
  console.log(`[INFO] Scanning: ${ROOT}`);
  if (DRY_RUN) console.log('[INFO] DRY RUN — violations reported but exit code will be 0');

  const files = collectFiles(ROOT);
  console.log(`[INFO] Files to scan: ${files.length}`);

  const allViolations = [];
  for (const file of files) {
    const violations = scanFile(file, rules, EXCEPTION_SCOPES);
    allViolations.push(...violations);
  }

  if (allViolations.length === 0) {
    console.log('[PASS] No violations found.');
    process.exit(0);
  }

  console.error(`\n[FAIL] ${allViolations.length} violation(s) found:\n`);
  for (const v of allViolations) {
    console.error(`  ${v.ruleId}  ${v.file}:${v.line}`);
    console.error(`    Rule: ${v.message}`);
    console.error(`    Code: ${v.content}`);
    console.error('');
  }

  if (DRY_RUN) {
    console.log('[DRY RUN] Exiting 0 despite violations.');
    process.exit(0);
  }

  process.exit(1);
}

main();