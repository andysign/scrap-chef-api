const express = require('express');
const { db, createSchema } = require('./db');
const parse = require('csv-parse/lib/sync');

const app = express();
app.use(express.json());

const initialProductionData = `
Year 	, Month 	, Grade   	, Batches 	
2024 	, 6     	, B500A   	, 119     	
2024 	, 6     	, A36     	, 9       	
2024 	, 6     	, C35     	, 4       	
2024 	, 6     	, A53/A53 	, 4       	
2024 	, 7     	, B500A   	, 119     	
2024 	, 7     	, A36     	, 9       	
2024 	, 7     	, C35     	, 4       	
2024 	, 7     	, A53/A53 	, 4       	
2024 	, 8     	, B500A   	, 1       	
2024 	, 8     	, A36     	, 5       	
2024 	, 8     	, C35     	, 3       	
2024 	, 8     	, A53/A53 	, 5       	
`;

createSchema();

// Helper function to insert data into database
const insertIntoDatabase = (dataArray) => {
  db.serialize(function () {
    db.run('BEGIN TRANSACTION;');

    // Create the prepared statement (the pre-compiled SQL query)
    const stmt = db.prepare('INSERT INTO batches (year, month, grade, batches) VALUES (?, ?, ?, ?)');

    dataArray.forEach((row) => stmt.run(row.year, row.month, row.grade, row.batches));

    stmt.finalize(); // CleanUp
    db.run('COMMIT;');
    console.log('Database initialized with sample data');
  });
};

// Init database with default sample data
const initDatabase = () => {
  try {
    const records = parse(initialProductionData, {
        columns: header => header.map(col => col.trim()),
        skip_empty_lines: true,
        cast: value => value.trim()
    });
    console.log(records);
    const dataArray = records.map(row => ({
      year: parseInt(row.Year),
      month: parseInt(row.Month),
      grade: row.Grade,
      batches: parseInt(row.Batches)
    }));

    console.log('CSV parsed into array:', dataArray.length, 'records');
    insertIntoDatabase(dataArray);
  } catch (error) {
    console.error('Error parsing CSV:', error);
  }
};

initDatabase();

const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
