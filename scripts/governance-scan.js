#!/usr/bin/env node
/**
 * ECC Governance Scan
 * Reads the machine-readable blocked-scan block from rules/common/blocked-rules.md
 * and checks all matching files for violations.
 *
 * Usage: node scripts/governance-scan.js [--strict]
 * Exit code 0 = clean, 1 = violations found
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BLOCKED_RULES_PATH = path.join(ROOT, 'rules', 'common', 'blocked-rules.md');
const _STRICT = process.argv.includes('--strict');

// ── 1. Parse blocked-scan block ──────────────────────────────────────────────

function parseBlockedScan(mdContent) {
  const match = mdContent.match(/```blocked-scan\r?\n([\s\S]*?)```/);
  if (!match) {
    console.error('ERROR: No blocked-scan block found in blocked-rules.md');
    process.exit(2);
  }

  return match[1]
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      // Format: ID<TAB>file-globs<TAB>regex<TAB>message
      // Note: globs field may be empty (meaning "*")
      const parts = line.split('\t');
      if (parts.length === 4) {
        const [id, globs, regex, message] = parts;
        return { id, globs: globs || '*', regex, message };
      }
      // Fallback: no tab separators — try to parse by known rule ID prefix pattern
      // ID is first token, rest is packed (legacy format without tabs)
      const idMatch = line.match(/^(ECC-[A-Z]+-\d+)/);
      if (!idMatch) return null;
      const id = idMatch[1];
      const rest = line.slice(id.length);
      // Heuristic: globs contain comma or * before (?i) or regex start
      const globsMatch = rest.match(/^([^(]*?)(?=\(\?i\))/);
      const globs = globsMatch ? globsMatch[1].trim() || '*' : '*';
      const afterGlobs = rest.slice(globs === '*' ? 0 : globsMatch[0].length);
      // Last segment after the regex is the message — split on last occurrence of a word boundary
      // Simple approach: regex ends before the last human-readable sentence
      const regexMessageMatch = afterGlobs.match(/^(.*?)([A-Z][^(){}[\]\\*+?|]+\.?\s*)$/s);
      if (!regexMessageMatch) return null;
      return { id, globs, regex: regexMessageMatch[1].trim(), message: regexMessageMatch[2].trim() };
    })
    .filter(Boolean);
}

// ── 2. Expand globs to file list ──────────────────────────────────────────────

// Paths excluded from scanning (tests use intentional bad patterns as fixtures)
const EXCLUDED_PREFIXES = [
  'tests/',
  'the-security-guide.md',
  'the-longform-guide.md',
  'the-shortform-guide.md',
];

// Per-file per-rule exceptions matching Approved Exceptions table in blocked-rules.md
const APPROVED_EXCEPTIONS = [
  // EX-003/EX-004: intentional bad-code examples in doc/rule/skill files
  { rule: 'ECC-SEC-001', pathPrefix: 'agents/' },
  { rule: 'ECC-SEC-001', pathPrefix: 'rules/' },
  { rule: 'ECC-SEC-001', pathPrefix: 'skills/' },
  // EX-005: PRAGMA is not user input
  { rule: 'ECC-SQL-001', file: 'scripts/lib/state-store/index.js' },
  // EX-006: "Key Patterns" is a display label
  { rule: 'ECC-SEC-002', file: 'scripts/skill-create-output.js' },
  // EX-007: documentation of the APPROVED gate itself
  { rule: 'ECC-PLAN-001', file: 'CLAUDE.md' },
  { rule: 'ECC-PLAN-001', pathPrefix: 'rules/common/supreme-workflow.md' },
  { rule: 'ECC-PLAN-001', pathPrefix: 'rules/common/blocked-rules.md' },
];

function isExcepted(rule, filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return APPROVED_EXCEPTIONS.some((ex) => {
    if (ex.rule !== rule) return false;
    if (ex.file) return normalized === ex.file || normalized.endsWith('/' + ex.file);
    if (ex.pathPrefix) return normalized.startsWith(ex.pathPrefix);
    return false;
  });
}

function getTrackedFiles() {
  try {
    const out = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' });
    return out
      .trim()
      .split('\n')
      .filter(Boolean)
      .filter((f) => !EXCLUDED_PREFIXES.some((p) => f === p || f.startsWith(p)));
  } catch {
    // Fallback: walk directory
    return walkDir(ROOT);
  }
}

function walkDir(dir, results = []) {
  const skipDirs = new Set(['node_modules', '.git', '.yarn']);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) walkDir(path.join(dir, entry.name), results);
    } else {
      results.push(path.relative(ROOT, path.join(dir, entry.name)));
    }
  }
  return results;
}

function matchesGlob(filePath, globPattern) {
  if (!globPattern || globPattern === '*') return true;
  const globs = globPattern.split(',').map((g) => g.trim());
  const fileName = path.basename(filePath);
  return globs.some((g) => {
    if (g.startsWith('*.')) return fileName.endsWith(g.slice(1));
    if (g === '*') return true;
    return fileName === g;
  });
}

// ── 3. Scan files ─────────────────────────────────────────────────────────────

function scanFiles(rules, files) {
  const violations = [];

  for (const file of files) {
    const absPath = path.join(ROOT, file);
    let content;
    try {
      content = fs.readFileSync(absPath, 'utf8');
    } catch {
      continue; // binary or unreadable
    }

    for (const rule of rules) {
      if (!matchesGlob(file, rule.globs)) continue;

      let regex;
      try {
        // Strip leading (?i) flag — JS uses /i flag instead
        const src = rule.regex.replace(/^\(\?i\)/, '');
        regex = new RegExp(src, rule.regex.startsWith('(?i)') ? 'i' : '');
      } catch {
        continue; // malformed regex — skip
      }

      if (isExcepted(rule.id, file)) continue;

      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (regex.test(line)) {
          violations.push({
            rule: rule.id,
            file,
            line: idx + 1,
            content: line.trim().slice(0, 120),
            message: rule.message,
          });
        }
      });
    }
  }

  return violations;
}

// ── 4. Report ─────────────────────────────────────────────────────────────────

function report(violations) {
  if (violations.length === 0) {
    console.log('✅  ECC Governance Scan: CLEAN — no violations found.');
    return;
  }

  console.log(`\n❌  ECC Governance Scan: ${violations.length} violation(s) found\n`);
  console.log('─'.repeat(72));

  for (const v of violations) {
    console.log(`[${v.rule}] ${v.file}:${v.line}`);
    console.log(`  ↳ ${v.message}`);
    console.log(`  ↳ "${v.content}"`);
    console.log();
  }

  console.log('─'.repeat(72));
  console.log('Fix all violations before committing.');
  console.log('To document an intentional exception, add an entry to:');
  console.log('  rules/common/blocked-rules.md → Approved Exceptions table\n');
}

// ── 5. Main ───────────────────────────────────────────────────────────────────

const mdContent = fs.readFileSync(BLOCKED_RULES_PATH, 'utf8');
const rules = parseBlockedScan(mdContent);
const files = getTrackedFiles();
const violations = scanFiles(rules, files);

report(violations);

if (violations.length > 0) process.exit(1);