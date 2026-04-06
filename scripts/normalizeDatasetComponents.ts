/**
 * Normalizes `requiredComponents` in a question bank JSON to canonical ComponentType tokens.
 * Run: npx tsx scripts/normalizeDatasetComponents.ts
 * (reads/writes `data/datav3.cleaned.json` by default; set INPUT/OUTPUT to use another file)
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { SUPPORTED_COMPONENTS, type ComponentType } from '../src/types/component';
import { normalizeRequiredComponents } from '../src/lib/evaluation/componentNormalization';

/** Default: normalize the live bank in place. Override: `INPUT=... OUTPUT=... npx tsx scripts/normalizeDatasetComponents.ts` */
const INPUT = process.env.INPUT ?? join(process.cwd(), 'data/datav3.cleaned.json');
const OUTPUT = process.env.OUTPUT ?? join(process.cwd(), 'data/datav3.cleaned.json');

type JsonQuestion = Record<string, unknown>;
type JsonTest = Record<string, unknown>;

function isStorageHeavyQuestion(q: JsonQuestion): boolean {
  const parts = [q.title, q.description, JSON.stringify(q.tags), JSON.stringify(q.requirements)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return /\b(video|file|blob|object storage|thumbnail|images?|media|pastebin|streaming|upload|cdn)\b/.test(
    parts
  );
}

function hadBlobOrObjectToken(raw: string[] | undefined): boolean {
  return (raw ?? []).some((x) => x === 'blobStorage' || x === 'objectStorage');
}

function applyStorageHeavyPreference(
  q: JsonQuestion,
  originalRaw: string[] | undefined,
  normalized: ComponentType[]
): ComponentType[] {
  if (!hadBlobOrObjectToken(originalRaw) || !isStorageHeavyQuestion(q)) {
    return normalized;
  }
  return [
    ...new Set(
      normalized.map((c) => (c === 'database' ? 'noSqlDatabase' : c))
    ),
  ];
}

function normalizeTestChecksComponents(q: JsonQuestion, checks: Record<string, unknown>): void {
  const rc = checks.requiredComponents;
  if (!Array.isArray(rc)) return;

  const originalRaw = rc.filter((x): x is string => typeof x === 'string');
  let next = normalizeRequiredComponents(originalRaw);
  next = applyStorageHeavyPreference(q, originalRaw, next);

  if (next.length === 0) {
    console.warn(
      `[warn] requiredComponents empty after normalize for question "${q.id}" (original: ${JSON.stringify(originalRaw)})`
    );
  }

  checks.requiredComponents = next;
}

function walkTests(q: JsonQuestion, tests: unknown): void {
  if (!Array.isArray(tests)) return;
  for (const t of tests) {
    if (!t || typeof t !== 'object' || Array.isArray(t)) continue;
    const test = t as JsonTest;
    const checks = test.checks;
    if (!checks || typeof checks !== 'object' || Array.isArray(checks)) continue;
    normalizeTestChecksComponents(q, checks as Record<string, unknown>);
  }
}

function main(): void {
  const raw = readFileSync(INPUT, 'utf8');
  const data = JSON.parse(raw) as { questions?: JsonQuestion[] };

  if (!data.questions || !Array.isArray(data.questions)) {
    throw new Error('Expected { questions: [...] }');
  }

  for (const q of data.questions) {
    walkTests(q, q.visibleTests);
    walkTests(q, q.hiddenTests);
  }

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(data, null, 2) + '\n', 'utf8');

  console.error(`Wrote ${OUTPUT}`);

  const supported = new Set<string>(SUPPORTED_COMPONENTS);
  const invalid = new Set<string>();
  for (const q of data.questions) {
    for (const phase of ['visibleTests', 'hiddenTests'] as const) {
      const tests = q[phase];
      if (!Array.isArray(tests)) continue;
      for (const t of tests) {
        if (!t || typeof t !== 'object') continue;
        const rc = (t as JsonTest).checks as Record<string, unknown> | undefined;
        const arr = rc?.requiredComponents;
        if (!Array.isArray(arr)) continue;
        for (const x of arr) {
          if (typeof x === 'string' && !supported.has(x)) invalid.add(x);
        }
      }
    }
  }
  if (invalid.size > 0) {
    console.warn('Unexpected non-canonical tokens after clean:', [...invalid]);
  }
}

main();
