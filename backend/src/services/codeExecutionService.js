/**
 * Sandboxed Remote Multi-Language Code Execution Service
 *
 * Replaces insecure, host-dependent local child_process spawning with isolated
 * containerized execution via Judge0 CE / Piston APIs.
 *
 * Supported: Python, JavaScript (Node), C++ (GCC), Java (OpenJDK), C (GCC), TypeScript.
 * Enforces hard timeouts (8-10s) and stdout/stderr output caps (10,000 characters).
 */

import crypto from 'crypto';
import { redisClient, isRedisAvailable } from '../db/redis.js';

const MAX_OUTPUT_LENGTH = 10000;
const DEFAULT_TIMEOUT_MS = 8000;

export const LANGUAGE_CONFIG = {
  python: {
    id: 'python',
    name: 'Python',
    version: '3.12.5',
    judge0Id: 100, // Python (3.12.5)
    judge0FallbackId: 71, // Python (3.8.1)
    pistonLang: 'python',
    pistonVersion: '3.10.0',
    fileName: 'solution.py'
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    version: 'Node.js 20',
    judge0Id: 97, // JavaScript (Node.js 20.17.0)
    judge0FallbackId: 63,
    pistonLang: 'javascript',
    pistonVersion: '18.15.0',
    fileName: 'solution.js'
  },
  cpp: {
    id: 'cpp',
    name: 'C++',
    version: 'GCC 14.1.0',
    judge0Id: 105, // C++ (GCC 14.1.0)
    judge0FallbackId: 54,
    pistonLang: 'cpp',
    pistonVersion: '10.2.0',
    fileName: 'solution.cpp'
  },
  java: {
    id: 'java',
    name: 'Java',
    version: 'OpenJDK 17',
    judge0Id: 91, // Java (JDK 17.0.6)
    judge0FallbackId: 62,
    pistonLang: 'java',
    pistonVersion: '15.0.2',
    fileName: 'Main.java'
  },
  c: {
    id: 'c',
    name: 'C',
    version: 'GCC 14.1.0',
    judge0Id: 103, // C (GCC 14.1.0)
    judge0FallbackId: 50,
    pistonLang: 'c',
    pistonVersion: '10.2.0',
    fileName: 'solution.c'
  },
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    version: '5.6.2',
    judge0Id: 101, // TypeScript (5.6.2)
    judge0FallbackId: 74,
    pistonLang: 'typescript',
    pistonVersion: '5.0.3',
    fileName: 'solution.ts'
  }
};

export const normalizeLanguage = (lang) => {
  const l = (lang || '').toLowerCase().trim();
  if (l === 'c++' || l === 'cpp') return 'cpp';
  if (l === 'js' || l === 'javascript' || l === 'node') return 'javascript';
  if (l === 'py' || l === 'python' || l === 'python3') return 'python';
  if (l === 'java') return 'java';
  if (l === 'c') return 'c';
  if (l === 'ts' || l === 'typescript') return 'typescript';
  return l;
};

export const isLanguageSupported = (lang) => {
  const normalized = normalizeLanguage(lang);
  return Boolean(LANGUAGE_CONFIG[normalized]);
};

/**
 * Caps output length to prevent runaway prints from crashing the browser or network
 */
const truncateOutput = (str) => {
  if (typeof str !== 'string') return '';
  if (str.length <= MAX_OUTPUT_LENGTH) return str;
  return str.slice(0, MAX_OUTPUT_LENGTH) + '\n... [Output truncated to 10,000 characters]';
};

/**
 * Normalizes Java source code so it conforms to standard Main class expectations
 */
const normalizeJavaCode = (code) => {
  if (!code) return code;
  let updated = code.replace(/public\s+class\s+([A-Za-z0-9_]+)/g, 'public class Main');
  if (!updated.includes('class Main') && !updated.includes('public class')) {
    updated = `public class Main {\n${updated}\n}`;
  }
  return updated;
};

/**
 * Execute code via Judge0 CE Remote Sandbox
 */
