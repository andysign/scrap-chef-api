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
    `);
  });
};

module.exports = { db, createSchema: createSchemas };
