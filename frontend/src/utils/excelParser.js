import * as XLSX from 'xlsx';

/**
 * Parse an Excel (.xlsx, .xls) or .csv file and extract formatted question objects.
 * @param {File} file 
 * @param {string} fallbackCategory (e.g., 'Aptitude', 'Reasoning', 'Technical', 'Verbal')
 * @param {string} fallbackTopic 
 * @returns {Promise<Array>} Array of parsed question objects
 */
export const parseQuestionsFromExcel = async (file, fallbackCategory = 'Technical', fallbackTopic = 'General') => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  
  if (!workbook.SheetNames.length) {
    throw new Error('Excel workbook contains no sheets.');
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('Excel file is empty or missing data rows.');
  }

  const parsedQuestions = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];

    // Normalize keys to lowercase and trim spaces
    const normalized = {};
    Object.keys(row).forEach(key => {
      const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_');
      normalized[cleanKey] = row[key];
    });

    const questionText = normalized.question || normalized.question_statement || normalized.question_text || normalized.q;
    if (!questionText || !String(questionText).trim()) {
      continue; // skip empty rows
    }

    const optA = String(normalized.option_a || normalized.optiona || normalized.a || '').trim();
    const optB = String(normalized.option_b || normalized.optionb || normalized.b || '').trim();
    const optC = String(normalized.option_c || normalized.optionc || normalized.c || '').trim();
    const optD = String(normalized.option_d || normalized.optiond || normalized.d || '').trim();

    const options = [
      { id: 'A', text: optA || 'Option A' },
      { id: 'B', text: optB || 'Option B' },
      { id: 'C', text: optC || 'Option C' },
      { id: 'D', text: optD || 'Option D' }
    ];

    const correctAnsRaw = String(normalized.correct_answer || normalized.correctanswer || normalized.answer || 'A').trim().toUpperCase();
    let correctAnswer = 'A';
    if (['A', 'B', 'C', 'D'].includes(correctAnsRaw)) {
      correctAnswer = correctAnsRaw;
    } else if (correctAnsRaw.startsWith('T') || correctAnsRaw === 'TRUE') {
      correctAnswer = 'A';
    } else if (correctAnsRaw.startsWith('F') || correctAnsRaw === 'FALSE') {
      correctAnswer = 'B';
    }

    const rowCategory = normalized.category ? String(normalized.category).trim() : '';
    const finalCategory = rowCategory || (fallbackCategory !== 'All' ? fallbackCategory : 'Technical');
    const rowTopic = normalized.topic ? String(normalized.topic).trim() : '';
    const finalTopic = rowTopic || (fallbackTopic !== 'All' ? fallbackTopic : 'General');

    const questionObj = {
      category: finalCategory,
      topic: finalTopic,
      difficulty: normalized.difficulty ? String(normalized.difficulty).trim() : 'Medium',
      type: 'Single Choice',
      question: String(questionText).trim(),
      options: options,
      correctAnswer: correctAnswer,
      explanation: 'Imported from Excel template.',
      marks: Number(normalized.marks) || 4,
      timeLimitSec: Number(normalized.time_limit_sec || normalized.time_limit || normalized.timelimitsec) || 60,
      tags: ['Excel Import', finalCategory, finalTopic]
    };

    parsedQuestions.push(questionObj);
  }

  return parsedQuestions;
};

/**
 * Generate and trigger download of sample .xlsx template matching exact requested columns:
 * question | difficulty | topic | option_a | option_b | option_c | option_d | correct_answer | marks | time_limit_sec
 * @param {string} category 
 */
