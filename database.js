const sqlite3 = require('sqlite3').verbose();

// Create and/or open the database
const db = new sqlite3.Database('./data.db', (err) => {
	if (err) {
		console.error('Could not connect to database', err);
	} else {
		console.log('Connected to database');
	}
});

// Create a table if it doesn't exist
db.serialize(() => {
	db.run(`
    CREATE TABLE IF NOT EXISTS "products" (
	"id"	TEXT NOT NULL UNIQUE,
	"name"	TEXT NOT NULL,
	"description"	TEXT,
	"tel"	TEXT,
	"echange_type"	TEXT NOT NULL,
	"echange_contre"	TEXT NOT NULL,
	"category"	TEXT NOT NULL,
	"image"	TEXT NOT NULL,
	"owner"	TEXT NOT NULL,
	"date_creation"	date NOT NULL,
	"status"	TEXT NOT NULL DEFAULT 'AVAILABLE',
	PRIMARY KEY("id")
);
  `);
	db.run(`
    CREATE TABLE IF NOT EXISTS "users" (
	"username"	TEXT NOT NULL,
	"password"	TEXT NOT NULL,
	"email"	TEXT NOT NULL UNIQUE,
	"tel"	TEXT NOT NULL,
	PRIMARY KEY("username")
);
  `);
	db.run(`
    CREATE TABLE IF NOT EXISTS "admin" (
	"user"	TEXT NOT NULL,
    "priority"	TEXT NOT NULL DEFAULT 'admin',
	FOREIGN KEY("user") REFERENCES "users"("username")
);`)
});

module.exports = db;
