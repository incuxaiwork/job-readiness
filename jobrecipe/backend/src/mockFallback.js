export const fallbackAssessments = [
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
    status: 'Active',
    created_at: new Date().toISOString()
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
    status: 'Active',
    created_at: new Date().toISOString()
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
    status: 'Active',
    created_at: new Date().toISOString()
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
    status: 'Active',
    created_at: new Date().toISOString()
  }
];

export const fallbackQuestions = [
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
    correct_answer: 'A',
    marks: 4,
    explanation: 'Threads within the same process share code, data, and OS resources (such as open files), whereas processes run in distinct address spaces.'
  },
  {
    id: 'q-tech-102',
    category: 'Technical',
    topic: 'Operating Systems & Networks',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'Which HTTP response status code indicates that the client request cannot be completed because authentication credentials are required?',
    options: ['400 Bad Request', '401 Unauthorized', '403 Forbidden', '404 Not Found'],
    correct_answer: 'B',
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
    correct_answer: 'B',
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
    correct_answer: 'C',
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
    correct_answer: 'B',
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
    correct_answer: 'B',
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
    correct_answer: 'B',
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
    correct_answer: 'B',
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
    correct_answer: 'B',
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
    correct_answer: 'C',
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
    correct_answer: 'C',
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
    correct_answer: 'A',
    marks: 4,
    explanation: 'Average speed = 2 * v1 * v2 / (v1 + v2) = (2 * 60 * 90) / 150 = 10800 / 150 = 72 km/h.'
  },
  {
    id: 'q-apt-103',
    category: 'Aptitude',
    topic: 'Ratios, Percentages & Averages',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'The average age of 5 employees is 28 years. When a new manager joins, the average age increases by 2 years. What is the age of the manager?',
    options: ['36 years', '40 years', '38 years', '42 years'],
    correct_answer: 'B',
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
    correct_answer: 'B',
    marks: 4,
    explanation: 'The word READY has 5 distinct letters. Number of permutations = 5! = 5 * 4 * 3 * 2 * 1 = 120.'
  },
  {
    id: 'q-apt-105',
    category: 'Aptitude',
    topic: 'Arithmetic & Speed Calculations',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'A sum of money invested at simple interest amounts to $750 in 3 years and $900 in 5 years. What is the original principal?',
    options: ['$500', '$525', '$550', '$600'],
    correct_answer: 'B',
    marks: 4,
    explanation: 'Interest in 2 years = 900 - 750 = $150 => $75 per year. Principal = 750 - (3 * 75) = 750 - 225 = $525.'
  },
  {
    id: 'q-apt-201',
    category: 'Aptitude',
    topic: 'Arithmetic & Speed Calculations',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'A train moving at 72 km/h completely crosses a standing pole in 15 seconds. What is the length of the train in meters?',
    options: ['200 m', '250 m', '300 m', '350 m'],
    correct_answer: 'C',
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
    correct_answer: 'A',
    marks: 4,
    explanation: 'Let CP = 100. Marked Price = 140. Discount = 20% of 140 = 28. SP = 140 - 28 = 112. Profit = 12%.'
  },
  {
    id: 'q-apt-203',
    category: 'Aptitude',
    topic: 'Probability & Combinatorics',
    difficulty: 'Easy',
    type: 'Single Choice',
    question: 'A bag contains 5 red balls, 4 green balls, and 3 blue balls. If a ball is picked at random, what is the probability that it is green?',
    options: ['1/4', '1/3', '5/12', '4/15'],
    correct_answer: 'B',
    marks: 4,
    explanation: 'Total balls = 5 + 4 + 3 = 12. P(Green) = 4 / 12 = 1/3.'
  },
  {
    id: 'q-apt-204',
    category: 'Aptitude',
    topic: 'Arithmetic & Speed Calculations',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'Worker A can complete a task in 12 days, and Worker B can complete the same task in 16 days. If they work together, how many days will it take?',
    options: ['6.86 days', '7.20 days', '6.50 days', '8.00 days'],
    correct_answer: 'A',
    marks: 4,
    explanation: 'Combined rate = 1/12 + 1/16 = (4+3)/48 = 7/48. Time = 48/7 = 6.86 days.'
  },
  {
    id: 'q-apt-205',
    category: 'Aptitude',
    topic: 'Ratios, Percentages & Averages',
    difficulty: 'Easy',
    type: 'Single Choice',
    question: 'What is 15% of 250 added to 25% of 150?',
    options: ['75', '80', '65', '70'],
    correct_answer: 'A',
    marks: 4,
    explanation: '15% of 250 = 37.5. 25% of 150 = 37.5. 37.5 + 37.5 = 75.'
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
    correct_answer: 'B',
    marks: 4,
    explanation: 'The sequence represents consecutive integers squared: 2^2, 3^2, ... 9^2, 10^2 = 100.'
  },
  {
    id: 'q-reas-102',
    category: 'Reasoning',
    topic: 'Direction Sense & Seating',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'A candidate walks 10 meters North, turns right and walks 15 meters, then turns right again and walks 10 meters. How far and in what direction is the candidate from the starting point?',
    options: ['15 meters East', '15 meters West', '25 meters North', '35 meters South'],
    correct_answer: 'A',
    marks: 4,
    explanation: 'Walking North 10m then South 10m cancels the vertical movement. The remaining displacement is 15 meters to the East.'
  },
  {
    id: 'q-reas-103',
    category: 'Reasoning',
    topic: 'Series, Patterns & Analogies',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'In a certain cipher code, "CAT" is coded as 24 and "DOG" is coded as 26. What is the code for "PIG"? (P=16, I=9, G=7)',
    options: ['30', '32', '34', '36'],
    correct_answer: 'B',
    marks: 4,
    explanation: 'Sum of alphabetical positions: P(16) + I(9) + G(7) = 32.'
  },
  {
    id: 'q-reas-104',
    category: 'Reasoning',
    topic: 'Direction Sense & Seating',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'Five developers A, B, C, D, and E sit in a row facing North. D is to the immediate right of B. E is to the left of B but to the right of A. C is to the right of D. Who is sitting in the center?',
    options: ['A', 'B', 'C', 'D'],
    correct_answer: 'B',
    marks: 4,
    explanation: 'The order from left to right is: A - E - B - D - C. Developer B sits in the middle position.'
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
    correct_answer: 'A',
    marks: 4,
    explanation: 'The statement directly relies on the premise that pair collaboration improves code quality and reduces defects.'
  },
  {
    id: 'q-reas-201',
    category: 'Reasoning',
    topic: 'Series, Patterns & Analogies',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'Identify the next number in the sequence: 3, 7, 15, 31, 63, ?',
    options: ['95', '120', '127', '125'],
    correct_answer: 'C',
    marks: 4,
    explanation: 'The pattern is (Previous Number * 2) + 1. 63 * 2 + 1 = 127.'
  },
  {
    id: 'q-reas-202',
    category: 'Reasoning',
    topic: 'Logical Deduction & Syllogisms',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'Pointing to a photograph, Rohit says: "She is the daughter of my grandfather\'s only son." How is Rohit related to the girl?',
    options: ['Father', 'Brother', 'Uncle', 'Cousin'],
    correct_answer: 'B',
    marks: 4,
    explanation: "Grandfather's only son is Rohit's father. The daughter of Rohit's father is Rohit's sister, making Rohit her brother."
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
    correct_answer: 'B',
    marks: 4,
    explanation: 'Since cars are a subset of vehicles and some vehicles are electric, there is an intersection possibility that some cars are electric.'
  },
  {
    id: 'q-reas-204',
    category: 'Reasoning',
    topic: 'Series, Patterns & Analogies',
    difficulty: 'Hard',
    type: 'Single Choice',
    question: 'If "LIGHT" is coded as "MJHIU", how is "FLAME" coded in that language?',
    options: ['GMBND', 'GMBNF', 'GLBNE', 'HMCNE'],
    correct_answer: 'B',
    marks: 4,
    explanation: 'Each letter is shifted forward by +1 position in the alphabet: F->G, L->M, A->B, M->N, E->F => GMBNF.'
  },
  {
    id: 'q-reas-205',
    category: 'Reasoning',
    topic: 'Direction Sense & Seating',
    difficulty: 'Medium',
    type: 'Single Choice',
    question: 'In a class row of 40 students, Priya is ranked 18th from the left end. What is her rank from the right end?',
    options: ['22nd', '23rd', '24th', '21st'],
    correct_answer: 'B',
    marks: 4,
    explanation: 'Total students = (Rank from Left + Rank from Right) - 1. 40 = 18 + R - 1 => R = 40 - 17 = 23rd.'
  },

  // ── CODING (4 UNIQUE) ──
  {
    id: 'q-code-101',
    category: 'Coding',
    topic: 'Algorithmic Problem Solving',
    difficulty: 'Medium',
    type: 'Coding',
    question: '### Maximum Subarray Sum (Kadane\'s Algorithm)\n\nGiven an integer array `nums`, find the subarray with the largest sum, and return its sum.\n\n**Example 1:**\n- Input: `nums = [-2,1,-3,4,-1,2,1,-5,4]`\n- Output: `6` (subarray `[4,-1,2,1]`)\n\n**Constraints:**\n- `1 <= nums.length <= 10^5`\n- `-10^4 <= nums[i] <= 10^4`',
    options: [],
    correct_answer: null,
    marks: 10,
    explanation: 'Kadane\'s algorithm maintains current_sum and max_so_far in single O(n) pass.',
    test_cases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expected: '6', is_hidden: false },
      { input: '[1]', expected: '1', is_hidden: false },
      { input: '[5,4,-1,7,8]', expected: '23', is_hidden: true }
    ],
    starter_templates: {
      javascript: 'function maxSubArray(nums) {\n  // Write your code here\n  let maxSum = nums[0];\n  let curSum = 0;\n  for (let x of nums) {\n    curSum = Math.max(x, curSum + x);\n    maxSum = Math.max(maxSum, curSum);\n  }\n  return maxSum;\n}',
      python: 'def maxSubArray(nums):\n    # Write your code here\n    max_sum = nums[0]\n    cur_sum = 0\n    for x in nums:\n        cur_sum = max(x, cur_sum + x)\n        max_sum = max(max_sum, cur_sum)\n    return max_sum'
    },
    constraints: 'Time: O(N), Space: O(1)'
  },
  {
    id: 'q-code-102',
    category: 'Coding',
    topic: 'Algorithmic Problem Solving',
    difficulty: 'Easy',
    type: 'Coding',
    question: '### Valid Parentheses\n\nGiven a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if open brackets are closed by the same type of brackets in the correct order.\n\n**Example 1:**\n- Input: `s = "()[]{}"`\n- Output: `true`',
    options: [],
    correct_answer: null,
    marks: 10,
    explanation: 'Use a Stack to verify that every opening delimiter matches its closing counterpart.',
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
    question: '### Two Sum Problem\n\nGiven an array of integers `nums` and an integer `target`, return the indices `[i, j]` of the two numbers such that they add up to `target`.\n\nAssume each input has exactly one solution and you may not use the same element twice.\n\n**Example:**\n- Input: `nums = [2,7,11,15], target = 9`\n- Output: `[0,1]`',
    options: [],
    correct_answer: null,
    marks: 10,
    explanation: 'Store compliments in a Hash Map to resolve in O(n) linear time.',
    test_cases: [
      { input: '[2,7,11,15], 9', expected: '[0,1]', is_hidden: false },
      { input: '[3,2,4], 6', expected: '[1,2]', is_hidden: false },
      { input: '[3,3], 6', expected: '[0,1]', is_hidden: true }
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
    question: '### Valid Palindrome\n\nWrite a function `isPalindrome(s)` that determines if a string reads the same forwards and backwards, ignoring non-alphanumeric characters and casing.\n\n**Example 1:**\n- Input: `s = "A man, a plan, a canal: Panama"`\n- Output: `true`',
    options: [],
    correct_answer: null,
    marks: 10,
    explanation: 'Use two pointers comparing alphanumeric characters converted to lowercase.',
    test_cases: [
      { input: '"A man, a plan, a canal: Panama"', expected: 'true', is_hidden: false },
      { input: '"race a car"', expected: 'false', is_hidden: false },
      { input: '" "', expected: 'true', is_hidden: true }
    ],
    starter_templates: {
      javascript: 'function isPalindrome(s) {\n  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, "");\n  return clean === clean.split("").reverse().join("");\n}',
      python: 'def isPalindrome(s):\n    clean = [c.lower() for c in s if c.isalnum()]\n    return clean == clean[::-1]'
    },
    constraints: '1 <= s.length <= 2 * 10^5'
  }
];

