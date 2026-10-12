// Comprehensive mock data for Job Readiness & Assessment Platform

export const INITIAL_CANDIDATE = {
  id: "cand-101",
  name: "John Doe",
  email: "john.doe@techgrad.edu",
  mobile: "+1 (555) 349-2810",
  college: "ABC University of Technology",
  degree: "Bachelor of Technology (B.Tech)",
  branch: "Computer Science & Engineering",
  graduationYear: "2026",
  experienceLevel: "Fresher",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  jobReadinessScore: 78,
  readinessLevel: "Job Ready — With Improvement Areas",
  readinessStatus: "Good Progress",
  aptitudeScore: 82,
  reasoningScore: 74,
  technicalScore: 78,
  assessmentsCompleted: 4,
  registeredAt: "2026-07-15",
  recentScores: [
    { assessment: "Assessment 1", score: 62, date: "Aug 02" },
    { assessment: "Assessment 2", score: 69, date: "Aug 10" },
    { assessment: "Assessment 3", score: 74, date: "Aug 20" },
    { assessment: "Assessment 4", score: 78, date: "Aug 30" }
  ],
  strongAreas: [
    { name: "Logical Reasoning", mastery: 88, category: "Reasoning" },
    { name: "Problem Solving", mastery: 85, category: "Reasoning" },
    { name: "Python Fundamentals", mastery: 84, category: "Technical" },
    { name: "Data Structures (Arrays/Strings)", mastery: 82, category: "Technical" }
  ],
  needsImprovement: [
    { name: "Quantitative Aptitude (Probability & Permutations)", mastery: 58, category: "Aptitude" },
    { name: "SQL Joins & Window Functions", mastery: 54, category: "Technical" },
    { name: "Advanced Graph Algorithms", mastery: 60, category: "Technical" }
  ],
  aiInsights: {
    summary: "You demonstrate strong logical reasoning and programming fundamentals. Your biggest improvement opportunity is quantitative aptitude and SQL. Improving these areas could significantly increase your overall job-readiness score from 78 to 88+.",
    strengths: [
      "Logical reasoning and deductive deduction",
      "Programming fundamentals and algorithmic complexity analysis",
      "Core array and string manipulation problem solving",
      "Object-Oriented Programming (OOP) concepts"
    ],
    weaknesses: [
      "SQL subqueries, aggregation, and window functions",
      "Quantitative aptitude: Probability, Permutation & Combinations",
      "Complex tree traversals and dynamic programming optimization"
    ],
    skillGaps: [
      { skill: "SQL Query Optimization", candidateLevel: "54%", requiredLevel: "80%", gap: "-26%", priority: "High" },
      { skill: "Quantitative Aptitude", candidateLevel: "58%", requiredLevel: "75%", gap: "-17%", priority: "High" },
      { skill: "Graph Algorithms", candidateLevel: "60%", requiredLevel: "75%", gap: "-15%", priority: "Medium" },
      { skill: "System Design Basics", candidateLevel: "68%", requiredLevel: "75%", gap: "-7%", priority: "Low" }
    ],
    prescriptivePlan: "Focus on SQL joins, aggregation, and window functions for the next 7 days. Complete 3 quantitative aptitude practice sets and retake the technical assessment."
  }
};