const executeViaJudge0 = async ({ langConfig, sourceCode, stdin, timeoutMs }) => {
  const judge0BaseUrl = process.env.JUDGE0_URL || 'https://ce.judge0.com';
  const cpuTimeLimitSec = Math.max(1, Math.min(10, Math.ceil(timeoutMs / 1000)));

  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), timeoutMs + 3000);

  const finalSource = langConfig.id === 'java' ? normalizeJavaCode(sourceCode) : sourceCode;

  try {
    const response = await fetch(`${judge0BaseUrl}/submissions?wait=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.JUDGE0_API_KEY ? { 'X-RapidAPI-Key': process.env.JUDGE0_API_KEY } : {})
      },
      body: JSON.stringify({
        language_id: langConfig.judge0Id,
        source_code: finalSource,
        stdin: stdin || '',
        cpu_time_limit: cpuTimeLimitSec,
        wall_time_limit: cpuTimeLimitSec + 2,
        memory_limit: 256000 // 256 MB
      }),
      signal: controller.signal
    });

    clearTimeout(abortTimer);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Judge0 HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    const data = await response.json();
    const statusId = data.status?.id;
    const timeMs = data.time ? Math.round(parseFloat(data.time) * 1000) : 0;

    let normalizedStatus = 'Success';
    let exitCode = 0;
    let timedOut = false;
    let stderr = data.stderr || '';

    if (statusId === 3) {
      // 3: Accepted
      normalizedStatus = 'Success';
      exitCode = 0;
    } else if (statusId === 5) {
      // 5: Time Limit Exceeded
      normalizedStatus = 'Time Limit Exceeded';
      exitCode = 124;
      timedOut = true;
      stderr = `Time Limit Exceeded (Execution exceeded ${cpuTimeLimitSec}s)`;
    } else if (statusId === 6) {
      // 6: Compilation Error
      normalizedStatus = 'Compilation Error';
      exitCode = 1;
      stderr = data.compile_output || stderr || 'Compilation Error';
    } else if (statusId >= 7 && statusId <= 12) {
      // 7..12: Runtime Error
      normalizedStatus = 'Runtime Error';
      exitCode = 1;
      stderr = stderr || data.message || `Runtime Error (${data.status?.description || 'Terminated'})`;
    } else {
      normalizedStatus = data.status?.description || 'Execution Error';
      exitCode = statusId === 4 ? 0 : 1;
    }

    return {
      status: normalizedStatus,
      exitCode,
      stdout: truncateOutput(data.stdout || ''),
      stderr: truncateOutput(stderr),
      executionTimeMs: timeMs,
      timeMs,
      timedOut
    };
  } catch (err) {
    clearTimeout(abortTimer);
    if (err.name === 'AbortError') {
      return {
        status: 'Time Limit Exceeded',
        exitCode: 124,
        stdout: '',
        stderr: `Time Limit Exceeded (Execution timed out after ${timeoutMs / 1000}s)`,
        executionTimeMs: timeoutMs,
        timeMs: timeoutMs,
        timedOut: true
      };
    }
    throw err;
  }
};

/**
 * Execute code via Piston Remote Sandbox
 */
const executeViaPiston = async ({ langConfig, sourceCode, stdin, timeoutMs }) => {
  const pistonBaseUrl = process.env.PISTON_URL || 'http://localhost:2000';

  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), timeoutMs + 3000);

  const finalSource = langConfig.id === 'java' ? normalizeJavaCode(sourceCode) : sourceCode;

  try {
    const response = await fetch(`${pistonBaseUrl}/api/v2/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: langConfig.pistonLang,
        version: langConfig.pistonVersion,
        files: [{ name: langConfig.fileName, content: finalSource }],
        stdin: stdin || '',
        run_timeout: timeoutMs,
        compile_timeout: 10000
      }),
      signal: controller.signal
    });

    clearTimeout(abortTimer);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Piston HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    const data = await response.json();
    const run = data.run || {};
    const compile = data.compile || {};

    if (compile.code && compile.code !== 0) {
      return {
        status: 'Compilation Error',
        exitCode: compile.code,
        stdout: '',
        stderr: truncateOutput(compile.stderr || compile.output || 'Compilation Error'),
        executionTimeMs: 0,
        timeMs: 0,
        timedOut: false
      };
    }

    const timedOut = run.signal === 'SIGKILL' || run.signal === 'SIGTERM';
    let status = 'Success';
    if (timedOut) {
      status = 'Time Limit Exceeded';
    } else if (run.code !== 0) {
      status = 'Runtime Error';
    }

    return {
      status,
      exitCode: run.code || (timedOut ? 124 : 0),
      stdout: truncateOutput(run.stdout || run.output || ''),
      stderr: truncateOutput(run.stderr || (timedOut ? 'Time Limit Exceeded' : '')),
      executionTimeMs: run.time || 0,
      timeMs: run.time || 0,
      timedOut
    };
  } catch (err) {
    clearTimeout(abortTimer);
    if (err.name === 'AbortError') {
      return {
        status: 'Time Limit Exceeded',
        exitCode: 124,
        stdout: '',
        stderr: `Time Limit Exceeded (Execution timed out after ${timeoutMs / 1000}s)`,
        executionTimeMs: timeoutMs,
        timeMs: timeoutMs,
        timedOut: true
      };
    }
    throw err;
  }
};

