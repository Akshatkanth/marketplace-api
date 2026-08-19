import "reflect-metadata"
import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet"
import dotenv from "dotenv"
import { AppDataSource } from "./config/database";
import { errorHandler } from "./middleware/errorHandler"
import { logger } from "./utils/logger"

dotenv.config();

const app : Express = express();
const PORT = process.env.PORT || 3000;


//security middleware - adds security headers
app.use(helmet());

//CORS middleware - allows request from other domains
app.use(cors({
    origin: process.env.APP_URL || "http://localhost:3000",
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({extended: true}))

AppDataSource.initialize()
  .then(() => {
    logger.info("✅ Database connected successfully");
    app.get("/", (req: Request, res: Response) => {
      res.json({
        message: "Welcome to Marketplace API",
        version: "1.0.0",
      });
    });


app.use(errorHandler);

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    logger.error("❌ Database connection failed:", error);
    process.exit(1);
  });