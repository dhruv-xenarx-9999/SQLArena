/// <reference lib="webworker" />
import { PGlite } from "@electric-sql/pglite";

export interface EvalRequest {
  id: string;
  schemaSql: string;
  seedSql: string;
  userSql: string;
  expectedRows: Record<string, unknown>[];
  orderSensitive: boolean;
}

function normalizeVal(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(4);
  if (typeof v === "object") return JSON.stringify(v);
  return String(v).trim();
}

function compareRows(
  actual: Record<string, unknown>[],
  expected: Record<string, unknown>[],
  orderSensitive: boolean
): { passed: boolean; reason?: string } {
  if (actual.length !== expected.length) {
    return {
      passed: false,
      reason: `Row count mismatch: expected ${expected.length} row(s), got ${actual.length}.`,
    };
  }
  if (expected.length === 0) return { passed: true };

  const expCols = Object.keys(expected[0]);
  const actCols = Object.keys(actual[0]);

  if (expCols.length !== actCols.length) {
    return {
      passed: false,
      reason: `Column count mismatch: expected [${expCols.join(", ")}], got [${actCols.join(", ")}].`,
    };
  }

  const expNorm = expected.map((r) => expCols.map((c) => normalizeVal(r[c])).join(" | "));
  const actNorm = actual.map((r) => actCols.map((c) => normalizeVal(r[c])).join(" | "));

  if (!orderSensitive) {
    expNorm.sort();
    actNorm.sort();
  }

  for (let i = 0; i < expNorm.length; i++) {
    if (expNorm[i] !== actNorm[i]) {
      return {
        passed: false,
        reason: `Row ${i + 1} mismatch — Expected: (${expNorm[i]}) | Got: (${actNorm[i]})`,
      };
    }
  }
  return { passed: true };
}

self.onmessage = async (e: MessageEvent<EvalRequest>) => {
  const { id, schemaSql, seedSql, userSql, expectedRows, orderSensitive } = e.data;
  const start = performance.now();
  const db = new PGlite();

  try {
    await db.exec(schemaSql);
    if (seedSql.trim()) {
      await db.exec(seedSql);
    }
    const res = await db.exec(userSql);
    const last = res[res.length - 1] ?? { rows: [], fields: [] };
    const actualRows = last.rows as Record<string, unknown>[];
    const verdict = compareRows(actualRows, expectedRows, orderSensitive);
    const executionMs = Math.max(1, Math.round(performance.now() - start));

    self.postMessage({
      id,
      ok: true,
      passed: verdict.passed,
      reason: verdict.reason,
      rows: actualRows,
      executionMs,
    });
  } catch (err: unknown) {
    const executionMs = Math.max(1, Math.round(performance.now() - start));
    self.postMessage({
      id,
      ok: false,
      passed: false,
      error: err instanceof Error ? err.message : "SQL execution error",
      rows: [],
      executionMs,
    });
  } finally {
    await db.close();
  }
};
