interface RateLimitConfig {
  perSecond: number;
  perHour: number;
}

interface RequestTimestamp {
  timestamp: number;
}

class RateLimiter {
  private requests: RequestTimestamp[] = [];
  private config: RateLimitConfig;

  constructor(config?: RateLimitConfig) {
    this.config = {
      perSecond: parseInt(process.env.RATE_LIMIT_PER_SECOND || '2', 10),
      perHour: parseInt(process.env.RATE_LIMIT_PER_HOUR || '5000', 10),
      ...config,
    };
  }

  /**
   * Checks if a request can be made based on rate limits
   * @returns Object with canProceed flag and wait time if needed
   */
  check(): { canProceed: boolean; waitMs: number } {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    const oneHourAgo = now - 3600000;

    // Remove requests older than 1 hour
    this.requests = this.requests.filter((req) => req.timestamp > oneHourAgo);

    // Count requests in the last second
    const requestsInLastSecond = this.requests.filter(
      (req) => req.timestamp > oneSecondAgo
    ).length;

    // Count requests in the last hour
    const requestsInLastHour = this.requests.length;

    // Check per-second limit
    if (requestsInLastSecond >= this.config.perSecond) {
      const oldestInSecond = this.requests.find(
        (req) => req.timestamp > oneSecondAgo
      );
      const waitMs = oldestInSecond
        ? Math.max(0, 1000 - (now - oldestInSecond.timestamp))
        : 1000;

      return { canProceed: false, waitMs };
    }

    // Check per-hour limit
    if (requestsInLastHour >= this.config.perHour) {
      const oldestInHour = this.requests[0];
      const waitMs = oldestInHour
        ? Math.max(0, 3600000 - (now - oldestInHour.timestamp))
        : 3600000;

      return { canProceed: false, waitMs };
    }

    return { canProceed: true, waitMs: 0 };
  }

  /**
   * Records a request
   */
  record(): void {
    this.requests.push({ timestamp: Date.now() });
  }

  /**
   * Waits if necessary and then records the request
   * @returns Promise that resolves when the request can proceed
   */
  async throttle(): Promise<void> {
    const { canProceed, waitMs } = this.check();

    if (!canProceed) {
      await new Promise((resolve) => setTimeout(resolve, waitMs + 100)); // Add 100ms buffer
      return this.throttle(); // Recursive check after waiting
    }

    this.record();
  }

  /**
   * Gets current rate limit status
   */
  getStatus(): {
    requestsInLastSecond: number;
    requestsInLastHour: number;
    remainingPerSecond: number;
    remainingPerHour: number;
  } {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    const oneHourAgo = now - 3600000;

    const requestsInLastSecond = this.requests.filter(
      (req) => req.timestamp > oneSecondAgo
    ).length;

    const requestsInLastHour = this.requests.filter(
      (req) => req.timestamp > oneHourAgo
    ).length;

    return {
      requestsInLastSecond,
      requestsInLastHour,
      remainingPerSecond: Math.max(
        0,
        this.config.perSecond - requestsInLastSecond
      ),
      remainingPerHour: Math.max(0, this.config.perHour - requestsInLastHour),
    };
  }

  /**
   * Resets all recorded requests (use for testing)
   */
  reset(): void {
    this.requests = [];
  }
}

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null;

/**
 * Gets the singleton rate limiter instance
 */
export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter();
  }
  return rateLimiterInstance;
}

/**
 * Creates a new rate limiter instance (useful for testing or multiple APIs)
 */
export function createRateLimiter(config?: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}

export default RateLimiter;
