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
exports.storeSchemaEmbedding = storeSchemaEmbedding;
const bedrockClient_1 = require("../aws/bedrockClient");
const pg_1 = require("../db/pg");
function storeSchemaEmbedding(schemaText) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("this is storeSchemaEmbedding");
        console.log("this is schemaText: ", schemaText);
        console.log("schemaText length", schemaText.length);
        console.log("this is type of schemaText", typeof (schemaText));
        const embedding = yield (0, bedrockClient_1.getTitanEmbedding)(schemaText);
        // console.log("this is embedding: ",embedding);
        // console.log("isArray?", Array.isArray(embedding));
        // console.log("embedding length",embedding.length);
        // console.log("type of embedding[0]",typeof embedding[0]);
        //console.log("embedding slice: ",embedding.slice(0,5));
        if (!Array.isArray(embedding) || typeof embedding[0] !== "number") {
            throw new Error("Embedding must be array of numbers");
        }
        const vectorLiteral = `[${embedding.join(',')}]`;
        //  console.log("this is vectorLiteral: ",vectorLiteral);
        //console.log("in try... pgClient.query");
        yield pg_1.pgClient.query(`INSERT INTO schema_embeddings (schema_text, embedding) VALUES ($1, $2::vector)`, [schemaText, vectorLiteral]);
        console.log("after try... pgClient.query");
    });
}
