const BROWSER_QUEUE = "browser_queue";
const BROWSER_STATUS = "browser_status";

import { BROWSERS } from "dev";
import { Browser, chromium } from "playwright";
import { redis } from "./redis";

export class BrowserManager {
  private static browserConnections: Map<string, Browser> = new Map();

  static async getBrowser(browserId: string): Promise<Browser> {
    if (!this.browserConnections.has(browserId)) {
      const wsEndpoint = await redis.get(`ws:${browserId}`);
      if (!wsEndpoint) {
        throw new Error(`No websocket endpoint found for browser ${browserId}`);
      }
      const hostName = browserId.split("_")[1] as keyof typeof BROWSERS;
      console.log("hostName", hostName);
      console.log("wsEndpoint", wsEndpoint);
      const containerWsEndpoint =
        process.env.NODE_ENV !== "production"
          ? wsEndpoint.replace(/\/.*:8080/, `/${BROWSERS[hostName]}`)
          : wsEndpoint;
      const browser = await chromium.connect({
        wsEndpoint: containerWsEndpoint,
      });
      this.browserConnections.set(browserId, browser);
      return browser;
    }
    return this.browserConnections.get(browserId)!;
  }

  static async getAvailableBrowser(
    maxRetries: number = 3,
    retryDelay: number = 1000,
  ): Promise<string | null> {
    const processedBrowsers = new Set<string>();
    for (let i = 0; i < maxRetries; i++) {
      const browserId = await redis.lpop(BROWSER_QUEUE);
      if (!browserId) {
        console.info("browserId not found", maxRetries);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      }

      if (processedBrowsers.has(browserId)) {
        await redis.rpush(BROWSER_QUEUE, browserId);
        continue;
      }
      processedBrowsers.add(browserId);

      const [lastHeartbeat, status] = await Promise.all([
        redis.get(`heartbeat:${browserId}`),
        redis.hget(BROWSER_STATUS, browserId),
      ]);

      const isAlive =
        lastHeartbeat && (Date.now() - Number(lastHeartbeat)) / 1000 <= 10000;
      const isAvailable = status !== "busy";

      if (!isAlive) {
        console.warn(`Browser ${browserId} appears dead, cleaning up...`);
        await Promise.all([
          redis.del(`ws:${browserId}`),
          redis.lrem(BROWSER_QUEUE, 0, browserId),
          redis.hdel(BROWSER_STATUS, browserId),
          redis.del(`heartbeat:${browserId}`),
        ]);
        continue;
      }

      if (isAvailable) {
        console.log(`Browser ${browserId} found`);
        await redis.hset(BROWSER_STATUS, browserId, "busy");
        return browserId;
      }

      await redis.rpush(BROWSER_QUEUE, browserId);

      if (processedBrowsers.size === (await redis.llen(BROWSER_QUEUE))) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        processedBrowsers.clear();
      }
    }

    return null;
  }

  static async releaseBrowser(browserId: string | null): Promise<void> {
    if (!browserId) return;
    await Promise.all([
      redis.hset(BROWSER_STATUS, browserId, "idle"),
      redis.rpush(BROWSER_QUEUE, browserId),
    ]);
  }
}
