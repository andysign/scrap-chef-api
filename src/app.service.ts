import { Injectable, Inject } from "@nestjs/common";
import { Database } from "sqlite3";
import * as parse from "csv-parse/lib/sync";

// class ProductionDataDto {
//   year: number;
//   month: number;
//   grade: string;
//   batches: number;
// }

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

@Injectable()
export class AppService {
  constructor(@Inject("DATABASE_CONNECTION") private db: Database) {
    this.initDatabase();
  }

  private parseCsv(data: string): any[] {
    return parse(data, {
      columns: (header) => header.map((col) => col.trim()),
      skip_empty_lines: true,
      cast: (value) => value.trim(),
    });
  }

  private insertDefIntoProductionDatabase(dataArray: any[]) {
    this.db.serialize(() => {
      this.db.run("BEGIN TRANSACTION;");
      const stmt = this.db.prepare(
        "INSERT INTO production_data (year, month, grade, batches) VALUES (?, ?, ?, ?)",
      );
      dataArray.forEach((row) =>
        stmt.run(row.year, row.month, row.grade, row.batches),
      );
      stmt.finalize();
      this.db.run("COMMIT;");
    });
  }

  private insertDefIntoGroupsDatabase(dataArray: any[]) {
    this.db.serialize(() => {
      this.db.run("BEGIN TRANSACTION;");
      const stmt = this.db.prepare(
        "INSERT INTO groups_data (grade, group_name) VALUES (?, ?)",
      );
      dataArray.forEach((row) => stmt.run(row.grade, row.groupName));
      stmt.finalize();
      this.db.run("COMMIT;");
    });
  }

  private initDatabase() {
    try {
      const recordsProduction = this.parseCsv(initialProductionData);
      const productionDataArray = recordsProduction.map((row) => ({
        year: parseInt(row.Year),
        month: parseInt(row.Month),
        grade: row.Grade,
        batches: parseInt(row.Batches),
      }));
      this.insertDefIntoProductionDatabase(productionDataArray);
      console.log("Inserted into DB:", productionDataArray.length, "records");

      const recordsGroups = this.parseCsv(initialGroupsData);
      const groupsDataArray = recordsGroups.map((row) => ({
        grade: row.Grade,
        groupName: row.Group,
      }));
      this.insertDefIntoGroupsDatabase(groupsDataArray);
      console.log("Inserted into the DB:", groupsDataArray.length, "records");
    } catch (error) {
      console.error("Error parsing CSV:", error);
    }
  }

  private processGroupCsv(file: any): [string, string][] {
    const csvData = file.buffer.toString("utf8");
    const records: any[] = this.parseCsv(csvData);
    const processedData: { [key: string]: string } = {};
    for (const r of records) {
      if (r.Grade && r.Group) {
        processedData[r.Grade] = r.Group;
      }
    }
    const processedDataArr = Object.entries(processedData);
    return processedDataArr;
  }

  private upsertGroups(data: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run("BEGIN TRANSACTION;");
        const stmt = this.db.prepare(
          `INSERT INTO groups_data (grade, group_name)
           VALUES (?, ?)
           ON CONFLICT(grade) DO UPDATE SET group_name = excluded.group_name;`,
        );
        for (const [grade, groupName] of data) stmt.run(grade, groupName);
        stmt.finalize((err) => {
          const command = err ? "ROLLBACK;" : "COMMIT;";
          this.db.run(command, (runErr) => {
            if (err || runErr) {
              reject(err || runErr);
            } else {
              console.log("Upserted into the db:", data.length, "ele");
              resolve();
            }
          });
        });
      });
    });
  }

  private upsertProductionData(data: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        console.log(data);
        resolve();
        this.db.run("BEGIN TRANSACTION;");
        const stmt = this.db.prepare(
          `INSERT INTO production_data (year, month, grade, batches)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(year, month, grade) DO UPDATE SET batches = excluded.batches;`,
        );
        for (const [year, month, grade, batches] of data) {
          stmt.run(year, month, grade, batches);
        }
        stmt.finalize((err) => {
          const command = err ? "ROLLBACK;" : "COMMIT;";
          this.db.run(command, (runErr) => {
            if (err || runErr) {
              reject(err || runErr);
            } else {
              console.log("Upserted into the db:", data.length, "ele");
              resolve();
            }
          });
        });
      });
    });
  }

  getHello(): string {
    return "NestJs API. Go to /api/v0/ pls.";
  }

  getProdDataWithGroups(): Promise<any[]> {
    const sql = `
      SELECT
          pd.year, pd.month, gd.group_name, pd.grade, pd.batches
      FROM
          production_data pd
      INNER JOIN
          groups_data gd ON pd.grade = gd.grade;
    `;
    return new Promise((resolve, reject) => {
      this.db.all(sql, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  uploadProdDataT2(file: any): Promise<any> {
    return new Promise((resolve) => {
      const csvData = file.buffer.toString("utf8");
      const r: any[] = this.parseCsv(csvData);

      const conv = (n: string) => Math.ceil(parseInt(n) / 100);
      const grs: any[] = r.map((e) => [e["Grade"], e["Quality group"]]);
      const prs: any[] = r.map((e) => [e.Year, e.Month, e.Grade, conv(e.Tons)]);

      Promise.all([
        this.upsertGroups(grs),
        this.upsertProductionData(prs),
      ]).then(() => {
        resolve({ response: "OK" });
      });
    });
  }

  getProdData(): Promise<any[]> {
    const sql = `SELECT * FROM production_data;`;
    return new Promise((resolve, reject) => {
      this.db.all(sql, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  uploadGroups(file: any): Promise<any> {
    return new Promise((res) => {
      const processedData = this.processGroupCsv(file);
      this.upsertGroups(processedData).then(() => res({ response: "OK" }));
    });
  }

  getGroupsData(): Promise<any[]> {
    const sql = `SELECT * FROM groups_data;`;
    return new Promise((resolve, reject) => {
      this.db.all(sql, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  listTables(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT name FROM sqlite_master WHERE type='table';",
        (err, rows: { name: string }[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map((row) => row.name));
          }
        },
      );
    });
  }
}
