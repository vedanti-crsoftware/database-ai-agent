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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSQLFromQuery = generateSQLFromQuery;
const bedrockClient_1 = require("../aws/bedrockClient");
const pg_1 = require("../db/pg");
const claudeClient_1 = require("../aws/claudeClient");
function generateSQLFromQuery(naturalQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const queryEmbedding = yield (0, bedrockClient_1.getTitanEmbedding)(naturalQuery);
        const result = yield pg_1.pgClient.query(`
        SELECT schema_text FROM schema_embeddings ORDER BY embedding <-> $1 LIMIT 1;`, [queryEmbedding]);
        const matchedSchema = (_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.schema_text;
        const prompt = `Your are an expert SQL assistant. Given the following table schema:
        ${matchedSchema}
        Generate SQL for: "${naturalQuery}`;
        const generatedSQL = yield (0, claudeClient_1.getClaudeResponse)(prompt);
        return generatedSQL;
    });
}
