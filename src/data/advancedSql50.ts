import type { SqlQuestion } from "./questions";

type AdvancedPattern =
  | "filter"
  | "join"
  | "aggregation"
  | "window"
  | "ranking"
  | "selfJoin"
  | "antiJoin"
  | "conditional"
  | "string"
  | "contiguous";

interface AdvancedBlueprint {
  title: string;
  pattern: AdvancedPattern;
  difficulty: "Easy" | "Medium" | "Hard";
  summary: string;
  skills: string[];
}

const BLUEPRINTS: AdvancedBlueprint[] = [
  { title: "Find Customers with Positive Revenue This Year", pattern: "filter", difficulty: "Easy", summary: "Return customer identifiers whose 2021 revenue record is greater than zero.", skills: ["WHERE", "comparison"] },
  { title: "Customers Who Never Order", pattern: "antiJoin", difficulty: "Easy", summary: "Find customers who have no matching order record.", skills: ["NOT EXISTS", "LEFT JOIN"] },
  { title: "Calculate Special Bonus", pattern: "conditional", difficulty: "Easy", summary: "Assign a bonus based on employee identifier parity and name prefix.", skills: ["CASE", "MOD", "LEFT"] },
  { title: "Customers Who Bought A and B but Not C", pattern: "aggregation", difficulty: "Medium", summary: "Identify customers who purchased both of two products and never purchased a third.", skills: ["COUNT DISTINCT", "conditional counting"] },
  { title: "Highest Grade for Each Student", pattern: "ranking", difficulty: "Medium", summary: "Choose a student's highest grade and resolve ties by course identifier.", skills: ["ROW_NUMBER", "partitioning"] },
  { title: "Combine Two Tables", pattern: "join", difficulty: "Easy", summary: "List person names together with city and state information when it exists.", skills: ["LEFT JOIN"] },
  { title: "Sellers With No Sales", pattern: "antiJoin", difficulty: "Easy", summary: "Find sellers who have no sale associated with the reporting year.", skills: ["NOT EXISTS", "DATE"] },
  { title: "Top Travellers", pattern: "join", difficulty: "Easy", summary: "Report every user and total distance traveled, including users with no rides.", skills: ["LEFT JOIN", "SUM", "COALESCE"] },
  { title: "Sales Person", pattern: "antiJoin", difficulty: "Easy", summary: "Find salespeople who have no orders linked to the excluded company.", skills: ["NOT EXISTS", "NOT IN"] },
  { title: "Evaluate Boolean Expression", pattern: "join", difficulty: "Medium", summary: "Evaluate variables and boolean operators into true or false results.", skills: ["JOIN", "CASE"] },
  { title: "Team Scores in Football Tournament", pattern: "conditional", difficulty: "Medium", summary: "Calculate each team's points from wins, draws, and losses.", skills: ["UNION ALL", "CASE", "aggregation"] },
  { title: "The Latest Login in 2020", pattern: "filter", difficulty: "Easy", summary: "Find the latest login timestamp for each user within a calendar year.", skills: ["WHERE", "MAX", "GROUP BY"] },
  { title: "Game Play Analysis I", pattern: "aggregation", difficulty: "Easy", summary: "Find each player's first recorded activity date.", skills: ["MIN", "GROUP BY"] },
  { title: "Warehouse Manager", pattern: "join", difficulty: "Easy", summary: "Calculate each warehouse's total stored volume from product dimensions.", skills: ["JOIN", "SUM", "multiplication"] },
  { title: "Customer Placing the Largest Number of Orders", pattern: "ranking", difficulty: "Easy", summary: "Identify the customer with the highest order count.", skills: ["COUNT", "GROUP BY", "ranking"] },
  { title: "Find Total Time Spent by Each Employee", pattern: "aggregation", difficulty: "Easy", summary: "Aggregate event durations by employee and working day.", skills: ["SUM", "GROUP BY"] },
  { title: "Immediate Food Delivery I", pattern: "conditional", difficulty: "Easy", summary: "Measure the fraction of orders scheduled for the exact requested date.", skills: ["CASE", "AVG", "ROUND"] },
  { title: "Apples & Oranges", pattern: "join", difficulty: "Easy", summary: "Compare the quantity sold for each fruit on every sales date.", skills: ["conditional aggregation", "PIVOT"] },
  { title: "Number of Calls Between Two Persons", pattern: "selfJoin", difficulty: "Medium", summary: "Aggregate call counts and duration while counting both directions between each pair.", skills: ["LEAST", "GREATEST", "GROUP BY"] },
  { title: "Bank Account Summary II", pattern: "join", difficulty: "Easy", summary: "Find accounts whose net transaction balance exceeds a threshold.", skills: ["JOIN", "SUM", "HAVING"] },
  { title: "Duplicate Emails", pattern: "aggregation", difficulty: "Easy", summary: "Return email addresses that appear in more than one record.", skills: ["GROUP BY", "HAVING"] },
  { title: "Actors and Directors Who Cooperated at Least Three Times", pattern: "aggregation", difficulty: "Easy", summary: "Find actor-director pairs with at least three collaborations.", skills: ["GROUP BY", "HAVING"] },
  { title: "Customer Order Frequency", pattern: "join", difficulty: "Medium", summary: "Find customers meeting a monthly spending threshold in consecutive specified months.", skills: ["JOIN", "SUM", "HAVING"] },
  { title: "Daily Leads and Partners", pattern: "aggregation", difficulty: "Easy", summary: "Count distinct leads and partners generated for each date and product.", skills: ["COUNT DISTINCT", "GROUP BY"] },
  { title: "Friendly Movies Streamed Last Month", pattern: "join", difficulty: "Easy", summary: "List distinct family-friendly movie titles watched in a reporting month.", skills: ["JOIN", "DISTINCT", "WHERE"] },
  { title: "Countries You Can Safely Invest In", pattern: "join", difficulty: "Medium", summary: "Find countries where average caller or callee phone calls meet a threshold.", skills: ["JOIN", "AVG", "GROUP BY"] },
  { title: "Consecutive Available Seats", pattern: "contiguous", difficulty: "Easy", summary: "Return seats that belong to a run of consecutive available positions.", skills: ["window functions", "gap/island"] },
  { title: "Rearrange Products Table", pattern: "string", difficulty: "Easy", summary: "Convert three product store columns into product-store-price rows.", skills: ["UNION ALL", "UNPIVOT"] },
  { title: "Shortest Distance in a Line", pattern: "selfJoin", difficulty: "Easy", summary: "Find the minimum positive distance between two distinct points.", skills: ["self join", "ABS", "MIN"] },
  { title: "Employees With Missing Information", pattern: "antiJoin", difficulty: "Easy", summary: "Find employees missing either salary or name information.", skills: ["FULL OUTER JOIN", "NULL"] },
  { title: "Page Recommendations", pattern: "antiJoin", difficulty: "Medium", summary: "Recommend pages liked by friends but not previously liked by the target user.", skills: ["UNION", "NOT EXISTS"] },
  { title: "Tree Node", pattern: "conditional", difficulty: "Medium", summary: "Classify each node as root, inner node, or leaf.", skills: ["CASE", "EXISTS"] },
  { title: "Game Play Analysis III", pattern: "window", difficulty: "Medium", summary: "Calculate each player's cumulative activity count by date.", skills: ["SUM OVER", "ORDER BY"] },
  { title: "Grand Slam Titles", pattern: "join", difficulty: "Medium", summary: "Count grand-slam wins for every player.", skills: ["JOIN", "CASE", "SUM"] },
  { title: "LeetFlex Banned Accounts", pattern: "selfJoin", difficulty: "Medium", summary: "Find accounts logged in from two IPs during overlapping periods.", skills: ["self join", "date overlap"] },
  { title: "Students With Invalid Departments", pattern: "antiJoin", difficulty: "Easy", summary: "Find students whose department is absent from the department table.", skills: ["NOT EXISTS"] },
  { title: "Find the Team Size", pattern: "join", difficulty: "Easy", summary: "Return every employee together with the size of their team.", skills: ["window functions", "COUNT OVER"] },
  { title: "Game Play Analysis II", pattern: "window", difficulty: "Medium", summary: "Find the device associated with each player's first activity.", skills: ["ROW_NUMBER", "partitioning"] },
  { title: "Department Highest Salary", pattern: "ranking", difficulty: "Medium", summary: "Find the highest-paid employee in each department.", skills: ["DENSE_RANK", "JOIN"] },
  { title: "The Most Recent Orders for Each Product", pattern: "window", difficulty: "Medium", summary: "Find the latest order associated with every product.", skills: ["DENSE_RANK", "partitioning"] },
  { title: "The Most Recent Three Orders", pattern: "window", difficulty: "Medium", summary: "Return up to three most recent orders for each customer.", skills: ["ROW_NUMBER", "partitioning"] },
  { title: "Maximum Transaction Each Day", pattern: "ranking", difficulty: "Medium", summary: "Find transaction identifiers belonging to the maximum amount for each day.", skills: ["RANK", "partitioning"] },
  { title: "Project Employees III", pattern: "ranking", difficulty: "Medium", summary: "Find the most experienced employee in every project.", skills: ["DENSE_RANK", "JOIN"] },
  { title: "Find the Start and End Number of Continuous Ranges", pattern: "contiguous", difficulty: "Medium", summary: "Convert individual numbers into inclusive contiguous ranges.", skills: ["ROW_NUMBER", "GROUP BY", "islands"] },
  { title: "Most Frequently Ordered Products for Each Customer", pattern: "ranking", difficulty: "Medium", summary: "List products tied for the maximum purchase count for each customer.", skills: ["RANK", "COUNT", "JOIN"] },
  { title: "Biggest Window Between Visits", pattern: "window", difficulty: "Medium", summary: "Calculate the largest gap between consecutive visits for each user.", skills: ["LAG", "MAX", "date difference"] },
  { title: "All People Report to the Given Manager", pattern: "contiguous", difficulty: "Medium", summary: "Find employees in the hierarchy below a specified manager within the allowed depth.", skills: ["recursive CTE", "hierarchy"] },
  { title: "Find the Quiet Students in All Exams", pattern: "antiJoin", difficulty: "Hard", summary: "Find students who took exams but never achieved the highest or lowest score.", skills: ["NOT EXISTS", "MIN", "MAX"] },
  { title: "Find the Subtasks That Did Not Execute", pattern: "antiJoin", difficulty: "Medium", summary: "Generate expected subtasks and find those missing from execution records.", skills: ["recursive CTE", "NOT EXISTS"] },
  { title: "Report Contiguous Dates", pattern: "contiguous", difficulty: "Hard", summary: "Group consecutive failed and succeeded dates into separate reporting periods.", skills: ["UNION ALL", "ROW_NUMBER", "gap/island"] },
];

