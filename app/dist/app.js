"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// app/app.ts
var app_exports = {};
__export(app_exports, {
  default: () => app_default
});
module.exports = __toCommonJS(app_exports);

// app/lib/server.ts
var import_header_generator = require("header-generator");
var import_http = require("http");
var import_ioredis = __toESM(require("ioredis"));
var import_playwright = require("playwright");
var BROWSER_QUEUE = "browser_queue";
var BROWSER_STATUS = "browser_status";
var redis = new import_ioredis.default(process.env.REDIS_URL);
function sanitizeHeaders(headers) {
  const sanitized = {};
  for (const [key, value] of Object.entries(headers)) {
    try {
      const req = Object.create(import_http.IncomingMessage.prototype);
      const testResponse = new import_http.ServerResponse(req);
      testResponse.setHeader(key, value);
      sanitized[key] = value;
    } catch (e) {
    }
  }
  return sanitized;
}
var BrowserManager = class {
  static browserConnections = /* @__PURE__ */ new Map();
  static async getBrowser(browserId) {
    if (!this.browserConnections.has(browserId)) {
      const wsEndpoint = await redis.get(`ws:${browserId}`);
      if (!wsEndpoint) {
        throw new Error(`No websocket endpoint found for browser ${browserId}`);
      }
      const containerWsEndpoint = wsEndpoint.replace("0.0.0.0", "browser-node");
      const browser = await import_playwright.chromium.connect({ wsEndpoint: containerWsEndpoint });
      this.browserConnections.set(browserId, browser);
      return browser;
    }
    return this.browserConnections.get(browserId);
  }
  static async getAvailableBrowser(maxRetries = 3, retryDelay = 1e3) {
    const processedBrowsers = /* @__PURE__ */ new Set();
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
        redis.hget(BROWSER_STATUS, browserId)
      ]);
      const isAlive = lastHeartbeat && Date.now() - parseInt(lastHeartbeat) <= 1e4;
      const isAvailable = status !== "busy";
      if (!isAlive) {
        console.warn(`Browser ${browserId} appears dead, cleaning up...`);
        await Promise.all([
          redis.del(`ws:${browserId}`),
          redis.lrem(BROWSER_QUEUE, 0, browserId),
          redis.hdel(BROWSER_STATUS, browserId),
          redis.del(`heartbeat:${browserId}`)
        ]);
        continue;
      }
      if (isAvailable) {
        await redis.hset(BROWSER_STATUS, browserId, "busy");
        return browserId;
      }
      await redis.rpush(BROWSER_QUEUE, browserId);
      if (processedBrowsers.size === await redis.llen(BROWSER_QUEUE)) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        processedBrowsers.clear();
      }
    }
    return null;
  }
  static async releaseBrowser(browserId) {
    if (!browserId) return;
    await Promise.all([
      redis.hset(BROWSER_STATUS, browserId, "idle"),
      redis.rpush(BROWSER_QUEUE, browserId)
    ]);
  }
};
async function executeTask({ url, browserId, locale = "en-US", proxy }) {
  const startTime = Date.now();
  const browser = await BrowserManager.getBrowser(browserId);
  try {
    const headerGenerator = new import_header_generator.HeaderGenerator();
    const headers = headerGenerator.getHeaders({
      browsers: [
        { name: "firefox", minVersion: 80 },
        { name: "chrome", minVersion: 87 },
        "safari"
      ],
      devices: ["desktop"],
      locales: [locale]
    });
    const contextOptions = {
      locale,
      acceptLanguage: headers["accept-language"],
      viewport: { width: 1920, height: 1080 },
      userAgent: headers["user-agent"]
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
        waitUntil: "networkidle"
      });
      if (!response) {
        throw new Error("No response received");
      }
      await page.waitForLoadState("networkidle");
      let [status, html, recaptchaCount] = await Promise.all([
        response.status(),
        page.content(),
        page.locator("#recaptcha").count()
      ]);
      const responseHeaders = sanitizeHeaders(response.headers());
      if (recaptchaCount > 0) {
      }
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      console.info("executeTask status", status, "execution time:", executionTime / 1e3, "s");
      return {
        status,
        html,
        executionTime,
        headers: responseHeaders,
        url: response.url()
      };
    } finally {
      await page.close();
      await context.close();
      console.info("page close");
      console.info("context close");
    }
  } catch (error) {
    console.error(error?.message ?? "unknown error");
    throw error;
  }
}

// app/endpoints/execute.ts
var executeJob = async (req, res) => {
  const { url, locale = "en-US", proxy } = req.body;
  if (!url) {
    return res.status(400).end();
  }
  let browserId = null;
  let status = 500;
  let html = "";
  try {
    browserId = await BrowserManager.getAvailableBrowser();
    if (!browserId) {
      return res.status(503).send("browserId not found");
    }
    const result = await executeTask({ url, browserId, locale, proxy });
    if (!result) {
      return res.status(500).send("No results");
    }
    Object.entries(result.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    status = result.status;
    html = result.html;
  } catch (error) {
    console.error("Task execution failed:", error);
    status = 500;
    html = "Task execution failed" + (error?.message ?? "");
  } finally {
    await BrowserManager.releaseBrowser(browserId);
  }
  return res.status(status).send(html);
};

// app/app.ts
var import_express = __toESM(require("express"));
var import_morgan = __toESM(require("morgan"));
var import_response_time = __toESM(require("response-time"));
var app = (0, import_express.default)();
app.use((0, import_response_time.default)());
app.use((0, import_morgan.default)("dev"));
app.use(import_express.default.json());
app.use(import_express.default.urlencoded({ extended: true }));
app.post("/execute", executeJob);
var app_default = app;
