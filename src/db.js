const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(':memory:');

const createSchema = () => {
  db.serialize(function () {
    db.run(`
      CREATE TABLE batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year INTEGER,
        month INTEGER,
        grade TEXT,
        batches INTEGER
      );
    `);
  });
};

module.exports = { db, createSchema };
