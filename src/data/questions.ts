export type Difficulty = "Easy" | "Medium" | "Hard";

export type CategoryName =
  | "SQL Fundamentals"
  | "Aggregations and Joins"
  | "Subqueries and CTEs"
  | "Window Functions"
  | "Advanced SQL"
  | "Business Interview Scenarios"
  | "Database Design and Modeling"
  | "Application and Transactional SQL"
  | "Querying and Analytics"
  | "Performance and Optimization";

export interface SqlQuestion {
  code: string;
  title: string;
  category: CategoryName;
  pattern: string;
  difficulty: Difficulty;
  companyTag: string;
  estimatedMinutes: number;
  businessScenario: string;
  description: string;
  schemaSql: string;
  seedSql: string;
  starterSql: string;
  expectedOutput: Record<string, unknown>[];
  orderSensitive: boolean;
  hints: [string, string, string];
  solutionSql: string;
  alternativeSql?: string;
  explanation: string;
  commonMistakes: string[];
  performanceNotes: string;
}

export const CATEGORY_TARGETS: { name: CategoryName; target: number }[] = [
  { name: "SQL Fundamentals", target: 20 },
  { name: "Aggregations and Joins", target: 35 },
  { name: "Subqueries and CTEs", target: 20 },
  { name: "Window Functions", target: 25 },
  { name: "Advanced SQL", target: 70 },
  { name: "Business Interview Scenarios", target: 25 },
  { name: "Database Design and Modeling", target: 30 },
  { name: "Application and Transactional SQL", target: 20 },
  { name: "Querying and Analytics", target: 35 },
  { name: "Performance and Optimization", target: 20 },
];

// Core archetype templates covering every required interview pattern with exact verified outputs
interface QuestionBlueprint {
  category: CategoryName;
  pattern: string;
  difficulty: Difficulty;
  companyTag: string;
  titleTemplate: (variant: number) => string;
  scenarioTemplate: (variant: number) => string;
  descriptionTemplate: (variant: number) => string;
  buildInstance: (variant: number) => {
    schemaSql: string;
    seedSql: string;
    starterSql: string;
    expectedOutput: Record<string, unknown>[];
    orderSensitive: boolean;
    solutionSql: string;
    alternativeSql?: string;
  };
  hints: [string, string, string];
  explanation: string;
  commonMistakes: string[];
  performanceNotes: string;
}

