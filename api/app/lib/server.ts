import { HeaderGenerator } from "header-generator";
import { IncomingMessage, ServerResponse } from "http";
import Redis from "ioredis";
import { Browser, chromium } from "playwright";

const BROWSER_QUEUE = "browser_queue";
const BROWSER_STATUS = "browser_status";
const redis = new Redis(process.env.REDIS_URL!);

interface Headers {
  [key: string]: string;
}

interface ExecuteTaskOptions {
  url: string;
  browserId: string;
  locale?: string;
  proxy?: string;
}

interface TaskResult {
  status: number;
  html: string;
  executionTime?: string;
  headers?: Headers;
  url?: string;
}

function sanitizeHeaders(headers: Headers): Headers {
  const sanitized: Headers = {};
  for (const [key, value] of Object.entries(headers)) {
    try {
      // 创建一个模拟的 IncomingMessage 对象
      const req = Object.create(IncomingMessage.prototype);
      const testResponse = new ServerResponse(req as IncomingMessage);
      testResponse.setHeader(key, value);
      sanitized[key] = value;
    } catch (e) {
      // console.warn(`Skipping invalid header ${key}: ${value}`);
    }
  }
  return sanitized;
}

class BrowserManager {
  private static browserConnections: Map<string, Browser> = new Map();

  static async getBrowser(browserId: string): Promise<Browser> {
    if (!this.browserConnections.has(browserId)) {
      const wsEndpoint = await redis.get(`ws:${browserId}`);
      if (!wsEndpoint) {
        throw new Error(`No websocket endpoint found for browser ${browserId}`);
      }
      const containerWsEndpoint = wsEndpoint.replace("0.0.0.0", "browser-node");
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
    let browser: string | null;
    for (let i = 0; i < maxRetries; i++) {
      const browserId = await redis.lpop(BROWSER_QUEUE);
      if (!browserId) {
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
        lastHeartbeat && Date.now() - parseInt(lastHeartbeat) <= 10000;
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
        await redis.hset(BROWSER_STATUS, browserId, "busy");
        browser = browserId;
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

async function executeTask({
  url,
  browserId,
  locale = "en-US",
  proxy,
}: ExecuteTaskOptions): Promise<TaskResult> {
  const startTime = Date.now();
  const browser = await BrowserManager.getBrowser(browserId);
  try {
    const headerGenerator = new HeaderGenerator();
    const headers = headerGenerator.getHeaders({
      browsers: [
        { name: "firefox", minVersion: 80 },
        { name: "chrome", minVersion: 87 },
        "safari",
      ],
      devices: ["desktop"],
      locales: [locale],
    });

    const contextOptions: any = {
      locale,
      acceptLanguage: headers["accept-language"],
      viewport: { width: 1920, height: 1080 },
      userAgent: headers["user-agent"],
    };

    if (proxy) {
      const { password, username, protocol, host } = new URL(proxy);
      const server = `${protocol}//${host}`;
      contextOptions.proxy = { server, username, password };
    }

    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    try {
      const response = await page.goto(url, {
        waitUntil: "networkidle",
      });

      if (!response) {
        throw new Error("No response received");
      }

      await page.waitForLoadState("networkidle");

      const [status, html, recaptchaCount] = await Promise.all([
        response.status(),
        page.content(),
        page.locator("#recaptcha").count(),
      ]);

      const responseHeaders = sanitizeHeaders(response.headers());

      if (recaptchaCount > 0) {
        console.info("Recaptcha", "Try to pass");
        const iframe = page.locator('iframe[title="reCAPTCHA"]');
        const frameLocator = iframe.contentFrame();
        const checkbox = frameLocator.locator(".recaptcha-checkbox");
        console.info("checkbox count", await checkbox.count());
        if ((await checkbox.count()) > 0) {
          await checkbox.waitFor({ state: "visible" });
          await checkbox.scrollIntoViewIfNeeded();

          await checkbox.click();
          await frameLocator
            .locator(".recaptcha-checkbox-loading")
            .waitFor({ state: "visible" });
          await frameLocator
            .locator(".recaptcha-checkbox-loading")
            .waitFor({ state: "detached" });
          const imageselect = page.locator(".g-recaptcha-bubble-arrow"); // iframe #rc-imageselect
          if ((await imageselect.count()) > 0) {
            console.info("Recaptcha imageselect");
            const [html] = await Promise.all([
              frameLocator.locator("html").innerHTML(),
            ]);
            return {
              status: 429,
              html,
              headers,
              url: response.url(),
            };
          } else {
            console.info("no imageselect");
          }

          const [html, recaptchaCount] = await Promise.all([
            page.content(),
            page.locator("#recaptcha").count(),
          ]);

          const endTime = Date.now();
          const executionTime = endTime - startTime;
          console.info("Recaptcha loading count", recaptchaCount);
          return {
            status,
            html: `<!DOCTYPE html>\n\n<html>${html}</html>`,
            executionTime: `${executionTime / 1000} s`,
            headers,
            url: response.url(),
          };
        }
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      console.info(
        "executeTask status",
        status,
        "execution time:",
        executionTime / 1000,
        "s",
      );

      return {
        status,
        html,
        executionTime: `${executionTime / 1000} s`,
        headers: responseHeaders,
        url: response.url(),
      };
    } finally {
      await page.close();
      await context.close();
      console.info("page close");
      console.info("context close");
    }
  } catch (error) {
    const message = (error as Error)?.message ?? "unknown error";
    console.error(message);
    return {
      status: 500,
      html: message,
    };
  }
}

export {
  BrowserManager,
  executeTask,
  type ExecuteTaskOptions,
  type TaskResult,
};
