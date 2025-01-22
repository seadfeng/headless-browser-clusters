"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
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

// node_modules/ms/index.js
var require_ms = __commonJS({
  "node_modules/ms/index.js"(exports2, module2) {
    "use strict";
    var s = 1e3;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var y = d * 365.25;
    module2.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse(val);
      } else if (type === "number" && isNaN(val) === false) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
      );
    };
    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || "ms").toLowerCase();
      switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
          return n * y;
        case "days":
        case "day":
        case "d":
          return n * d;
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
          return n * h;
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
          return n * m;
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
          return n * s;
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
          return n;
        default:
          return void 0;
      }
    }
    function fmtShort(ms) {
      if (ms >= d) {
        return Math.round(ms / d) + "d";
      }
      if (ms >= h) {
        return Math.round(ms / h) + "h";
      }
      if (ms >= m) {
        return Math.round(ms / m) + "m";
      }
      if (ms >= s) {
        return Math.round(ms / s) + "s";
      }
      return ms + "ms";
    }
    function fmtLong(ms) {
      return plural(ms, d, "day") || plural(ms, h, "hour") || plural(ms, m, "minute") || plural(ms, s, "second") || ms + " ms";
    }
    function plural(ms, n, name) {
      if (ms < n) {
        return;
      }
      if (ms < n * 1.5) {
        return Math.floor(ms / n) + " " + name;
      }
      return Math.ceil(ms / n) + " " + name + "s";
    }
  }
});

// node_modules/debug/src/debug.js
var require_debug = __commonJS({
  "node_modules/debug/src/debug.js"(exports2, module2) {
    "use strict";
    exports2 = module2.exports = createDebug.debug = createDebug["default"] = createDebug;
    exports2.coerce = coerce;
    exports2.disable = disable;
    exports2.enable = enable;
    exports2.enabled = enabled;
    exports2.humanize = require_ms();
    exports2.names = [];
    exports2.skips = [];
    exports2.formatters = {};
    var prevTime;
    function selectColor(namespace) {
      var hash = 0, i;
      for (i in namespace) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i);
        hash |= 0;
      }
      return exports2.colors[Math.abs(hash) % exports2.colors.length];
    }
    function createDebug(namespace) {
      function debug2() {
        if (!debug2.enabled) return;
        var self = debug2;
        var curr = +/* @__PURE__ */ new Date();
        var ms = curr - (prevTime || curr);
        self.diff = ms;
        self.prev = prevTime;
        self.curr = curr;
        prevTime = curr;
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        args[0] = exports2.coerce(args[0]);
        if ("string" !== typeof args[0]) {
          args.unshift("%O");
        }
        var index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
          if (match === "%%") return match;
          index++;
          var formatter = exports2.formatters[format];
          if ("function" === typeof formatter) {
            var val = args[index];
            match = formatter.call(self, val);
            args.splice(index, 1);
            index--;
          }
          return match;
        });
        exports2.formatArgs.call(self, args);
        var logFn = debug2.log || exports2.log || console.log.bind(console);
        logFn.apply(self, args);
      }
      debug2.namespace = namespace;
      debug2.enabled = exports2.enabled(namespace);
      debug2.useColors = exports2.useColors();
      debug2.color = selectColor(namespace);
      if ("function" === typeof exports2.init) {
        exports2.init(debug2);
      }
      return debug2;
    }
    function enable(namespaces) {
      exports2.save(namespaces);
      exports2.names = [];
      exports2.skips = [];
      var split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
      var len = split.length;
      for (var i = 0; i < len; i++) {
        if (!split[i]) continue;
        namespaces = split[i].replace(/\*/g, ".*?");
        if (namespaces[0] === "-") {
          exports2.skips.push(new RegExp("^" + namespaces.substr(1) + "$"));
        } else {
          exports2.names.push(new RegExp("^" + namespaces + "$"));
        }
      }
    }
    function disable() {
      exports2.enable("");
    }
    function enabled(name) {
      var i, len;
      for (i = 0, len = exports2.skips.length; i < len; i++) {
        if (exports2.skips[i].test(name)) {
          return false;
        }
      }
      for (i = 0, len = exports2.names.length; i < len; i++) {
        if (exports2.names[i].test(name)) {
          return true;
        }
      }
      return false;
    }
    function coerce(val) {
      if (val instanceof Error) return val.stack || val.message;
      return val;
    }
  }
});