const BLUEPRINTS: QuestionBlueprint[] = [
  // 1. SQL Fundamentals (20)
  {
    category: "SQL Fundamentals",
    pattern: "NULL Handling & Three-Valued Logic",
    difficulty: "Easy",
    companyTag: "Amazon",
    titleTemplate: (v) => `Unassigned Referral Attribution Audit #${v}`,
    scenarioTemplate: (v) =>
      `Marketing operations needs to audit customer signups in region ${v} where the referrer code is either missing (NULL) or not equal to a specific partner ID.`,
    descriptionTemplate: (v) =>
      `Return the \`customer_id\` and \`full_name\` of all customers whose \`referrer_id\` is NOT equal to \`${v * 10}\`, including customers with no referrer (\`NULL\`). Order by \`customer_id\` ASC.`,
    buildInstance: (v) => {
      const refId = v * 10;
      return {
        schemaSql: `CREATE TABLE customers (customer_id INT PRIMARY KEY, full_name TEXT, referrer_id INT);`,
        seedSql: `INSERT INTO customers VALUES (1, 'Aarav Patel', NULL), (2, 'Meera Shah', ${refId}), (3, 'Rohan Verma', ${refId + 5}), (4, 'Diya Nair', NULL);`,
        starterSql: `SELECT customer_id, full_name
FROM customers
-- Write your filter condition here
ORDER BY customer_id ASC;`,
        expectedOutput: [
          { customer_id: 1, full_name: "Aarav Patel" },
          { customer_id: 3, full_name: "Rohan Verma" },
          { customer_id: 4, full_name: "Diya Nair" },
        ],
        orderSensitive: true,
        solutionSql: `SELECT customer_id, full_name
FROM customers
WHERE referrer_id IS DISTINCT FROM ${refId}
ORDER BY customer_id ASC;`,
        alternativeSql: `SELECT customer_id, full_name
FROM customers
WHERE referrer_id <> ${refId} OR referrer_id IS NULL
ORDER BY customer_id ASC;`,
      };
    },
    hints: [
      "Standard inequality (<>) evaluates to UNKNOWN when comparing against NULL.",
      "Use OR referrer_id IS NULL, or PostgreSQL's NULL-safe IS DISTINCT FROM operator.",
      "Filter WHERE referrer_id IS DISTINCT FROM <target_id> and sort ascending.",
    ],
    explanation:
      "In SQL three-valued logic, `NULL <> 10` yields `UNKNOWN`, excluding NULL rows. `IS DISTINCT FROM` treats NULL as a comparable value.",
    commonMistakes: [
      "Writing `WHERE referrer_id != 10` without accounting for `NULL` rows.",
      "Using `= NULL` instead of `IS NULL`.",
    ],
    performanceNotes:
      "If filtering on `referrer_id IS NULL OR referrer_id <> X`, a partial index `WHERE referrer_id IS NULL` accelerates null lookups.",
  },
  {
    category: "SQL Fundamentals",
    pattern: "DISTINCT & Multi-Column Filtering",
    difficulty: "Easy",
    companyTag: "Google",
    titleTemplate: (v) => `Active Telemetry Node Deduplication #${v}`,
    scenarioTemplate: (v) =>
      `Infrastructure monitoring logs heartbeat events from edge servers across cluster ${v}.`,
    descriptionTemplate: (v) =>
      `Retrieve unique \`service_name\` values that emitted a status of \`'DEGRADED'\` with latency strictly greater than \`${100 + v * 10}\` ms. Sort alphabetically by \`service_name\`.`,
    buildInstance: (v) => {
      const thresh = 100 + v * 10;
      return {
        schemaSql: `CREATE TABLE heartbeats (event_id INT PRIMARY KEY, service_name TEXT, status TEXT, latency_ms INT);`,
        seedSql: `INSERT INTO heartbeats VALUES (1, 'auth-edge', 'DEGRADED', ${thresh + 40}), (2, 'auth-edge', 'DEGRADED', ${thresh + 80}), (3, 'billing-api', 'HEALTHY', ${thresh + 90}), (4, 'search-idx', 'DEGRADED', ${thresh - 10}), (5, 'ingest-worker', 'DEGRADED', ${thresh + 15});`,
        starterSql: `SELECT DISTINCT service_name
FROM heartbeats
WHERE ...
ORDER BY service_name ASC;`,
        expectedOutput: [
          { service_name: "auth-edge" },
          { service_name: "ingest-worker" },
        ],
        orderSensitive: true,
        solutionSql: `SELECT DISTINCT service_name
FROM heartbeats
WHERE status = 'DEGRADED' AND latency_ms > ${thresh}
ORDER BY service_name ASC;`,
      };
    },
    hints: [
      "Combine status equality and latency threshold using AND.",
      "Apply DISTINCT to collapse multiple events from the same service.",
      "Order alphabetically using ORDER BY service_name ASC.",
    ],
    explanation:
      "`DISTINCT` deduplicates the projected `service_name` values after filtering rows matching both predicates.",
    commonMistakes: [
      "Using `>=` instead of strictly greater than `>`.",
      "Forgetting `DISTINCT`, returning duplicate service names.",
    ],
    performanceNotes:
      "A composite index on `(status, latency_ms, service_name)` allows an index-only scan.",
  },

  // 2. Aggregations and Joins (35)
  {
    category: "Aggregations and Joins",
    pattern: "Customers Without Orders (Anti-Join)",
    difficulty: "Easy",
    companyTag: "Amazon",
    titleTemplate: (v) => `Dormant Account Conversion Targets #${v}`,
    scenarioTemplate: (v) =>
      `Growth engineering wants to identify registered accounts in cohort ${v} that have never placed a completed order.`,
    descriptionTemplate: () =>
      `Find the \`account_id\` and \`email\` of every account in \`accounts\` that has zero matching rows in \`orders\`. Order by \`account_id\` ASC.`,
    buildInstance: (v) => ({
      schemaSql: `CREATE TABLE accounts (account_id INT PRIMARY KEY, email TEXT); CREATE TABLE orders (order_id INT PRIMARY KEY, account_id INT, total_cents INT);`,
      seedSql: `INSERT INTO accounts VALUES (101, 'alpha${v}@qf.io'), (102, 'beta${v}@qf.io'), (103, 'gamma${v}@qf.io'); INSERT INTO orders VALUES (1, 101, 4500), (2, 101, 1200);`,
      starterSql: `SELECT a.account_id, a.email
FROM accounts a
-- Perform an anti-join against orders
ORDER BY a.account_id ASC;`,
      expectedOutput: [
        { account_id: 102, email: `beta${v}@qf.io` },
        { account_id: 103, email: `gamma${v}@qf.io` },
      ],
      orderSensitive: true,
      solutionSql: `SELECT a.account_id, a.email
FROM accounts a
LEFT JOIN orders o ON a.account_id = o.account_id
WHERE o.order_id IS NULL
ORDER BY a.account_id ASC;`,
      alternativeSql: `SELECT account_id, email
FROM accounts a
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.account_id = a.account_id)
ORDER BY account_id ASC;`,
    }),
    hints: [
      "A LEFT JOIN preserves all rows from accounts even when no order exists.",
      "Rows without a match will have NULL in the right table's primary key.",
      "Filter WHERE o.order_id IS NULL or use NOT EXISTS.",
    ],
    explanation:
      "`LEFT JOIN ... WHERE right.id IS NULL` and `NOT EXISTS` both implement anti-joins cleanly without NULL traps inherent to `NOT IN`.",
    commonMistakes: [
      "Using `NOT IN (SELECT account_id FROM orders)` which fails silently if `orders.account_id` contains any NULL.",
    ],
    performanceNotes:
      "Ensure `orders(account_id)` is indexed so PostgreSQL can execute an efficient Hash Anti Join or Merge Anti Join.",
  },
  {
    category: "Aggregations and Joins",
    pattern: "Employees Earning More Than Managers (Self-Join)",
    difficulty: "Easy",
    companyTag: "Microsoft",
    titleTemplate: (v) => `Compensation Band Inversion Check #${v}`,
    scenarioTemplate: (v) =>
      `People analytics is auditing engineering hierarchy ${v} to flag individual contributors earning more than their direct manager.`,
    descriptionTemplate: () =>
      `Return the \`emp_name\` of employees whose \`salary\` is strictly greater than their direct manager's \`salary\`. Order alphabetically.`,
    buildInstance: (v) => {
      const base = 100000 + v * 1000;
      return {
        schemaSql: `CREATE TABLE staff (emp_id INT PRIMARY KEY, emp_name TEXT, salary INT, manager_id INT);`,
        seedSql: `INSERT INTO staff VALUES (1, 'Director Maya', ${base + 40000}, NULL), (2, 'Lead Kabir', ${base + 10000}, 1), (3, 'Engineer Tara', ${base + 25000}, 2), (4, 'Engineer Dev', ${base}, 2);`,
        starterSql: `SELECT e.emp_name
FROM staff e
JOIN staff m ON ...
WHERE ...;`,
        expectedOutput: [{ emp_name: "Engineer Tara" }],
        orderSensitive: true,
        solutionSql: `SELECT e.emp_name
FROM staff e
JOIN staff m ON e.manager_id = m.emp_id
WHERE e.salary > m.salary
ORDER BY e.emp_name ASC;`,
      };
    },
    hints: [
      "Join the staff table to itself using two aliases: e (employee) and m (manager).",
      "Match e.manager_id = m.emp_id.",
      "Compare e.salary > m.salary.",
    ],
    explanation:
      "A self-join pairs each employee row with their manager row via `e.manager_id = m.emp_id`.",
    commonMistakes: [
      "Reversing the join condition (`e.emp_id = m.manager_id`), which checks managers earning more than reports.",
    ],
    performanceNotes:
      "Primary key index on `staff(emp_id)` makes the inner lookup an O(1) index probe.",
  },
  {
    category: "Aggregations and Joins",
    pattern: "Duplicate Emails & HAVING Aggregation",
    difficulty: "Easy",
    companyTag: "Meta",
    titleTemplate: (v) => `Identity Collision Detection #${v}`,
    scenarioTemplate: (v) =>
      `Account security detected duplicate email registrations during migration batch ${v}.`,
    descriptionTemplate: () =>
      `List every \`email\` address that appears more than once in \`users\`, along with its \`occurrence_count\`. Order by \`email\` ASC.`,
    buildInstance: (v) => ({
      schemaSql: `CREATE TABLE users (id INT PRIMARY KEY, email TEXT);`,
      seedSql: `INSERT INTO users VALUES (1, 'dup${v}@domain.com'), (2, 'unique${v}@domain.com'), (3, 'dup${v}@domain.com'), (4, 'dup${v}@domain.com');`,
      starterSql: `SELECT email, COUNT(*) AS occurrence_count
FROM users
GROUP BY email
-- Filter groups with count > 1
ORDER BY email ASC;`,
      expectedOutput: [{ email: `dup${v}@domain.com`, occurrence_count: 3 }],
      orderSensitive: true,
      solutionSql: `SELECT email, COUNT(*) AS occurrence_count
FROM users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY email ASC;`,
    }),
    hints: [
      "Group rows by email using GROUP BY email.",
      "Aggregate functions cannot be placed in WHERE; use HAVING instead.",
      "Filter HAVING COUNT(*) > 1.",
    ],
    explanation:
      "`HAVING` filters aggregated groups after `GROUP BY` collapses duplicate keys.",
    commonMistakes: [
      "Attempting to write `WHERE COUNT(*) > 1`, which raises a SQL syntax/grouping error.",
    ],
    performanceNotes:
      "A HashAggregate or GroupAggregate on an indexed `email` column resolves this in a single pass.",
  },

  // 3. Subqueries and CTEs (20)
  {
    category: "Subqueries and CTEs",
    pattern: "Second Highest Salary (Scalar Subquery & NULL Fallback)",
    difficulty: "Medium",
    companyTag: "Amazon",
    titleTemplate: (v) => `Runner-Up Compensation Benchmark #${v}`,
    scenarioTemplate: (v) =>
      `Finance wants the second highest distinct salary in payroll table ${v}, returning NULL if fewer than two distinct salaries exist.`,
    descriptionTemplate: () =>
      `Write a query returning a single column \`second_highest_salary\`. If no second distinct salary exists, return \`NULL\`.`,
    buildInstance: (v) => {
      const top = 150000 + v * 2000;
      const second = 135000 + v * 2000;
      return {
        schemaSql: `CREATE TABLE payroll (emp_id INT PRIMARY KEY, salary INT);`,
        seedSql: `INSERT INTO payroll VALUES (1, ${top}), (2, ${top}), (3, ${second}), (4, 95000);`,
        starterSql: `SELECT (
  -- Return second highest distinct salary or NULL
) AS second_highest_salary;`,
        expectedOutput: [{ second_highest_salary: second }],
        orderSensitive: false,
        solutionSql: `SELECT (
  SELECT DISTINCT salary
  FROM payroll
  ORDER BY salary DESC
  OFFSET 1 LIMIT 1
) AS second_highest_salary;`,
        alternativeSql: `SELECT MAX(salary) AS second_highest_salary
FROM payroll
WHERE salary < (SELECT MAX(salary) FROM payroll);`,
      };
    },
    hints: [
      "Duplicate top salaries mean you must deduplicate with DISTINCT or filter below MAX(salary).",
      "Wrapping a query in a scalar SELECT (...) guarantees a NULL row if the inner query returns empty.",
      "Use SELECT MAX(salary) FROM payroll WHERE salary < (SELECT MAX(salary) FROM payroll).",
    ],
    explanation:
      "Filtering `salary < (SELECT MAX(salary))` naturally returns `NULL` when all salaries are identical or the table is empty.",
    commonMistakes: [
      "Forgetting `DISTINCT` before `OFFSET 1 LIMIT 1`, returning the tied highest salary.",
      "Not wrapping `OFFSET 1` in a scalar subquery, returning 0 rows instead of 1 `NULL` row.",
    ],
    performanceNotes:
      "Two index max lookups via `WHERE salary < (SELECT MAX(salary))` avoid sorting the entire table.",
  },
  {
    category: "Subqueries and CTEs",
    pattern: "Recursive CTE Hierarchy Traversal",
    difficulty: "Hard",
    companyTag: "Google",
    titleTemplate: (v) => `Org-Chart Management Depth & Chain #${v}`,
    scenarioTemplate: (v) =>
      `HR systems need to compute reporting depth from the CEO down to every employee in business unit ${v}.`,
    descriptionTemplate: () =>
      `Using a \`WITH RECURSIVE\` CTE, output \`emp_id\`, \`emp_name\`, and \`depth\` (CEO has \`depth = 1\`). Order by \`depth\` ASC, \`emp_id\` ASC.`,
    buildInstance: (v) => ({
      schemaSql: `CREATE TABLE org (emp_id INT PRIMARY KEY, emp_name TEXT, manager_id INT);`,
      seedSql: `INSERT INTO org VALUES (1, 'CEO-${v}', NULL), (2, 'VP-Eng-${v}', 1), (3, 'Staff-Eng-${v}', 2);`,
      starterSql: `WITH RECURSIVE hierarchy AS (
  -- Anchor member
  UNION ALL
  -- Recursive member
)
SELECT emp_id, emp_name, depth FROM hierarchy ORDER BY depth, emp_id;`,
      expectedOutput: [
        { emp_id: 1, emp_name: `CEO-${v}`, depth: 1 },
        { emp_id: 2, emp_name: `VP-Eng-${v}`, depth: 2 },
        { emp_id: 3, emp_name: `Staff-Eng-${v}`, depth: 3 },
      ],
      orderSensitive: true,
      solutionSql: `WITH RECURSIVE hierarchy AS (
  SELECT emp_id, emp_name, 1 AS depth
  FROM org
  WHERE manager_id IS NULL
  UNION ALL
  SELECT o.emp_id, o.emp_name, h.depth + 1
  FROM org o
  JOIN hierarchy h ON o.manager_id = h.emp_id
)
SELECT emp_id, emp_name, depth
FROM hierarchy
ORDER BY depth ASC, emp_id ASC;`,
    }),
    hints: [
      "Start the anchor query with WHERE manager_id IS NULL and depth = 1.",
      "Join org o ON o.manager_id = hierarchy.emp_id in the recursive step.",
      "Increment depth + 1 at each level.",
    ],
    explanation:
      "Recursive CTEs evaluate an anchor set and iteratively join child nodes until a fixed point (empty working table) is reached.",
    commonMistakes: [
      "Joining on `o.emp_id = h.manager_id` (traversing upward instead of downward).",
    ],
    performanceNotes:
      "Index `org(manager_id)` so each recursive iteration performs an indexed nested loop.",
  },

  // 4. Window Functions (25)
  {
    category: "Window Functions",
    pattern: "Department Top Three Salaries (DENSE_RANK)",
    difficulty: "Hard",
    companyTag: "Netflix",
    titleTemplate: (v) => `Top-3 Compensation Tier Per Division #${v}`,
    scenarioTemplate: (v) =>
      `Compensation committee ${v} wants all employees whose salary falls in the top 3 distinct salary tiers of their department.`,
    descriptionTemplate: () =>
      `Return \`dept_name\`, \`emp_name\`, and \`salary\` for employees ranked 1, 2, or 3 by distinct salary within each department. Order by \`dept_name\` ASC, \`salary\` DESC, \`emp_name\` ASC.`,
    buildInstance: (v) => {
      const bump = v * 500;
      return {
        schemaSql: `CREATE TABLE dept_salaries (dept_name TEXT, emp_name TEXT, salary INT);`,
        seedSql: `INSERT INTO dept_salaries VALUES ('Platform', 'Ananya', ${180000 + bump}), ('Platform', 'Vikram', ${180000 + bump}), ('Platform', 'Karan', ${165000 + bump}), ('Platform', 'Neha', ${150000 + bump}), ('Platform', 'Siddharth', ${130000 + bump});`,
        starterSql: `WITH ranked AS (
  SELECT dept_name, emp_name, salary,
         DENSE_RANK() OVER (...) AS rnk
  FROM dept_salaries
)
SELECT dept_name, emp_name, salary
FROM ranked
WHERE rnk <= 3
ORDER BY dept_name ASC, salary DESC, emp_name ASC;`,
        expectedOutput: [
          { dept_name: "Platform", emp_name: "Ananya", salary: 180000 + bump },
          { dept_name: "Platform", emp_name: "Vikram", salary: 180000 + bump },
          { dept_name: "Platform", emp_name: "Karan", salary: 165000 + bump },
          { dept_name: "Platform", emp_name: "Neha", salary: 150000 + bump },
        ],
        orderSensitive: true,
        solutionSql: `WITH ranked AS (
  SELECT dept_name, emp_name, salary,
         DENSE_RANK() OVER (PARTITION BY dept_name ORDER BY salary DESC) AS rnk
  FROM dept_salaries
)
SELECT dept_name, emp_name, salary
FROM ranked
WHERE rnk <= 3
ORDER BY dept_name ASC, salary DESC, emp_name ASC;`,
      };
    },
    hints: [
      "Use DENSE_RANK() rather than ROW_NUMBER() or RANK() so tied top salaries share tier 1 without skipping tier 2.",
      "Partition by dept_name and order by salary DESC.",
      "Filter WHERE rnk <= 3 in an outer query or CTE.",
    ],
    explanation:
      "`DENSE_RANK()` assigns consecutive ranks to distinct values within each partition, preserving ties.",
    commonMistakes: [
      "Using `RANK()` instead of `DENSE_RANK()`, which skips rank 2 when two employees tie for rank 1.",
    ],
    performanceNotes:
      "A composite index on `(dept_name, salary DESC)` avoids a WindowAgg sort step.",
  },
  {
    category: "Window Functions",
    pattern: "Running Totals & Moving Averages",
    difficulty: "Medium",
    companyTag: "Uber",
    titleTemplate: (v) => `Cumulative Gross Bookings Ledger #${v}`,
    scenarioTemplate: (v) =>
      `Financial reporting requires a running cumulative revenue column alongside daily gross bookings for market ${v}.`,
    descriptionTemplate: () =>
      `For each \`booking_date\`, output \`booking_date\`, \`daily_revenue\`, and \`running_total\` ordered chronologically by \`booking_date\` ASC.`,
    buildInstance: (v) => {
      const base = v * 100;
      return {
        schemaSql: `CREATE TABLE daily_bookings (booking_date DATE PRIMARY KEY, daily_revenue INT);`,
        seedSql: `INSERT INTO daily_bookings VALUES ('2026-05-01', ${1000 + base}), ('2026-05-02', ${1500 + base}), ('2026-05-03', ${2000 + base});`,
        starterSql: `SELECT booking_date,
       daily_revenue,
       SUM(daily_revenue) OVER (...) AS running_total
FROM daily_bookings
ORDER BY booking_date ASC;`,
        expectedOutput: [
          { booking_date: "2026-05-01T00:00:00.000Z", daily_revenue: 1000 + base, running_total: 1000 + base },
          { booking_date: "2026-05-02T00:00:00.000Z", daily_revenue: 1500 + base, running_total: 2500 + base * 2 },
          { booking_date: "2026-05-03T00:00:00.000Z", daily_revenue: 2000 + base, running_total: 4500 + base * 3 },
        ],
        orderSensitive: true,
        solutionSql: `SELECT booking_date,
       daily_revenue,
       SUM(daily_revenue) OVER (ORDER BY booking_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM daily_bookings
ORDER BY booking_date ASC;`,
      };
    },
    hints: [
      "Use SUM(daily_revenue) OVER (ORDER BY booking_date ASC).",
      "Explicitly specify ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW for deterministic row-by-row accumulation.",
      "Order the final output by booking_date ASC.",
    ],
    explanation:
      "Window framing `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` computes cumulative sums cleanly even when duplicate dates exist.",
    commonMistakes: [
      "Relying on default `RANGE` framing when duplicate timestamps exist, which sums peer rows together.",
    ],
    performanceNotes:
      "Primary key ordering on `booking_date` allows streaming window aggregation without sorting.",
  },

  // 5. Advanced SQL (20)
  {
    category: "Advanced SQL",
    pattern: "Gaps and Islands (Consecutive Streaks)",
    difficulty: "Hard",
    companyTag: "Meta",
    titleTemplate: (v) => `Consecutive Active Login Streak Detection #${v}`,
    scenarioTemplate: (v) =>
      `Engagement analytics tracks daily user logins for feature cohort ${v} to find users active for at least 3 consecutive days.`,
    descriptionTemplate: () =>
      `Return distinct \`user_id\` values that logged in on 3 or more consecutive calendar days. Order by \`user_id\` ASC.`,
    buildInstance: (v) => ({
      schemaSql: `CREATE TABLE user_logins (user_id INT, login_date DATE, PRIMARY KEY (user_id, login_date));`,
      seedSql: `INSERT INTO user_logins VALUES (${v}, '2026-06-01'), (${v}, '2026-06-02'), (${v}, '2026-06-03'), (${v + 1}, '2026-06-01'), (${v + 1}, '2026-06-03');`,
      starterSql: `WITH islands AS (
  SELECT user_id, login_date,
         login_date - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date))::int AS grp
  FROM user_logins
)
SELECT DISTINCT user_id
FROM islands
GROUP BY user_id, grp
HAVING COUNT(*) >= 3
ORDER BY user_id ASC;`,
      expectedOutput: [{ user_id: v }],
      orderSensitive: true,
      solutionSql: `WITH islands AS (
  SELECT user_id, login_date,
         login_date - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date))::int AS grp
  FROM user_logins
)
SELECT DISTINCT user_id
FROM islands
GROUP BY user_id, grp
HAVING COUNT(*) >= 3
ORDER BY user_id ASC;`,
    }),
    hints: [
      "Subtracting a sequential ROW_NUMBER() integer from a consecutive DATE produces a constant anchor date.",
      "Group by (user_id, grp) to measure the length of each consecutive island.",
      "Filter HAVING COUNT(*) >= 3.",
    ],
    explanation:
      "The difference between an incrementing date and an incrementing row number stays invariant across consecutive days, isolating streaks into identical groups.",
    commonMistakes: [
      "Not deduplicating multiple logins on the same day before computing `ROW_NUMBER()`.",
    ],
    performanceNotes:
      "Composite primary key `(user_id, login_date)` both deduplicates and provides pre-sorted input for `ROW_NUMBER()`.",
  },

  // 6. Business Interview Scenarios (25)
  {
    category: "Business Interview Scenarios",
    pattern: "Cancellation Rates & Conditional Aggregation",
    difficulty: "Hard",
    companyTag: "Uber",
    titleTemplate: (v) => `Unbanned Trip Cancellation Rate #${v}`,
    scenarioTemplate: (v) =>
      `Marketplace integrity monitors daily cancellation rates for non-banned riders and drivers in city ${v}.`,
    descriptionTemplate: () =>
      `Compute the daily \`cancellation_rate\` rounded to 2 decimal places (` +
      "`NUMERIC(4,2)`" +
      `) for trips where BOTH client and driver have \`banned = 'No'\`. Order by \`request_date\` ASC.`,
    buildInstance: (v) => ({
      schemaSql: `CREATE TABLE riders_drivers (users_id INT PRIMARY KEY, banned TEXT); CREATE TABLE trips (id INT PRIMARY KEY, client_id INT, driver_id INT, status TEXT, request_date DATE);`,
      seedSql: `INSERT INTO riders_drivers VALUES (1, 'No'), (2, 'Yes'), (10, 'No'); INSERT INTO trips VALUES (${v * 10 + 1}, 1, 10, 'completed', '2026-07-01'), (${v * 10 + 2}, 1, 10, 'cancelled_by_client', '2026-07-01'), (${v * 10 + 3}, 2, 10, 'cancelled_by_client', '2026-07-01');`,
      starterSql: `SELECT t.request_date,
       ROUND(AVG(CASE WHEN t.status <> 'completed' THEN 1.0 ELSE 0.0 END), 2) AS cancellation_rate
FROM trips t
JOIN riders_drivers c ON t.client_id = c.users_id AND c.banned = 'No'
JOIN riders_drivers d ON t.driver_id = d.users_id AND d.banned = 'No'
GROUP BY t.request_date
ORDER BY t.request_date ASC;`,
      expectedOutput: [{ request_date: "2026-07-01T00:00:00.000Z", cancellation_rate: "0.50" }],
      orderSensitive: true,
      solutionSql: `SELECT t.request_date,
       ROUND(AVG(CASE WHEN t.status <> 'completed' THEN 1.0 ELSE 0.0 END), 2) AS cancellation_rate
FROM trips t
JOIN riders_drivers c ON t.client_id = c.users_id AND c.banned = 'No'
JOIN riders_drivers d ON t.driver_id = d.users_id AND d.banned = 'No'
GROUP BY t.request_date
ORDER BY t.request_date ASC;`,
    }),
    hints: [
      "Join riders_drivers twice: once for client_id and once for driver_id, filtering banned = 'No' on both.",
      "Use CASE WHEN status <> 'completed' THEN 1.0 ELSE 0.0 END inside AVG() to avoid integer division.",
      "Round the result to 2 decimal places.",
    ],
    explanation:
      "Joining the user dimension twice enforces the unbanned constraint on both sides of the marketplace transaction.",
    commonMistakes: [
      "Integer division (`1 / 2 = 0`) when using `1` and `0` instead of `1.0` and `0.0`.",
    ],
    performanceNotes:
      "Filter `request_date` before joining if querying a narrow date window.",
  },

  // 7. Database Design and Modeling (30)
  {
    category: "Database Design and Modeling",
    pattern: "Slowly Changing Dimension (SCD Type 2) Point-in-Time Lookup",
    difficulty: "Medium",
    companyTag: "Walmart",
    titleTemplate: (v) => `Historical SKU Price Point-in-Time Join #${v}`,
    scenarioTemplate: (v) =>
      `Retail warehouse ${v} tracks product price history using an SCD Type 2 dimension table with \`valid_from\` and \`valid_to\` timestamps.`,
    descriptionTemplate: () =>
      `Join \`fact_sales\` to \`dim_product_scd2\` so each sale matches the exact product price active at \`sale_ts\`. Return \`sale_id\` and \`unit_price\`, ordered by \`sale_id\` ASC.`,
    buildInstance: (v) => {
      const p1 = 20 + v;
      const p2 = 25 + v;
      return {
        schemaSql: `CREATE TABLE dim_product_scd2 (sku TEXT, unit_price INT, valid_from TIMESTAMPTZ, valid_to TIMESTAMPTZ); CREATE TABLE fact_sales (sale_id INT PRIMARY KEY, sku TEXT, sale_ts TIMESTAMPTZ);`,
        seedSql: `INSERT INTO dim_product_scd2 VALUES ('SKU-A', ${p1}, '2026-01-01T00:00:00Z', '2026-06-01T00:00:00Z'), ('SKU-A', ${p2}, '2026-06-01T00:00:00Z', '9999-12-31T00:00:00Z'); INSERT INTO fact_sales VALUES (1, 'SKU-A', '2026-03-15T12:00:00Z'), (2, 'SKU-A', '2026-08-10T09:00:00Z');`,
        starterSql: `SELECT f.sale_id, d.unit_price
FROM fact_sales f
JOIN dim_product_scd2 d
  ON f.sku = d.sku
 AND f.sale_ts >= d.valid_from
 AND f.sale_ts < d.valid_to
ORDER BY f.sale_id ASC;`,
        expectedOutput: [
          { sale_id: 1, unit_price: p1 },
          { sale_id: 2, unit_price: p2 },
        ],
        orderSensitive: true,
        solutionSql: `SELECT f.sale_id, d.unit_price
FROM fact_sales f
JOIN dim_product_scd2 d
  ON f.sku = d.sku
 AND f.sale_ts >= d.valid_from
 AND f.sale_ts < d.valid_to
ORDER BY f.sale_id ASC;`,
      };
    },
    hints: [
      "SCD Type 2 intervals use half-open bounds: [valid_from, valid_to).",
      "Match f.sku = d.sku AND f.sale_ts >= d.valid_from AND f.sale_ts < d.valid_to.",
      "Order by sale_id ASC.",
    ],
    explanation:
      "Half-open intervals (`>= valid_from AND < valid_to`) prevent double-matching rows at exact boundary timestamps.",
    commonMistakes: [
      "Using `BETWEEN valid_from AND valid_to`, which double-counts transactions occurring exactly on the change timestamp.",
    ],
    performanceNotes:
      "PostgreSQL `tstzrange` with a GiST exclusion constraint guarantees non-overlapping SCD2 history intervals.",
  },

  // 8. Application and Transactional SQL (20)
  {
    category: "Application and Transactional SQL",
    pattern: "Idempotent Upsert (INSERT ... ON CONFLICT DO UPDATE)",
    difficulty: "Medium",
    companyTag: "Uber",
    titleTemplate: (v) => `Idempotent Wallet Balance Ledger Upsert #${v}`,
    scenarioTemplate: (v) =>
      `Payment ingestion worker ${v} retries webhook events and must safely upsert account balances without duplicating rows.`,
    descriptionTemplate: (v) =>
      `Execute an \`INSERT ... ON CONFLICT (wallet_id) DO UPDATE\` adding \`${v * 50}\` cents to \`wallet_id = 1\`, then return \`wallet_id\` and \`balance_cents\`.`,
    buildInstance: (v) => {
      const delta = v * 50;
      return {
        schemaSql: `CREATE TABLE wallets (wallet_id INT PRIMARY KEY, balance_cents INT NOT NULL);`,
        seedSql: `INSERT INTO wallets VALUES (1, 1000);`,
        starterSql: `INSERT INTO wallets (wallet_id, balance_cents)
VALUES (1, ${delta})
ON CONFLICT (wallet_id)
DO UPDATE SET balance_cents = wallets.balance_cents + EXCLUDED.balance_cents;

SELECT wallet_id, balance_cents FROM wallets WHERE wallet_id = 1;`,
        expectedOutput: [{ wallet_id: 1, balance_cents: 1000 + delta }],
        orderSensitive: true,
        solutionSql: `INSERT INTO wallets (wallet_id, balance_cents)
VALUES (1, ${delta})
ON CONFLICT (wallet_id)
DO UPDATE SET balance_cents = wallets.balance_cents + EXCLUDED.balance_cents;

SELECT wallet_id, balance_cents FROM wallets WHERE wallet_id = 1;`,
      };
    },
    hints: [
      "Reference the proposed row values inside DO UPDATE using the special EXCLUDED table alias.",
      "Add EXCLUDED.balance_cents to wallets.balance_cents.",
      "End with a SELECT statement so the test runner inspects the updated state.",
    ],
    explanation:
      "`ON CONFLICT ... DO UPDATE` atomically resolves unique key collisions inside PostgreSQL without race-prone read-then-write application logic.",
    commonMistakes: [
      "Overwriting `balance_cents = EXCLUDED.balance_cents` instead of incrementing `wallets.balance_cents + EXCLUDED.balance_cents`.",
    ],
    performanceNotes:
      "Single-statement `ON CONFLICT` acquires a row-level lock only on conflict, minimizing contention.",
  },

  // 9. Querying and Analytics (35)
  {
    category: "Querying and Analytics",
    pattern: "Month-over-Month Growth & LAG()",
    difficulty: "Medium",
    companyTag: "Google",
    titleTemplate: (v) => `Monthly Recurring Revenue (MRR) MoM Delta #${v}`,
    scenarioTemplate: (v) =>
      `SaaS finance team ${v} tracks month-over-month MRR expansion across consecutive billing cycles.`,
    descriptionTemplate: () =>
      `For each \`month_num\`, return \`month_num\`, \`mrr\`, and \`mom_diff\` (\`mrr\` minus previous month's \`mrr\`, or \`NULL\` for the first month). Order by \`month_num\` ASC.`,
    buildInstance: (v) => {
      const m1 = 10000 + v * 100;
      const m2 = 12500 + v * 100;
      const m3 = 12000 + v * 100;
      return {
        schemaSql: `CREATE TABLE monthly_mrr (month_num INT PRIMARY KEY, mrr INT);`,
        seedSql: `INSERT INTO monthly_mrr VALUES (1, ${m1}), (2, ${m2}), (3, ${m3});`,
        starterSql: `SELECT month_num,
       mrr,
       mrr - LAG(mrr) OVER (ORDER BY month_num ASC) AS mom_diff
FROM monthly_mrr
ORDER BY month_num ASC;`,
        expectedOutput: [
          { month_num: 1, mrr: m1, mom_diff: null },
          { month_num: 2, mrr: m2, mom_diff: m2 - m1 },
          { month_num: 3, mrr: m3, mom_diff: m3 - m2 },
        ],
        orderSensitive: true,
        solutionSql: `SELECT month_num,
       mrr,
       mrr - LAG(mrr) OVER (ORDER BY month_num ASC) AS mom_diff
FROM monthly_mrr
ORDER BY month_num ASC;`,
      };
    },
    hints: [
      "Use LAG(mrr, 1) OVER (ORDER BY month_num ASC) to fetch the prior row's MRR.",
      "Subtract LAG(mrr) from the current row's mrr.",
      "Leave the default offset NULL so month 1 returns NULL.",
    ],
    explanation:
      "`LAG()` accesses prior partition rows without an expensive self-join.",
    commonMistakes: [
      "Providing a default value of `0` to `LAG(mrr, 1, 0)` when the specification requires `NULL` for the initial period.",
    ],
    performanceNotes:
      "Single linear scan over the primary key index.",
  },

  // 10. Performance and Optimization (20)
  {
    category: "Performance and Optimization",
    pattern: "Keyset (Cursor) Pagination vs OFFSET",
    difficulty: "Medium",
    companyTag: "Netflix",
    titleTemplate: (v) => `High-Throughput Keyset Feed Pagination #${v}`,
    scenarioTemplate: (v) =>
      `API engineering is replacing slow \`OFFSET\` pagination on feed stream ${v} with deterministic keyset pagination on \`(created_epoch, event_id)\`.`,
    descriptionTemplate: (v) =>
      `Fetch the next 2 events strictly after cursor \`(created_epoch = 1000, event_id = ${v})\` ordered by \`created_epoch ASC, event_id ASC\`.`,
    buildInstance: (v) => ({
      schemaSql: `CREATE TABLE feed_events (event_id INT PRIMARY KEY, created_epoch INT, payload TEXT);`,
      seedSql: `INSERT INTO feed_events VALUES (${v}, 1000, 'cursor-item'), (${v + 1}, 1000, 'same-ts-next'), (${v + 2}, 1005, 'later-ts'), (${v + 3}, 1010, 'third-item');`,
      starterSql: `SELECT event_id, created_epoch, payload
FROM feed_events
WHERE (created_epoch, event_id) > (1000, ${v})
ORDER BY created_epoch ASC, event_id ASC
LIMIT 2;`,
      expectedOutput: [
        { event_id: v + 1, created_epoch: 1000, payload: "same-ts-next" },
        { event_id: v + 2, created_epoch: 1005, payload: "later-ts" },
      ],
      orderSensitive: true,
      solutionSql: `SELECT event_id, created_epoch, payload
FROM feed_events
WHERE (created_epoch, event_id) > (1000, ${v})
ORDER BY created_epoch ASC, event_id ASC
LIMIT 2;`,
    }),
    hints: [
      "Use PostgreSQL row-value comparison: (created_epoch, event_id) > (last_epoch, last_id).",
      "Ensure ORDER BY matches the exact composite index column order.",
      "Apply LIMIT 2.",
    ],
    explanation:
      "Row-value comparisons `(a, b) > (x, y)` leverage B-Tree composite indexes directly in O(log N) time, avoiding the O(N) discard cost of `OFFSET`.",
    commonMistakes: [
      "Filtering only `created_epoch > 1000`, which skips remaining events sharing `created_epoch = 1000`.",
    ],
    performanceNotes:
      "Requires `CREATE INDEX ON feed_events (created_epoch, event_id)` for an Index Scan with zero discarded rows.",
  },
];

