import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.set("trust proxy", 1);
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const candidate = error as { type?: unknown; status?: unknown; name?: unknown };
    if (candidate.type === "entity.too.large" || candidate.status === 413) {
      res.status(413).json({ error: "Request is too large. Reduce the selected document text and retry." });
      return;
    }
    if (candidate instanceof SyntaxError || candidate.status === 400) {
      res.status(400).json({ error: "Request body is not valid JSON." });
      return;
    }
    logger.error(
      { errorName: typeof candidate.name === "string" ? candidate.name : "UnknownError" },
      "Unhandled API request error",
    );
    res.status(500).json({ error: "The server could not complete this request." });
  },
);

export default app;
