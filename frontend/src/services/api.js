// Client-side API service — connects React frontend to Express/PostgreSQL backend
// Reads VITE_API_URL from frontend/.env (defaults to /api via Vite proxy in dev)

const resolveBase = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.startsWith('http://localhost') && !envUrl.startsWith('http://127.0.0.1')) {
    return envUrl.replace(/\/+$/, '');
  }
  return "/api";
};

const BASE = resolveBase();

// -- Token storage: primary copy in memory, mirrored to localStorage so a
//    page reload / re-open restores the session. The refresh token lives in
//    an HttpOnly cookie and is sent automatically.
let _memoryToken = localStorage.getItem("rsj_token"); // seed from localStorage on load

const getToken      = () => _memoryToken;
const saveMemToken  = (t) => { _memoryToken = t; };

// Notify the app that the session is no longer valid so it can log the user out.
const emitAuthExpired = () => {
  try { window.dispatchEvent(new Event("rsj:auth-expired")); } catch { /* noop */ }
};

// -- Auth headers --
const authHeaders = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: "Bearer " + getToken() } : {}),
});

// Refresh the short-lived access token using the HttpOnly refresh cookie.
const tryRefresh = async () => {
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    const error = new Error(data.error || "Session refresh failed.");
    error.status = res.status;
    throw error;
  }
  saveMemToken(data.token);
  localStorage.setItem("rsj_token", data.token);
  return data;
};