/**
 * Unified execution entrypoint.
 * Automatically delegates to Judge0 CE or Piston based on configuration.
 */
export const executeSingleCode = async ({
  language,
  sourceCode,
  stdin = '',
  timeoutMs = DEFAULT_TIMEOUT_MS
}) => {
  const normLang = normalizeLanguage(language);
  const langConfig = LANGUAGE_CONFIG[normLang];

  if (!langConfig) {
    const supportedList = Object.keys(LANGUAGE_CONFIG).join(', ');
    return {
      status: 'Unsupported Language',
      exitCode: 1,
      stdout: '',
      stderr: `Language '${language}' is not supported. Supported: ${supportedList}`,
      executionTimeMs: 0,
      timeMs: 0,
      timedOut: false
    };
  }

  const executor = (process.env.CODE_EXECUTOR || '').toLowerCase().trim();
  const usePiston = executor === 'piston' || Boolean(process.env.PISTON_URL);

  try {
    if (usePiston) {
      return await executeViaPiston({ langConfig, sourceCode, stdin, timeoutMs });
    }
    return await executeViaJudge0({ langConfig, sourceCode, stdin, timeoutMs });
  } catch (err) {
    console.error(`Remote code execution failed via ${usePiston ? 'Piston' : 'Judge0'}:`, err.message);

    // If Piston failed and Judge0 is available as fallback
    if (usePiston) {
      console.warn('Piston failed, attempting fallback to Judge0 CE...');
      try {
        return await executeViaJudge0({ langConfig, sourceCode, stdin, timeoutMs });
      } catch (fallbackErr) {
        console.error('Judge0 fallback also failed:', fallbackErr.message);
      }
    }

    return {
      status: 'Service Unavailable',
      exitCode: 1,
      stdout: '',
      stderr: 'Code execution service is temporarily unavailable — you can still write and submit your code, it will be evaluated shortly.',
      executionTimeMs: 0,
      timeMs: 0,
      timedOut: false
    };
  }
};

/**
 * Executes code with Redis result caching (Stage 2 Scaling).
 * Candidates frequently re-run identical or starter code.
 * Deterministic outcomes ('Success', 'Wrong Answer') are cached for 600s (10 min).
 * Transient infrastructure errors, timeouts, and service outages are NEVER cached.
 */
export const executeSingleCodeWithCache = async (params) => {
  const { language, sourceCode, stdin = '' } = params;

  if (!isRedisAvailable()) {
    return await executeSingleCode(params);
  }

  const hash = crypto
    .createHash('sha256')
    .update(`${language}:${sourceCode}:${stdin}`)
    .digest('hex');
  const cacheKey = `exec_cache:${hash}`;

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        ...parsed,
        cached: true
      };
    }
  } catch (err) {
    console.warn('[Redis] Cache read warning:', err.message);
  }

  const result = await executeSingleCode(params);

  // Strictly cache deterministic results (never cache timeouts, 503s, or network failures)
  if (result.status === 'Success' || result.status === 'Wrong Answer') {
    try {
      await redisClient.setEx(cacheKey, 600, JSON.stringify(result));
    } catch (err) {
      console.warn('[Redis] Cache write warning:', err.message);
    }
  }

  return result;
};

/**
 * Normalizes string output for whitespace-resilient comparisons
 */
export const cleanOutput = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
};

/**
 * Concurrency-bounded map helper (in-process worker pool, zero external dependencies)
 * Runs up to `limit` promises concurrently to avoid container starvation
 */
