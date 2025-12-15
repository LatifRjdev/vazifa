import { Queue, Worker, QueueEvents } from "bullmq";

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

let smsQueue = null;
let queueEvents = null;

/**
 * Create SMS queue with BullMQ
 */
export const createSMSQueue = () => {
  if (smsQueue) {
    return smsQueue;
  }

  console.log("📬 Queue: Creating SMS queue with BullMQ + Redis...");
  
  try {
    // Create queue with rate limiting and better options
    smsQueue = new Queue("sms-queue", {
      connection: redisConfig,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 2000, // Start with 2 seconds
        },
        removeOnComplete: {
          count: 100, // Keep last 100 completed jobs
          age: 24 * 3600, // Keep for 24 hours
        },
        removeOnFail: {
          count: 500, // Keep last 500 failed jobs
          age: 7 * 24 * 3600, // Keep for 7 days
        },
      },
      // Rate limiter: максимум 10 сообщений в секунду
      limiter: {
        max: 10,
        duration: 1000,
      },
    });

    // Setup queue events for monitoring
    queueEvents = new QueueEvents("sms-queue", {
      connection: redisConfig,
    });

    queueEvents.on("waiting", ({ jobId }) => {
      console.log(`⏰ Queue: Job ${jobId} is waiting`);
    });

    queueEvents.on("active", ({ jobId }) => {
      console.log(`🏃 Queue: Job ${jobId} started processing`);
    });

    queueEvents.on("completed", ({ jobId, returnvalue }) => {
      console.log(`✅ Queue: Job ${jobId} completed successfully`);
    });

    queueEvents.on("failed", ({ jobId, failedReason }) => {
      console.error(`❌ Queue: Job ${jobId} failed:`, failedReason);
    });

    queueEvents.on("stalled", ({ jobId }) => {
      console.warn(`⚠️  Queue: Job ${jobId} stalled`);
    });

    console.log("✅ Queue: SMS queue created successfully with BullMQ");
    console.log("   Rate limit: 10 SMS per second");
    console.log("   Retry attempts: 5 with exponential backoff");
    
    return smsQueue;
  } catch (error) {
    console.error("❌ Queue: Failed to create SMS queue:", error.message);
    throw error;
  }
};

/**
 * Get queue stats
 */
export const getQueueStats = async () => {
  if (!smsQueue) {
    return null;
  }

  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      smsQueue.getWaitingCount(),
      smsQueue.getActiveCount(),
      smsQueue.getCompletedCount(),
      smsQueue.getFailedCount(),
      smsQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  } catch (error) {
    console.error("❌ Queue: Failed to get queue stats:", error.message);
    return null;
  }
};

/**
 * Clean old jobs from queue
 * @param {number} grace - Grace period in milliseconds
 * @param {string} status - Job status to clean (completed, failed, all)
 */
export const cleanQueue = async (grace = 24 * 60 * 60 * 1000, status = 'all') => {
  if (!smsQueue) {
    return { success: false, message: "Queue not initialized" };
  }

  try {
    let cleanedCount = 0;

    if (status === 'completed' || status === 'all') {
      const completed = await smsQueue.clean(grace, 100, 'completed');
      cleanedCount += completed.length;
      console.log(`🧹 Cleaned ${completed.length} completed jobs`);
    }

    if (status === 'failed' || status === 'all') {
      const failed = await smsQueue.clean(grace, 100, 'failed');
      cleanedCount += failed.length;
      console.log(`🧹 Cleaned ${failed.length} failed jobs`);
    }
    
    return { 
      success: true, 
      message: `Queue cleaned successfully`,
      cleanedCount 
    };
  } catch (error) {
    console.error("❌ Queue: Failed to clean queue:", error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Obliterate queue - completely remove all jobs
 */
export const obliterateQueue = async () => {
  if (!smsQueue) {
    return { success: false, message: "Queue not initialized" };
  }

  try {
    await smsQueue.obliterate({ force: true });
    console.log("💥 Queue: All jobs obliterated");
    
    return { success: true, message: "Queue obliterated successfully" };
  } catch (error) {
    console.error("❌ Queue: Failed to obliterate queue:", error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Pause queue
 */
export const pauseQueue = async () => {
  if (!smsQueue) {
    return { success: false, message: "Queue not initialized" };
  }

  try {
    await smsQueue.pause();
    console.log("⏸️  Queue: Paused");
    return { success: true, message: "Queue paused" };
  } catch (error) {
    console.error("❌ Queue: Failed to pause queue:", error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Resume queue
 */
export const resumeQueue = async () => {
  if (!smsQueue) {
    return { success: false, message: "Queue not initialized" };
  }

  try {
    await smsQueue.resume();
    console.log("▶️  Queue: Resumed");
    return { success: true, message: "Queue resumed" };
  } catch (error) {
    console.error("❌ Queue: Failed to resume queue:", error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Get failed jobs
 */
export const getFailedJobs = async (start = 0, end = 10) => {
  if (!smsQueue) {
    return [];
  }

  try {
    const jobs = await smsQueue.getFailed(start, end);
    return jobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    }));
  } catch (error) {
    console.error("❌ Queue: Failed to get failed jobs:", error.message);
    return [];
  }
};

/**
 * Retry failed job
 */
export const retryFailedJob = async (jobId) => {
  if (!smsQueue) {
    return { success: false, message: "Queue not initialized" };
  }

  try {
    const job = await smsQueue.getJob(jobId);
    if (!job) {
      return { success: false, message: "Job not found" };
    }

    await job.retry();
    console.log(`🔄 Queue: Job ${jobId} retried`);
    return { success: true, message: "Job retried" };
  } catch (error) {
    console.error("❌ Queue: Failed to retry job:", error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Retry all failed jobs
 */
export const retryAllFailedJobs = async () => {
  if (!smsQueue) {
    return { success: false, message: "Queue not initialized" };
  }

  try {
    const failedJobs = await smsQueue.getFailed();
    let retriedCount = 0;

    for (const job of failedJobs) {
      try {
        await job.retry();
        retriedCount++;
      } catch (err) {
        console.error(`Failed to retry job ${job.id}:`, err.message);
      }
    }

    console.log(`🔄 Queue: Retried ${retriedCount} failed jobs`);
    return { 
      success: true, 
      message: `Retried ${retriedCount} failed jobs`,
      retriedCount 
    };
  } catch (error) {
    console.error("❌ Queue: Failed to retry all failed jobs:", error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Get queue instance
 */
export const getQueue = () => smsQueue;

/**
 * Close queue connection
 */
export const closeQueue = async () => {
  if (smsQueue) {
    await smsQueue.close();
    smsQueue = null;
    console.log("👋 Queue: SMS queue closed");
  }
  
  if (queueEvents) {
    await queueEvents.close();
    queueEvents = null;
    console.log("👋 Queue: Queue events closed");
  }
};

export default smsQueue;
