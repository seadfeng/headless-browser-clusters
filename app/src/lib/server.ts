import { HeaderGenerator } from "header-generator";
import { IncomingMessage, ServerResponse } from "http";
import { Browser, BrowserContextOptions, Cookie } from "playwright";
import { googleRecaptcha } from "./google";

interface Headers {
  [key: string]: string;
}

interface ExecuteTaskOptions {
  url: string;
  browser: Browser;
  locale?: string;
  proxy?: string;
}

interface TaskResult {
  status: number;
  html: string;
  cookies?: Cookie[];
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
      const ignoredHeaders = ["content-encoding", "transfer-encoding"];

      if (!ignoredHeaders.includes(key)) {
        sanitized[key] = value;
      }
    } catch (e) {
      // console.warn(`Skipping invalid header ${key}: ${value}`);
    }
  }
  return sanitized;
}

async function executeTask({
  url,
  browser,
  locale = "en-US",
  proxy,
}: ExecuteTaskOptions): Promise<TaskResult> {
  const startTime = Date.now();
  try {
    const headerGenerator = new HeaderGenerator();
    const headers = headerGenerator.getHeaders({
      operatingSystems: ["macos"],
      browsers: [
        { name: "firefox", minVersion: 80 },
        { name: "chrome", minVersion: 87 },
        "safari",
      ],
      devices: ["desktop"],
      locales: [locale],
    });

    const contextOptions: BrowserContextOptions = {
      locale,
      viewport: { width: 1920, height: 1080 },
      // deviceScaleFactor: 1,
      userAgent: headers["user-agent"],
    };

    if (proxy) {
      const { password, username, protocol, host } = new URL(proxy);
      const server = `${protocol}//${host}`;
      contextOptions.proxy = { server };
      if (username)
        contextOptions.proxy.username = decodeURIComponent(username);
      if (password)
        contextOptions.proxy.password = decodeURIComponent(password);
    }

    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();
    // await needBlocked(page);
    // await navigationBlocked(page);

    try {
      const response = await page.goto(url, {
        waitUntil: "networkidle",
      });

      if (!response) {
        throw new Error("No response received");
      }

      const [status, html, recaptchaCount] = await Promise.all([
        response.status(),
        page.content(),
        page.locator("#recaptcha").count(),
      ]);

      const responseHeaders = sanitizeHeaders(response.headers());
      const cookies = await context.cookies();

      if (recaptchaCount > 0 && (await googleRecaptcha(page))) {
        const [html] = await Promise.all([page.content()]);

        const endTime = Date.now();
        const executionTime = endTime - startTime;
        return {
          status,
          html: `<!DOCTYPE html>\n\n<html>${html}</html>`,
          executionTime: `${executionTime / 1000} s`,
          url: page.url(),
          cookies,
          headers,
        };
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
        cookies,
        url: page.url(),
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

export { executeTask, type ExecuteTaskOptions, type TaskResult };
