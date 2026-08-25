import winston from "winston";
import path from "path";
import fs from "fs";


const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: "marketplace-api" },
  transports: [
    // Log errors to separate file
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
    }),
    // Log everything to combined file
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
    }),
  ],
});

// In development, also log to console
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] ${level}: ${message}`;
        })
      ),
    })
  );
}

export { logger };