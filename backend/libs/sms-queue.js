import Queue from "bull";

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

let smsQueue = null;

/**
 * Create SMS queue
 */
export const createSMSQueue = () => {
  if (smsQueue) {
    return smsQueue;
  }

  console.log("📬 Queue: Creating SMS queue with Redis...");
  
  try {
    smsQueue = new Queue("sms-queue", {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs
      },
    });

    smsQueue.on("error", (error) => {
      console.error("❌ Queue: Redis connection error:", error.message);
    });

    smsQueue.on("waiting", (jobId) => {
      console.log(`⏰ Queue: Job ${jobId} is waiting`);
    });

    smsQueue.on("active", (job) => {
      console.log(`🏃 Queue: Job ${job.id} started processing`);
    });

    smsQueue.on("stalled", (job) => {
      console.warn(`⚠️ Queue: Job ${job.id} stalled`);
    });

    console.log("✅ Queue: SMS queue created successfully");
    
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
 */
export const cleanQueue = async (grace = 24 * 60 * 60 * 1000) => {
  if (!smsQueue) {
    return { success: false, message: "Queue not initialized" };
  }

  try {
    await smsQueue.clean(grace, "completed");
    await smsQueue.clean(grace, "failed");
    
    return { success: true, message: "Queue cleaned successfully" };
  } catch (error) {
    console.error("❌ Queue: Failed to clean queue:", error.message);
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
    return { success: true, message: "Queue resumed" };
  } catch (error) {
    console.error("❌ Queue: Failed to resume queue:", error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Get failed jobs
 */
export const getFailedJobs = async (start = 0, end = -1) => {
  if (!smsQueue) {
    return [];
  }

  try {
    const jobs = await smsQueue.getFailed(start, end);
    return jobs.map((job) => ({
      id: job.id,
      data: job.data,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
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
    return { success: true, message: "Job retried" };
  } catch (error) {
    console.error("❌ Queue: Failed to retry job:", error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Close queue connection
 */
export const closeQueue = async () => {
  if (smsQueue) {
    await smsQueue.close();
    smsQueue = null;
    console.log("👋 Queue: SMS queue closed");
  }
};

export default smsQueue;