export const INITIAL_ASSESSMENTS = [
  {
    id: 'asm-tech-1',
    title: 'Technical Readiness Assessment',
    description: 'Data structures, algorithms, OOP, SQL, web development & operating systems.',
    category: 'Technical',
    difficulty: 'Medium',
    duration_minutes: 10,
    durationMinutes: 10,
    total_questions: 10,
    totalQuestions: 10,
    total_marks: 40,
    totalMarks: 40,
    passing_score: 65,
    passingScore: 65,
    topics: [
      'Database Management & SQL',
      'Data Structures & Algorithms',
      'Object-Oriented Programming',
      'Web & Programming Languages',
      'Operating Systems & Networks'
    ],
    status: 'Active'
  },
  {
    id: 'asm-apt-1',
    title: 'Aptitude Mock Test',
    description: 'Quantitative aptitude, arithmetic, ratios, probability & data interpretation.',
    category: 'Aptitude',
    difficulty: 'Medium',
    duration_minutes: 10,
    durationMinutes: 10,
    total_questions: 10,
    totalQuestions: 10,
    total_marks: 40,
    totalMarks: 40,
    passing_score: 60,
    passingScore: 60,
    topics: [
      'Ratios, Percentages & Averages',
      'Arithmetic & Speed Calculations',
      'Probability & Combinatorics'
    ],
    status: 'Active'
  },
  {
    id: 'asm-reas-1',
    title: 'Logical Reasoning Assessment',
    description: 'Logical deduction, pattern recognition, syllogisms & analytical reasoning.',
    category: 'Reasoning',
    difficulty: 'Medium',
    duration_minutes: 10,
    durationMinutes: 10,
    total_questions: 10,
    totalQuestions: 10,
    total_marks: 40,
    totalMarks: 40,
    passing_score: 60,
    passingScore: 60,
    topics: [
      'Direction Sense & Seating',
      'Series, Patterns & Analogies',
      'Logical Deduction & Syllogisms'
    ],
    status: 'Active'
  },
  {
    id: 'asm-code-1',
    title: 'Coding Assessment',
    description: 'Algorithmic challenges, code execution sandboxes, test suites (Python, JS, C++, Java).',
    category: 'Coding',
    difficulty: 'Medium',
    duration_minutes: 10,
    durationMinutes: 10,
    total_questions: 4,
    totalQuestions: 4,
    total_marks: 40,
    totalMarks: 40,
    passing_score: 70,
    passingScore: 70,
    topics: [
      'Algorithmic Problem Solving'
    ],
    status: 'Active'
  }
];

