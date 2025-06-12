import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

async function testConnection() {
    const client = new Client({
        host: process.env.RDS_HOST,
        user: process.env.RDS_USER,
        password: process.env.RDS_PASSWORD,
        database: "postgres",
        port: 5432,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log(`Attempting to connect to ${process.env.RDS_HOST}...`);
        await client.connect();
        console.log("Connected successfully!");
        const res = await client.query('SELECT NOW()');
        console.log("Database time:", res.rows[0].now);
        await client.end();
    } catch (err) {
        console.error("Connection failed:", err);
    }
}

testConnection();