export const downloadExcelQuestionTemplate = (category = 'Aptitude') => {
  const sampleDataByCategory = {
    Aptitude: [
      {
        question: "A train 150m long is running at 54 km/hr. How long will it take to cross a platform 180m long?",
        difficulty: "Medium",
        topic: "Speed & Distance",
        option_a: "18 sec",
        option_b: "22 sec",
        option_c: "24 sec",
        option_d: "30 sec",
        correct_answer: "B",
        marks: 4,
        time_limit_sec: 60
      },
      {
        question: "Two pipes A and B can fill a tank in 20 and 30 minutes. If both pipes are opened together, how long will it take to fill the tank?",
        difficulty: "Easy",
        topic: "Pipes & Cisterns",
        option_a: "10 minutes",
        option_b: "12 minutes",
        option_c: "15 minutes",
        option_d: "25 minutes",
        correct_answer: "B",
        marks: 4,
        time_limit_sec: 60
      }
    ],
    Reasoning: [
      {
        question: "Find the next number in the series: 3, 8, 15, 24, 35, ?",
        difficulty: "Medium",
        topic: "Pattern Recognition",
        option_a: "46",
        option_b: "48",
        option_c: "50",
        option_d: "52",
        correct_answer: "B",
        marks: 4,
        time_limit_sec: 60
      },
      {
        question: "Statements: All laptops are gadgets. All gadgets are electronics. Conclusion: All laptops are electronics.",
        difficulty: "Easy",
        topic: "Logical Deduction",
        option_a: "Follows",
        option_b: "Does not follow",
        option_c: "Either I or II",
        option_d: "Neither",
        correct_answer: "A",
        marks: 4,
        time_limit_sec: 45
      }
    ],
    Technical: [
      {
        question: "What is the worst-case time complexity of QuickSort?",
        difficulty: "Medium",
        topic: "Algorithms",
        option_a: "O(n log n)",
        option_b: "O(n^2)",
        option_c: "O(n)",
        option_d: "O(log n)",
        correct_answer: "B",
        marks: 4,
        time_limit_sec: 60
      },
      {
        question: "Which data structure follows LIFO (Last In First Out)?",
        difficulty: "Easy",
        topic: "Data Structures",
        option_a: "Queue",
        option_b: "Stack",
        option_c: "Array",
        option_d: "Linked List",
        correct_answer: "B",
        marks: 4,
        time_limit_sec: 45
      }
    ],
    Verbal: [
      {
        question: "Choose the word which is most opposite in meaning to BENEVOLENT:",
        difficulty: "Easy",
        topic: "Vocabulary & Antonyms",
        option_a: "Generous",
        option_b: "Malevolent",
        option_c: "Kind",
        option_d: "Friendly",
        correct_answer: "B",
        marks: 4,
        time_limit_sec: 45
      },
      {
        question: "Identify the grammatically correct sentence:",
        difficulty: "Medium",
        topic: "Grammar & Sentence Correction",
        option_a: "He don't know the answer.",
        option_b: "He does not knows the answer.",
        option_c: "He does not know the answer.",
        option_d: "He is not knowing answer.",
        correct_answer: "C",
        marks: 4,
        time_limit_sec: 45
      }
    ]
  };

  const activeCategory = (category && sampleDataByCategory[category]) ? category : 'Aptitude';
  const sampleData = sampleDataByCategory[activeCategory];

  const worksheet = XLSX.utils.json_to_sheet(sampleData, {
    header: ["question", "difficulty", "topic", "option_a", "option_b", "option_c", "option_d", "correct_answer", "marks", "time_limit_sec"]
  });

  // Set column widths for clean readability
  worksheet['!cols'] = [
    { wch: 60 }, // question
    { wch: 12 }, // difficulty
    { wch: 25 }, // topic
    { wch: 25 }, // option_a
    { wch: 25 }, // option_b
    { wch: 25 }, // option_c
    { wch: 25 }, // option_d
    { wch: 15 }, // correct_answer
    { wch: 10 }, // marks
    { wch: 15 }  // time_limit_sec
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `${activeCategory} Questions`);
  XLSX.writeFile(workbook, `${activeCategory.toLowerCase()}_questions_template.xlsx`);
};
