import "reflect-metadata";
import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { AppDataSource } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";
import routes from "./routes";
import { logger } from "./utils/logger";
import authRoutes from './routes/authRoutes';
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes';

dotenv.config();

const app : Express = express();
const PORT = process.env.PORT || 3000;


//security middleware - adds security headers
app.use(helmet());

//CORS middleware - allows request from other domains
app.use(
  cors({
    origin: process.env.APP_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

//db
AppDataSource.initialize()
  .then(() => {
    logger.info("✅ Database connected successfully");


    app.use("/api", routes);

    app.get("/", (_req: Request, res: Response) => {
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