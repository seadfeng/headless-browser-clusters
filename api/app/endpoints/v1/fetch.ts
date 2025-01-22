import { Request, Response } from "express";
import { BrowserManager, executeTask } from "lib/server";
import { fetchParamsSchema } from "zod";

export const fetchTask = async (req: Request, res: Response) => {
  try {
    const { url, locale = "en-US", proxy } = fetchParamsSchema.parse(req.body);

    let browserId: string | null = null;
    let status = 500;
    let html = "";

    try {
      browserId = await BrowserManager.getAvailableBrowser();
      if (!browserId) {
        return res.status(503).send("browserId not found");
      }

      const result = await executeTask({ url, browserId, locale, proxy });

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
      await BrowserManager.releaseBrowser(browserId);
    }

    return res.status(status).send(html);
  } catch (error) {
    console.error(error);
    const text = "error:" + ((error as Error)?.message ?? "");
    return res.status(500).send(text);
  }
};