const mapConcurrent = async (items, limit, fn) => {
  if (!items || items.length === 0) return [];
  const concurrency = Math.max(1, Math.min(limit || 6, items.length));
  const results = new Array(items.length);
  let index = 0;

  const workers = Array.from({ length: concurrency }, async () => {
    while (index < items.length) {
      const currentIndex = index++;
      results[currentIndex] = await fn(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
  return results;
};

/**
 * Runs code against a test case suite using sandboxed remote execution.
 * Evaluates test cases in parallel up to a concurrency cap (Stage 1 Scaling),
 * with Redis caching for identical runs (Stage 2 Scaling).
 */
export const evaluateCodeAgainstTestCases = async ({
  language,
  sourceCode,
  testCases = [],
  includeHiddenDetails = false,
  timeoutMs = DEFAULT_TIMEOUT_MS
}) => {
  if (!Array.isArray(testCases) || testCases.length === 0) {
    return {
      passed: true,
      totalTests: 0,
      passedTests: 0,
      score: 100,
      verdict: 'Accepted',
      testResults: []
    };
  }

  // Concurrency cap: default 6 concurrent executions per submission (customizable via env)
  const concurrencyLimit = parseInt(process.env.CODE_EXEC_CONCURRENCY || '6', 10);

  let compilationErrorResult = null;

  // Execute test cases concurrently with bounded concurrency
  const results = await mapConcurrent(testCases, concurrencyLimit, async (tc, index) => {
    const isHidden = Boolean(tc.isHidden ?? tc.is_hidden ?? false);
    const input = String(tc.input ?? '');
    const expected = cleanOutput(String(tc.expectedOutput ?? tc.expected_output ?? ''));

    // Fast-fail: if a compilation error was already detected by any worker, skip execution
    if (compilationErrorResult) {
      return {
        id: tc.id || (index + 1),
        isHidden,
        status: 'Compilation Error',
        passed: false,
        stderr: compilationErrorResult.stderr,
        timeMs: 0
      };
    }

    const execRes = await executeSingleCodeWithCache({
      language,
      sourceCode,
      stdin: input,
      timeoutMs
    });

    if (execRes.status === 'Compilation Error') {
      compilationErrorResult = execRes;
      return {
        id: tc.id || (index + 1),
        isHidden,
        status: 'Compilation Error',
        passed: false,
        stderr: execRes.stderr,
        timeMs: execRes.timeMs || 0
      };
    }

    if (execRes.status === 'Time Limit Exceeded') {
      return {
        id: tc.id || (index + 1),
        isHidden,
        status: 'Time Limit Exceeded',
        passed: false,
        timeMs: execRes.timeMs || 0,
        stderr: 'Execution timed out.'
      };
    }

    if (execRes.status === 'Runtime Error') {
      return {
        id: tc.id || (index + 1),
        isHidden,
        status: 'Runtime Error',
        passed: false,
        stderr: execRes.stderr,
        timeMs: execRes.timeMs || 0
      };
    }

    if (execRes.status === 'Service Unavailable') {
      return {
        id: tc.id || (index + 1),
        isHidden,
        status: 'Service Unavailable',
        passed: false,
        stderr: execRes.stderr,
        timeMs: 0
      };
    }

    const actual = cleanOutput(execRes.stdout);
    const passed = execRes.status === 'Success' && actual === expected;
    const status = passed ? 'Passed' : (execRes.status === 'Success' ? 'Wrong Answer' : execRes.status);

    if (isHidden && !includeHiddenDetails) {
      return {
        id: tc.id || (index + 1),
        isHidden: true,
        status,
        passed,
        timeMs: execRes.timeMs || 0
      };
    }

    return {
      id: tc.id || (index + 1),
      isHidden,
      status,
      passed,
      input,
      expectedOutput: expected,
      actualOutput: actual,
      stdout: execRes.stdout,
      stderr: execRes.stderr,
      timeMs: execRes.timeMs || 0
    };
  });

  // Calculate overall verdict
  let overallVerdict = 'Accepted';
  if (results.some(r => r.status === 'Compilation Error')) {
    overallVerdict = 'Compilation Error';
  } else if (results.some(r => r.status === 'Service Unavailable')) {
    overallVerdict = 'Service Unavailable';
  } else if (results.some(r => r.status === 'Time Limit Exceeded')) {
    overallVerdict = 'Time Limit Exceeded';
  } else if (results.some(r => r.status === 'Runtime Error')) {
    overallVerdict = 'Runtime Error';
  } else if (results.some(r => !r.passed)) {
    overallVerdict = 'Wrong Answer';
  }

  const passedCount = results.filter(r => r.passed).length;
  const scorePercentage = testCases.length > 0 ? Math.round((passedCount / testCases.length) * 100) : 100;

  return {
    passed: passedCount === testCases.length,
    totalTests: testCases.length,
    passedTests: passedCount,
    score: scorePercentage,
    verdict: overallVerdict,
    testResults: results
  };
};