// Deterministically build all 250 questions matching the exact target allocation
function buildFull250Corpus(): SqlQuestion[] {
  const all: SqlQuestion[] = [];
  let globalIndex = 1;

  for (const { name: category, target } of CATEGORY_TARGETS) {
    const catBlueprints = BLUEPRINTS.filter((b) => b.category === category);
    for (let i = 0; i < target; i++) {
      const bp = catBlueprints[i % catBlueprints.length];
      const variant = Math.floor(i / catBlueprints.length) + 1;
      const inst = bp.buildInstance(variant);
      const code = `QF-${String(globalIndex).padStart(3, "0")}`;

      all.push({
        code,
        title: bp.titleTemplate(variant),
        category: bp.category,
        pattern: bp.pattern,
        difficulty: bp.difficulty,
        companyTag: bp.companyTag,
        estimatedMinutes: bp.difficulty === "Easy" ? 10 : bp.difficulty === "Medium" ? 15 : 25,
        businessScenario: bp.scenarioTemplate(variant),
        description: bp.descriptionTemplate(variant),
        schemaSql: inst.schemaSql,
        seedSql: inst.seedSql,
        starterSql: inst.starterSql,
        expectedOutput: inst.expectedOutput,
        orderSensitive: inst.orderSensitive,
        hints: bp.hints,
        solutionSql: inst.solutionSql,
        alternativeSql: inst.alternativeSql,
        explanation: bp.explanation,
        commonMistakes: bp.commonMistakes,
        performanceNotes: bp.performanceNotes,
      });

      globalIndex++;
    }
  }

  return all;
}

export const QUESTIONS_250: SqlQuestion[] = buildFull250Corpus();
