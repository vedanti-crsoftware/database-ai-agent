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
        console.log("hey we are in generatesql query");
        const formattedEmbedding = `[${queryEmbedding.join(",")}]`;
        try {
            console.log("this is the try for vector similarity search");
            const result = yield pg_1.pgClient.query("SELECT schema_text FROM schema_embeddings ORDER BY embedding <-> $1::vector LIMIT 1;", [formattedEmbedding]);
            console.log("this is the try after pgclient query for vector similarity search");
            const matchedSchema = (_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.schema_text;
            console.log("this is matchedSchema", matchedSchema);
            const prompt = `Considering the schema provided: ${matchedSchema}. \n\nAnswer the following question using SQL: Question: "${naturalQuery}" . Your SQL query should retrieve the requested information without any additional characters or spaces. Remove any delimiter if present like \\n or newline character. Please ensure the query is formatted correctly and only includes the necessary components. End with semicolon`;
            console.log("this is before calling the getClaudeResponse");
            const generatedSQL = yield (0, claudeClient_1.getClaudeResponse)(prompt);
            console.log("this is after calling the getClaudeResponse");
            return generatedSQL;
        }
        catch (error) {
            console.log("we got error in generateSQLQuery ->", error);
            return "Error !!!!!";
        }
    });
}
