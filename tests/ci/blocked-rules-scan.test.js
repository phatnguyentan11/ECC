'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
// ── Inline the parser from the script under test ─────────────────────────────
function parseScanRules(mdContent) {
  const normalized = mdContent.replace(/\r\n/g, '\n');
  const match = normalized.match(/```blocked-scan\n([\s\S]*?)```/);
  if (!match) return [];
  return match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => {
      const parts = line.split('\t');
      if (parts.length < 4) return null;
      const [id, globsRaw, regexStr, message] = parts;
      const globs = globsRaw.split(',').map((g) => g.trim()).filter(Boolean);
      let regex;
      try {
        const cleaned = regexStr.replace(/^\(\?i\)/, '');
        regex = new RegExp(cleaned, 'i');
      } catch {
        return null;
      }
      return { id, globs, regex, message };
    })
    .filter(Boolean);
}

function matchesGlob(filePath, glob) {
  if (glob === '*') return true;
  const ext = glob.replace(/^\*+/, '');
  return filePath.endsWith(ext);
}

function isException(filePath, root, exceptions) {
  const rel = path.relative(root, filePath).replace(/\\/g, '/');
  return exceptions.some((ex) => rel.includes(ex));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL  ${name}`);
    console.error(`        ${err.message}`);
    failed++;
  }
}

console.log('\nblocked-rules-scan tests\n');

// 1. parseScanRules — empty markdown returns empty array
test('parseScanRules: no blocked-scan block → empty array', () => {
  const rules = parseScanRules('# No scan block here');
  assert.strictEqual(rules.length, 0);
});

// 2. parseScanRules — valid block parses correctly
test('parseScanRules: valid block parses rule correctly', () => {
  const md = '```blocked-scan\nECC-SEC-001\t*.js\t(?i)hardcoded_secret\tHardcoded secret found\n```';
  const rules = parseScanRules(md);
  assert.strictEqual(rules.length, 1);
  assert.strictEqual(rules[0].id, 'ECC-SEC-001');
  assert.deepStrictEqual(rules[0].globs, ['*.js']);
  assert.strictEqual(rules[0].message, 'Hardcoded secret found');
});

// 3. parseScanRules — invalid regex skipped
test('parseScanRules: invalid regex → rule skipped', () => {
  const md = '```blocked-scan\nECC-BAD-001\t*.js\t[invalid(\tBad rule\n```';
  const rules = parseScanRules(md);
  assert.strictEqual(rules.length, 0);
});

// 4. parseScanRules — lines with fewer than 4 tabs skipped
test('parseScanRules: incomplete line → skipped', () => {
  const md = '```blocked-scan\nECC-BAD-001\t*.js\n```';
  const rules = parseScanRules(md);
  assert.strictEqual(rules.length, 0);
});

// 5. matchesGlob — wildcard matches everything
test('matchesGlob: * matches any file', () => {
  assert.ok(matchesGlob('/some/file.md', '*'));
  assert.ok(matchesGlob('/any/file.json', '*'));
});

// 6. matchesGlob — extension matching
test('matchesGlob: *.js matches .js files only', () => {
  assert.ok(matchesGlob('/path/to/file.js', '*.js'));
  assert.ok(!matchesGlob('/path/to/file.ts', '*.js'));
  assert.ok(!matchesGlob('/path/to/file.json', '*.js'));
});

// 7. isException — path in exception list is skipped
test('isException: file in exception scope → true', () => {
  const root = '/project';
  const exceptions = ['hooks/hooks.json'];
  assert.ok(isException('/project/hooks/hooks.json', root, exceptions));
});

// 8. isException — unrelated file not excepted
test('isException: unrelated file → false', () => {
  const root = '/project';
  const exceptions = ['hooks/hooks.json'];
  assert.ok(!isException('/project/src/index.js', root, exceptions));
});

// 9. blocked-rules.md exists and has scan block
test('blocked-rules.md exists with blocked-scan block', () => {
  const rulesPath = path.resolve(__dirname, '..', '..', 'rules', 'common', 'blocked-rules.md');
  assert.ok(fs.existsSync(rulesPath), 'blocked-rules.md must exist');
  const content = fs.readFileSync(rulesPath, 'utf8');
  assert.ok(content.includes('```blocked-scan'), 'Must contain blocked-scan block');
});

// 10. blocked-rules.md scan block has at least 5 rules
test('blocked-rules.md has at least 5 scan rules', () => {
  const rulesPath = path.resolve(__dirname, '..', '..', 'rules', 'common', 'blocked-rules.md');
  const content = fs.readFileSync(rulesPath, 'utf8');
  const rules = parseScanRules(content);
  assert.ok(rules.length >= 5, `Expected ≥5 rules, got ${rules.length}`);
});

// 11. Regex case-insensitive — (?i) prefix stripped correctly
test('parseScanRules: (?i) prefix makes regex case-insensitive', () => {
  const md = '```blocked-scan\nECC-TEST-001\t*.js\t(?i)password\tTest\n```';
  const rules = parseScanRules(md);
  assert.strictEqual(rules.length, 1);
  assert.ok(rules[0].regex.test('PASSWORD=abc'));
  assert.ok(rules[0].regex.test('password=abc'));
});

// 12. Multi-glob matching
test('matchesGlob: comma-separated globs work independently', () => {
  assert.ok(matchesGlob('file.json', '*.json'));
  assert.ok(matchesGlob('file.jsonc', '*.jsonc'));
  assert.ok(!matchesGlob('file.yaml', '*.json'));
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);