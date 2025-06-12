"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pgClient = void 0;
exports.connectDB = connectDB;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.pgClient = new pg_1.Client({
    host: process.env.RDS_HOST,
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DB || "postgres",
    port: parseInt(process.env.RDS_PORT || "5432"),
    ssl: {
        rejectUnauthorized: false // For development; use true with proper certs in production
    },
    connectionTimeoutMillis: 100000,
});
function connectDB() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("trying pgclient connect");
            yield exports.pgClient.connect();
            console.log("connected to db");
            yield exports.pgClient.query('CREATE EXTENSION IF NOT EXISTS vector');
            console.log("adding extension");
            yield exports.pgClient.query(`
            Create TABLE IF NOT EXISTS schema_embeddings (
            id SERIAL PRIMARY KEY,
            schema_text TEXT,
            embedding vector(1536)
            );
        `);
            console.log("created schema embedding table");
        }
        catch (error) {
            console.log("in catch of connectDB");
            console.log(error);
        }
    });
}
