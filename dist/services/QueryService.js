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
const prompts_json_1 = __importDefault(require("../prompts/prompts.json"));
class QueryService {
    constructor() {
        this.bedrock = new BedrockService_1.BedrockService();
        this.postgres = new PostgresService_1.PostgresService();
    }
    initalize() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("trying the inialize in queryservice");
            yield this.postgres.connect();
            console.log("done inialize in queryservice");
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
            const promptTemplate = prompts_json_1.default.generateSQL;
            const prompt = promptTemplate
                .replace("{{schema}}", matchedSchema)
                .replace("{{question}}", query);
            console.log("In QueryService... this is final prompt:", prompt);
            const sql = yield this.bedrock.getClaudeResponse(prompt);
            return sql;
        });
    }
}
exports.QueryService = QueryService;
