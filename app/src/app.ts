import { fetchTask } from "endpoints/v1/fetch";
import { fetchTaskDev } from "endpoints/v1/fetch-dev";
import express, { Application } from "express";
import { authByApiKey } from "middleware";
import logger from "morgan";
import responseTime from "response-time";

const app: Application = express();

app.use(responseTime());
app.use(logger("dev"));
app.use(authByApiKey);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/api/v1/fetch", fetchTask);
if (process.env.NODE_ENV !== "production") {
  app.post("/api/v1/fetch-dev", fetchTaskDev);
}

export default app;
