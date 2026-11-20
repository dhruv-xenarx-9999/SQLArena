# QueryForge — SQL Interview & Engineering Arena

> *"Think Like an Engineer. Query Like a Hacker."*

QueryForge is a production-ready, self-contained SQL problem-solving workstation built with **Next.js 15**, **TypeScript**, **Monaco Editor**, and **PGlite (PostgreSQL 16 WebAssembly)** running inside an isolated Web Worker.

## Features
- **250 Original, Validated SQL Challenges** across all 10 core engineering domains:
  1. SQL Fundamentals (20)
  2. Aggregations and Joins (35)
  3. Subqueries and CTEs (20)
  4. Window Functions (25)
  5. Advanced SQL (20)
  6. Business Interview Scenarios (25)
  7. Database Design and Modeling (30)
  8. Application and Transactional SQL (20)
  9. Querying and Analytics (35)
  10. Performance and Optimization (20)
- **Zero-Latency Sandboxed PostgreSQL 16 Execution**: Every challenge runs inside a fresh ephemeral PGlite instance inside a Web Worker with deterministic row/column assertion grading and timeout protection.
- **Monaco SQL IDE**: Syntax highlighting, `sql-formatter` integration, progressive 3-tier hints, reference + alternative solutions, and per-problem personal notes.
- **Zero External Dependency Required to Start**: Works immediately out-of-the-box locally or on Vercel with `localStorage` persistence, and optionally syncs submissions to Supabase PostgreSQL when environment variables are provided.
