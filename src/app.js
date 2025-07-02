const express = require('express');
const { db, createSchemas } = require('./db');
const { parseCsv } = require('./utils');

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

const initialGroupsData = `
Grade    	, Group 	
B500A    	, Rebar 	
A36      	, MBQ   	
C35      	, SBQ   	
C40      	, SBQ   	
A53/A543 	, CHQ   	
`;

// Helper function to insert default data into production table
const insertDefIntoProductionDatabase = (dataArray) => {
  db.serialize(function () {
    db.run('BEGIN TRANSACTION;');

    // Create the prepared statement (the pre-compiled SQL query)
    const stmt = db.prepare('INSERT INTO production_data (year, month, grade, batches) VALUES (?, ?, ?, ?)');

    dataArray.forEach((row) => stmt.run(row.year, row.month, row.grade, row.batches));

    stmt.finalize(); // CleanUp
    db.run('COMMIT;');
  });
};

// Helper function to insert default data into groups table
const insertIntoGroupsDatabase = (dataArray) => {
  db.serialize(function () {
    db.run('BEGIN TRANSACTION;');

    // Create the prepared statement (the pre-compiled SQL query)
    const stmt = db.prepare('INSERT INTO groups_data (grade, group_name) VALUES (?, ?)');

    dataArray.forEach((row) => stmt.run(row.grade, row.groupName));

    stmt.finalize(); // CleanUp
    db.run('COMMIT;');
  });
}

// Init default sample data into the production_data table and groups_data table
const initDatabase = () => {
  try {
    const recordsProduction = parseCsv(initialProductionData);
    const productionDataArray = recordsProduction.map(row => ({
      year: parseInt(row.Year),
      month: parseInt(row.Month),
      grade: row.Grade,
      batches: parseInt(row.Batches)
    }));

    insertDefIntoProductionDatabase(productionDataArray);
    console.log('Inserted into the DB:', productionDataArray.length, 'records');

    const recordsGroups = parseCsv(initialGroupsData);
    const groupsDataArray = recordsGroups.map(row => ({
      grade: row.Grade,
      groupName: row.Group
    }));
    insertIntoGroupsDatabase(groupsDataArray);
    console.log('Inserted into the DB:', groupsDataArray.length, 'records');

  } catch (error) {
    console.error('Error parsing CSV:', error);
  }
};

// Helper function to get all table names
const listTables = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map(row => row.name));
      }
    });
  });
};

createSchemas();

initDatabase();

app.get('/prod/data', (req, res) => {
  const sql = `
    SELECT
        pd.year, pd.month, gd.group_name, pd.grade, pd.batches
    FROM
        production_data pd
    INNER JOIN
        groups_data gd ON pd.grade = gd.grade;
    `;
  db.all(sql, function (err, rows) {
    if (err) {
      res.status(500).send({ message: 'Error fetching batches' });
    } else {
      res.send(rows);
    }
  });
});

app.get('/list/tables', (req, res) => {
  listTables().then((l) => {
    res.send(l);
  }).catch((error) => {
    console.error('Error initializing database:', error);
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