export const INITIAL_QUESTION_BANK = [
  // ── TECHNICAL (10 UNIQUE) ──
  {
    id: 'q-tech-101',
    category: 'Technical',
    topic: 'Operating Systems & Networks',
    difficulty: 'Easy',
    type: 'Single Choice',
    question: 'What is the primary difference between a process and a thread in modern operating systems?',
    options: [
      'Threads within a process share the same memory space and address range',
      'Processes share the same address space while threads have separate memory',
      'A thread cannot be scheduled independently by the operating system kernel',
      'Processes have significantly lower context switching overhead than threads'
    ],
    correctAnswer: 'A',
    marks: 4,
    explanation: 'Threads within the same process share code, data, and OS resources, whereas processes run in distinct address spaces.'
  },
  {
    id: 'q-tech-102',
    category: 'Technical',
    topic: 'Operating Systems & Networks',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'Which HTTP response status code indicates that the client request cannot be completed because authentication credentials are required?',
    options: ['400 Bad Request', '401 Unauthorized', '403 Forbidden', '404 Not Found'],
    correctAnswer: 'B',
    marks: 4,
    explanation: 'HTTP 401 Unauthorized indicates that the request requires user authentication or provided credentials are invalid.'
  },
  {
    id: 'q-tech-103',
    category: 'Technical',
    topic: 'Database Management & SQL',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'In relational database transactions, what does the ACID property "Atomicity" guarantee?',
    options: [
      'Transactions execute independently without interleaved race conditions',
      'All operations within a transaction succeed completely or none take effect',
      'Data remains strictly consistent across all distributed nodes at all times',
      'Committed transactions survive subsequent server crashes or power failures'
    ],
    correctAnswer: 'B',
    marks: 4,
    explanation: 'Atomicity enforces an "all-or-nothing" rule: if any part of a transaction fails, the entire transaction is rolled back.'
  },
  {
    id: 'q-tech-104',
    category: 'Technical',
    topic: 'Data Structures & Algorithms',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'Which sorting algorithm has a worst-case time complexity of O(n^2) when the array is already sorted and the last element is chosen as pivot?',
    options: ['Merge Sort', 'Heap Sort', 'Quick Sort', 'Radix Sort'],
    correctAnswer: 'C',
    marks: 4,
    explanation: 'Standard Quick Sort degrades to O(n^2) when partitioning an already sorted array around the extreme boundary pivot.'
  },
  {
    id: 'q-tech-105',
    category: 'Technical',
    topic: 'Web & Programming Languages',
    difficulty: 'Easy',
    type: 'Single Choice',
    question: 'In JavaScript and Node.js runtime, which mechanism allows asynchronous operations without freezing execution on the single thread?',
    options: [
      'Multi-threaded preemptive kernel scheduling',
      'Event Loop and Non-Blocking I/O Callback Queue',
      'Synchronous bytecode execution in separate threads',
      'Automatic CPU affinity core allocation'
    ],
    correctAnswer: 'B',
    marks: 4,
    explanation: 'JavaScript uses the Event Loop model with a call stack and callback/microtask queues to orchestrate asynchronous non-blocking tasks.'
  },
  {
    id: 'q-tech-201',
    category: 'Technical',
    topic: 'Database Management & SQL',
    difficulty: 'Easy',
    type: 'Single Choice',
    question: 'Which SQL keyword is used to return only unique, non-repeating values in a query result set?',
    options: ['UNIQUE', 'DISTINCT', 'DIFFERENT', 'EXCLUSIVE'],
    correctAnswer: 'B',
    marks: 4,
    explanation: 'The DISTINCT keyword in SQL eliminates duplicate records from the query result set.'
  },
  {
    id: 'q-tech-202',
    category: 'Technical',
    topic: 'Data Structures & Algorithms',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'Which data structure follows the Last In, First Out (LIFO) order of execution?',
    options: ['Queue', 'Stack', 'Linked List', 'Binary Tree'],
    correctAnswer: 'B',
    marks: 4,
    explanation: 'A Stack follows the Last In, First Out (LIFO) protocol where elements are pushed and popped from the top.'
  },
  {
    id: 'q-tech-203',
    category: 'Technical',
    topic: 'Object-Oriented Programming',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'In Object-Oriented Programming, when a child class provides a specific implementation of a method defined in its superclass, this is known as:',
    options: ['Method Overloading', 'Method Overriding', 'Data Abstraction', 'Information Hiding'],
    correctAnswer: 'B',
    marks: 4,
    explanation: 'Method Overriding occurs when a subclass redefines a method from its superclass with the exact same signature.'
  },
  {
    id: 'q-tech-204',
    category: 'Technical',
    topic: 'Data Structures & Algorithms',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'What is the average time complexity of searching an element in a balanced Binary Search Tree (BST)?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 'B',
    marks: 4,
    explanation: 'In a balanced BST with n nodes, the height is approximately log2(n), yielding an average search complexity of O(log n).'
  },
  {
    id: 'q-tech-205',
    category: 'Technical',
    topic: 'Database Management & SQL',
    difficulty: 'Hard',
    type: 'Single Choice',
    question: 'Which normal form requires removing transitive dependencies, ensuring non-key attributes depend only on the primary key?',
    options: ['1NF', '2NF', '3NF', 'Boyce-Codd NF'],
    correctAnswer: 'C',
    marks: 4,
    explanation: 'Third Normal Form (3NF) mandates that a table is in 2NF and contains no transitive functional dependencies.'
  },

  // ── APTITUDE (10 UNIQUE) ──
  {
    id: 'q-apt-101',
    category: 'Aptitude',
    topic: 'Ratios, Percentages & Averages',
    difficulty: 'Easy',
    type: 'Single Choice',
    question: 'If the ratio of two numbers is 3:5 and their sum is 240, what is the value of the larger number?',
    options: ['120', '135', '150', '160'],
    correctAnswer: 'C',
    marks: 4,
    explanation: '3x + 5x = 8x = 240 => x = 30. The larger number is 5 * 30 = 150.'
  },
  {
    id: 'q-apt-102',
    category: 'Aptitude',
    topic: 'Arithmetic & Speed Calculations',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'A car covers a distance of 180 km at a speed of 60 km/h and returns at 90 km/h. What is the average speed for the round trip?',
    options: ['72 km/h', '75 km/h', '70 km/h', '80 km/h'],
    correctAnswer: 'A',
    marks: 4,
    explanation: 'Average speed = 2 * v1 * v2 / (v1 + v2) = (2 * 60 * 90) / 150 = 72 km/h.'
  },
  {
    id: 'q-apt-103',
    category: 'Aptitude',
    topic: 'Ratios, Percentages & Averages',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'The average age of 5 employees is 28 years. When a new manager joins, the average age increases by 2 years. What is the age of the manager?',
    options: ['36 years', '40 years', '38 years', '42 years'],
    correctAnswer: 'B',
    marks: 4,
    explanation: 'Initial total age = 5 * 28 = 140. New total age = 6 * 30 = 180. Manager age = 180 - 140 = 40 years.'
  },
  {
    id: 'q-apt-104',
    category: 'Aptitude',
    topic: 'Probability & Combinatorics',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'In how many distinct ways can the letters of the word "READY" be uniquely arranged?',
    options: ['60', '120', '24', '720'],
    correctAnswer: 'B',
    marks: 4,
    explanation: 'The word READY has 5 distinct letters. Number of permutations = 5! = 120.'
  },
  {
    id: 'q-apt-105',
    category: 'Aptitude',
    topic: 'Arithmetic & Speed Calculations',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'A sum of money invested at simple interest amounts to $750 in 3 years and $900 in 5 years. What is the original principal?',
    options: ['$500', '$525', '$550', '$600'],
    correctAnswer: 'B',
    marks: 4,
    explanation: 'Interest in 2 years = $150 => $75/year. Principal = 750 - (3 * 75) = $525.'
  },
  {
    id: 'q-apt-201',
    category: 'Aptitude',
    topic: 'Arithmetic & Speed Calculations',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'A train moving at 72 km/h completely crosses a standing pole in 15 seconds. What is the length of the train in meters?',
    options: ['200 m', '250 m', '300 m', '350 m'],
    correctAnswer: 'C',
    marks: 4,
    explanation: 'Speed in m/s = 72 * (5/18) = 20 m/s. Distance = Speed * Time = 20 * 15 = 300 meters.'
  },
  {
    id: 'q-apt-202',
    category: 'Aptitude',
    topic: 'Ratios, Percentages & Averages',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'A shopkeeper marks an item 40% above the cost price and allows a 20% discount. What is his net profit percentage?',
    options: ['12%', '15%', '18%', '20%'],
    correctAnswer: 'A',
    marks: 4,
    explanation: 'Let CP = 100. Marked Price = 140. Discount = 20% of 140 = 28. SP = 112. Profit = 12%.'
  },
  {
    id: 'q-apt-203',
    category: 'Aptitude',
    topic: 'Probability & Combinatorics',
    difficulty: 'Easy',
    type: 'Single Choice',
    question: 'A bag contains 5 red balls, 4 green balls, and 3 blue balls. If a ball is picked at random, what is the probability that it is green?',
    options: ['1/4', '1/3', '5/12', '4/15'],
    correctAnswer: 'B',
    marks: 4,
    explanation: 'Total balls = 12. P(Green) = 4 / 12 = 1/3.'
  },
  {
    id: 'q-apt-204',
    category: 'Aptitude',
    topic: 'Arithmetic & Speed Calculations',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'Worker A can complete a task in 12 days, and Worker B can complete the same task in 16 days. If they work together, how many days will it take?',
    options: ['6.86 days', '7.20 days', '6.50 days', '8.00 days'],
    correctAnswer: 'A',
    marks: 4,
    explanation: 'Combined rate = 1/12 + 1/16 = 7/48. Time = 48/7 = 6.86 days.'
  },
  {
    id: 'q-apt-205',
    category: 'Aptitude',
    topic: 'Ratios, Percentages & Averages',
    difficulty: 'Easy',
    type: 'Single Choice',
    question: 'What is 15% of 250 added to 25% of 150?',
    options: ['75', '80', '65', '70'],
    correctAnswer: 'A',
    marks: 4,
    explanation: '37.5 + 37.5 = 75.'
  },

  // ── REASONING (10 UNIQUE) ──
  {
    id: 'q-reas-101',
    category: 'Reasoning',
    topic: 'Series, Patterns & Analogies',
    difficulty: 'Easy',
    type: 'Single Choice',
    question: 'Find the next number in the pattern of squares: 4, 9, 16, 25, 36, 49, 64, 81, ?',
    options: ['96', '100', '121', '144'],
    correctAnswer: 'B',
    marks: 4,
    explanation: 'Consecutive integers squared: 10^2 = 100.'
  },
  {
    id: 'q-reas-102',
    category: 'Reasoning',
    topic: 'Direction Sense & Seating',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'A candidate walks 10 meters North, turns right and walks 15 meters, then turns right again and walks 10 meters. How far and in what direction is the candidate from the starting point?',
    options: ['15 meters East', '15 meters West', '25 meters North', '35 meters South'],
    correctAnswer: 'A',
    marks: 4,
    explanation: 'Displacement is 15 meters to the East.'
  },
  {
    id: 'q-reas-103',
    category: 'Reasoning',
    topic: 'Series, Patterns & Analogies',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'In a certain cipher code, "CAT" is coded as 24 and "DOG" is coded as 26. What is the code for "PIG"? (P=16, I=9, G=7)',
    options: ['30', '32', '34', '36'],
    correctAnswer: 'B',
    marks: 4,
    explanation: 'Sum of positions: 16 + 9 + 7 = 32.'
  },
  {
    id: 'q-reas-104',
    category: 'Reasoning',
    topic: 'Direction Sense & Seating',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'Five developers A, B, C, D, and E sit in a row facing North. D is to the immediate right of B. E is to the left of B but to the right of A. C is to the right of D. Who is sitting in the center?',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'B',
    marks: 4,
    explanation: 'Order: A - E - B - D - C. B is in the center.'
  },
  {
    id: 'q-reas-105',
    category: 'Reasoning',
    topic: 'Logical Deduction & Syllogisms',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'Statement: "Adopting agile pair programming reduces software bugs by 40%." Which assumption is implicit?',
    options: [
      'Collaborative code review and continuous feedback directly mitigate defect rates',
      'All programmers prefer working in pairs rather than individually',
      'Software testing is completely unnecessary when pair programming is used',
      'Pair programming doubles the total cost and time of every project'
    ],
    correctAnswer: 'A',
    marks: 4,
    explanation: 'Pair collaboration directly improves code quality and reduces defects.'
  },
  {
    id: 'q-reas-201',
    category: 'Reasoning',
    topic: 'Series, Patterns & Analogies',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'Identify the next number in the sequence: 3, 7, 15, 31, 63, ?',
    options: ['95', '120', '127', '125'],
    correctAnswer: 'C',
    marks: 4,
    explanation: '(Previous * 2) + 1. 63 * 2 + 1 = 127.'
  },
  {
    id: 'q-reas-202',
    category: 'Reasoning',
    topic: 'Logical Deduction & Syllogisms',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'Pointing to a photograph, Rohit says: "She is the daughter of my grandfather\'s only son." How is Rohit related to the girl?',
    options: ['Father', 'Brother', 'Uncle', 'Cousin'],
    correctAnswer: 'B',
    marks: 4,
    explanation: "Grandfather's only son is Rohit's father. The daughter is his sister, so Rohit is her brother."
  },
  {
    id: 'q-reas-203',
    category: 'Reasoning',
    topic: 'Logical Deduction & Syllogisms',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'Statements: All cars are vehicles. Some vehicles are electric. Which conclusion definitely follows?',
    options: [
      'All electric vehicles are cars',
      'Some cars may be electric',
      'No electric vehicle is a car',
      'All vehicles are cars'
    ],
    correctAnswer: 'B',
    marks: 4,
    explanation: 'There is a possibility that some cars are electric.'
  },
  {
    id: 'q-reas-204',
    category: 'Reasoning',
    topic: 'Series, Patterns & Analogies',
    difficulty: 'Hard',
    type: 'Single Choice',
    question: 'If "LIGHT" is coded as "MJHIU", how is "FLAME" coded in that language?',
    options: ['GMBND', 'GMBNF', 'GLBNE', 'HMCNE'],
    correctAnswer: 'B',
    marks: 4,
    explanation: 'Each letter shifted +1: F->G, L->M, A->B, M->N, E->F => GMBNF.'
  },
  {
    id: 'q-reas-205',
    category: 'Reasoning',
    topic: 'Direction Sense & Seating',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'In a class row of 40 students, Priya is ranked 18th from the left end. What is her rank from the right end?',
    options: ['22nd', '23rd', '24th', '21st'],
    correctAnswer: 'B',
    marks: 4,
    explanation: '40 = 18 + R - 1 => R = 23rd.'
  },

  // ── CODING (4 UNIQUE) ──
  {
    id: 'q-code-101',
    category: 'Coding',
    topic: 'Algorithmic Problem Solving',
    difficulty: 'Medium',
    type: 'Coding',
    question: '### Maximum Subarray Sum (Kadane\'s Algorithm)\n\nGiven an integer array `nums`, find the subarray with the largest sum, and return its sum.\n\n**Example:** `nums = [-2,1,-3,4,-1,2,1,-5,4]` => Output: `6`',
    options: [],
    correctAnswer: null,
    marks: 10,
    explanation: 'Kadane algorithm maintains max_so_far.',
    test_cases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expected: '6', is_hidden: false },
      { input: '[1]', expected: '1', is_hidden: false },
      { input: '[5,4,-1,7,8]', expected: '23', is_hidden: true }
    ],
    starter_templates: {
      javascript: 'function maxSubArray(nums) {\n  let maxSum = nums[0];\n  let curSum = 0;\n  for (let x of nums) {\n    curSum = Math.max(x, curSum + x);\n    maxSum = Math.max(maxSum, curSum);\n  }\n  return maxSum;\n}',
      python: 'def maxSubArray(nums):\n    max_sum = nums[0]\n    cur_sum = 0\n    for x in nums:\n        cur_sum = max(x, cur_sum + x)\n        max_sum = max(max_sum, cur_sum)\n    return max_sum'
    },
    constraints: 'Time: O(N), Space: O(1)'
  },
  {
    id: 'q-code-102',
    category: 'Coding',
    topic: 'Algorithmic Problem Solving',
    difficulty: 'Easy',
    type: 'Coding',
    question: '### Valid Parentheses\n\nGiven a string `s` containing just `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\n**Example:** `s = "()[]{}"` => Output: `true`',
    options: [],
    correctAnswer: null,
    marks: 10,
    explanation: 'Use stack to verify opening/closing delimiters.',
    test_cases: [
      { input: '"()[]{}"', expected: 'true', is_hidden: false },
      { input: '"(]"', expected: 'false', is_hidden: false },
      { input: '"{[]}"', expected: 'true', is_hidden: true }
    ],
    starter_templates: {
      javascript: 'function isValid(s) {\n  const stack = [];\n  const map = { ")": "(", "}": "{", "]": "[" };\n  for (let char of s) {\n    if (char === "(" || char === "{" || char === "[") {\n      stack.push(char);\n    } else if (stack.pop() !== map[char]) {\n      return false;\n    }\n  }\n  return stack.length === 0;\n}',
      python: 'def isValid(s):\n    stack = []\n    mapping = {")": "(", "}": "{", "]": "["}\n    for char in s:\n        if char in mapping.values():\n            stack.append(char)\n        elif not stack or stack.pop() != mapping.get(char):\n            return False\n    return len(stack) == 0'
    },
    constraints: '1 <= s.length <= 10^4'
  },
  {
    id: 'q-code-201',
    category: 'Coding',
    topic: 'Algorithmic Problem Solving',
    difficulty: 'Easy',
    type: 'Coding',
    question: '### Two Sum Problem\n\nGiven an array of integers `nums` and an integer `target`, return indices `[i, j]` such that they add up to `target`.\n\n**Example:** `nums = [2,7,11,15], target = 9` => Output: `[0,1]`',
    options: [],
    correctAnswer: null,
    marks: 10,
    explanation: 'Store compliments in Hash Map.',
    test_cases: [
      { input: '[2,7,11,15], 9', expected: '[0,1]', is_hidden: false },
      { input: '[3,2,4], 6', expected: '[1,2]', is_hidden: false }
    ],
    starter_templates: {
      javascript: 'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map.has(comp)) return [map.get(comp), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}',
      python: 'def twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        comp = target - n\n        if comp in seen:\n            return [seen[comp], i]\n        seen[n] = i\n    return []'
    },
    constraints: '2 <= nums.length <= 10^4'
  },
  {
    id: 'q-code-202',
    category: 'Coding',
    topic: 'Algorithmic Problem Solving',
    difficulty: 'Easy',
    type: 'Coding',
    question: '### Valid Palindrome\n\nWrite a function `isPalindrome(s)` that determines if string reads the same forwards and backwards, ignoring non-alphanumeric characters.\n\n**Example:** `s = "A man, a plan, a canal: Panama"` => Output: `true`',
    options: [],
    correctAnswer: null,
    marks: 10,
    explanation: 'Two pointers comparing alphanumeric characters.',
    test_cases: [
      { input: '"A man, a plan, a canal: Panama"', expected: 'true', is_hidden: false },
      { input: '"race a car"', expected: 'false', is_hidden: false }
    ],
    starter_templates: {
      javascript: 'function isPalindrome(s) {\n  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, "");\n  return clean === clean.split("").reverse().join("");\n}',
      python: 'def isPalindrome(s):\n    clean = [c.lower() for c in s if c.isalnum()]\n    return clean == clean[::-1]'
    },
    constraints: '1 <= s.length <= 2 * 10^5'
  }
];

