import { pool } from '../src/db/pool.js';

const codingQuestions = [
  {
    id: 'code-q-array-sum-01',
    category: 'Coding',
    topic: 'Arrays & Algorithms',
    difficulty: 'Easy',
    type: 'Coding',
    question: `### Array Sum Challenge

Write a program that calculates the sum of all elements in an integer array.

#### Input Format
- First line contains an integer **N** denoting the number of elements in the array.
- Second line contains **N** space-separated integers.

#### Output Format
- Print a single integer representing the sum of all array elements.

#### Constraints
- 1 <= N <= 10^4
- -10^6 <= array[i] <= 10^6
`,
    marks: 10,
    time_limit_sec: 120,
    constraints: '1 <= N <= 10^4\n-10^6 <= arr[i] <= 10^6\nTime Limit: 2.0s',
    starter_templates: {
      python: `# Python 3
import sys

def main():
    # Read input from standard input
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    
    # N = number of elements
    n = int(input_data[0])
    # nums = array elements
    nums = [int(x) for x in input_data[1:n+1]]
    
    # TODO: Write your code here to calculate and print the sum of array elements
    

if __name__ == '__main__':
    main()
`,
      javascript: `// JavaScript (Node.js)
const fs = require('fs');

function main() {
    // Read input from standard input
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length === 0 || input[0] === '') return;

    // N = number of elements
    const n = parseInt(input[0], 10);
    // nums = array elements
    const nums = input.slice(1, n + 1).map(Number);

    // TODO: Write your code here to calculate and print the sum of array elements

}

main();
`,
      cpp: `// C++ (GCC)
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n)) return 0;

    vector<long long> nums(n);
    for (int i = 0; i < n; i++) {
        cin >> nums[i];
    }

    // TODO: Write your code here to calculate and print the sum of array elements

    return 0;
}
`,
      java: `// Java (OpenJDK)
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        
        int n = scanner.nextInt();
        long[] nums = new long[n];
        for (int i = 0; i < n; i++) {
            nums[i] = scanner.nextLong();
        }
        
        // TODO: Write your code here to calculate and print the sum of array elements
        
        scanner.close();
    }
}
`
    },
    test_cases: [
      { id: 1, input: '3\n1 2 3', expectedOutput: '6', isHidden: false, explanation: '1 + 2 + 3 = 6' },
      { id: 2, input: '5\n10 20 30 40 50', expectedOutput: '150', isHidden: false, explanation: '10 + 20 + 30 + 40 + 50 = 150' },
      { id: 3, input: '4\n-5 5 -10 10', expectedOutput: '0', isHidden: true, explanation: 'Handling negative integers' },
      { id: 4, input: '1\n1000', expectedOutput: '1000', isHidden: true, explanation: 'Single element array' }
    ]
  },
  {
    id: 'code-q-palindrome-02',
    category: 'Coding',
    topic: 'String Manipulation',
    difficulty: 'Easy',
    type: 'Coding',
    question: `### Palindrome String Verifier

Given a string **S**, determine if it is a palindrome (reads the same backward as forward). The check should be **case-insensitive**.

#### Input Format
- A single string **S**.

#### Output Format
- Print \`true\` if the string is a palindrome, otherwise print \`false\`.

#### Constraints
- 1 <= length(S) <= 10^5
`,
    marks: 10,
    time_limit_sec: 120,
    constraints: '1 <= |S| <= 10^5\nCase-insensitive evaluation\nTime Limit: 2.0s',
    starter_templates: {
      python: `# Python 3
import sys

def main():
    # Read string from standard input
    s = sys.stdin.read().strip()
    if not s:
        return
    
    # TODO: Write your code here to check if 's' is a case-insensitive palindrome
    # Print 'true' or 'false'
    

if __name__ == '__main__':
    main()
`,
      javascript: `// JavaScript (Node.js)
const fs = require('fs');

function main() {
    // Read string from standard input
    const s = fs.readFileSync(0, 'utf-8').trim();
    if (!s) return;

    // TODO: Write your code here to check if 's' is a case-insensitive palindrome
    // Print 'true' or 'false'

}

main();
`,
      cpp: `// C++ (GCC)
#include <iostream>
#include <string>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    string s;
    if (!(cin >> s)) return 0;

    // TODO: Write your code here to check if 's' is a case-insensitive palindrome
    // Print 'true' or 'false'

    return 0;
}
`,
      java: `// Java (OpenJDK)
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNext()) return;
        
        String s = scanner.next();
        
        // TODO: Write your code here to check if 's' is a case-insensitive palindrome
        // Print 'true' or 'false'

        scanner.close();
    }
}
`
    },
    test_cases: [
      { id: 1, input: 'racecar', expectedOutput: 'true', isHidden: false },
      { id: 2, input: 'hello', expectedOutput: 'false', isHidden: false },
      { id: 3, input: 'Madam', expectedOutput: 'true', isHidden: true },
      { id: 4, input: 'a', expectedOutput: 'true', isHidden: true }
    ]
  },
  {
    id: 'code-q-factorial-03',
    category: 'Coding',
    topic: 'Recursion & Math',
    difficulty: 'Medium',
    type: 'Coding',
    question: `### Factorial Calculation

Compute the factorial of a non-negative integer **N** ($N! = N \\times (N-1) \\times \\dots \\times 1$). Note that $0! = 1$.

#### Input Format
- A single integer **N**.

#### Output Format
- Print the factorial of **N**.

#### Constraints
- 0 <= N <= 20
`,
    marks: 10,
    time_limit_sec: 120,
    constraints: '0 <= N <= 20\n64-bit integer required\nTime Limit: 1.0s',
    starter_templates: {
      python: `# Python 3
import sys

def main():
    # Read integer N from standard input
    input_text = sys.stdin.read().strip()
    if not input_text:
        return
    n = int(input_text)
    
    # TODO: Write your code here to compute the factorial of N
    # Print the result to standard output
    

if __name__ == '__main__':
    main()
`,
      javascript: `// JavaScript (Node.js)
const fs = require('fs');

function main() {
    // Read integer N from standard input
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (!input) return;
    const n = parseInt(input, 10);

    // TODO: Write your code here to compute the factorial of N
    // Print the result to standard output

}

main();
`,
      cpp: `// C++ (GCC)
#include <iostream>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n)) return 0;

    // TODO: Write your code here to compute the factorial of N
    // Print the result to standard output

    return 0;
}
`,
      java: `// Java (OpenJDK)
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        
        int n = scanner.nextInt();
        
        // TODO: Write your code here to compute the factorial of N
        // Print the result to standard output

        scanner.close();
    }
}
`
    },
    test_cases: [
      { id: 1, input: '5', expectedOutput: '120', isHidden: false },
      { id: 2, input: '0', expectedOutput: '1', isHidden: false },
      { id: 3, input: '10', expectedOutput: '3628800', isHidden: true },
      { id: 4, input: '12', expectedOutput: '479001600', isHidden: true }
    ]
  }
];

