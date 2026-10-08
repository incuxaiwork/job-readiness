import { EventEmitter } from 'events';
import crypto from 'crypto';
import { Queue, Worker, QueueEvents } from 'bullmq';
import { isRedisAvailable } from '../db/redis.js';
import { processSubmission } from '../workers/submissionWorker.js';

const QUEUE_NAME = 'code-submissions';
const REDIS_URL = process.env.REDIS_URL || 'redis://default:qeTZunBQpbbGqpqXmnFZoKLNzzqnNCdo@redis.railway.internal:6379';

// ─── In-Memory Fallback Queue (Active in dev / when Redis is offline) ─────────
class InMemorySubmissionQueue extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map();
    this.activeWorkers = 0;
    this.maxConcurrency = parseInt(process.env.SUBMISSION_WORKER_CONCURRENCY || '10', 10);
    this.queue = [];
  }

  async add(data) {
    const id = `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const job = {
      id,
      data,
      status: 'queued',
      progress: 0,
      result: null,
      error: null,
      createdAt: Date.now()
    };
    this.jobs.set(id, job);
    this.queue.push(id);

    // Clean up old jobs after 1 hour
    if (this.jobs.size > 2000) {
      const oldestKey = this.jobs.keys().next().value;
      this.jobs.delete(oldestKey);
    }

    setImmediate(() => this._drainQueue());
    return { id, status: 'queued' };
  }

  async getJob(id) {
    const job = this.jobs.get(id);
    if (!job) return null;
    return {
      id: job.id,
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error
    };
  }

  async _drainQueue() {
    while (this.activeWorkers < this.maxConcurrency && this.queue.length > 0) {
      const id = this.queue.shift();
      const job = this.jobs.get(id);
      if (!job) continue;

      this.activeWorkers++;
      job.status = 'evaluating';
      this.emit('progress', { jobId: id, data: { step: 'evaluating', progress: 5 } });

      (async () => {
        try {
          const updateProgress = async (prog) => {
            job.progress = prog.progress || 0;
            this.emit('progress', { jobId: id, data: prog });
          };

          const result = await processSubmission(job.data, updateProgress);
          job.status = 'completed';
          job.progress = 100;
          job.result = result;
          this.emit('completed', { jobId: id, returnvalue: result });
        } catch (err) {
          job.status = 'failed';
          job.error = err.message;
          this.emit('failed', { jobId: id, failedReason: err.message });
        } finally {
          this.activeWorkers--;
          setImmediate(() => this._drainQueue());
        }
      })();
    }
  }
}

// ─── Dual-Engine Queue Manager ───────────────────────────────────────────────
let bullQueue = null;
let bullWorker = null;
let bullEvents = null;
let inMemoryFallback = new InMemorySubmissionQueue();
let useBull = false;

// Attempt BullMQ initialization if Redis is enabled
const initBullMQ = () => {
  try {
    let connectionUrl = REDIS_URL;
    // Parse Redis connection details
    const parsed = new URL(connectionUrl);
    const connectionOpts = {
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379', 10),
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      maxRetriesPerRequest: null,
      connectTimeout: 4000,
      enableOfflineQueue: false
    };

    bullQueue = new Queue(QUEUE_NAME, {
      connection: connectionOpts,
      defaultJobOptions: {
        removeOnComplete: { age: 3600, count: 1000 },
        removeOnFail: { age: 7200, count: 1000 }
      }
    });

    bullQueue.on('error', (err) => {
      // Non-fatal logging if Redis is unreachable in local dev
      if (err.code !== 'ENOTFOUND') console.warn(`[BullMQ Queue] Notice: ${err.message}`);
    });

    const concurrency = parseInt(process.env.SUBMISSION_WORKER_CONCURRENCY || '10', 10);
    bullWorker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const updateProgress = async (prog) => {
          await job.updateProgress(prog);
        };
        return await processSubmission(job.data, updateProgress);
      },
      {
        connection: connectionOpts,
        concurrency
      }
    );

    bullWorker.on('error', (err) => {
      if (err.code !== 'ENOTFOUND') console.warn(`[BullMQ Worker] Notice: ${err.message}`);
    });

    bullEvents = new QueueEvents(QUEUE_NAME, { connection: connectionOpts });
    bullEvents.on('error', () => {});

    useBull = true;
    console.log('⚡ [BullMQ] Distributed submission queue initialized.');
  } catch (err) {
    useBull = false;
    console.log('ℹ️  [SubmissionQueue] Operating in high-performance In-Memory asynchronous mode.');
  }
};

// If Redis was ready, try BullMQ; else fall back cleanly
if (isRedisAvailable()) {
  initBullMQ();
} else {
  // Check again when Redis client connects
  setTimeout(() => {
    if (isRedisAvailable() && !useBull) {
      initBullMQ();
    }
  }, 2000);
}

/**
 * Enqueue a new code submission for asynchronous evaluation.
 * @param {Object} jobData - Question & submission code details
 * @returns {Promise<{ id: string, status: string }>}
 */
export const addSubmissionJob = async (jobData) => {
  if (useBull && isRedisAvailable() && bullQueue) {
    try {
      const job = await bullQueue.add('evaluate-submission', jobData);
      return { id: job.id, status: 'queued' };
    } catch (err) {
      console.warn('[BullMQ] Add job failed, delegating to in-memory fallback:', err.message);
    }
  }

  return await inMemoryFallback.add(jobData);
};

/**
 * Retrieve the current status, progress, and result of a submission job.
 * @param {string} jobId
 * @returns {Promise<Object|null>}
 */
export const getSubmissionJob = async (jobId) => {
  if (useBull && isRedisAvailable() && bullQueue) {
    try {
      const job = await bullQueue.getJob(jobId);
      if (job) {
        const state = await job.getState();
        return {
          id: job.id,
          status: state, // 'waiting', 'active', 'completed', 'failed'
          progress: job.progress,
          result: job.returnvalue || null,
          error: job.failedReason || null
        };
      }
    } catch (err) {
      // Fallback
    }
  }

  return await inMemoryFallback.getJob(jobId);
};

/**
 * Subscribe to job lifecycle events for Server-Sent Events (SSE) streaming.
 * @param {string} jobId
 * @param {Object} handlers - { onProgress, onCompleted, onFailed }
 * @returns {Function} Unsubscribe function
 */
export const subscribeJobEvents = (jobId, { onProgress, onCompleted, onFailed }) => {
  if (useBull && isRedisAvailable() && bullEvents) {
    const progressHandler = ({ jobId: eventJobId, data }) => {
      if (String(eventJobId) === String(jobId)) {
        onProgress?.(data);
      }
    };

    const completedHandler = ({ jobId: eventJobId, returnvalue }) => {
      if (String(eventJobId) === String(jobId)) {
        let result = returnvalue;
        if (typeof returnvalue === 'string') {
          try { result = JSON.parse(returnvalue); } catch (e) {}
        }
        onCompleted?.(result);
      }
    };

    const failedHandler = ({ jobId: eventJobId, failedReason }) => {
      if (String(eventJobId) === String(jobId)) {
        onFailed?.(failedReason);
      }
    };

    bullEvents.on('progress', progressHandler);
    bullEvents.on('completed', completedHandler);
    bullEvents.on('failed', failedHandler);

    return () => {
      bullEvents.off('progress', progressHandler);
      bullEvents.off('completed', completedHandler);
      bullEvents.off('failed', failedHandler);
    };
  }

  // In-memory subscription
  const progressHandler = ({ jobId: eventJobId, data }) => {
    if (String(eventJobId) === String(jobId)) onProgress?.(data);
  };
  const completedHandler = ({ jobId: eventJobId, returnvalue }) => {
    if (String(eventJobId) === String(jobId)) onCompleted?.(returnvalue);
  };
  const failedHandler = ({ jobId: eventJobId, failedReason }) => {
    if (String(eventJobId) === String(jobId)) onFailed?.(failedReason);
  };

  inMemoryFallback.on('progress', progressHandler);
  inMemoryFallback.on('completed', completedHandler);
  inMemoryFallback.on('failed', failedHandler);

  return () => {
    inMemoryFallback.off('progress', progressHandler);
    inMemoryFallback.off('completed', completedHandler);
    inMemoryFallback.off('failed', failedHandler);
  };
};