async function request(method, path, body, _retry = false) {
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (BASE.endsWith('/api') && cleanPath.startsWith('/api/')) {
    cleanPath = cleanPath.slice(4);
  }
  const url = `${BASE}${cleanPath}`;
  try {
    const res = await fetch(url, {
      method,
      headers: authHeaders(),
      credentials: "include", // always include cookies for refresh token
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    // Do not attempt token refresh for a failed login with no access token.
    if (res.status === 401 && !_retry && getToken()) {
      try {
        await tryRefresh();
        return request(method, path, body, true);
      } catch {
        // Refresh failed — clear everything and let caller handle 401
        api.clearToken();
        emitAuthExpired();
      }
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Protected endpoint rejected an unauthenticated request — surface a session expiry.
      if (res.status === 401 && !path.includes("/auth/")) {
        emitAuthExpired();
      }
      const err = new Error(data.error || data.message || (res.status === 500 ? "Server connection issue. Please ensure the backend is running." : "HTTP " + res.status));
      err.status = res.status;
      err.data = data;
      throw err;
    }
    if (typeof data === "object" && data !== null && !Array.isArray(data)) {
      const innerData = data.data !== undefined ? data.data : data;
      return { ok: true, ...data, data: innerData, payload: data, status: res.status };
    }
    return { ok: true, data, status: res.status };
  } catch (err) {
    console.warn("[API] " + method + " " + path + " failed:", err.message);
    return { ok: false, success: false, error: err.message, status: err.status || 500, data: err.data };
  }
}

// -- API client --
export const api = {
  health: () => request("GET", "/health"),

  get:    (path)       => request("GET",    path),
  post:   (path, body) => request("POST",   path, body),
  put:    (path, body) => request("PUT",    path, body),
  delete: (path)       => request("DELETE", path),

  code: {
    run: (body) => request('POST', '/code/run', body),
    evaluate: (body) => request('POST', '/code/evaluate', body),
    submit: async (body, onProgress) => {
      const initRes = await request('POST', '/code/submit', body);
      if (!initRes.ok) return initRes;
      if (!initRes.queued || !initRes.jobId) return initRes; // Synchronous backward-compat fallback

      const jobId = initRes.jobId;
      return new Promise((resolve) => {
        let eventSource = null;
        let pollInterval = null;
        let isResolved = false;

        const cleanup = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        };

        const finish = (result) => {
          if (isResolved) return;
          isResolved = true;
          cleanup();
          resolve(result);
        };

        // Fallback poller
        const startPolling = () => {
          if (pollInterval || isResolved) return;
          pollInterval = setInterval(async () => {
            try {
              const statusRes = await request('GET', `/code/submissions/${jobId}/status`);
              if (statusRes.ok && statusRes.data) {
                const job = statusRes.data;
                if (onProgress && job.progress !== undefined) {
                  onProgress({ status: job.status, progress: job.progress });
                }
                if (job.status === 'completed' && job.result) {
                  finish({ ok: true, success: true, ...job.result, data: job.result });
                } else if (job.status === 'failed') {
                  finish({ ok: false, success: false, error: job.error || 'Evaluation failed' });
                }
              }
            } catch (e) {}
          }, 500);
        };

        // Try Server-Sent Events (SSE) stream
        if (typeof EventSource !== 'undefined') {
          try {
            const streamUrl = `${BASE}/code/submissions/${jobId}/stream`;
            eventSource = new EventSource(streamUrl);

            eventSource.onmessage = (event) => {
              try {
                const data = JSON.parse(event.data);
                if (onProgress && (data.progress !== undefined || data.status)) {
                  onProgress(data);
                }
                if (data.status === 'completed' && data.result) {
                  finish({ ok: true, success: true, ...data.result, data: data.result });
                } else if (data.status === 'failed') {
                  finish({ ok: false, success: false, error: data.error || 'Evaluation failed' });
                }
              } catch (err) {}
            };

            eventSource.onerror = () => {
              // Switch to polling fallback if SSE connection encounters an issue
              cleanup();
              startPolling();
            };
          } catch (err) {
            startPolling();
          }
        } else {
          startPolling();
        }

        // Safety timeout (35 seconds)
        setTimeout(() => {
          if (!isResolved) {
            finish({
              ok: false,
              success: false,
              error: 'Submission evaluation timed out on client wait.'
            });
          }
        }, 35000);
      });
    },
    getLanguages: () => request('GET', '/code/languages'),
    evaluateClient: (body) => request('POST', '/code/evaluate-client', body),
  },

  auth: {
    colleges:   ()     => request("GET",  "/auth/colleges"),
    register:   (body) => request("POST", "/auth/register",     body),
    login:      (body) => request("POST", "/auth/login",        body),
    adminLogin: (body) => request("POST", "/auth/admin/login",  body),
    me:         ()     => request("GET",  "/auth/me"),
    logout:     ()     => fetch(BASE + "/auth/logout", {
      method:      "POST",
      headers:     authHeaders(),
      credentials: "include",
    }).then((r) => r.json()),
    refresh:    ()     => tryRefresh(),
  },

  candidates: {
    getAll:                    ()          => request("GET",    "/candidates"),
    getById:                   (id)        => request("GET",    "/candidates/" + id),
    update:                    (id, body)  => request("PUT",    "/candidates/" + id, body),
    updateAcademicMarks:       (id, body)  => request("PUT",    "/candidates/" + id + "/academic-marks", body),
    getCompanyEligibilityCriteria: ()      => request("GET",    "/candidates/company-eligibility/criteria"),
    delete:                    (id)        => request("DELETE", "/candidates/" + id),
    submissions:               (id)        => request("GET",    "/candidates/" + id + "/submissions"),
    resetAttempt: (id, payload) => {
      const body = typeof payload === "object" && payload !== null ? payload : { assessmentId: payload, targetType: payload };
      return request("POST", "/candidates/" + id + "/reset-attempt", body);
    },
  },

  assessments: {
    getAll:         ()          => request("GET",    "/assessments"),
    getById:        (id)        => request("GET",    "/assessments/" + id),
    create:         (body)      => request("POST",   "/assessments", body),
    update:         (id, body)  => request("PUT",    "/assessments/" + id, body),
    delete:         (id)        => request("DELETE", "/assessments/" + id),
    getQuestions:   (id)        => request("GET",    "/assessments/" + id + "/questions"),
    addQuestions:   (id, body)  => request("POST",   "/assessments/" + id + "/questions", body),
    removeQuestion: (id, qId)   => request("DELETE", "/assessments/" + id + "/questions/" + qId),
    getSections:    (id)        => request("GET",    "/assessments/" + id + "/sections"),
    replaceSections:(id, body)  => request("PUT",    "/assessments/" + id + "/sections", body),
    startAttempt:   (id)        => request("POST",   "/assessments/" + id + "/attempt/start"),
  },

  attempts: {
    status:         (attemptId)             => request("GET",  "/attempts/" + attemptId + "/status"),
    saveAnswer:     (attemptId, body)       => request("POST", "/attempts/" + attemptId + "/answers", body),
    completeSection: (attemptId, body)      => request("POST", "/attempts/" + attemptId + "/section/complete", body),
    submit:         (attemptId, body)       => request("POST", "/attempts/" + attemptId + "/submit", body),
  },

  questions: {
    getAll:  (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request("GET", "/questions" + (qs ? "?" + qs : ""));
    },
    create:  (body)        => request("POST",   "/questions",      body),
    update:  (id, body)    => request("PUT",    "/questions/" + id, body),
    delete:  (id)          => request("DELETE", "/questions/" + id),
  },

  submissions: {
    submit:              (body)      => request("POST", "/submissions",                            body),
    my:                  ()          => request("GET",  "/submissions/my"),
    logProctoringEvent:  (body)      => request("POST", "/submissions/proctoring-event",           body),
    getProctoringEvents: (attemptId) => request("GET",  "/submissions/proctoring-events/" + encodeURIComponent(attemptId)),
  },

  interview: {
    createSession:        (body)            => request("POST", "/interview/session", body),
    getSession:           (id)              => request("GET",  "/interview/session/" + id),
    getQuestions:         (id)              => request("GET",  "/interview/session/" + id + "/questions"),
    saveAnswer:           (questionId, body)=> request("POST", "/interview/question/" + questionId + "/answer", body),
    saveTelemetry:        (id, body)        => request("POST", "/interview/session/" + id + "/telemetry", body),
    completeSession:      (id, body)        => request("POST", "/interview/session/" + id + "/complete", body),
    getAnalysis:          (id)              => request("GET",  "/interview/session/" + id + "/analysis"),
    getAvatarToken:       (body)            => request("POST", "/interview/avatar/token", body),
    getAvatarConfig:      ()                => request("GET",  "/interview/avatar/config"),
    releaseAvatarSession: (body)            => request("POST", "/interview/avatar/release", body),
  },

  admin: {
    stats:     ()           => request("GET", "/admin/stats"),
    analytics: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request("GET", "/admin/analytics" + (qs ? "?" + qs : ""));
    },
    reports:   ()           => request("GET", "/admin/reports"),
    exportResults: async (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`${BASE}/admin/reports/export${qs ? "?" + qs : ""}`, {
        headers: authHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Export failed. Please try again.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `results-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
    colleges: {
      list:        ()                    => request("GET",   "/admin/colleges"),
      create:      (body)                => request("POST",  "/admin/colleges", body),
      update:      (id, body)            => request("PATCH", "/admin/colleges/" + id, body),
      remove:      (id)                  => request("DELETE", "/admin/colleges/" + id),
      admins:      (id)                  => request("GET",   "/admin/colleges/" + id + "/admins"),
      createAdmin: (id, body)            => request("POST",  "/admin/colleges/" + id + "/admins", body),
      updateAdmin: (id, userId, body)    => request("PATCH", "/admin/colleges/" + id + "/admins/" + userId, body),
    },
  },

  // Token management
  saveToken:  (token) => { saveMemToken(token); localStorage.setItem("rsj_token", token); },
  clearToken: ()      => { saveMemToken(null);  localStorage.removeItem("rsj_token"); },
};

export default api;
