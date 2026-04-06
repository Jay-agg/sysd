
/**
 * Dataset auto-cleaning preprocessor for scalab (evaluation engine).
 * Run: npx tsx scripts/cleanDataset.ts
 */

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

import { normalizeComponent } from '../src/lib/evaluation/componentNormalization';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const STRICT_MODE = true;

/** Read/write the canonical cleaned bank (re-run after manual edits). */
const INPUT_FILE = join(process.cwd(), 'data', 'datav3.cleaned.json');
const OUTPUT_FILE = join(process.cwd(), 'data', 'datav3.cleaned.json');

const SUPPORTED_CHECKS = [
  'maxLatency',
  'maxErrorRate',
  'minThroughput',
  'requiredComponents',
  'requiredCapabilities',
  'noSinglePointOfFailure',
  'minReplicas',
  'minShards',
] as const;

const SUPPORTED_CAPABILITIES = [
  'caching',
  'async_processing',
  'load_balancing',
  'horizontal_scaling',
] as const;

const REQUIREMENT_DROP_SUBSTRINGS = [
  'million',
  'billion',
  'nines',
];

const DEFAULT_SCALING = {
  minReplicas: 2,
  minShards: 1,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type JsonQuestion = Record<string, unknown>;
type JsonTest = Record<string, unknown>;

function dedupe<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function cleanCapabilities(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x !== 'string') continue;
    const t = x.trim();
    if ((SUPPORTED_CAPABILITIES as readonly string[]).includes(t)) out.push(t);
  }
  return dedupe(out);
}

function expectedPatternsMentionAsync(patterns: unknown): boolean {
  if (!Array.isArray(patterns)) return false;

  return patterns.some((p) => {
    if (typeof p !== 'string') return false;
    const str = p.toLowerCase();
    return (
      str.includes('async') ||
      str.includes('queue') ||
      str.includes('broker')
    );
  });
}

function shouldDropRequirement(line: string): boolean {
  const lower = line.toLowerCase();
  return REQUIREMENT_DROP_SUBSTRINGS.some((s) => lower.includes(s));
}

function cleanChecks(
  raw: unknown,
  ctx: string
): Record<string, unknown> | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const key of Object.keys(src)) {
    if (!(SUPPORTED_CHECKS as readonly string[]).includes(key)) {
      if (STRICT_MODE) {
        throw new Error(`[STRICT] Unsupported check field "${key}" at ${ctx}`);
      }
      continue;
    }

    const v = src[key];

    if (key === 'requiredComponents') {
      if (!Array.isArray(v)) continue;

      const mapped: string[] = [];
      for (const item of v) {
        if (typeof item !== 'string') continue;
        const n = normalizeComponent(item);
        if (n) mapped.push(n);
      }

      const deduped = dedupe(mapped);
      if (deduped.length > 0) out[key] = deduped;
      continue;
    }

    if (key === 'requiredCapabilities') {
      const caps = cleanCapabilities(v);
      if (caps.length > 0) out[key] = caps;
      continue;
    }

    if (key === 'noSinglePointOfFailure') {
      if (typeof v === 'boolean') out[key] = v;
      continue;
    }

    if (key === 'minReplicas' || key === 'minShards') {
      if (typeof v === 'number' && Number.isFinite(v)) out[key] = v;
      continue;
    }

    if (
      key === 'maxLatency' ||
      key === 'maxErrorRate' ||
      key === 'minThroughput'
    ) {
      if (typeof v === 'number' && Number.isFinite(v)) out[key] = v;
      continue;
    }
  }

  // 🚨 CRITICAL FIX: prevent empty checks
  if (Object.keys(out).length === 0) {
    if (STRICT_MODE) {
      throw new Error(`Empty checks at ${ctx}`);
    }
    return null;
  }

  return out;
}

