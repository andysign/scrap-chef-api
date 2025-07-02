const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(':memory:');

const createSchemas = () => {
  db.serialize(function () {
    db.run(`
      CREATE TABLE production_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year INTEGER,
        month INTEGER,
        grade TEXT,
        batches INTEGER
      );
      CREATE TABLE grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        grade TEXT NOT NULL,
        group_name TEXT NOT NULL
      );
    `);
  });
};

module.exports = { db, createSchemas };