async function seed() {
  console.log('Seeding coding challenges into PostgreSQL...');
  for (const q of codingQuestions) {
    await pool.query(
      `INSERT INTO questions (id, category, topic, difficulty, type, question, marks, time_limit_sec, constraints, starter_templates, test_cases, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Active')
       ON CONFLICT (id) DO UPDATE SET
         category = EXCLUDED.category,
         topic = EXCLUDED.topic,
         difficulty = EXCLUDED.difficulty,
         type = EXCLUDED.type,
         question = EXCLUDED.question,
         marks = EXCLUDED.marks,
         time_limit_sec = EXCLUDED.time_limit_sec,
         constraints = EXCLUDED.constraints,
         starter_templates = EXCLUDED.starter_templates,
         test_cases = EXCLUDED.test_cases,
         status = EXCLUDED.status,
         updated_at = CURRENT_TIMESTAMP`,
      [
        q.id,
        q.category,
        q.topic,
        q.difficulty,
        q.type,
        q.question,
        q.marks,
        q.time_limit_sec,
        q.constraints,
        JSON.stringify(q.starter_templates),
        JSON.stringify(q.test_cases)
      ]
    );
    console.log(`✅ Seeded coding question: ${q.id} (${q.topic})`);
  }

  // Also attach coding questions to an assessment so candidates can take it!
  const asmRes = await pool.query('SELECT id, title FROM assessments LIMIT 1');
  if (asmRes.rows.length > 0) {
    const asmId = asmRes.rows[0].id;
    for (const q of codingQuestions) {
      const aqId = `aq-${asmId}-${q.id}`;
      await pool.query(
        `INSERT INTO assessment_questions (id, assessment_id, question_id, category, topic, question, difficulty, marks, test_cases, starter_templates, constraints)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO NOTHING`,
        [
          aqId,
          asmId,
          q.id,
          q.category,
          q.topic,
          q.question,
          q.difficulty,
          q.marks,
          JSON.stringify(q.test_cases),
          JSON.stringify(q.starter_templates),
          q.constraints
        ]
      );
    }
    console.log(`✅ Linked coding questions to assessment: ${asmRes.rows[0].title} (${asmId})`);
  }

  console.log('🎉 Seeding completed successfully.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
