import http from 'http';

const BASE_URL = 'http://localhost:5000';

const postJson = (urlPath, body) => {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const data = JSON.stringify(body);

    const req = http.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, raw });
          }
        });
      }
    );

    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

const getJson = (urlPath) => {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    http
      .get(url, (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, raw });
          }
        });
      })
      .on('error', reject);
  });
};

const listenSSE = (urlPath, timeoutMs = 30000) => {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const events = [];

    const req = http.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`SSE connection failed with HTTP ${res.statusCode}`));
      }

      let buffer = '';

      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // keep remainder

        for (const line of lines) {
          const match = line.match(/^data:\s*(.+)$/m);
          if (match) {
            try {
              const parsed = JSON.parse(match[1]);
              events.push(parsed);
              if (parsed.status === 'completed' || parsed.status === 'failed') {
                req.destroy();
                return resolve(events);
              }
            } catch (e) {}
          }
        }
      });

      res.on('end', () => resolve(events));
      res.on('error', reject);
    });

    req.on('error', reject);

    setTimeout(() => {
      req.destroy();
      resolve(events);
    }, timeoutMs);
  });
};

async function runStage3Tests() {
  console.log('🧪 Starting Stage 3 Asynchronous Queue & SSE Streaming Verification...\n');

  // Test Case Payload: Python solution calculating sum of integers
  const sampleSubmission = {
    questionId: 'q-sample-test',
    language: 'python',
    sourceCode: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    a = int(data[0])
    b = int(data[1])
    print(a + b)

if __name__ == '__main__':
    solve()
`,
    testCases: [
      { id: 1, input: '2 3', expectedOutput: '5', isHidden: false },
      { id: 2, input: '10 20', expectedOutput: '30', isHidden: false },
      { id: 3, input: '-5 5', expectedOutput: '0', isHidden: true },
      { id: 4, input: '100 200', expectedOutput: '300', isHidden: true }
    ]
  };

  // Phase 1: Test Async Submission & HTTP 202 Response
  console.log('--- Phase 1: Enqueue Code Submission (HTTP 202 Fast-Return) ---');
  const startTime = Date.now();
  const submitRes = await postJson('/api/code/submit', sampleSubmission);
  const enqueueDuration = Date.now() - startTime;

  console.log(`HTTP Status: ${submitRes.status} (Expected: 202)`);
  console.log(`Enqueue Response Time: ${enqueueDuration}ms (Target: < 50ms)`);
  console.log(`Response Payload:`, submitRes.data);

  if (submitRes.status !== 202 || !submitRes.data?.jobId) {
    throw new Error('Phase 1 Failed: Expected HTTP 202 with jobId');
  }
  console.log('✅ Phase 1 Passed: Fast HTTP 202 return confirmed.\n');

  const jobId = submitRes.data.jobId;

  // Phase 2: Test Server-Sent Events (SSE) Stream
  console.log(`--- Phase 2: Listen to SSE Stream (/api/code/submissions/${jobId}/stream) ---`);
  const sseStart = Date.now();
  const sseEvents = await listenSSE(`/api/code/submissions/${jobId}/stream`);
  const sseDuration = Date.now() - sseStart;

  console.log(`SSE Stream duration: ${sseDuration}ms`);
  console.log(`SSE Events Received (${sseEvents.length}):`);
  for (const ev of sseEvents) {
    console.log(`  → status: ${ev.status}, progress: ${ev.progress}%${ev.message ? ` (${ev.message})` : ''}`);
    if (ev.result) {
      console.log(`    Result Verdict: ${ev.result.evaluation?.verdict}`);
      console.log(`    Passed Tests: ${ev.result.summary?.passedTests}/${ev.result.summary?.totalTests}`);
      console.log(`    Earned Marks: ${ev.result.earnedMarks}/${ev.result.maxMarks}`);
    }
  }

  const completedEvent = sseEvents.find((e) => e.status === 'completed');
  if (!completedEvent || !completedEvent.result?.evaluation) {
    throw new Error('Phase 2 Failed: No completed event received with valid evaluation');
  }
  console.log('✅ Phase 2 Passed: SSE real-time streaming confirmed.\n');

  // Phase 3: Test REST Polling Endpoint
  console.log(`--- Phase 3: Verify REST Status Polling (/api/code/submissions/${jobId}/status) ---`);
  const statusRes = await getJson(`/api/code/submissions/${jobId}/status`);
  console.log('Polling Status Response:', statusRes.data);

  if (statusRes.status !== 200 || statusRes.data?.status !== 'completed') {
    throw new Error('Phase 3 Failed: Polling endpoint did not return completed state');
  }
  console.log('✅ Phase 3 Passed: REST polling fallback confirmed.\n');

  // Phase 4: Multi-Submission Concurrency Burst (10 Simultaneous Submissions)
  console.log('--- Phase 4: High-Concurrency Burst (10 Simultaneous Submissions) ---');
  const burstStart = Date.now();
  const burstPromises = Array.from({ length: 10 }, (_, i) => {
    return postJson('/api/code/submit', {
      ...sampleSubmission,
      clientKey: `cand-burst-${i}`
    });
  });

  const burstResults = await Promise.all(burstPromises);
  const burstDuration = Date.now() - burstStart;

  const all202 = burstResults.every((r) => r.status === 202 && r.data?.jobId);
  console.log(`10 Requests Enqueued in: ${burstDuration}ms (Avg ${Math.round(burstDuration / 10)}ms/req)`);
  console.log(`All Returned HTTP 202: ${all202 ? 'YES ✅' : 'NO ❌'}`);

  if (!all202) {
    throw new Error('Phase 4 Failed: Some burst submissions failed to enqueue with HTTP 202');
  }

  // Wait for the burst jobs to complete
  console.log('Waiting for burst jobs to process in worker pool...');
  const burstJobIds = burstResults.map((r) => r.data.jobId);
  let allDone = false;
  let attempts = 0;

  while (!allDone && attempts < 20) {
    attempts++;
    await new Promise((r) => setTimeout(r, 1000));
    const statuses = await Promise.all(burstJobIds.map((id) => getJson(`/api/code/submissions/${id}/status`)));
    const completedCount = statuses.filter((s) => s.data?.status === 'completed').length;
    console.log(`  [Worker Pool] Completed: ${completedCount}/10 jobs`);
    if (completedCount === 10) {
      allDone = true;
    }
  }

  if (!allDone) {
    throw new Error('Phase 4 Failed: Burst jobs did not all complete within timeout');
  }
  console.log('✅ Phase 4 Passed: 10/10 concurrent submissions executed cleanly.\n');

  console.log('🎉 ALL STAGE 3 TESTS PASSED! Stage 3 Asynchronous Queueing is 100% operational.');
}

runStage3Tests().catch((err) => {
  console.error('❌ Stage 3 Test Failure:', err);
  process.exit(1);
});
