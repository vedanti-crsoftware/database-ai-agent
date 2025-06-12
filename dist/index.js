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
const pg_1 = require("./db/pg");
const storeSchema_1 = require("./schema/storeSchema");
const generateSQL_1 = require("./query/generateSQL");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, pg_1.connectDB)();
        console.log("Connected to DB");
        const schema = `
            Create TABLE users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100),
            age INT,
            email TEXT
            );
        `;
        yield (0, storeSchema_1.storeSchemaEmbedding)(schema);
        const query = "Get names of all users older than 30";
        const sql = yield (0, generateSQL_1.generateSQLFromQuery)(query);
        console.log("Generated SQL:", sql);
    });
}
main();
