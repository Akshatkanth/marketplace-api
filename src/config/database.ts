import "reflect-metadata";
import { DataSource } from "typeorm";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "marketplace_db",
  
  
  entities: [path.join(__dirname, "../entities/*.ts")],
  
  migrations: [path.join(__dirname, "../migrations/*.ts")],
  
  logging: process.env.NODE_ENV === "development",
  synchronize: process.env.NODE_ENV === "development",
  dropSchema: false,
});