export const fallbackCandidates = [
  {
    id: 'cand-demo-1',
    name: 'Demo Candidate',
    email: 'demo@incuxai.com',
    mobile: '+91 9876543210',
    college: 'Demo Institute of Technology',
    degree: 'B.Tech',
    branch: 'Computer Science',
    specialization: 'Full-Stack Web Development',
    country: 'India',
    state: 'Telangana',
    city: 'Hyderabad',
    graduation_year: 2026,
    graduationYear: 2026,
    experience_level: 'Fresher',
    experienceLevel: 'Fresher',
    job_readiness_score: 78,
    aptitude_score: 82,
    reasoning_score: 74,
    technical_score: 78,
    verbal_score: 70,
    coding_score: 80,
    assessments_completed: 2,
    tenth_school: 'Kendriya Vidyalaya',
    tenthSchool: 'Kendriya Vidyalaya',
    tenth_marks: 89.0,
    tenthMarks: 89.0,
    twelfth_college: 'Narayana Junior College',
    twelfthCollege: 'Narayana Junior College',
    twelfth_diploma_marks: 86.5,
    twelfthDiplomaMarks: 86.5,
    graduation_percentage: 82.0,
    graduationPercentage: 82.0,
    cgpa: 8.2,
    sgpa: 8.2,
    backlogs: 0,
    created_at: new Date().toISOString()
  },
  {
    id: 'cand-user-1',
    name: 'Vishnu Pera',
    email: 'peravishnu4@gmail.com',
    mobile: '+91 9876543210',
    college: 'Engineering Institute',
    degree: 'B.Tech',
    branch: 'Computer Science',
    specialization: 'Artificial Intelligence & Machine Learning (AI/ML)',
    country: 'India',
    state: 'Telangana',
    city: 'Hyderabad',
    graduation_year: 2026,
    graduationYear: 2026,
    experience_level: 'Fresher',
    experienceLevel: 'Fresher',
    job_readiness_score: 82,
    aptitude_score: 85,
    reasoning_score: 80,
    technical_score: 84,
    verbal_score: 78,
    coding_score: 82,
    assessments_completed: 3,
    tenth_school: 'Delhi Public School',
    tenthSchool: 'Delhi Public School',
    tenth_marks: 92.4,
    tenthMarks: 92.4,
    twelfth_college: 'Sri Chaitanya Junior College',
    twelfthCollege: 'Sri Chaitanya Junior College',
    twelfth_diploma_marks: 88.0,
    twelfthDiplomaMarks: 88.0,
    graduation_percentage: 85.0,
    graduationPercentage: 85.0,
    cgpa: 8.5,
    sgpa: 8.5,
    backlogs: 0,
    created_at: new Date().toISOString()
  }
];

