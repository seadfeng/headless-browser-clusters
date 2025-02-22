const BROWSER_CURRENT = "browser_current";
const BROWSER_STATUS = "browser_status";

import { BROWSERS } from "dev";
import { Browser, chromium } from "playwright";
import { redis } from "./redis";

export class BrowserManager {
  private static browserConnections: Map<string, Browser> = new Map();
  private static browserIds: string[] = [];
  public static total: number = 0;

  static async count(): Promise<number> {
    if (this.total === 0) {
      console.log("set total");
      const [allStatus] = await Promise.all([
        redis.hgetall(BROWSER_STATUS),
        redis.set(BROWSER_CURRENT, 0),
      ]);
      const keys = Object.keys(allStatus);
      this.total = keys.length;
    }
    return this.total;
  }

  static async init(): Promise<string[]> {
    await this.count();
    if (this.total > 0) {
      console.log("total", this.total);
      const keys = Object.keys(await redis.hgetall(BROWSER_STATUS));
      this.browserIds = keys;
    } else {
      throw new Error("browser not found");
    }
    return this.browserIds;
  }

  static async nextBrowserId(): Promise<string> {
    const [current] = await Promise.all([redis.incr(BROWSER_CURRENT)]);
    const index = current % this.total;

    return this.browserIds[index];
  }

  static async getBrowser(): Promise<Browser> {
    const browserId = await this.nextBrowserId();

    const getWsEndpoint = (wsEndpoint: string) => {
      const hostName = browserId.split("_")[1] as keyof typeof BROWSERS;
      console.log("hostName", hostName);
      console.log("wsEndpoint", wsEndpoint);
      return process.env.NODE_ENV !== "production"
        ? wsEndpoint.replace(/\/.*:8080/, `/${BROWSERS[hostName]}`)
        : wsEndpoint;
    };

    const createConnection = async (browserId: string) => {
      const wsEndpoint = await redis.get(`ws:${browserId}`);
      if (!wsEndpoint) {
        throw new Error(`No websocket endpoint found for browser ${browserId}`);
      }

      const browser = await chromium.connect({
        wsEndpoint: getWsEndpoint(wsEndpoint),
      });
      this.browserConnections.set(browserId, browser);
      return browser;
    };

    if (!this.browserConnections.has(browserId)) {
      return createConnection(browserId);
    }

    const browser = this.browserConnections.get(browserId)!;

    if (!browser.isConnected) {
      this.browserConnections.delete(browserId);
      console.warn("ReConnected:", browserId);
      return createConnection(browserId);
    } else {
      console.warn("Found browserId:", browserId);
      return browser;
    }
  }
}
