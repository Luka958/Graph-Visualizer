const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./gv.db', (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

const sql_create_user = `CREATE TABLE IF NOT EXISTS "user" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    company TEXT,
    date_of_birth DATE NOT NULL,
    country TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
)`;

const sql_create_sessions = `CREATE TABLE IF NOT EXISTS session (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expire TIMESTAMP NOT NULL
)`;

const sql_create_properties = `CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY,
    vertex TEXT NOT NULL,
    edge TEXT NOT NULL,
    canvas TEXT NOT NULL
)`;

const sql_create_indexes = [
    `CREATE INDEX IF NOT EXISTS IDX_session_expire ON session(expire)`
];

// SQL to insert an admin user
const sql_insert_admin = `INSERT INTO "user" (username, email, first_name, last_name, date_of_birth, country, company, password, role)
VALUES ('admin', 'admin@example.com', 'Admin', 'User', '2000-01-01', 'Country', 'Company', '$2b$07$djohVHx7pcPYV/9Yg1gqwOpClpkjVu4AKykQ1Uqigj.bjgSjskFX2', 'admin')`;

async function createTablesAndIndexes() {
    const createTableStatements = [sql_create_user, sql_create_sessions, sql_create_properties];
    for (const statement of createTableStatements) {
        await new Promise((resolve, reject) => {
            db.run(statement, function(err) {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    console.log("Tables created successfully.");

    for (const indexSQL of sql_create_indexes) {
        await new Promise((resolve, reject) => {
            db.run(indexSQL, function(err) {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log("Index created successfully.");
    }

    // Insert the admin user
    await new Promise((resolve, reject) => {
        db.run(sql_insert_admin, function(err) {
            if (err) reject(err);
            else {
                console.log("Admin user created successfully.");
                resolve();
            }
        });
    });
}

createTablesAndIndexes().then(() => {
    console.log("All tables, indexes, and the admin user created successfully.");
    db.close();
}).catch((err) => {
    console.error(err);
    db.close();
});
