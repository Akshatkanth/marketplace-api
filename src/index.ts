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