// node_modules/debug/src/browser.js
var require_browser = __commonJS({
  "node_modules/debug/src/browser.js"(exports2, module2) {
    "use strict";
    exports2 = module2.exports = require_debug();
    exports2.log = log;
    exports2.formatArgs = formatArgs;
    exports2.save = save;
    exports2.load = load;
    exports2.useColors = useColors;
    exports2.storage = "undefined" != typeof chrome && "undefined" != typeof chrome.storage ? chrome.storage.local : localstorage();
    exports2.colors = [
      "lightseagreen",
      "forestgreen",
      "goldenrod",
      "dodgerblue",
      "darkorchid",
      "crimson"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && window.process.type === "renderer") {
        return true;
      }
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || // double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    exports2.formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (err) {
        return "[UnexpectedJSONParseError]: " + err.message;
      }
    };
    function formatArgs(args) {
      var useColors2 = this.useColors;
      args[0] = (useColors2 ? "%c" : "") + this.namespace + (useColors2 ? " %c" : " ") + args[0] + (useColors2 ? "%c " : " ") + "+" + exports2.humanize(this.diff);
      if (!useColors2) return;
      var c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      var index = 0;
      var lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, function(match) {
        if ("%%" === match) return;
        index++;
        if ("%c" === match) {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    function log() {
      return "object" === typeof console && console.log && Function.prototype.apply.call(console.log, console, arguments);
    }
    function save(namespaces) {
      try {
        if (null == namespaces) {
          exports2.storage.removeItem("debug");
        } else {
          exports2.storage.debug = namespaces;
        }
      } catch (e) {
      }
    }
    function load() {
      var r;
      try {
        r = exports2.storage.debug;
      } catch (e) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    exports2.enable(load());
    function localstorage() {
      try {
        return window.localStorage;
      } catch (e) {
      }
    }
  }
});

// node_modules/debug/src/node.js
var require_node = __commonJS({
  "node_modules/debug/src/node.js"(exports2, module2) {
    "use strict";
    var tty = require("tty");
    var util = require("util");
    exports2 = module2.exports = require_debug();
    exports2.init = init;
    exports2.log = log;
    exports2.formatArgs = formatArgs;
    exports2.save = save;
    exports2.load = load;
    exports2.useColors = useColors;
    exports2.colors = [6, 2, 3, 4, 5, 1];
    exports2.inspectOpts = Object.keys(process.env).filter(function(key) {
      return /^debug_/i.test(key);
    }).reduce(function(obj, key) {
      var prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, function(_, k) {
        return k.toUpperCase();
      });
      var val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) val = true;
      else if (/^(no|off|false|disabled)$/i.test(val)) val = false;
      else if (val === "null") val = null;
      else val = Number(val);
      obj[prop] = val;
      return obj;
    }, {});
    var fd = parseInt(process.env.DEBUG_FD, 10) || 2;
    if (1 !== fd && 2 !== fd) {
      util.deprecate(function() {
      }, "except for stderr(2) and stdout(1), any other usage of DEBUG_FD is deprecated. Override debug.log if you want to use a different log function (https://git.io/debug_fd)")();
    }
    var stream = 1 === fd ? process.stdout : 2 === fd ? process.stderr : createWritableStdioStream(fd);
    function useColors() {
      return "colors" in exports2.inspectOpts ? Boolean(exports2.inspectOpts.colors) : tty.isatty(fd);
    }
    exports2.formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts).split("\n").map(function(str) {
        return str.trim();
      }).join(" ");
    };
    exports2.formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts);
    };
    function formatArgs(args) {
      var name = this.namespace;
      var useColors2 = this.useColors;
      if (useColors2) {
        var c = this.color;
        var prefix = "  \x1B[3" + c + ";1m" + name + " \x1B[0m";
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push("\x1B[3" + c + "m+" + exports2.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = (/* @__PURE__ */ new Date()).toUTCString() + " " + name + " " + args[0];
      }
    }
    function log() {
      return stream.write(util.format.apply(util, arguments) + "\n");
    }
    function save(namespaces) {
      if (null == namespaces) {
        delete process.env.DEBUG;
      } else {
        process.env.DEBUG = namespaces;
      }
    }
    function load() {
      return process.env.DEBUG;
    }
    function createWritableStdioStream(fd2) {
      var stream2;
      var tty_wrap = process.binding("tty_wrap");
      switch (tty_wrap.guessHandleType(fd2)) {
        case "TTY":
          stream2 = new tty.WriteStream(fd2);
          stream2._type = "tty";
          if (stream2._handle && stream2._handle.unref) {
            stream2._handle.unref();
          }
          break;
        case "FILE":
          var fs = require("fs");
          stream2 = new fs.SyncWriteStream(fd2, { autoClose: false });
          stream2._type = "fs";
          break;
        case "PIPE":
        case "TCP":
          var net = require("net");
          stream2 = new net.Socket({
            fd: fd2,
            readable: false,
            writable: true
          });
          stream2.readable = false;
          stream2.read = null;
          stream2._type = "pipe";
          if (stream2._handle && stream2._handle.unref) {
            stream2._handle.unref();
          }
          break;
        default:
          throw new Error("Implement me. Unknown stream file type!");
      }
      stream2.fd = fd2;
      stream2._isStdio = true;
      return stream2;
    }
    function init(debug2) {
      debug2.inspectOpts = {};
      var keys = Object.keys(exports2.inspectOpts);
      for (var i = 0; i < keys.length; i++) {
        debug2.inspectOpts[keys[i]] = exports2.inspectOpts[keys[i]];
      }
    }
    exports2.enable(load());
  }
});

