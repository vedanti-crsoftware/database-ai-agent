import {Client} from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pgClient = new Client({
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

export async function connectDB() {
    
    try {
        console.log("trying pgclient connect");
        await pgClient.connect();
        console.log("connected to db");
        await pgClient.query('CREATE EXTENSION IF NOT EXISTS vector');
        console.log("adding extension");
        await pgClient.query(`
            Create TABLE IF NOT EXISTS schema_embeddings (
            id SERIAL PRIMARY KEY,
            schema_text TEXT,
            embedding vector(1024)
            );
        `);
        console.log("created schema embedding table");
    } catch (error) {
        console.log("in catch of connectDB");
        console.log(error);
    }
}