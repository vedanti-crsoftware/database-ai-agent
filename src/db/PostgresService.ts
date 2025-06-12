import {Client} from "pg";
import dotenv from "dotenv";
dotenv.config();

export class PostgresService {
    private client: Client;

    constructor() {
        this.client = new Client({
            host: process.env.RDS_HOST,
        user: process.env.RDS_USER,
        password: process.env.RDS_PASSWORD,
        database: process.env.RDS_DB || "postgres",
        port: parseInt(process.env.RDS_PORT || "5432"),
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 100000,
        });
    }

    async connect() {
        console.log("trying pgclient connect");
        await this.client.connect();
        console.log("connected to db");
        await this.client.query('CREATE EXTENSION IF NOT EXISTS vector');
        console.log("added extension");
        await this.client.query(`
            Create TABLE IF NOT EXISTS schema_embeddings (
                id SERIAL PRIMARY KEY,
                schema_text TEXT,
                embedding vector(1024)
            );
        `);
        console.log("created schema embedding table");
    }

    async storeSchemaEmbedding(schemaText: string, embedding: number[]) {
        console.log("this is storeSchemaEmbedding");
        console.log("this is schemaText: ", schemaText);
        console.log("schemaText length",schemaText.length);
        console.log("this is type of schemaText",typeof(schemaText));
    
        const vectorLiteral = embedding.join(",");
        await this.client.query(
                    `INSERT INTO schema_embeddings (schema_text, embedding) VALUES ($1, $2::vector)`,
                    [schemaText, vectorLiteral]
                );
    }

    async findMatchingSchema(queryEmbedding: number[]): Promise<string> {
        const formatted = queryEmbedding.join(",");
        const result = await this.client.query(
             "SELECT schema_text FROM schema_embeddings ORDER BY embedding <-> $1::vector LIMIT 1;",
            [formatted]
        );
        return result.rows[0]?.schema_text || "";
    }

}