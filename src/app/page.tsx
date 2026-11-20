"use client";

import React, { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import { format as formatSql } from "sql-formatter";
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Search,
  Bookmark,
  Lightbulb,
  BookOpen,
  Terminal,
  Wand2,
  ChevronRight,
  Clock,
  Database,
  Filter,
  Sparkles,
} from "lucide-react";
import {
  QUESTIONS_250,
  CATEGORY_TARGETS,
  CategoryName,
  Difficulty,
  SqlQuestion,
} from "@/data/questions";
import { ADVANCED_SQL_50 } from "@/data/advancedSql50";
import { runSqlEvaluation, EvaluationResult } from "@/lib/sqlRunner";
import { getSupabaseClient } from "@/lib/supabase";
import { SQL75_ROADMAP, Sql75Status } from "@/data/sql75";

const STORAGE_SOLVED = "qf_solved_codes_v1";
const STORAGE_BOOKMARKS = "qf_bookmarked_codes_v1";
const STORAGE_NOTES = "qf_notes_v1";
const STORAGE_SQL75_PROGRESS = "qf_sql75_progress_v1";

const ARENA_QUESTIONS = [...QUESTIONS_250, ...ADVANCED_SQL_50];

export default function QueryForgeArenaPage() {
  const [viewMode, setViewMode] = useState<"arena" | "sql75">("arena");
  const [sql75Progress, setSql75Progress] = useState<Record<number, Sql75Status>>({});
  const [sql75Category, setSql75Category] = useState("All");
  const [sql75Search, setSql75Search] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryName | "ALL">("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);

  const [activeCode, setActiveCode] = useState<string>(ARENA_QUESTIONS[0].code);
  const [editorSql, setEditorSql] = useState<string>(ARENA_QUESTIONS[0].starterSql);
  const [activeLeftTab, setActiveLeftTab] = useState<"problem" | "hints" | "solution" | "notes">("problem");
  const [revealedHints, setRevealedHints] = useState<number>(0);

  const [running, setRunning] = useState(false);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);

  const [solvedCodes, setSolvedCodes] = useState<string[]>([]);
  const [bookmarkedCodes, setBookmarkedCodes] = useState<string[]>([]);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  // Hydrate persistent state
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_SOLVED);
      const b = localStorage.getItem(STORAGE_BOOKMARKS);
      const n = localStorage.getItem(STORAGE_NOTES);
      const r = localStorage.getItem(STORAGE_SQL75_PROGRESS);
      if (s) setSolvedCodes(JSON.parse(s));
      if (b) setBookmarkedCodes(JSON.parse(b));
      if (n) setNotesMap(JSON.parse(n));
      if (r) setSql75Progress(JSON.parse(r));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const activeQuestion: SqlQuestion = useMemo(
    () => ARENA_QUESTIONS.find((q) => q.code === activeCode) ?? ARENA_QUESTIONS[0],
    [activeCode]
  );

  const filteredQuestions = useMemo(() => {
    return ARENA_QUESTIONS.filter((q) => {
      if (selectedCategory !== "ALL" && q.category !== selectedCategory) return false;
      if (selectedDifficulty !== "ALL" && q.difficulty !== selectedDifficulty) return false;
      if (onlyBookmarked && !bookmarkedCodes.includes(q.code)) return false;
      if (searchQuery.trim()) {
        const term = searchQuery.toLowerCase();
        return (
          q.code.toLowerCase().includes(term) ||
          q.title.toLowerCase().includes(term) ||
          q.pattern.toLowerCase().includes(term) ||
          q.companyTag.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [selectedCategory, selectedDifficulty, searchQuery, onlyBookmarked, bookmarkedCodes]);

  const sql75Categories = useMemo(
    () => ["All", ...Array.from(new Set(SQL75_ROADMAP.map((item) => item.category)))],
    []
  );

  const filteredSql75 = useMemo(
    () =>
      SQL75_ROADMAP.filter((item) => {
        if (sql75Category !== "All" && item.category !== sql75Category) return false;
        const term = sql75Search.trim().toLowerCase();
        return !term ||
          item.title.toLowerCase().includes(term) ||
          item.category.toLowerCase().includes(term) ||
          item.skills.some((skill) => skill.toLowerCase().includes(term));
      }),
    [sql75Category, sql75Search]
  );

  const completedSql75 = SQL75_ROADMAP.filter(
    (item) => sql75Progress[item.id] === "Completed"
  ).length;

  const updateSql75Status = (id: number, status: Sql75Status) => {
    const next = { ...sql75Progress, [id]: status };
    setSql75Progress(next);
    localStorage.setItem(STORAGE_SQL75_PROGRESS, JSON.stringify(next));
  };

  const selectQuestion = (q: SqlQuestion) => {
    setActiveCode(q.code);
    setEditorSql(q.starterSql);
    setEvalResult(null);
    setRevealedHints(0);
    setActiveLeftTab("problem");
  };

  const handleRunSolution = async () => {
    setRunning(true);
    const res = await runSqlEvaluation({
      schemaSql: activeQuestion.schemaSql,
      seedSql: activeQuestion.seedSql,
      userSql: editorSql,
      expectedRows: activeQuestion.expectedOutput,
      orderSensitive: activeQuestion.orderSensitive,
    });
    setRunning(false);
    setEvalResult(res);

    if (res.passed && !solvedCodes.includes(activeQuestion.code)) {
      const next = [...solvedCodes, activeQuestion.code];
      setSolvedCodes(next);
      localStorage.setItem(STORAGE_SOLVED, JSON.stringify(next));
    }

    // Optional Supabase cloud telemetry sync if configured
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await supabase.from("user_submissions").insert({
          user_id: data.user.id,
          question_code: activeQuestion.code,
          submitted_sql: editorSql,
          status: res.passed ? "passed" : res.ok ? "failed" : "error",
          execution_ms: res.executionMs,
        });
      }
    }
  };

  const toggleBookmark = (code: string) => {
    const next = bookmarkedCodes.includes(code)
      ? bookmarkedCodes.filter((c) => c !== code)
      : [...bookmarkedCodes, code];
    setBookmarkedCodes(next);
    localStorage.setItem(STORAGE_BOOKMARKS, JSON.stringify(next));
  };

  const updateNote = (text: string) => {
    const next = { ...notesMap, [activeQuestion.code]: text };
    setNotesMap(next);
    localStorage.setItem(STORAGE_NOTES, JSON.stringify(next));
  };

  const handleFormat = () => {
    try {
      setEditorSql(formatSql(editorSql, { language: "postgresql" }));
    } catch {
      // Keep raw SQL if incomplete
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#080B0A] text-[#E6F2EA]">
      {/* TOP COMMAND HEADER */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#1C2B24] bg-[#0D1210] px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded border border-[#39FF88]/50 bg-[#111916] font-mono text-sm font-bold text-[#39FF88]">
            QF
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono text-sm font-bold tracking-wider">
              <span>
                QUERY<span className="text-[#39FF88]">FORGE</span>
              </span>
              <span className="rounded border border-[#1C2B24] bg-[#080B0A] px-1.5 py-0.5 text-[10px] text-[#00D9A6]">
                SQL ARENA // {ARENA_QUESTIONS.length} CHALLENGES
              </span>
            </div>
            <p className="font-mono text-[10px] text-[#8AA396]">
              Think Like an Engineer. Query Like a Hacker.
            </p>
          </div>
        </div>

        {/* Live Telemetry Pill */}
        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="flex items-center gap-1 rounded border border-[#1C2B24] bg-[#080B0A] p-1">
            <button
              onClick={() => setViewMode("arena")}
              className={`rounded px-2.5 py-1 ${
                viewMode === "arena"
                  ? "bg-[#39FF88]/15 text-[#39FF88]"
                  : "text-[#8AA396] hover:text-[#E6F2EA]"
              }`}
            >
              Arena
            </button>
            <button
              onClick={() => setViewMode("sql75")}
              className={`rounded px-2.5 py-1 ${
                viewMode === "sql75"
                  ? "bg-[#39FF88]/15 text-[#39FF88]"
                  : "text-[#8AA396] hover:text-[#E6F2EA]"
              }`}
            >
              SQL 75
            </button>
          </div>
          <div className="hidden items-center gap-2 rounded border border-[#1C2B24] bg-[#111916] px-3 py-1 sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#39FF88]" />
            <span className="text-[#8AA396]">ENGINE:</span>
            <span className="text-[#E6F2EA]">PostgreSQL 16 WASM</span>
          </div>
          <div className="rounded border border-[#39FF88]/30 bg-[#39FF88]/10 px-3 py-1 text-[#39FF88]">
            SOLVED: {solvedCodes.length} / {ARENA_QUESTIONS.length}
          </div>
        </div>
      </header>

      {/* MAIN 3-PANE ENGINEERING WORKSTATION */}
      {viewMode === "arena" ? (
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
        {/* PANE 1: QUESTION BANK EXPLORER (3 cols) */}
        <aside className="flex flex-col border-r border-[#1C2B24] bg-[#0D1210] lg:col-span-3 overflow-hidden">
          <div className="space-y-2.5 border-b border-[#1C2B24] p-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#8AA396]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, pattern, company..."
                className="w-full rounded border border-[#1C2B24] bg-[#080B0A] py-1.5 pl-8 pr-3 font-mono text-xs text-[#E6F2EA] placeholder:text-[#8AA396]/60 focus:border-[#39FF88] focus:outline-none"
              />
            </div>

            {/* Category Selector */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 shrink-0 text-[#00D9A6]" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as CategoryName | "ALL")}
                className="w-full rounded border border-[#1C2B24] bg-[#080B0A] px-2 py-1 font-mono text-xs text-[#E6F2EA] focus:border-[#39FF88] focus:outline-none"
              >
                <option value="ALL">All Domains ({ARENA_QUESTIONS.length})</option>
                {CATEGORY_TARGETS.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.target})
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty + Bookmarks Filter */}
            <div className="flex items-center justify-between gap-1 font-mono text-[11px]">
              {(["ALL", "Easy", "Medium", "Hard"] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`rounded px-2 py-1 transition ${
                    selectedDifficulty === diff
                      ? "bg-[#39FF88]/20 text-[#39FF88] border border-[#39FF88]/40"
                      : "bg-[#111916] text-[#8AA396] hover:text-[#E6F2EA]"
                  }`}
                >
                  {diff}
                </button>
              ))}
              <button
                onClick={() => setOnlyBookmarked(!onlyBookmarked)}
                title="Filter Bookmarked"
                className={`rounded p-1.5 border ${
                  onlyBookmarked
                    ? "border-[#00D9A6] bg-[#00D9A6]/15 text-[#00D9A6]"
                    : "border-[#1C2B24] bg-[#111916] text-[#8AA396]"
                }`}
              >
                <Bookmark className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Question List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#1C2B24]/60">
            {filteredQuestions.map((q) => {
              const isSelected = q.code === activeQuestion.code;
              const isSolved = solvedCodes.includes(q.code);
              return (
                <button
                  key={q.code}
                  onClick={() => selectQuestion(q)}
                  className={`w-full text-left px-3 py-2.5 transition flex items-start justify-between gap-2 ${
                    isSelected
                      ? "bg-[#111916] border-l-2 border-l-[#39FF88]"
                      : "hover:bg-[#111916]/60"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="text-[#00D9A6]">{q.code}</span>
                      <span
                        className={`rounded px-1.5 py-0.2 text-[10px] ${
                          q.difficulty === "Easy"
                            ? "bg-emerald-950 text-[#39FF88]"
                            : q.difficulty === "Medium"
                            ? "bg-amber-950 text-amber-300"
                            : "bg-rose-950 text-rose-300"
                        }`}
                      >
                        {q.difficulty}
                      </span>
                      <span className="truncate text-[10px] text-[#8AA396]">
                        • {q.companyTag}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-xs font-medium text-[#E6F2EA]">
                      {q.title}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[10px] text-[#8AA396]">
                      {q.pattern}
                    </div>
                  </div>
                  {isSolved ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#39FF88] mt-0.5" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#8AA396]/40 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* PANE 2: PROBLEM SPECIFICATION, SCHEMA, HINTS & EDITORIAL (4 cols) */}
        <section className="flex flex-col border-r border-[#1C2B24] bg-[#080B0A] lg:col-span-4 overflow-hidden">
          {/* Sub-navigation Tabs */}
          <div className="flex items-center justify-between border-b border-[#1C2B24] bg-[#0D1210] px-3 py-2 font-mono text-xs">
            <div className="flex gap-1">
              {(
                [
                  { id: "problem", label: "Spec & Schema" },
                  { id: "hints", label: `Hints (${revealedHints}/3)` },
                  { id: "solution", label: "Solution" },
                  { id: "notes", label: "Notes" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveLeftTab(tab.id)}
                  className={`rounded px-2.5 py-1 transition ${
                    activeLeftTab === tab.id
                      ? "bg-[#111916] text-[#39FF88] border border-[#39FF88]/30"
                      : "text-[#8AA396] hover:text-[#E6F2EA]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => toggleBookmark(activeQuestion.code)}
              className="text-[#8AA396] hover:text-[#39FF88]"
              title="Bookmark Challenge"
            >
              <Bookmark
                className={`h-4 w-4 ${
                  bookmarkedCodes.includes(activeQuestion.code)
                    ? "fill-[#39FF88] text-[#39FF88]"
                    : ""
                }`}
              />
            </button>
          </div>

          {/* Tab Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs leading-relaxed">
            {activeLeftTab === "problem" && (
              <>
                <div>
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[#8AA396]">
                    <span className="text-[#39FF88] font-bold">{activeQuestion.code}</span>
                    <span>|</span>
                    <span>{activeQuestion.category}</span>
                    <span>|</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {activeQuestion.estimatedMinutes}m
                    </span>
                  </div>
                  <h1 className="mt-1.5 text-base font-bold text-[#E6F2EA]">
                    {activeQuestion.title}
                  </h1>
                </div>

                <div className="rounded-md border border-[#1C2B24] bg-[#111916] p-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#00D9A6]">
                    Business Scenario
                  </div>
                  <p className="mt-1 text-[#E6F2EA]/90">{activeQuestion.businessScenario}</p>
                </div>

                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#8AA396]">
                    Task Requirements
                  </div>
                  <p className="mt-1 text-[#E6F2EA]">{activeQuestion.description}</p>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#00D9A6]">
                    <Database className="h-3.5 w-3.5" />
                    Database Schema & Seed Data (PostgreSQL 16)
                  </div>
                  <pre className="overflow-x-auto rounded border border-[#1C2B24] bg-[#0D1210] p-3 font-mono text-[11px] text-[#E6F2EA]">
                    {`${activeQuestion.schemaSql}

${activeQuestion.seedSql}`}
                  </pre>
                </div>

                <div>
                  <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-[#39FF88]">
                    Expected Output ({activeQuestion.expectedOutput.length} row(s))
                  </div>
                  <div className="overflow-x-auto rounded border border-[#1C2B24]">
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead className="bg-[#111916] text-[#00D9A6]">
                        <tr>
                          {Object.keys(activeQuestion.expectedOutput[0] ?? {}).map((col) => (
                            <th key={col} className="border-b border-[#1C2B24] px-2.5 py-1.5">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1C2B24]/60 bg-[#0D1210]">
                        {activeQuestion.expectedOutput.map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).map((val, cIdx) => (
                              <td key={cIdx} className="px-2.5 py-1.5">
                                {val === null ? "NULL" : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {activeLeftTab === "hints" && (
              <div className="space-y-3">
                <p className="text-[#8AA396]">
                  Reveal progressive hints one step at a time without spoiling the full query.
                </p>
                {activeQuestion.hints.map((hint, idx) => {
                  const unlocked = idx < revealedHints;
                  return (
                    <div
                      key={idx}
                      className="rounded-md border border-[#1C2B24] bg-[#111916] p-3"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="flex items-center gap-1.5 text-[#00D9A6]">
                          <Lightbulb className="h-3.5 w-3.5" />
                          HINT LEVEL {idx + 1}
                        </span>
                        {!unlocked && (
                          <button
                            onClick={() => setRevealedHints(idx + 1)}
                            className="rounded bg-[#39FF88]/15 px-2 py-0.5 text-[#39FF88] hover:bg-[#39FF88]/25"
                          >
                            Unlock Hint
                          </button>
                        )}
                      </div>
                      {unlocked && <p className="mt-2 text-[#E6F2EA]">{hint}</p>}
                    </div>
                  );
                })}
              </div>
            )}

            {activeLeftTab === "solution" && (
              <div className="space-y-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] uppercase text-[#39FF88]">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" /> Reference Production Solution
                    </span>
                    <button
                      onClick={() => setEditorSql(activeQuestion.solutionSql)}
                      className="rounded border border-[#39FF88]/40 px-2 py-0.5 text-[10px] hover:bg-[#39FF88]/10"
                    >
                      Load into Editor
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded border border-[#1C2B24] bg-[#0D1210] p-3 font-mono text-[11px] text-[#39FF88]">
                    {activeQuestion.solutionSql}
                  </pre>
                </div>

                {activeQuestion.alternativeSql && (
                  <div>
                    <div className="mb-1.5 font-mono text-[10px] uppercase text-[#00D9A6]">
                      Alternative Approach
                    </div>
                    <pre className="overflow-x-auto rounded border border-[#1C2B24] bg-[#0D1210] p-3 font-mono text-[11px] text-[#E6F2EA]">
                      {activeQuestion.alternativeSql}
                    </pre>
                  </div>
                )}

                <div className="rounded border border-[#1C2B24] bg-[#111916] p-3 space-y-2">
                  <div className="font-mono text-[10px] uppercase text-[#00D9A6]">
                    Engineering Breakdown
                  </div>
                  <p>{activeQuestion.explanation}</p>
                  <div className="pt-1 font-mono text-[10px] uppercase text-amber-300">
                    Common Pitfalls
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[#8AA396]">
                    {activeQuestion.commonMistakes.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                  <div className="pt-1 font-mono text-[10px] uppercase text-[#39FF88]">
                    Performance & Indexing Notes
                  </div>
                  <p className="text-[#8AA396]">{activeQuestion.performanceNotes}</p>
                </div>
              </div>
            )}

            {activeLeftTab === "notes" && (
              <div className="space-y-2">
                <div className="font-mono text-[11px] text-[#8AA396]">
                  Personal engineering notes for {activeQuestion.code} (auto-saved):
                </div>
                <textarea
                  value={notesMap[activeQuestion.code] ?? ""}
                  onChange={(e) => updateNote(e.target.value)}
                  rows={14}
                  placeholder="Record key takeaways, edge cases, or index ideas..."
                  className="w-full rounded border border-[#1C2B24] bg-[#0D1210] p-3 font-mono text-xs text-[#E6F2EA] focus:border-[#39FF88] focus:outline-none"
                />
              </div>
            )}
          </div>
        </section>

        {/* PANE 3: MONACO SQL EDITOR + PGLITE TEST EVALUATION TERMINAL (5 cols) */}
        <section className="flex flex-col bg-[#080B0A] lg:col-span-5 overflow-hidden">
          {/* Editor Toolbar */}
          <div className="flex items-center justify-between border-b border-[#1C2B24] bg-[#0D1210] px-3 py-2">
            <div className="flex items-center gap-2 font-mono text-xs text-[#8AA396]">
              <Terminal className="h-3.5 w-3.5 text-[#39FF88]" />
              <span>solution.sql</span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                onClick={handleFormat}
                className="inline-flex items-center gap-1 rounded border border-[#1C2B24] bg-[#111916] px-2.5 py-1 text-[#E6F2EA] hover:border-[#00D9A6]"
              >
                <Wand2 className="h-3 w-3 text-[#00D9A6]" />
                Format
              </button>
              <button
                onClick={() => {
                  setEditorSql(activeQuestion.starterSql);
                  setEvalResult(null);
                }}
                className="inline-flex items-center gap-1 rounded border border-[#1C2B24] bg-[#111916] px-2.5 py-1 text-[#8AA396] hover:text-[#E6F2EA]"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
              <button
                onClick={handleRunSolution}
                disabled={running}
                className="inline-flex items-center gap-1.5 rounded bg-[#39FF88] px-3.5 py-1 font-bold text-[#080B0A] transition hover:bg-[#00D9A6] disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                {running ? "Evaluating..." : "Run & Verify"}
              </button>
            </div>
          </div>

          {/* Monaco SQL Editor */}
          <div className="h-[52%] border-b border-[#1C2B24]">
            <Editor
              height="100%"
              defaultLanguage="sql"
              theme="vs-dark"
              value={editorSql}
              onChange={(v) => setEditorSql(v ?? "")}
              options={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
                tabSize: 2,
              }}
            />
          </div>

          {/* Execution & Verdict Console */}
          <div className="flex flex-1 flex-col overflow-hidden bg-[#0D1210]">
            <div className="flex items-center justify-between border-b border-[#1C2B24] px-3 py-2 font-mono text-xs">
              <span className="flex items-center gap-1.5 text-[#8AA396]">
                <Sparkles className="h-3.5 w-3.5 text-[#00D9A6]" />
                TEST VERDICT & OUTPUT
              </span>
              {evalResult && (
                <span className="text-[#8AA396]">{evalResult.executionMs}ms</span>
              )}
            </div>

            <div className="flex-1 overflow-auto p-3 font-mono text-xs">
              {!evalResult ? (
                <div className="flex h-full items-center justify-center text-center text-[#8AA396]">
                  Click &ldquo;Run &amp; Verify&rdquo; to execute your SQL against the isolated PostgreSQL sandbox.
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Verdict Banner */}
                  <div
                    className={`flex items-start gap-2.5 rounded-md border p-3 ${
                      evalResult.passed
                        ? "border-[#39FF88]/40 bg-[#39FF88]/10 text-[#39FF88]"
                        : "border-rose-500/40 bg-rose-950/30 text-rose-300"
                    }`}
                  >
                    {evalResult.passed ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold">
                        {evalResult.passed
                          ? "ACCEPTED — All Test Assertions Passed"
                          : evalResult.ok
                          ? "WRONG ANSWER — Output Mismatch"
                          : "EXECUTION ERROR"}
                      </div>
                      {(evalResult.reason || evalResult.error) && (
                        <div className="mt-1 text-[11px] opacity-90">
                          {evalResult.reason || evalResult.error}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Returned Rows Table */}
                  {evalResult.rows.length > 0 && (
                    <div>
                      <div className="mb-1 text-[10px] uppercase text-[#8AA396]">
                        Your Query Output ({evalResult.rows.length} row(s))
                      </div>
                      <div className="overflow-x-auto rounded border border-[#1C2B24]">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-[#111916] text-[#00D9A6]">
                            <tr>
                              {Object.keys(evalResult.rows[0]).map((col) => (
                                <th key={col} className="border-b border-[#1C2B24] px-2.5 py-1.5">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1C2B24]/60 bg-[#080B0A]">
                            {evalResult.rows.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {Object.values(row).map((val, cIdx) => (
                                  <td key={cIdx} className="px-2.5 py-1.5">
                                    {val === null ? "NULL" : String(val)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      ) : (
        <main className="flex-1 overflow-y-auto bg-[#080B0A] p-4 lg:p-6">
          <div className="mx-auto max-w-6xl space-y-5">
            <section className="rounded-lg border border-[#1C2B24] bg-[#0D1210] p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#00D9A6]">
                    Study Roadmap
                  </div>
                  <h1 className="mt-1 text-xl font-bold text-[#E6F2EA]">
                    SQL 75 Interview Practice
                  </h1>
                  <p className="mt-1 max-w-2xl text-xs text-[#8AA396]">
                    A 75-question progression covering filtering, joins, aggregation,
                    window functions, ranking, and advanced SQL patterns.
                  </p>
                </div>
                <div className="rounded border border-[#39FF88]/30 bg-[#39FF88]/10 px-4 py-2 font-mono text-xs text-[#39FF88]">
                  Completed: {completedSql75} / {SQL75_ROADMAP.length}
                </div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#1C2B24]">
                <div
                  className="h-full bg-[#39FF88] transition-all"
                  style={{ width: `${(completedSql75 / SQL75_ROADMAP.length) * 100}%` }}
                />
              </div>
            </section>

            <section className="flex flex-wrap gap-2">
              <input
                value={sql75Search}
                onChange={(event) => setSql75Search(event.target.value)}
                placeholder="Search title or SQL skill..."
                className="min-w-64 flex-1 rounded border border-[#1C2B24] bg-[#0D1210] px-3 py-2 font-mono text-xs text-[#E6F2EA] placeholder:text-[#8AA396]/60 focus:border-[#39FF88] focus:outline-none"
              />
              <select
                value={sql75Category}
                onChange={(event) => setSql75Category(event.target.value)}
                className="rounded border border-[#1C2B24] bg-[#0D1210] px-3 py-2 font-mono text-xs text-[#E6F2EA] focus:border-[#39FF88] focus:outline-none"
              >
                {sql75Categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </section>

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredSql75.map((item) => {
                const status = sql75Progress[item.id] ?? "Not Started";
                return (
                  <article
                    key={item.id}
                    className={`rounded-lg border bg-[#0D1210] p-4 ${
                      status === "Completed"
                        ? "border-[#39FF88]/50"
                        : "border-[#1C2B24]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-mono text-[10px] text-[#00D9A6]">
                        SQL-{String(item.id).padStart(2, "0")} | {item.category}
                      </div>
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                          item.difficulty === "Easy"
                            ? "bg-emerald-950 text-[#39FF88]"
                            : item.difficulty === "Medium"
                            ? "bg-amber-950 text-amber-300"
                            : "bg-rose-950 text-rose-300"
                        }`}
                      >
                        {item.difficulty}
                      </span>
                    </div>
                    <h2 className="mt-2 text-sm font-bold text-[#E6F2EA]">
                      {item.title}
                    </h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#8AA396]">
                      {item.summary}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded border border-[#1C2B24] bg-[#080B0A] px-1.5 py-0.5 font-mono text-[9px] text-[#8AA396]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <select
                        value={status}
                        onChange={(event) =>
                          updateSql75Status(item.id, event.target.value as Sql75Status)
                        }
                        className={`rounded border px-2 py-1 font-mono text-[10px] ${
                          status === "Completed"
                            ? "border-[#39FF88]/40 bg-[#39FF88]/10 text-[#39FF88]"
                            : "border-[#1C2B24] bg-[#111916] text-[#8AA396]"
                        }`}
                      >
                        <option>Not Started</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                      </select>
                      <a
                        href={`https://leetcode.com/problems/${item.slug}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded border border-[#00D9A6]/40 px-2 py-1 font-mono text-[10px] text-[#00D9A6] hover:bg-[#00D9A6]/10"
                      >
                        Open on LeetCode
                        <ChevronRight className="h-3 w-3" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </section>
          </div>
        </main>
      )}
    </div>
  );
}
