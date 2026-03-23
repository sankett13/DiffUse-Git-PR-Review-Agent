import express from "express";
import type { Request, Response, Application, NextFunction } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import { globalErrorHandler } from "./middlewares/errorHandler.js";
import { NotFound } from "./utils/appError.js";
import githubRoutes from "./routes/github.routes.js";
import { authMiddleware } from "./middlewares/auth.middleware.js";


const app: Application = express();

//Default middlewares
app.use(cors());
app.use(express.json());

// Routes
import oauthRoutes from "./routes/oauth.routes.js";
import "./config/passport.js"; // Initialize passport strategies

app.use("/api/auth", authRoutes);
app.use("/api/auth", oauthRoutes);
app.use("/api/github", authMiddleware, githubRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, World!");
});

app.all("/*path", (req: Request, res: Response, next: NextFunction) => {
  throw NotFound(
    `Cannot find ${req.method} ${req.originalUrl} on this server!`,
  );
});

// Global error handler (must be the last middleware)
app.use(globalErrorHandler);

export default app;