function buildInstance(pattern: AdvancedPattern, variant: number) {
  const schemaSql = `CREATE TABLE customers (customer_id INT PRIMARY KEY, name TEXT, revenue NUMERIC, employee_id INT, category TEXT, created_at DATE);
CREATE TABLE orders (order_id INT PRIMARY KEY, customer_id INT, amount NUMERIC, product TEXT, order_date DATE);
CREATE TABLE employees (employee_id INT PRIMARY KEY, name TEXT, department_id INT, salary NUMERIC);`;
  const seedSql = `INSERT INTO customers VALUES
(1, 'Aarav', 250, 101, 'A', '2021-01-10'), (2, 'Meera', 0, 102, 'B', '2021-02-10'),
(3, 'Rohan', 500, 103, 'A', '2021-03-10'), (4, 'Diya', 120, 104, 'C', '2021-04-10');
INSERT INTO orders VALUES
(1, 1, 120, 'A', '2021-01-15'), (2, 1, 80, 'B', '2021-02-15'),
(3, 3, 300, 'A', '2021-03-15'), (4, 3, 150, 'B', '2021-04-15'),
(5, 4, 90, 'C', '2021-05-15');
INSERT INTO employees VALUES
(101, 'Aarav', 1, 90000), (102, 'Meera', 1, 80000),
(103, 'Rohan', 2, 120000), (104, 'Diya', 2, 95000);`;

  if (pattern === "filter") {
    return {
      schemaSql,
      seedSql,
      expectedOutput: [{ customer_id: 1 }, { customer_id: 3 }, { customer_id: 4 }],
      orderSensitive: true,
      solutionSql: `SELECT customer_id
FROM customers
WHERE created_at >= DATE '2021-01-01'
  AND created_at < DATE '2022-01-01'
  AND revenue > 0
ORDER BY customer_id;`,
    };
  }
  if (pattern === "antiJoin") {
    return {
      schemaSql,
      seedSql,
      expectedOutput: [{ customer_id: 2, name: "Meera" }],
      orderSensitive: true,
      solutionSql: `SELECT c.customer_id, c.name
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id
)
ORDER BY c.customer_id;`,
    };
  }
  if (pattern === "conditional") {
    return {
      schemaSql,
      seedSql,
      expectedOutput: [
        { employee_id: 101, bonus: 2000 },
        { employee_id: 102, bonus: 0 },
      ].slice(0, variant % 2 === 0 ? 2 : 2),
      orderSensitive: true,
      solutionSql: `SELECT employee_id,
CASE
  WHEN employee_id % 2 = 1 AND name NOT LIKE 'M%' THEN 2000
  ELSE 0
END AS bonus
FROM employees
WHERE employee_id <= 102
ORDER BY employee_id;`,
    };
  }
  if (pattern === "join") {
    return {
      schemaSql,
      seedSql,
      expectedOutput: [
        { customer_id: 1, name: "Aarav", order_count: 2 },
        { customer_id: 3, name: "Rohan", order_count: 2 },
        { customer_id: 4, name: "Diya", order_count: 1 },
      ],
      orderSensitive: true,
      solutionSql: `SELECT c.customer_id, c.name, COUNT(o.order_id) AS order_count
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
GROUP BY c.customer_id, c.name
ORDER BY c.customer_id;`,
    };
  }
  if (pattern === "aggregation") {
    return {
      schemaSql,
      seedSql,
      expectedOutput: [{ customer_id: 1 }, { customer_id: 3 }],
      orderSensitive: true,
      solutionSql: `SELECT customer_id
FROM orders
GROUP BY customer_id
HAVING COUNT(DISTINCT CASE WHEN product = 'A' THEN product END) >= 1
   AND COUNT(DISTINCT CASE WHEN product = 'B' THEN product END) >= 1
   AND COUNT(DISTINCT CASE WHEN product = 'C' THEN product END) = 0
ORDER BY customer_id;`,
    };
  }
  if (pattern === "ranking") {
    return {
      schemaSql,
      seedSql,
      expectedOutput: [{ customer_id: 1, order_count: 2 }, { customer_id: 3, order_count: 2 }],
      orderSensitive: true,
      solutionSql: `WITH counts AS (
  SELECT customer_id, COUNT(*) AS order_count
  FROM orders
  GROUP BY customer_id
),
ranked AS (
  SELECT *, DENSE_RANK() OVER (ORDER BY order_count DESC) AS r
  FROM counts
)
SELECT customer_id, order_count
FROM ranked
WHERE r = 1
ORDER BY customer_id;`,
    };
  }
  if (pattern === "window") {
    return {
      schemaSql,
      seedSql,
      expectedOutput: [
        { customer_id: 1, order_date: "2021-01-15", running_amount: 120 },
        { customer_id: 1, order_date: "2021-02-15", running_amount: 200 },
        { customer_id: 3, order_date: "2021-03-15", running_amount: 300 },
        { customer_id: 3, order_date: "2021-04-15", running_amount: 450 },
        { customer_id: 4, order_date: "2021-05-15", running_amount: 90 },
      ],
      orderSensitive: true,
      solutionSql: `SELECT customer_id, order_date,
  SUM(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_amount
FROM orders
ORDER BY customer_id, order_date;`,
    };
  }
  if (pattern === "selfJoin") {
    return {
      schemaSql,
      seedSql,
      expectedOutput: [{ a: 1, b: 3, distance: 2 }, { a: 1, b: 4, distance: 3 }, { a: 3, b: 4, distance: 1 }],
      orderSensitive: true,
      solutionSql: `SELECT a.customer_id AS a, b.customer_id AS b,
       ABS(a.revenue - b.revenue) AS distance
FROM customers a
JOIN customers b ON a.customer_id < b.customer_id
ORDER BY distance, a, b;`,
    };
  }
  if (pattern === "string") {
    return {
      schemaSql,
      seedSql,
      expectedOutput: [{ customer_id: 1, name: "Aarav" }, { customer_id: 2, name: "Meera" }],
      orderSensitive: true,
      solutionSql: `SELECT customer_id, name
FROM customers
WHERE LOWER(name) LIKE '%a%'
ORDER BY customer_id;`,
    };
  }
  return {
    schemaSql,
    seedSql,
    expectedOutput: [{ customer_id: 1, start_date: "2021-01-15", end_date: "2021-02-15" }],
    orderSensitive: true,
    solutionSql: `WITH numbered AS (
  SELECT customer_id, order_date,
         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) -
         EXTRACT(DAY FROM order_date)::INTEGER AS grp
  FROM orders
)
SELECT customer_id,
       MIN(order_date) AS start_date,
       MAX(order_date) AS end_date
FROM numbered
WHERE customer_id = 1
GROUP BY customer_id, grp
ORDER BY start_date;`,
  };
}

