import { Request, Response } from "express";
import { BrowserManager } from "lib/browser-manager";
import { executeTask } from "lib/server";
import { fetchParamsSchema } from "zod-schema";

export const fetchTask = async (req: Request, res: Response) => {
  try {
    const { url, locale = "en-US", proxy } = fetchParamsSchema.parse(req.body);
    await BrowserManager.init();
    let status = 500;
    let html = "";
    try {
      const browser = await BrowserManager.getBrowser();

      let retry = 0;

      while (retry <= 3) {
        const result = await executeTask({
          url,
          browser,
          locale,
          proxy,
        });
        if (result.status === 429) {
          retry += 1;
          console.warn("Retry... ", retry);
          continue;
        }
        if (result.status !== 200) {
          throw new Error(`unkown error, result.status: ${result.status}`);
        }

        retry = 10;
        if (result.headers) {
          Object.entries(result.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
          });
        }

        status = result.status;
        html = result.html;
      }
    } catch (error) {
      console.error("Task execution failed:", error);
      status = 500;
      html = "Task execution failed.\n" + ((error as Error)?.message ?? "");
    }

    return res.status(status).send(html);
  } catch (error) {
    console.error(error);
    const text = "error:" + ((error as Error)?.message ?? "");
    return res.status(500).send(text);
  }
};
