const BASE_URL = 'http://localhost:5000/api';

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runVerification() {
  console.log('🧪 Starting End-to-End Verification: Admin Reset Assessment Attempt / Allow Retake...\n');

  const testEmail = `retake_test_${Date.now()}@example.com`;
  const testPassword = 'Password@123';
  let candidateToken = '';
  let candidateId = '';
  let adminToken = '';

  try {
    // 1. Register candidate
    console.log(`1️⃣ Registering test candidate: ${testEmail}`);
    const regRes = await request(`${BASE_URL}/auth/register`, {
      method: 'POST',
      body: {
        name: 'Retake Tester',
        email: testEmail,
        password: testPassword,
        mobile: '9876543210',
        college: 'Test University',
        branch: 'CSE',
        specialization: 'Full Stack Development',
        country: 'India',
        state: 'Telangana',
        city: 'Hyderabad',
        graduationYear: 2026
      }
    });
    if (!regRes.ok) throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
    candidateToken = regRes.data.token;
    candidateId = regRes.data.candidate.id;
    console.log(`   ✅ Candidate registered! ID: ${candidateId}`);

    // 2. First Submission
    console.log(`\n2️⃣ Candidate submits Assessment 'asm-1' (First attempt)`);
    const sub1 = await request(`${BASE_URL}/submissions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${candidateToken}` },
      body: {
        candidateId,
        assessmentId: 'asm-1',
        answers: { 'q1': 1, 'q2': 2 },
        timeTaken: '15m 30s',
        score: 85,
        totalMarks: 100,
        obtainedMarks: 85,
        categoryScores: { technical: 85, aptitude: 85 }
      }
    });
    if (!sub1.ok) throw new Error(`First submission failed: ${JSON.stringify(sub1.data)}`);
    console.log(`   ✅ Submission 1 successful! Status: ${sub1.status}`);

    // 3. Second Submission (Should be BLOCKED)
    console.log(`\n3️⃣ Candidate attempts second submission for 'asm-1' without admin reset`);
    const sub2 = await request(`${BASE_URL}/submissions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${candidateToken}` },
      body: {
        candidateId,
        assessmentId: 'asm-1',
        answers: { 'q1': 2, 'q2': 2 },
        score: 90
      }
    });
    if (sub2.status === 403) {
      console.log(`   ✅ BLOCKED as expected (HTTP 403): "${sub2.data.error}"`);
    } else {
      throw new Error(`❌ FAILURE: Second submission should have been blocked with 403, got ${sub2.status}: ${JSON.stringify(sub2.data)}`);
    }

    // 4. Non-admin reset attempt (Should be BLOCKED)
    console.log(`\n4️⃣ Non-admin tries to reset attempt`);
    const nonAdminReset = await request(`${BASE_URL}/candidates/${candidateId}/reset-attempt`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${candidateToken}` },
      body: { assessmentId: 'asm-1' }
    });
    if (nonAdminReset.status === 403) {
      console.log(`   ✅ RBAC check passed: Non-admin blocked with HTTP 403: "${nonAdminReset.data.error}"`);
    } else {
      throw new Error(`❌ FAILURE: Non-admin should NOT be allowed to reset attempts, got ${nonAdminReset.status}`);
    }

    // 5. Admin logs in and resets candidate attempt
    console.log(`\n5️⃣ Admin logs in and performs reset`);
    const adminLoginRes = await request(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      body: {
        email: 'admin@readysetjob.com',
        password: 'Admin@2026'
      }
    });
    if (!adminLoginRes.ok) throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.data)}`);
    adminToken = adminLoginRes.data.token;
    console.log(`   ✅ Admin logged in.`);

    const resetRes = await request(`${BASE_URL}/candidates/${candidateId}/reset-attempt`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { assessmentId: 'asm-1' }
    });
    if (!resetRes.ok) throw new Error(`Admin reset failed: ${JSON.stringify(resetRes.data)}`);
    console.log(`   ✅ Admin reset response:`, resetRes.data);

    // 6. Candidate takes assessment again after admin reset (Should SUCCEED)
    console.log(`\n6️⃣ Candidate submits Assessment 'asm-1' after admin reset`);
    const sub3 = await request(`${BASE_URL}/submissions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${candidateToken}` },
      body: {
        candidateId,
        assessmentId: 'asm-1',
        answers: { 'q1': 0, 'q2': 0 },
        timeTaken: '20m 00s',
        score: 95,
        totalMarks: 100,
        obtainedMarks: 95,
        categoryScores: { technical: 95, aptitude: 95 }
      }
    });
    if (!sub3.ok) throw new Error(`Retake submission failed: ${JSON.stringify(sub3.data)}`);
    console.log(`   ✅ Retake submission succeeded with HTTP ${sub3.status}! Score: ${sub3.data.data?.score}`);

    console.log('\n🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🎯');
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    process.exit(1);
  }
}

runVerification();