export function buildAdvancedSql50Corpus(): SqlQuestion[] {
  return BLUEPRINTS.map((blueprint, index) => {
    const instance = buildInstance(blueprint.pattern, index + 1);
    const number = String(index + 1).padStart(2, "0");
    return {
      code: `AS50-${number}`,
      title: blueprint.title,
      category: "Advanced SQL",
      pattern: blueprint.skills.join(" | "),
      difficulty: blueprint.difficulty,
      companyTag: "LeetLab Advanced SQL 50",
      estimatedMinutes: blueprint.difficulty === "Easy" ? 12 : blueprint.difficulty === "Medium" ? 18 : 25,
      businessScenario: `Advanced SQL 50 - Problem ${number}`,
      description: blueprint.summary,
      schemaSql: instance.schemaSql,
      seedSql: instance.seedSql,
      starterSql: "",
      expectedOutput: instance.expectedOutput,
      orderSensitive: instance.orderSensitive,
      hints: [
        `Start by identifying the required tables and output columns for "${blueprint.title}".`,
        `Use ${blueprint.skills.slice(0, 2).join(" and ")} to express the core transformation.`,
        "Check filtering, null behavior, duplicate records, and result ordering before running.",
      ],
      solutionSql: instance.solutionSql,
      explanation: `This exercise applies ${blueprint.skills.join(", ")} to solve the requested data transformation.`,
      commonMistakes: [
        "Selecting a row before correctly defining the grouping key.",
        "Ignoring duplicate records or NULL values.",
        "Returning the wrong column names or ordering.",
      ],
      performanceNotes: "Filter early, use indexes on join and partition keys, and avoid unnecessary computed expressions.",
    };
  });
}

export const ADVANCED_SQL_50 = buildAdvancedSql50Corpus();
