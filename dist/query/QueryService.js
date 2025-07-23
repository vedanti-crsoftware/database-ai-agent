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
exports.QueryService = void 0;
const BedrockService_1 = require("../aws/BedrockService");
const PostgresService_1 = require("../db/PostgresService");
const jsonUtils_1 = require("../utils/jsonUtils");
const prompts_json_1 = __importDefault(require("../data/prompts.json"));
class QueryService {
    constructor() {
        this.prompts = null;
        this.bedrock = new BedrockService_1.BedrockService();
        this.postgres = new PostgresService_1.PostgresService();
        this.prompts = prompts_json_1.default;
    }
    initalize() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("trying the inialize in queryservice");
            yield this.postgres.connect();
            try {
                yield this.loadPromptsFromS3();
            }
            catch (error) {
                console.log("Could not load prompts from S3, using local prompts:", error);
                // We already initialized with local prompts, so no action needed
            }
            console.log("done inialize in queryservice");
        });
    }
    loadPromptsFromS3() {
        return __awaiter(this, void 0, void 0, function* () {
            const bucket = process.env.CONFIG_BUCKET || 'database-agent-configs';
            const key = 'data/prompts.json';
            console.log(`Attempting to load prompts from S3: ${bucket}/${key}`);
            try {
                const s3Prompts = yield jsonUtils_1.JSONLoader.loadFromS3(bucket, key);
                if (s3Prompts) {
                    this.prompts = s3Prompts;
                    console.log("Successfully loaded prompts from S3");
                }
            }
            catch (error) {
                console.error(`Failed to load prompts from S3 at ${bucket}/${key}:`, error);
            }
        });
    }
    handleSchemaAndQuery(schema, query) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("In QueryService.. handleSchemaAndQuery");
            const schemaEmbedding = yield this.bedrock.getEmbedding(schema);
            console.log("In QueryService.. this is schemaEmbedding : ", schemaEmbedding);
            yield this.postgres.storeSchemaEmbedding(schema, schemaEmbedding);
            console.log("In QueryService.. storeSchemaEmbedding Successful");
            const queryEmbedding = yield this.bedrock.getEmbedding(query);
            console.log("In QueryService.. this is queryEmbedding: ", queryEmbedding);
            const matchedSchema = yield this.postgres.findMatchingSchema(queryEmbedding);
            console.log("In QueryService.. this is matchedSchema: ", matchedSchema);
            const promptTemplate = this.prompts.prompt;
            const prompt = promptTemplate
                .replace("{{schema}}", matchedSchema)
                .replace("{{question}}", query);
            console.log("In QueryService... this is final prompt:", prompt);
            const sql = yield this.bedrock.getClaudeResponse(prompt);
            console.log("Executing generated SQL query");
            const result = yield this.postgres.executeQuery(sql);
            console.log("SQL execution complete, returning results");
            try {
                const chartRecommendation = yield this.getChartRecommendation(sql, result);
                console.log("Chart recommendation generated successfully");
                return { sql, result, chartRecommendation };
            }
            catch (error) {
                console.error("Error generating chart recommendation:", error);
                return { sql, result };
            }
        });
    }
    getChartRecommendation(sql, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const promptTemplate = this.prompts.chartRecommendationPrompt;
                const prompt = promptTemplate
                    .replace("{{sql}}", sql)
                    .replace("{{data}}", JSON.stringify(data, null, 2));
                const response = yield this.bedrock.getClaudeResponse(prompt);
                return this.extractJsonFromResponse(response);
            }
            catch (error) {
                console.error("Failed to generate chart recommendation:", error);
                throw new Error("Failed to generate chart recommendation");
            }
        });
    }
    extractJsonFromResponse(response) {
        try {
            return JSON.parse(response);
        }
        catch (e) {
            const jsonMatch = response.match(/({[\s\S]*})/);
            if (jsonMatch && jsonMatch[0]) {
                try {
                    return JSON.parse(jsonMatch[0]);
                }
                catch (err) {
                    throw new Error("Could not extract valid JSON from response");
                }
            }
            throw new Error("No valid JSON found in response");
        }
    }
}
exports.QueryService = QueryService;
