import { connectDB } from "./db/pg";
import { storeSchemaEmbedding } from "./schema/storeSchema";
import { generateSQLFromQuery } from "./query/generateSQL";

async function main() {
    await connectDB();
    console.log("Connected to DB");
    const schema = `
           CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone_number VARCHAR(20),
    hire_date DATE NOT NULL,
    termination_date DATE CHECK (termination_date IS NULL OR termination_date > hire_date),
    job_title VARCHAR(100) NOT NULL,
    department_id INT REFERENCES departments(department_id),
    manager_id INT REFERENCES employees(employee_id),
    salary DECIMAL(12, 2) CHECK (salary >= 0),
    bonus_percentage DECIMAL(5, 2) DEFAULT 0.00,
    performance_rating DECIMAL(3, 2) CHECK (performance_rating BETWEEN 1.00 AND 5.00),
    weekly_hours INT DEFAULT 40 CHECK (weekly_hours BETWEEN 0 AND 168),
    vacation_days_remaining DECIMAL(5, 1) DEFAULT 21.0,
    address_line1 VARCHAR(100),
    address_line2 VARCHAR(100),
    city VARCHAR(50),
    state_province VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50),
    birth_date DATE CHECK (birth_date < hire_date),
    gender CHAR(1) CHECK (gender IN ('M', 'F', 'O', 'U')),
    marital_status VARCHAR(20),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    is_remote_worker BOOLEAN DEFAULT FALSE,
    last_promotion_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT age_check CHECK (EXTRACT(YEAR FROM AGE(hire_date, birth_date)) >= 18)
);

CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_hire_date ON employees(hire_date);
        `;

    await storeSchemaEmbedding(schema);
    console.log("store schemaembeddings successful");

    const query = "What percentage of employees in each department work remotely, grouped by country and state, where the department size exceeds 15 people?";

    const sql = await generateSQLFromQuery(query);
    console.log("This is the Schema :", schema);
    console.log("This is the natural language query :", query);
    console.log("\nGenerated SQL successfully !\n");
    console.log("Generated SQL:");
    console.log(sql);
    return;
}
main();