function cleanQuestion(q: JsonQuestion, index: number): JsonQuestion {
  const id = typeof q.id === 'string' ? q.id : `index-${index}`;
  const out: JsonQuestion = { ...q };

  delete out.evaluationCriteria;

  // scaling expectations
  if (!out.scalingExpectations || typeof out.scalingExpectations !== 'object') {
    out.scalingExpectations = { ...DEFAULT_SCALING };
  } else {
    const se = out.scalingExpectations as Record<string, unknown>;
    out.scalingExpectations = {
      minReplicas:
        typeof se.minReplicas === 'number'
          ? se.minReplicas
          : DEFAULT_SCALING.minReplicas,
      minShards:
        typeof se.minShards === 'number'
          ? se.minShards
          : DEFAULT_SCALING.minShards,
    };
  }

  // requirements filtering
  if (Array.isArray(out.requirements)) {
    out.requirements = (out.requirements as unknown[]).filter(
      (line) =>
        typeof line === 'string' && !shouldDropRequirement(line)
    );
  }

  // capabilities
  let caps = cleanCapabilities(out.requiredCapabilities);

  if (
    expectedPatternsMentionAsync(out.expectedPatterns) &&
    !caps.includes('async_processing')
  ) {
    caps = dedupe([...caps, 'async_processing']);
  }

  if (caps.length > 0) {
    out.requiredCapabilities = caps;
  } else {
    delete out.requiredCapabilities;
  }

  const cleanTests = (tests: unknown, phase: string): JsonTest[] => {
    if (!Array.isArray(tests)) return [];

    return tests.map((t, j) => {
      if (!t || typeof t !== 'object' || Array.isArray(t)) {
        return t as JsonTest;
      }

      const test = { ...(t as JsonTest) };
      const ctx = `question ${id} ${phase}[${j}]`;

      const chk = cleanChecks(test.checks, `${ctx}.checks`);

      if (!chk) {
        delete test.checks;
      } else {
        test.checks = chk;
      }

      return test;
    });
  };

  out.visibleTests = cleanTests(out.visibleTests, 'visibleTests');
  out.hiddenTests = cleanTests(out.hiddenTests, 'hiddenTests');

  return out;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateQuestion(
  q: JsonQuestion,
  index: number,
  warnings: string[]
): void {
  const id = typeof q.id === 'string' ? q.id : `index-${index}`;

  const visible = q.visibleTests;

  if (!Array.isArray(visible) || visible.length < 1) {
    warnings.push(`[${id}] No visibleTests`);
  }

  const allTests = [
    ...(Array.isArray(visible) ? visible : []),
    ...(Array.isArray(q.hiddenTests) ? q.hiddenTests : []),
  ];

  for (let i = 0; i < allTests.length; i++) {
    const t = allTests[i];

    if (!t || typeof t !== 'object') {
      warnings.push(`[${id}] test[${i}] invalid`);
      continue;
    }

    const checks = (t as JsonTest).checks;

    if (
      !checks ||
      typeof checks !== 'object' ||
      Array.isArray(checks) ||
      Object.keys(checks).length === 0
    ) {
      warnings.push(`[${id}] test[${i}] missing or empty checks`);
      continue;
    }

    const c = checks as Record<string, unknown>;
    const rc = c.requiredComponents;
    const rCap = c.requiredCapabilities;
    const hasComps = Array.isArray(rc) && rc.length > 0;
    const hasCaps = Array.isArray(rCap) && rCap.length > 0;
    const hasStructural =
      c.noSinglePointOfFailure === true ||
      (typeof c.minReplicas === 'number' && c.minReplicas > 0) ||
      (typeof c.minShards === 'number' && c.minShards > 0);

    if (!hasComps && !hasCaps && !hasStructural) {
      warnings.push(
        `[${id}] test[${i}] has no requiredComponents, requiredCapabilities, or structural checks (SPOF/replicas/shards)`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const raw = readFileSync(INPUT_FILE, 'utf8');
  const data = JSON.parse(raw) as { questions?: JsonQuestion[] };

  if (!data.questions || !Array.isArray(data.questions)) {
    throw new Error('Input must be an object with a "questions" array');
  }

  const warnings: string[] = [];
  const cleaned: JsonQuestion[] = [];

  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i];

    if (!q || typeof q !== 'object') {
      warnings.push(`Skipping invalid question at index ${i}`);
      continue;
    }

    try {
      const cq = cleanQuestion(q, i);
      cleaned.push(cq);
      validateQuestion(cq, i, warnings);
    } catch (e) {
      if (STRICT_MODE && e instanceof Error) {
        throw new Error(`While cleaning question index ${i}: ${e.message}`);
      }
      throw e;
    }
  }

  mkdirSync(dirname(OUTPUT_FILE), { recursive: true });

  const payload = { questions: cleaned };

  writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(payload, null, 2) + '\n',
    'utf8'
  );

  const summary = {
    total: data.questions.length,
    cleaned: cleaned.length,
    warnings: warnings.length,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (warnings.length > 0) {
    console.error('Warnings:');
    for (const w of warnings) console.error(' ', w);
  }

  console.error(`Wrote ${OUTPUT_FILE}`);
}

main();