// node_modules/debug/src/index.js
var require_src = __commonJS({
  "node_modules/debug/src/index.js"(exports2, module2) {
    "use strict";
    if (typeof process !== "undefined" && process.type === "renderer") {
      module2.exports = require_browser();
    } else {
      module2.exports = require_node();
    }
  }
});

// app/index.ts
var import_debug = __toESM(require_src());
var import_dotenv = __toESM(require("dotenv"));
var import_http2 = __toESM(require("http"));

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
      const { password, username, protocol, host: host2 } = new URL(proxy);
      const server2 = `${protocol}//${host2}`;
      contextOptions.proxy = { server: server2, username, password };
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

// app/index.ts
import_dotenv.default.config();
var serverDebug = (0, import_debug.default)("starter:server");
var serverStarted = false;
var DEFAULT_PORT = 3e3;
var port = normalizePort(process.env.PORT || DEFAULT_PORT.toString());
var host = process.env.HOST || "0.0.0.0";
app_default.set("port", port);
app_default.set("host", host);
var server = import_http2.default.createServer(app_default);
startServer(port);
function startServer(port2) {
  server.listen(port2);
  server.on("error", (error) => onError(error, port2));
  server.on("listening", onListening);
}
function normalizePort(val) {
  const parsedPort = parseInt(val, 10);
  if (isNaN(parsedPort)) {
    return val;
  }
  if (parsedPort >= 0) {
    return parsedPort;
  }
  return false;
}
function onError(error, port2) {
  if (error.syscall !== "listen") {
    throw error;
  }
  const bind = typeof port2 === "string" ? "Pipe " + port2 : "Port " + port2;
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      const nextPort = (typeof port2 === "number" ? port2 : parseInt(port2)) + 1;
      console.log(`Port ${port2} is in use, attempting to use next port: ${nextPort}`);
      startServer(nextPort);
      break;
    default:
      throw error;
  }
}
function onListening() {
  if (!serverStarted) {
    serverStarted = true;
    const addr = server.address();
    if (addr && typeof addr === "object") {
      const bind = "port " + addr.port;
      const url = `http://127.0.0.1:${addr.port}`;
      console.log(`Listening on ${bind}`);
      console.info(`Server running at ${url}`);
      serverDebug("Listening on " + bind);
    }
  }
}
