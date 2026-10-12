import { pool } from '../src/db/pool.js';
import { clearAssessmentsCache } from '../src/controllers/assessments.controller.js';
import { clearQuestionsCache } from '../src/controllers/questions.controller.js';

async function seedAssessmentsAndQuestions() {
  console.log('Seeding rich assessments & questions into PostgreSQL (jobrecipe)...');

  // 1. Ensure topics exist
  const topics = [
    { id: 'top-tech-1', name: 'Database & SQL', category: 'Technical' },
    { id: 'top-tech-2', name: 'Data Structures & Algorithms', category: 'Technical' },
    { id: 'top-tech-3', name: 'Object-Oriented Programming', category: 'Technical' },
    { id: 'top-apt-1', name: 'Arithmetic & Quant', category: 'Aptitude' },
    { id: 'top-apt-2', name: 'Probability & Percentages', category: 'Aptitude' },
    { id: 'top-reas-1', name: 'Series & Patterns', category: 'Reasoning' },
    { id: 'top-reas-2', name: 'Logical Deduction & Syllogisms', category: 'Reasoning' },
    { id: 'top-code-1', name: 'Algorithmic Problem Solving', category: 'Coding' }
  ];

  for (const t of topics) {
    await pool.query(
      `INSERT INTO topics (id, name, category, status)
       VALUES ($1, $2, $3, 'active')
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [t.id, t.name, t.category]
    );
  }

  // 2. Questions definitions
  const questions = [
    // Technical MCQs
    {
      id: 'q-tech-201',
      category: 'Technical',
      topic: 'Database & SQL',
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
      topic: 'Database & SQL',
      difficulty: 'Hard',
      type: 'Single Choice',
      question: 'Which normal form requires removing transitive dependencies, ensuring non-key attributes depend only on the primary key?',
      options: ['1NF', '2NF', '3NF', 'Boyce-Codd NF'],
      correct_answer: 'C',
      marks: 4,
      explanation: 'Third Normal Form (3NF) mandates that a table is in 2NF and contains no transitive functional dependencies.'
    },

    // Aptitude MCQs
    {
      id: 'q-apt-201',
      category: 'Aptitude',
      topic: 'Arithmetic & Quant',
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
      topic: 'Probability & Percentages',
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
      topic: 'Probability & Percentages',
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
      topic: 'Arithmetic & Quant',
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
      topic: 'Probability & Percentages',
      difficulty: 'Easy',
      type: 'Single Choice',
      question: 'What is 15% of 250 added to 25% of 150?',
      options: ['75', '80', '65', '70'],
      correct_answer: 'A',
      marks: 4,
      explanation: '15% of 250 = 37.5. 25% of 150 = 37.5. 37.5 + 37.5 = 75.'
    },

    // Reasoning MCQs
    {
      id: 'q-reas-201',
      category: 'Reasoning',
      topic: 'Series & Patterns',
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
        'Only Conclusion I: Some cars are electric.',
        'Only Conclusion II: Some electric items are vehicles.',
        'Both Conclusion I and II follow.',
        'Neither Conclusion I nor II follows.'
      ],
      correct_answer: 'B',
      marks: 4,
      explanation: 'Since some vehicles are electric, it directly follows that some electric items are vehicles.'
    },
    {
      id: 'q-reas-204',
      category: 'Reasoning',
      topic: 'Series & Patterns',
      difficulty: 'Easy',
      type: 'Single Choice',
      question: 'If "LIGHT" is coded as "MJHIU", how is "FLAME" coded in that language?',
      options: ['GMBND', 'GMBNE', 'GLBND', 'GMBLE'],
      correct_answer: 'A',
      marks: 4,
      explanation: 'L(+1)->M, I(+1)->J, G(+1)->H, H(+1)->I, T(+1)->U. F(+1)->G, L(+1)->M, A(+1)->B, M(+1)->N, E(-1)->D.'
    },
    {
      id: 'q-reas-205',
      category: 'Reasoning',
      topic: 'Series & Patterns',
      difficulty: 'Easy',
      type: 'Single Choice',
      question: 'In a class row of 40 students, Priya is ranked 18th from the left end. What is her rank from the right end?',
      options: ['22nd', '23rd', '24th', '21st'],
      correct_answer: 'B',
      marks: 4,
      explanation: 'Total = Left + Right - 1. 40 = 18 + Right - 1 => Right = 40 - 17 = 23rd.'
    },

    // Coding Challenges
    {
      id: 'q-code-201',
      category: 'Coding',
      topic: 'Algorithmic Problem Solving',
      difficulty: 'Easy',
      type: 'Coding',
      question: 'Two Sum Problem: Given an array of integers `nums` and an integer `target`, return the indices `[i, j]` of the two numbers such that they add up to `target`. Assume each input has exactly one solution and you may not use the same element twice.',
      options: [],
      correct_answer: 'A',
      marks: 10,
      explanation: 'Use a hash map to look up target - num in O(1) time while iterating through the array once.',
      starter_templates: {
        javascript: "function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}",
        python: "def twoSum(nums, target):\n    lookup = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in lookup:\n            return [lookup[diff], i]\n        lookup[num] = i\n    return []"
      },
      test_cases: [
        { input: "[2, 7, 11, 15], 9", expected: "[0, 1]" },
        { input: "[3, 2, 4], 6", expected: "[1, 2]" },
        { input: "[3, 3], 6", expected: "[0, 1]" }
      ],
      constraints: {
        timeLimit: '1.0s',
        memoryLimit: '256MB'
      }
    },
    {
      id: 'q-code-202',
      category: 'Coding',
      topic: 'Algorithmic Problem Solving',
      difficulty: 'Easy',
      type: 'Coding',
      question: 'Valid Palindrome: Write a function `isPalindrome(s)` that determines if a string reads the same forwards and backwards, ignoring non-alphanumeric characters and casing.',
      options: [],
      correct_answer: 'A',
      marks: 10,
      explanation: 'Clean the string with regex or two pointers checking matching characters from left and right.',
      starter_templates: {
        javascript: "function isPalindrome(s) {\n  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');\n  return clean === clean.split('').reverse().join('');\n}",
        python: "def isPalindrome(s: str) -> bool:\n    clean = ''.join(c.lower() for c in s if c.isalnum())\n    return clean == clean[::-1]"
      },
      test_cases: [
        { input: '"A man, a plan, a canal: Panama"', expected: "true" },
        { input: '"race a car"', expected: "false" }
      ],
      constraints: {
        timeLimit: '1.0s',
        memoryLimit: '128MB'
      }
    }
  ];

  for (const q of questions) {
    await pool.query(
      `INSERT INTO questions (
        id, category, topic, difficulty, type, question,
        options, correct_answer, marks, explanation, starter_templates, test_cases, constraints, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Active')
      ON CONFLICT (id) DO UPDATE SET
        category = EXCLUDED.category,
        topic = EXCLUDED.topic,
        difficulty = EXCLUDED.difficulty,
        type = EXCLUDED.type,
        question = EXCLUDED.question,
        options = EXCLUDED.options,
        correct_answer = EXCLUDED.correct_answer,
        marks = EXCLUDED.marks,
        explanation = EXCLUDED.explanation,
        starter_templates = EXCLUDED.starter_templates,
        test_cases = EXCLUDED.test_cases,
        constraints = EXCLUDED.constraints,
        status = 'Active'`,
      [
        q.id,
        q.category,
        q.topic,
        q.difficulty,
        q.type,
        q.question,
        JSON.stringify(q.options),
        q.correct_answer,
        q.marks,
        q.explanation,
        q.starter_templates ? JSON.stringify(q.starter_templates) : null,
        q.test_cases ? JSON.stringify(q.test_cases) : null,
        q.constraints ? JSON.stringify(q.constraints) : null
      ]
    );
  }
  console.log(`✅ Seeded ${questions.length} questions into questions table.`);

  // 3. Create Assessments with modern 2026 IDs
  const assessments = [
    {
      id: 'asm-tech-2026',
      title: 'Core Technical & CS Fundamentals Assessment',
      category: 'Technical',
      description: 'Comprehensive evaluation of Object-Oriented Programming, DBMS, SQL Queries, and OS Concepts.',
      difficulty: 'Medium',
      durationMinutes: 30,
      totalQuestions: 5,
      totalMarks: 20,
      passingScore: 70,
      questionIds: ['q-tech-201', 'q-tech-202', 'q-tech-203', 'q-tech-204', 'q-tech-205']
    },
    {
      id: 'asm-apt-2026',
      title: 'Quantitative Aptitude Benchmark Test',
      category: 'Aptitude',
      description: 'Tests arithmetic speed, ratios, percentages, probability, and numerical problem solving.',
      difficulty: 'Medium',
      durationMinutes: 25,
      totalQuestions: 5,
      totalMarks: 20,
      passingScore: 65,
      questionIds: ['q-apt-201', 'q-apt-202', 'q-apt-203', 'q-apt-204', 'q-apt-205']
    },
    {
      id: 'asm-reas-2026',
      title: 'Logical Reasoning & Critical Thinking Exam',
      category: 'Reasoning',
      description: 'Pattern recognition, deductive logic, series completion, and analytical thinking.',
      difficulty: 'Medium',
      durationMinutes: 25,
      totalQuestions: 5,
      totalMarks: 20,
      passingScore: 65,
      questionIds: ['q-reas-201', 'q-reas-202', 'q-reas-203', 'q-reas-204', 'q-reas-205']
    },
    {
      id: 'asm-code-2026',
      title: 'Full-Stack Algorithmic Coding Challenge',
      category: 'Coding',
      description: 'Interactive data structures, array manipulation, string algorithms, and computational efficiency.',
      difficulty: 'Medium',
      durationMinutes: 45,
      totalQuestions: 2,
      totalMarks: 20,
      passingScore: 75,
      questionIds: ['q-code-201', 'q-code-202']
    }
  ];

  for (const asm of assessments) {
    await pool.query(
      `INSERT INTO assessments (
        id, title, category, description, difficulty, duration_minutes, total_questions, total_marks, passing_score, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Active', 'admin-1')
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        difficulty = EXCLUDED.difficulty,
        duration_minutes = EXCLUDED.duration_minutes,
        total_questions = EXCLUDED.total_questions,
        total_marks = EXCLUDED.total_marks,
        passing_score = EXCLUDED.passing_score,
        status = 'Active'`,
      [
        asm.id,
        asm.title,
        asm.category,
        asm.description,
        asm.difficulty,
        asm.durationMinutes,
        asm.totalQuestions,
        asm.totalMarks,
        asm.passingScore
      ]
    );

    // Link questions to assessment_questions
    for (const qId of asm.questionIds) {
      const qMatch = questions.find(q => q.id === qId);
      if (qMatch) {
        const aqId = `aq-${asm.id}-${qId}`;
        await pool.query(
          `INSERT INTO assessment_questions (
            id, assessment_id, question_id, category, topic, question, difficulty, options, correct_answer, marks, test_cases, starter_templates, constraints
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (assessment_id, question_id) DO UPDATE SET
            category = EXCLUDED.category,
            topic = EXCLUDED.topic,
            question = EXCLUDED.question,
            difficulty = EXCLUDED.difficulty,
            options = EXCLUDED.options,
            correct_answer = EXCLUDED.correct_answer,
            marks = EXCLUDED.marks,
            test_cases = EXCLUDED.test_cases,
            starter_templates = EXCLUDED.starter_templates,
            constraints = EXCLUDED.constraints`,
          [
            aqId,
            asm.id,
            qId,
            qMatch.category,
            qMatch.topic,
            qMatch.question,
            qMatch.difficulty,
            JSON.stringify(qMatch.options),
            qMatch.correct_answer,
            qMatch.marks,
            qMatch.test_cases ? JSON.stringify(qMatch.test_cases) : null,
            qMatch.starter_templates ? JSON.stringify(qMatch.starter_templates) : null,
            qMatch.constraints ? JSON.stringify(qMatch.constraints) : null
          ]
        );
      }
    }
    console.log(`✅ Seeded Assessment: ${asm.title} (${asm.id}) with ${asm.questionIds.length} questions.`);
  }

  clearAssessmentsCache();
  clearQuestionsCache();
  console.log('🎉 Seeding completed successfully!');
  process.exit(0);
}

seedAssessmentsAndQuestions().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
