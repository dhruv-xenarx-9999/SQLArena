"use client";

export interface EvaluationResult {
  ok: boolean;
  passed: boolean;
  reason?: string;
  error?: string;
  rows: Record<string, unknown>[];
  executionMs: number;
}

let worker: Worker | null = null;
const pending = new Map<string, (res: EvaluationResult) => void>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./pglite.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (event) => {
      const { id, ...payload } = event.data;
      const resolve = pending.get(id);
      if (resolve) {
        pending.delete(id);
        resolve(payload as EvaluationResult);
      }
    };
  }
  return worker;
}

export function runSqlEvaluation(params: {
  schemaSql: string;
  seedSql: string;
  userSql: string;
  expectedRows: Record<string, unknown>[];
  orderSensitive: boolean;
  timeoutMs?: number;
}): Promise<EvaluationResult> {
  const id = crypto.randomUUID();
  const w = getWorker();
  const timeoutMs = params.timeoutMs ?? 5000;

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      w.terminate();
      worker = null;
      resolve({
        ok: false,
        passed: false,
        error: `Execution timed out after ${timeoutMs}ms (worker terminated).`,
        rows: [],
        executionMs: timeoutMs,
      });
    }, timeoutMs);

    pending.set(id, (res) => {
      clearTimeout(timer);
      resolve(res);
    });

    w.postMessage({ id, ...params });
  });
}