// In-memory store for fallback users
const memoryUsers = new Map([
  ['demo@incuxai.com', {
    id: 'cand-demo-1',
    name: 'Demo Candidate',
    email: 'demo@incuxai.com',
    role: 'candidate',
    candidate: fallbackCandidates[0]
  }],
  ['peravishnu4@gmail.com', {
    id: 'cand-user-1',
    name: 'Vishnu Pera',
    email: 'peravishnu4@gmail.com',
    role: 'candidate',
    candidate: fallbackCandidates[1]
  }],
  ['admin@readysetjob.com', {
    id: 'admin-1',
    name: 'Admin Director',
    email: 'admin@readysetjob.com',
    role: 'admin'
  }],
  ['admin@incuxai.com', {
    id: 'admin-2',
    name: 'Incux Admin',
    email: 'admin@incuxai.com',
    role: 'admin'
  }]
]);

export const findUserByEmail = (email) => {
  if (!email) return null;
  const key = email.trim().toLowerCase();
  return memoryUsers.get(key) || null;
};

export const saveUser = (user) => {
  if (!user || !user.email) return;
  const key = user.email.trim().toLowerCase();
  memoryUsers.set(key, user);
  // Also register candidate profile if candidate
  if (user.role === 'candidate') {
    const existingIdx = fallbackCandidates.findIndex(c => c.email.toLowerCase() === key || c.id === user.id);
    const candObj = user.candidate || user;
    if (existingIdx >= 0) {
      fallbackCandidates[existingIdx] = { ...fallbackCandidates[existingIdx], ...candObj };
    } else {
      fallbackCandidates.unshift(candObj);
    }
  }
};

export const findCandidateById = (id) => {
  if (!id) return null;
  return fallbackCandidates.find(c => c.id === id) || null;
};

// In-memory submissions store
export const fallbackSubmissions = [];

export const getMySubmissionsFallback = (candId, candEmail) => {
  const normEmail = (candEmail || '').trim().toLowerCase();
  return fallbackSubmissions.filter(s =>
    (candId && s.candidate_id === candId) ||
    (normEmail && (s.candidate_email || '').toLowerCase() === normEmail)
  );
};

export const saveSubmissionFallback = (submission) => {
  fallbackSubmissions.unshift(submission);
};

export const fallbackProctoringEvents = [];

export const saveProctoringEventFallback = (event) => {
  fallbackProctoringEvents.push(event);
};

export const getProctoringEventsFallback = (attemptId) => {
  return fallbackProctoringEvents.filter(e => e.attempt_id === attemptId || e.attemptId === attemptId);
};
