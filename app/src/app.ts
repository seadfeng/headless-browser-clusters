import { fetchTask } from "endpoints/v1/fetch";
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

export default app;
