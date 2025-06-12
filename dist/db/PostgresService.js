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
exports.PostgresService = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class PostgresService {
    constructor() {
        this.client = new pg_1.Client({
            host: process.env.RDS_HOST,
            user: process.env.RDS_USER,
            password: process.env.RDS_PASSWORD,
            database: process.env.RDS_DB || "postgres",
            port: parseInt(process.env.RDS_PORT || "5432"),
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 100000,
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("trying pgclient connect");
            yield this.client.connect();
            console.log("connected to db");
            yield this.client.query('CREATE EXTENSION IF NOT EXISTS vector');
            console.log("added extension");
            yield this.client.query(`
            Create TABLE IF NOT EXISTS schema_embeddings (
                id SERIAL PRIMARY KEY,
                schema_text TEXT,
                embedding vector(1024)
            );
        `);
            console.log("created schema embedding table");
        });
    }
    storeSchemaEmbedding(schemaText, embedding) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("this is storeSchemaEmbedding");
            console.log("this is schemaText: ", schemaText);
            console.log("schemaText length", schemaText.length);
            console.log("this is type of schemaText", typeof (schemaText));
            const vectorLiteral = embedding.join(",");
            yield this.client.query(`INSERT INTO schema_embeddings (schema_text, embedding) VALUES ($1, $2::vector)`, [schemaText, vectorLiteral]);
        });
    }
    findMatchingSchema(queryEmbedding) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const formatted = queryEmbedding.join(",");
            const result = yield this.client.query("SELECT schema_text FROM schema_embeddings ORDER BY embedding <-> $1::vector LIMIT 1;", [formatted]);
            return ((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.schema_text) || "";
        });
    }
}
exports.PostgresService = PostgresService;