export const INITIAL_CANDIDATES_LIST = [];

export const INITIAL_ADMIN_KPIS = {
  totalCandidates: 1248,
  activeCandidates: 892,
  assessmentsCompleted: 3482,
  averageScore: 72,
  jobReadyCandidates: 684,
  categoryAverages: {
    aptitude: 71,
    reasoning: 75,
    technical: 68
  },
  weakestTopics: [
    { topic: "SQL & Window Functions", avgScore: "52%", failureRate: "48%" },
    { topic: "Probability & Combinatorics", avgScore: "56%", failureRate: "44%" },
    { topic: "Graph Algorithms & Dynamic Prog", avgScore: "59%", failureRate: "41%" },
    { topic: "Complex Logical Syllogisms", avgScore: "62%", failureRate: "38%" }
  ],
  scoreDistribution: [
    { range: "< 50%", count: 142, label: "Needs Training" },
    { range: "50-65%", count: 324, label: "Developing" },
    { range: "66-80%", count: 498, label: "Job Ready" },
    { range: "80%+", count: 284, label: "High Achiever" }
  ]
};

export const INITIAL_RECOMMENDATIONS = [
  {
    id: "rec-1",
    skill: "Quantitative Aptitude",
    currentLevel: "58%",
    targetLevel: "80%",
    action: "Complete 3 Quantitative Aptitude practice modules with focus on Probability, Ratios, and Permutations.",
    duration: "4 hours",
    priority: "High",
    category: "Aptitude"
  },
  {
    id: "rec-2",
    skill: "SQL Fundamentals & Joins",
    currentLevel: "54%",
    targetLevel: "85%",
    action: "Practice complex SQL joins, subqueries, and aggregation group functions in interactive sandbox.",
    duration: "3.5 hours",
    priority: "High",
    category: "Technical"
  },
  {
    id: "rec-3",
    skill: "Data Structures (Trees & Graphs)",
    currentLevel: "60%",
    targetLevel: "75%",
    action: "Solve 10 medium-difficulty tree traversal and breadth-first search problems.",
    duration: "5 hours",
    priority: "Medium",
    category: "Technical"
  },
  {
    id: "rec-4",
    skill: "Full Technical Retake",
    currentLevel: "78%",
    targetLevel: "90%",
    action: "Take the Full-Stack Job Readiness Mock Exam to validate improved knowledge.",
    duration: "45 mins",
    priority: "Recommended",
    category: "Assessment"
  }
];
