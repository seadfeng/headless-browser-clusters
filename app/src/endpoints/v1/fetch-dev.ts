import { Request, Response } from "express";
import { executeTask } from "lib/server";
import { chromium } from "playwright";
import { fetchParamsSchema } from "zod-schema";

export const fetchTaskDev = async (req: Request, res: Response) => {
  try {
    const { url, locale = "en-US", proxy } = fetchParamsSchema.parse(req.body);
    let status = 500;
    let html = "";
    const browser = await chromium.launch({
      args: [
        "--no-sandbox", // Disable sandbox for container environments
        "--disable-setuid-sandbox", // Disable setuid sandbox
        "--disable-dev-shm-usage", // Overcome limited shared memory in containers
        "--disable-gpu", // Disable GPU hardware acceleration

        // Anti-detection settings
        "--disable-blink-features=AutomationControlled", // Hide automation flags
        // '--disable-features=IsolateOrigins,site-per-process', // Disable site isolation

        // Additional performance tweaks
        "--disable-web-security", // Disable web security for testing
        "--disable-notifications", // Disable browser notifications
        "--ignore-certificate-errors", // Ignore SSL/TLS errors
        "--window-size=1920,1080", // Set standard window size
      ],
      headless: false, // Run in headless mode
    });
    try {
      const result = await executeTask({ url, browser, locale, proxy });

      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }

      status = result.status;
      html = result.html;
    } catch (error) {
      console.error("Task execution failed:", error);
      status = 500;
      html = "Task execution failed" + ((error as Error)?.message ?? "");
    } finally {
      console.info("browser close");
      await browser.close();
    }
    return res.status(status).send(html);
  } catch (error) {
    console.error(error);
    const text = "error:" + ((error as Error)?.message ?? "");
    return res.status(500).send(text);
  }
};
