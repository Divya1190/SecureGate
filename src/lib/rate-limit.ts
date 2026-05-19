import { NextRequest, NextResponse } from "next/server";

interface RateLimitTracker {
  timestamps: number[];
}

const trackers = new Map<string, RateLimitTracker>();

// Clean up stale trackers every 5 minutes to prevent memory leaks
if (typeof globalThis !== "undefined") {
  const globalAny = globalThis as any;
  if (!globalAny.__rateLimitCleanupInterval) {
    globalAny.__rateLimitCleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, tracker] of trackers.entries()) {
        // If the newest timestamp is older than 15 minutes, delete the entry
        const newest = tracker.timestamps[tracker.timestamps.length - 1];
        if (!newest || now - newest > 15 * 60 * 1000) {
          trackers.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }
}

export function rateLimit(
  request: NextRequest,
  limit: number,
  windowMs: number
): { success: boolean; response?: NextResponse; retryAfter?: number } {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  const key = `${ip}:${request.nextUrl.pathname}`;
  const now = Date.now();

  let tracker = trackers.get(key);
  if (!tracker) {
    tracker = { timestamps: [] };
    trackers.set(key, tracker);
  }

  // Filter timestamps to only keep those within the sliding window
  tracker.timestamps = tracker.timestamps.filter(
    (time) => now - time < windowMs
  );

  if (tracker.timestamps.length >= limit) {
    const oldestTimestamp = tracker.timestamps[0];
    const msPassedSinceOldest = now - oldestTimestamp;
    const msToWait = windowMs - msPassedSinceOldest;
    const secondsToWait = Math.ceil(msToWait / 1000);

    const response = NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(secondsToWait),
        },
      }
    );

    return { success: false, response, retryAfter: secondsToWait };
  }

  tracker.timestamps.push(now);
  return { success: true };
}
